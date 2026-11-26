"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { isLowBattery, isSlowConnection, probeWebGLCapability } from "../lib/device-quality";
import { HeroFallback } from "./HeroFallback";

const Hero3DCanvas = dynamic(
  () => import("./Hero3DCanvas").then((mod) => mod.Hero3DCanvas),
  {
    ssr: false,
    loading: () => <HeroFallback />,
  },
);

type Hero3DMode = "fallback" | "mobile" | "tablet" | "desktop";

interface ConnectionLike extends EventTarget {
  saveData?: boolean;
  effectiveType?: string;
}

interface BatteryLike extends EventTarget {
  level?: number;
  charging?: boolean;
}

/**
 * `fallback` replaces the static artwork shown on phones, with reduced motion,
 * on constrained devices and before the 3D scene is ready. The mode selection
 * is unchanged; omit it to keep the approved image.
 */
export function Hero3DExperience({ fallback }: { fallback?: ReactNode } = {}) {
  const stageRef = useRef<HTMLDivElement>(null);
  const [mode, setMode] = useState<Hero3DMode>("fallback");

  useEffect(() => {
    const stage = stageRef.current?.parentElement;
    if (!stage) return;
    if (!("IntersectionObserver" in window) || !("ResizeObserver" in window)) return;
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    // Phones use the approved artwork without allocating a GPU context.
    const mobileQuery = window.matchMedia("(max-width: 720px)");
    const coarseQuery = window.matchMedia("(pointer: coarse)");
    const tabletQuery = window.matchMedia("(max-width: 1024px)");
    const nav = navigator as Navigator & {
      connection?: ConnectionLike;
      deviceMemory?: number;
      getBattery?: () => Promise<BatteryLike>;
    };
    const connection = nav.connection;
    const deviceMemory = nav.deviceMemory;
    const idleWindow = window as typeof window & {
      requestIdleCallback?: (callback: () => void, options?: { timeout: number }) => number;
      cancelIdleCallback?: (id: number) => void;
    };
    let ready = false;
    let hasIntent = false;
    let stageVisible = false;
    let activated = false;
    let disposed = false;
    let batteryRef: BatteryLike | null = null;
    let lowBattery = false;
    let webglChecked = false;
    let webglUsable = true;

    const updateMode = () => {
      if (!ready || !hasIntent || (!activated && (!stageVisible || document.hidden)) || motionQuery.matches || mobileQuery.matches || coarseQuery.matches || connection?.saveData || isSlowConnection(connection?.effectiveType) || lowBattery) {
        setMode("fallback");
        return;
      }

      const constrainedDevice = (navigator.hardwareConcurrency > 0 && navigator.hardwareConcurrency <= 4)
        || (typeof deviceMemory === "number" && deviceMemory > 0 && deviceMemory <= 4);

      if (constrainedDevice) {
        setMode("fallback");
        return;
      }

      if (!webglChecked) {
        webglChecked = true;
        const cap = probeWebGLCapability();
        webglUsable = cap.supported && !cap.softwareRenderer;
      }

      if (!webglUsable) {
        setMode("fallback");
      } else if (tabletQuery.matches) {
        activated = true;
        setMode("tablet");
      } else {
        activated = true;
        setMode("desktop");
      }
    };

    const onBatteryChange = () => {
      if (!batteryRef) return;
      lowBattery = isLowBattery(batteryRef.level, batteryRef.charging);
      updateMode();
    };

    if (typeof nav.getBattery === "function") {
      void nav.getBattery().then((battery) => {
        if (disposed) return;
        batteryRef = battery;
        lowBattery = isLowBattery(battery.level, battery.charging);
        battery.addEventListener("levelchange", onBatteryChange);
        battery.addEventListener("chargingchange", onBatteryChange);
        updateMode();
      }).catch(() => {
        /* Battery API is optional and may be blocked by browser policy. */
      });
    }

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
      disposed = true;
      cancelDelay();
      stageObserver.disconnect();
      window.removeEventListener("pointermove", handlePointerIntent);
      document.removeEventListener("visibilitychange", updateMode);
      motionQuery.removeEventListener("change", updateMode);
      mobileQuery.removeEventListener("change", updateMode);
      tabletQuery.removeEventListener("change", updateMode);
      coarseQuery.removeEventListener("change", updateMode);
      connection?.removeEventListener?.("change", updateMode);
      batteryRef?.removeEventListener("levelchange", onBatteryChange);
      batteryRef?.removeEventListener("chargingchange", onBatteryChange);
    };
  }, []);

  const qualityTier = mode === "fallback" ? "fallback" : mode === "tablet" ? "medium" : "high";

  return (
    <div
      ref={stageRef}
      className="hero-3d-bg-wrap"
      data-hero-mode={mode}
      data-quality-tier={qualityTier}
      aria-hidden="true"
    >
      {mode === "fallback" ? (fallback ?? <HeroFallback />) : <Hero3DCanvas quality={mode} fallback={fallback} />}
    </div>
  );
}
