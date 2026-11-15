"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { fillFrame } from "../project-artwork";

export interface LiveTickerItem {
  slug: string;
  name: string;
  sector: string;
  image: string;
}

const ROTATE_MS = 3800;

/**
 * Cycles through real client projects. Stays on the first project under reduced
 * motion and holds while focused or hovered.
 */
export function LiveTicker({ items }: { items: readonly LiveTickerItem[] }) {
  const [index, setIndex] = useState(0);
  const [held, setHeld] = useState(false);

  useEffect(() => {
    if (held || items.length < 2) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = window.setInterval(() => setIndex((current) => (current + 1) % items.length), ROTATE_MS);
    return () => window.clearInterval(timer);
  }, [items.length, held]);

  const item = items[index];
  if (!item) return null;

  return (
    <div className="live-ticker-wrap">
      <Link
        className="live-ticker"
        href={`/work/${item.slug}`}
        prefetch={false}
        data-cursor="VIEW"
        onPointerEnter={() => setHeld(true)}
        onPointerLeave={() => setHeld(false)}
        onFocus={() => setHeld(true)}
        onBlur={() => setHeld(false)}
      >
        <span className="live-ticker-thumb" aria-hidden="true">
          <Image key={item.slug} src={item.image} alt="" width={192} height={132} style={fillFrame} sizes="96px" />
        </span>
        <span className="live-ticker-copy">
          <small><i aria-hidden="true" />Featured · {String(index + 1).padStart(2, "0")}/{String(items.length).padStart(2, "0")}</small>
          <strong>{item.name}</strong>
          <span>{item.sector}</span>
        </span>
      </Link>
    </div>
  );
}
