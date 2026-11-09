"use client";

import Link from "next/link";
import { useState } from "react";

export type Discipline = {
  id: string;
  number: string;
  title: string;
  summary: string;
  points: readonly string[];
  /** Exact label the enquiry API accepts (from contact-options). */
  serviceLabel: string;
  /** Canonical service page for this discipline. */
  serviceHref: string;
};

/** Ticks the matching service in the shared ContactForm without owning any form logic. */
function chooseService(label: string) {
  const form = document.querySelector<HTMLFormElement>("#contact form");
  if (!form) return;
  const inputs = [...form.querySelectorAll<HTMLInputElement>('input[name="service"]')];
  const target = inputs.find((input) => input.value === label);
  if (!target) return;
  inputs.forEach((input) => { input.checked = input === target; });
  // The form listens for bubbling input events to keep its own state in step.
  target.dispatchEvent(new Event("input", { bubbles: true }));
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  document.getElementById("contact")?.scrollIntoView({ behavior: reduce ? "auto" : "smooth" });
  window.setTimeout(() => form.querySelector<HTMLInputElement>("#full-name")?.focus({ preventScroll: true }), reduce ? 0 : 500);
}

export function PreviewDisciplines({ items }: { items: readonly Discipline[] }) {
  const [openId, setOpenId] = useState<string | null>(null);
  return (
    <div className="odp-cards">
      {items.map((item) => {
        const open = openId === item.id;
        const bodyId = `odp-discipline-${item.id}`;
        return (
          <article key={item.id} className={`odp-card${open ? " is-open" : ""}`}>
            <h3 className="odp-card-heading">
              <button type="button" className="odp-card-toggle" aria-expanded={open} aria-controls={bodyId} onClick={() => setOpenId(open ? null : item.id)}>
                <span className="odp-mono-label odp-card-index">{item.number}</span>
                <span className="odp-card-title">{item.title}</span>
                <span className="odp-card-summary">{item.summary}</span>
                <span className="odp-plus" aria-hidden="true" />
              </button>
            </h3>
            <div className="odp-card-body" id={bodyId} hidden={!open}>
              <ul className="odp-ticks">
                {item.points.map((point) => <li key={point}>{point}</li>)}
              </ul>
              <div className="odp-card-actions">
                <button type="button" className="odp-btn odp-btn--ghost" onClick={() => chooseService(item.serviceLabel)}>Discuss this</button>
                <Link className="odp-text-link" href={item.serviceHref}>About this service</Link>
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}
