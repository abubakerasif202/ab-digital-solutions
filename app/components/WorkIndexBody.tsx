"use client";

import Link from "next/link";
import { useState } from "react";
import { flushSync } from "react-dom";
import { InspectFrame } from "./inspector/InspectFrame";
import { projectArtworkRatio } from "../project-artwork";
import { formatCategory, isSoftwareProject, projectDestinationLabel, projectDisplayDomain, projects, sectors, type Project } from "../project-data";
import { ArrowIcon } from "../icons";

const ALL_SECTORS = "All work";

type ViewTransitionDocument = Document & {
  startViewTransition?: (callback: () => void) => void;
};

type BlockType = "feature" | "split" | "split-reverse" | "pair" | "system";
type Block = { type: BlockType; items: Project[] };

/* Compose the visible projects into a rhythm of different presentations so
   the index never repeats one card: a wide feature first, then alternating
   offset splits and staggered pairs, with live software always shown
   full-width inside a window frame. */
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
      <header className="ip-hero ip-hero--work">
        <div className="ip-wrap ip-work-hero">
          <div className="ip-hero-copy">
            <p className="ix-label">Index / client work</p>
            <h1 className="ip-title">The work, at the size it <em>deserves.</em></h1>
            <p className="ip-lede">
              A portfolio of websites and custom software created for
              Australian grocery, fresh produce, transport, logistics, mobility, removals, construction and property
              businesses.
            </p>
            <p className="ip-meta-line">{projects.length} projects · Sydney studio</p>
            <p className="ip-work-hint" aria-hidden="true">
              <span>Move across a capture to inspect it</span>
            </p>
          </div>
        </div>
        <span className="ip-ghost-num" aria-hidden="true">{String(projects.length).padStart(2, "0")}</span>
      </header>

      <div className="ip-wi-scope">
        <div className="ip-filter-bar">
          <div className="ip-wrap ip-filters" role="group" aria-label="Filter by sector">
            {filters.map((sector) => {
              const isActive = sector === filter;
              const count = sector === ALL_SECTORS
                ? projects.length
                : projects.filter((project) => project.sector === sector).length;
              return (
                <button
                  key={sector}
                  type="button"
                  className={`ip-filter${isActive ? " is-active" : ""}`}
                  aria-pressed={isActive}
                  onClick={() => handleFilterChange(sector)}
                >
                  {sector} <small aria-hidden="true">{count}</small>
                </button>
              );
            })}
          </div>
        </div>

        <section className="ip-wi" aria-label="Project index">
          <div className="ip-wrap">
            <p className="sr-only" aria-live="polite">
              Showing {visibleProjects.length} of {projects.length} projects
            </p>
            {blocks.map((block) => (
              <div className={`ip-wi-block ip-wi-block--${block.type}`} key={block.items.map((p) => p.slug).join("+")}>
                {block.items.map((project) => (
                  <WorkIndexCard key={project.slug} project={project} type={block.type} />
                ))}
              </div>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}

function WorkIndexCard({ project, type }: { project: Project; type: BlockType }) {
  const number = String(projects.findIndex((p) => p.slug === project.slug) + 1).padStart(2, "0");
  const sizes = type === "feature" || type === "system"
    ? "(max-width: 960px) 100vw, 1360px"
    : type === "pair"
      ? "(max-width: 960px) 92vw, 48vw"
      : "(max-width: 960px) 92vw, 60vw";

  return (
    <article className="ip-wi-card">
      <Link className="ip-wi-link" href={`/work/${project.slug}`}>
        <div className="ip-wi-media">
          <div className="ip-bar" aria-hidden="true"><i /><i /><i /><span>{projectDisplayDomain(project)}</span></div>
          <InspectFrame
            src={project.image}
            alt={project.alt}
            ratio={projectArtworkRatio(project)}
            sizes={sizes}
            priority={type === "feature"}
            transitionName={`project-${project.slug}`}
          />
          <span className="ip-live"><i aria-hidden="true" /> {projectDestinationLabel(project)}</span>
        </div>
        <div className="ip-wi-meta">
          <span className="ip-wi-no" aria-hidden="true">{number}</span>
          <div className="ip-wi-heading">
            <p className="ip-kicker">{formatCategory(project.category)}</p>
            <h2 className="ip-wi-title">{project.name}</h2>
          </div>
          <div className="ip-wi-detail">
            <p className="ip-wi-desc">{project.description}</p>
            <p className="ip-wi-stack">{project.techStack.join(" · ")}</p>
            <span className="ip-wi-cta">View case study <ArrowIcon /></span>
          </div>
        </div>
      </Link>
    </article>
  );
}
