import Link from "next/link";
import { ArrowIcon } from "../icons";
import { ProjectArtwork } from "../project-artwork";
import { ProjectShowcase } from "./ProjectShowcase";
import { projectDestinationLabel, projects } from "../project-data";

/* Selected work: a browsable showcase of every recorded project, then a short
   typographic index of the featured ones with hover previews. The complete list
   lives on /work, so the home page links to it instead of repeating all of it. */

const FEATURED_ROWS = 6;

export function PortfolioSection() {
  return (
    <section className="section work-section gr-work" id="work" aria-labelledby="work-heading">
      <div className="container">
        <header className="gr-section-head" data-reveal>
          <p className="eyebrow section-index"><span className="section-index-num">01</span><span className="micro-rule" aria-hidden="true" />Selected work</p>
          <h2 id="work-heading" className="gr-display-xl">The work <span className="accent-serif">speaks first.</span></h2>
          <div className="gr-section-head-aside">
            <p>{projects.length} responsive websites and custom software projects across grocery, fresh produce, mobility, logistics, local services, construction and property.</p>
            <Link className="section-heading-link" href="/work">
              Explore our work <ArrowIcon />
            </Link>
          </div>
        </header>

        <ProjectShowcase />

        <p className="gr-kicker gr-index-label">Featured projects</p>
        <ul className="gr-index" aria-label="Featured studio projects">
          {projects.slice(0, FEATURED_ROWS).map((project, i) => (
            <li key={project.slug}><Link
              className="gr-index-row"
              href={`/work/${project.slug}`}
              data-cursor="VIEW"
            >
              <span className="gr-index-num" aria-hidden="true">{String(i + 1).padStart(2, "0")}</span>
              <span className="gr-index-name">{project.name}</span>
              <span className="gr-index-sector">{project.sector}</span>
              <span className="gr-index-kind">{projectDestinationLabel(project)}</span>
              <span className="gr-index-arrow" aria-hidden="true"><ArrowIcon /></span>
              <span className="gr-index-preview" aria-hidden="true">
                <ProjectArtwork project={project} sizes="(max-width: 860px) 30vw, 360px" />
              </span>
            </Link></li>
          ))}
        </ul>

        <div className="gr-work-foot" data-reveal>
          <p>Showing {Math.min(FEATURED_ROWS, projects.length)} of {projects.length} projects, each with its own case study.</p>
          <Link className="button button-ghost" href="/work" data-magnetic>
            Explore our work <ArrowIcon />
          </Link>
        </div>
      </div>
    </section>
  );
}
