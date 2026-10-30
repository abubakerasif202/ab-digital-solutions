// Pure behaviour for the three studio staff: a designer seated at a desk, a developer at a standing
// display, and a team member who walks a looped route with purposeful stops. Everything is seeded and
// dt-clamped; poses carry world placement (rootX/rootZ/rootLift/rootYaw). No three/React imports.
import { mulberry32, range, pick } from "./rng";
import type { Rng } from "./rng";
import {
  approach, aimHead, armToward, blendPose, clamp, createPose, lerp, poseReview, poseSeatedRest, poseSeatedTyping, poseStanding, poseWalk, smooth, wrapAngle,
} from "./humanoid-pose";
import type { Pose, Side } from "./humanoid-pose";

export const MAX_DT = 0.1;
export const BODY_MARGIN = 0.28; // metres of clearance the walker keeps from every obstacle edge
const STRIDE = 1.5; // metres travelled per full walk-cycle (left+right step), keeps feet from sliding
const SUBSTEP = 1 / 60;

export type Obstacle =
  | { kind: "rect"; id: string; x0: number; z0: number; x1: number; z1: number }
  | { kind: "circle"; id: string; x: number; z: number; r: number };
const rect = (id: string, x0: number, z0: number, x1: number, z1: number): Obstacle => ({ kind: "rect", id, x0, z0, x1, z1 });
const circle = (id: string, x: number, z: number, r: number): Obstacle => ({ kind: "circle", id, x, z, r });

export const STATIONS = {
  designer: { x: -9.3, z: -0.45, yaw: Math.PI - 0.25, floor: 0.04 },
  display: { x: 10.9, z: -2.3, normalYaw: -0.9, floor: 0.04 }, // standing review display; its screen faces normalYaw
  developer: { x: 9.7, z: -2.4, yaw: 1.52, floor: 0.04 },
} as const;

/** Furniture and fixtures a walking person must keep clear of (plan view, metres). */
export const STAFF_OBSTACLES: readonly Obstacle[] = [
  rect("reception-counter+workstation", -7.9, 2.3, -2.1, 4.65),
  circle("arch-post-l", -7, 2.6, 0.1), circle("arch-post-r", -3, 2.6, 0.1),
  circle("bench", -8.6, 5.9, 1.3),
  ...[-8.7, -4.9, -1.1].map((x, i) => rect(`gallery-post-${i}`, x - 0.55, -5.3, x + 0.55, -4.55)),
  ...[0, 1, 2, 3].map((i) => rect(`plinth-${i}`, 2.2 + i * 2.2 - 0.7, -4.4 - 0.7, 2.2 + i * 2.2 + 0.7, -4.4 + 0.7)),
  rect("glass-screens", 1.2, 0.2, 8.8, 0.4),
  circle("round-table", 5.6, 4.3, 1.9),
  ...[0, 1, 2, 3].map((i) => circle(`chair-${i}`, 5.6 + Math.sin((i * Math.PI) / 2) * 2.45, 4.3 + Math.cos((i * Math.PI) / 2) * 2.45, 0.7)),
  circle("plant", 8.8, 6.8, 0.45),
  rect("designer-desk+chair", -10.5, -1.6, -8.3, 0.4),
  circle("developer", STATIONS.developer.x, STATIONS.developer.z, 0.42),
  circle("review-display", STATIONS.display.x, STATIONS.display.z, 0.6),
  ...[-10.5, 0, 10.5].flatMap((x) => [-7.8, 7.8].map((z) => circle(`column-${x}-${z}`, x, z, 0.2))),
];
export const WALK_BOUNDS = { x0: -10.4, x1: 10.4, z0: -8.0, z1: 8.4 } as const;

