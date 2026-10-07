"use client";

import { useEffect } from "react";
import { motionTokens } from "./motion/tokens";

/** Fine-pointer perspective enhances artwork; native controls never move. */
export function PointerFX() {
  useEffect(() => {
    const finePointer = window.matchMedia("(min-width: 721px) and (hover: hover) and (pointer: fine)");
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let active: HTMLElement | null = null;
    let frame = 0;
    const reset = () => {
      cancelAnimationFrame(frame);
      active?.style.removeProperty("--tilt-x");
      active?.style.removeProperty("--tilt-y");
      active?.style.removeProperty("--pointer-x");
      active?.style.removeProperty("--pointer-y");
      active = null;
    };
    const move = (event: PointerEvent) => {
      if (!(finePointer.matches && !reducedMotion.matches) || document.hidden) return;
      const target = event.target instanceof Element ? event.target.closest("[data-tilt]") : null;
      if (target !== active) reset();
      if (!(target instanceof HTMLElement)) return;
      active = target;
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        if (active !== target) return;
        const bounds = target.getBoundingClientRect();
        if (!bounds.width || !bounds.height) return;
        const x = Math.max(-1, Math.min(1, ((event.clientX - bounds.left) / bounds.width - 0.5) * 2));
        const y = Math.max(-1, Math.min(1, ((event.clientY - bounds.top) / bounds.height - 0.5) * 2));
        const limit = Math.min(4, motionTokens.tilt.maxDegrees);
        target.style.setProperty("--tilt-x", `${-y * limit}deg`);
        target.style.setProperty("--tilt-y", `${x * limit}deg`);
        target.style.setProperty("--pointer-x", `${(x + 1) * 50}%`);
        target.style.setProperty("--pointer-y", `${(y + 1) * 50}%`);
      });
    };
    const leave = (event: PointerEvent) => {
      if (active && (!(event.relatedTarget instanceof Node) || !active.contains(event.relatedTarget))) reset();
    };
    window.addEventListener("pointermove", move, { passive: true });
    document.addEventListener("pointerout", leave, { passive: true });
    document.addEventListener("visibilitychange", reset);
    window.addEventListener("blur", reset);
    finePointer.addEventListener("change", reset);
    reducedMotion.addEventListener("change", reset);
    return () => {
      reset();
      window.removeEventListener("pointermove", move);
      document.removeEventListener("pointerout", leave);
      document.removeEventListener("visibilitychange", reset);
      window.removeEventListener("blur", reset);
      finePointer.removeEventListener("change", reset);
      reducedMotion.removeEventListener("change", reset);
    };
  }, []);
  return null;
}
