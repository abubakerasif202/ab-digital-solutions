import Link from "next/link";
import { ArrowIcon } from "../icons";
import { ProjectArtwork } from "../project-artwork";
import { ProjectShowcase } from "./ProjectShowcase";
import { isSoftwareProject, projects } from "../project-data";

/* Selected work: a browsable showcase of every live project, then a
   typographic index of the same registry with hover previews. Nothing in the
   canonical project list is filtered out. */

export function PortfolioSection() {
  return (
    <section className="section work-section gr-work" id="work" aria-labelledby="work-heading">
      <div className="container">
        <header className="gr-section-head" data-reveal>
          <p className="eyebrow section-index"><span className="section-index-num">01</span><span className="micro-rule" aria-hidden="true" />Selected work</p>
          <h2 id="work-heading" className="gr-display-xl">The work <span className="accent-serif">speaks first.</span></h2>
          <div className="gr-section-head-aside">
            <p>{projects.length} responsive websites and custom software projects across mobility, logistics, local services, construction and property.</p>
            <Link className="section-heading-link" href="/work">
              View all case studies <ArrowIcon />
            </Link>
          </div>
        </header>

        <ProjectShowcase />

        <p className="gr-kicker gr-index-label">The full index</p>
        <ul className="gr-index" aria-label="More live projects">
          {projects.map((project, i) => (
            <li key={project.slug}><Link
              className="gr-index-row"
              href={`/work/${project.slug}`}
              data-cursor="VIEW"
            >
              <span className="gr-index-num" aria-hidden="true">{String(i + 1).padStart(2, "0")}</span>
              <span className="gr-index-name">{project.name}</span>
              <span className="gr-index-sector">{project.sector}</span>
              <span className="gr-index-kind">{isSoftwareProject(project) ? "Live system" : "Live website"}</span>
              <span className="gr-index-arrow" aria-hidden="true"><ArrowIcon /></span>
              <span className="gr-index-preview" aria-hidden="true">
                <ProjectArtwork project={project} sizes="(max-width: 860px) 30vw, 360px" />
              </span>
            </Link></li>
          ))}
        </ul>

        <div className="gr-work-foot" data-reveal>
          <p>Explore {projects.length} live digital projects, each with its own case study.</p>
          <Link className="button button-ghost" href="/work" data-magnetic>
            Open the work index <ArrowIcon />
          </Link>
        </div>
      </div>
    </section>
  );
}
