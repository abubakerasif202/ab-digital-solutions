"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Pause, Play } from "lucide-react";
import { Glyph } from "../icons";

export interface LiveTickerItem {
  slug: string;
  name: string;
  sector: string;
  image: string;
}

const ROTATE_MS = 3800;

/**
 * Cycles through real client projects. Stays on the first project under reduced
 * motion, holds while focused or hovered, and stops for good once the visitor
 * presses the pause control (WCAG 2.2.2: touch has no hover to hold it with).
 */
export function LiveTicker({ items }: { items: readonly LiveTickerItem[] }) {
  const [index, setIndex] = useState(0);
  const [held, setHeld] = useState(false);
  const [stopped, setStopped] = useState(false);

  useEffect(() => {
    if (held || stopped || items.length < 2) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = window.setInterval(() => setIndex((current) => (current + 1) % items.length), ROTATE_MS);
    return () => window.clearInterval(timer);
  }, [items.length, held, stopped]);

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
          <Image key={item.slug} src={item.image} alt="" fill sizes="96px" />
        </span>
        <span className="live-ticker-copy">
          <small><i aria-hidden="true" />Featured · {String(index + 1).padStart(2, "0")}/{String(items.length).padStart(2, "0")}</small>
          <strong>{item.name}</strong>
          <span>{item.sector}</span>
        </span>
      </Link>
      {items.length > 1 ? (
        <button
          className="live-ticker-toggle"
          type="button"
          onClick={() => setStopped((current) => !current)}
          aria-label={stopped ? "Play featured projects" : "Pause featured projects"}
        >
          <Glyph icon={stopped ? Play : Pause} size={14} />
        </button>
      ) : null}
    </div>
  );
}
