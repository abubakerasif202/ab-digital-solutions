"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

const NightDeskScene = dynamic(() => import("./NightDeskScene"), { ssr: false });

export type StageProject = { slug: string; name: string; sector: string };

type Mode = "poster" | "offer" | "live";

/**
 * The hero studio. A rendered poster is always present; the WebGL scene is
 * loaded after idle on capable desktops, offered as an explicit choice on small
 * or data-saving devices, and never started for reduced-motion visitors.
 */
export function HeroStage({ projects }: { projects: readonly StageProject[] }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [mode, setMode] = useState<Mode>("poster");
  const [ready, setReady] = useState(false);
  const [visible, setVisible] = useState(true);
  const [screen, setScreen] = useState(0);
  const [lampOn, setLampOn] = useState(true);
  const [hue, setHue] = useState(0);

  useEffect(() => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const canvas = document.createElement("canvas");
    const hasWebGL = Boolean(canvas.getContext("webgl2") ?? canvas.getContext("webgl"));
    if (reducedMotion || !hasWebGL) return;

    const connection = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
    const constrainedDevice = window.matchMedia("(max-width: 720px)").matches || Boolean(connection?.saveData);
    let handle = 0;
    if (constrainedDevice) {
      handle = window.setTimeout(() => setMode("offer"), 0);
      return () => window.clearTimeout(handle);
    }
    // Keep three.js off the critical path: start it once the page is idle.
    const start = () => setMode("live");
    if (typeof window.requestIdleCallback === "function") {
      const idle = window.requestIdleCallback(start, { timeout: 1800 });
      return () => window.cancelIdleCallback(idle);
    }
    handle = globalThis.setTimeout(start, 900) as unknown as number;
    return () => globalThis.clearTimeout(handle);
  }, []);

  // Rendering stops whenever the stage is off screen or the tab is hidden.
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    let onScreen = true;
    const update = () => setVisible(onScreen && document.visibilityState === "visible");
    const observer = new IntersectionObserver(([entry]) => { onScreen = entry.isIntersecting; update(); }, { threshold: 0.05 });
    observer.observe(root);
    document.addEventListener("visibilitychange", update);
    return () => { observer.disconnect(); document.removeEventListener("visibilitychange", update); };
  }, []);

  const live = mode === "live";
  const project = projects[screen % projects.length];
  const nextScreen = () => setScreen((current) => (current + 1) % projects.length);

  return (
    <div ref={rootRef} className="stage" data-live={live && ready}>
      <Image
        className="stage-poster"
        src="/hero/night-desk-poster.webp"
        alt="Illustrated AB Web Studio workspace at night: a developer at a desk with two screens of client websites, the AB monogram in neon and the Sydney harbour through the window"
        fill
        preload
        sizes="(max-width: 960px) 100vw, 55vw"
      />
      {live && (
        <div className="stage-canvas" aria-hidden="true">
          <NightDeskScene
            slugs={projects.map((item) => item.slug)}
            screen={screen}
            lampOn={lampOn}
            hue={hue}
            active={visible}
            onReady={() => setReady(true)}
            onNextScreen={nextScreen}
            onToggleLamp={() => setLampOn((on) => !on)}
            onCycleHue={() => setHue((value) => (value + 1) % 3)}
          />
        </div>
      )}

      {live && ready && <p className="stage-hint" aria-hidden="true">Click the screens, lamp or sign</p>}

      <div className="stage-ui">
        {live && ready ? (
          <>
            <Link className="stage-screen" href={`/work/${project.slug}`} aria-live="polite">
              <small>On screen · {project.sector}</small>
              {project.name}
            </Link>
            <div className="stage-controls" role="group" aria-label="Studio scene controls">
              <button type="button" onClick={nextScreen}>Next project</button>
              <button type="button" aria-pressed={lampOn} onClick={() => setLampOn((on) => !on)}>Lamp</button>
              <button type="button" onClick={() => setHue((value) => (value + 1) % 3)}>Lights</button>
            </div>
          </>
        ) : mode === "offer" ? (
          <div className="stage-controls">
            <button type="button" onClick={() => setMode("live")}>Explore the studio in 3D</button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
