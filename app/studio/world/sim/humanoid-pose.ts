// Pure joint-angle model shared by every animated person in the studio. No three/React imports, so
// node tests and the behaviour state machines can use it; humanoid.tsx applies it to a joint rig.
// Character frame: front = +z, up = +y, the character's left = +x. Angles are radians. Positive
// pitch = flex forward (arms/thighs forward, spine lean forward, head/neck look down, knee shin
// back, ankle toes down); positive roll = away from the midline (limbs) or toward the character's
// left (spine/neck/head/hips); positive yaw = turn toward the character's left (shoulder yaw is
// internal rotation, swinging the forearm across the chest). Poses are mutable scratch objects so
// per-frame ticks allocate nothing.
export const BODY = {
  hipY: 0.92, hipX: 0.095, thigh: 0.43, shin: 0.42, ankleH: 0.07,
  spineY: 0.06, shoulderX: 0.2, shoulderY: 0.38, neckY: 0.44, headY: 0.07, headCenterY: 0.09,
  upperArm: 0.29, foreArm: 0.26, hand: 0.09,
} as const;

const ARM_KEYS = ["ShoulderPitch", "ShoulderRoll", "ShoulderYaw", "Elbow", "WristPitch", "WristYaw"] as const;
const LEG_KEYS = ["HipPitch", "HipRoll", "HipYaw", "Knee", "Ankle"] as const;
export type Side = "l" | "r";
type LimbKey = `${Side}${(typeof ARM_KEYS)[number] | (typeof LEG_KEYS)[number]}`;
type CoreKey = "rootX" | "rootLift" | "rootZ" | "rootYaw" | "rootY" | "hipsYaw" | "hipsRoll" | "spinePitch" | "spineYaw" | "spineRoll"
  | "neckPitch" | "neckYaw" | "neckRoll" | "headPitch" | "headYaw" | "headRoll" | "blink" | "smile" | "brow";
export type PoseKey = CoreKey | LimbKey;
export type Pose = Record<PoseKey, number>;
export type Vec3 = [number, number, number];

const CORE_KEYS: CoreKey[] = ["rootX", "rootLift", "rootZ", "rootYaw", "rootY", "hipsYaw", "hipsRoll", "spinePitch", "spineYaw", "spineRoll",
  "neckPitch", "neckYaw", "neckRoll", "headPitch", "headYaw", "headRoll", "blink", "smile", "brow"];
export const POSE_KEYS: PoseKey[] = [...CORE_KEYS, ...(["l", "r"] as const).flatMap((s) => [...ARM_KEYS, ...LEG_KEYS].map((k) => `${s}${k}` as LimbKey))];

export const clamp = (v: number, lo: number, hi: number) => (v < lo ? lo : v > hi ? hi : v);
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const smooth = (t: number) => { const c = clamp(t, 0, 1); return c * c * (3 - 2 * c); };
/** Frame-rate independent ease toward a target. */
export const approach = (current: number, target: number, rate: number, dt: number) => current + (target - current) * (1 - Math.exp(-rate * dt));
export const wrapAngle = (a: number) => { let v = a % (Math.PI * 2); if (v > Math.PI) v -= Math.PI * 2; else if (v < -Math.PI) v += Math.PI * 2; return v; };

export function resetPose(p: Pose): Pose {
  for (const key of POSE_KEYS) p[key] = 0;
  p.lShoulderRoll = p.rShoulderRoll = 0.09;
  p.lElbow = p.rElbow = 0.2;
  p.lShoulderPitch = p.rShoulderPitch = 0.03;
  p.lHipRoll = p.rHipRoll = 0.02;
  return p;
}
export function createPose(): Pose { return resetPose({} as Pose); }
export function copyPose(out: Pose, src: Pose): Pose { for (const key of POSE_KEYS) out[key] = src[key]; return out; }
export function blendPose(out: Pose, a: Pose, b: Pose, w: number): Pose {
  for (const key of POSE_KEYS) out[key] = a[key] + (b[key] - a[key]) * w;
  return out;
}

