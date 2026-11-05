"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, type KeyboardEvent } from "react";
import { siteConfig } from "../site-config";
import { StudioArrow } from "./StudioArrow";
import { contactHref, studioProcess, type StudioProject, type StudioService } from "./studio-data";
import styles from "./studio.module.css";

const whatsappHref = `https://wa.me/${siteConfig.phoneInternational.replace("+", "")}`;

function ProcessList() {
  return <ol className={styles.process} aria-label="How a project runs">
    {studioProcess.map(([title, text], index) => <li key={title}><span>{String(index + 1).padStart(2, "0")}</span><strong>{title}</strong><em>{text}</em></li>)}
  </ol>;
}

export function ReceptionPanel() {
  return <>
    <p>{siteConfig.description}</p>
    <p>Led by founder and lead developer Abubakar Asif. Pick a room below, or take the guided tour for a quick walk through.</p>
    <div className={styles.actions}>
      <Link prefetch={false} className={styles.primary} href="/about">Meet the studio <StudioArrow /></Link>
      <Link prefetch={false} className={styles.textLink} href="/#process">How we work</Link>
    </div>
  </>;
}

export function GalleryPanel({ projects, index, onIndex }: { projects: StudioProject[]; index: number; onIndex: (index: number) => void }) {
  const project = projects[index];
  const strip = useRef<HTMLUListElement>(null);
  const thumbs = useRef<(HTMLButtonElement | null)[]>([]);
  const step = (delta: number) => onIndex((index + delta + projects.length) % projects.length);

  // Keep the selected thumbnail centred inside its own strip without moving the page.
  useEffect(() => {
    const list = strip.current;
    const thumb = thumbs.current[index];
    if (list && thumb) list.scrollTo({ left: thumb.offsetLeft - (list.clientWidth - thumb.clientWidth) / 2 });
  }, [index]);

  const onThumbKey = (event: KeyboardEvent) => {
    const next = event.key === "ArrowRight" ? index + 1 : event.key === "ArrowLeft" ? index - 1 : event.key === "Home" ? 0 : event.key === "End" ? projects.length - 1 : null;
    if (next === null) return;
    event.preventDefault();
    const target = (next + projects.length) % projects.length;
    onIndex(target);
    thumbs.current[target]?.focus({ preventScroll: true });
  };

  return <>
    <p className={styles.counter} role="status" aria-live="polite">Project {index + 1} of {projects.length}: {project.name}</p>
    <div className={styles.stepper}>
      <button type="button" onClick={() => step(-1)} aria-label="Previous project">← Previous</button>
      <button type="button" onClick={() => step(1)} aria-label="Next project">Next →</button>
    </div>
    <ul className={styles.thumbs} ref={strip} aria-label="Projects" onKeyDown={onThumbKey}>
      {projects.map((entry, position) => <li key={entry.slug}>
        <button ref={(node) => { thumbs.current[position] = node; }} type="button" aria-label={entry.name} aria-pressed={position === index} tabIndex={position === index ? 0 : -1} onClick={() => onIndex(position)}>
          <Image src={entry.image} alt="" width={72} height={50} sizes="72px" />
        </button>
      </li>)}
    </ul>
    <div className={styles.previewFrame}>
      <Image key={project.slug} src={project.image} alt={project.alt} width={560} height={384} sizes="(max-width: 600px) 90vw, 360px" loading="eager" className={styles.projectImage} />
    </div>
    <p className={styles.kicker}>{project.sector} · {project.destinationLabel}</p>
    <h3>{project.name}</h3>
    <p>{project.description}</p>
    <Link prefetch={false} className={styles.primary} href={`/work/${project.slug}`}>View case study <StudioArrow /></Link>
    <label className={styles.fieldLabel} htmlFor="studio-project">Jump to a project</label>
    <select id="studio-project" value={index} onChange={(event) => onIndex(Number(event.target.value))}>{projects.map((entry, position) => <option value={position} key={entry.slug}>{entry.name}</option>)}</select>
  </>;
}

export function ServicesPanel({ services, index, onIndex }: { services: StudioService[]; index: number; onIndex: (index: number) => void }) {
  const service = services[index];
  return <>
    <ul className={styles.chips} aria-label="Services">
      {services.map((entry, position) => <li key={entry.title}><button type="button" aria-pressed={position === index} onClick={() => onIndex(position)}>{entry.title}</button></li>)}
    </ul>
    <h3>{service.title}</h3>
    <p>{service.description}</p>
    <ul>{service.benefits.map((benefit) => <li key={benefit}>{benefit}</li>)}</ul>
    <div className={styles.actions}>
      <Link prefetch={false} className={styles.primary} href={service.href}>{service.cta} <StudioArrow /></Link>
      <Link prefetch={false} className={styles.textLink} href={contactHref(service.contactService)}>Enquire about this</Link>
    </div>
  </>;
}

export function ConsultationPanel() {
  return <>
    <p>Tell us about your business, what you already have and what you want to change. Start a project to request a quote, and we reply with a practical next step.</p>
    <div className={styles.actions}>
      <Link prefetch={false} className={styles.primary} href="/contact">Start a project <StudioArrow /></Link>
    </div>
    <div className={styles.contactRow}>
      <a href={`tel:${siteConfig.phoneInternational}`}>Call {siteConfig.phoneDisplay}</a>
      <a href={whatsappHref} target="_blank" rel="noopener noreferrer">WhatsApp<span className="sr-only"> (opens in a new tab)</span></a>
    </div>
    <h3>How a project runs</h3>
    <ProcessList />
  </>;
}
