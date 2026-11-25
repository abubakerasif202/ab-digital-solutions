type IdleHost = {
  requestIdleCallback?: (callback: () => void, options?: { timeout: number }) => number;
  cancelIdleCallback?: (handle: number) => void;
  setTimeout: (callback: () => void, delay: number) => number;
  clearTimeout: (handle: number) => void;
};

/**
 * Runs `task` once the browser is idle (or after `timeout` ms at the latest) and returns a cancel function.
 * Browsers without requestIdleCallback (Safari) fall back to a timer of the same length.
 */
export function whenIdle(task: () => void, timeout = 1500, host?: IdleHost): () => void {
  const target = host ?? (typeof window !== "undefined" ? window : undefined);
  if (!target) return () => {};
  if (typeof target.requestIdleCallback === "function") {
    const handle = target.requestIdleCallback(task, { timeout });
    return () => target.cancelIdleCallback?.(handle);
  }
  const handle = target.setTimeout(task, Math.min(timeout, 200));
  return () => target.clearTimeout(handle);
}
