"use client";

import { useEffect, useRef } from "react";

export function CapabilityCount({ value }: { value: number }) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const node = ref.current;
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (!node || motion.matches || !("IntersectionObserver" in window)) return;

    let frame = 0;
    let armed = false;
    const finish = () => {
      cancelAnimationFrame(frame);
      node.textContent = String(value);
    };
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry) return;
      if (!entry.isIntersecting) {
        // Reset only while off screen, so the painted final value never visibly drops to 0.
        if (!armed && entry.intersectionRatio === 0) {
          armed = true;
          node.textContent = "0";
        }
        return;
      }
      observer.disconnect();
      if (!armed || motion.matches) return finish();
      const animate = (start: number) => {
        const tick = (now: number) => {
          const progress = Math.min(1, (now - start) / 480);
          node.textContent = String(Math.round(value * (1 - (1 - progress) ** 3)));
          if (progress < 1) frame = requestAnimationFrame(tick);
        };
        tick(start);
      };
      frame = requestAnimationFrame(animate);
    }, { threshold: 0.8 });

    observer.observe(node);
    motion.addEventListener("change", finish);
    return () => {
      observer.disconnect();
      motion.removeEventListener("change", finish);
      finish();
    };
  }, [value]);

  return <><span aria-hidden="true" ref={ref}>{value}</span><span className="sr-only">{value}</span></>;
}
