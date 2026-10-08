"use client";

import { useEffect, useRef } from "react";

/* Counts up to a real figure the first time it scrolls into view. The final
   value is server-rendered (correct for crawlers and with JS off), digits are
   tabular so nothing shifts, and reduced motion leaves the number static. */
export function CountUp({ value, pad = 2, duration = 1400 }: { value: number; pad?: number; duration?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const final = String(value).padStart(pad, "0");

  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let frame = 0;
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry?.isIntersecting) return;
      observer.disconnect();
      const start = performance.now();
      const tick = (now: number) => {
        const t = Math.min(1, (now - start) / duration);
        const eased = 1 - Math.pow(1 - t, 4); // expo-out feel, matches --ease-studio
        el.textContent = String(Math.round(eased * value)).padStart(pad, "0");
        if (t < 1) frame = requestAnimationFrame(tick);
      };
      frame = requestAnimationFrame(tick);
    }, { threshold: 0.6 });
    observer.observe(el);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
      el.textContent = final;
    };
  }, [value, pad, duration, final]);

  return <span ref={ref} className="gr-count">{final}</span>;
}
