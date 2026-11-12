"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, type CSSProperties } from "react";
import { ArrowIcon } from "../../../icons";

export interface ServiceRow {
  number: string;
  slug: string;
  title: string;
  description: string;
  details: readonly string[];
  project: { name: string; sector: string; image: string };
}

/**
 * The service index. Rows are plain links (crawlable, keyboard reachable); a
 * sticky readout beside them shows the selected service's description, its
 * three detail tags and its featured live project. Every readout is rendered
 * in the same grid cell, so selection changes visibility only: no layout
 * shift. Without JavaScript the first service stays selected.
 */
export function ServiceInspector({ rows }: { rows: readonly ServiceRow[] }) {
  const [active, setActive] = useState(0);
  // Images load for the first readout and for any row the visitor has reached.
  const [reached, setReached] = useState<ReadonlySet<number>>(() => new Set([0]));

  const select = (index: number) => {
    setActive(index);
    setReached((current) => (current.has(index) ? current : new Set(current).add(index)));
  };

  return (
    <div className="sx-svc-grid">
      <ol className="sx-svc-list">
        {rows.map((row, index) => (
          <li key={row.slug} data-active={index === active ? "true" : "false"} style={{ "--i": index } as CSSProperties}>
            <Link
              href={`/services/${row.slug}`}
              prefetch={false}
              onPointerEnter={(event) => { if (event.pointerType === "mouse") select(index); }}
              onFocus={() => select(index)}
              onClick={() => select(index)}
            >
              <span className="sx-svc-n">{row.number}</span>
              <h3 className="sx-svc-t">{row.title}</h3>
              <span className="sx-svc-go" aria-hidden="true"><ArrowIcon /></span>
              <span className="sx-svc-d">{row.description}</span>
              <span className="sx-svc-tags">
                {row.details.map((detail) => <span key={detail}>{detail}</span>)}
              </span>
            </Link>
          </li>
        ))}
      </ol>

      <aside className="sx-readout" aria-hidden="true">
        <div className="sx-readout-frame">
          <div className="sx-readout-inner">
            {rows.map((row, index) => (
              <div className="sx-rp" key={row.slug} data-active={index === active ? "true" : "false"}>
                <div className="sx-rp-bar">
                  <span>Inspect <i /> Service {row.number} / {String(rows.length).padStart(2, "0")}</span>
                  <span className="sx-rp-path">/services/{row.slug}</span>
                </div>
                <div className="sx-rp-shot">
                  {reached.has(index) && (
                    <Image src={row.project.image} alt="" width={1348} height={926} sizes="(max-width: 899px) 0px, 40vw" />
                  )}
                </div>
                <p className="sx-rp-feat"><b>Live project</b>{row.project.name} <i /> {row.project.sector}</p>
                <p className="sx-rp-desc">{row.description}</p>
                <ul className="sx-rp-tags">
                  {row.details.map((detail) => <li key={detail}>{detail}</li>)}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </aside>
    </div>
  );
}