export function isClear(x: number, z: number, margin = BODY_MARGIN, obstacles: readonly Obstacle[] = STAFF_OBSTACLES) {
  if (x < WALK_BOUNDS.x0 || x > WALK_BOUNDS.x1 || z < WALK_BOUNDS.z0 || z > WALK_BOUNDS.z1) return false;
  for (const o of obstacles) {
    if (o.kind === "circle") { if (Math.hypot(x - o.x, z - o.z) < o.r + margin) return false; }
    else if (x > o.x0 - margin && x < o.x1 + margin && z > o.z0 - margin && z < o.z1 + margin) return false;
  }
  return true;
}
/** Floor top at a point: aisle 0.04, reception platform 0.12, gallery platform 0.24. */
export function floorHeight(x: number, z: number) {
  if (x >= -10 && x <= 0 && z >= -7.15 && z <= -1.85) return 0.24;
  if (x >= -8.5 && x <= -1.5 && z >= 0.9 && z <= 5.9) return 0.12;
  return 0.04;
}

type Vec3 = [number, number, number];
export type StaffNode = { id: string; kind: "sculpture" | "gallery" | "service" | "chat"; stand: [number, number]; access: [number, number]; focus: Vec3; };
const SPINE_Z = -0.55;
export const STAFF_NODES: readonly StaffNode[] = [
  { id: "sculpture", kind: "sculpture", stand: [-4.9, 1.6], access: [-4.9, SPINE_Z], focus: [-5, 2.35, 3.1] },
  { id: "gallery-1", kind: "gallery", stand: [-7.7, -3.2], access: [-7.7, SPINE_Z], focus: [-8.7, 2.45, -5] },
  { id: "gallery-2", kind: "gallery", stand: [-4.9, -3.2], access: [-4.9, SPINE_Z], focus: [-4.9, 2.45, -5] },
  { id: "gallery-3", kind: "gallery", stand: [-1.1, -3.2], access: [-1.1, SPINE_Z], focus: [-1.1, 2.45, -5] },
  { id: "service-1", kind: "service", stand: [2.9, -2.4], access: [2.9, SPINE_Z], focus: [2.2, 1.9, -4.4] },
  { id: "service-3", kind: "service", stand: [6.6, -2.4], access: [6.6, SPINE_Z], focus: [6.6, 1.9, -4.4] },
  { id: "chat", kind: "chat", stand: [8.55, -2.15], access: [8.55, SPINE_Z], focus: [STATIONS.developer.x, 1.55, STATIONS.developer.z] },
];
const HOME = "gallery-2";
export type Pt = [number, number];
/** Straight legs: stand -> aisle spine -> along the spine -> stand. Every leg is checked clear by the tests. */
export function routePoints(a: StaffNode, b: StaffNode): Pt[] {
  const pts: Pt[] = [a.stand, a.access, b.access, b.stand];
  return pts.filter((p, i) => i === 0 || Math.hypot(p[0] - pts[i - 1][0], p[1] - pts[i - 1][1]) > 1e-6);
}

type Beat = { kind: "idle" | "look" | "review" | "point" | "talk" | "type" | "mouse" | "think" | "lean" | "glance" | "touch" | "camera"; dur: number; side: 1 | -1; aux: number };
type Track = { beats: Beat[]; i: number; t: number };
const env = (b: Beat, t: number) => smooth(Math.min(t / 0.45, (b.dur - t) / 0.45, 1));
const beat = (rng: Rng, kind: Beat["kind"], lo: number, hi: number): Beat => ({ kind, dur: range(rng, lo, hi), side: pick(rng, [1, -1] as const), aux: rng() });

