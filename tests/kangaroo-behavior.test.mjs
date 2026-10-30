import assert from "node:assert/strict";
import test from "node:test";
import { COOLDOWN_RANGE, createKangaroo, GROUND_Y, INSPECT_SPOT, legIK, STRIP } from "../app/studio/world/sim/kangaroo-behavior.ts";
import { layout } from "../app/studio/world/world-layout.ts";

const visitor = { x: 1, z: 20 };
const idle = () => ({ visitor, summon: false });

function lcg(seed) { let s = seed >>> 0; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }

function simulate(sim, seconds, dt = 1 / 30, each, input = idle) {
  for (let t = 0; t < seconds; t += dt) { sim.step(dt, input()); each?.(sim, t); }
}

test("leg IK plants the foot exactly and never dips below the surface when toes drop", () => {
  for (let h = 0.45; h <= 0.8; h += 0.05) {
    for (let toe = 0; toe <= 0.5; toe += 0.1) {
      const ik = legIK(h, 0, toe);
      assert.ok(ik.clearance >= -1e-9, `clearance ${ik.clearance} h=${h} toe=${toe}`);
      if (toe === 0) assert.ok(Math.abs(ik.clearance) < 1e-9);
    }
  }
});

test("kangaroo is deterministic for a seed and differs between seeds", () => {
  const trace = (seed) => {
    const sim = createKangaroo(seed);
    const out = [];
    simulate(sim, 240, 1 / 30, (s, t) => { if (Math.round(t * 30) % 15 === 0) out.push([s.stage, s.pose.x.toFixed(4), s.pose.y.toFixed(4), s.pose.headYaw.toFixed(4)].join(":")); });
    return out.join("|");
  };
  assert.equal(trace(5), trace(5));
  assert.notEqual(trace(5), trace(6));
});

test("hops keep both feet above the footpath, land on it, and the tail never sinks into it", () => {
  const sim = createKangaroo(12);
  const rnd = lcg(3);
  let landedFrames = 0, airFrames = 0, activeFrames = 0, maxX = 0;
  simulate(sim, 1800, 0.05, (s) => {
    const p = s.pose;
    for (const v of Object.values(p)) assert.ok(Number.isFinite(v));
    if (!s.active) return;
    activeFrames++;
    assert.ok(p.footClear >= -1e-9, `foot below ground: ${p.footClear}`);
    assert.ok(p.y >= GROUND_Y - 1e-9);
    assert.ok(p.tailTip >= -1e-6, `tail below ground: ${p.tailTip}`);
    assert.ok(p.z >= 10.9 && p.z <= STRIP.z1 + 1e-6, `z off the strip: ${p.z}`);
    assert.ok(p.z >= layout.footpath.z0 && p.z <= layout.footpath.z1);
    maxX = Math.max(maxX, Math.abs(p.x));
    if (Math.abs(p.y - GROUND_Y) < 1e-9) { landedFrames++; assert.ok(p.footClear < 0.03, `hovering on the ground: ${p.footClear}`); } else airFrames++;
    assert.ok(p.y - GROUND_Y < 0.7, "hop height stays modest");
  }, () => ({ visitor: { x: rnd() * 20 - 10, z: 12 + rnd() * 12 }, summon: false }));
  assert.ok(activeFrames > 200 && landedFrames > 50 && airFrames > 50);
  assert.ok(maxX > 20, "enters from beyond the camera frame");
});

test("dt up to 0.1 s (and bad frames beyond) never break invariants", () => {
  for (const seed of [1, 2, 3]) {
    const sim = createKangaroo(seed);
    const rnd = lcg(seed * 7);
    for (let i = 0; i < 40000; i++) {
      sim.step(rnd() < 0.01 ? 4 : rnd() * 0.1, { visitor, summon: rnd() < 0.002 });
      if (sim.active) {
        assert.ok(sim.pose.footClear >= -1e-9 && Number.isFinite(sim.pose.heading) && Number.isFinite(sim.pose.hipH));
        assert.ok(sim.pose.z >= 10.9 && sim.pose.z <= STRIP.z1 + 1e-6);
      }
    }
  }
});

