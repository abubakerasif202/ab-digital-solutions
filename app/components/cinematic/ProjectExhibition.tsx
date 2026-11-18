"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useSyncExternalStore, type PointerEvent } from "react";
import { ArrowLeft, ArrowRight, Pause, Play } from "lucide-react";
import { ArrowIcon } from "../../icons";
import { ProjectArtwork } from "../../project-artwork";
import { projectDestinationLabel, projects } from "../../project-data";
import { advanceExhibition, exhibitionCanRun, exhibitionComposition, exhibitionSwipeDirection, jumpExhibition, upcomingExhibition, type ExhibitionShow, type ExhibitionInteraction } from "./exhibition-sequence";

const duration = 7200;
const previewDeadline = 8000;
type Network = EventTarget & { saveData?: boolean };
const connection = () => (navigator as Navigator & { connection?: Network }).connection;
function environmentSnapshot() {
  return (window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 1 : 0) |
    (connection()?.saveData ? 2 : 0) | (document.hidden ? 4 : 0);
}
function subscribeEnvironment(notify: () => void) {
  const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const network = connection();
  motion.addEventListener("change", notify);
  network?.addEventListener("change", notify);
  document.addEventListener("visibilitychange", notify);
  return () => { motion.removeEventListener("change", notify); network?.removeEventListener("change", notify); document.removeEventListener("visibilitychange", notify); };
}
const serverEnvironment = () => 7;

