"use client";

import Link from "next/link";
import { useState, type CSSProperties } from "react";
import { ProjectArtwork } from "../project-artwork";
import { isSoftwareProject, projects, sectors, type Project } from "../project-data";

const ALL_SECTORS = "All work";

type ViewTransitionDocument = Document & {
  startViewTransition?: (callback: () => void) => void;
};

interface CardMotionStyle extends CSSProperties {
  viewTransitionName?: string;
}

export function WorkIndexBody() {
  const [filter, setFilter] = useState<string>(ALL_SECTORS);
  const filters = [ALL_SECTORS, ...sectors];
  const visibleProjects = filter === ALL_SECTORS
    ? projects
    : projects.filter((project) => project.sector === filter);

  const handleFilterChange = (nextFilter: string) => {
    const doc = document as ViewTransitionDocument;
    if (typeof doc.startViewTransition === "function") {
      doc.startViewTransition(() => setFilter(nextFilter));
    } else {
      setFilter(nextFilter);
    }
  };

  return (
    <>
      <section className="work-index-hero">
        <div className="hero-watermark" aria-hidden="true">Work</div>
        <div className="container work-index-hero-inner">
          <p className="eyebrow" data-reveal>
            <span className="eyebrow-mark" /> Index / live client work
          </p>
          <div className="work-index-hero-row">
            <h1 data-reveal>The work, at the size it deserves.</h1>
            <div className="work-index-hero-copy" data-reveal>
              <p className="content-lead">
                Every project below is in production today — websites and custom software for
                Australian transport, logistics, mobility, removals, construction and property
                businesses.
              </p>
              <p className="work-index-count">{projects.length} projects · Sydney studio</p>
            </div>
          </div>
          <div className="work-index-filters" role="group" aria-label="Filter by sector" data-reveal>
            {filters.map((sector) => {
              const isActive = sector === filter;
              return (
                <button
                  key={sector}
                  type="button"
                  className={`work-index-filter${isActive ? " is-active" : ""}`}
                  aria-pressed={isActive}
                  onClick={() => handleFilterChange(sector)}
                >
                  {sector}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      <section className="work-index-grid-section" aria-label="Project index">
        <div className="container work-index-grid">
          {visibleProjects.map((project) => (
            <WorkIndexCard key={project.slug} project={project} index={projects.indexOf(project)} />
          ))}
        </div>
      </section>
    </>
  );
}

function WorkIndexCard({ project, index }: { project: Project; index: number }) {
  const isBig = index % 4 === 0;
  const imageOnRight = !isBig && index % 2 === 1;
  const number = String(index + 1).padStart(2, "0");

  const cardClassName = [
    "work-index-card",
    isBig ? "work-index-card--big" : "work-index-card--split",
    imageOnRight ? "work-index-card--image-right" : "work-index-card--image-left",
  ].join(" ");
  const cardStyle: CardMotionStyle = { viewTransitionName: `work-card-${project.slug}` };

  return (
    <article className={cardClassName} data-reveal style={cardStyle}>
      <Link className="work-index-card-link" href={`/work/${project.slug}`}>
        <div className="work-index-media">
          <ProjectArtwork
            project={project}
            sizes={isBig
              ? "(max-width: 960px) 92vw, 1440px"
              : "(max-width: 960px) 92vw, (max-width: 1400px) 55vw, 820px"}
          />
          <span className="live-label">
            <i /> {isSoftwareProject(project) ? "Live system" : "Live website"}
          </span>
          <span className="work-index-rule" aria-hidden="true" />
        </div>
        <div className="work-index-meta">
          <p className="work-index-eyebrow">{number} — {project.category}</p>
          <h2 className={isBig ? "work-index-title work-index-title--big" : "work-index-title"}>
            {project.name}
          </h2>
          <p className="work-index-description">{project.description}</p>
          <p className="work-index-stack">{project.techStack.join("  ·  ")}</p>
          <p className="work-index-url">{project.displayUrl}</p>
          <span className="work-index-cta">
            View case study <span aria-hidden="true">↗</span>
          </span>
        </div>
      </Link>
    </article>
  );
}
