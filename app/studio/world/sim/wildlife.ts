// Pure data and behaviour for the resident wildlife: kangaroo, koala and sulphur-crested cockatoo.
// No three/React here, so everything is unit-testable and the scene components stay thin.
import { layout } from "../world-layout";

export type AnimalId = "kangaroo" | "koala" | "cockatoo";
export const animalOrder: AnimalId[] = ["kangaroo", "koala", "cockatoo"];

export type AnimalInfo = {
  id: AnimalId;
  name: string;
  /** One short personality line shown with the animal's name. */
  personality: string;
  /** Label of the keyboard-accessible interaction button. */
  action: string;
  /** What the animal does on interaction, for captions and screen readers. */
  reaction: string;
  /** Speech-bubble lines, rotated without immediate repeats. */
  lines: string[];
};

export const animals: Record<AnimalId, AnimalInfo> = {
  kangaroo: {
    id: "kangaroo",
    name: "Kangaroo",
    personality: "Confident, welcoming and a little cheeky. Runs the front step.",
    action: "Say g’day",
    reaction: "The kangaroo waves, tilts its head, then gives a small hop.",
    lines: ["Big ideas. Bigger hops.", "Hop in. Let’s build something.", "Just checking the website has bounce."],
  },
  koala: {
    id: "koala",
    name: "Koala",
    personality: "Relaxed and quietly witty. Conserves energy for good ideas.",
    action: "Wake the koala",
    reaction: "The koala wakes briefly, looks towards you and waves, then drifts back to sleep.",
    lines: ["Big dreams. Small energy budget.", "Fast sites. Slow afternoons.", "I only wake for a good brief."],
  },
  cockatoo: {
    id: "cockatoo",
    name: "Sulphur-crested cockatoo",
    personality: "Curious and expressive. Has opinions about everything.",
    action: "Greet the cockatoo",
    reaction: "The cockatoo raises its crest, bobs and flutters a short lap before settling back on the rail.",
    lines: ["Good design? Worth squawking about.", "Someone said launch?", "Is that a new project I smell?"],
  },
};

/** World positions (metres) of the three animals, and the footprint each must stay clear of. */
export const wildlifePlacement = {
  // Left of the entrance on the wildlife corridor of the footpath, clear of the pedestrian lane and the signal poles.
  kangaroo: { x: -2.5, z: 11.1 },
  // Eucalyptus planter beside the studio, left of the entrance and clear of the gallery glazing.
  koala: { x: -14.4, z: 11.25, perchY: 1.62 },
  // Brass railing against the shopfront, right of the door.
  cockatoo: { x: 2.4, z: 9.78, perchY: 1.2 },
} as const;

/** The rectangle the resident kangaroo may hop within (footpath y is `layout.footpath.y`). */
export const KANGAROO_ZONE = { x0: -3.7, x1: -1.3, z0: 11.0, z1: 11.3 } as const;

export type Circle = { x: number; z: number; r: number };
/** Fixed street furniture and walkways the animals must never intersect (bollards, door, pedestrian lane). */
export const wildlifeObstacles: { id: string; shape: "circle" | "rect"; x: number; z: number; r?: number; x0?: number; x1?: number; z0?: number; z1?: number }[] = [
  { id: "bollard-west", shape: "circle", x: 1.2, z: layout.footpath.z1 - 0.12, r: 0.2 },
  { id: "bollard-east", shape: "circle", x: 10.8, z: layout.footpath.z1 - 0.12, r: 0.2 },
  { id: "lamp-west", shape: "circle", x: -16, z: layout.footpath.z1 - 0.12, r: 0.2 },
  { id: "pedestrian-lane", shape: "rect", x: 0, z: 0, x0: -200, x1: 200, z0: layout.pedestrianLanes.z0, z1: layout.pedestrianLanes.z1 },
  { id: "bin-west", shape: "circle", x: -8, z: layout.footpath.z1 - 0.2, r: 0.4 },
];

/** True when a body of `radius` at (x,z) overlaps nothing in the obstacle list. */
export function footprintClear(x: number, z: number, radius: number): boolean {
  for (const o of wildlifeObstacles) {
    if (o.shape === "circle") { if (Math.hypot(x - o.x, z - o.z) < radius + (o.r ?? 0)) return false; }
    else if (x + radius > o.x0! && x - radius < o.x1! && z + radius > o.z0! && z - radius < o.z1!) return false;
  }
  return true;
}
export const inKangarooZone = (x: number, z: number) => x >= KANGAROO_ZONE.x0 && x <= KANGAROO_ZONE.x1 && z >= KANGAROO_ZONE.z0 && z <= KANGAROO_ZONE.z1;

