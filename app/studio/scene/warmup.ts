export const warmupPhases = ["core", "interior", "exterior", "traffic", "pedestrians", "wildlife", "staff", "done"] as const;
export type StudioPhase = (typeof warmupPhases)[number];
export function nextWarmupPhase(phase: StudioPhase): StudioPhase {
  return warmupPhases[Math.min(warmupPhases.indexOf(phase) + 1, warmupPhases.length - 1)];
}
export function yieldToBrowser(scheduler?: { yield: () => Promise<void> }): Promise<void> {
  return scheduler ? scheduler.yield() : new Promise((resolve) => setTimeout(resolve, 0));
}

// Two frames allow the committed stage to draw; the task boundary lets input run
// before React constructs the next one. Cleanup also guards an already queued yield.
export function scheduleWarmupAdvance({
  advance,
  requestFrame = requestAnimationFrame,
  cancelFrame = cancelAnimationFrame,
  yieldTask = yieldToBrowser,
}: {
  advance: () => void;
  requestFrame?: (callback: FrameRequestCallback) => number;
  cancelFrame?: (id: number) => void;
  yieldTask?: () => Promise<void>;
}): () => void {
  let cancelled = false;
  let second = 0;
  const first = requestFrame(() => {
    second = requestFrame(() => {
      void yieldTask().then(() => { if (!cancelled) advance(); });
    });
  });
  return () => { cancelled = true; cancelFrame(first); cancelFrame(second); };
}

/** Do not draw new materials until their asynchronous shader preparation finishes. */
export function prepareWarmupStage({ compile, cancelCompile, reveal, onFailure, ...frames }: {
  compile: () => Promise<unknown>;
  cancelCompile?: () => void;
  reveal: () => void;
  onFailure: () => void;
} & Parameters<typeof scheduleWarmupAdvance>[0]): () => void {
  let cancelled = false;
  let cancelFrames = () => {};
  void Promise.resolve().then(() => {
    if (!cancelled) return compile();
  }).then(() => {
    if (cancelled) return;
    reveal();
    cancelFrames = scheduleWarmupAdvance(frames);
  }).catch(() => { if (!cancelled) onFailure(); });
  return () => { cancelled = true; cancelCompile?.(); cancelFrames(); };
}
