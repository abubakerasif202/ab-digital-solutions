"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

export interface LiveTickerItem {
  slug: string;
  name: string;
  sector: string;
  image: string;
}

const ROTATE_MS = 3800;

/** Cycles through real client projects. Stays on the first project under reduced motion, and while focused or hovered. */
export function LiveTicker({ items }: { items: readonly LiveTickerItem[] }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused || items.length < 2) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = window.setInterval(() => setIndex((current) => (current + 1) % items.length), ROTATE_MS);
    return () => window.clearInterval(timer);
  }, [items.length, paused]);

  const item = items[index];
  if (!item) return null;

  return (
    <Link
      className="live-ticker"
      href={`/work/${item.slug}`}
      prefetch={false}
      data-cursor="VIEW"
      onPointerEnter={() => setPaused(true)}
      onPointerLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <span className="live-ticker-thumb" aria-hidden="true">
        <Image key={item.slug} src={item.image} alt="" fill sizes="96px" />
      </span>
      <span className="live-ticker-copy">
        <small><i aria-hidden="true" />Featured · {String(index + 1).padStart(2, "0")}/{String(items.length).padStart(2, "0")}</small>
        <strong>{item.name}</strong>
        <span>{item.sector}</span>
      </span>
    </Link>
  );
}
