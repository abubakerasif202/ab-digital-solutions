"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { HeroFallback } from "./HeroFallback";

const Hero3DCanvas = dynamic(
  () => import("./Hero3DCanvas").then((mod) => mod.Hero3DCanvas),
  {
    ssr: false,
    loading: () => <HeroFallback />,
  },
);

type Hero3DMode = "fallback" | "mobile" | "tablet" | "desktop";

export function Hero3DExperience() {
  const stageRef = useRef<HTMLDivElement>(null);
  const [mode, setMode] = useState<Hero3DMode>("fallback");

  useEffect(() => {
    const stage = stageRef.current?.parentElement;
    if (!stage) return;
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    // Phones skip WebGL entirely: the inline SVG fallback avoids a GPU context and
    // keeps mobile LCP/INP clean.
    const mobileQuery = window.matchMedia("(max-width: 720px)");
    const coarseQuery = window.matchMedia("(pointer: coarse)");
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
    let hasIntent = false;
    let stageVisible = false;
    let activated = false;

    const updateMode = () => {
      if (!ready || !hasIntent || (!activated && (!stageVisible || document.hidden)) || motionQuery.matches || mobileQuery.matches || coarseQuery.matches || connection?.saveData) {
        setMode("fallback");
        return;
      }

      const constrainedDevice = (navigator.hardwareConcurrency > 0 && navigator.hardwareConcurrency <= 4)
        || (typeof deviceMemory === "number" && deviceMemory > 0 && deviceMemory <= 4);

      if (constrainedDevice) {
        setMode("fallback");
      } else if (tabletQuery.matches) {
        activated = true;
        setMode("tablet");
      } else {
        activated = true;
        setMode("desktop");
      }
    };

    // Keep the first paint entirely static. Entering the installation expresses
    // intent to explore it; the expensive GPU setup then runs after input yields.
    const handlePointerIntent = (event: PointerEvent) => {
      if (hasIntent || motionQuery.matches || mobileQuery.matches || coarseQuery.matches) return;
      // The stage sits behind the copy and ignores pointer events, so test the
      // pointer against its bounds rather than the event target.
      const bounds = stage.getBoundingClientRect();
      if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) return;
      hasIntent = true;
      updateMode();
    };
    const stageObserver = new IntersectionObserver(([entry]) => {
      stageVisible = entry.isIntersecting;
      updateMode();
    }, { threshold: 0.01 });
    stageObserver.observe(stage);
    window.addEventListener("pointermove", handlePointerIntent, { passive: true });
    document.addEventListener("visibilitychange", updateMode);

    const enable3D = () => {
      ready = true;
      updateMode();
    };

    motionQuery.addEventListener("change", updateMode);
    mobileQuery.addEventListener("change", updateMode);
    tabletQuery.addEventListener("change", updateMode);
    coarseQuery.addEventListener("change", updateMode);
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
      stageObserver.disconnect();
      window.removeEventListener("pointermove", handlePointerIntent);
      document.removeEventListener("visibilitychange", updateMode);
      motionQuery.removeEventListener("change", updateMode);
      mobileQuery.removeEventListener("change", updateMode);
      tabletQuery.removeEventListener("change", updateMode);
      coarseQuery.removeEventListener("change", updateMode);
      connection?.removeEventListener?.("change", updateMode);
    };
  }, []);

  return (
    <div ref={stageRef} className="hero-3d-bg-wrap" aria-hidden="true">
      {mode === "fallback" ? <HeroFallback /> : <Hero3DCanvas quality={mode} />}
    </div>
  );
}