/** Direction from a character at (x, floor) with yaw to a world point, in the character frame; shoulder or eye height. */
function localDir(x: number, z: number, floor: number, yaw: number, target: Vec3, fromY: number): Vec3 {
  const dx = target[0] - x, dz = target[2] - z, c = Math.cos(yaw), s = Math.sin(yaw);
  return [dx * c - dz * s, target[1] - (floor + fromY), dx * s + dz * c];
}
const tmp = createPose();
function mixArm(p: Pose, side: Side, d: Vec3, w: number, elbow = 0.12) {
  armToward(tmp, side, d[0], d[1], d[2], elbow);
  for (const k of ["ShoulderPitch", "ShoulderRoll", "ShoulderYaw", "Elbow", "WristPitch"] as const) p[`${side}${k}`] = lerp(p[`${side}${k}`], tmp[`${side}${k}`], w);
}
function lookAt(p: Pose, d: Vec3, w: number) {
  aimHead(p, Math.atan2(d[0], d[2]), Math.atan2(-d[1], Math.hypot(d[0], d[2])), w);
}
const sideOf = (b: Beat): Side => (b.side > 0 ? "l" : "r");

export type WalkerMode = "dwell" | "walk";
export type StaffInput = { walking: boolean; visitor?: { x: number; z: number } };

