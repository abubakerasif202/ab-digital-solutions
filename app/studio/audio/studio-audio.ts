// Small synthesised sound palette for the virtual studio. Every cue is generated with Web Audio at play
// time (no downloaded or sampled assets), so there is nothing to license and nothing to fetch.
//
// Rules this module enforces: sound is on by default but never claims to be playing until the browser has
// actually allowed it; choice and volume persist; cues are rate-limited so repeat taps stay calm; wildlife
// cues never overlap; audio suspends while the page is hidden and the context closes on dispose().

export type Cue = "welcome" | "transition" | "select" | "hop" | "koala" | "cockatoo";
export type SoundStatus = "unsupported" | "muted" | "locked" | "ready";
export type SoundPrefs = { enabled: boolean; volume: number };
export type SoundState = SoundPrefs & { status: SoundStatus };

export const STORAGE_KEY = "ab-studio-sound-v1";
export const DEFAULT_PREFS: SoundPrefs = { enabled: true, volume: 0.35 };
/** Slider volume 1 maps to this master gain, so even the loudest setting stays comfortable. */
export const MASTER_CEILING = 0.5;
/** Cockatoo chirps are the brightest cue, so they get a lower ceiling again. */
export const WILDLIFE_CEILING = 0.55;
export const WILDLIFE_CUES: readonly Cue[] = ["hop", "koala", "cockatoo"];

export function clampVolume(value: number): number {
  return Number.isFinite(value) ? Math.min(1, Math.max(0, value)) : DEFAULT_PREFS.volume;
}
/** Parses stored preferences defensively; anything unreadable falls back to the defaults (sound on, gentle volume). */
export function parsePrefs(raw: string | null | undefined): SoundPrefs {
  if (!raw) return { ...DEFAULT_PREFS };
  try {
    const value = JSON.parse(raw) as Partial<SoundPrefs> | null;
    return {
      enabled: typeof value?.enabled === "boolean" ? value.enabled : DEFAULT_PREFS.enabled,
      volume: typeof value?.volume === "number" ? clampVolume(value.volume) : DEFAULT_PREFS.volume,
    };
  } catch { return { ...DEFAULT_PREFS }; }
}
export const serializePrefs = (prefs: SoundPrefs) => JSON.stringify({ enabled: prefs.enabled, volume: clampVolume(prefs.volume) });
export const masterGain = (volume: number) => clampVolume(volume) * MASTER_CEILING;

/** Minimum gap before the same cue may play again, and how long each cue is audible (ms). */
export const CUE_GAP_MS: Record<Cue, number> = { welcome: 8000, transition: 700, select: 220, hop: 1800, koala: 3200, cockatoo: 2400 };
export const CUE_LENGTH_MS: Record<Cue, number> = { welcome: 1500, transition: 450, select: 180, hop: 600, koala: 1100, cockatoo: 520 };
export const ANY_CUE_GAP_MS = 120;

/** Decides whether a cue may start: per-cue cooldown, short global gap, and no two wildlife cues at once. */
export function createCueGate() {
  const lastByCue = new Map<Cue, number>();
  let lastAny = -Infinity;
  let wildlifeUntil = -Infinity;
  return {
    allow(cue: Cue, now: number): boolean {
      const last = lastByCue.get(cue);
      if (last !== undefined && now - last < CUE_GAP_MS[cue]) return false;
      if (cue !== "welcome" && now - lastAny < ANY_CUE_GAP_MS) return false;
      if (WILDLIFE_CUES.includes(cue) && now < wildlifeUntil) return false;
      lastByCue.set(cue, now);
      lastAny = now;
      if (WILDLIFE_CUES.includes(cue)) wildlifeUntil = now + CUE_LENGTH_MS[cue];
      return true;
    },
    reset() { lastByCue.clear(); lastAny = -Infinity; wildlifeUntil = -Infinity; },
  };
}

type Env = {
  storage?: Pick<Storage, "getItem" | "setItem"> | null;
  AudioContextCtor?: typeof AudioContext | null;
  now?: () => number;
};

