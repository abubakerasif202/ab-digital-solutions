/** A pose accent with zero velocity at both ends; it never advances a character clock. */
export function poseAccent(age: number, duration: number) {
  if (age <= 0 || age >= duration) return 0;
  const curve = Math.sin(Math.PI * age / duration);
  return curve * curve;
}

/** One accent at a seeded offset per interval; sampling it cannot perturb the simulation PRNG. */
export function idleAccent(time: number, seed: number, interval: number, duration: number) {
  const cycle = Math.floor(time / interval);
  const hash = Math.imul(cycle ^ seed, 0x45d9f3b);
  const unit = ((hash ^ (hash >>> 16)) >>> 0) / 0x100000000;
  const start = 1 + unit * (interval - duration - 2);
  return poseAccent(time - cycle * interval - start, duration);
}
