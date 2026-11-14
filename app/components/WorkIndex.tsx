"use client";

import { useState, type ReactNode } from "react";

type Item = { slug: string; sector: string; card: ReactNode };

// Rows of 7 + 5 then 5 + 7 columns, so the grid never settles into uniform cards.
const sizes = ["wide", "narrow", "narrow", "wide"] as const;

/** Sector filter over server-rendered project cards. Without JavaScript every project is listed. */
export function WorkIndex({ items, sectors }: { items: readonly Item[]; sectors: readonly string[] }) {
  const [sector, setSector] = useState<string | null>(null);
  const visible = sector ? items.filter((item) => item.sector === sector) : items;

  return (
    <>
      <div className="work-filter" role="group" aria-label="Filter projects by sector">
        <button type="button" aria-pressed={sector === null} onClick={() => setSector(null)}>All {items.length} projects</button>
        {sectors.map((name) => (
          <button key={name} type="button" aria-pressed={sector === name} onClick={() => setSector(name)}>{name}</button>
        ))}
      </div>
      <p className="sr-only" role="status">Showing {visible.length} of {items.length} projects</p>
      {visible.length > 0 ? (
        <ul className="work-grid">
          {visible.map((item, index) => (
            <li key={item.slug} data-size={sizes[index % sizes.length]}>{item.card}</li>
          ))}
        </ul>
      ) : (
        <p className="work-empty">No projects are listed in this sector yet. <button type="button" className="text-link" onClick={() => setSector(null)}>Show all projects</button></p>
      )}
    </>
  );
}