/** Camera presets for each animal: used only after the visitor asks for them (never automatically). */
export type Shot = { position: [number, number, number]; target: [number, number, number] };
export const wildlifeShots: Record<AnimalId, Shot> = {
  kangaroo: { position: [0.7, 1.6, 16.4], target: [-2.5, 1.0, 11.1] },
  koala: { position: [-10.9, 1.85, 15.6], target: [-14.4, 1.55, 11.25] },
  cockatoo: { position: [-0.3, 1.7, 13.0], target: [2.4, 1.25, 9.78] },
};
export const mobileWildlifeShots: Record<AnimalId, Shot> = {
  kangaroo: { position: [0.3, 1.5, 15.8], target: [-2.5, 1.0, 11.1] },
  koala: { position: [-12.0, 1.8, 15.4], target: [-14.4, 1.55, 11.25] },
  cockatoo: { position: [-0.1, 1.6, 13.2], target: [2.4, 1.25, 9.78] },
};

/** Picks lines in a shuffled rotation: never the same line twice in a row, every line before a repeat. */
export function createLinePicker(lines: readonly string[], seed = 1) {
  let s = seed >>> 0 || 1;
  const rand = () => { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 4294967296; };
  let queue: string[] = [];
  let last = "";
  return () => {
    if (queue.length === 0) {
      queue = [...lines];
      for (let i = queue.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [queue[i], queue[j]] = [queue[j], queue[i]]; }
      if (queue.length > 1 && queue[queue.length - 1] === last) [queue[0], queue[queue.length - 1]] = [queue[queue.length - 1], queue[0]];
    }
    last = queue.pop()!;
    return last;
  };
}

/** Repeat-tap guard: true when at least `gapMs` has passed since `last`. */
export const cooldownReady = (last: number, now: number, gapMs: number) => last <= 0 || now - last >= gapMs;
export const REACTION_COOLDOWN_MS = 1800;
export const BUBBLE_MS = 5200;

/** Animation detail by camera distance and quality tier: 0 = frozen, 1 = coarse (body only), 2 = full. */
export function detailLevel(distance: number, tier: "low" | "medium" | "high"): 0 | 1 | 2 {
  const far = tier === "low" ? 24 : tier === "medium" ? 38 : 55;
  if (distance > far * 1.6) return 0;
  if (distance > far) return 1;
  return 2;
}

export const damp = (current: number, target: number, rate: number, dt: number) => current + (target - current) * (1 - Math.exp(-rate * dt));
const clamp = (v: number, lo: number, hi: number) => (v < lo ? lo : v > hi ? hi : v);
const smoothstep = (t: number) => { const c = clamp(t, 0, 1); return c * c * (3 - 2 * c); };
/** 0 → 1 → 0 bump over [start, end]. */
const bump = (t: number, start: number, end: number) => { const u = (t - start) / (end - start); return u <= 0 || u >= 1 ? 0 : Math.sin(Math.PI * u); };

/* ---------------- Koala ---------------- */
export type KoalaPose = { breath: number; eyeOpen: number; headPitch: number; headYaw: number; headRoll: number; armWave: number; earTwitch: number; bodyLean: number };
/**
 * `awakeFor` is seconds since the koala was woken (negative = asleep). It sleeps again 5 s after waking.
 * `visitorYaw` is the heading to the visitor relative to the koala's facing (radians).
 */
export function koalaPose(time: number, awakeFor: number, visitorYaw: number, reduced = false): KoalaPose {
  const breathSpeed = 1.5;
  const breath = Math.sin(time * breathSpeed) * 0.5 + 0.5;
  const sleepy = Math.sin(time * 0.35) * 0.5 + 0.5;
  const peek = reduced ? 0 : bump((time % 17), 15.2, 16.2) * 0.55; // a rare half-open eye while asleep
  const awake = awakeFor >= 0 && awakeFor < 5.4;
  const wake = awake ? smoothstep(awakeFor / 0.9) * (1 - smoothstep((awakeFor - 4.6) / 0.8)) : 0;
  const waveEnvelope = awake ? bump(awakeFor, 1.1, 3.9) : 0;
  const wave = reduced ? waveEnvelope * 0.6 : waveEnvelope * (0.7 + 0.3 * Math.sin(awakeFor * 9));
  return {
    breath,
    eyeOpen: clamp(peek + wake * (1 - 0.1 * Math.sin(time * 2.1)), 0, 1),
    headPitch: (1 - wake) * (0.28 + sleepy * 0.22) - wake * 0.08,
    headYaw: wake * clamp(visitorYaw, -0.9, 0.9),
    headRoll: (1 - wake) * (Math.sin(time * 0.35 + 1) * 0.12) + wake * Math.sin(time * 0.9) * 0.05,
    armWave: wave,
    earTwitch: reduced ? 0 : bump((time % 11), 8.6, 9.0) + wake * 0.2,
    bodyLean: (1 - wake) * 0.05,
  };
}

