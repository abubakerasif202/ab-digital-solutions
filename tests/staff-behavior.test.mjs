import assert from "node:assert/strict";
import test from "node:test";
import { createStaff, floorHeight, isClear, routePoints, STAFF_NODES, STAFF_OBSTACLES, STATIONS } from "../app/studio/world/sim/staff-behavior.ts";
import { landmarks, POSE_KEYS } from "../app/studio/world/sim/humanoid-pose.ts";

// Independent obstacle list transcribed from the scene (Spaces.tsx / Architecture.tsx), not from the module.
const R = (x0, z0, x1, z1) => ({ rect: [x0, z0, x1, z1] });
const C = (x, z, r) => ({ circle: [x, z, r] });
const SCENE = [
  R(-7.9, 3.35, -2.1, 4.65), // reception counter top slab 5.8 x 1.3
  R(-6.9, 2.4, -5.3, 3.45), // receptionist chair and workstation
  C(-7, 2.6, 0.06), C(-3, 2.6, 0.06), // brass arch posts
  C(-8.6, 5.9, 1.2), // bench
  ...[-8.7, -4.9, -1.1].map((x) => R(x - 0.5, -5.225, x + 0.5, -4.575)), // gallery post step plates
  ...[0, 1, 2, 3].map((i) => R(2.2 + i * 2.2 - 0.7, -5.1, 2.2 + i * 2.2 + 0.7, -3.7)), // plinths
  R(1.2, 0.25, 8.8, 0.35), // glass screens
  C(5.6, 4.3, 1.8), // table
  ...[0, 1, 2, 3].map((i) => C(5.6 + Math.sin((i * Math.PI) / 2) * 2.45, 4.3 + Math.cos((i * Math.PI) / 2) * 2.45, 0.55)),
  C(8.8, 6.8, 0.36), // plant
  R(-10.4, -1.5, -8.4, 0.3), // designer desk + chair
  C(9.7, -2.4, 0.3), C(10.9, -2.3, 0.5), // developer + review display
  ...[-10.5, 0, 10.5].flatMap((x) => [-7.8, 7.8].map((z) => C(x, z, 0.12))), // columns
];
const BODY = 0.25;
function hits(x, z, margin = BODY) {
  if (x < -10.95 + margin || x > 10.95 - margin || z < -8.45 + margin || z > 8.85 - margin) return "wall";
  for (const o of SCENE) {
    if (o.circle) { const [cx, cz, r] = o.circle; if (Math.hypot(x - cx, z - cz) < r + margin) return `circle ${cx},${cz}`; }
    else { const [x0, z0, x1, z1] = o.rect; if (x > x0 - margin && x < x1 + margin && z > z0 - margin && z < z1 + margin) return `rect ${x0},${z0}`; }
  }
  return null;
}
function lcg(seed) { let s = seed >>> 0; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }

test("every stop and every leg between stops is clear of every scene obstacle", () => {
  assert.ok(STAFF_NODES.length >= 6);
  for (const a of STAFF_NODES) {
    assert.equal(hits(...a.stand), null, `${a.id} stand`);
    for (const b of STAFF_NODES) {
      if (a === b) continue;
      const pts = routePoints(a, b);
      for (let i = 1; i < pts.length; i++) {
        const [x0, z0] = pts[i - 1], [x1, z1] = pts[i];
        const n = Math.ceil(Math.hypot(x1 - x0, z1 - z0) / 0.02);
        for (let k = 0; k <= n; k++) {
          const x = x0 + ((x1 - x0) * k) / n, z = z0 + ((z1 - z0) * k) / n;
          assert.equal(hits(x, z), null, `${a.id}->${b.id} at ${x.toFixed(2)},${z.toFixed(2)}`);
        }
      }
    }
  }
  // The module's own obstacle list also protects the same points with its stated margin.
  for (const a of STAFF_NODES) assert.ok(isClear(a.stand[0], a.stand[1]), `${a.id} clear in module`);
  assert.ok(STAFF_OBSTACLES.length > 15);
});

test("floor height follows the real platforms", () => {
  assert.equal(floorHeight(0, -0.5), 0.04);
  assert.equal(floorHeight(-5, 2), 0.12);
  assert.equal(floorHeight(-5, -4), 0.24);
});

test("walker never intersects an obstacle over 10 simulated minutes, dwells much of the time and visits varied stops", () => {
  for (const seed of [1, 2, 3, 4]) {
    const sim = createStaff(seed);
    const rnd = lcg(seed * 31);
    let prev = sim.walkerPos, t = 0;
    const nodes = new Set();
    let dwellRun = 0, walkLegs = 0, wasWalking = false;
    const dwells = [];
    while (t < 600) {
      const dt = 0.005 + rnd() * 0.095;
      sim.step(dt, { walking: true });
      t += dt;
      const [x, z] = sim.walkerPos;
      assert.equal(hits(x, z), null, `seed ${seed} t=${t.toFixed(1)} at ${x.toFixed(2)},${z.toFixed(2)}`);
      assert.ok(Math.hypot(x - prev[0], z - prev[1]) <= 1.2 * (dt + 1 / 60) + 1e-6, "no teleporting");
      prev = [x, z];
      nodes.add(sim.walkerNode);
      const walking = sim.walkerMode === "walk";
      if (walking && !wasWalking) { walkLegs++; if (dwellRun > 0) dwells.push(dwellRun); dwellRun = 0; }
      if (!walking) dwellRun += dt;
      wasWalking = walking;
    }
    const { walkTime, dwellTime } = sim.stats;
    assert.ok(dwellTime / (walkTime + dwellTime) > 0.55, `seed ${seed} dwell fraction ${dwellTime / (walkTime + dwellTime)}`);
    assert.ok(walkLegs >= 6 && walkLegs <= 70, `legs ${walkLegs}`);
    assert.ok(nodes.size >= 5, `distinct stops ${[...nodes]}`);
    assert.ok(dwells.length > 4 && Math.min(...dwells) >= 6, `shortest dwell ${Math.min(...dwells)}`);
  }
});