export class StudioAudio {
  private prefs: SoundPrefs = { ...DEFAULT_PREFS };
  private state: SoundState = { ...DEFAULT_PREFS, status: "locked" };
  private listeners = new Set<() => void>();
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private gate = createCueGate();
  private attached = false;
  private cleanup: Array<() => void> = [];
  private readonly env: Env;

  constructor(env: Env = {}) { this.env = env; }

  private get storage() { return this.env.storage === undefined ? (typeof localStorage === "undefined" ? null : localStorage) : this.env.storage; }
  private get ctor(): typeof AudioContext | null {
    if (this.env.AudioContextCtor !== undefined) return this.env.AudioContextCtor;
    if (typeof window === "undefined") return null;
    return window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext ?? null;
  }
  private clock() { return this.env.now ? this.env.now() : performance.now(); }

  subscribe = (listener: () => void) => { this.listeners.add(listener); return () => { this.listeners.delete(listener); }; };
  getSnapshot = (): SoundState => this.state;
  private publish() {
    const status = this.computeStatus();
    if (status === this.state.status && this.prefs.enabled === this.state.enabled && this.prefs.volume === this.state.volume) return;
    this.state = { enabled: this.prefs.enabled, volume: this.prefs.volume, status };
    for (const listener of this.listeners) listener();
  }
  private computeStatus(): SoundStatus {
    if (!this.ctor) return "unsupported";
    if (!this.prefs.enabled) return "muted";
    return this.ctx?.state === "running" ? "ready" : "locked";
  }

  /** Starts the engine in the browser: loads the saved choice, attempts playback now, and unlocks on the first gesture if blocked. */
  attach() {
    if (this.attached) return;
    this.attached = true;
    try { this.prefs = parsePrefs(this.storage?.getItem(STORAGE_KEY)); } catch { this.prefs = { ...DEFAULT_PREFS }; }
    const Ctor = this.ctor;
    if (Ctor) {
      try {
        this.ctx = new Ctor();
        const limiter = this.ctx.createDynamicsCompressor();
        limiter.threshold.value = -18; limiter.ratio.value = 8; limiter.attack.value = 0.003; limiter.release.value = 0.2;
        this.master = this.ctx.createGain();
        this.master.gain.value = masterGain(this.prefs.volume);
        this.master.connect(limiter); limiter.connect(this.ctx.destination);
        this.ctx.addEventListener("statechange", () => this.publish());
      } catch { this.ctx = null; }
    }
    if (typeof window !== "undefined") {
      const unlock = () => { void this.resume(); };
      const events = ["pointerdown", "keydown", "touchend"] as const;
      for (const name of events) window.addEventListener(name, unlock, { passive: true });
      const onVisibility = () => { if (document.hidden) void this.ctx?.suspend().catch(() => undefined); else void this.resume(); };
      document.addEventListener("visibilitychange", onVisibility);
      this.cleanup.push(() => { for (const name of events) window.removeEventListener(name, unlock); document.removeEventListener("visibilitychange", onVisibility); });
    }
    void this.resume();
    this.publish();
  }

  /** Asks the browser to start audio. Resolves quietly when blocked: the state then stays "locked". */
  async resume() {
    if (!this.ctx || !this.prefs.enabled || (typeof document !== "undefined" && document.hidden)) { this.publish(); return; }
    try { if (this.ctx.state !== "running") await this.ctx.resume(); } catch { /* blocked until a gesture */ }
    this.publish();
  }

  setEnabled(enabled: boolean) {
    this.prefs = { ...this.prefs, enabled };
    this.save();
    if (!enabled) { this.gate.reset(); void this.ctx?.suspend().catch(() => undefined); }
    else void this.resume();
    this.publish();
  }
  setVolume(volume: number) {
    this.prefs = { ...this.prefs, volume: clampVolume(volume) };
    if (this.master && this.ctx) this.master.gain.setTargetAtTime(masterGain(this.prefs.volume), this.ctx.currentTime, 0.03);
    this.save();
    this.publish();
  }
  private save() { try { this.storage?.setItem(STORAGE_KEY, serializePrefs(this.prefs)); } catch { /* private mode */ } }

