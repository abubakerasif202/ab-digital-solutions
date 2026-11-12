"use client";

import Link from "next/link";
import { useEffect, useRef, useSyncExternalStore } from "react";
import { ArrowIcon } from "../../icons";
import { wallStore } from "./wall/wall-store";

export type WorkRow = {
  slug: string;
  name: string;
  sector: string;
  destinationLabel: string;
  stack: readonly string[];
  href: string;
};

/**
 * The portfolio as an index. Hovering, focusing or simply scrolling a row
 * develops that project on the shared WebGL wall behind the list, so the
 * list stays ordinary, crawlable links and the 3D stays in service of it.
 */
export function WorkIndex({ rows, total }: { rows: readonly WorkRow[]; total: number }) {
  const listRef = useRef<HTMLOListElement>(null);
  const active = useSyncExternalStore(wallStore.subscribe, wallStore.getFocus, () => 0);

  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    const items = Array.from(list.querySelectorAll<HTMLElement>("[data-row]"));
    // A thin band across the middle of the viewport decides which row is "in view".
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) wallStore.setFocus(Number((entry.target as HTMLElement).dataset.row), "auto");
        }
      },
      { rootMargin: "-42% 0px -42% 0px", threshold: 0 },
    );
    items.forEach((item) => observer.observe(item));
    return () => observer.disconnect();
  }, []);

  return (
    <ol className="wx-list" ref={listRef}>
      {rows.map((row, i) => (
        <li key={row.slug} data-row={i} data-active={i === active ? "true" : "false"}>
          <Link
            href={row.href}
            prefetch={false}
            onPointerEnter={() => wallStore.setFocus(i, "work")}
            onFocus={() => wallStore.setFocus(i, "work")}
          >
            <span className="wx-n">{String(i + 1).padStart(2, "0")}</span>
            <span className="wx-name">{row.name}</span>
            <span className="wx-meta">
              <span>{row.sector}</span>
              <span>{row.stack.slice(0, 3).join(" / ")}</span>
              <span className="wx-kind">{row.destinationLabel}</span>
            </span>
            <span className="wx-go" aria-hidden="true"><ArrowIcon /></span>
          </Link>
        </li>
      ))}
      <li className="wx-all">
        <Link href="/work" prefetch={false}>
          <span className="wx-n" aria-hidden="true">+</span>
          <span className="wx-name">All {total} projects</span>
          <span className="wx-go" aria-hidden="true"><ArrowIcon /></span>
        </Link>
      </li>
    </ol>
  );
}
