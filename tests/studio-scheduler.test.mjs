import assert from "node:assert/strict";
import test from "node:test";
import { AnimationScheduler, IDLE_PAUSE_MS } from "../app/studio/world/sim/scheduler.ts";

test("a suspended scene wakes its driver when animation systems mount", () => {
  const scheduler = new AnimationScheduler();
  let wakes = 0;
  const unsubscribe = scheduler.onWork(() => { wakes++; });
  assert.equal(scheduler.step(100), false, "an empty scene needs no frame");
  const remove = scheduler.add("loaded-system", () => {});
  assert.equal(wakes, 1);
  assert.equal(scheduler.step(120), true);
  remove();
  assert.equal(scheduler.size, 0);
  unsubscribe();
  scheduler.add("later-system", () => {});
  assert.equal(wakes, 1, "unmounted drivers must not be called");
});

test("throttled systems request a draw only on ticks that perform work", () => {
  const scheduler = new AnimationScheduler();
  let updates = 0;
  scheduler.add("screen", () => { updates++; }, 0.1);
  scheduler.poke(100);
  assert.equal(scheduler.step(100), false);
  assert.equal(scheduler.step(140), false);
  assert.equal(scheduler.step(180), false);
  assert.equal(scheduler.step(220), true);
  assert.equal(updates, 1);
  assert.equal(scheduler.isResting(220), false, "no draw does not mean the driver should stop");
  assert.equal(scheduler.step(240), false);
  scheduler.setPaused(true);
  assert.equal(scheduler.step(280), false);
  assert.equal(updates, 1);
});

test("quality restarts and system registration preserve the original idle deadline", () => {
  const scheduler = new AnimationScheduler();
  const entered = 100000; // a scene may be entered long after page load
  scheduler.initialize(entered);
  assert.equal(scheduler.isResting(entered), false);
  scheduler.add("traffic-high", () => {});
  assert.equal(scheduler.step(entered + 1000), true);
  // A slow GPU can downgrade late in the idle window. Reinitializing the driver
  // and registering replacement systems must not count as another interaction.
  scheduler.initialize(entered + 40000);
  scheduler.add("traffic-low", () => {});
  assert.equal(scheduler.step(entered + IDLE_PAUSE_MS + 1), false);
  scheduler.initialize(entered + IDLE_PAUSE_MS + 2000);
  scheduler.add("loaded-after-rest", () => {});
  assert.equal(scheduler.isResting(entered + IDLE_PAUSE_MS + 2000), true);
  assert.equal(scheduler.step(entered + IDLE_PAUSE_MS + 2016), false);
  scheduler.poke(entered + IDLE_PAUSE_MS + 3000);
  assert.equal(scheduler.step(entered + IDLE_PAUSE_MS + 3016), true, "actual input wakes motion");
});

test("visibility pause and resume retain idle timing and never override prior input", () => {
  const scheduler = new AnimationScheduler(1000);
  scheduler.poke(2000);
  scheduler.initialize(2400); // driver setup after input cannot replace that input's timestamp
  scheduler.setPaused(true);
  scheduler.initialize(2800);
  scheduler.setPaused(false);
  assert.equal(scheduler.isResting(2999), false, "remaining idle budget survives a short pause");
  assert.equal(scheduler.isResting(3001), true);
  scheduler.setPaused(true);
  scheduler.setPaused(false);
  scheduler.initialize(4000);
  assert.equal(scheduler.isResting(4000), true, "resuming a rested scene does not restart animation");
});
