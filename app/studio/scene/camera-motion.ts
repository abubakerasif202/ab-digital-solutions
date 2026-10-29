// Quintic smootherstep: zero velocity and acceleration at both ends.
// Wall-clock duration remains bounded even when GPU frames are sparse.
export function cameraProgress(progress: number) {
  const t = Math.max(0, Math.min(1, progress));
  return t * t * t * (t * (t * 6 - 15) + 10);
}
