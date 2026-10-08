"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowIcon } from "../icons";
import { ProjectArtwork } from "../project-artwork";
import type { Project } from "../project-data";

export type ServiceIndexItem = {
  slug: string;
  title: string;
  summary: string;
  intro: string;
  benefits: readonly string[];
  project: Project;
};

/* Oversized numbered service index with a sticky preview panel. Hover or
   keyboard focus on a row swaps the panel to that service's real featured
   project; every row is still a plain link, so nothing depends on the JS. */
export function ServiceIndex({ items }: { items: readonly ServiceIndexItem[] }) {
  const [active, setActive] = useState(0);
  const current = items[active];

  return (
    <div className="gr-svc-index">
      <ol className="gr-svc-list">
        {items.map((item, index) => (
          <li key={item.slug}>
            <Link
              className={`services-index-row gr-svc-row${index === active ? " is-active" : ""}`}
              href={`/services/${item.slug}`}
              onPointerEnter={() => setActive(index)}
              onFocus={() => setActive(index)}
            >
              <span className="gr-svc-num" aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
              <span className="gr-svc-title">{item.title}</span>
              <span className="gr-svc-summary">{item.summary}</span>
              <span className="gr-svc-arrow" aria-hidden="true"><ArrowIcon /></span>
            </Link>
          </li>
        ))}
      </ol>

      <div className="gr-svc-panel">
        <div className="gr-svc-panel-media gr-cut-lg" aria-hidden="true">
          {items.map((item, index) => (
            <div className={`gr-svc-panel-image${index === active ? " is-active" : ""}`} key={item.slug}>
              <ProjectArtwork project={item.project} sizes="(max-width: 960px) 0px, 40vw" />
            </div>
          ))}
        </div>
        <div className="gr-svc-panel-copy" key={current.slug}>
          <p className="gr-kicker"><span className="gr-kicker-num">{String(active + 1).padStart(2, "0")}</span> / As seen in {current.project.name}</p>
          <p className="gr-svc-panel-intro">{current.intro}</p>
          <ul>
            {current.benefits.map((benefit) => <li key={benefit}>{benefit}</li>)}
          </ul>
          <Link className="text-link" href={`/services/${current.slug}`}>
            Explore {current.title} <ArrowIcon />
          </Link>
        </div>
      </div>
    </div>
  );
}
