"use client";

import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from "react";
import { ArrowIcon } from "../icons";

export interface FeaturedWorkItem {
  slug: string;
  title: string;
}

interface FeaturedWorkNavigatorProps {
  items: readonly FeaturedWorkItem[];
}

const SETTLE_MS = 700;

/**
 * Progressive enhancement for the server-rendered selected-work scroller.
 * Renders hidden until it has measured an overflowing scroller, so there are
 * no dead controls before hydration, without JS, or on desktop where the
 * cards sit in a grid. It reads and annotates existing DOM only; it never
 * fetches or re-renders the cards.
 */
export function FeaturedWorkNavigator({ items }: FeaturedWorkNavigatorProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const scrollerRef = useRef<HTMLElement | null>(null);
  const settleRef = useRef<number | undefined>(undefined);
  const [usable, setUsable] = useState(false);
  const [index, setIndex] = useState(0);
  const [touched, setTouched] = useState(false);

  const getCards = useCallback(
    () => Array.from(scrollerRef.current?.querySelectorAll<HTMLElement>(".home-work-card") ?? []),
    [],
  );

  const readIndex = useCallback(() => {
    const scroller = scrollerRef.current;
    const cards = getCards();
    if (!scroller || cards.length === 0) return 0;
    if (scroller.scrollLeft + scroller.clientWidth >= scroller.scrollWidth - 2) return cards.length - 1;
    const left = scroller.getBoundingClientRect().left;
    let best = 0;
    let bestDistance = Infinity;
    cards.forEach((card, cardIndex) => {
      const distance = Math.abs(card.getBoundingClientRect().left - left);
      if (distance < bestDistance) {
        best = cardIndex;
        bestDistance = distance;
      }
    });
    return best;
  }, [getCards]);

  useEffect(() => {
    const scroller = rootRef.current?.closest(".home-work")?.querySelector<HTMLElement>(".home-work-scroll") ?? null;
    scrollerRef.current = scroller;
    if (!scroller) return;

    let frame = 0;
    const measure = () => {
      frame = 0;
      setUsable(scroller.scrollWidth > scroller.clientWidth + 1);
      if (settleRef.current === undefined) setIndex(readIndex());
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(measure);
    };
    const onScroll = () => {
      setTouched(true);
      schedule();
    };

    const resize = new ResizeObserver(schedule);
    resize.observe(scroller);
    const grid = scroller.firstElementChild;
    if (grid) resize.observe(grid);
    scroller.addEventListener("scroll", onScroll, { passive: true });
    schedule();

    return () => {
      resize.disconnect();
      scroller.removeEventListener("scroll", onScroll);
      if (frame) cancelAnimationFrame(frame);
      window.clearTimeout(settleRef.current);
      settleRef.current = undefined;
    };
  }, [readIndex]);

  // Mirror state onto the server-rendered nodes so CSS can art-direct them.
  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    if (usable) scroller.setAttribute("data-gallery", "ready");
    else scroller.removeAttribute("data-gallery");
    if (touched) scroller.setAttribute("data-touched", "");
    getCards().forEach((card, cardIndex) => {
      if (usable && cardIndex === index) card.setAttribute("data-current", "");
      else card.removeAttribute("data-current");
    });
    return () => {
      scroller.removeAttribute("data-gallery");
      scroller.removeAttribute("data-touched");
      getCards().forEach((card) => card.removeAttribute("data-current"));
    };
  }, [usable, index, touched, getCards]);

  const goTo = useCallback(
    (next: number) => {
      const scroller = scrollerRef.current;
      const cards = getCards();
      const target = Math.min(Math.max(next, 0), cards.length - 1);
      const card = cards[target];
      if (!scroller || !card) return;
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const left = scroller.scrollLeft + card.getBoundingClientRect().left - scroller.getBoundingClientRect().left;
      setTouched(true);
      setIndex(target);
      window.clearTimeout(settleRef.current);
      settleRef.current = window.setTimeout(() => {
        settleRef.current = undefined;
        setIndex(readIndex());
      }, reduce ? 0 : SETTLE_MS);
      scroller.scrollTo({ left, behavior: reduce ? "auto" : "smooth" });
    },
    [getCards, readIndex],
  );

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const step = event.key === "ArrowRight" ? 1 : event.key === "ArrowLeft" ? -1 : 0;
    if (step === 0) return;
    event.preventDefault();
    goTo(index + step);
    const buttons = event.currentTarget.querySelectorAll<HTMLButtonElement>("[data-work-dot]");
    buttons[Math.min(Math.max(index + step, 0), buttons.length - 1)]?.focus();
  };

  const total = items.length;
  const current = items[index];

  return (
    <div
      ref={rootRef}
      className="home-work-nav"
      role="group"
      aria-label="Selected work navigation"
      hidden={!usable}
      data-touched={touched ? "" : undefined}
      onKeyDown={onKeyDown}
    >
      <p className="home-work-nav-status" aria-live="polite">
        <span className="home-work-nav-count">Project {index + 1} of {total}</span>
        {current && <span className="home-work-nav-title">{current.title}</span>}
      </p>
      <div className="home-work-nav-row">
        <button
          type="button"
          className="home-work-nav-step home-work-nav-step--prev"
          aria-label="Previous project"
          aria-disabled={index === 0}
          onClick={() => goTo(index - 1)}
        >
          <ArrowIcon />
        </button>
        <div className="home-work-rail">
          {items.map((item, itemIndex) => (
            <button
              key={item.slug}
              type="button"
              data-work-dot=""
              className="home-work-rail-stop"
              aria-label={`Show project ${itemIndex + 1} of ${total}: ${item.title}`}
              aria-current={itemIndex === index ? "true" : undefined}
              onClick={() => goTo(itemIndex)}
            />
          ))}
        </div>
        <button
          type="button"
          className="home-work-nav-step"
          aria-label="Next project"
          aria-disabled={index === total - 1}
          onClick={() => goTo(index + 1)}
        >
          <ArrowIcon />
        </button>
      </div>
    </div>
  );
}