// ---- forward kinematics (3x3 row-major matrices) ----
type M3 = number[];
const mul = (a: M3, b: M3): M3 => {
  const o = new Array<number>(9);
  for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) o[r * 3 + c] = a[r * 3] * b[c] + a[r * 3 + 1] * b[3 + c] + a[r * 3 + 2] * b[6 + c];
  return o;
};
const rx = (a: number): M3 => { const c = Math.cos(a), s = Math.sin(a); return [1, 0, 0, 0, c, -s, 0, s, c]; };
const ry = (a: number): M3 => { const c = Math.cos(a), s = Math.sin(a); return [c, 0, s, 0, 1, 0, -s, 0, c]; };
const rz = (a: number): M3 => { const c = Math.cos(a), s = Math.sin(a); return [c, -s, 0, s, c, 0, 0, 0, 1]; };
const xyz = (x: number, y: number, z: number) => mul(mul(rx(x), ry(y)), rz(z)); // three.js Euler "XYZ"
const yxz = (x: number, y: number, z: number) => mul(mul(ry(y), rx(x)), rz(z)); // three.js Euler "YXZ"
const apply = (m: M3, x: number, y: number, z: number): Vec3 => [m[0] * x + m[1] * y + m[2] * z, m[3] * x + m[4] * y + m[5] * z, m[6] * x + m[7] * y + m[8] * z];
const add = (a: Vec3, b: Vec3): Vec3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];

/** Euler angles applied to each joint group; humanoid.tsx uses these so the render matches the FK. */
export const jointEuler = {
  hips: (p: Pose): Vec3 => [0, p.hipsYaw, -p.hipsRoll],
  spine: (p: Pose): Vec3 => [p.spinePitch, p.spineYaw, -p.spineRoll],
  neck: (p: Pose): Vec3 => [p.neckPitch, p.neckYaw, -p.neckRoll],
  head: (p: Pose): Vec3 => [p.headPitch, p.headYaw, -p.headRoll],
  shoulder: (p: Pose, s: Side): Vec3 => { const m = s === "l" ? 1 : -1; return [-p[`${s}ShoulderPitch`], -m * p[`${s}ShoulderYaw`], m * p[`${s}ShoulderRoll`]]; },
  hip: (p: Pose, s: Side): Vec3 => { const m = s === "l" ? 1 : -1; return [-p[`${s}HipPitch`], -m * p[`${s}HipYaw`], m * p[`${s}HipRoll`]]; },
};

export type Landmarks = {
  head: Vec3; chin: Vec3; headForward: Vec3;
  shoulder: Record<Side, Vec3>; elbow: Record<Side, Vec3>; hand: Record<Side, Vec3>;
  knee: Record<Side, Vec3>; ankle: Record<Side, Vec3>; sole: Record<Side, number>;
};

/** Character-frame joint positions (metres, floor = 0, ignoring rootX/Z/Lift/Yaw). `hand` is the palm centre. */
export function landmarks(p: Pose, scale = 1): Landmarks {
  const B = BODY;
  const hips: Vec3 = [0, B.hipY * scale + p.rootY, 0];
  const Rh = mul(ry(p.hipsYaw), rz(-p.hipsRoll));
  const spineO = add(hips, apply(Rh, 0, B.spineY * scale, 0));
  const e = jointEuler.spine(p);
  const Rs = mul(Rh, yxz(e[0], e[1], e[2]));
  const neckO = add(spineO, apply(Rs, 0, B.neckY * scale, 0));
  const en = jointEuler.neck(p);
  const Rn = mul(Rs, yxz(en[0], en[1], en[2]));
  const headO = add(neckO, apply(Rn, 0, B.headY * scale, 0));
  const eh = jointEuler.head(p);
  const Rhd = mul(Rn, yxz(eh[0], eh[1], eh[2]));
  const out = {
    head: add(headO, apply(Rhd, 0, B.headCenterY * scale, 0)), chin: add(headO, apply(Rhd, 0, -0.02 * scale, 0.075 * scale)),
    headForward: apply(Rhd, 0, 0, 1),
    shoulder: {} as Record<Side, Vec3>, elbow: {} as Record<Side, Vec3>, hand: {} as Record<Side, Vec3>,
    knee: {} as Record<Side, Vec3>, ankle: {} as Record<Side, Vec3>, sole: {} as Record<Side, number>,
  } as Landmarks;
  for (const s of ["l", "r"] as const) {
    const m = s === "l" ? 1 : -1;
    const sh = add(spineO, apply(Rs, m * B.shoulderX * scale, B.shoulderY * scale, 0));
    const a = jointEuler.shoulder(p, s);
    const Rsh = mul(Rs, xyz(a[0], a[1], a[2]));
    const el = add(sh, apply(Rsh, 0, -B.upperArm * scale, 0));
    const Re = mul(Rsh, rx(-p[`${s}Elbow`]));
    const wr = add(el, apply(Re, 0, -B.foreArm * scale, 0));
    const Rw = mul(mul(Re, rx(-p[`${s}WristPitch`])), rz(m * p[`${s}WristYaw`]));
    out.shoulder[s] = sh; out.elbow[s] = el;
    out.hand[s] = add(wr, apply(Rw, 0, -B.hand * 0.5 * scale, 0));
    const h = jointEuler.hip(p, s);
    const hipO = add(hips, apply(Rh, m * B.hipX * scale, 0, 0));
    const Rt = mul(Rh, xyz(h[0], h[1], h[2]));
    const kn = add(hipO, apply(Rt, 0, -B.thigh * scale, 0));
    const an = add(kn, apply(mul(Rt, rx(p[`${s}Knee`])), 0, -B.shin * scale, 0));
    out.knee[s] = kn; out.ankle[s] = an; out.sole[s] = an[1] - B.ankleH * scale;
  }
  return out;
}

