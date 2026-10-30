// Pure, deterministic pedestrian simulation. People follow waypoint polylines on the two footpaths;
// crossers wait at the kerb for the walk signal and only cross at the zebra. No three.js / React.
// Pedestrians are mutated in place; treat the array as read-only outside this file.
import { layout } from "../world-layout";
import { mulberry32, pick, range, type Rng } from "./rng";
import { signalAt } from "./signals";

export type PedState = "walk" | "idle" | "wait" | "cross";
export type Pedestrian = {
  id: number;
  active: boolean;
  state: PedState;
  x: number;
  z: number;
  heading: number; // rotation.y for a figure facing +x
  gait: number; // walk-cycle phase, radians
  motion: number; // 0 (still) .. 1 (full stride), smoothed
  speed: number;
  walkSpeed: number;
  scale: number;
  shirt: string;
  trousers: string;
  skin: string;
  respawnAt: number;
};
export type KangarooZone = { active: boolean; x: number; z: number; r: number };
export type PedestrianSim = { people: Pedestrian[]; step: (dt: number, time: number, kangaroo: KangarooZone) => void };

export const MAX_SUB = 0.05;
export const CROSS_SPEED = 1.4;
export const WORLD_X = 46; // people appear and vanish this far from the studio
export const SHIRTS = ["#792c40", "#bca06b", "#2c4766", "#e8e6df", "#2f4a3d", "#c9633f", "#5b5f66", "#d9b8a0", "#1b1f22", "#7b9aa8"] as const;
const TROUSERS = ["#22272a", "#2d3a52", "#4a4137", "#6b6258", "#1d2a2f", "#8a7f6c"] as const;
const SKINS = ["#f0c8a0", "#d9a577", "#b27a4d", "#8a5a3a", "#5e3b26", "#f4d7bb"] as const;

const KERB_WAIT = { near: layout.footpath.z1 - 0.4, far: layout.farFootpath.z0 + 0.4 };
const KANGAROO_MARGIN = 0.7;
const TURN_RATE = 4; // rad/s

type WpKind = "via" | "wait" | "landing" | "end";
type Wp = { x: number; z: number; kind: WpKind };
type Plan = Wp[];

const nearLane = (rng: Rng) => range(rng, layout.pedestrianLanes.z0, layout.pedestrianLanes.z1);
// Far walkers hug the shopfronts, leaving the kerb side to trees, the bus shelter and bins.
const farLane = (rng: Rng) => range(rng, layout.farFootpath.z0 + 1.6, layout.farFootpath.z1 - 0.5);
const side = (rng: Rng) => (rng() < 0.5 ? -1 : 1);

function makePlan(rng: Rng, onScreen: boolean): Plan {
  const roll = rng();
  const from = side(rng);
  const start = onScreen ? range(rng, -30, 30) : from * WORLD_X;
  const to = onScreen ? side(rng) * WORLD_X : -from * WORLD_X;
  const cx = layout.crossing.x + range(rng, -layout.crossing.width / 2 + 0.7, layout.crossing.width / 2 - 0.7);
  if (roll < 0.3) { const z = nearLane(rng); return [{ x: start, z, kind: "via" }, { x: to, z, kind: "end" }]; }
  if (roll < 0.55) { const z = farLane(rng); return [{ x: start, z, kind: "via" }, { x: to, z, kind: "end" }]; }
  const zEnd = roll < 0.78 ? nearLane(rng) : farLane(rng);
  const zStart = roll < 0.78 ? farLane(rng) : nearLane(rng);
  // Walk along the footpath to the zebra, cross, then continue on the other footpath.
  const [wait, land] = roll < 0.78 ? [KERB_WAIT.far, KERB_WAIT.near] : [KERB_WAIT.near, KERB_WAIT.far];
  return [
    { x: start, z: zStart, kind: "via" },
    { x: cx, z: zStart, kind: "via" },
    { x: cx, z: wait, kind: "wait" },
    { x: cx, z: land, kind: "landing" },
    { x: cx + (to > cx ? 1 : -1) * 1.5, z: zEnd, kind: "via" },
    { x: to, z: zEnd, kind: "end" },
  ];
}

export function groundHeight(z: number) {
  return z > layout.footpath.z1 - 0.02 && z < layout.farFootpath.z0 + 0.02 ? layout.road.y : layout.footpath.y;
}

