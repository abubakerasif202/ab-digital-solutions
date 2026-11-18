"use client";

import { useEffect } from "react";

const lightProperties = ["--ruby-x", "--ruby-y", "--ruby-dx", "--ruby-dy"];

function fractionIn(bounds: DOMRect, x: number, y: number) {
  return {
    px: Math.max(0, Math.min(1, (x - bounds.left) / bounds.width)),
    py: Math.max(0, Math.min(1, (y - bounds.top) / bounds.height)),
  };
}

/** Mouse: ruby lighting and magnetic depth that follow the cursor. */
function attachPointerLight(element: HTMLElement) {
  let frame = 0;
  let bounds: DOMRect | null = null;
  let x = 0;
  let y = 0;
  const paint = () => {
    frame = 0;
    if (!bounds) return;
    const { px, py } = fractionIn(bounds, x, y);
    element.style.setProperty("--ruby-x", `${px * 100}%`);
    element.style.setProperty("--ruby-y", `${py * 100}%`);
    if (element.hasAttribute("data-ruby-magnet")) {
      element.style.setProperty("--ruby-dx", `${(px - 0.5) * 10}px`);
      element.style.setProperty("--ruby-dy", `${(py - 0.5) * 8}px`);
    }
  };
  const enter = () => { bounds = element.getBoundingClientRect(); };
  const move = (event: PointerEvent) => {
    x = event.clientX; y = event.clientY;
    if (!frame) frame = window.requestAnimationFrame(paint);
  };
  const leave = () => {
    if (frame) window.cancelAnimationFrame(frame);
    frame = 0;
    bounds = null;
    lightProperties.forEach(property => element.style.removeProperty(property));
  };
  element.addEventListener("pointerenter", enter);
  element.addEventListener("pointermove", move);
  element.addEventListener("pointerleave", leave);
  return () => {
    leave();
    element.removeEventListener("pointerenter", enter);
    element.removeEventListener("pointermove", move);
    element.removeEventListener("pointerleave", leave);
  };
}

/** Touch: the ruby light follows a finger and lingers briefly after it lifts. */
function attachTouchLight(element: HTMLElement) {
  let frame = 0;
  let release = 0;
  let bounds: DOMRect | null = null;
  let x = 0;
  let y = 0;
  const paint = () => {
    frame = 0;
    if (!bounds) return;
    const { px, py } = fractionIn(bounds, x, y);
    element.style.setProperty("--ruby-x", `${px * 100}%`);
    element.style.setProperty("--ruby-y", `${py * 100}%`);
  };
  const track = (event: PointerEvent) => {
    if (event.pointerType === "mouse") return;
    window.clearTimeout(release);
    x = event.clientX; y = event.clientY;
    if (event.type === "pointerdown") bounds = element.getBoundingClientRect();
    if (!frame) frame = window.requestAnimationFrame(paint);
  };
  const lift = () => {
    window.clearTimeout(release);
    release = window.setTimeout(() => {
      bounds = null;
      lightProperties.forEach(property => element.style.removeProperty(property));
    }, 900);
  };
  element.addEventListener("pointerdown", track, { passive: true });
  element.addEventListener("pointermove", track, { passive: true });
  element.addEventListener("pointerup", lift, { passive: true });
  element.addEventListener("pointercancel", lift, { passive: true });
  return () => {
    window.clearTimeout(release);
    if (frame) window.cancelAnimationFrame(frame);
    element.removeEventListener("pointerdown", track);
    element.removeEventListener("pointermove", track);
    element.removeEventListener("pointerup", lift);
    element.removeEventListener("pointercancel", lift);
    lightProperties.forEach(property => element.style.removeProperty(property));
  };
}

/**
 * Browsers without CSS scroll-driven animations (notably iOS Safari before 26) still get the
 * scroll progress rule and image drift: one passive listener writing transforms only.
 */
function attachScrollDepth(root: Element) {
  const progress = root.querySelector<HTMLElement>(".ruby-scroll-progress");
  const plates = Array.from(root.querySelectorAll<HTMLElement>(".ruby-plate-frame img"));
  const visible = new Set<HTMLElement>();
  let frame = 0;
  const paint = () => {
    frame = 0;
    const viewport = window.innerHeight;
    const scrolled = window.scrollY;
    const range = Math.max(1, document.documentElement.scrollHeight - viewport);
    if (progress) progress.style.transform = `scaleX(${Math.min(1, scrolled / range)})`;
    visible.forEach(img => {
      const rect = (img.parentElement ?? img).getBoundingClientRect();
      const t = Math.max(0, Math.min(1, (viewport - rect.top) / (viewport + rect.height)));
      img.style.transform = `translate3d(0, ${(-7 + 7 * t).toFixed(2)}%, 0)`;
    });
  };
  const schedule = () => { if (!frame) frame = window.requestAnimationFrame(paint); };
  // The wrapper is observed (the image is taller than its frame); map it back to the image it moves.
  const wrapperToImage = new Map<Element, HTMLElement>(plates.map(img => [img.parentElement ?? img, img]));
  const mapped = typeof IntersectionObserver === "undefined" ? undefined : new IntersectionObserver(entries => {
    entries.forEach(entry => {
      const img = wrapperToImage.get(entry.target);
      if (!img) return;
      if (entry.isIntersecting) visible.add(img); else visible.delete(img);
    });
    schedule();
  }, { rootMargin: "20% 0px" });
  wrapperToImage.forEach((_, wrapper) => mapped?.observe(wrapper));
  window.addEventListener("scroll", schedule, { passive: true });
  window.addEventListener("resize", schedule, { passive: true });
  schedule();
  return () => {
    if (frame) window.cancelAnimationFrame(frame);
    mapped?.disconnect();
    window.removeEventListener("scroll", schedule);
    window.removeEventListener("resize", schedule);
    progress?.style.removeProperty("transform");
    plates.forEach(img => img.style.removeProperty("transform"));
  };
}

/**
 * Ruby lighting by input capability, never by screen width: cursor-driven on a mouse, finger-driven
 * on touch, and scroll depth wherever the browser lacks native scroll-driven animation.
 */
export function RubyMotion() {
  useEffect(() => {
    const root = document.querySelector(".ruby-page");
    if (!root) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)");
    const nativeScrollTimeline = typeof CSS !== "undefined" && CSS.supports("animation-timeline: view()");
    let cleanups: (() => void)[] = [];
    const clear = () => { cleanups.forEach(cleanup => cleanup()); cleanups = []; };
    const configure = () => {
      clear();
      if (reduced.matches) return;
      const targets = root.querySelectorAll<HTMLElement>("[data-ruby-depth], [data-ruby-magnet]");
      targets.forEach(element => cleanups.push(fine.matches ? attachPointerLight(element) : attachTouchLight(element)));
      if (!nativeScrollTimeline) cleanups.push(attachScrollDepth(root));
    };
    configure();
    reduced.addEventListener("change", configure);
    fine.addEventListener("change", configure);
    return () => {
      clear();
      reduced.removeEventListener("change", configure);
      fine.removeEventListener("change", configure);
    };
  }, []);
  return null;
}