/** Drop the hips so the lower foot rests exactly on the floor (walking/standing). */
export function groundFeet(p: Pose, scale = 1): Pose {
  p.rootY = 0;
  const lm = landmarks(p, scale);
  p.rootY = -Math.min(lm.sole.l, lm.sole.r);
  return p;
}

// ---- presets ----
export function legsStanding(p: Pose, shift = 0) {
  p.lHipPitch = p.rHipPitch = 0; p.lKnee = p.rKnee = 0.02; p.lAnkle = p.rAnkle = 0;
  p.hipsRoll = shift * 0.035; p.lHipRoll = 0.03 + Math.max(0, shift) * 0.05; p.rHipRoll = 0.03 + Math.max(0, -shift) * 0.05;
  p.rootY = -Math.abs(shift) * 0.012;
}
export const SEAT_DROP = -0.35;
export function legsSeated(p: Pose, drop = SEAT_DROP) {
  p.rootY = drop;
  p.lHipPitch = p.rHipPitch = 1.42; p.lKnee = p.rKnee = 1.42; p.lAnkle = p.rAnkle = 0;
  p.lHipRoll = p.rHipRoll = 0.1; p.lHipYaw = p.rHipYaw = 0;
}
export function poseStanding(p: Pose, t: number, shift = 0): Pose {
  resetPose(p);
  legsStanding(p, shift);
  const breath = Math.sin(t * 1.7);
  p.spinePitch = 0.012 * breath; p.lShoulderRoll = p.rShoulderRoll = 0.09 + 0.012 * breath;
  p.lShoulderPitch = p.rShoulderPitch = 0.04 + 0.01 * Math.sin(t * 0.9);
  return p;
}

/** Walking cycle; `phase` in radians, one full turn = left+right step. gait 0..1 scales stride. Feet are grounded. */
export function poseWalk(p: Pose, phase: number, gait = 1, scale = 1): Pose {
  resetPose(p);
  const g = clamp(gait, 0, 1), amp = 0.12 + 0.34 * g;
  for (const [s, off] of [["l", 0], ["r", Math.PI]] as const) {
    const a = phase + off, sinA = Math.sin(a), cosA = Math.cos(a);
    p[`${s}HipPitch`] = amp * sinA;
    p[`${s}Knee`] = 0.06 + (0.1 + 0.62 * g) * Math.max(0, cosA) ** 1.4;
    p[`${s}Ankle`] = 0.28 * g * Math.max(0, -sinA) - 0.16 * g * Math.max(0, sinA);
    p[`${s}HipRoll`] = 0.03;
    const swing = (s === "l" ? -1 : 1) * 0.42 * g * sinA; // arms oppose the same-side leg
    p[`${s}ShoulderPitch`] = 0.05 + swing;
    p[`${s}Elbow`] = 0.22 + 0.2 * g * Math.max(0, s === "l" ? -sinA : sinA);
  }
  const twist = Math.sin(phase);
  p.hipsYaw = 0.1 * g * twist; p.spineYaw = -0.16 * g * twist; p.headYaw = 0.06 * g * twist;
  p.hipsRoll = 0.025 * g * Math.cos(phase); p.spineRoll = -0.02 * g * Math.cos(phase);
  p.spinePitch = 0.04 + 0.03 * g;
  p.headPitch = -0.02;
  return groundFeet(p, scale);
}

