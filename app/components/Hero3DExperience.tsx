"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";

const Hero3DCanvas = dynamic(
  () => import("./Hero3DCanvas").then((mod) => mod.Hero3DCanvas),
  {
    ssr: false,
    loading: () => <div className="hero-3d-fallback" aria-hidden="true" />,
  },
);

type Hero3DMode = "fallback" | "mobile" | "tablet" | "desktop";

export function Hero3DExperience() {
  const [mode, setMode] = useState<Hero3DMode>("fallback");
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    // Phones skip WebGL entirely: the layered CSS fallback costs nothing and
    // keeps mobile LCP/INP clean.
    const mobileQuery = window.matchMedia("(max-width: 720px)");
    const tabletQuery = window.matchMedia("(max-width: 1024px)");
    const connection = (navigator as Navigator & {
      connection?: EventTarget & { saveData?: boolean };
    }).connection;
    const deviceMemory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory;
    const idleWindow = window as typeof window & {
      requestIdleCallback?: (callback: () => void, options?: { timeout: number }) => number;
      cancelIdleCallback?: (id: number) => void;
    };
    let ready = false;

    const updateMode = () => {
      if (!ready || motionQuery.matches || mobileQuery.matches) {
        setMode("fallback");
        return;
      }

      const constrainedDevice = connection?.saveData
        || (navigator.hardwareConcurrency > 0 && navigator.hardwareConcurrency <= 4)
        || (typeof deviceMemory === "number" && deviceMemory > 0 && deviceMemory <= 4);

      if (tabletQuery.matches || constrainedDevice) {
        setMode("tablet");
      } else {
        setMode("desktop");
      }
    };

    const enable3D = () => {
      ready = true;
      updateMode();
    };

    motionQuery.addEventListener("change", updateMode);
    mobileQuery.addEventListener("change", updateMode);
    tabletQuery.addEventListener("change", updateMode);
    connection?.addEventListener?.("change", updateMode);

    let cancelDelay = () => {};
    if (idleWindow.requestIdleCallback) {
      const idleId = idleWindow.requestIdleCallback(enable3D, { timeout: 1500 });
      cancelDelay = () => idleWindow.cancelIdleCallback?.(idleId);
    } else {
      const timer = window.setTimeout(enable3D, 500);
      cancelDelay = () => window.clearTimeout(timer);
    }

    return () => {
      cancelDelay();
      motionQuery.removeEventListener("change", updateMode);
      mobileQuery.removeEventListener("change", updateMode);
      tabletQuery.removeEventListener("change", updateMode);
      connection?.removeEventListener?.("change", updateMode);
    };
  }, []);

  // Pointer-responsive depth: the whole scene drifts a few pixels against the
  // cursor with a slow lerp. Desktop scene and fine pointers only.
  useEffect(() => {
    if (mode !== "desktop") return;
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    const wrap = wrapRef.current;
    if (!wrap) return;

    let targetX = 0;
    let targetY = 0;
    let currentX = 0;
    let currentY = 0;
    let rafId = 0;
    let intersecting = true;
    let running = false;

    const onPointerMove = (event: PointerEvent) => {
      targetX = (event.clientX / window.innerWidth - 0.5) * 2;
      targetY = (event.clientY / window.innerHeight - 0.5) * 2;
    };

    const tick = () => {
      if (!running) return;
      currentX += (targetX - currentX) * 0.045;
      currentY += (targetY - currentY) * 0.045;
      wrap.style.transform = `translate3d(${(currentX * 16).toFixed(2)}px, ${(currentY * 11).toFixed(2)}px, 0)`;
      rafId = requestAnimationFrame(tick);
    };

    const start = () => {
      if (running || document.hidden || !intersecting) return;
      running = true;
      rafId = requestAnimationFrame(tick);
    };

    const stop = () => {
      running = false;
      cancelAnimationFrame(rafId);
    };

    const onVisibilityChange = () => {
      if (document.hidden) stop();
      else start();
    };

    const observer = new IntersectionObserver(([entry]) => {
      intersecting = entry.isIntersecting;
      if (intersecting) start();
      else stop();
    });

    window.addEventListener("pointermove", onPointerMove, { passive: true });
    document.addEventListener("visibilitychange", onVisibilityChange);
    observer.observe(wrap);
    start();
    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      observer.disconnect();
      stop();
      wrap.style.transform = "";
    };
  }, [mode]);

  return (
    <div className="hero-3d-bg-wrap" aria-hidden="true" ref={wrapRef}>
      {mode === "fallback" ? <div className="hero-3d-fallback" /> : <Hero3DCanvas quality={mode} />}
    </div>
  );
}
