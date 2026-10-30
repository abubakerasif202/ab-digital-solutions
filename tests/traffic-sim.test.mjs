import assert from "node:assert/strict";
import test from "node:test";
import { layout } from "../app/studio/world/world-layout.ts";
import { signalAt } from "../app/studio/world/sim/signals.ts";
import { ROUTE_END, createTraffic, routes } from "../app/studio/world/sim/traffic.ts";

const wrap = (a) => Math.atan2(Math.sin(a), Math.cos(a));

function corners(v) {
  const c = Math.cos(v.heading), s = Math.sin(v.heading);
  const fx = c, fz = -s; // forward in world
  const rx = s, rz = c; // right/side
  const hl = v.length / 2, hw = v.width / 2;
  return [[1, 1], [1, -1], [-1, -1], [-1, 1]].map(([a, b]) => [v.x + fx * hl * a + rx * hw * b, v.z + fz * hl * a + rz * hw * b]);
}
function overlaps(a, b) {
  const ca = corners(a), cb = corners(b);
  for (const poly of [ca, cb]) {
    for (let i = 0; i < 4; i++) {
      const [x0, z0] = poly[i], [x1, z1] = poly[(i + 1) % 4];
      const nx = z1 - z0, nz = -(x1 - x0);
      const proj = (pts) => pts.map(([x, z]) => x * nx + z * nz);
      const pa = proj(ca), pb = proj(cb);
      if (Math.max(...pa) < Math.min(...pb) || Math.max(...pb) < Math.min(...pa)) return false;
    }
  }
  return true;
}
function run(options, seconds, dt, visit) {
  const sim = createTraffic(options);
  let time = 0;
  for (let n = 0; n < Math.round(seconds / dt); n++) {
    time += dt;
    sim.step(dt, time);
    visit?.(sim, time);
  }
  return sim;
}
const snapshot = (sim) => sim.vehicles.map((v) => [v.route, v.active, +v.x.toFixed(6), +v.z.toFixed(6), +v.speed.toFixed(6)]);

test("traffic is deterministic for a seed and differs between seeds", () => {
  const a = run({ seed: 7, count: 10 }, 60, 0.05);
  const b = run({ seed: 7, count: 10 }, 60, 0.05);
  const c = run({ seed: 8, count: 10 }, 60, 0.05);
  assert.deepEqual(snapshot(a), snapshot(b));
  assert.notDeepEqual(snapshot(a), snapshot(c));
});

test("five simulated minutes: no overlaps, healthy gaps, finite state, lanes stay populated", () => {
  let minGap = Infinity;
  let maxActive = 0;
  const sim = run({ seed: 3, count: 10 }, 300, 0.1, (s) => {
    const live = s.vehicles.filter((v) => v.active);
    maxActive = Math.max(maxActive, live.length);
    for (const v of live) {
      assert.ok(Number.isFinite(v.x) && Number.isFinite(v.z) && v.speed >= 0 && v.speed < 16);
    }
    for (let i = 0; i < live.length; i++) for (let j = i + 1; j < live.length; j++) {
      const a = live[i], b = live[j];
      assert.equal(overlaps(a, b), false, `vehicles ${a.id} and ${b.id} overlap`);
      if (a.route === b.route && Math.abs(a.z - b.z) < 0.5) {
        const gap = Math.abs(a.x - b.x) - (a.length + b.length) / 2;
        minGap = Math.min(minGap, gap);
      }
    }
  });
  assert.ok(minGap > 0.4, `minimum bumper gap ${minGap}`);
  assert.ok(maxActive >= 8);
  assert.ok(sim.stats.entered >= 3, `side-street entries ${sim.stats.entered}`);
  assert.ok(sim.stats.exited >= 1, `side-street exits ${sim.stats.exited}`);
});