test("the walker chats with the developer, who turns to face her and then back to his display", () => {
  const angleTo = (sim) => {
    const [x, z] = sim.walkerPos;
    return Math.atan2(x - STATIONS.developer.x, z - STATIONS.developer.z);
  };
  const diff = (a, b) => Math.abs(Math.atan2(Math.sin(a - b), Math.cos(a - b)));
  let chats = 0;
  for (const seed of [5, 6, 7, 8]) {
    const sim = createStaff(seed);
    let wasChat = false, facedHer = 0, returned = false;
    for (let t = 0; t < 900; t += 1 / 30) {
      sim.step(1 / 30, { walking: true });
      if (sim.chatting) {
        if (!wasChat) chats++;
        wasChat = true;
        if (diff(sim.developer.rootYaw, angleTo(sim)) < 0.5) facedHer++;
      } else if (wasChat && diff(sim.developer.rootYaw, STATIONS.developer.yaw) < 0.3) { returned = true; wasChat = false; }
    }
    if (chats > 0) { assert.ok(facedHer > 30, "developer turns toward her"); assert.ok(returned, "and back to his display"); }
  }
  assert.ok(chats >= 3, `chats ${chats}`);
});

test("with walking disabled she holds a fixed station and keeps performing idle behaviours", () => {
  const sim = createStaff(3);
  const start = sim.walkerPos;
  const seen = new Set();
  for (let t = 0; t < 180; t += 1 / 30) {
    sim.step(1 / 30, { walking: false });
    assert.equal(sim.walkerMode, "dwell");
    assert.deepEqual(sim.walkerPos, start);
    seen.add(`${sim.walker.rShoulderPitch.toFixed(1)}|${sim.walker.lShoulderPitch.toFixed(1)}|${sim.walker.headYaw.toFixed(1)}`);
  }
  assert.ok(seen.size > 8, "idle behaviours change her pose");
  assert.ok(sim.stops[sim.walkerNode] > 3);
});

test("staff are deterministic for a seed", () => {
  const trace = (seed) => {
    const sim = createStaff(seed);
    const out = [];
    for (let i = 0; i < 1800; i++) { sim.step(1 / 30, { walking: true }); if (i % 60 === 0) out.push([sim.walker.rootX, sim.walker.rootZ, sim.designer.rShoulderPitch, sim.developer.headYaw].map((v) => v.toFixed(5)).join(",")); }
    return out.join("|");
  };
  assert.equal(trace(9), trace(9));
  assert.notEqual(trace(9), trace(10));
});

test("poses stay finite and bounded for dt up to 0.1 s and bad frames", () => {
  const sim = createStaff(11);
  const rnd = lcg(5);
  for (let i = 0; i < 20000; i++) {
    sim.step(rnd() < 0.01 ? 3 : rnd() * 0.1, { walking: rnd() > 0.01, visitor: { x: 3, z: 20 } });
    for (const pose of [sim.designer, sim.developer, sim.walker]) for (const key of POSE_KEYS) assert.ok(Number.isFinite(pose[key]) && Math.abs(pose[key]) < 60, key);
  }
});

test("designer sits with hands at the keyboard and thighs below the desk top; walker's feet stay on the floor", () => {
  const sim = createStaff(2);
  let typingFrames = 0, walkFrames = 0;
  for (let t = 0; t < 400; t += 1 / 30) {
    sim.step(1 / 30, { walking: true });
    const lm = landmarks(sim.designer);
    assert.ok(Math.min(lm.knee.l[1], lm.knee.r[1]) < 0.62, "knees clear the desk top");
    assert.ok(Math.min(lm.sole.l, lm.sole.r) > -0.02, "designer feet above floor");
    if (sim.designer.lElbow > 1.2 && Math.abs(sim.designer.lShoulderPitch - 0.3) < 0.01) { typingFrames++; assert.ok(lm.hand.l[2] > 0.2 && lm.hand.l[1] < 0.9); }
    if (sim.walkerMode === "walk") { walkFrames++; const w = landmarks(sim.walker); assert.ok(Math.min(w.sole.l, w.sole.r) > -0.03, `walker foot sinks ${Math.min(w.sole.l, w.sole.r)}`); }
  }
  assert.ok(typingFrames > 100 && walkFrames > 100);
});
