"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

/** Runs before paint. Without it (no JS, or reduced motion) `[data-reveal]` content is simply visible. */
export const motionGateScript =
  "try{if(!matchMedia('(prefers-reduced-motion: reduce)').matches&&'IntersectionObserver' in window)document.documentElement.dataset.motion='on'}catch(e){}";

const SPOTLIGHT = ".callout, .reasons > li, .layers li, .contact-form, .cta-band";

/** Eases a whole number up from zero once, when its element first enters the viewport. */
function countUp(node: HTMLElement) {
  const target = Number(node.dataset.count);
  if (!Number.isFinite(target) || target <= 0) return;
  const started = performance.now();
  const duration = 700;
  const tick = (now: number) => {
    const progress = Math.min(1, (now - started) / duration);
    node.textContent = String(Math.round(target * (1 - Math.pow(1 - progress, 4))));
    if (progress < 1) requestAnimationFrame(tick);
  };
  node.textContent = "0";
  requestAnimationFrame(tick);
}

/**
 * The site's motion runtime: scroll reveals, number count-ups, a pointer
 * spotlight on selected surfaces and a short settle on route changes. All of it
 * is skipped unless the head script has confirmed motion is welcome.
 */
export function RevealObserver() {
  const pathname = usePathname();
  const firstRoute = useRef(true);

  useEffect(() => {
    if (document.documentElement.dataset.motion !== "on") return;

    // New route: settle the page in instead of snapping.
    if (firstRoute.current) firstRoute.current = false;
    else document.getElementById("main-content")?.animate(
      [{ opacity: 0.35, transform: "translateY(6px)" }, { opacity: 1, transform: "none" }],
      { duration: 240, easing: "cubic-bezier(0.16, 1, 0.3, 1)" },
    );

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const node = entry.target as HTMLElement;
          node.setAttribute("data-in", "");
          if (node.dataset.count) countUp(node);
          observer.unobserve(node);
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.08 },
    );
    document.querySelectorAll("[data-reveal]:not([data-in]), [data-count]:not([data-in])").forEach((target) => observer.observe(target));

    // Safety net: a fast fling can carry an element through the viewport between observer
    // passes. When scrolling settles, reveal anything at or above the fold that was missed.
    let settle = 0;
    const sweep = () => {
      for (const node of document.querySelectorAll<HTMLElement>("[data-reveal]:not([data-in])")) {
        if (node.getBoundingClientRect().top < window.innerHeight) { node.setAttribute("data-in", ""); observer.unobserve(node); }
      }
    };
    const onScroll = () => { window.clearTimeout(settle); settle = window.setTimeout(sweep, 140); };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => { observer.disconnect(); window.removeEventListener("scroll", onScroll); window.clearTimeout(settle); };
  }, [pathname]);

  // Pointer spotlight: one passive listener, written as CSS variables on the hovered surface.
  useEffect(() => {
    if (document.documentElement.dataset.motion !== "on" || !window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    let frame = 0;
    const onMove = (event: PointerEvent) => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        const surface = (event.target as Element | null)?.closest?.(SPOTLIGHT);
        if (!(surface instanceof HTMLElement)) return;
        const box = surface.getBoundingClientRect();
        surface.style.setProperty("--mx", `${event.clientX - box.left}px`);
        surface.style.setProperty("--my", `${event.clientY - box.top}px`);
      });
    };
    document.addEventListener("pointermove", onMove, { passive: true });
    return () => { document.removeEventListener("pointermove", onMove); cancelAnimationFrame(frame); };
  }, []);

  return null;
}
