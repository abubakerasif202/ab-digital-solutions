// Resident kangaroo: the studio's greeter, standing near the entrance. Pure pose generator that reuses the
// visiting kangaroo's rig contract (KangarooPose) and its two-link leg IK so feet always meet the footpath.
// Idle life: ear twitches, looking around, natural short hops inside a fenced-off zone. Interactions: wave,
// head tilt, playful hop. Reduced motion replaces hops with gentle poses.
import { mulberry32, range } from "./rng";
import { GROUND_Y, ROO, legIK } from "./kangaroo-behavior";
import type { KangarooPose } from "./kangaroo-behavior";
import { KANGAROO_ZONE, damp, footprintClear, inKangarooZone, wildlifePlacement } from "./wildlife";

export type RooReaction = "wave" | "tilt" | "hop";
export const ROO_REACTIONS: RooReaction[] = ["wave", "tilt", "hop"];
export const ROO_BODY_RADIUS = 0.45;
/** Resting heading: turned a little toward the door so the animal reads as welcoming visitors in. */
export const REST_HEADING = 0.4;
const GRAVITY = 9.8;
const clamp = (v: number, lo: number, hi: number) => (v < lo ? lo : v > hi ? hi : v);
const wrap = (a: number) => { let v = a % (Math.PI * 2); if (v > Math.PI) v -= Math.PI * 2; else if (v < -Math.PI) v += Math.PI * 2; return v; };
const bump = (t: number, a: number, b: number) => { const u = (t - a) / (b - a); return u <= 0 || u >= 1 ? 0 : Math.sin(Math.PI * u); };

type Hop = { x0: number; z0: number; x1: number; z1: number; apex: number; flight: number; phase: "crouch" | "air" | "land"; t: number };
type Smooth = Omit<KangarooPose, "x" | "z" | "y" | "heading" | "footClear" | "tailTip" | "thigh" | "knee" | "ankle" | "hipH"> & { crouch: number; tuck: number };

