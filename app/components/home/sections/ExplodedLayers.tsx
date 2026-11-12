"use client";

import { useEffect, useRef, type ReactNode } from "react";

const clamp = (value: number) => Math.max(-1, Math.min(1, value));

/**
 * Behaviour for the exploded layer stack. The markup is server-rendered; this
 * shell only writes CSS variables and one data attribute, never React state:
 *   --px / --py  pointer position over the stage (-1..1), rAF-throttled
 *   data-active  index of the layer whose row is hovered or focused
 * Everything visual (fan, tilt, highlight) lives in inspector-sections.css.
 */
export function ExplodedLayers({ children }: { children: ReactNode }) {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const stage = root.querySelector<HTMLElement>("[data-stage]") ?? root;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let frame = 0;
    let px = 0;
    let py = 0;

    const apply = () => {
      frame = 0;
      root.style.setProperty("--px", px.toFixed(3));
      root.style.setProperty("--py", py.toFixed(3));
    };
    const queue = () => {
      if (!frame) frame = requestAnimationFrame(apply);
    };

    const onMove = (event: PointerEvent) => {
      if (reduceMotion.matches || event.pointerType === "touch") return;
      const rect = stage.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;
      px = clamp(((event.clientX - rect.left) / rect.width) * 2 - 1);
      py = clamp(((event.clientY - rect.top) / rect.height) * 2 - 1);
      queue();
    };
    const onLeave = () => {
      px = 0;
      py = 0;
      queue();
      delete root.dataset.active;
    };
    const layerOf = (target: EventTarget | null) =>
      target instanceof Element ? target.closest<HTMLElement>("[data-layer]") : null;
    const onOver = (event: PointerEvent) => {
      if (event.pointerType === "touch") return;
      const layer = layerOf(event.target);
      if (layer?.dataset.layer) root.dataset.active = layer.dataset.layer;
      // Moving over the heading or empty stage releases the highlight, unless
      // keyboard focus is still holding a row (scrolling replays pointerover).
      else if (!root.contains(document.activeElement)) delete root.dataset.active;
    };
    const onFocusIn = (event: FocusEvent) => {
      const layer = layerOf(event.target);
      if (layer?.dataset.layer) root.dataset.active = layer.dataset.layer;
    };
    const onFocusOut = (event: FocusEvent) => {
      if (!(event.relatedTarget instanceof Node) || !root.contains(event.relatedTarget)) delete root.dataset.active;
    };

    root.addEventListener("pointermove", onMove);
    root.addEventListener("pointerleave", onLeave);
    root.addEventListener("pointerover", onOver);
    root.addEventListener("focusin", onFocusIn);
    root.addEventListener("focusout", onFocusOut);
    return () => {
      if (frame) cancelAnimationFrame(frame);
      root.removeEventListener("pointermove", onMove);
      root.removeEventListener("pointerleave", onLeave);
      root.removeEventListener("pointerover", onOver);
      root.removeEventListener("focusin", onFocusIn);
      root.removeEventListener("focusout", onFocusOut);
    };
  }, []);

  return (
    <div ref={rootRef} className="sx-explode">
      {children}
    </div>
  );
}