  /** Plays a cue if sound is enabled, actually running, and the cooldown rules allow it. Returns whether it started. */
  play(cue: Cue): boolean {
    const ctx = this.ctx;
    if (!ctx || !this.master || !this.prefs.enabled || ctx.state !== "running" || this.prefs.volume <= 0) return false;
    if (!this.gate.allow(cue, this.clock())) return false;
    const t0 = ctx.currentTime + 0.02;
    const bus = ctx.createGain();
    bus.gain.value = WILDLIFE_CUES.includes(cue) ? WILDLIFE_CEILING : 1;
    bus.connect(this.master);
    const finish = (seconds: number) => setTimeout(() => bus.disconnect(), (seconds + 0.3) * 1000);
    const tone = (type: OscillatorType, from: number, to: number, start: number, length: number, peak: number, lowpass = 0, bandpass = 0) => {
      const osc = ctx.createOscillator(), env = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(from, t0 + start);
      if (to !== from) osc.frequency.exponentialRampToValueAtTime(to, t0 + start + length * 0.9);
      env.gain.setValueAtTime(0.0001, t0 + start);
      env.gain.linearRampToValueAtTime(peak, t0 + start + Math.min(0.02, length * 0.2));
      env.gain.exponentialRampToValueAtTime(0.0001, t0 + start + length);
      let tail: AudioNode = env;
      osc.connect(env);
      if (lowpass) { const f = ctx.createBiquadFilter(); f.type = "lowpass"; f.frequency.value = lowpass; tail.connect(f); tail = f; }
      if (bandpass) { const f = ctx.createBiquadFilter(); f.type = "bandpass"; f.frequency.value = bandpass; f.Q.value = 1.2; tail.connect(f); tail = f; }
      tail.connect(bus);
      osc.start(t0 + start); osc.stop(t0 + start + length + 0.05);
      osc.onended = () => { osc.disconnect(); env.disconnect(); };
    };
    switch (cue) {
      case "welcome": // a soft rising brass-bell triad, C–E–G
        [[523.25, 0], [659.25, 0.15], [783.99, 0.3]].forEach(([f, s]) => { tone("sine", f, f, s, 1.15, 0.14); tone("triangle", f * 2, f * 2, s, 0.8, 0.03); });
        finish(1.6); break;
      case "transition":
        tone("sine", 392, 523.25, 0, 0.3, 0.07); tone("sine", 523.25, 587.33, 0.12, 0.28, 0.045); finish(0.5); break;
      case "select":
        tone("sine", 880, 1174.66, 0, 0.1, 0.06); finish(0.2); break;
      case "hop": // a comic "boi-oing": thump, springy fall, springy rise
        tone("sine", 95, 48, 0, 0.14, 0.2); tone("triangle", 320, 120, 0.02, 0.26, 0.11, 1400); tone("triangle", 200, 380, 0.24, 0.18, 0.07, 1400); finish(0.7); break;
      case "koala": // a slow, sleepy sigh
        tone("triangle", 380, 230, 0, 0.75, 0.09, 900); tone("sine", 300, 190, 0.28, 0.65, 0.05, 700); finish(1.2); break;
      case "cockatoo": // two quick bright chirps
        tone("sawtooth", 1700, 2900, 0, 0.14, 0.1, 0, 2600); tone("sawtooth", 2100, 3300, 0.2, 0.17, 0.085, 0, 2800); finish(0.6); break;
    }
    return true;
  }

  /** Stops everything and releases the audio context: called when leaving the studio. */
  dispose() {
    for (const fn of this.cleanup) fn();
    this.cleanup = [];
    this.attached = false;
    this.gate.reset();
    try { this.master?.disconnect(); } catch { /* already gone */ }
    const ctx = this.ctx;
    this.ctx = null; this.master = null;
    void ctx?.close().catch(() => undefined);
  }
}