export function ProjectExhibition() {
  const root = useRef<HTMLDivElement>(null);
  const pointerFrame = useRef(0);
  const bounds = useRef<DOMRect | null>(null);
  const [show, setShow] = useState<ExhibitionShow>({ timeline: { sequence: projects.map((_, index) => index), cursor: 0, previous: null }, step: 0 });
  const timeline = show.timeline;
  const [interaction, setInteraction] = useState<ExhibitionInteraction>({ pointerInside: false, pointerOverInteractive: false, focusInside: false, focusVisible: false });
  const gesture = useRef<{ x: number; y: number } | null>(null);
  // Keep the destination stable between finger-down and release, including on controls.
  const [touchActive, setTouchActive] = useState(false);
  // An explicit visitor pause (WCAG 2.2.2) that no hover, focus or swipe can lift.
  const [userPaused, setUserPaused] = useState(false);
  const suppressClickUntil = useRef(0);
  const [visible, setVisible] = useState(false);
  const [loaded, setLoaded] = useState<ReadonlySet<string>>(() => new Set());
  const [failed, setFailed] = useState<ReadonlySet<string>>(() => new Set());
  const environment = useSyncExternalStore(subscribeEnvironment, environmentSnapshot, serverEnvironment);
  const reduced = Boolean(environment & 1);
  const saveData = Boolean(environment & 2);
  const running = exhibitionCanRun({ ...interaction, paused: touchActive || userPaused, visible, hidden: Boolean(environment & 4), reduced, saveData });
  const activeIndex = timeline.sequence[timeline.cursor];
  const active = projects[activeIndex];
  const imageFailed = failed.has(active.slug);
  const imageReady = loaded.has(active.slug);
  const upcoming = upcomingExhibition(timeline, 2).map((index, order) => ({ index, offset: order + 1 }));
  const selectNext = () => setShow((current) => advanceExhibition(current, 1, projects.length, Math.random));
  const selectPrevious = () => setShow((current) => advanceExhibition(current, -1, projects.length, Math.random));

  useEffect(() => {
    const element = root.current;
    if (!element) return;
    if (typeof IntersectionObserver === "undefined") {
      const ready = window.setTimeout(() => setVisible(true), 0);
      return () => { clearTimeout(ready); if (pointerFrame.current) cancelAnimationFrame(pointerFrame.current); };
    }
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), { threshold: 0.15 });
    observer.observe(element);
    return () => { observer.disconnect(); if (pointerFrame.current) cancelAnimationFrame(pointerFrame.current); };
  }, []);

  useEffect(() => {
    if (!running) return;
    const timer = window.setTimeout(() => setShow((current) => advanceExhibition(current, 1, projects.length, Math.random)), duration);
    return () => window.clearTimeout(timer);
  }, [running, timeline]);

  useEffect(() => {
    if (!visible || imageReady || imageFailed) return;
    const deadline = window.setTimeout(() => setFailed((current) => new Set(current).add(active.slug)), previewDeadline);
    return () => window.clearTimeout(deadline);
  }, [active.slug, imageReady, imageFailed, visible]);

  useEffect(() => {
    if (!reduced && !saveData) return;
    root.current?.style.removeProperty("--exhibition-x");
    root.current?.style.removeProperty("--exhibition-y");
    root.current?.style.removeProperty("--exhibition-drag");
    if (root.current) root.current.dataset.dragging = "false";
  }, [reduced, saveData]);

  const resetPointer = () => {
    setInteraction((current) => ({ ...current, pointerInside: false, pointerOverInteractive: false }));
    if (pointerFrame.current) cancelAnimationFrame(pointerFrame.current);
    pointerFrame.current = 0;
    root.current?.style.removeProperty("--exhibition-x");
    root.current?.style.removeProperty("--exhibition-y");
  };
  const movePointer = (event: PointerEvent<HTMLDivElement>) => {
    if (event.pointerType !== "mouse" || reduced || saveData || !bounds.current) return;
    const x = Math.max(-1, Math.min(1, (event.clientX - bounds.current.left) / bounds.current.width * 2 - 1));
    const y = Math.max(-1, Math.min(1, (event.clientY - bounds.current.top) / bounds.current.height * 2 - 1));
    if (pointerFrame.current) cancelAnimationFrame(pointerFrame.current);
    pointerFrame.current = requestAnimationFrame(() => {
      root.current?.style.setProperty("--exhibition-x", `${x * 8}px`);
      root.current?.style.setProperty("--exhibition-y", `${y * 5}px`);
      pointerFrame.current = 0;
    });
  };
  // A finger moves the featured frame a little ahead of the swipe, then it settles back.
  const dragFinger = (event: PointerEvent<HTMLDivElement>) => {
    const start = gesture.current;
    const element = root.current;
    if (!start || !element || event.pointerType !== "touch" || reduced || saveData) return;
    const dx = event.clientX - start.x;
    if (Math.abs(dx) < Math.abs(event.clientY - start.y) * 1.2) return;
    element.dataset.dragging = "true";
    element.style.setProperty("--exhibition-drag", `${Math.max(-64, Math.min(64, dx * 0.4))}px`);
  };
  const settleFinger = () => {
    setTouchActive(false);
    if (!root.current) return;
    root.current.dataset.dragging = "false";
    root.current.style.removeProperty("--exhibition-drag");
  };
  const jumpAhead = (offset: number) => setShow((current) => jumpExhibition(current, offset, projects.length, Math.random));
  const updatePointerInteraction = (target: EventTarget) => {
    const interactive = target instanceof Element && Boolean(target.closest("a, button"));
    setInteraction((current) => current.pointerInside && current.pointerOverInteractive === interactive ? current : { ...current, pointerInside: true, pointerOverInteractive: interactive });
  };

  return (
    <div className="exhibition" ref={root} data-running={running} data-dragging="false" data-project={active.slug} data-image-failed={imageFailed} data-image-state={imageFailed ? "failed" : imageReady ? "ready" : "loading"} data-composition={exhibitionComposition(show.step)} data-step={show.step} role="region" aria-roledescription="carousel" aria-label="Project exhibition"
      onPointerEnter={(event) => { if (event.pointerType === "mouse") { updatePointerInteraction(event.target); bounds.current = event.currentTarget.getBoundingClientRect(); } }}
      onPointerLeave={(event) => { resetPointer(); if (event.pointerType === "touch") { gesture.current = null; settleFinger(); } }}
      onPointerMove={(event) => { if (event.pointerType === "mouse") updatePointerInteraction(event.target); movePointer(event); dragFinger(event); }}
      onPointerDown={(event) => {
        if (event.pointerType === "mouse") setInteraction((current) => current.focusVisible ? { ...current, focusVisible: false } : current);
        if (event.pointerType === "touch") {
          setTouchActive(true);
          if (!(event.target instanceof Element && event.target.closest("button"))) gesture.current = { x: event.clientX, y: event.clientY };
        }
      }}
      onPointerCancel={() => { gesture.current = null; settleFinger(); }}
      onPointerUp={(event) => {
        const start = gesture.current;
        gesture.current = null;
        settleFinger();
        if (!start || event.pointerType !== "touch") return;
        const direction = exhibitionSwipeDirection(event.clientX - start.x, event.clientY - start.y);
        if (direction) { suppressClickUntil.current = Date.now() + 500; setShow((current) => advanceExhibition(current, direction, projects.length, Math.random)); }
      }}
      onClickCapture={(event) => { if (Date.now() < suppressClickUntil.current) { event.preventDefault(); event.stopPropagation(); } }}
      onFocusCapture={(event) => setInteraction((current) => ({ ...current, focusInside: true, focusVisible: event.target.matches(":focus-visible") }))}
      onKeyDownCapture={() => setInteraction((current) => current.focusInside && !current.focusVisible ? { ...current, focusVisible: true } : current)}
      onBlurCapture={(event) => { if (!(event.relatedTarget instanceof Node) || !event.currentTarget.contains(event.relatedTarget)) setInteraction((current) => ({ ...current, focusInside: false, focusVisible: false })); }}>
      <div className="exhibition-topline"><span><i aria-hidden="true" />Featured project</span><span>{projects.length} case studies</span></div>
      <div className="exhibition-stage">
        <div className="exhibition-feature">
          <div className="exhibition-image-stack">
            {imageFailed ? <div className="exhibition-image-fallback"><span>Project preview unavailable</span><span>The case study is still available below.</span></div> : <>
              {!imageReady && <div className="exhibition-image-fallback exhibition-image-loading"><span>Loading project preview</span></div>}
              <div className="exhibition-image exhibition-image--current" key={active.slug}>
                <ProjectArtwork project={active} sizes="(max-width: 767.98px) calc(100vw - 40px), min(62vw, 990px)" onLoad={() => setLoaded((current) => new Set(current).add(active.slug))} onError={() => setFailed((current) => new Set(current).add(active.slug))} />
              </div>
            </>}
          </div>
          <Link className="exhibition-feature-link" href={`/work/${active.slug}`} prefetch={false}>
            <span className="exhibition-feature-caption" key={active.slug}><span>{active.sector}</span><strong>{active.name}</strong></span>
            <span className="exhibition-feature-actions"><span className="exhibition-destination">{projectDestinationLabel(active)}</span><span className="exhibition-view">View case study <ArrowIcon /></span></span>
          </Link>
        </div>
        <div className="exhibition-rail" role="group" aria-label="Upcoming projects">
          {upcoming.map(({ index, offset }) => {
            const project = projects[index];
            return <button className="exhibition-preview" key={`slot-${offset}`} onClick={() => jumpAhead(offset)} type="button">
              <span className="exhibition-preview-image" key={project.slug} aria-hidden="true"><ProjectArtwork project={project} sizes="(max-width: 767.98px) 43vw, 29vw" decorative /></span>
              <span className="exhibition-preview-copy"><span>{offset === 1 ? "Up next" : "Another perspective"}</span><strong>{project.name}</strong><ArrowIcon /></span>
            </button>;
          })}
        </div>
        <span className="exhibition-number" aria-hidden="true">{String(activeIndex + 1).padStart(2, "0")}</span>
      </div>
      <div className="exhibition-footer">
        <div className="exhibition-controls" role="group" aria-label="Project exhibition controls">
          <button type="button" onClick={selectPrevious} disabled={timeline.cursor === 0} aria-label="Previous project"><ArrowLeft size={18} /></button>
          <button type="button" onClick={selectNext} aria-label="Next project"><ArrowRight size={18} /></button>
          {!reduced && !saveData && (
            <button type="button" onClick={() => setUserPaused((current) => !current)} aria-label="Pause project autoplay" aria-pressed={userPaused}>
              {userPaused ? <Play size={16} aria-hidden="true" /> : <Pause size={16} aria-hidden="true" />}
            </button>
          )}
        </div>
        <p className="exhibition-counter" aria-live={interaction.focusVisible || reduced || saveData ? "polite" : "off"}>{String(activeIndex + 1).padStart(2, "0")} <span>/ {String(projects.length).padStart(2, "0")}</span><span className="sr-only"> · {active.name}</span></p>
        <div className="exhibition-progress" key={`${active.slug}-${running}`} aria-hidden="true"><span /></div>
      </div>
    </div>
  );
}
