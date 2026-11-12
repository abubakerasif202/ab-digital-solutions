"use client";

import Link from "next/link";
import { useState, type CSSProperties } from "react";
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

/* Numbered service index with a sticky inspector panel. Hover or keyboard
   focus on a row swaps the panel to that service's real featured project;
   every row is still a plain link, so nothing depends on the JS. */
export function ServiceIndex({ items }: { items: readonly ServiceIndexItem[] }) {
  const [active, setActive] = useState(0);
  const current = items[active];

  return (
    <div className="ip-svc">
      <ol className="ip-svc-list">
        {items.map((item, index) => (
          <li key={item.slug} data-active={index === active} style={{ "--i": index } as CSSProperties}>
            <Link
              className="ip-svc-row"
              href={`/services/${item.slug}`}
              onPointerEnter={() => setActive(index)}
              onFocus={() => setActive(index)}
            >
              <span className="ip-svc-num" aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
              <span className="ip-svc-title">{item.title}</span>
              <span className="ip-svc-summary">{item.summary}</span>
              <span className="ip-svc-arrow" aria-hidden="true"><ArrowIcon /></span>
            </Link>
          </li>
        ))}
      </ol>

      <div className="ip-svc-panel">
        <div className="ip-svc-frame">
          <div className="ip-svc-inner">
            <p className="ip-svc-bar">
              <span>{String(active + 1).padStart(2, "0")} / {String(items.length).padStart(2, "0")}</span>
              <span>As seen in {current.project.name}</span>
            </p>
            <div className="ip-svc-shot" aria-hidden="true">
              {items.map((item, index) => (
                <div className="ip-svc-shot-img" data-on={index === active} key={item.slug}>
                  <ProjectArtwork project={item.project} sizes="(max-width: 900px) 0px, 40vw" />
                </div>
              ))}
            </div>
            <div className="ip-svc-copy" key={current.slug}>
              <p className="ip-svc-intro">{current.intro}</p>
              <ul>
                {current.benefits.map((benefit) => <li key={benefit}>{benefit}</li>)}
              </ul>
              <Link className="ip-link" href={`/services/${current.slug}`}>
                Explore {current.title} <ArrowIcon />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
