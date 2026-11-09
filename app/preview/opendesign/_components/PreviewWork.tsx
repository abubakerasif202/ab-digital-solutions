"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

const INITIAL_VISIBLE = 6;

type Sector = { name: string; count: number };

/**
 * Sector filter and "show all" control around a list the server has already rendered.
 * Every card is in the HTML (so the page works without JavaScript); this island only
 * toggles visibility. The collapsed state is plain CSS, so there is no layout shift.
 */
export function PreviewWork({ sectors, total, children }: { sectors: readonly Sector[]; total: number; children: ReactNode }) {
  const listRef = useRef<HTMLDivElement>(null);
  const [filter, setFilter] = useState("all");
  const [expanded, setExpanded] = useState(false);
  const collapsed = filter === "all" && !expanded;

  useEffect(() => {
    listRef.current?.querySelectorAll<HTMLElement>("[data-sector]").forEach((item) => {
      item.hidden = filter !== "all" && item.dataset.sector !== filter;
    });
  }, [filter]);

  const matchCount = filter === "all" ? total : (sectors.find((sector) => sector.name === filter)?.count ?? 0);
  const shownCount = collapsed ? Math.min(INITIAL_VISIBLE, matchCount) : matchCount;
  const status = filter === "all"
    ? `Showing ${shownCount} of ${matchCount} projects.`
    : `Showing ${shownCount} ${shownCount === 1 ? "project" : "projects"} in ${filter}.`;

  return (
    <div className="odp-work" data-collapsed={collapsed ? "true" : "false"}>
      <noscript>
        <style>{`.odp-work [data-extra] { display: block !important; }`}</style>
      </noscript>
      <div className="odp-filters" role="group" aria-label="Filter projects by sector">
        {[{ name: "all", label: "All", count: total }, ...sectors.map((sector) => ({ name: sector.name, label: sector.name, count: sector.count }))].map((chip) => (
          <button key={chip.name} type="button" className={`odp-chip${filter === chip.name ? " is-on" : ""}`} aria-pressed={filter === chip.name} onClick={() => setFilter(chip.name)}>
            {chip.label}<span className="odp-chip-count">{chip.count}</span>
          </button>
        ))}
      </div>
      <p className="odp-sr" role="status" aria-live="polite">{status}</p>
      <div ref={listRef}>{children}</div>
      {filter === "all" && total > INITIAL_VISIBLE ? (
        <p className="odp-show-all">
          <button type="button" className="odp-btn odp-btn--ghost" aria-expanded={expanded} onClick={() => setExpanded((value) => !value)}>
            {expanded ? "Show fewer projects" : `Show all ${total} projects`}
          </button>
        </p>
      ) : null}
    </div>
  );
}
