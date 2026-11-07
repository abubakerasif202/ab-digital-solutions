import assert from "node:assert/strict";
import test from "node:test";
import { nextWarmupPhase, warmupPhases, prepareWarmupStage, scheduleWarmupAdvance, yieldToBrowser } from "../app/studio/scene/warmup.ts";

test("warmup separates world construction and keeps arrival after all visible systems", () => {
  assert.deepEqual(warmupPhases, ["core", "interior", "exterior", "traffic", "pedestrians", "wildlife", "staff", "done"]);
  for (let i = 0; i < warmupPhases.length - 1; i++) assert.equal(nextWarmupPhase(warmupPhases[i]), warmupPhases[i + 1]);
  assert.equal(nextWarmupPhase("done"), "done");
});
test("cooperative yielding uses native scheduler with its receiver", async () => {
  const scheduler = { async yield() { assert.equal(this, scheduler); } };
  await yieldToBrowser(scheduler);
});
test("cooperative yielding falls back to a later task", async () => {
  let finished = false;
  const yielded = yieldToBrowser().then(() => { finished = true; });
  assert.equal(finished, false);
  await yielded;
  assert.equal(finished, true);
});

function frameHarness() {
  let id = 0;
  const frames = new Map();
  return {
    requestFrame(callback) { frames.set(++id, callback); return id; },
    cancelFrame(key) { frames.delete(key); },
    frame() { const pending = [...frames.values()]; frames.clear(); pending.forEach((callback) => callback(0)); },
  };
}
test("a stage draws twice and yields before advancing", async () => {
  const frames = frameHarness();
  let advances = 0;
  let resolveYield;
  scheduleWarmupAdvance({ ...frames, advance: () => advances++, yieldTask: () => new Promise((resolve) => { resolveYield = resolve; }) });
  frames.frame(); assert.equal(advances, 0);
  frames.frame(); assert.equal(advances, 0);
  resolveYield(); await Promise.resolve();
  assert.equal(advances, 1);
});
test("unmount during a pending yield cannot advance or signal readiness", async () => {
  const frames = frameHarness();
  let advances = 0;
  let resolveYield;
  const cancel = scheduleWarmupAdvance({ ...frames, advance: () => advances++, yieldTask: () => new Promise((resolve) => { resolveYield = resolve; }) });
  frames.frame(); frames.frame(); cancel();
  resolveYield(); await Promise.resolve();
  assert.equal(advances, 0);
});
test("unmount cancels both animation frame callbacks", async () => {
  const frames = frameHarness();
  let advances = 0;
  const cancel = scheduleWarmupAdvance({ ...frames, advance: () => advances++ });
  frames.frame(); cancel(); frames.frame();
  await Promise.resolve(); assert.equal(advances, 0);
});

test("shader completion gates reveal and rendered-frame advancement", async () => {
  const frames = frameHarness();
  let finish;
  const pending = new Promise((resolve) => { finish = resolve; });
  const events = [];
  prepareWarmupStage({ ...frames, compile: () => pending, reveal: () => events.push("reveal"), advance: () => events.push("advance"), onFailure: () => assert.fail("unexpected failure"), yieldTask: async () => {} });
  await Promise.resolve(); frames.frame(); frames.frame();
  assert.deepEqual(events, []);
  finish(); await new Promise((resolve) => setImmediate(resolve));
  assert.deepEqual(events, ["reveal"]);
  frames.frame(); frames.frame(); await Promise.resolve();
  assert.deepEqual(events, ["reveal", "advance"]);
});

test("unmount during shader compilation cannot reveal or signal readiness", async () => {
  const frames = frameHarness();
  let finish;
  const pending = new Promise((resolve) => { finish = resolve; });
  const events = [];
  const cancel = prepareWarmupStage({ ...frames, compile: () => pending, reveal: () => events.push("reveal"), advance: () => events.push("advance"), onFailure: () => events.push("failure") });
  await Promise.resolve(); cancel(); finish();
  await new Promise((resolve) => setImmediate(resolve));
  frames.frame(); frames.frame();
  assert.deepEqual(events, []);
});

test("shader failure uses the existing scene failure path instead of readiness", async () => {
  const events = [];
  prepareWarmupStage({ compile: async () => { throw new Error("context lost"); }, reveal: () => events.push("reveal"), advance: () => events.push("advance"), onFailure: () => events.push("failure") });
  await new Promise((resolve) => setImmediate(resolve));
  assert.deepEqual(events, ["failure"]);
});