test("vehicles hold the stop line on red and never cross it after the lights change", () => {
  const front = new Map();
  let crossingsOnGreen = 0;
  run({ seed: 11, count: 10 }, 300, 0.1, (sim, time) => {
    const signal = signalAt(time);
    for (const v of sim.vehicles) {
      const route = routes[v.route];
      if (!v.active || route.stopS === null) continue;
      const f = v.s + v.length / 2;
      const key = v.id;
      const prev = front.get(key);
      front.set(key, { f, route: v.route });
      if (!prev || prev.route !== v.route) continue;
      if (prev.f < route.stopS && f >= route.stopS) {
        if (signal.vehicle === "red") assert.fail(`vehicle ${v.id} ran the red at t=${time.toFixed(1)}`);
        crossingsOnGreen++;
      }
    }
  });
  assert.ok(crossingsOnGreen > 5);
});

test("a stopped queue leader pulls away smoothly once the light turns green", () => {
  const held = new Map();
  let released = 0;
  let lastGreen = -1;
  run({ seed: 5, count: 10 }, 300, 0.1, (sim, time) => {
    const signal = signalAt(time);
    if (signal.vehicle === "green" && signal.t < 0.15) lastGreen = time;
    for (const v of sim.vehicles) {
      const route = routes[v.route];
      if (!v.active || route.stopS === null) continue;
      const d = route.stopS - (v.s + v.length / 2);
      if (signal.vehicle === "red" && v.speed < 0.05 && d > 0 && d < 3) held.set(v.id, time);
      const waited = held.get(v.id);
      if (waited !== undefined && lastGreen > waited && time - lastGreen > 5 && time - lastGreen < 6) {
        assert.ok(v.speed > 2 || d < 0, `vehicle ${v.id} did not move off after green`);
        held.delete(v.id);
        released++;
      }
    }
  });
  assert.ok(released >= 3, `queue releases observed: ${released}`);
});

test("vehicles drive on the left and turn with continuous heading", () => {
  const last = new Map();
  let maxStep = 0;
  let turned = 0;
  const dt = 0.1;
  run({ seed: 9, count: 10 }, 300, dt, (sim) => {
    for (const v of sim.vehicles) {
      if (!v.active) { last.delete(v.id); continue; }
      const p = last.get(v.id);
      if (p && p.route === v.route) {
        const step = Math.abs(wrap(v.heading - p.heading));
        maxStep = Math.max(maxStep, step);
        if (step > 0.002) turned++;
      }
      last.set(v.id, { heading: v.heading, route: v.route });
      const fx = Math.cos(v.heading);
      const onRoad = v.z > layout.road.z0 && v.z < layout.road.z1;
      if (onRoad && fx > 0.99) assert.ok(Math.abs(v.z - layout.lanes.plusX) < 0.05, "+x traffic uses the near lane");
      if (onRoad && fx < -0.99) assert.ok(Math.abs(v.z - layout.lanes.minusX) < 0.05, "-x traffic uses the far lane");
      assert.ok(v.z > layout.road.z0 + 1 || v.route === "enter" || v.route === "exit", "no one leaves the road");
    }
  });
  assert.ok(turned > 50, "turn manoeuvres were driven");
  assert.ok(maxStep < 0.12, `largest heading change per 0.1 s: ${maxStep}`);
  assert.ok(routes.east.length === ROUTE_END * 2);
});

test("vehicles never pass the street ends visibly and recycle", () => {
  let seenRecycled = false;
  run({ seed: 2, count: 4 }, 200, 0.05, (sim) => {
    for (const v of sim.vehicles) {
      if (!v.active && v.respawnAt > 0) seenRecycled = true;
      assert.ok(Math.abs(v.x) <= ROUTE_END + v.length);
    }
  });
  assert.ok(seenRecycled);
});

test("larger time steps keep invariants (dt 0.016 and 0.1)", () => {
  for (const dt of [0.016, 0.1]) {
    run({ seed: 21, count: 7 }, 120, dt, (sim) => {
      const live = sim.vehicles.filter((v) => v.active);
      for (let i = 0; i < live.length; i++) {
        assert.ok(live[i].speed >= 0 && Number.isFinite(live[i].s));
        for (let j = i + 1; j < live.length; j++) assert.equal(overlaps(live[i], live[j]), false);
      }
    });
  }
});
