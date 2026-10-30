// Pure, framework-free animation scheduler. The R3F driver in SceneClock.tsx calls step() from a
// throttled rAF loop; systems never touch React state, so a living world causes zero re-renders.
export const MAX_STEP = 0.05; // seconds; a stalled tab never teleports cars or characters
export const IDLE_PAUSE_MS = 45000; // ambient motion rests after this long without interaction

export type Tick = (dt: number, time: number) => void;
type Entry = { tick: Tick; every: number; carry: number };

export class AnimationScheduler {
  private entries = new Map<string, Entry>();
  private listeners = new Set<() => void>();
  private last = 0;
  private lastInteraction = 0;
  private initialized = false;
  time = 0;
  paused = false;
  private idleMs: number;
  constructor(idleMs = IDLE_PAUSE_MS) { this.idleMs = idleMs; }

  /** Register (or replace) a system. `every` throttles it to at most once per `every` seconds. */
  add(id: string, tick: Tick, every = 0) {
    this.entries.set(id, { tick, every, carry: 0 });
    for (const listener of this.listeners) listener();
    return () => { this.entries.delete(id); };
  }
  /** Wake the driver when a suspended scene finishes loading and registers its systems. */
  onWork(listener: () => void) {
    this.listeners.add(listener);
    return () => { this.listeners.delete(listener); };
  }
  setPaused(paused: boolean) { this.paused = paused; }
  get size() { return this.entries.size; }
  /** Initialize a new scene once. Driver restarts and quality changes are not visitor input. */
  initialize(now: number) {
    if (this.initialized) return;
    this.initialized = true;
    this.last = now;
    this.lastInteraction = now;
  }
  /** Any visitor input wakes ambient motion. Returns true when the world was resting. */
  poke(now: number) {
    this.initialized = true;
    const resting = this.isResting(now);
    this.lastInteraction = now;
    if (resting) this.last = now;
    return resting;
  }
  isResting(now: number) { return this.paused || now - this.lastInteraction > this.idleMs; }
  /** Advance systems by bounded wall-clock delta. True only when a system actually ran. */
  step(now: number): boolean {
    if (this.isResting(now)) { this.last = now; return false; }
    const dt = Math.min(MAX_STEP, Math.max(0, (now - (this.last || now)) / 1000));
    this.last = now;
    this.time += dt;
    let stepped = false;
    for (const entry of this.entries.values()) {
      entry.carry += dt;
      if (entry.carry < entry.every) continue;
      const slice = Math.min(MAX_STEP * 2, entry.carry);
      entry.carry = 0;
      entry.tick(slice, this.time);
      stepped = true;
    }
    return stepped;
  }
}
