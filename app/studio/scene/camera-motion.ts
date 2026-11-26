import { layout } from "../world/world-layout";

// Quintic smootherstep: zero velocity and acceleration at both ends.
// Wall-clock duration remains bounded even when GPU frames are sparse.
export function cameraProgress(progress: number) {
  const t = Math.max(0, Math.min(1, progress));
  return t * t * t * (t * (t * 6 - 15) + 10);
}

/** Sample the lens from the shot endpoints, not the prior rendered frame. */
export function cameraFov(from: number, to: number, progress: number) {
  return from + (to - from) * cameraProgress(progress);
}

/** Eye-level inside/outside shots must cross the facade at the existing opening. */
export function facadeWaypoint(from: readonly number[], to: readonly number[]): [number, number, number] | null {
  const { facadeZ, door } = layout;
  if ((from[2] - facadeZ) * (to[2] - facadeZ) >= 0 || Math.max(from[1], to[1]) >= 4.2) return null;
  return [door.x, Math.max(1.25, Math.min(door.height - .35, (from[1] + to[1]) / 2)), facadeZ];
}
/** Match the overlay's 400px maximum width and 24px right inset. */
export function panelFrameOffset(width: number, panelOpen: boolean, stacked: boolean) {
  return panelOpen && !stacked && width >= 700 ? (Math.min(400, width - 48) + 24) / (2 * width) : 0;
}

export function cameraFieldOfView(compact: boolean, portrait: boolean, wideInterior = false) {
  return compact ? (portrait ? 80 : 52) : wideInterior ? 54 : 42;
}

/** Frame-rate-independent exponential damping factor for smooth camera and object transitions. */
export function dampFactor(speed: number, deltaSeconds: number) {
  return 1 - Math.exp(-Math.max(0, speed) * Math.min(Math.max(0, deltaSeconds), 0.1));
}
