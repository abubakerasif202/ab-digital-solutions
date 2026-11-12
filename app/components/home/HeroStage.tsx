"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import type { WallEngine, WallProject } from "./wall/WallEngine";
import { wallStore } from "./wall/wall-store";

export type StageProject = WallProject & { href: string };

type NavigatorWithHints = Navigator & { deviceMemory?: number; connection?: { saveData?: boolean } };

const AUTO_ADVANCE_MS = 6500;
const MANUAL_HOLD_MS = 14000;

function subscribeReducedMotion(listener: () => void): () => void {
  const query = window.matchMedia("(prefers-reduced-motion: reduce)");
  query.addEventListener("change", listener);
  return () => query.removeEventListener("change", listener);
}

function getReducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function isInteractive(target: EventTarget | null): boolean {
  return target instanceof Element && target.closest("a, button, input, select, textarea, summary, [role='button']") !== null;
}

/**
 * The persistent WebGL stage. It sits sticky behind the hero and the work
 * index; the project wall is a real portfolio screenshot built from tiles,
 * and the lens under the cursor develops its structure into the finished
 * render. Everything meaningful is also present as DOM: the headline, the
 * project links and the selector, so the page works without WebGL.
 */
export function HeroStage({ projects }: { projects: readonly StageProject[] }) {
  const stageRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const tagRef = useRef<HTMLDivElement>(null);
  const coordsRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<WallEngine | null>(null);
  const blendRef = useRef(0);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [paused, setPaused] = useState(false);
  const [hudFocused, setHudFocused] = useState(false);
  const reduced = useSyncExternalStore(subscribeReducedMotion, getReducedMotion, () => false);
  const motionRef = useRef({ reduced, paused: paused || hudFocused });
  useEffect(() => {
    motionRef.current = { reduced, paused: paused || hudFocused };
    engineRef.current?.setMotion(reduced, paused || hudFocused);
  }, [reduced, paused, hudFocused]);
  const index = useSyncExternalStore(wallStore.subscribe, wallStore.getFocus, () => 0);
  const project = projects[index] ?? projects[0];

  // Keep the engine in step with the shared focus.
  useEffect(() => {
    engineRef.current?.setFocus(index);
  }, [index]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const stage = stageRef.current;
    const scope = stage?.parentElement;
    if (!canvas || !stage || !scope) return;

    const nav = navigator as NavigatorWithHints;
    if (nav.connection?.saveData || (nav.deviceMemory !== undefined && nav.deviceMemory < 2)) return;

    const controller = new AbortController();
    const mobile = window.innerWidth < 768 || window.matchMedia("(pointer: coarse)").matches;
    let cancelled = false;
    let engine: WallEngine | null = null;
    let inView = true;
    let frame = 0;
    let releaseTimer = 0;

    const placeChip = (x: number, y: number, active: boolean, cornerX: number, cornerY: number, radiusPx: number): void => {
      const tag = tagRef.current;
      const coords = coordsRef.current;
      if (tag) {
        const left = clamp(cornerX, 12, window.innerWidth - 300);
        tag.style.transform = `translate3d(${Math.round(left)}px, ${Math.round(Math.max(cornerY, 96))}px, 0)`;
      }
      if (coords) {
        const right = x + radiusPx + 120 < window.innerWidth;
        const cx = right ? x + radiusPx + 12 : x - radiusPx - 112;
        coords.style.transform = `translate3d(${Math.round(cx)}px, ${Math.round(y - 6)}px, 0)`;
        coords.textContent = `x ${Math.round(x)}  y ${Math.round(y)}`;
        coords.dataset.on = active ? "true" : "false";
      }
    };

    const measure = (): void => {
      frame = 0;
      const work = document.getElementById("work");
      if (!work) return;
      const vh = window.innerHeight;
      const top = work.getBoundingClientRect().top;
      const blend = clamp((vh * 0.9 - top) / (vh * 0.9), 0, 1);
      blendRef.current = blend;
      stage.dataset.mode = blend > 0.55 ? "work" : "hero";
      engine?.setScroll(blend);
    };
    const onScroll = (): void => {
      if (!frame) frame = window.requestAnimationFrame(measure);
    };

    const onMove = (event: PointerEvent): void => {
      window.clearTimeout(releaseTimer);
      engine?.setPointer(event.clientX, event.clientY, true);
      if (event.pointerType === "touch") {
        releaseTimer = window.setTimeout(() => engine?.setPointer(0, 0, false), 1800);
      }
    };
    const onLeave = (): void => engine?.setPointer(0, 0, false);
    const onDown = (event: PointerEvent): void => {
      if (isInteractive(event.target)) return;
      engine?.pulse();
    };

    const observer = new IntersectionObserver(([entry]) => {
      inView = entry.isIntersecting;
      engine?.setVisible(inView);
    });
    observer.observe(scope);

    const advance = window.setInterval(() => {
      if (motionRef.current.reduced || motionRef.current.paused || document.hidden || !inView) return;
      if (blendRef.current > 0.2) return;
      if (wallStore.msSinceManual() < MANUAL_HOLD_MS) return;
      wallStore.setFocus((wallStore.getFocus() + 1) % projects.length, "auto");
    }, AUTO_ADVANCE_MS);

    const boot = (): void => {
      void import("./wall/WallEngine")
        .then(({ createWallEngine }) =>
          createWallEngine({
            canvas,
            projects,
            reducedMotion: motionRef.current.reduced,
            signal: controller.signal,
            mobile,
            onLens: placeChip,
            onReady: () => {
              if (!cancelled) {
                setReady(true);
                setFailed(false);
              }
            },
            onLost: () => {
              if (!cancelled) {
                setReady(false);
                setFailed(true);
              }
            },
          }),
        )
        .then((created) => {
          if (cancelled) {
            created.dispose();
            return;
          }
          engine = created;
          engineRef.current = created;
          created.setMotion(motionRef.current.reduced, motionRef.current.paused);
          created.setFocus(wallStore.getFocus());
          created.setVisible(inView);
          measure();
        })
        .catch(() => {
          if (!cancelled) setFailed(true);
        });
    };

    // Boot after the headline has painted so WebGL never competes with LCP.
    const hasIdle = typeof window.requestIdleCallback === "function";
    const idle = hasIdle
      ? window.requestIdleCallback(boot, { timeout: 1200 })
      : window.setTimeout(boot, 500);

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerdown", onDown, { passive: true });
    document.addEventListener("pointerleave", onLeave);
    window.addEventListener("blur", onLeave);
    onScroll();

    return () => {
      cancelled = true;
      controller.abort();
      if (hasIdle) window.cancelIdleCallback(idle);
      else window.clearTimeout(idle);
      window.clearInterval(advance);
      window.clearTimeout(releaseTimer);
      if (frame) window.cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onDown);
      document.removeEventListener("pointerleave", onLeave);
      window.removeEventListener("blur", onLeave);
      engineRef.current = null;
      engine?.dispose();
    };
  }, [projects]);

  return (
    <div className="hx-stage" ref={stageRef} data-mode="hero" data-motion={reduced ? "reduced" : paused ? "paused" : "playing"} data-ready={ready ? "true" : "false"} data-failed={failed ? "true" : "false"}>
      <div className="hx-poster" aria-hidden="true">
        <Image src={project.image} alt="" width={1348} height={926} sizes="(max-width: 900px) 100vw, 62vw" priority />
      </div>
      <canvas className="hx-canvas" ref={canvasRef} aria-hidden="true" />
      <div className="hx-veil" aria-hidden="true" />

      <div className="hx-tag" ref={tagRef} aria-hidden="true">
        <span className="hx-tag-label">inspecting</span>
        <strong>{project.name}</strong>
        <span>{project.stack.slice(0, 3).join(" / ")}</span>
      </div>
      <div className="hx-coords" ref={coordsRef} data-on="false" aria-hidden="true" />

      <div className="hx-hud"
        onFocusCapture={() => setHudFocused(true)}
        onBlurCapture={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget)) setHudFocused(false);
        }}
      >
        <button type="button" className="hx-motion" aria-label={paused ? "Resume portfolio motion" : "Pause portfolio motion"}
          aria-pressed={paused} onClick={() => setPaused((value) => !value)}>
          {paused ? "Resume motion" : "Pause motion"}
        </button>
        <div className="hx-select" role="group" aria-label="Featured projects">
          {projects.map((item, i) => (
            <button
              key={item.slug}
              type="button"
              className="hx-pip"
              aria-label={`Show ${item.name}`}
              aria-pressed={i === index}
              onClick={() => wallStore.setFocus(i, "hero")}
            >
              <span aria-hidden="true">{String(i + 1).padStart(2, "0")}</span>
            </button>
          ))}
        </div>
        <Link className="hx-case" href={project.href} prefetch={false}>
          <span className="hx-case-label">Now showing · {String(index + 1).padStart(2, "0")}/{String(projects.length).padStart(2, "0")}</span>
          <strong>{project.name}</strong>
          <span className="hx-case-meta">{project.sector}</span>
          <span className="hx-case-go" aria-hidden="true">View case study</span>
        </Link>
      </div>
    </div>
  );
}
