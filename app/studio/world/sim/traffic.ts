// Pure, deterministic car-following simulation (IDM with a Krauss-style safety clamp) on two
// drive-left lanes plus a side street: one car enters it by a left turn into the far lane, others
// leave by a left turn. No three.js / React: Traffic.tsx only reads `vehicles` and draws them.
// Vehicles are mutated in place for speed; treat the array as read-only outside this file.
import { layout } from "../world-layout";
import { mulberry32, pick, range, type Rng } from "./rng";
import { mayProceed } from "./signals";

export type RouteId = "east" | "west" | "enter" | "exit";
export type VehicleKind = "sedan" | "taxi" | "van" | "bus";
export type Vehicle = {
  id: number;
  kind: VehicleKind;
  color: string;
  length: number;
  width: number;
  height: number;
  v0: number; // desired speed, m/s
  route: RouteId;
  s: number; // arc-length of the vehicle centre along its route
  speed: number;
  braking: boolean;
  active: boolean;
  committed: boolean; // side-street car has accepted a gap
  respawnAt: number;
  x: number;
  z: number;
  heading: number; // rotation.y for a model whose nose points +x
};

export const MAX_SUB = 0.05;
export const ROUTE_END = 66; // routes run x:-66..66 so spawn and despawn happen off the visible street
export const SIDE_STREET = { x: -44, arcRadius: layout.farFootpath.z0 + 1.4 - layout.lanes.minusX }; // 4.2 m
const R = SIDE_STREET.arcRadius;
const ENTER_X = SIDE_STREET.x - 2; // arriving traffic keeps left: smaller x
const EXIT_END_X = SIDE_STREET.x + 2;
const EXIT_TURN_X = EXIT_END_X + R;
const ARC_Z = layout.lanes.minusX + R;
const CURVE_SPEED = 3.4;
const IDM = { T: 1.3, s0: 2.2, b: 2.2, bMax: 6, tau: 0.25, gMin: 1 };
const STOP_MARGIN = 0.8;
const LANE_HALF = 1.9;
const SIDE_FAR_Z = 34;

type Line = { kind: "line"; s0: number; len: number; x0: number; z0: number; dx: number; dz: number; cap: number };
type Arc = { kind: "arc"; s0: number; len: number; cx: number; cz: number; a0: number; sign: 1 | -1; cap: number };
type Seg = Line | Arc;
type Route = { id: RouteId; segs: Seg[]; length: number; stopS: number | null };

function build(id: RouteId, parts: Array<(s0: number) => Seg>, stopS: number | null): Route {
  const segs: Seg[] = [];
  let s0 = 0;
  for (const make of parts) { const seg = make(s0); segs.push(seg); s0 += seg.len; }
  return { id, segs, length: s0, stopS };
}
const line = (x0: number, z0: number, x1: number, z1: number, cap = Infinity) => (s0: number): Seg => {
  const len = Math.hypot(x1 - x0, z1 - z0);
  return { kind: "line", s0, len, x0, z0, dx: (x1 - x0) / len, dz: (z1 - z0) / len, cap };
};
const arc = (cx: number, cz: number, a0: number, a1: number) => (s0: number): Seg =>
  ({ kind: "arc", s0, len: R * Math.abs(a1 - a0), cx, cz, a0, sign: a1 < a0 ? -1 : 1, cap: CURVE_SPEED });

const laneE = layout.lanes.plusX;
const laneW = layout.lanes.minusX;
export const routes: Record<RouteId, Route> = {
  east: build("east", [line(-ROUTE_END, laneE, ROUTE_END, laneE)], layout.stopLines.plusX + ROUTE_END),
  west: build("west", [line(ROUTE_END, laneW, -ROUTE_END, laneW)], ROUTE_END - layout.stopLines.minusX),
  // Side street -> far lane: heading -z, left turn to -x.
  enter: build("enter", [
    line(ENTER_X, SIDE_FAR_Z, ENTER_X, ARC_Z, 6),
    arc(ENTER_X - R, ARC_Z, 0, -Math.PI / 2),
    line(ENTER_X - R, laneW, -ROUTE_END, laneW),
  ], null),
  // Far lane -> side street: heading -x, left turn to +z.
  exit: build("exit", [
    line(ROUTE_END, laneW, EXIT_TURN_X, laneW),
    arc(EXIT_TURN_X, ARC_Z, -Math.PI / 2, -Math.PI),
    line(EXIT_END_X, ARC_Z, EXIT_END_X, SIDE_FAR_Z + 8),
  ], ROUTE_END - layout.stopLines.minusX),
};
const GIVE_WAY_S = routes.enter.segs[0].len; // centre stops here (nose at the arc start)

