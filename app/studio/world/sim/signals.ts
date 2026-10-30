// Pure, deterministic traffic-signal cycle shared by Exterior (lamps), Traffic (stop/go) and
// Pedestrians (walk). Both vehicle directions share one phase; the crossing has its own.
// Owner of `worldState.walk`: Traffic.tsx writes it from this function each tick (documented there).
export const CYCLE = 24;
// [name, seconds]; sums to CYCLE.
const PHASES = [
  ["green", 8],
  ["amber", 3],
  ["clear", 1.5], // all red
  ["walk", 5],
  ["flash", 4], // flashing don't-walk: finish crossing, do not start
  ["hold", 2.5], // all red before vehicles are released
] as const;
export type PhaseName = (typeof PHASES)[number][0];
export type VehicleLight = "green" | "amber" | "red";
export type Signal = {
  phase: PhaseName;
  t: number; // seconds into the cycle
  phaseLeft: number;
  vehicle: VehicleLight;
  walk: boolean; // steady walk
  flashing: boolean; // flashing don't-walk (lamp on for the first half of each second)
  untilGreen: number; // seconds until vehicles are released again
  amberLeft: number;
};

export function signalAt(time: number): Signal {
  const t = ((time % CYCLE) + CYCLE) % CYCLE;
  let start = 0;
  for (const [phase, length] of PHASES) {
    if (t < start + length) {
      const vehicle: VehicleLight = phase === "green" ? "green" : phase === "amber" ? "amber" : "red";
      return {
        phase, t, phaseLeft: start + length - t, vehicle,
        walk: phase === "walk",
        flashing: phase === "flash",
        untilGreen: phase === "green" ? 0 : CYCLE - t,
        amberLeft: phase === "amber" ? start + length - t : 0,
      };
    }
    start += length;
  }
  throw new Error("unreachable signal phase");
}

/** Pedestrian lamp as drawn: walk (steady), dont-walk (flashing/steady red). */
export function pedestrianLamp(time: number): "walk" | "dont" | "off" {
  const s = signalAt(time);
  if (s.walk) return "walk";
  if (s.flashing) return time % 1 < 0.5 ? "dont" : "off";
  return "dont";
}

export const COMFORT_BRAKE = 3; // m/s^2 a driver will use to stop for amber

/**
 * May a vehicle whose front is `distanceToLine` metres before the stop line (negative once past it)
 * carry on at `speed` m/s? Green always; amber only when it cannot stop comfortably; red never
 * (unless already past the line).
 */
export function mayProceed(time: number, distanceToLine: number, speed: number): boolean {
  if (distanceToLine < 0.3) return true;
  const s = signalAt(time);
  if (s.vehicle === "green") return true;
  if (s.vehicle === "red") return false;
  const stopDistance = (speed * speed) / (2 * COMFORT_BRAKE);
  return distanceToLine < stopDistance && distanceToLine <= speed * s.amberLeft;
}
