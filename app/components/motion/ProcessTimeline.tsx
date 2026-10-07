"use client";

import { useEffect, useRef, type ReactNode } from "react";

/** Steps remain readable without JavaScript; the rail is a visual enhancement. */
export function ProcessTimeline({ children }: { children: ReactNode }) {
  const rootRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const steps = [...root.querySelectorAll<HTMLElement>("[data-process-step]")];
    const seen = new Set<Element>();
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        seen.add(entry.target);
        entry.target.setAttribute("data-step-visible", "true");
        observer.unobserve(entry.target);
      }
      const reached = Math.max(0, ...steps.map((step, index) => seen.has(step) ? index + 1 : 0));
      root.style.setProperty("--process-progress", `${reached / steps.length}`);
    }, { threshold: 0.35, rootMargin: "0px 0px -8% 0px" });
    steps.forEach((step) => observer.observe(step));
    return () => observer.disconnect();
  }, []);
  return <div ref={rootRef} className="process-list-wrap studio-process">{children}</div>;
}
