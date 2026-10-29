import assert from "node:assert/strict";
import test from "node:test";
import { cameraProgress } from "../app/studio/scene/camera-motion.ts";

test("camera travel clamps late frames and never overshoots", () => {
  assert.equal(cameraProgress(-1), 0);
  assert.equal(cameraProgress(2), 1);
  let previous = 0;
  for (let frame = 0; frame <= 100; frame++) {
    const position = cameraProgress(frame / 100);
    assert.ok(position >= previous && position <= 1);
    previous = position;
  }
});
test("camera arrives and departs gently with symmetric timing", () => {
  assert.equal(cameraProgress(.5), .5);
  assert.ok(cameraProgress(.01) < .00002);
  assert.ok(1 - cameraProgress(.99) < .00002);
  assert.ok(Math.abs(cameraProgress(.25) + cameraProgress(.75) - 1) < 1e-12);
});
