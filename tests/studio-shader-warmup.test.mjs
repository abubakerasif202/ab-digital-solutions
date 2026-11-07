import assert from "node:assert/strict";
import test from "node:test";
import { compileStageShaders } from "../app/studio/scene/shader-warmup.ts";

function harness({ extension = true } = {}) {
  const frames = new Map();
  let id = 0, complete = false, disposed = false, lost = false, reads = 0;
  const program = {};
  const context = {
    getExtension: () => extension ? { COMPLETION_STATUS_KHR: 123 } : null,
    isContextLost: () => lost,
    isProgram: (value) => !disposed && value === program,
    getProgramParameter: () => { reads++; return complete; },
  };
  const root = {}, camera = {}, scene = {};
  const renderer = { compile: (...args) => assert.deepEqual(args, [root, camera, scene]), getContext: () => context, info: { programs: [{ program }] } };
  return {
    start: () => compileStageShaders(renderer, root, camera, scene, (fn) => { frames.set(++id, fn); return id; }, (key) => frames.delete(key)),
    frame: () => { const pending = [...frames.values()]; frames.clear(); pending.forEach((fn) => fn()); },
    finish: () => { complete = true; }, dispose: () => { disposed = true; }, lose: () => { lost = true; }, reads: () => reads,
  };
}
test("shader gate waits for actual KHR completion without blocking", async () => {
  const h = harness(), job = h.start();
  let ready = false; void job.ready.then(() => { ready = true; });
  h.frame(); await Promise.resolve(); assert.equal(ready, false);
  h.finish(); h.frame(); await job.ready; assert.equal(ready, true);
});
test("teardown cancels native status reads before disposed material polling", async () => {
  for (const beforeFirstPoll of [true, false]) {
    const h = harness(), job = h.start();
    if (!beforeFirstPoll) h.frame();
    const before = h.reads(); job.cancel(); h.dispose(); h.frame();
    await job.ready; assert.equal(h.reads(), before);
  }
});
test("active context loss and disposed programs reject through the caller", async () => {
  for (const action of ["lose", "dispose"]) {
    const h = harness(), job = h.start();
    const rejection = assert.rejects(job.ready, /context lost|program disposed/);
    h[action](); h.frame(); await rejection;
  }
});
test("absent parallel-shader support remains usable without blocking status queries", async () => {
  const h = harness({ extension: false }), job = h.start();
  h.frame(); await job.ready; assert.equal(h.reads(), 0);
});