export function createStaff(seed: number) {
  const rng: Rng = mulberry32(seed);
  const designer = createPose(), developer = createPose(), walker = createPose();
  const base = createPose(), alt = createPose();
  const phase = { d: range(rng, 0, 50), v: range(rng, 0, 50), w: range(rng, 0, 50) };
  let clock = 0, acc = 0;

  // Designer: seated, typing in bursts with mouse work, thinking and leaning back between.
  const dTrack: Track = { beats: [], i: 0, t: 0 };
  let dGain = 0, dBurst = 1, dBurstT = range(rng, 2, 5), dYaw = 0, dYawT = 0;
  const nextDesignerBeat = (): Beat => {
    const r = rng();
    return r < 0.5 ? beat(rng, "type", 5, 11) : r < 0.68 ? beat(rng, "mouse", 3, 6) : r < 0.82 ? beat(rng, "think", 3, 5) : r < 0.92 ? beat(rng, "lean", 2.5, 4) : beat(rng, "glance", 1.5, 2.6);
  };
  dTrack.beats = [nextDesignerBeat()];

  // Developer: standing at the review display; turns to the walker when she stops to chat.
  const vTrack: Track = { beats: [], i: 0, t: 0 };
  let vYaw: number = STATIONS.developer.yaw, vShift = 0, vShiftT = 0;
  const nextDevBeat = (): Beat => {
    const r = rng();
    return r < 0.3 ? beat(rng, "point", 2.2, 3.4) : r < 0.55 ? beat(rng, "review", 3, 5) : r < 0.7 ? beat(rng, "touch", 1.8, 2.8) : r < 0.82 ? beat(rng, "camera", 1.6, 2.6) : beat(rng, "idle", 2, 4);
  };
  vTrack.beats = [nextDevBeat()];

  // Walker.
  const wTrack: Track = { beats: [], i: 0, t: 0 };
  const home = STAFF_NODES.find((n) => n.id === HOME) as StaffNode;
  let node: StaffNode = home, prevNode: StaffNode | null = null;
  let wx = home.stand[0], wz = home.stand[1], wyaw = Math.atan2(home.focus[0] - home.stand[0], home.focus[2] - home.stand[1]), wlift = floorHeight(wx, wz);
  let mode: WalkerMode = "dwell", route: Pt[] = [], routeIdx = 0, speed = 0, vmax = 1, walkPhase = 0, walkW = 0, arrived = true, settleT = 0;
  const stops: Record<string, number> = {};
  const stats = { walkTime: 0, dwellTime: 0, distance: 0 };
  const faceYaw = (n: StaffNode) => Math.atan2(n.focus[0] - n.stand[0], n.focus[2] - n.stand[1]);

  const buildDwell = (n: StaffNode): Beat[] => {
    const idle = () => beat(rng, "idle", 3, 6);
    switch (n.kind) {
      case "sculpture": return [idle(), beat(rng, "look", 2, 3), beat(rng, "review", 3, 4.5), beat(rng, "point", 2, 3), idle()];
      case "gallery": return [idle(), beat(rng, "look", 1.5, 2.5), beat(rng, "review", 3, 5), idle(), beat(rng, "point", 2, 3), idle()];
      case "service": return [idle(), beat(rng, "look", 1.5, 2.5), beat(rng, "point", 2, 3), idle(), beat(rng, "review", 2.5, 3.5)];
      default: return [beat(rng, "talk", 3, 4.5), idle(), beat(rng, "talk", 3, 4), idle(), beat(rng, "talk", 2.5, 3.5)];
    }
  };
  const startDwell = (n: StaffNode) => { wTrack.beats = buildDwell(n); wTrack.i = 0; wTrack.t = 0; stops[n.id] = (stops[n.id] ?? 0) + 1; };
  startDwell(home);
  const chooseNext = (): StaffNode => {
    const options = STAFF_NODES.filter((n) => n !== node && n !== prevNode);
    return pick(rng, options.length ? options : STAFF_NODES.filter((n) => n !== node));
  };

  const self = {
    designer, developer, walker, stops, stats,
    get time() { return clock; },
    get walkerMode() { return mode; },
    get walkerNode() { return node.id; },
    get walkerPos(): Pt { return [wx, wz]; },
    get chatting() { return mode === "dwell" && node.kind === "chat" && arrived && settleT > 0.6; },
    step(dtIn: number, input: StaffInput) {
      acc += clamp(dtIn, 0, MAX_DT);
      while (acc >= SUBSTEP) { acc -= SUBSTEP; clock += SUBSTEP; update(SUBSTEP, input); }
      compose(input);
      return self;
    },
  };

  function advance(track: Track, h: number, next: () => Beat | Beat[]) {
    track.t += h;
    if (track.t < track.beats[track.i].dur) return;
    track.t = 0; track.i++;
    if (track.i >= track.beats.length) {
      const n = next();
      track.beats = Array.isArray(n) ? n : [n]; track.i = 0;
    }
  }

  function update(h: number, input: StaffInput) {
    advance(dTrack, h, nextDesignerBeat);
    advance(vTrack, h, nextDevBeat);
    dBurstT -= h;
    if (dBurstT <= 0) { dBurst = dBurst > 0.5 ? 0.1 : 1; dBurstT = dBurst > 0.5 ? range(rng, 2.5, 6) : range(rng, 0.6, 1.8); }
    dGain = approach(dGain, dTrack.beats[dTrack.i].kind === "type" ? dBurst : 0.04, 6, h);
    dYawT -= h;
    if (dYawT <= 0) { dYawT = range(rng, 2, 6); dYaw = range(rng, -0.09, 0.09); }
    vShiftT -= h;
    if (vShiftT <= 0) { vShiftT = range(rng, 3, 7); vShift = pick(rng, [-1, 0, 1]); }

    const chatting = mode === "dwell" && node.kind === "chat" && arrived && settleT > 0.6;
    const devYaw = chatting ? Math.atan2(wx - STATIONS.developer.x, wz - STATIONS.developer.z) : STATIONS.developer.yaw;
    vYaw += wrapAngle(devYaw - vYaw) * (1 - Math.exp(-3 * h));

    if (mode === "dwell") {
      stats.dwellTime += h;
      wlift = approach(wlift, floorHeight(wx, wz), 12, h);
      wyaw += wrapAngle(faceYaw(node) - wyaw) * (1 - Math.exp(-4 * h));
      if (arrived) settleT += h;
      wTrack.t += h;
      if (wTrack.t >= wTrack.beats[wTrack.i].dur) { wTrack.t = 0; wTrack.i++; }
      if (wTrack.i >= wTrack.beats.length) {
        if (input.walking) {
          const next = chooseNext();
          prevNode = node;
          route = routePoints(node, next); routeIdx = 1; node = next; mode = "walk"; arrived = false; settleT = 0;
          vmax = range(rng, 0.95, 1.15); speed = 0;
          wTrack.beats = [{ kind: "idle", dur: 1e9, side: 1, aux: 0 }]; wTrack.i = 0; wTrack.t = 0;
        } else { startDwell(node); }
      }
    } else {
      stats.walkTime += h;
      const target = route[routeIdx];
      const dx = target[0] - wx, dz = target[1] - wz, dist = Math.hypot(dx, dz);
      let remaining = dist;
      for (let i = routeIdx + 1; i < route.length; i++) remaining += Math.hypot(route[i][0] - route[i - 1][0], route[i][1] - route[i - 1][1]);
      const want = Math.atan2(dx, dz);
      wyaw += wrapAngle(want - wyaw) * (1 - Math.exp(-7 * h));
      const turn = smooth(1 - Math.abs(wrapAngle(want - wyaw)) / 1.3);
      const cap = Math.min(vmax * (0.15 + 0.85 * turn), Math.max(0.12, Math.sqrt(2 * 1.3 * remaining)));
      speed = speed < cap ? Math.min(cap, speed + 1.5 * h) : Math.max(cap, speed - 2.5 * h);
      const step = Math.min(dist, speed * h);
      if (dist > 1e-9) { wx += (dx / dist) * step; wz += (dz / dist) * step; }
      stats.distance += step; walkPhase += (step / STRIDE) * Math.PI * 2;
      wlift = approach(wlift, floorHeight(wx, wz), 14, h);
      if (dist - step < 1e-6) {
        wx = target[0]; wz = target[1]; routeIdx++;
        if (routeIdx >= route.length) { mode = "dwell"; arrived = true; speed = 0; settleT = 0; startDwell(node); }
      }
    }
    walkW = approach(walkW, mode === "walk" ? 1 : 0, 6, h);
  }

  function compose(input: StaffInput) {
    composeDesigner();
    composeDeveloper(input);
    composeWalker();
  }

  function blink(p: Pose, t: number) {
    const c = (t * 0.43) % 1;
    p.blink = c > 0.94 ? Math.sin(((c - 0.94) / 0.06) * Math.PI) : 0;
  }

  function composeDesigner() {
    const t = clock + phase.d, b = dTrack.beats[dTrack.i], e = env(b, dTrack.t), p = designer;
    poseSeatedTyping(p, t, dGain, { y: 0.7, z: 0.4 });
    if (b.kind === "mouse") {
      p.lShoulderPitch -= 0.06 * e; p.rWristYaw += 0.12 * Math.sin(t * 2.3) * e; p.rElbow += 0.05 * Math.sin(t * 1.7) * e;
      aimHead(p, 0.1 * Math.sin(t * 0.7) * e, 0, 1);
    } else if (b.kind === "think") {
      poseReview(p, e, "r"); p.spinePitch = lerp(p.spinePitch, -0.05, e); aimHead(p, 0.1 * e, 0.02, 1);
    } else if (b.kind === "lean") {
      poseSeatedRest(alt); blendPose(p, p, alt, e * 0.85);
      p.spinePitch = lerp(p.spinePitch, -0.16, e); p.headPitch = lerp(p.headPitch, -0.12, e); p.headRoll = 0.06 * e;
    } else if (b.kind === "glance") aimHead(p, (b.aux > 0.5 ? 0.9 : -0.7) * e, -0.05 * e, 1);
    p.rootX = STATIONS.designer.x; p.rootZ = STATIONS.designer.z; p.rootLift = STATIONS.designer.floor; p.rootYaw = STATIONS.designer.yaw + dYaw;
    p.smile = 0.2; p.brow = 0.05; blink(p, t);
    p.spinePitch += 0.01 * Math.sin(t * 1.5);
  }

  function composeDeveloper(input: StaffInput) {
    const t = clock + phase.v, p = developer, S = STATIONS;
    const chat = self.chatting;
    poseStanding(p, t, vShift * 0.6);
    const b = vTrack.beats[vTrack.i], e = env(b, vTrack.t);
    const screen: Vec3 = [S.display.x, 1.25, S.display.z];
    const toScreen = localDir(S.developer.x, S.developer.z, S.developer.floor, vYaw, screen, 1.36);
    const eyeScreen = localDir(S.developer.x, S.developer.z, S.developer.floor, vYaw, screen, 1.58);
    if (chat) {
      const toWalker = localDir(S.developer.x, S.developer.z, S.developer.floor, vYaw, [wx, 1.55, wz], 1.58);
      lookAt(p, toWalker, 1);
      const talking = Math.sin(t * 0.8) > 0.2; // takes turns with the walker
      if (talking) {
        mixArm(p, "r", [-0.3, -0.7, 0.8], 0.9, 1.2 + 0.2 * Math.sin(t * 3.1)); p.headPitch += 0.04 * Math.sin(t * 3.1);
      } else p.headPitch += Math.max(0, Math.sin(t * 2.2)) * 0.1;
      p.smile = 0.55;
    } else if (b.kind === "point") { lookAt(p, eyeScreen, e); mixArm(p, "r", toScreen, e, 0.1); p.smile = 0.15; }
    else if (b.kind === "touch") { lookAt(p, eyeScreen, e); mixArm(p, "l", toScreen, e, 0.35 + 0.08 * Math.sin(t * 4)); }
    else if (b.kind === "review") { lookAt(p, eyeScreen, e * 0.8); poseReview(p, e, "r"); }
    else if (b.kind === "camera" && input.visitor) {
      lookAt(p, localDir(S.developer.x, S.developer.z, S.developer.floor, vYaw, [input.visitor.x, 1.6, input.visitor.z], 1.58), e); p.smile = 0.45 * e;
    } else lookAt(p, eyeScreen, 0.6 + 0.2 * Math.sin(t * 0.5));
    p.rootX = S.developer.x; p.rootZ = S.developer.z; p.rootLift = S.developer.floor; p.rootYaw = vYaw;
    if (!chat && b.kind !== "camera") p.smile = Math.max(p.smile, 0.12);
    p.brow = 0.05; blink(p, t);
  }

  function composeWalker() {
    const t = clock + phase.w, p = walker;
    poseStanding(base, t, Math.sin(t * 0.3) * 0.7);
    const b = wTrack.beats[wTrack.i], e = env(b, wTrack.t);
    const dwellPose = base;
    const eye = localDir(wx, wz, wlift, wyaw, node.focus, 1.58), shoulder = localDir(wx, wz, wlift, wyaw, node.focus, 1.36);
    if (mode === "dwell") {
      switch (b.kind) {
        case "look": lookAt(dwellPose, eye, e); break;
        case "review": lookAt(dwellPose, eye, 0.85 * e); poseReview(dwellPose, e, sideOf(b)); break;
        case "point": lookAt(dwellPose, eye, e); mixArm(dwellPose, sideOf(b), shoulder, e, 0.1); dwellPose.smile = 0.3 * e; break;
        case "talk": {
          lookAt(dwellPose, eye, 0.9);
          const s = Math.sin(t * 3.3 + b.aux * 6);
          if (self.chatting && Math.sin(t * 0.8) <= 0.2) mixArm(dwellPose, sideOf(b), [0.2 * b.side, -0.7, 0.8], 0.9 * e, 1.25 + 0.25 * s);
          dwellPose.headPitch += 0.04 * s; dwellPose.smile = 0.5; break;
        }
        default: aimHead(dwellPose, 0.5 * Math.sin(t * 0.45 + b.aux * 6), 0, 1 - e * 0.2);
      }
    }
    poseWalk(alt, walkPhase, clamp(speed / 1.1, 0, 1));
    blendPose(p, dwellPose, alt, smooth(walkW));
    if (walkW > 0.05) p.smile = lerp(p.smile, 0.12, walkW);
    p.rootX = wx; p.rootZ = wz; p.rootLift = wlift; p.rootYaw = wyaw;
    p.brow = 0.05; blink(p, t);
  }
  compose({ walking: false });
  return self;
}
export type Staff = ReturnType<typeof createStaff>;
