import assert from "node:assert/strict";
import test from "node:test";
import { layout } from "../app/studio/world/world-layout.ts";
import { signalAt } from "../app/studio/world/sim/signals.ts";
import { createPedestrians } from "../app/studio/world/sim/pedestrians.ts";

const none = { active: false, x: 6, z: 11.5, r: 1.7 };
const x0 = layout.crossing.x - layout.crossing.width / 2;
const x1 = layout.crossing.x + layout.crossing.width / 2;

function run(options, seconds, dt, visit, kangaroo = () => none) {
  const sim = createPedestrians(options);
  let time = 0;
  for (let n = 0; n < Math.round(seconds / dt); n++) {
    time += dt;
    sim.step(dt, time, kangaroo(time));
    visit?.(sim, time);
  }
  return sim;
}
const snapshot = (sim) => sim.people.map((p) => [p.state, +p.x.toFixed(6), +p.z.toFixed(6), p.shirt]);

test("pedestrians are deterministic for a seed", () => {
  assert.deepEqual(snapshot(run({ seed: 4, count: 12 }, 90, 0.05)), snapshot(run({ seed: 4, count: 12 }, 90, 0.05)));
  assert.notDeepEqual(snapshot(run({ seed: 4, count: 12 }, 90, 0.05)), snapshot(run({ seed: 5, count: 12 }, 90, 0.05)));
});

for (const dt of [0.016, 0.05, 0.1]) {
  test(`pedestrians stay on footpaths and use the zebra only on walk (dt ${dt})`, () => {
    const previous = new Map();
    let crossings = 0;
    let waited = 0;
    run({ seed: 6, count: 12 }, 300, dt, (sim, time) => {
      const signal = signalAt(time);
      for (const p of sim.people) {
        if (!p.active) { previous.delete(p.id); continue; }
        assert.ok(Number.isFinite(p.x) && Number.isFinite(p.z));
        assert.ok(p.z >= layout.pedestrianLanes.z0 - 1e-6, `p${p.id} reached the facade side: z=${p.z}`);
        assert.ok(p.z <= layout.farFootpath.z1 + 1e-6, `p${p.id} beyond far footpath: z=${p.z}`);
        const inRoad = p.z > layout.road.z0 + 1e-6 && p.z < layout.road.z1 - 1e-6;
        if (inRoad) {
          assert.equal(p.state, "cross", "only crossers are ever in the road");
          assert.ok(p.x >= x0 && p.x <= x1, `p${p.id} left the zebra: x=${p.x}`);
          assert.equal(signal.vehicle, "red", `p${p.id} in the road while cars may move (t=${time.toFixed(1)})`);
        }
        if (p.state === "wait") waited++;
        const prev = previous.get(p.id);
        if (prev) {
          const entered = (prev.z <= layout.road.z0 && p.z > layout.road.z0) || (prev.z >= layout.road.z1 && p.z < layout.road.z1);
          if (entered) { assert.equal(signal.walk, true, `p${p.id} stepped off on don't-walk (t=${time.toFixed(1)})`); crossings++; }
        }
        previous.set(p.id, { z: p.z });
      }
    });
    assert.ok(crossings >= 8, `zebra crossings made: ${crossings}`);
    assert.ok(waited > 0, "crossers wait at the kerb");
  });
}

test("pedestrians swing their gait while moving and rest when idle or waiting", () => {
  let moving = 0, still = 0;
  const before = new Map();
  run({ seed: 8, count: 12 }, 200, 0.05, (sim) => {
    for (const p of sim.people) {
      const was = before.get(p.id);
      before.set(p.id, p.active ? p.state : undefined);
      if (!p.active) continue;
      if (p.state === "walk" && p.speed > 0.9) { moving++; assert.ok(p.motion >= 0 && p.motion <= 1.0001); }
      if ((p.state === "idle" || p.state === "wait") && was === p.state) { still++; assert.equal(p.speed, 0); }
    }
  });
  assert.ok(moving > 100 && still > 20);
});

test("pedestrians keep out of an active kangaroo zone and resume afterwards", () => {
  const kangaroo = (time) => ({ active: time >= 20 && time < 140, x: 6, z: 11.5, r: 1.7 });
  const outside = new Set();
  const exempt = new Set();
  let passedAfter = 0;
  run({ seed: 10, count: 12 }, 260, 0.05, (sim, time) => {
    const k = kangaroo(time);
    if (time < 20) return;
    if (Math.abs(time - 20) < 0.026) for (const p of sim.people) if (p.active && p.state === "cross") exempt.add(p.id);
    for (const p of sim.people) {
      if (!p.active) { outside.delete(p.id); continue; }
      const inside = Math.hypot(p.x - k.x, p.z - k.z) < k.r;
      if (k.active) {
        if (inside && outside.has(p.id) && !exempt.has(p.id)) assert.fail(`p${p.id} walked into the kangaroo zone at t=${time.toFixed(1)}`);
        if (!inside) outside.add(p.id); else outside.delete(p.id);
      } else if (time > 150 && inside) passedAfter++;
    }
  }, kangaroo);
  assert.ok(passedAfter > 0, "people walk through the spot again once the kangaroo leaves");
});