const pose = { x: 0, z: 0, tx: 1, tz: 0 };
function poseAt(route: Route, s: number) {
  const segs = route.segs;
  let seg = segs[0];
  for (let i = segs.length - 1; i >= 0; i--) if (s >= segs[i].s0) { seg = segs[i]; break; }
  const u = s - seg.s0;
  if (seg.kind === "line") {
    pose.x = seg.x0 + seg.dx * u; pose.z = seg.z0 + seg.dz * u; pose.tx = seg.dx; pose.tz = seg.dz;
  } else {
    const a = seg.a0 + seg.sign * Math.min(u, seg.len) / R;
    pose.x = seg.cx + R * Math.cos(a); pose.z = seg.cz + R * Math.sin(a);
    pose.tx = -seg.sign * Math.sin(a); pose.tz = seg.sign * Math.cos(a);
  }
}

export const VEHICLE_SPECS = {
  sedan: { length: 4.4, width: 1.8, height: 1.5, v: [10.5, 13] },
  taxi: { length: 4.5, width: 1.8, height: 1.5, v: [11, 13] },
  van: { length: 5.3, width: 2, height: 2.1, v: [9.5, 11.5] },
  bus: { length: 11, width: 2.5, height: 3.2, v: [8.5, 10] },
} as const;
const FLEET: readonly VehicleKind[] = ["sedan", "taxi", "van", "sedan", "bus", "taxi", "sedan", "van", "sedan", "sedan"];
const BODY_COLORS = ["#22272a", "#792c40", "#aeb4b8", "#2c4766", "#e8e6df", "#2f4a3d", "#6d6458", "#8d2f2a"] as const;
const COLORS: Record<VehicleKind, readonly string[]> = {
  sedan: BODY_COLORS, taxi: ["#f1efe6", "#e9b824"], van: ["#e8e6df", "#aeb4b8", "#2c4766"], bus: ["#792c40", "#2e5c6e"],
};

export type TrafficSim = { vehicles: Vehicle[]; step: (dt: number, time: number) => void; stats: { entered: number; exited: number } };

const inFarLane = (v: Vehicle) => v.route !== "east" && Math.abs(v.z - laneW) < LANE_HALF;

