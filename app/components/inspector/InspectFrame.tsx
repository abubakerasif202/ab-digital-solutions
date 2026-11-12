"use client";

import Image from "next/image";
import { useEffect, useRef, useState, type CSSProperties, type KeyboardEvent, type PointerEvent } from "react";

interface InspectFrameProps {
  src: string;
  alt: string;
  /** CSS aspect-ratio of the capture, e.g. "1348 / 926". */
  ratio: string;
  sizes: string;
  /** Preload the finished render (above-the-fold frames only). */
  priority?: boolean;
  /** Mono caption shown in the corner. */
  caption?: string;
  /** Adds a keyboard stop so the finished render can be revealed without a pointer. */
  focusable?: boolean;
  /** Stable name used for the view transition between index card and case study. */
  transitionName?: string;
  className?: string;
}

/** Where the lens rests (fraction of the frame) before a pointer moves it. */
const REST_X = 0.64;
const REST_Y = 0.4;
/** Fraction of the remaining distance covered each frame: a soft spring feel. */
const EASE = 0.16;

/**
 * Signature interaction for portfolio imagery. The page shows the capture's
 * structure (grayscale, steel-tinted, tile grid) and a circular lens, which
 * follows the pointer, reveals the finished render. The lens position is
 * written straight to CSS variables from a requestAnimationFrame loop, so
 * moving the pointer never re-renders React. Coarse pointers and reduced
 * motion keep the lens at rest; a tap, Enter or Space reveals the full render.
 */
export function InspectFrame({
  src,
  alt,
  ratio,
  sizes,
  priority = false,
  caption = "inspect",
  focusable = false,
  transitionName,
  className,
}: InspectFrameProps) {
  const frameRef = useRef<HTMLDivElement>(null);
  const [full, setFull] = useState(false);

  useEffect(() => {
    const frame = frameRef.current;
    if (!frame) return;

    const fine = window.matchMedia("(pointer: fine) and (prefers-reduced-motion: no-preference)");
    let frameId = 0;
    let measurePointer = false;
    let pointerX = 0;
    let pointerY = 0;
    let curX = 0;
    let curY = 0;
    let goalX = 0;
    let goalY = 0;
    let hovering = false;
    let ready = false;

    const rest = () => {
      const bounds = frame.getBoundingClientRect();
      goalX = bounds.width * REST_X;
      goalY = bounds.height * REST_Y;
    };
    const paint = () => {
      frame.style.setProperty("--lx", `${curX.toFixed(1)}px`);
      frame.style.setProperty("--ly", `${curY.toFixed(1)}px`);
    };
    const step = () => {
      frameId = 0;
      if (hovering && measurePointer) {
        const bounds = frame.getBoundingClientRect();
        goalX = pointerX - bounds.left;
        goalY = pointerY - bounds.top;
        measurePointer = false;
        if (!ready) {
          curX = goalX;
          curY = goalY;
          ready = true;
        }
      }
      curX += (goalX - curX) * EASE;
      curY += (goalY - curY) * EASE;
      paint();
      if (Math.abs(goalX - curX) > 0.4 || Math.abs(goalY - curY) > 0.4) {
        frameId = window.requestAnimationFrame(step);
      }
    };
    const kick = () => {
      if (!frameId) frameId = window.requestAnimationFrame(step);
    };
    const onMove = (event: globalThis.PointerEvent) => {
      pointerX = event.clientX;
      pointerY = event.clientY;
      measurePointer = true;
      kick();
    };
    const onEnter = (event: globalThis.PointerEvent) => {
      hovering = true;
      frame.dataset.live = "true";
      onMove(event);
    };
    const onLeave = () => {
      hovering = false;
      frame.dataset.live = "false";
      rest();
      kick();
    };
    const onResize = () => {
      if (hovering) {
        measurePointer = true;
        kick();
      } else {
        rest();
        if (fine.matches) kick();
        else {
          curX = goalX;
          curY = goalY;
          paint();
        }
      }
    };
    const onScroll = () => {
      if (hovering) {
        measurePointer = true;
        kick();
      }
    };

    // Rest position is set once, so the first paint of the lens is correct.
    const bounds = frame.getBoundingClientRect();
    curX = bounds.width * REST_X;
    curY = bounds.height * REST_Y;
    goalX = curX;
    goalY = curY;
    paint();

    const attach = () => {
      frame.addEventListener("pointerenter", onEnter);
      frame.addEventListener("pointermove", onMove, { passive: true });
      frame.addEventListener("pointerleave", onLeave);
      window.addEventListener("scroll", onScroll, { passive: true, capture: true });
    };
    const detach = () => {
      frame.removeEventListener("pointerenter", onEnter);
      frame.removeEventListener("pointermove", onMove);
      frame.removeEventListener("pointerleave", onLeave);
      window.removeEventListener("scroll", onScroll, true);
      hovering = false;
      if (frameId) window.cancelAnimationFrame(frameId);
      frameId = 0;
    };
    const sync = () => {
      detach();
      if (fine.matches) attach();
      else {
        rest();
        curX = goalX;
        curY = goalY;
        paint();
      }
    };

    window.addEventListener("resize", onResize, { passive: true });
    sync();
    fine.addEventListener("change", sync);
    return () => {
      fine.removeEventListener("change", sync);
      window.removeEventListener("resize", onResize);
      detach();
    };
  }, []);

  const toggleFull = () => {
    setFull((current) => !current);
  };
  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    // Mouse users already have the lens; touch and pen toggle the full render.
    if (!focusable && event.pointerType !== "mouse") toggleFull();
  };
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      toggleFull();
    }
  };

  const style: CSSProperties & { viewTransitionName?: string } = { aspectRatio: ratio };
  if (transitionName) style.viewTransitionName = transitionName;

  return (
    <div
      ref={frameRef}
      className={`ifr${className ? ` ${className}` : ""}`}
      style={style}
      data-full={full}
      data-live="false"
      onPointerDown={onPointerDown}
      {...(focusable
        ? { tabIndex: 0, role: "button", "aria-pressed": full, "aria-label": `${alt}. Toggle the finished render.`, onClick: toggleFull, onKeyDown }
        : {})}
    >
      <div className="ifr-structure" aria-hidden="true">
        <Image src={src} alt="" fill sizes={sizes} loading={priority ? "eager" : "lazy"} />
        <span className="ifr-grid" />
        <span className="ifr-tint" />
      </div>
      <div className="ifr-lens">
        <Image src={src} alt={alt} fill sizes={sizes} preload={priority} loading={priority ? undefined : "lazy"} />
      </div>
      <span className="ifr-ring" aria-hidden="true" />
      <span className="ifr-cap" aria-hidden="true">{caption}</span>
    </div>
  );
}
