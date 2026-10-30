import assert from "node:assert/strict";
import test from "node:test";
import { initialStudioState, studioReducer } from "../app/studio/studio-state.ts";
import { AnimationScheduler, MAX_STEP } from "../app/studio/world/sim/scheduler.ts";
import { pickTier, shouldDowngrade, tierConfig, DOWNGRADE_WINDOW } from "../app/studio/world/sim/quality.ts";
import { ARRIVAL_SECONDS, GREET_AT, SUMMON_KANGAROO_AT, arrivalPose } from "../app/studio/world/sim/arrival.ts";
import { mulberry32 } from "../app/studio/world/sim/rng.ts";

test("arrival runs loading -> arrival -> intro -> explore and every stage can be skipped", () => {
  let state = studioReducer(initialStudioState, { type: "enter" });
  state = studioReducer(state, { type: "ready" });
  assert.equal(state.mode, "arrival");
  assert.equal(studioReducer(state, { type: "arrive" }).mode, "intro");
  assert.equal(studioReducer(state, { type: "skip" }).mode, "explore");
  assert.equal(studioReducer(state, { type: "select", area: "services" }).mode, "explore");
  assert.equal(studioReducer(state, { type: "manual" }).mode, "explore");
  const intro = studioReducer(state, { type: "arrive" });
  assert.equal(studioReducer(intro, { type: "tour" }).tour, true);
  assert.equal(studioReducer({ ...intro, mode: "explore" }, { type: "arrive" }).mode, "explore", "late arrive cannot pull an explorer back");
});

test("back to entrance leaves a panel-free outside view that any room selection clears", () => {
  const explore = { ...initialStudioState, mode: "explore", panel: true, tour: true };
  const outside = studioReducer(explore, { type: "entrance" });
  assert.deepEqual([outside.outside, outside.panel, outside.tour, outside.manual], [true, false, false, false]);
  assert.equal(studioReducer(outside, { type: "select", area: "gallery" }).outside, false);
  assert.equal(studioReducer(outside, { type: "reset" }).outside, false);
});

test("arrival camera is continuous, bounded in time and ends on the reception welcome pose", () => {
  for (const portrait of [false, true]) {
    let previous = arrivalPose(0, portrait);
    for (let t = 0.05; t <= ARRIVAL_SECONDS; t += 0.05) {
      const pose = arrivalPose(t, portrait);
      const step = Math.hypot(...pose.position.map((v, i) => v - previous.position[i]));
      assert.ok(step < 1.2, `jump ${step.toFixed(2)} m at ${t}s (portrait=${portrait})`);
      assert.ok(pose.position[1] > 1.4 && pose.position[1] < 3, "stays at human or low establishing height");
      previous = pose;
    }
    assert.deepEqual(arrivalPose(99, portrait).position, arrivalPose(ARRIVAL_SECONDS, portrait).position);
  }
  const end = arrivalPose(ARRIVAL_SECONDS, true);
  assert.deepEqual(end.position.map((v) => +v.toFixed(2)), [-.5, 1.8, 8.2]);
  assert.ok(SUMMON_KANGAROO_AT < 3 && GREET_AT < ARRIVAL_SECONDS && ARRIVAL_SECONDS <= 15, "purposeful, not long");
});

test("scheduler bounds delta, throttles slow systems, rests when idle and wakes on input", () => {
  const scheduler = new AnimationScheduler(1000);
  const fast = [], slow = [];
  scheduler.add("fast", (dt) => fast.push(dt));
  scheduler.add("slow", (dt) => slow.push(dt), 0.1);
  scheduler.poke(0);
  scheduler.step(16);
  scheduler.step(5000 - 4100); // a long stall must be clamped
  assert.ok(Math.max(...fast) <= MAX_STEP + 1e-9);
  for (let now = 950; now < 1200; now += 16) scheduler.step(now);
  assert.equal(scheduler.step(2500), false, "rests after the idle window");
  const count = fast.length;
  assert.equal(scheduler.step(2600), false);
  assert.equal(fast.length, count);
  assert.equal(scheduler.poke(2700), true, "wake reports it was resting");
  assert.equal(scheduler.step(2716), true);
  assert.ok(fast.length > count);
  scheduler.paused = true;
  assert.equal(scheduler.step(2740), false);
});

test("quality tier follows measured capability, not width, and degrades one way", () => {
  assert.equal(pickTier({ saveData: true, cores: 16, memoryGb: 16 }), "low");
  assert.equal(pickTier({ cores: 12, memoryGb: 16, maxTexture: 16384, medianFrameMs: 8 }), "high");
  assert.equal(pickTier({ cores: 8, memoryGb: 4, coarsePointer: true, maxTexture: 8192 }), "medium");
  assert.equal(pickTier({ cores: 4, memoryGb: 2, coarsePointer: true, medianFrameMs: 30 }), "low");
  assert.ok(tierConfig.low.cars < tierConfig.medium.cars && tierConfig.medium.cars < tierConfig.high.cars);
  assert.equal(tierConfig.low.walkingStaff, false);
  const slow = Array(DOWNGRADE_WINDOW).fill(55);
  const first = shouldDowngrade(false, slow);
  assert.deepEqual([first.slow, first.downgrade], [true, false]);
  assert.equal(shouldDowngrade(true, slow).downgrade, true);
  assert.equal(shouldDowngrade(true, Array(DOWNGRADE_WINDOW).fill(16)).downgrade, false);
});

test("seeded random is reproducible", () => {
  const a = mulberry32(7), b = mulberry32(7);
  assert.deepEqual([a(), a(), a()], [b(), b(), b()]);
});
