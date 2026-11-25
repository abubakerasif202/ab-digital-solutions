"use client";

import { useId, useState, type ReactNode } from "react";

export function HomeServiceGroup({ title, description, initiallyOpen, children }: {
  title: string;
  description: string;
  initiallyOpen: boolean;
  children: ReactNode;
}) {
  const panelId = useId();
  const [open, setOpen] = useState(initiallyOpen);

  return (
    <>
      <div className="ruby-discipline">
        <h3 className="ruby-discipline-title">{title}</h3>
        <p className="ruby-discipline-copy">{description}</p>
        <button className="ruby-discipline-arrow" type="button" aria-label={title} aria-expanded={open}
          aria-controls={panelId} onClick={() => setOpen(!open)} />
      </div>
      <ul id={panelId} className="ruby-service-options" data-expanded={open}>{children}</ul>
    </>
  );
}