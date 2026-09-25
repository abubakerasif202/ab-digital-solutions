"use client";

import { useEffect, useRef, useState } from "react";

const LERP_RING = 0.16;
const LERP_MAGNETIC = 0.14;
const MAGNETIC_STRENGTH = 0.18;
const MAGNETIC_MAX = 8;

/**
 * Desktop-only pointer layer: a lerped gold ring + dot that follow the system
 * cursor (the native cursor is never hidden), contextual labels from
 * [data-cursor] (VIEW / VISIT), and a subtle magnetic pull on [data-magnetic]
 * elements. Renders nothing on touch devices or under reduced motion.
 */
export function PointerFX() {
  const [enabled, setEnabled] = useState(false);
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLSpanElement>(null);
  const magnetic = useRef<{ el: HTMLElement; tx: number; ty: number; cx: number; cy: number } | null>(null);

  useEffect(() => {
    const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setEnabled(finePointer.matches && !reducedMotion.matches);
    update();
    finePointer.addEventListener("change", update);
    reducedMotion.addEventListener("change", update);
    return () => {
      finePointer.removeEventListener("change", update);
      reducedMotion.removeEventListener("change", update);
    };
  }, []);

  useEffect(() => {
    if (!enabled) return;
    const dot = dotRef.current;
    const ring = ringRef.current;
    const label = labelRef.current;
    if (!dot || !ring || !label) return;

    let targetX = -100;
    let targetY = -100;
    let ringX = -100;
    let ringY = -100;
    let rafId = 0;
    let running = false;
    const settling = new Map<HTMLElement, {
      frameId: number;
      cx: number;
      cy: number;
    }>();

    const start = () => {
      if (running || document.hidden) return;
      running = true;
      rafId = requestAnimationFrame(animate);
    };

    const onPointerMove = (event: PointerEvent) => {
      targetX = event.clientX;
      targetY = event.clientY;
      dot.style.transform = `translate3d(${targetX}px, ${targetY}px, 0)`;

      const state = magnetic.current;
      if (state) {
        const rect = state.el.getBoundingClientRect();
        const clamp = (value: number) => Math.max(-MAGNETIC_MAX, Math.min(MAGNETIC_MAX, value * MAGNETIC_STRENGTH));
        state.tx = clamp(event.clientX - (rect.left + rect.width / 2));
        state.ty = clamp(event.clientY - (rect.top + rect.height / 2));
      }
      start();
    };

    const animate = () => {
      if (!running) return;
      ringX += (targetX - ringX) * LERP_RING;
      ringY += (targetY - ringY) * LERP_RING;
      ring.style.transform = `translate3d(${ringX.toFixed(2)}px, ${ringY.toFixed(2)}px, 0)`;

      const state = magnetic.current;
      if (state) {
        state.cx += (state.tx - state.cx) * LERP_MAGNETIC;
        state.cy += (state.ty - state.cy) * LERP_MAGNETIC;
        state.el.style.translate = `${state.cx.toFixed(2)}px ${state.cy.toFixed(2)}px`;
      }
      if (Math.abs(targetX - ringX) < 0.1
        && Math.abs(targetY - ringY) < 0.1
        && (!state || (Math.abs(state.tx - state.cx) < 0.1
          && Math.abs(state.ty - state.cy) < 0.1))) {
        running = false;
        return;
      }
      rafId = requestAnimationFrame(animate);
    };

    const stop = () => {
      running = false;
      cancelAnimationFrame(rafId);
    };

    const onVisibilityChange = () => {
      if (document.hidden) stop();
    };

    const releaseMagnetic = () => {
      const state = magnetic.current;
      if (!state) return;
      state.tx = 0;
      state.ty = 0;
      const released = state;
      magnetic.current = null;
      const settleState = { frameId: 0, cx: released.cx, cy: released.cy };
      settling.set(released.el, settleState);
      // Keep easing back to rest, then clean the inline style.
      const scheduleSettle = () => {
        settleState.frameId = requestAnimationFrame(() => {
          if (settling.get(released.el) !== settleState) return;
          settle();
        });
      };
      const settle = () => {
        settleState.cx += (0 - settleState.cx) * LERP_MAGNETIC;
        settleState.cy += (0 - settleState.cy) * LERP_MAGNETIC;
        if (Math.abs(settleState.cx) < 0.1 && Math.abs(settleState.cy) < 0.1) {
          released.el.style.removeProperty("translate");
          settling.delete(released.el);
          return;
        }
        released.el.style.translate = `${settleState.cx.toFixed(2)}px ${settleState.cy.toFixed(2)}px`;
        scheduleSettle();
      };
      scheduleSettle();
    };

    const onPointerOver = (event: PointerEvent) => {
      const target = event.target instanceof Element ? event.target : null;
      const labelled = target?.closest("[data-cursor]");
      const interactive = target?.closest("a, button, summary, input, select, textarea, [role='button']");
      ring.classList.toggle("has-label", Boolean(labelled));
      ring.classList.toggle("is-active", !labelled && Boolean(interactive));
      label.textContent = labelled?.getAttribute("data-cursor") ?? "";

      const magneticTarget = target?.closest("[data-magnetic]");
      if (magneticTarget instanceof HTMLElement && magnetic.current?.el !== magneticTarget) {
        releaseMagnetic();
        const previousSettle = settling.get(magneticTarget);
        if (previousSettle) {
          cancelAnimationFrame(previousSettle.frameId);
          settling.delete(magneticTarget);
        }
        magnetic.current = {
          el: magneticTarget,
          tx: 0,
          ty: 0,
          cx: previousSettle?.cx ?? 0,
          cy: previousSettle?.cy ?? 0,
        };
        start();
      }
    };

    const onPointerOut = (event: PointerEvent) => {
      const state = magnetic.current;
      if (!state || !(event.target instanceof Node) || !state.el.contains(event.target)) return;
      if (!(event.relatedTarget instanceof Node) || !state.el.contains(event.relatedTarget)) {
        releaseMagnetic();
      }
    };

    window.addEventListener("pointermove", onPointerMove, { passive: true });
    document.addEventListener("pointerover", onPointerOver, { passive: true });
    document.addEventListener("pointerout", onPointerOut, { passive: true });
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      stop();
      settling.forEach((state, element) => {
        cancelAnimationFrame(state.frameId);
        element.style.removeProperty("translate");
      });
      settling.clear();
      window.removeEventListener("pointermove", onPointerMove);
      document.removeEventListener("pointerover", onPointerOver);
      document.removeEventListener("pointerout", onPointerOut);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      magnetic.current?.el.style.removeProperty("translate");
      magnetic.current = null;
    };
  }, [enabled]);

  if (!enabled) return null;

  return (
    <>
      <div ref={dotRef} className="cursor-dot" aria-hidden="true" />
      <div ref={ringRef} className="cursor-ring" aria-hidden="true">
        <span ref={labelRef} className="cursor-label" />
      </div>
    </>
  );
}