/** Typing motion for hands over a keyboard; `gain` 0..1 scales finger/wrist activity. */
export function poseSeatedTyping(p: Pose, t: number, gain: number, kb: { y: number; z: number } = { y: 0.69, z: 0.4 }): Pose {
  resetPose(p);
  legsSeated(p);
  p.spinePitch = 0.07; p.headPitch = 0.16;
  for (const s of ["l", "r"] as const) {
    const m = s === "l" ? 1 : -1;
    const ph = s === "l" ? 0 : 1.9;
    const tap = gain * (Math.sin(t * 25 + ph) * 0.5 + Math.sin(t * 17.3 + ph * 2) * 0.5);
    p[`${s}ShoulderPitch`] = 0.3 + (kb.z - 0.4) * 0.5; p[`${s}ShoulderRoll`] = 0.05; p[`${s}ShoulderYaw`] = 0.18;
    p[`${s}Elbow`] = 1.3 + (kb.y - 0.69) * 0.8 + 0.03 * tap; p[`${s}WristPitch`] = -0.28 + 0.07 * tap;
    p[`${s}WristYaw`] = m * 0.03 * tap + gain * 0.04 * Math.sin(t * 3.1 + ph);
  }
  return p;
}
export function poseSeatedRest(p: Pose): Pose {
  resetPose(p);
  legsSeated(p);
  p.spinePitch = 0.03;
  for (const s of ["l", "r"] as const) { p[`${s}ShoulderPitch`] = 0.55; p[`${s}ShoulderRoll`] = 0.06; p[`${s}Elbow`] = 1.25; p[`${s}ShoulderYaw`] = 0.35; p[`${s}WristPitch`] = -0.2; }
  return p;
}

/** Point an arm along a character-frame direction (unit-ish vector). */
export function armToward(p: Pose, s: Side, dx: number, dy: number, dz: number, elbow = 0.12) {
  const m = s === "l" ? 1 : -1;
  const len = Math.hypot(dx, dy, dz) || 1;
  const x = dx / len, y = dy / len, z = dz / len;
  p[`${s}ShoulderRoll`] = Math.asin(clamp(m * x, -0.99, 0.99));
  p[`${s}ShoulderPitch`] = Math.atan2(z, -y);
  p[`${s}ShoulderYaw`] = 0; p[`${s}Elbow`] = elbow; p[`${s}WristPitch`] = 0;
}
/** Review pose: hand to chin, head tilted, other arm folded across. */
export function poseReview(p: Pose, amount: number, s: Side = "r") {
  const a = smooth(amount), o: Side = s === "r" ? "l" : "r";
  p[`${s}ShoulderPitch`] = lerp(p[`${s}ShoulderPitch`], 1.1, a); p[`${s}ShoulderRoll`] = lerp(p[`${s}ShoulderRoll`], 0.4, a);
  p[`${s}ShoulderYaw`] = lerp(p[`${s}ShoulderYaw`], 1.1, a); p[`${s}Elbow`] = lerp(p[`${s}Elbow`], 2.3, a); p[`${s}WristPitch`] = lerp(p[`${s}WristPitch`], 0, a);
  p[`${o}ShoulderPitch`] = lerp(p[`${o}ShoulderPitch`], 0.35, a); p[`${o}ShoulderYaw`] = lerp(p[`${o}ShoulderYaw`], 0.7, a);
  p[`${o}Elbow`] = lerp(p[`${o}Elbow`], 1.5, a); p[`${o}ShoulderRoll`] = lerp(p[`${o}ShoulderRoll`], 0.03, a);
  p.headRoll = lerp(p.headRoll, s === "r" ? 0.14 : -0.14, a); p.headPitch = lerp(p.headPitch, 0.08, a);
}
/** Friendly wave with the character's right hand; `t` drives the hand rock, `amount` fades the raise in/out. */
export function poseWave(p: Pose, t: number, amount: number) {
  const a = smooth(amount);
  p.rShoulderPitch = lerp(p.rShoulderPitch, 1.6, a); p.rShoulderRoll = lerp(p.rShoulderRoll, 0.9, a);
  p.rShoulderYaw = lerp(p.rShoulderYaw, 0, a); p.rElbow = lerp(p.rElbow, 1.7, a);
  p.rWristYaw = lerp(p.rWristYaw, 0.45 * Math.sin(t * 9), a); p.rWristPitch = lerp(p.rWristPitch, 0, a);
  p.rShoulderYaw += 0.16 * Math.sin(t * 9 + 0.6) * a;
}
/** Turn head+neck (and a little spine) toward a character-frame yaw/pitch. `pitch` positive = look down. */
export function aimHead(p: Pose, yaw: number, pitch: number, weight = 1) {
  const y = clamp(yaw, -1.9, 1.9) * weight, pt = clamp(pitch, -0.7, 0.8) * weight;
  const spine = clamp(Math.abs(y) - 0.9, 0, 1) * Math.sign(y) * 0.35;
  p.spineYaw += spine; p.neckYaw += (y - spine) * 0.4; p.headYaw += (y - spine) * 0.6;
  p.neckPitch += pt * 0.35; p.headPitch += pt * 0.65;
}
