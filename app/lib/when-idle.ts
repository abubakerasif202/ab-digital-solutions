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
export function whenIdle(task: () => void, timeout = 1500, host: IdleHost = window): () => void {
  if (typeof host.requestIdleCallback === "function") {
    const handle = host.requestIdleCallback(task, { timeout });
    return () => host.cancelIdleCallback?.(handle);
  }
  const handle = host.setTimeout(task, Math.min(timeout, 200));
  return () => host.clearTimeout(handle);
}
