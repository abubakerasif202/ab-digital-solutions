// The cinematic arrival as pure keyframes: street -> entrance -> kangaroo moment -> door -> reception.
// Time is wall-clock seconds since the arrival began, so a slow GPU shortens frames, not the film.
export type Vec3 = [number, number, number];
export type Pose = { position: Vec3; target: Vec3; fov: number };
type Key = { t: number; p: Vec3; l: Vec3; fov?: number };

export const ARRIVAL_SECONDS = 14;
export const SUMMON_KANGAROO_AT = 0.8;
export const GREET_AT = 12.2;

const desktop: Key[] = [
  { t: 0, p: [-23, 2, 17.3], l: [-6, 8, -70] },
  { t: 4.2, p: [-10, 2.2, 17.2], l: [-3, 5.2, -50] },
  { t: 7, p: [-1.4, 2.05, 13.6], l: [-.5, 3.7, 9] },
  { t: 9, p: [-.9, 1.8, 12.2], l: [-3.4, 1.05, 11.3] },
  { t: 11.2, p: [-.5, 1.72, 8.6], l: [-3.2, 1.6, 3.6] },
  { t: ARRIVAL_SECONDS, p: [-1.4, 1.62, 6.6], l: [-5.8, 1.4, 2.9] },
];
const portrait: Key[] = [
  { t: 0, p: [-21, 2, 17.5], l: [-14, 7, -70], fov: 88 },
  { t: 4.2, p: [-8.5, 2.1, 16], l: [-2.5, 4.4, -50], fov: 80 },
  { t: 7, p: [-1, 2, 14.2], l: [-.5, 3.4, 9], fov: 80 },
  { t: 9, p: [-.7, 1.75, 12.6], l: [-2.9, 1.1, 11.2], fov: 80 },
  { t: 11.2, p: [-.5, 1.75, 9.6], l: [-3.5, 1.7, 3.5], fov: 80 },
  { t: ARRIVAL_SECONDS, p: [-.5, 1.8, 8.2], l: [-5, 1.9, 3], fov: 80 },
];

const mix = (a: number, b: number, u: number) => a + (b - a) * u;
const vec = (a: Vec3, b: Vec3, u: number): Vec3 => [mix(a[0], b[0], u), mix(a[1], b[1], u), mix(a[2], b[2], u)];
// Catmull-Rom through four knots for continuous velocity between shots.
function spline(p0: Vec3, p1: Vec3, p2: Vec3, p3: Vec3, u: number): Vec3 {
  const u2 = u * u, u3 = u2 * u;
  const axis = (i: number) => .5 * (2 * p1[i] + (-p0[i] + p2[i]) * u + (2 * p0[i] - 5 * p1[i] + 4 * p2[i] - p3[i]) * u2 + (-p0[i] + 3 * p1[i] - 3 * p2[i] + p3[i]) * u3);
  return [axis(0), axis(1), axis(2)];
}
const ease = (u: number) => u * u * (3 - 2 * u);

export function arrivalPose(seconds: number, isPortrait: boolean, fovDefault = 42): Pose {
  const keys = isPortrait ? portrait : desktop;
  const t = Math.max(0, Math.min(ARRIVAL_SECONDS, seconds));
  let i = 0;
  while (i < keys.length - 2 && t > keys[i + 1].t) i++;
  const a = keys[i], b = keys[i + 1];
  const u = ease(Math.max(0, Math.min(1, (t - a.t) / (b.t - a.t))));
  const before = keys[Math.max(0, i - 1)], after = keys[Math.min(keys.length - 1, i + 2)];
  return {
    position: spline(before.p, a.p, b.p, after.p, u),
    target: spline(before.l, a.l, b.l, after.l, u),
    fov: mix(a.fov ?? fovDefault, b.fov ?? fovDefault, u),
  };
}
export const arrivalEnd = (isPortrait: boolean) => (isPortrait ? portrait : desktop).at(-1)!;
export { vec as lerpVec };