/* ---------------- Cockatoo ---------------- */
export type CockatooPose = {
  /** Offset from the perch: x/z in metres, y height; zero when perched. */
  dx: number; dy: number; dz: number; heading: number;
  bodyPitch: number; headRoll: number; headYaw: number; headPitch: number;
  crest: number; wingSpread: number; wingFlap: number; bob: number; flying: boolean;
};
export const FLIGHT_SECONDS = 1.7;
export const FLIGHT_RADIUS = 0.55;
export const FLIGHT_HEIGHT = 0.42;
/** Short safe lap: out toward the street, round and back to the exact perch; never beyond FLIGHT_RADIUS. */
export function cockatooFlightPath(u: number): { dx: number; dy: number; dz: number; heading: number } {
  const at = (p: number) => {
    const c = clamp(p, 0, 1);
    const angle = c * Math.PI * 2;
    const ease = Math.sin(Math.PI * c);
    // Only toward the street (+z), never back into the glass.
    return { dx: FLIGHT_RADIUS * Math.sin(angle) * ease, dz: FLIGHT_RADIUS * 0.5 * (1 - Math.cos(angle)) * ease, dy: FLIGHT_HEIGHT * Math.sin(Math.PI * c) };
  };
  const here = at(u), ahead = at(u + 0.02), behind = at(u - 0.02);
  return { ...here, heading: Math.atan2(ahead.dx - behind.dx, ahead.dz - behind.dz) };
}
/** `reactFor` is seconds since the reaction began (negative = idle). Reduced motion replaces the lap with a gentle crest-and-bow pose. */
export function cockatooPose(time: number, reactFor: number, reduced = false): CockatooPose {
  const reacting = reactFor >= 0 && reactFor < 3.4;
  const tiltCycle = Math.floor(time / 4.2);
  const tiltSign = tiltCycle % 2 === 0 ? 1 : -1;
  const tilt = bump(time % 4.2, 0.4, 1.9) * 0.5 * tiltSign;
  const crestIdle = bump(time % 9, 6.5, 8.0) * 0.8;
  const stretch = reduced ? 0 : bump(time % 26, 21, 22.6);
  const bowing = reacting ? bump(reactFor, 0.2, 1.6) : 0;
  const flightStart = 1.3;
  const inFlight = !reduced && reacting && reactFor >= flightStart && reactFor < flightStart + FLIGHT_SECONDS;
  const path = inFlight ? cockatooFlightPath((reactFor - flightStart) / FLIGHT_SECONDS) : { dx: 0, dy: 0, dz: 0, heading: 0 };
  const bobs = reacting && !reduced ? Math.max(0, Math.sin(reactFor * 11)) * bump(reactFor, 0.2, 1.3) * 0.18 : 0;
  return {
    dx: path.dx, dy: path.dy, dz: path.dz, heading: inFlight ? path.heading : 0,
    bodyPitch: inFlight ? 0.55 : bowing * 0.3 + Math.sin(time * 1.2) * 0.015,
    headRoll: reacting ? Math.sin(reactFor * 6) * 0.35 * bump(reactFor, 0.1, 1.4) : tilt,
    headYaw: reacting ? Math.sin(reactFor * 3.2) * 0.4 * bump(reactFor, 0, 3) : Math.sin(time * 0.7) * 0.18,
    headPitch: bowing * 0.35,
    crest: reacting ? clamp(bump(reactFor, 0.05, 3.2) * 1.25, 0, 1) : crestIdle,
    wingSpread: inFlight ? 1 : Math.max(stretch, reacting && !reduced ? bump(reactFor, 0.6, 1.4) * 0.5 : 0),
    wingFlap: inFlight ? Math.sin(reactFor * 38) : stretch * Math.sin(time * 6) * 0.15,
    bob: bobs,
    flying: inFlight,
  };
}
