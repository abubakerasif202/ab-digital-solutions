"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState, useSyncExternalStore, type PointerEvent } from "react";
import { ArrowLeft, ArrowRight, Pause, Play } from "lucide-react";
import { ArrowIcon } from "../../icons";
import { ProjectArtwork } from "../../project-artwork";
import { projectDestinationLabel, projects } from "../../project-data";
import { advanceExhibition, createExhibitionBag, exhibitionCanRun, exhibitionComposition, exhibitionSwipeDirection, jumpExhibition, upcomingExhibition, type ExhibitionShow, type ExhibitionInteraction } from "./exhibition-sequence";

const pauseKey = "ab-project-exhibition-paused";
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
  const [paused, setPaused] = useState(false);
  const [interaction, setInteraction] = useState<ExhibitionInteraction>({ pointerInside: false, pointerOverInteractive: false, focusInside: false, focusVisible: false });
  const gesture = useRef<{ x: number; y: number } | null>(null);
  const suppressClickUntil = useRef(0);
  const [visible, setVisible] = useState(false);
  const [loaded, setLoaded] = useState<ReadonlySet<string>>(() => new Set());
  const [failed, setFailed] = useState<ReadonlySet<string>>(() => new Set());
  const environment = useSyncExternalStore(subscribeEnvironment, environmentSnapshot, serverEnvironment);
  const reduced = Boolean(environment & 1);
  const saveData = Boolean(environment & 2);
  const running = exhibitionCanRun({ ...interaction, paused, visible, hidden: Boolean(environment & 4), reduced, saveData });
  const activeIndex = timeline.sequence[timeline.cursor];
  const active = projects[activeIndex];
  const imageFailed = failed.has(active.slug);
  const imageReady = loaded.has(active.slug);
  const previous = timeline.previous === null ? null : projects[timeline.previous];
  const upcoming = upcomingExhibition(timeline, 6).map((index, order) => ({ index, offset: order + 1 }));
  const selectNext = () => setShow((current) => advanceExhibition(current, 1, projects.length, Math.random));
  const selectPrevious = () => setShow((current) => advanceExhibition(current, -1, projects.length, Math.random));

  useEffect(() => {
    // The server and first hydrated frame share one predictable genuine project.
    const initialize = window.setTimeout(() => {
      if (!root.current?.contains(document.activeElement)) setShow({ timeline: { sequence: createExhibitionBag(projects.length, Math.random), cursor: 0, previous: null }, step: 0 });
      try { setPaused(localStorage.getItem(pauseKey) === "true"); } catch { /* Storage is optional; in-memory pause still works. */ }
    }, 0);
    return () => window.clearTimeout(initialize);
  }, []);

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
  }, [reduced, saveData]);

  const togglePause = () => {
    const next = !paused;
    setPaused(next);
    try { localStorage.setItem(pauseKey, String(next)); } catch { /* Privacy modes may disable storage. */ }
  };
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
  const jumpAhead = (offset: number) => setShow((current) => jumpExhibition(current, offset, projects.length, Math.random));
  const updatePointerInteraction = (target: EventTarget) => {
    const interactive = target instanceof Element && Boolean(target.closest("a, button"));
    setInteraction((current) => current.pointerInside && current.pointerOverInteractive === interactive ? current : { ...current, pointerInside: true, pointerOverInteractive: interactive });
  };

  return (
    <div className="exhibition" ref={root} data-running={running} data-project={active.slug} data-image-failed={imageFailed} data-image-state={imageFailed ? "failed" : imageReady ? "ready" : "loading"} data-composition={exhibitionComposition(show.step)} data-step={show.step} role="region" aria-roledescription="carousel" aria-label="Project exhibition"
      onPointerEnter={(event) => { if (event.pointerType === "mouse") { updatePointerInteraction(event.target); bounds.current = event.currentTarget.getBoundingClientRect(); } }}
      onPointerLeave={resetPointer}
      onPointerMove={(event) => { if (event.pointerType === "mouse") updatePointerInteraction(event.target); movePointer(event); }}
      onPointerDown={(event) => {
        if (event.pointerType === "mouse") setInteraction((current) => current.focusVisible ? { ...current, focusVisible: false } : current);
        if (event.pointerType === "touch" && !(event.target instanceof Element && event.target.closest("button"))) gesture.current = { x: event.clientX, y: event.clientY };
      }}
      onPointerCancel={() => { gesture.current = null; }}
      onPointerUp={(event) => {
        const start = gesture.current;
        gesture.current = null;
        if (!start || event.pointerType !== "touch") return;
        const direction = exhibitionSwipeDirection(event.clientX - start.x, event.clientY - start.y);
        if (direction) { suppressClickUntil.current = Date.now() + 500; setShow((current) => advanceExhibition(current, direction, projects.length, Math.random)); }
      }}
      onClickCapture={(event) => { if (Date.now() < suppressClickUntil.current) { event.preventDefault(); event.stopPropagation(); } }}
      onFocusCapture={(event) => setInteraction((current) => ({ ...current, focusInside: true, focusVisible: event.target.matches(":focus-visible") }))}
      onKeyDownCapture={() => setInteraction((current) => current.focusInside && !current.focusVisible ? { ...current, focusVisible: true } : current)}
      onBlurCapture={(event) => { if (!(event.relatedTarget instanceof Node) || !event.currentTarget.contains(event.relatedTarget)) setInteraction((current) => ({ ...current, focusInside: false, focusVisible: false })); }}>
      <div className="exhibition-topline"><span><i aria-hidden="true" />The digital exhibition</span><span>{projects.length} projects / Always in perspective</span></div>
      <div className="exhibition-stage">
        <div className="exhibition-feature">
          <div className="exhibition-image-stack" aria-hidden="true">
            {imageFailed ? <div className="exhibition-image-fallback"><span>Project preview unavailable</span><span>The case study is still available below.</span></div> : <>
              {!imageReady && <div className="exhibition-image-fallback exhibition-image-loading"><span>Loading project preview</span></div>}
              {imageReady && previous && previous.slug !== active.slug && <div className="exhibition-image exhibition-image--previous" key={`previous-${previous.slug}`}><ProjectArtwork project={previous} sizes="(max-width: 720px) 92vw, 70vw" /></div>}
              <div className="exhibition-image exhibition-image--current" key={active.slug} data-ready={loaded.has(active.slug)}>
                <Image src={active.image} alt={active.alt} fill loading="lazy" sizes="(max-width: 720px) 92vw, 70vw" onLoad={() => setLoaded((current) => new Set(current).add(active.slug))} onError={() => setFailed((current) => new Set(current).add(active.slug))} />
              </div>
            </>}
          </div>
          <Link className="exhibition-feature-link" href={`/work/${active.slug}`} aria-label={`${active.name} — View case study`}>
            <span className="exhibition-feature-open" aria-hidden="true"><ArrowIcon /></span>
            <span className="exhibition-destination">{projectDestinationLabel(active)}</span>
            <span className="exhibition-feature-caption" key={active.slug}><span>{active.sector}</span><strong>{active.name}</strong><span className="exhibition-view">View case study <ArrowIcon /></span></span>
          </Link>
        </div>
        <div className="exhibition-rail" aria-label="Upcoming projects">
          {upcoming.slice(0, 2).map(({ index, offset }) => {
            const project = projects[index];
            return <button className="exhibition-preview" key={`slot-${offset}`} onClick={() => jumpAhead(offset)} type="button" aria-label={`Feature ${project.name}`}>
              <span className="exhibition-preview-image" key={project.slug}><ProjectArtwork project={project} sizes="(max-width: 720px) 42vw, 25vw" /></span>
              <span className="exhibition-preview-copy"><span>{offset === 1 ? "Up next" : "Another perspective"}</span><strong>{project.name}</strong><ArrowIcon /></span>
            </button>;
          })}
        </div>
        <span className="exhibition-number" aria-hidden="true">{String(activeIndex + 1).padStart(2, "0")}</span>
      </div>
      <div className="exhibition-footer">
        <div className="exhibition-controls" role="group" aria-label="Project exhibition controls">
          <button type="button" onClick={selectPrevious} disabled={timeline.cursor === 0} aria-label="Previous project"><ArrowLeft size={18} /></button>
          <button className="exhibition-pause" type="button" onClick={togglePause} aria-pressed={paused} disabled={reduced || saveData} aria-label={reduced || saveData ? "Automatic project motion disabled by your preferences" : paused ? "Resume automatic project motion" : "Pause automatic project motion"}>{paused || reduced || saveData ? <Play size={15} /> : <Pause size={15} />}<span>{reduced || saveData ? "Manual browsing" : paused ? "Motion paused" : "Pause motion"}</span></button>
          <button type="button" onClick={selectNext} aria-label="Next project"><ArrowRight size={18} /></button>
        </div>
        <p className="exhibition-counter" aria-live={interaction.focusVisible || paused || reduced || saveData ? "polite" : "off"}>{String(activeIndex + 1).padStart(2, "0")} <span>/ {String(projects.length).padStart(2, "0")}</span><span className="sr-only"> · {active.name}</span></p>
        <div className="exhibition-progress" key={`${active.slug}-${running}`} aria-hidden="true"><span /></div>
      </div>
      <div className="exhibition-thumbnails" aria-hidden="true"><div key={active.slug}>{upcoming.map(({ index, offset }) => <span key={`${offset}-${projects[index].slug}`}><ProjectArtwork project={projects[index]} sizes="(max-width: 720px) 30vw, 15vw" /></span>)}</div></div>
    </div>
  );
}
