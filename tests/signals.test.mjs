import assert from "node:assert/strict";
import test from "node:test";
import { CYCLE, mayProceed, pedestrianLamp, signalAt } from "../app/studio/world/sim/signals.ts";

test("signal cycle is periodic and deterministic", () => {
  for (let t = 0; t < CYCLE; t += 0.25) {
    assert.deepEqual(signalAt(t), signalAt(t + CYCLE * 3));
    assert.deepEqual(signalAt(t), signalAt(t));
  }
  assert.equal(signalAt(-1).t, CYCLE - 1);
});

test("phases run green, amber, all-red, walk, flashing, all-red in order", () => {
  const seen = [];
  for (let t = 0; t < CYCLE; t += 0.1) {
    const phase = signalAt(t).phase;
    if (seen.at(-1) !== phase) seen.push(phase);
  }
  assert.deepEqual(seen, ["green", "amber", "clear", "walk", "flash", "hold"]);
});

test("walk never overlaps vehicle green or amber, with all-red on both sides", () => {
  let walkSeconds = 0;
  for (let t = 0; t < CYCLE; t += 0.05) {
    const s = signalAt(t);
    if (s.walk || s.flashing) assert.equal(s.vehicle, "red");
    if (s.walk) walkSeconds += 0.05;
  }
  assert.ok(walkSeconds > 4.5);
  assert.equal(signalAt(CYCLE - 0.01).vehicle, "red");
  assert.equal(signalAt(CYCLE - 0.01).walk, false);
  assert.equal(signalAt(0.01).vehicle, "green");
  assert.equal(pedestrianLamp(13), "walk");
  assert.equal(pedestrianLamp(1), "dont");
});

test("vehicles proceed on green, hold on red, and only run amber when they cannot stop", () => {
  assert.equal(mayProceed(2, 20, 12), true);
  assert.equal(mayProceed(13, 20, 12), false);
  assert.equal(mayProceed(13, -1, 12), true); // already over the line
  // Early amber: a fast car close to the line goes, a car far back stops.
  assert.equal(mayProceed(8.1, 15, 12), true);
  assert.equal(mayProceed(8.1, 60, 12), false);
  // Slow car close to the line can stop comfortably.
  assert.equal(mayProceed(8.1, 6, 4), false);
});
