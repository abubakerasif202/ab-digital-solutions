/**
 * Tiny external store shared by the hero stage and the work index so the WebGL
 * wall and the DOM list always agree on which project is in focus. No React
 * state crosses the boundary on pointer or scroll frames.
 */

type Listener = () => void;

export type FocusSource = "auto" | "hero" | "work";

let focusIndex = 0;
let lastSource: FocusSource = "auto";
let lastManualAt = 0;
const listeners = new Set<Listener>();

export const wallStore = {
  getFocus(): number {
    return focusIndex;
  },
  getSource(): FocusSource {
    return lastSource;
  },
  /** Milliseconds since a visitor last chose a project on purpose. */
  msSinceManual(now = Date.now()): number {
    return now - lastManualAt;
  },
  setFocus(index: number, source: FocusSource = "auto"): void {
    if (source !== "auto") lastManualAt = Date.now();
    lastSource = source;
    if (index === focusIndex) return;
    focusIndex = index;
    listeners.forEach((listener) => listener());
  },
  subscribe(listener: Listener): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
};
