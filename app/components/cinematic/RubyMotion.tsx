"use client";

import { useEffect } from "react";

/** Fine-pointer lighting and restrained magnetic depth; native scrolling does the rest. */
export function RubyMotion() {
  useEffect(() => {
    const root = document.querySelector(".ruby-page");
    if (!root) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)");
    let cleanups: (() => void)[] = [];
    const clear = () => { cleanups.forEach(cleanup => cleanup()); cleanups = []; };
    const configure = () => {
      clear();
      if (reduced.matches || !fine.matches) return;
      root.querySelectorAll<HTMLElement>("[data-ruby-depth], [data-ruby-magnet]").forEach(element => {
        let frame = 0;
        let bounds: DOMRect | null = null;
        let x = 0;
        let y = 0;
        const paint = () => {
          frame = 0;
          if (!bounds) return;
          const px = Math.max(0, Math.min(1, (x - bounds.left) / bounds.width));
          const py = Math.max(0, Math.min(1, (y - bounds.top) / bounds.height));
          element.style.setProperty("--ruby-x", `${px * 100}%`);
          element.style.setProperty("--ruby-y", `${py * 100}%`);
          if (element.hasAttribute("data-ruby-magnet")) {
            element.style.setProperty("--ruby-dx", `${(px - 0.5) * 10}px`);
            element.style.setProperty("--ruby-dy", `${(py - 0.5) * 8}px`);
          }
        };
        const enter = () => { bounds = element.getBoundingClientRect(); };
        const move = (event: PointerEvent) => {
          x = event.clientX; y = event.clientY;
          if (!frame) frame = window.requestAnimationFrame(paint);
        };
        const leave = () => {
          if (frame) window.cancelAnimationFrame(frame);
          frame = 0;
          bounds = null;
          ["--ruby-x", "--ruby-y", "--ruby-dx", "--ruby-dy"].forEach(property => element.style.removeProperty(property));
        };
        element.addEventListener("pointerenter", enter);
        element.addEventListener("pointermove", move);
        element.addEventListener("pointerleave", leave);
        cleanups.push(() => {
          leave();
          element.removeEventListener("pointerenter", enter);
          element.removeEventListener("pointermove", move);
          element.removeEventListener("pointerleave", leave);
        });
      });
    };
    configure();
    reduced.addEventListener("change", configure);
    fine.addEventListener("change", configure);
    return () => {
      clear();
      reduced.removeEventListener("change", configure);
      fine.removeEventListener("change", configure);
    };
  }, []);
  return null;
}