export function createResidentKangaroo(seed = 20261105) {
  const rng = mulberry32(seed);
  const home = wildlifePlacement.kangaroo;
  let x: number = home.x, z: number = home.z, heading: number = REST_HEADING;
  let clock = 0, acc = 0, hop: Hop | null = null;
  let nextHop = range(rng, 6, 10), nextLook = range(rng, 1, 2.5), lookYaw = 0, lookPitch = 0;
  const ears = [{ next: range(rng, 0.6, 2), t: 9, yaw: 0.22, pitch: 0 }, { next: range(rng, 1.2, 3), t: 9, yaw: 0.22, pitch: 0 }];
  let reaction: { kind: RooReaction; t: number; dur: number } | null = null;
  const queue: RooReaction[] = [];
  let nextKind = 0;
  const S: Smooth = {
    squash: 0, bodyPitch: 0.5, bodyYaw: 0, bodyRoll: 0, neckPitch: -0.15, headPitch: 0.05, headYaw: 0, headRoll: 0,
    earLYaw: 0.22, earLPitch: 0, earRYaw: 0.22, earRPitch: 0, armL: 0.45, armR: 0.45, elbowL: 1.2, elbowR: 1.2,
    tail1: -0.62, tail2: -0.45, tail3: -0.15, crouch: 0, tuck: 0,
  };
  const pose: KangarooPose = {
    x, z, y: GROUND_Y, heading, squash: 0, hipH: ROO.standHip, thigh: 0, knee: 0, ankle: 0,
    bodyPitch: 0.5, bodyYaw: 0, bodyRoll: 0, neckPitch: 0, headPitch: 0, headYaw: 0, headRoll: 0,
    earLYaw: 0, earLPitch: 0, earRYaw: 0, earRPitch: 0, armL: 0, armR: 0, elbowL: 0, elbowR: 0, tail1: 0, tail2: 0, tail3: 0, footClear: 0, tailTip: 0,
  };

  function startHop(toX: number, toZ: number, apex: number) {
    hop = { x0: x, z0: z, x1: toX, z1: toZ, apex, flight: Math.sqrt((8 * apex) / GRAVITY), phase: "crouch", t: 0 };
  }
  function chooseIdleHop() {
    for (let i = 0; i < 8; i++) {
      const angle = range(rng, 0, Math.PI * 2), length = range(rng, 0.6, 1.2);
      const tx = x + Math.sin(angle) * length, tz = z + Math.cos(angle) * length * 0.45;
      // The landing spot and the straight line to it stay inside the zone (a convex rectangle) and clear of furniture.
      if (inKangarooZone(tx, tz) && footprintClear(tx, tz, ROO_BODY_RADIUS)) { startHop(tx, tz, range(rng, 0.16, 0.26)); return; }
    }
    // Boxed in: return toward the centre of the zone instead.
    startHop(clamp(home.x, KANGAROO_ZONE.x0, KANGAROO_ZONE.x1), clamp(home.z, KANGAROO_ZONE.z0, KANGAROO_ZONE.z1), 0.18);
  }
  function beginReaction(kind: RooReaction, reduced: boolean) {
    reaction = { kind, t: 0, dur: kind === "wave" ? 3.2 : kind === "tilt" ? 2.6 : reduced ? 1.4 : 1.1 };
    if (kind === "hop" && !reduced && !hop) startHop(x, z, 0.3);
  }

  function update(h: number, input: { visitor: { x: number; z: number }; reduced: boolean }) {
    clock += h;
    const { reduced } = input;
    // --- timers -----------------------------------------------------------------------------
    nextLook -= h;
    if (nextLook <= 0) { nextLook = range(rng, 1.8, 4.2); lookYaw = range(rng, -0.7, 0.7); lookPitch = range(rng, -0.1, 0.12); }
    nextHop -= h;
    if (nextHop <= 0) { nextHop = range(rng, 9, 17); if (!reduced && !hop && !reaction) chooseIdleHop(); }
    if (!reaction && queue.length) beginReaction(queue.shift()!, reduced);
    if (reaction) { reaction.t += h; if (reaction.t >= reaction.dur) reaction = null; }

    // --- hop kinematics ---------------------------------------------------------------------
    let crouch = 0, tuck = 0, moving = false, airborne = false;
    if (hop) {
      hop.t += h;
      if (hop.phase === "crouch") { crouch = 0.13 * Math.min(1, hop.t / 0.14); if (hop.t >= 0.14) { hop.phase = "air"; hop.t = 0; } }
      else if (hop.phase === "air") {
        const u = clamp(hop.t / hop.flight, 0, 1);
        x = hop.x0 + (hop.x1 - hop.x0) * u; z = hop.z0 + (hop.z1 - hop.z0) * u;
        tuck = Math.sin(Math.PI * u); airborne = true; moving = true;
        if (hop.t >= hop.flight) { x = hop.x1; z = hop.z1; hop.phase = "land"; hop.t = 0; }
      } else { crouch = 0.15 * (1 - Math.min(1, hop.t / 0.18)); if (hop.t >= 0.18) hop = null; }
    }

    // --- targets ----------------------------------------------------------------------------
    const toVisitor = Math.atan2(input.visitor.x - x, input.visitor.z - z);
    const visitorRel = clamp(wrap(toVisitor - heading), -0.9, 0.9);
    const T: Smooth = {
      squash: crouch * 0.45, bodyPitch: 0.5 + Math.sin(clock * 1.7) * 0.012, bodyYaw: 0, bodyRoll: 0, neckPitch: -0.15, headPitch: 0.05 + lookPitch * 0.5, headYaw: lookYaw * 0.8 + visitorRel * 0.25, headRoll: 0,
      earLYaw: 0.22, earLPitch: 0, earRYaw: 0.22, earRPitch: 0, armL: 0.45, armR: 0.45, elbowL: 1.2, elbowR: 1.2,
      tail1: -0.62 + Math.sin(clock * 0.9) * 0.03, tail2: -0.45, tail3: -0.15, crouch, tuck,
    };
    let headingTarget = REST_HEADING;
    if (hop && (hop.phase !== "land")) {
      const dx = hop.x1 - hop.x0, dz = hop.z1 - hop.z0;
      if (Math.hypot(dx, dz) > 0.2) headingTarget = clamp(Math.atan2(dx, dz), -1.3, 1.3);
    }
    if (airborne) { T.bodyPitch = 0.72; T.neckPitch = -0.3; T.armL = T.armR = 0.9; T.elbowL = T.elbowR = 1.5; T.tail1 = -0.1; T.tail2 = 0.05; T.tail3 = 0.1; T.headPitch = -0.05; }
    if (crouch > 0) { T.bodyPitch = 0.62; T.headPitch = 0.1; }

    if (reaction) {
      const r = reaction, u = r.t / r.dur;
      // Everyone looks at the visitor while reacting, which is what makes the animal feel responsive.
      T.headYaw = visitorRel * 0.9; T.headPitch = -0.02;
      if (r.kind === "wave") {
        const lift = bump(r.t, 0.1, r.dur - 0.2);
        const swing = reduced ? 0 : Math.sin(r.t * 9) * 0.45;
        T.armR = 0.45 + (2.3 - 0.45) * lift; T.elbowR = 1.2 + (0.45 + swing - 1.2) * lift;
        T.bodyPitch = 0.5 - 0.12 * lift; T.headRoll = 0.12 * lift; T.earLYaw = T.earRYaw = 0.1; T.earLPitch = T.earRPitch = 0.3 * lift;
      } else if (r.kind === "tilt") {
        const tilt = bump(r.t, 0.05, r.dur - 0.1);
        T.headRoll = 0.5 * tilt; T.headPitch = -0.08 * tilt; T.headYaw = visitorRel * 0.6;
        T.earLPitch = -0.1 * tilt; T.earRPitch = 0.45 * tilt; T.earRYaw = 0.05;
        T.bodyPitch = 0.46; T.neckPitch = -0.2;
      } else {
        // Hop: the kinematic hop is started in beginReaction; reduced motion rises onto its toes instead.
        if (reduced) { const rise = bump(r.t, 0, r.dur); T.bodyPitch = 0.5 - 0.18 * rise; T.neckPitch = -0.15 - 0.1 * rise; T.earLPitch = T.earRPitch = 0.35 * rise; T.tail1 = -0.62 + 0.15 * rise; }
        else if (u > 0.2) { T.headRoll = 0.1; T.armL = T.armR = 0.7; }
      }
    }

    // --- ears: occasional independent twitches ---------------------------------------------
    ears.forEach((ear, i) => {
      ear.next -= h; ear.t += h;
      if (ear.next <= 0) { ear.next = range(rng, 1.4, 4.6); ear.t = 0; }
      const flick = reduced ? 0 : bump(ear.t, 0, 0.22);
      const base = i === 0 ? [T.earLYaw, T.earLPitch] : [T.earRYaw, T.earRPitch];
      const yaw = base[0] + flick * 0.35, pitch = base[1] - flick * 0.3 + Math.sin(clock * 0.6 + i * 2) * 0.03;
      if (i === 0) { T.earLYaw = yaw; T.earLPitch = pitch; } else { T.earRYaw = yaw; T.earRPitch = pitch; }
    });

    // --- smooth into the pose ---------------------------------------------------------------
    const keys = Object.keys(S) as (keyof Smooth)[];
    for (const k of keys) {
      const fast = k.startsWith("ear") || k === "crouch" || k === "tuck" || k === "squash";
      S[k] = damp(S[k], T[k], fast ? 22 : k.startsWith("arm") || k.startsWith("elbow") ? 14 : 9, h);
    }
    heading += wrap(headingTarget - heading) * (1 - Math.exp(-(moving ? 14 : 5) * h));
  }

  function compose() {
    const hipTarget = ROO.standHip - S.crouch + S.tuck * 0.03;
    const ik = legIK(hipTarget, S.tuck * 0.16, S.tuck * 0.55);
    pose.x = x; pose.z = z; pose.heading = heading;
    pose.y = GROUND_Y + (hop && hop.phase === "air" ? 4 * hop.apex * (hop.t / hop.flight) * (1 - hop.t / hop.flight) : 0);
    pose.squash = S.squash; pose.hipH = ik.hipH; pose.thigh = ik.thigh; pose.knee = ik.knee; pose.ankle = ik.ankle;
    pose.bodyPitch = S.bodyPitch; pose.bodyYaw = S.bodyYaw; pose.bodyRoll = S.bodyRoll; pose.neckPitch = S.neckPitch;
    pose.headPitch = S.headPitch; pose.headYaw = S.headYaw; pose.headRoll = S.headRoll;
    pose.earLYaw = S.earLYaw; pose.earLPitch = S.earLPitch; pose.earRYaw = S.earRYaw; pose.earRPitch = S.earRPitch;
    pose.armL = S.armL; pose.armR = S.armR; pose.elbowL = S.elbowL; pose.elbowR = S.elbowR;
    pose.tail1 = S.tail1; pose.tail2 = S.tail2; pose.tail3 = S.tail3;
    // Ground contact: with no tuck the sole sits on the footpath; `clearance` is the foot height above it.
    pose.footClear = ik.clearance;
    pose.tailTip = ROO.standHip * 0.4;
  }

  const SUBSTEP = 1 / 60;
  const self = {
    pose,
    get x() { return x; }, get z() { return z; }, get hopping() { return !!hop; }, get reaction() { return reaction?.kind ?? null; }, get time() { return clock; },
    /** Queue a reaction; with no kind, rotate wave → tilt → hop so repeat interactions vary. */
    react(kind?: RooReaction) { const k = kind ?? ROO_REACTIONS[nextKind++ % ROO_REACTIONS.length]; if (queue.length < 2) queue.push(k); return k; },
    /** The greeting used when the arrival film reaches the studio: a hop and a wave. */
    greet() { queue.push("hop", "wave"); },
    step(dt: number, input: { visitor: { x: number; z: number }; reduced: boolean }) {
      acc += clamp(dt, 0, 0.1);
      let ran = 0;
      while (acc >= SUBSTEP && ran < 8) { const left = acc - SUBSTEP; update(SUBSTEP, input); acc = left; ran++; }
      compose();
      return pose;
    },
  };
  return self;
}
export type ResidentKangaroo = ReturnType<typeof createResidentKangaroo>;
