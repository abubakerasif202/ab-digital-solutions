"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { ArrowLeft, ArrowRight, Pause, Play } from "lucide-react";
import { ArrowIcon, Glyph } from "../icons";
import { ProjectArtwork } from "../project-artwork";
import { formatCategory, projects } from "../project-data";
import { motionTokens } from "./motion/tokens";

const reducedMotionQuery = "(prefers-reduced-motion: reduce)";

function subscribeToReducedMotion(onStoreChange: () => void) {
  const mediaQuery = window.matchMedia(reducedMotionQuery);
  mediaQuery.addEventListener("change", onStoreChange);
  return () => mediaQuery.removeEventListener("change", onStoreChange);
}

function getReducedMotionSnapshot() {
  return window.matchMedia(reducedMotionQuery).matches;
}

function getReducedMotionServerSnapshot() {
  return false;
}

export function ProjectShowcase() {
  const rootRef = useRef<HTMLDivElement>(null);
  const [activeSlide, setActiveSlide] = useState(0);
  const [sliderPauseOverride, setSliderPauseOverride] = useState<boolean | null>(null);
  const [carouselEngaged, setCarouselEngaged] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [isPageVisible, setIsPageVisible] = useState(true);
  // The upcoming slide is only needed for the crossfade (first advance is
  // 6.5s away), so it mounts once the browser is idle instead of competing
  // with the first paint for bandwidth.
  const [nextSlideReady, setNextSlideReady] = useState(false);
  const prefersReducedMotion = useSyncExternalStore(
    subscribeToReducedMotion,
    getReducedMotionSnapshot,
    getReducedMotionServerSnapshot,
  );
  const sliderPreferencePaused = sliderPauseOverride ?? prefersReducedMotion;
  const sliderPaused = sliderPreferencePaused || carouselEngaged || !isVisible || !isPageVisible;
  const activeProject = projects[activeSlide];
  const nextSlide = (activeSlide + 1) % projects.length;

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const observer = new IntersectionObserver(
      ([entry]) => setIsVisible(entry.isIntersecting),
      { threshold: 0.05 },
    );
    observer.observe(root);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const idleWindow = window as typeof window & {
      requestIdleCallback?: (callback: () => void, options?: { timeout: number }) => number;
      cancelIdleCallback?: (id: number) => void;
    };
    const ready = () => setNextSlideReady(true);
    if (idleWindow.requestIdleCallback) {
      const id = idleWindow.requestIdleCallback(ready, { timeout: 2500 });
      return () => idleWindow.cancelIdleCallback?.(id);
    }
    const timer = window.setTimeout(ready, 1200);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    const updatePageVisibility = () => setIsPageVisible(document.visibilityState === "visible");
    updatePageVisibility();
    document.addEventListener("visibilitychange", updatePageVisibility);
    return () => document.removeEventListener("visibilitychange", updatePageVisibility);
  }, []);

  useEffect(() => {
    if (sliderPaused) return;
    const timer = window.setInterval(
      () => setActiveSlide((current) => (current + 1) % projects.length),
      motionTokens.duration.carousel,
    );
    return () => window.clearInterval(timer);
  }, [sliderPaused]);

  const showPreviousSlide = () => {
    setSliderPauseOverride(true);
    setActiveSlide((current) => (current - 1 + projects.length) % projects.length);
  };

  const showNextSlide = () => {
    setSliderPauseOverride(true);
    setActiveSlide((current) => (current + 1) % projects.length);
  };

  return (
    <div
      ref={rootRef}
      className="project-showcase"
      data-reveal
      data-tilt
      role="region"
      aria-roledescription="carousel"
      aria-label="Featured website projects"
      onMouseEnter={() => setCarouselEngaged(true)}
      onMouseLeave={() => setCarouselEngaged(false)}
      onFocusCapture={() => setCarouselEngaged(true)}
      onBlurCapture={(event) => {
        if (!(event.relatedTarget instanceof Node) || !event.currentTarget.contains(event.relatedTarget)) {
          setCarouselEngaged(false);
        }
      }}
    >
      <div className="showcase-topline">
        <span>Selected live work</span>
        <span>{String(activeSlide + 1).padStart(2, "0")} / {String(projects.length).padStart(2, "0")}</span>
      </div>
      <div className="showcase-browser-bar" aria-hidden="true">
        <span className="showcase-browser-dots"><i /><i /><i /></span>
        <span>{activeProject.displayUrl}</span>
        <span className="showcase-browser-status">Live project</span>
      </div>
      <div className="showcase-stage">
        <div className="showcase-slides" aria-live={sliderPaused ? "polite" : "off"}>
          {(nextSlideReady ? [activeSlide, nextSlide] : [activeSlide]).map((index) => {
            const project = projects[index];
            const isActive = index === activeSlide;

            return (
              <Link
                key={project.slug}
                className={`showcase-slide${isActive ? " is-active" : ""}`}
                href={`/work/${project.slug}`}
                aria-hidden={!isActive}
                tabIndex={isActive ? 0 : -1}
                aria-label={`${project.name} — View Case Study`}
                data-cursor="VIEW"
              >
                <ProjectArtwork
                  project={project}
                  priority={isActive && index === 0}
                  sizes="(max-width: 1080px) 92vw, (max-width: 1440px) 46vw, (max-width: 1800px) 660px, 800px"
                />
              </Link>
            );
          })}
        </div>
      </div>
      <div className="showcase-meta">
        <div className="showcase-caption">
          <span className="showcase-kicker">{String(activeSlide + 1).padStart(2, "0")} — Featured project</span>
          <strong>{activeProject.name}</strong>
          <span className="showcase-category">{formatCategory(activeProject.category)}</span>
          <small className="showcase-url">{activeProject.displayUrl}</small>
        </div>
        <div className="slider-controls">
          <button className="icon-control icon-control-prev" type="button" onClick={showPreviousSlide} aria-label="Previous project">
            <Glyph icon={ArrowLeft} />
          </button>
          <button
            className="pause-control icon-control"
            type="button"
            onClick={() => setSliderPauseOverride(!sliderPreferencePaused)}
            aria-pressed={sliderPreferencePaused}
            aria-label={sliderPreferencePaused
              ? "Play project slideshow"
              : "Pause project slideshow"}
          >
            <Glyph icon={sliderPreferencePaused ? Play : Pause} size={14} />
            {sliderPreferencePaused ? "Play" : "Pause"}
          </button>
          <button className="icon-control icon-control-next" type="button" onClick={showNextSlide} aria-label="Next project">
            <Glyph icon={ArrowRight} />
          </button>
        </div>
      </div>
      <div className="slider-tabs" role="group" aria-label="Choose a featured project">
        {projects.map((project, index) => (
          <button
            type="button"
            key={project.name}
            className={index === activeSlide ? "is-active" : ""}
            aria-pressed={index === activeSlide}
            onClick={() => {
              setSliderPauseOverride(true);
              setActiveSlide(index);
            }}
          >
            <span>{String(index + 1).padStart(2, "0")}</span>
            <span className="sr-only"> — show {project.name}</span>
          </button>
        ))}
      </div>
      <Link className="showcase-case-study" href={`/work/${activeProject.slug}`} data-cursor="VIEW">
        View Case Study <ArrowIcon />
      </Link>
    </div>
  );
}
