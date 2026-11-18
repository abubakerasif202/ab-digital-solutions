import assert from "node:assert/strict";
import test from "node:test";
import { cameraFov, cameraProgress, cameraFieldOfView, facadeWaypoint, panelFrameOffset } from "../app/studio/scene/camera-motion.ts";

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

test("lens follows the same wall-clock curve at any frame rate", () => {
  assert.equal(cameraFov(58, 42, 0), 58);
  assert.equal(cameraFov(58, 42, .5), 50);
  assert.equal(cameraFov(58, 42, 1), 42);
  assert.ok(58 - cameraFov(58, 42, .01) < .001);
  assert.ok(cameraFov(58, 42, .99) - 42 < .001);
});

test("eye-level shots cross the facade through the doorway in either direction", () => {
  const inside = [-6, 2.1, 4];
  const outside = [4, 1.7, 14];
  assert.deepEqual(facadeWaypoint(inside, outside), [-.5, 1.9, 9]);
  assert.deepEqual(facadeWaypoint(outside, inside), [-.5, 1.9, 9]);
  assert.equal(facadeWaypoint(inside, [4, 2, 8]), null);
  assert.equal(facadeWaypoint(inside, [10, 8, 14]), null);
  assert.equal(facadeWaypoint([-.5, 1.9, 9], inside), null);
});
test("room framing measures the usable area beside the panel", () => {
  assert.equal(panelFrameOffset(390, true, false), 0);
  assert.equal(panelFrameOffset(768, false, false), 0);
  assert.equal(panelFrameOffset(844, true, true), 0);
  assert.ok(panelFrameOffset(768, true, false) > panelFrameOffset(1440, true, false));
});
test("portrait framing follows the device orientation, not the resized stage", () => {
  assert.equal(cameraFieldOfView(true, true), 80);
  assert.equal(cameraFieldOfView(true, false), 52);
  assert.equal(cameraFieldOfView(false, true), 42);
  assert.equal(cameraFieldOfView(false, false, true), 54);
});