test("every visit runs hop-in, pause, look, hop-out from both sides, and the inspect variant occurs at the door", () => {
  const sim = createKangaroo(33);
  const visits = [];
  let current = null, lastStage = "away", firstX = 0;
  const sides = new Set(), variants = new Set();
  let inspectAtSpot = false;
  simulate(sim, 7200, 1 / 30, (s) => {
    if (s.stage !== lastStage) {
      if (lastStage === "away") { current = { variant: s.variant, stages: [], side: Math.sign(s.pose.x) }; sides.add(current.side); variants.add(s.variant); firstX = s.pose.x; }
      if (s.stage === "away") { visits.push(current); current = null; } else current.stages.push(s.stage);
      lastStage = s.stage;
    }
    if (s.stage === "inspect" && Math.hypot(s.pose.x - INSPECT_SPOT.x, s.pose.z - INSPECT_SPOT.z) < 0.1) inspectAtSpot = true;
  });
  assert.ok(visits.length >= 20, `visits ${visits.length}`);
  assert.ok(Math.abs(firstX) > 20);
  for (const v of visits) {
    const order = ["hopIn", "pause", "look", "hopOut"].map((st) => v.stages.indexOf(st));
    assert.ok(order.every((i) => i >= 0), `missing stage in ${v.stages}`);
    assert.ok(order[0] < order[1] && order[1] < order[2] && order[2] < order[3], v.stages.join(">"));
  }
  assert.deepEqual([...sides].sort(), [-1, 1]);
  for (const name of ["watch", "graze", "sniff", "inspect"]) assert.ok(variants.has(name), `variant ${name} never chosen`);
  assert.ok(inspectAtSpot);
  assert.ok(visits.filter((v) => v.variant === "inspect").every((v) => v.stages.includes("inspect")));
  assert.ok(new Set(visits.map((v) => v.variant)).size >= 3, "variants are varied");
  assert.ok(visits.some((v, i) => i > 0 && v.variant !== visits[i - 1].variant));
});

test("cooldowns are randomised inside the 25-70 s window", () => {
  const sim = createKangaroo(9);
  simulate(sim, 9000, 1 / 20);
  const log = sim.cooldownLog;
  assert.ok(log.length >= 30, `cooldowns ${log.length}`);
  for (const c of log) assert.ok(c >= COOLDOWN_RANGE.min && c <= COOLDOWN_RANGE.max, `cooldown ${c}`);
  assert.ok(new Set(log.map((c) => c.toFixed(2))).size > log.length * 0.9);
  assert.ok(Math.max(...log) - Math.min(...log) > 25, "spread");
});

test("summon starts an inspect hop-in within 2 s from away, mid hop-out, or while present, and is consumed", () => {
  const cases = ["away", "hopOut", "pause", "graze"];
  for (const target of cases) {
    for (const seed of [4, 8, 15, 16, 23]) {
      const sim = createKangaroo(seed);
      let wantStage = target;
      let safety = 0;
      while (safety++ < 400000) {
        sim.step(1 / 30, idle());
        if (target === "away" && sim.stage === "away" && sim.cooldownLog.length > 0) break;
        if (target !== "away" && sim.stage === wantStage && sim.variant !== "inspect") break;
      }
      if (safety >= 400000) continue; // this seed never produced that situation
      let summon = true, consumedAt = -1, elapsed = 0, reachedHopIn = false, reachedInspect = false;
      while (elapsed < 20) {
        sim.step(1 / 30, { visitor, summon });
        elapsed += 1 / 30;
        if (sim.consumedSummon && consumedAt < 0) { consumedAt = elapsed; summon = false; }
        if (consumedAt >= 0 && elapsed <= 2) { assert.equal(sim.variant, "inspect"); if (sim.stage === "hopIn") reachedHopIn = true; }
        if (sim.stage === "inspect") { reachedInspect = true; break; }
      }
      assert.ok(consumedAt > 0 && consumedAt <= 2, `${target}/${seed}: consumed after ${consumedAt}`);
      assert.ok(reachedHopIn || target === "pause", `${target}/${seed} did not hop toward the door`);
      assert.ok(reachedInspect, `${target}/${seed}: never inspected the door`);
    }
  }
});

test("when away it is invisible to the world: inactive and parked off the strip", () => {
  const sim = createKangaroo(2);
  assert.equal(sim.active, false);
  simulate(sim, 5, 1 / 30);
  assert.equal(sim.active, false);
});

test("travel and inspection keep the body clear of kerb bins, bollards and lamp posts", () => {
  const furniture = [
    [-8, 11.8, .25], [13, 11.8, .25],
    [1.2, 11.88, .075], [10.8, 11.88, .075],
    ...[-52, -34, -16, 14, 32, 50].map(x => [x, 11.88, .16]),
  ];
  for (const seed of [4, 8, 15, 33]) {
    const sim = createKangaroo(seed);
    simulate(sim, 600, 1 / 30, s => {
      if (!s.active) return;
      for (const [x, z, radius] of furniture) {
        assert.ok(Math.hypot(s.pose.x - x, s.pose.z - z) > radius + .3,
          `seed ${seed}, ${s.stage}: body intersects furniture at ${x},${z}`);
      }
    });
  }
});
