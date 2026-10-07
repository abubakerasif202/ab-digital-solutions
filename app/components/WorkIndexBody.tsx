"use client";

import Link from "next/link";
import { useState, type CSSProperties } from "react";
import { flushSync } from "react-dom";
import { ProjectArtwork, projectArtworkRatio } from "../project-artwork";
import { formatCategory, isSoftwareProject, projects, sectors, type Project } from "../project-data";
import { ArrowIcon } from "../icons";

const ALL_SECTORS = "All work";

type ViewTransitionDocument = Document & {
  startViewTransition?: (callback: () => void) => void;
};

interface CardMotionStyle extends CSSProperties {
  viewTransitionName?: string;
}

type BlockType = "feature" | "split" | "split-reverse" | "pair" | "system";
type Block = { type: BlockType; items: Project[] };

/* Compose the visible projects into a rhythm of different presentations so
   the index never repeats one card: a cinematic feature first, then
   alternating editorial splits and staggered pairs, with live software
   always shown full-width inside a browser frame. */
function composeBlocks(list: readonly Project[]): Block[] {
  if (list.length === 0) return [];
  const blocks: Block[] = [{ type: "feature", items: [list[0]] }];
  const rhythm: BlockType[] = ["split", "pair", "split-reverse", "pair"];
  let step = 0;
  for (let i = 1; i < list.length;) {
    const project = list[i];
    if (isSoftwareProject(project)) {
      blocks.push({ type: "system", items: [project] });
      i += 1;
      continue;
    }
    const type = rhythm[step % rhythm.length];
    step += 1;
    const partner = list[i + 1];
    if (type === "pair" && partner && !isSoftwareProject(partner)) {
      blocks.push({ type, items: [project, partner] });
      i += 2;
    } else {
      blocks.push({ type: type === "pair" ? "split" : type, items: [project] });
      i += 1;
    }
  }
  return blocks;
}

export function WorkIndexBody() {
  const [filter, setFilter] = useState<string>(ALL_SECTORS);
  const filters = [ALL_SECTORS, ...sectors];
  const visibleProjects = filter === ALL_SECTORS
    ? projects
    : projects.filter((project) => project.sector === filter);
  const blocks = composeBlocks(visibleProjects);

  const handleFilterChange = (nextFilter: string) => {
    if (nextFilter === filter) return;
    const doc = document as ViewTransitionDocument;
    if (typeof doc.startViewTransition === "function"
      && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      doc.startViewTransition(() => flushSync(() => setFilter(nextFilter)));
    } else {
      setFilter(nextFilter);
    }
  };

  return (
    <>
      <section className="work-index-hero gr-wi-hero">
        <div className="container gr-wi-hero-inner">
          <p className="eyebrow" data-reveal>
            <span className="eyebrow-mark" /> Index / live client work
          </p>
          <div className="gr-wi-hero-row">
            <h1 data-reveal>The work, at the size it <span className="accent-serif">deserves.</span></h1>
            <div className="gr-wi-hero-count" data-reveal aria-hidden="true">
              <span className="gr-number">{String(projects.length).padStart(2, "0")}</span>
            </div>
          </div>
          <div className="gr-wi-hero-copy" data-reveal>
            <p className="content-lead">
              A portfolio of websites and custom software created for
              Australian transport, logistics, mobility, removals, construction and property
              businesses.
            </p>
            <p className="work-index-count">{projects.length} projects · Sydney studio</p>
          </div>
        </div>
      </section>

      <div className="gr-wi-filter-bar">
        <div className="container work-index-filters" role="group" aria-label="Filter by sector">
          {filters.map((sector) => {
            const isActive = sector === filter;
            const count = sector === ALL_SECTORS
              ? projects.length
              : projects.filter((project) => project.sector === sector).length;
            return (
              <button
                key={sector}
                type="button"
                className={`work-index-filter${isActive ? " is-active" : ""}`}
                aria-pressed={isActive}
                onClick={() => handleFilterChange(sector)}
              >
                {sector} <small aria-hidden="true">{count}</small>
              </button>
            );
          })}
        </div>
      </div>

      <section className="gr-wi-list" aria-label="Project index">
        <div className="container">
          <p className="sr-only" aria-live="polite">
            Showing {visibleProjects.length} of {projects.length} projects
          </p>
          {blocks.map((block) => (
            <div className={`gr-wi-block gr-wi-block--${block.type}`} key={block.items.map((p) => p.slug).join("+")}>
              {block.items.map((project) => (
                <WorkIndexCard key={project.slug} project={project} type={block.type} />
              ))}
            </div>
          ))}
        </div>
      </section>
    </>
  );
}

function WorkIndexCard({ project, type }: { project: Project; type: BlockType }) {
  const number = String(projects.findIndex((p) => p.slug === project.slug) + 1).padStart(2, "0");
  const cardStyle: CardMotionStyle = { viewTransitionName: `work-card-${project.slug}` };
  const sizes = type === "feature" || type === "system"
    ? "(max-width: 960px) 100vw, 1440px"
    : type === "pair"
      ? "(max-width: 960px) 92vw, 48vw"
      : "(max-width: 960px) 92vw, 60vw";

  return (
    <article className="gr-wi-card" data-reveal style={cardStyle}>
      <Link className="gr-wi-link" href={`/work/${project.slug}`} aria-label={`View ${project.name} case study`}>
        <div className="gr-wi-media gr-wi-media--framed">
          <div className="gr-browser-bar" aria-hidden="true"><i /><i /><i /><span>{project.displayUrl}</span></div>
          <div className="gr-wi-image" style={{ aspectRatio: projectArtworkRatio(project) }}>
            <ProjectArtwork project={project} sizes={sizes} priority={type === "feature"} />
          </div>
          <span className="live-label">
            <i /> {isSoftwareProject(project) ? "Live system" : "Live website"}
          </span>
        </div>
        <div className="gr-wi-meta">
          <span className="gr-number gr-wi-number" aria-hidden="true">{number}</span>
          <div className="gr-wi-heading">
            <p className="gr-kicker">{formatCategory(project.category)}</p>
            <h2 className="gr-wi-title">{project.name}</h2>
          </div>
          <div className="gr-wi-detail">
            <p className="gr-wi-description">{project.description}</p>
            <p className="gr-wi-stack">{project.techStack.join(" · ")}</p>
            <span className="gr-wi-cta">
              View case study <ArrowIcon />
            </span>
          </div>
        </div>
      </Link>
    </article>
  );
}
