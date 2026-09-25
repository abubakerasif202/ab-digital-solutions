"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

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
      if (!ready || motionQuery.matches || mobileQuery.matches || connection?.saveData) {
        setMode("fallback");
        return;
      }

      const constrainedDevice = (navigator.hardwareConcurrency > 0 && navigator.hardwareConcurrency <= 4)
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

  return (
    <div className="hero-3d-bg-wrap" aria-hidden="true">
      {mode === "fallback" ? <div className="hero-3d-fallback" /> : <Hero3DCanvas quality={mode} />}
    </div>
  );
}
