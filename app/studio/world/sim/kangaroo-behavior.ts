// Pure behaviour for the visiting red kangaroo: away (cooldown) -> hop in -> pause -> variant beat
// (watch / graze / sniff / inspect the studio door) -> look at the visitor -> hop out. Kinematic
// hops on a parabola with analytic leg IK so feet land exactly on the footpath. No three/React.
import { mulberry32, range, pick } from "./rng";
import type { Rng } from "./rng";
import { approach, clamp, lerp, smooth, wrapAngle } from "./humanoid-pose";
import { layout } from "../world-layout";

export const ROO = { thigh: 0.4, shin: 0.42, ankleH: 0.083, toe: 0.32, tail: [0.42, 0.4, 0.34], tailBaseZ: 0.14, standHip: 0.75, neckBaseY: 0.52 } as const;
export const GROUND_Y = layout.footpath.y;
export const STRIP = layout.kangarooStrip;
export const FOOTPATH = layout.footpath;
export const INSPECT_SPOT = { x: -2.0, z: 11.0 };
export const DOOR_POINT = { x: layout.door.x, z: layout.facadeZ };
export const COOLDOWN_RANGE = { min: 25, max: 70 } as const;
export const MAX_DT = 0.1;
const SUBSTEP = 1 / 60;
const GRAVITY = 9.8;

export type KangarooStage = "away" | "hopIn" | "pause" | "look" | "graze" | "sniff" | "inspect" | "hopOut";
export type KangarooVariant = "watch" | "graze" | "sniff" | "inspect";
export type KangarooInput = { visitor: { x: number; z: number }; summon: boolean };
export type KangarooPose = {
  /** World footprint under the hips, root height above the footpath surface (`y`, includes the hop arc), heading (+z toward +x). */
  x: number; z: number; y: number; heading: number;
  squash: number; hipH: number; thigh: number; knee: number; ankle: number;
  bodyPitch: number; bodyYaw: number; bodyRoll: number; neckPitch: number; headPitch: number; headYaw: number; headRoll: number;
  earLYaw: number; earLPitch: number; earRYaw: number; earRPitch: number;
  armL: number; armR: number; elbowL: number; elbowR: number; tail1: number; tail2: number; tail3: number;
  /** Lowest point of either foot above the footpath surface, after squash and toe-down (>= 0). */
  footClear: number;
  /** Tail tip height above the footpath surface. */
  tailTip: number;
};
type Hop = { x0: number; z0: number; x1: number; z1: number; ph: number; tg: number; tf: number };
type Smooth = {
  hipH: number; bodyPitch: number; bodyYaw: number; bodyRoll: number; neckPitch: number; headPitch: number; headYaw: number; headRoll: number;
  armL: number; armR: number; elbowL: number; elbowR: number; tA1: number; tA2: number; tA3: number; squash: number; lift: number; toeDown: number;
};
type Ear = { yaw: number; pitch: number; ty: number; tp: number; next: number; fast: boolean };

const SEQUENCES: Record<KangarooVariant, KangarooStage[]> = {
  watch: ["pause", "look", "hopOut"],
  graze: ["pause", "graze", "look", "hopOut"],
  sniff: ["pause", "sniff", "look", "hopOut"],
  inspect: ["pause", "inspect", "look", "hopOut"],
};

/** Two-link hind-leg IK: ankle directly under the hip at `ankleH + lift`, foot pitched `toeDown` (positive = toes down). */
export function legIK(hipH: number, lift: number, toeDown: number) {
  const { thigh: L1, shin: L2, ankleH: a, toe } = ROO;
  const td = clamp(toeDown, 0, 0.9);
  const eff = Math.max(lift, a * Math.cos(td) + toe * Math.sin(td) - a, 0);
  const d = clamp(hipH - (a + eff), 0.3, L1 + L2 - 0.005);
  const thigh = Math.acos(clamp((d * d + L1 * L1 - L2 * L2) / (2 * d * L1), -1, 1));
  const knee = Math.PI - Math.acos(clamp((L1 * L1 + L2 * L2 - d * d) / (2 * L1 * L2), -1, 1));
  return { thigh, knee, ankle: td + thigh - knee, hipH: d + a + eff, clearance: a + eff - a * Math.cos(td) - toe * Math.sin(td) };
}

