"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { ArrowIcon } from "../icons";
import { ProjectArtwork } from "../project-artwork";
import { projects } from "../project-data";

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
    const updatePageVisibility = () => setIsPageVisible(document.visibilityState === "visible");
    updatePageVisibility();
    document.addEventListener("visibilitychange", updatePageVisibility);
    return () => document.removeEventListener("visibilitychange", updatePageVisibility);
  }, []);

  useEffect(() => {
    if (sliderPaused) return;
    const timer = window.setInterval(
      () => setActiveSlide((current) => (current + 1) % projects.length),
      6500,
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
        <span>Selected work / 2026</span>
        <span>{String(activeSlide + 1).padStart(2, "0")} — {String(projects.length).padStart(2, "0")}</span>
      </div>
      <div className="browser-frame">
        <div className="browser-bar" aria-hidden="true">
          <i /><i /><i />
          <span>{activeProject.displayUrl}</span>
        </div>
        <div className="showcase-slides" aria-live={sliderPaused ? "polite" : "off"}>
          {[activeSlide, nextSlide].map((index) => {
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
        <div>
          <span>{activeProject.category}</span>
          <strong>{activeProject.name}</strong>
        </div>
        <div className="slider-controls">
          <button type="button" onClick={showPreviousSlide} aria-label="Previous project">
            <span aria-hidden="true">←</span>
          </button>
          <button
            className="pause-control"
            type="button"
            onClick={() => setSliderPauseOverride(!sliderPreferencePaused)}
            aria-label={sliderPaused
              ? carouselEngaged
                ? "Resume project slideshow after leaving the carousel"
                : "Play project slideshow"
              : "Pause project slideshow"}
          >
            {sliderPaused ? "Play" : "Pause"}
          </button>
          <button type="button" onClick={showNextSlide} aria-label="Next project">
            <span aria-hidden="true">→</span>
          </button>
        </div>
      </div>
      <div className="slider-tabs" role="group" aria-label="Choose a featured project">
        {projects.map((project, index) => (
          <button
            type="button"
            key={project.name}
            className={index === activeSlide ? "is-active" : ""}
            aria-current={index === activeSlide ? "true" : undefined}
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
      <Link className="showcase-case-study" href={`/work/${activeProject.slug}`}>
        View Case Study <ArrowIcon />
      </Link>
    </div>
  );
}
