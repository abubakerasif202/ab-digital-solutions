import assert from "node:assert/strict";
import test from "node:test";
import { createGreetingCue, createReceptionist, GREET_EASE_IN } from "../app/studio/world/sim/receptionist-behavior.ts";
import { landmarks, POSE_KEYS } from "../app/studio/world/sim/humanoid-pose.ts";

const run = (sim, seconds, greeting, dt = 1 / 30, each) => {
  for (let t = 0; t < seconds; t += dt) { sim.step(dt, greeting); if (each) each(sim, t); }
};

test("remaining in reception welcomes once then returns to work; returning welcomes again", () => {
  const cue = createGreetingCue();
  const sim = createReceptionist(21);
  let typedAfterWelcome = false;
  for (let i = 0; i < 1200; i++) {
    sim.step(1 / 30, cue(1 / 30, true));
    if (i > 300 && sim.greetBlend === 0 && sim.typingGain > .8) typedAfterWelcome = true;
  }
  assert.equal(sim.waveCount, 1);
  assert.ok(typedAfterWelcome);
  sim.step(1 / 30, cue(1 / 30, false));
  for (let i = 0; i < 120; i++) sim.step(1 / 30, cue(1 / 30, true));
  assert.equal(sim.waveCount, 2);
});

test("receptionist is deterministic for a seed and varies between seeds", () => {
  const trace = (seed) => {
    const sim = createReceptionist(seed);
    const out = [];
    for (let i = 0; i < 900; i++) { sim.step(1 / 30, i > 400 && i < 700); if (i % 30 === 0) out.push(POSE_KEYS.map((k) => sim.pose[k].toFixed(5)).join(",")); }
    return out.join("|");
  };
  assert.equal(trace(7), trace(7));
  assert.notEqual(trace(7), trace(8));
});

test("receptionist poses stay finite and bounded for any dt up to and beyond 0.1 s", () => {
  const sim = createReceptionist(3);
  let seed = 11;
  const rnd = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
  for (let i = 0; i < 4000; i++) {
    sim.step(rnd() < 0.02 ? 5 : rnd() * 0.1, Math.floor(i / 400) % 2 === 1);
    for (const key of POSE_KEYS) {
      const v = sim.pose[key];
      assert.ok(Number.isFinite(v) && Math.abs(v) < 4, `${key}=${v}`);
    }
    assert.ok(sim.pose.blink >= 0 && sim.pose.blink <= 1.0001);
  }
});

test("typing keeps both hands over the keyboard in front of her torso", () => {
  const sim = createReceptionist(5);
  let typed = 0;
  run(sim, 40, false, 1 / 30, (s) => {
    if (s.mode === "typing" && s.typingGain > 0.8) {
      typed++;
      const lm = landmarks(s.pose);
      for (const side of ["l", "r"]) {
        const h = lm.hand[side];
        assert.ok(h[1] > 0.55 && h[1] < 0.85, `hand height ${h[1]}`);
        assert.ok(h[2] > 0.25 && h[2] < 0.55, `hand reach ${h[2]}`);
      }
    }
  });
  assert.ok(typed > 200, "she types for a good share of the time");
});

test("greeting eases in, waves exactly once per onset, and she returns to typing afterwards", () => {
  const sim = createReceptionist(21);
  run(sim, 6, false);
  assert.equal(sim.waveCount, 0);
  assert.equal(sim.greetBlend, 0);

  sim.step(1 / 60, true);
  assert.ok(sim.greetBlend > 0 && sim.greetBlend < 0.05, "no snap on the first frame");
  run(sim, GREET_EASE_IN / 2, true);
  assert.ok(sim.greetBlend > 0.3 && sim.greetBlend < 0.7, "mid-way through the ease");
  let peakWave = 0, smile = 0;
  run(sim, 8, true, 1 / 30, (s) => { peakWave = Math.max(peakWave, s.waveAmount); smile = s.pose.smile; });
  assert.equal(sim.waveCount, 1);
  assert.ok(peakWave > 0.9);
  assert.ok(smile > 0.85, "smiling while greeting");
  assert.equal(sim.waveAmount, 0, "wave settled back");
  run(sim, 6, true);
  assert.equal(sim.waveCount, 1, "no repeat during the same greeting");

  let backToTyping = false;
  run(sim, 25, false, 1 / 30, (s) => { if (s.greetBlend === 0 && s.mode === "typing" && s.typingGain > 0.8) backToTyping = true; });
  assert.ok(backToTyping);
  assert.ok(sim.pose.smile < 0.3);

  run(sim, 3, true);
  assert.equal(sim.waveCount, 2, "a new onset waves once more");
  run(sim, 2, false);
  assert.equal(sim.waveCount, 2);
});

test("a very short greeting does not count as a wave", () => {
  const sim = createReceptionist(2);
  run(sim, 2, false);
  run(sim, 0.2, true);
  run(sim, 5, false);
  assert.equal(sim.waveCount, 0);
});

test("wave raises her right hand (negative x when facing +z) above the shoulder line", () => {
  const sim = createReceptionist(4);
  let best = -1, hand;
  let shoulder;
  run(sim, 4, true, 1 / 30, (s) => {
    const lm = landmarks(s.pose);
    if (lm.hand.r[1] > best) { best = lm.hand.r[1]; hand = lm.hand.r; shoulder = lm.shoulder.r; }
  });
  assert.ok(hand[1] > shoulder[1] + 0.15, "hand clearly above shoulder");
  assert.ok(hand[0] < shoulder[0] - 0.05, "right hand is on the -x side");
  assert.ok(hand[2] > 0, "in front of the body");
});

test("greeting turns her gaze toward the visitor aim", () => {
  const sim = createReceptionist(9);
  for (let i = 0; i < 90; i++) sim.step(1 / 30, true, { yaw: 0.5, pitch: 0 });
  const lm = landmarks(sim.pose);
  assert.ok(lm.headForward[0] > 0.2, "faces toward +x");
});