export function createPedestrians({ seed, count }: { seed: number; count: number }): PedestrianSim {
  const rng: Rng = mulberry32(seed);
  const plans: Plan[] = [];
  const target: number[] = [];
  const idleIn: number[] = [];
  const idleLeft: number[] = [];
  const lookAt: number[] = [];

  const headingTo = (dx: number, dz: number) => Math.atan2(-dz, dx);
  const people: Pedestrian[] = Array.from({ length: count }, (_, id) => {
    plans.push([]); target.push(1); idleIn.push(range(rng, 4, 14)); idleLeft.push(0); lookAt.push(0);
    return {
      id, active: false, state: "walk" as PedState, x: 0, z: 0, heading: 0, gait: range(rng, 0, 6.28), motion: 0, speed: 0,
      walkSpeed: range(rng, 1.05, 1.55), scale: range(rng, 0.94, 1.06),
      shirt: pick(rng, SHIRTS), trousers: pick(rng, TROUSERS), skin: pick(rng, SKINS), respawnAt: 0,
    };
  });

  function spawn(p: Pedestrian, onScreen: boolean) {
    const plan = makePlan(rng, onScreen);
    plans[p.id] = plan; target[p.id] = 1;
    p.x = plan[0].x; p.z = plan[0].z; p.state = "walk"; p.active = true; p.speed = 0; p.motion = 0;
    p.walkSpeed = range(rng, 1.05, 1.55);
    p.heading = headingTo(plan[1].x - plan[0].x, plan[1].z - plan[0].z);
    idleIn[p.id] = range(rng, 5, 15);
  }
  for (const p of people) spawn(p, true);

  function substep(dt: number, time: number, k: KangarooZone) {
    const signal = signalAt(time);
    for (const p of people) {
      if (!p.active) {
        if (time >= p.respawnAt) spawn(p, false);
        continue;
      }
      const plan = plans[p.id];
      const wp = plan[target[p.id]];
      let want = 0; // desired speed this step
      let faceX = wp.x - p.x, faceZ = wp.z - p.z;
      if (p.state === "wait") {
        // Face the road; start only when the whole crossing fits inside walk + clearance.
        faceX = 0; faceZ = plan[target[p.id]].z - p.z;
        const crossTime = Math.abs(plan[target[p.id]].z - p.z) / CROSS_SPEED + 1;
        const clearOf = (x: number, z: number) => !k.active || Math.hypot(x - k.x, z - k.z) >= k.r + KANGAROO_MARGIN + 0.5;
        const kangarooNear = !clearOf(p.x, p.z) || !clearOf(wp.x, wp.z);
        if (signal.walk && signal.untilGreen >= crossTime && !kangarooNear) { p.state = "cross"; }
      } else if (p.state === "idle") {
        faceX = Math.cos(lookAt[p.id]); faceZ = -Math.sin(lookAt[p.id]);
        idleLeft[p.id] -= dt;
        if (idleLeft[p.id] <= 0) { p.state = "walk"; idleIn[p.id] = range(rng, 6, 16); }
      } else {
        want = p.state === "cross" ? CROSS_SPEED : p.walkSpeed;
        const dist = Math.hypot(wp.x - p.x, wp.z - p.z);
        if (p.state === "walk") {
          idleIn[p.id] -= dt;
          if (idleIn[p.id] <= 0 && dist > 2.5 && wp.kind !== "wait") {
            p.state = "idle"; idleLeft[p.id] = range(rng, 2, 5);
            // Glance at the street or the studio front.
            lookAt[p.id] = headingTo(0, rng() < 0.5 ? 1 : -1) + range(rng, -0.5, 0.5);
            want = 0;
          }
        }
        // Wait for the kangaroo to pass; once inside its zone just keep moving, gently.
        if (k.active && p.state !== "cross" && want > 0) {
          const now = Math.hypot(p.x - k.x, p.z - k.z);
          const next = Math.hypot(p.x + (faceX / (dist || 1)) * want * dt - k.x, p.z + (faceZ / (dist || 1)) * want * dt - k.z);
          if (now >= k.r) { if (next < k.r + KANGAROO_MARGIN && next < now) want = 0; } else want *= 0.45;
        }
        const step = Math.min(want * dt, dist);
        if (dist > 1e-6 && step > 0) { p.x += ((wp.x - p.x) / dist) * step; p.z += ((wp.z - p.z) / dist) * step; }
        if (step >= dist - 1e-9) {
          if (wp.kind === "end") { p.active = false; p.respawnAt = time + range(rng, 1, 8); p.motion = 0; continue; }
          if (wp.kind === "wait") p.state = "wait";
          else if (wp.kind === "landing") p.state = "walk";
          target[p.id]++;
        }
      }
      // Smooth speed/gait/heading.
      const sp = want > 0 ? want : 0;
      p.speed = sp;
      p.motion += (Math.min(1, sp / 1.4) - p.motion) * Math.min(1, dt * 8);
      p.gait += sp * dt * 4.2;
      if (Math.hypot(faceX, faceZ) > 1e-6) {
        let diff = headingTo(faceX, faceZ) - p.heading;
        diff = Math.atan2(Math.sin(diff), Math.cos(diff));
        p.heading += Math.max(-TURN_RATE * dt, Math.min(TURN_RATE * dt, diff));
      }
    }
  }

  return {
    people,
    step(dt, time, kangaroo) {
      const n = Math.max(1, Math.ceil(dt / MAX_SUB));
      const sub = dt / n;
      for (let i = 0; i < n; i++) substep(sub, time - dt + (i + 1) * sub, kangaroo);
    },
  };
}