export function createTraffic({ seed, count }: { seed: number; count: number }): TrafficSim {
  const rng: Rng = mulberry32(seed);
  const stats = { entered: 0, exited: 0 };
  let nextEnterAt = 6;
  const vehicles: Vehicle[] = Array.from({ length: count }, (_, id) => {
    const kind = FLEET[id % FLEET.length];
    const spec = VEHICLE_SPECS[kind];
    return {
      id, kind, color: pick(rng, COLORS[kind]), length: spec.length, width: spec.width, height: spec.height,
      v0: range(rng, spec.v[0], spec.v[1]), route: "east" as RouteId, s: 0, speed: 0, braking: false, active: false,
      committed: false, respawnAt: 0, x: 0, z: 0, heading: 0,
    };
  });
  const place = (v: Vehicle) => {
    poseAt(routes[v.route], v.s);
    v.x = pose.x; v.z = pose.z; v.heading = Math.atan2(-pose.tz, pose.tx);
  };

  // Warm start so the street is already alive: spaced cars on both lanes.
  const taken: Record<"east" | "west", number[]> = { east: [], west: [] };
  vehicles.forEach((v, i) => {
    const route: "east" | "west" = i % 2 === 0 ? "west" : "east";
    for (let tries = 0; tries < 24; tries++) {
      const x = range(rng, -48, 48);
      if (taken[route].every((o) => Math.abs(o - x) > 22 + v.length)) {
        taken[route].push(x);
        v.route = route; v.s = route === "east" ? x + ROUTE_END : ROUTE_END - x;
        v.speed = v.v0 * 0.85; v.active = true; place(v);
        return;
      }
    }
    v.respawnAt = 2 + i * 1.5;
  });

  const nextSpeed = new Float64Array(count);
  const nextBrake: boolean[] = new Array(count).fill(false);

  function leaderGap(v: Vehicle, out: { gap: number; speed: number }) {
    out.gap = Infinity; out.speed = 0;
    for (const o of vehicles) {
      if (o === v || !o.active) continue;
      const halves = (o.length + v.length) / 2;
      let gap = Infinity;
      if (o.route === v.route && o.s > v.s) gap = o.s - v.s - halves;
      if (inFarLane(o) && inFarLane(v) && o.x < v.x) gap = Math.min(gap, v.x - o.x - halves);
      if (gap < out.gap) { out.gap = gap; out.speed = o.speed; }
    }
  }
  // Gap acceptance for the side-street car: nothing close upstream of, or just past, the merge.
  function entryClear(self: Vehicle) {
    const xMerge = ENTER_X - R / 2;
    for (const o of vehicles) {
      if (o === self || !o.active || !inFarLane(o)) continue;
      const ahead = o.x - xMerge;
      if (ahead > -14 - o.length / 2 && ahead < Math.max(o.speed, 3) * 6 + o.length / 2) return false;
    }
    return true;
  }
  const accel = (v: Vehicle, vd: number, gap: number, vL: number) => {
    const a = v.kind === "bus" ? 1 : 1.7;
    const sStar = IDM.s0 + Math.max(0, v.speed * IDM.T + (v.speed * (v.speed - vL)) / (2 * Math.sqrt(a * IDM.b)));
    return a * (1 - Math.pow(v.speed / vd, 4) - Math.pow(sStar / Math.max(gap, 0.05), 2));
  };
  const safeSpeed = (vL: number, gap: number, gMin: number) => {
    const bt = IDM.bMax * IDM.tau;
    return -bt + Math.sqrt(bt * bt + vL * vL + 2 * IDM.bMax * Math.max(0, gap - gMin));
  };
  const lead = { gap: 0, speed: 0 };

  function drive(v: Vehicle, t: number, dt: number, index: number) {
    const route = routes[v.route];
    // Curve speed limit, with comfortable braking ahead of each bend.
    let vd = v.v0;
    for (const seg of route.segs) {
      if (seg.cap === Infinity) continue;
      const toStart = seg.s0 - (v.s + v.length / 2);
      if (v.s - v.length / 2 > seg.s0 + seg.len) continue;
      vd = Math.min(vd, Math.sqrt(seg.cap * seg.cap + 2 * 2 * Math.max(0, toStart)));
    }
    vd = Math.max(vd, 1);
    let a = accel(v, vd, Infinity, 0);
    let vCap = Infinity;
    leaderGap(v, lead);
    if (lead.gap < Infinity) {
      a = Math.min(a, accel(v, vd, lead.gap, lead.speed));
      vCap = safeSpeed(lead.speed, lead.gap, IDM.gMin);
    }
    let stopGap = Infinity;
    if (route.stopS !== null) {
      const d = route.stopS - (v.s + v.length / 2);
      if (d > 0 && !mayProceed(t, d, v.speed)) stopGap = Math.max(0.01, d - STOP_MARGIN);
    }
    if (v.route === "enter" && !v.committed && GIVE_WAY_S - v.s > -0.5) {
      const clear = entryClear(v);
      if (clear && GIVE_WAY_S - v.s < 6) v.committed = true;
      else if (!clear) stopGap = Math.min(stopGap, Math.max(0.01, GIVE_WAY_S - v.s));
    }
    if (stopGap < Infinity) {
      a = Math.min(a, accel(v, vd, stopGap, 0));
      vCap = Math.min(vCap, safeSpeed(0, stopGap, 0));
    }
    a = Math.max(a, -IDM.bMax);
    nextSpeed[index] = Math.max(0, Math.min(v.speed + a * dt, vCap));
    nextBrake[index] = a < -1;
  }

  function spawn(v: Vehicle, t: number) {
    let route: RouteId;
    const roll = rng();
    if (t >= nextEnterAt && v.id % 2 === 1 && !vehicles.some((o) => o.active && o.route === "enter") && roll < 0.5) route = "enter";
    else if (roll < 0.5) route = "east";
    else route = rng() < 0.28 ? "exit" : "west";
    if (route === "enter" && v.kind === "bus") route = "west";
    const group = route === "east" ? ["east"] : route === "enter" ? ["enter"] : ["west", "exit"];
    const startS = -v.length / 2;
    const entrySpeed = v.v0 * 0.85;
    for (const o of vehicles) {
      if (!o.active || !group.includes(o.route)) continue;
      if (o.s - o.length / 2 - (startS + v.length / 2) < 20 + entrySpeed) return false;
    }
    v.route = route; v.s = startS; v.speed = route === "enter" ? 4 : entrySpeed; v.committed = false; v.active = true; v.braking = false;
    if (route === "enter") { nextEnterAt = t + range(rng, 10, 22); }
    place(v);
    return true;
  }

  function substep(dt: number, t: number) {
    for (const v of vehicles) if (!v.active && t >= v.respawnAt && !spawn(v, t)) v.respawnAt = t + 0.5;
    vehicles.forEach((v, i) => { if (v.active) drive(v, t, dt, i); });
    vehicles.forEach((v, i) => {
      if (!v.active) return;
      const next = nextSpeed[i];
      v.s += ((v.speed + next) / 2) * dt;
      v.speed = next; v.braking = nextBrake[i];
      place(v);
      if (v.s - v.length / 2 >= routes[v.route].length) {
        if (v.route === "enter") stats.entered++;
        if (v.route === "exit") stats.exited++;
        v.active = false; v.speed = 0; v.respawnAt = t + range(rng, 1, 6);
      }
    });
  }

  return {
    vehicles, stats,
    step(dt, time) {
      const n = Math.max(1, Math.ceil(dt / MAX_SUB));
      const sub = dt / n;
      for (let i = 0; i < n; i++) substep(sub, time - dt + (i + 1) * sub);
    },
  };
}
