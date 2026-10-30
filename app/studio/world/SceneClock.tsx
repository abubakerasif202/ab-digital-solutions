"use client";

import { createContext, useContext, useEffect, useMemo, type ReactNode } from "react";
import { useThree } from "@react-three/fiber";
import { AnimationScheduler } from "./sim/scheduler";
import { shouldDowngrade, tierConfig, DOWNGRADE_WINDOW, type Tier, type TierConfig } from "./sim/quality";

type Clock = { scheduler: AnimationScheduler; quality: TierConfig };
const ClockContext = createContext<Clock | null>(null);

/** Systems call this to register their tick; they get a stable scheduler and the active quality tier. */
export function useSceneClock() {
  const clock = useContext(ClockContext);
  if (!clock) throw new Error("useSceneClock needs <SceneClock>");
  return clock;
}

/**
 * Drives the scheduler from a throttled rAF loop and asks R3F for a frame only when ambient systems
 * stepped. When the studio is hidden, reduced-motion, or idle, the loop stops: no timers, no draws.
 */
export function SceneClock({ tier, active, onDowngrade, children }: { tier: Tier; active: boolean; onDowngrade?: () => void; children: ReactNode }) {
  const invalidate = useThree((s) => s.invalidate);
  const quality = tierConfig[tier];
  const scheduler = useMemo(() => new AnimationScheduler(), []);
  const value = useMemo(() => ({ scheduler, quality }), [scheduler, quality]);

  useEffect(() => {
    scheduler.initialize(performance.now());
    scheduler.setPaused(!active);
    if (!active) return;
    let raf = 0;
    let lastRun = 0;
    let running = false;
    let prevFrame = 0;
    let frames: number[] = [];
    let slowBefore = false;
    const interval = 1000 / quality.simHz;
    const loop = (now: number) => {
      raf = 0;
      if (prevFrame) {
        frames.push(now - prevFrame);
        if (frames.length >= DOWNGRADE_WINDOW) {
          const verdict = shouldDowngrade(slowBefore, frames);
          slowBefore = verdict.slow; frames = [];
          if (verdict.downgrade) onDowngrade?.();
        }
      }
      prevFrame = now;
      if (now - lastRun >= interval) {
        // Preserve fractional frame time: resetting to `now` turns a 45 Hz budget into 30 Hz
        // on a 60 Hz display (and a 24 Hz budget into 20 Hz).
        lastRun = now - ((now - lastRun) % interval);
        const stepped = scheduler.step(now);
        if (scheduler.isResting(now) || scheduler.size === 0) { running = false; prevFrame = 0; return; }
        if (stepped) invalidate();
      }
      raf = requestAnimationFrame(loop);
    };
    const start = () => {
      if (!running && !scheduler.isResting(performance.now())) {
        running = true; lastRun = 0; raf = requestAnimationFrame(loop);
      }
    };
    const wake = () => { scheduler.poke(performance.now()); start(); };
    // System registration can resume an empty driver, but must never extend the visitor's
    // idle deadline. Tier changes rebuild exterior systems without any user interaction.
    const stopListening = scheduler.onWork(start);
    start();
    const events = ["pointerdown", "pointermove", "wheel", "keydown", "touchstart"] as const;
    for (const name of events) window.addEventListener(name, wake, { passive: true });
    return () => {
      if (raf) cancelAnimationFrame(raf);
      running = false;
      stopListening();
      for (const name of events) window.removeEventListener(name, wake);
    };
  }, [active, scheduler, quality, invalidate, onDowngrade]);

  return <ClockContext.Provider value={value}>{children}</ClockContext.Provider>;
}
