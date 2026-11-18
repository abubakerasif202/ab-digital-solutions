import assert from "node:assert/strict";
import test from "node:test";
import { createReceptionist } from "../app/studio/world/sim/receptionist-behavior.ts";
import { createStaff } from "../app/studio/world/sim/staff-behavior.ts";
import { createResidentKangaroo } from "../app/studio/world/sim/resident-kangaroo.ts";
import { cockatooPose, koalaPose } from "../app/studio/world/sim/wildlife.ts";

test("receptionist nods once after the wave, then holds visitor gaze", () => {
  const sim = createReceptionist(21);
  let rises = 0;
  let wasNodding = false;
  let lastPitch = 0;
  for (let i = 0; i < 420; i++) {
    sim.step(1 / 60, true, { yaw: 0, pitch: 0 });
    if (i < 120) continue;
    assert.ok(Math.abs(sim.pose.headPitch - lastPitch) < 0.025);
    lastPitch = sim.pose.headPitch;
    const nodding = lastPitch > 0.03;
    if (nodding && !wasNodding) rises++;
    wasNodding = nodding;
  }
  assert.equal(rises, 1);
  assert.equal(sim.pose.headPitch, 0);
  assert.equal(sim.waveCount, 1);
});

test("studio chat has paired speaker turns, not two listeners or speakers responding at once", () => {
  const sim = createStaff(5);
  let developerSpeaks = false;
  let walkerSpeaks = false;
  let chatFrames = 0;
  for (let i = 0; i < 18000 && chatFrames < 290; i++) {
    sim.step(1 / 30, { walking: true });
    if (!sim.chatting) continue;
    chatFrames++;
    const walkerListens = sim.walker.brow > 0.12;
    const developerListens = sim.developer.brow > 0.12;
    assert.ok(!(walkerListens && developerListens));
    developerSpeaks ||= walkerListens;
    walkerSpeaks ||= developerListens;
  }
  assert.ok(developerSpeaks && walkerSpeaks);
});

test("resident kangaroo can sniff without crossing its standing footprint", () => {
  const sim = createResidentKangaroo(20261105);
  const start = [sim.x, sim.z];
  let peak = 0;
  for (let i = 0; i < 360; i++) {
    const pose = sim.step(1 / 60, { visitor: { x: sim.x, z: sim.z + 3 }, reduced: false });
    assert.deepEqual([pose.x, pose.z], start);
    assert.ok(pose.footClear < 0.01);
    peak = Math.max(peak, pose.headPitch);
  }
  assert.ok(peak > 0.16);
});

test("koala has lopsided sleepy peeks; cockatoo blinks without leaving the rail", () => {
  let peeked = false;
  let blinked = false;
  for (let i = 0; i < 1800; i++) {
    const t = i / 60;
    const koala = koalaPose(t, -1, 0);
    const bird = cockatooPose(t, -1);
    peeked ||= Math.abs(koala.eyeOpen - koala.rightEyeOpen) > 0.25;
    blinked ||= bird.eyeOpen < 0.3;
    assert.equal(koalaPose(t, -1, 0, true).rightEyeOpen, 0);
    assert.equal(cockatooPose(t, -1, true).eyeOpen, 1);
    assert.deepEqual([bird.dx, bird.dy, bird.dz], [0, 0, 0]);
  }
  assert.ok(peeked && blinked);
});