function tailHeight(hipH: number, bodyPitch: number, a1: number, a2: number, a3: number) {
  const [l1, l2, l3] = ROO.tail;
  return hipH + ROO.tailBaseZ * Math.sin(bodyPitch) + l1 * Math.sin(a1) + l2 * Math.sin(a2) + l3 * Math.sin(a3);
}

export function createKangaroo(seed: number) {
  const rng: Rng = mulberry32(seed);
  const S: Smooth = { hipH: ROO.standHip, bodyPitch: 0.5, bodyYaw: 0, bodyRoll: 0, neckPitch: -0.15, headPitch: 0.05, headYaw: 0, headRoll: 0, armL: 0.45, armR: 0.45, elbowL: 1.2, elbowR: 1.2, tA1: -0.62, tA2: -0.45, tA3: -0.15, squash: 0, lift: 0, toeDown: 0 };
  const T: Smooth = { ...S };
  const earL: Ear = { yaw: 0.22, pitch: 0, ty: 0.22, tp: 0, next: 0.5, fast: false };
  const earR: Ear = { yaw: 0.22, pitch: 0, ty: 0.22, tp: 0, next: 1.1, fast: false };
  const pose: KangarooPose = {
    x: 0, z: STRIP.z0, y: GROUND_Y, heading: 0, squash: 0, hipH: ROO.standHip, thigh: 0, knee: 0, ankle: 0,
    bodyPitch: 0.5, bodyYaw: 0, bodyRoll: 0, neckPitch: 0, headPitch: 0, headYaw: 0, headRoll: 0,
    earLYaw: 0, earLPitch: 0, earRYaw: 0, earRPitch: 0, armL: 0, armR: 0, elbowL: 0, elbowR: 0, tail1: 0, tail2: 0, tail3: 0, footClear: 0, tailTip: 0,
  };
  const initialCooldown = range(rng, 5, 14);
  let stage: KangarooStage = "away", variant: KangarooVariant = "watch", lastVariant: KangarooVariant | null = null;
  let seq: KangarooStage[] = [], seqIdx = 0, stageT = 0, stageDur = 0;
  let cooldown = initialCooldown;
  let x = 0, z = (STRIP.z0 + STRIP.z1) / 2, arc = 0, heading = 0, headingTarget = 0, landT = 9;
  let hops: Hop[] = [], hopIdx = 0, hopT = 0, hopsAfter: "arrive" | "away" | "stage" = "arrive", flightV = -1;
  let beat = "down", beatT = 0, beatDur = 2, tilt = 1, tiltT = 0, playful = false, acc = 0, clock = 0;
  const self = {
    pose, initialCooldown, cooldownLog: [] as number[], visits: 0, hopsLanded: 0, consumedSummon: false,
    get stage() { return stage; }, get variant() { return variant; }, get active() { return stage !== "away"; }, get time() { return clock; },
    get hopping() { return stage !== "away" && hopIdx < hops.length; },
    step(dtIn: number, input: KangarooInput) {
      acc += clamp(dtIn, 0, MAX_DT);
      self.consumedSummon = false;
      while (acc >= SUBSTEP) { acc -= SUBSTEP; clock += SUBSTEP; update(SUBSTEP, input); }
      compose();
      return pose;
    },
  };

  const stripZ = () => range(rng, STRIP.z0 + 0.05, STRIP.z1 - 0.05);
  function buildHops(x0: number, z0: number, x1: number, z1: number, maxLen: number, fast: boolean): Hop[] {
    const dist = Math.hypot(x1 - x0, z1 - z0);
    const n = Math.max(1, Math.ceil(dist / maxLen));
    const out: Hop[] = [];
    for (let i = 0; i < n; i++) {
      const ph = fast ? range(rng, 0.38, 0.52) : range(rng, 0.28, 0.5);
      const zEnd = i === n - 1 ? z1 : clamp(lerp(z0, z1, (i + 1) / n) + range(rng, -0.1, 0.1), Math.min(z0, z1, STRIP.z0), Math.max(z0, z1, STRIP.z1));
      const zStart = i === 0 ? z0 : out[i - 1].z1;
      out.push({ x0: lerp(x0, x1, i / n), z0: zStart, x1: lerp(x0, x1, (i + 1) / n), z1: zEnd, ph, tg: range(rng, 0.07, 0.15), tf: Math.sqrt((8 * ph) / GRAVITY) });
    }
    return out;
  }
  function startHops(list: Hop[], after: typeof hopsAfter) { hops = list; hopIdx = 0; hopT = 0; hopsAfter = after; }
  const stageDuration = (s: KangarooStage) => s === "pause" ? range(rng, 1, 2.2) : s === "look" ? (variant === "watch" ? range(rng, 4, 6.5) : range(rng, 2, 3.2)) : s === "graze" ? range(rng, 7, 11) : s === "sniff" ? range(rng, 4, 6.5) : s === "inspect" ? range(rng, 6.5, 8.5) : 0;

  function beginVisit(forced: boolean) {
    self.visits++;
    if (forced) variant = "inspect";
    else {
      const choices: KangarooVariant[] = ["watch", "watch", "graze", "sniff", "inspect"].filter((v) => v !== lastVariant) as KangarooVariant[];
      variant = pick(rng, choices);
    }
    lastVariant = variant;
    seq = SEQUENCES[variant]; seqIdx = -1;
    const side = pick(rng, [-1, 1]);
    const x0 = side * (forced ? range(rng, 9, 11) : range(rng, 24, 30)), z0 = stripZ();
    const spot = variant === "inspect" ? INSPECT_SPOT : { x: range(rng, -9, 9), z: stripZ() };
    x = x0; z = z0; heading = side > 0 ? -Math.PI / 2 : Math.PI / 2;
    stage = "hopIn";
    startHops(buildHops(x0, z0, spot.x, spot.z, range(rng, 1.9, 2.6), forced), "arrive");
  }
  function redirectToInspect() {
    variant = "inspect"; lastVariant = variant; seq = SEQUENCES.inspect; seqIdx = -1; playful = false;
    const midHop = hopIdx < hops.length;
    const fromX = midHop ? hops[hopIdx].x1 : x, fromZ = midHop ? hops[hopIdx].z1 : z;
    const path = buildHops(fromX, fromZ, INSPECT_SPOT.x, INSPECT_SPOT.z, 2.2, true);
    stage = "hopIn";
    if (midHop) { hops = [hops[hopIdx], ...path]; hopIdx = 0; hopsAfter = "arrive"; }
    else startHops(path, "arrive");
  }
  function enterStage(next: KangarooStage) {
    stage = next; stageT = 0; stageDur = stageDuration(next);
    beat = "down"; beatT = 0; beatDur = range(rng, 1.6, 3); tiltT = 0; playful = false;
    if (next === "hopOut") {
      const side = pick(rng, [-1, 1]);
      startHops(buildHops(x, z, side * range(rng, 24, 30), stripZ(), range(rng, 1.9, 2.6), false), "away");
    }
  }
  function nextStage() {
    seqIdx++;
    enterStage(seq[Math.min(seqIdx, seq.length - 1)]);
  }
  function goAway() {
    stage = "away"; hops = []; hopIdx = 0;
    cooldown = range(rng, COOLDOWN_RANGE.min, COOLDOWN_RANGE.max);
    self.cooldownLog.push(cooldown);
  }
  function azimuthTo(px: number, pz: number, fallback: number) {
    const dx = px - x, dz = pz - z;
    return Math.hypot(dx, dz) < 0.6 ? fallback : Math.atan2(dx, dz);
  }

  function earUpdate(e: Ear, h: number, side: 1 | -1, mode: string, azRel: number) {
    e.next -= h;
    if (e.next <= 0) {
      e.fast = false;
      const twitch = rng() < 0.28;
      if (mode === "forward") { e.ty = 0.08; e.tp = 0.42 + range(rng, -0.05, 0.08); e.next = range(rng, 0.7, 1.6); }
      else if (mode === "flat") { e.ty = 0.1; e.tp = -0.5; e.next = 0.2; }
      else if (mode === "attend") {
        const lead = (side > 0) === (azRel >= 0); // the ear on the visitor's side points at them, the other roams
        if (lead) { e.ty = 0.05; e.tp = 0.38; } else { e.ty = range(rng, 0.1, 0.5); e.tp = range(rng, -0.35, 0.1); }
        e.next = range(rng, 0.5, 1.5);
      } else { e.ty = 0.22 + range(rng, -0.12, 0.2); e.tp = range(rng, -0.12, 0.18); e.next = range(rng, 0.8, 2.6); }
      if (twitch && mode !== "flat") { e.ty += 0.35; e.tp -= 0.28; e.next = 0.14; e.fast = true; }
    }
    e.yaw = approach(e.yaw, e.ty, e.fast ? 26 : 9, h);
    e.pitch = approach(e.pitch, e.tp, e.fast ? 26 : 9, h);
  }

  function setTargets(h: number, input: KangarooInput) {
    const t = clock;
    const vAz = azimuthTo(input.visitor.x, input.visitor.z, heading);
    T.hipH = ROO.standHip; T.bodyPitch = 0.5; T.bodyYaw = 0; T.bodyRoll = 0; T.neckPitch = -0.15; T.headPitch = 0.05; T.headYaw = 0; T.headRoll = 0;
    T.armL = T.armR = 0.45; T.elbowL = T.elbowR = 1.2; T.tA1 = -0.62; T.tA2 = -0.45; T.tA3 = -0.15; T.squash = 0; T.lift = 0; T.toeDown = 0;
    let earMode = "scan";
    beatT += h; stageT += h; tiltT += h;
    if (tiltT > 1.1) { tiltT = 0; tilt = -tilt; }
    switch (stage) {
      case "pause":
        T.headYaw = 0.35 * Math.sin(t * 0.9); T.headPitch = 0.02 + 0.06 * Math.sin(t * 1.3);
        break;
      case "look": {
        headingTarget = vAz; earMode = "attend";
        const rel = wrapAngle(vAz - heading);
        T.headYaw = clamp(rel, -0.9, 0.9); T.headRoll = 0.3 * tilt * smooth(stageT / 0.8); T.headPitch = -0.02 + 0.04 * Math.sin(t * 2);
        T.bodyPitch = 0.42; T.hipH = 0.77; T.neckPitch = -0.2;
        if (rng() < h * 0.4) { T.headPitch = -0.12; }
        break;
      }
      case "graze": {
        headingTarget = heading; earMode = "relaxed";
        if (beatT > beatDur) { beatT = 0; beat = beat === "down" ? (rng() < 0.45 ? "scratch" : "alert") : "down"; beatDur = beat === "down" ? range(rng, 2.2, 3.8) : beat === "alert" ? range(rng, 0.9, 1.5) : range(rng, 1.4, 2.1); }
        if (beat === "down") {
          T.bodyPitch = 1.0; T.hipH = 0.52; T.neckPitch = 0.4; T.headPitch = 0.75 + 0.1 * Math.sin(t * 5.5); T.armL = T.armR = 1.05; T.elbowL = T.elbowR = 0.5;
          T.tA1 = -0.5; T.tA2 = -0.3; T.tA3 = -0.05; T.headYaw = 0.1 * Math.sin(t * 0.7);
        } else if (beat === "alert") {
          T.bodyPitch = 0.62; T.hipH = 0.66; T.neckPitch = -0.1; T.headPitch = -0.1; earMode = "forward"; T.headYaw = clamp(wrapAngle(vAz - heading), -0.8, 0.8);
        } else {
          T.bodyPitch = 0.55; T.hipH = 0.7; T.armL = 1.5; T.elbowL = 2.2 + 0.25 * Math.sin(t * 14); T.armR = 0.4; T.headYaw = -0.45; T.headPitch = 0.3; T.headRoll = 0.2;
        }
        break;
      }
      case "sniff": {
        headingTarget = heading; earMode = "scan";
        if (beatT > beatDur) { beatT = 0; beat = beat === "down" ? "air" : "down"; beatDur = beat === "down" ? range(rng, 2, 3) : range(rng, 1.4, 2.2); }
        if (beat === "down") { T.bodyPitch = 0.85; T.hipH = 0.62; T.neckPitch = 0.3; T.headPitch = 0.45 + 0.2 * Math.sin(t * 9); T.headYaw = 0.5 * Math.sin(t * 1.4); T.armL = T.armR = 0.9; T.elbowL = T.elbowR = 0.7; T.tA1 = -0.55; T.tA2 = -0.35; }
        else { T.bodyPitch = 0.45; T.hipH = 0.78; T.neckPitch = -0.3; T.headPitch = -0.3 + 0.07 * Math.sin(t * 11); T.headYaw = 0.35 * Math.sin(t * 1.1); earMode = "forward"; }
        break;
      }
      case "inspect": {
        headingTarget = azimuthTo(DOOR_POINT.x, DOOR_POINT.z, heading); earMode = "forward";
        const rise = smooth(stageT / 1.1), fall = smooth((stageDur - stageT) / 0.9);
        const k = Math.min(rise, fall);
        const lean = smooth((stageT - 1.1) / 1.0) * fall;
        // Rises on its tail, then leans toward the door and tilts its head from side to side.
        T.hipH = lerp(ROO.standHip, 0.84, k); T.bodyPitch = lerp(0.5, 0.2, k) + 0.2 * lean; T.neckPitch = lerp(-0.15, -0.35, k);
        T.tA1 = lerp(-0.62, -1.12, k); T.tA2 = lerp(-0.45, -0.95, k); T.tA3 = lerp(-0.15, -0.45, k);
        T.armL = lerp(0.45, 0.9, k); T.armR = lerp(0.45, 0.8, k); T.elbowL = T.elbowR = lerp(1.2, 1.6, k);
        T.headRoll = 0.38 * Math.sin(Math.max(0, stageT - 1.4) * 1.5) * k; T.headYaw = 0.2 * Math.sin(Math.max(0, stageT - 1.4) * 0.9) * k;
        T.headPitch = 0.05 + 0.1 * lean; T.bodyRoll = 0.08 * Math.sin(Math.max(0, stageT - 1.4) * 1.5) * k;
        break;
      }
      default: break;
    }
    // Ears: independent targets per ear. Flat while hopping.
    const rel = wrapAngle(vAz - heading);
    const mode = flightV >= 0 ? "flat" : earMode;
    earUpdate(earL, h, 1, mode, rel); earUpdate(earR, h, -1, mode, rel);
  }

  function update(h: number, input: KangarooInput) {
    if (stage === "away") {
      cooldown -= h;
      if (input.summon) { cooldown = Math.min(cooldown, 0.45); }
      if (cooldown <= 0) { const forced = input.summon; beginVisit(forced); if (forced) self.consumedSummon = true; }
      return;
    }
    if (input.summon && !(stage === "inspect" || (stage === "hopIn" && variant === "inspect"))) { redirectToInspect(); self.consumedSummon = true; }
    else if (input.summon) self.consumedSummon = true;

    flightV = -1; let hopping = false;
    if (hopIdx < hops.length) {
      hopping = true;
      let remaining = h;
      while (remaining > 0 && hopIdx < hops.length) {
        const hop = hops[hopIdx], total = hop.tg + hop.tf;
        const step = Math.min(remaining, total - hopT);
        hopT += step; remaining -= step;
        if (hopT >= total - 1e-9) { x = hop.x1; z = hop.z1; hopIdx++; hopT = 0; landT = 0; self.hopsLanded++; }
      }
      if (hopIdx < hops.length) {
        const hop = hops[hopIdx];
        headingTarget = Math.atan2(hop.x1 - hop.x0, hop.z1 - hop.z0);
        if (hopT >= hop.tg) { flightV = (hopT - hop.tg) / hop.tf; const v = flightV; x = lerp(hop.x0, hop.x1, v); z = lerp(hop.z0, hop.z1, v); arc = 4 * hop.ph * v * (1 - v); }
        else { x = hop.x0; z = hop.z0; arc = 0; }
      } else {
        arc = 0;
        if (hopsAfter === "away") goAway();
        else if (hopsAfter === "arrive") nextStage();
        else nextStage();
        hopping = false;
      }
    } else { arc = 0; landT += h; }
    if ((stage as KangarooStage) === "away") return;
    if (!hopping) {
      if (stage !== "hopIn" && stage !== "hopOut" && stageDur > 0 && stageT >= stageDur) {
        if (stage === "look" && variant === "watch" && !playful) {
          playful = true;
          const dir = pick(rng, [-1, 1]);
          startHops([{ x0: x, z0: z, x1: clamp(x + dir * 0.8, -40, 40), z1: clamp(z + range(rng, -0.12, 0.12), STRIP.z0, STRIP.z1), ph: 0.4, tg: 0.18, tf: Math.sqrt((8 * 0.4) / GRAVITY) }], "stage");
        } else { playful = false; nextStage(); }
      }
    }
    setTargets(h, input);
    // Smooth the pose toward targets; hops drive their own analytic values.
    const rate = hopping ? 20 : 5.5;
    for (const key of ["hipH", "bodyPitch", "bodyYaw", "bodyRoll", "neckPitch", "headPitch", "headYaw", "headRoll", "armL", "armR", "elbowL", "elbowR", "tA1", "tA2", "tA3"] as const) {
      S[key] = approach(S[key], T[key], key === "headYaw" || key === "headPitch" ? 7 : rate, h);
    }
    if (hopping) {
      const hop = hops[Math.min(hopIdx, hops.length - 1)];
      if (flightV >= 0) {
        const v = flightV, s = Math.sin(Math.PI * v);
        T.squash = 0.06 * (1 - s); T.lift = 0.1 * s; T.toeDown = Math.min(0.5, arc * 2.2);
        S.hipH = lerp(0.8, 0.62, s); S.bodyPitch = lerp(0.65, 1.1, Math.pow(s, 0.7)); S.neckPitch = lerp(-0.1, 0.1, s);
        S.tA1 = lerp(-0.7, -0.05, s) + 0.1 * (v > 0.5 ? v - 0.5 : 0); S.tA2 = lerp(-0.45, -0.02, s); S.tA3 = lerp(-0.2, 0.05, s);
        S.armL = S.armR = lerp(0.5, 0.9, s); S.elbowL = S.elbowR = lerp(1.3, 1.7, s);
        S.squash = T.squash; S.lift = T.lift; S.toeDown = T.toeDown;
      } else {
        const u = clamp(hopT / hop.tg, 0, 1), s = Math.sin(Math.PI * u);
        S.squash = -0.1 * s; S.lift = 0; S.toeDown = 0;
        S.hipH = lerp(ROO.standHip, 0.56, s) + (u > 0.7 ? 0.2 * (u - 0.7) / 0.3 : 0); S.bodyPitch = lerp(S.bodyPitch, 0.75, s * 0.4);
      }
    } else {
      if (landT < 0.05) S.squash = -0.08;
      S.squash = approach(S.squash, 0, 9, h); S.lift = approach(S.lift, 0, 20, h); S.toeDown = approach(S.toeDown, 0, 20, h);
    }
    heading += wrapAngle(headingTarget - heading) * (1 - Math.exp(-(hopping ? 9 : 3.2) * h));
    heading = wrapAngle(heading);
  }

  function compose() {
    const ik = legIK(S.hipH, S.lift, S.toeDown);
    const squash = clamp(S.squash, -0.2, 0.2);
    let a1 = S.tA1, a2 = S.tA2, a3 = S.tA3;
    // Keep the tail tip off the ground (scaled by squash and lifted by the hop arc).
    for (let i = 0; i < 24 && (tailHeight(ik.hipH, S.bodyPitch, a1, a2, a3) * (1 + squash) + arc < 0.02); i++) { a1 += 0.05; a2 += 0.05; a3 += 0.04; }
    pose.x = x; pose.z = z; pose.y = GROUND_Y + arc; pose.heading = heading;
    pose.squash = squash; pose.hipH = ik.hipH; pose.thigh = ik.thigh; pose.knee = ik.knee; pose.ankle = ik.ankle;
    pose.bodyPitch = S.bodyPitch; pose.bodyYaw = S.bodyYaw; pose.bodyRoll = S.bodyRoll;
    pose.neckPitch = S.neckPitch; pose.headPitch = S.headPitch; pose.headYaw = S.headYaw; pose.headRoll = S.headRoll;
    pose.earLYaw = earL.yaw; pose.earLPitch = earL.pitch; pose.earRYaw = earR.yaw; pose.earRPitch = earR.pitch;
    pose.armL = S.armL; pose.armR = S.armR; pose.elbowL = S.elbowL; pose.elbowR = S.elbowR;
    pose.tail1 = a1 - S.bodyPitch; pose.tail2 = a2 - a1; pose.tail3 = a3 - a2;
    pose.footClear = arc + (1 + squash) * ik.clearance;
    pose.tailTip = arc + (1 + squash) * tailHeight(ik.hipH, S.bodyPitch, a1, a2, a3);
  }
  compose();
  return self;
}
export type Kangaroo = ReturnType<typeof createKangaroo>;
