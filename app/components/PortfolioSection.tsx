import Link from "next/link";
import { ArrowIcon } from "../icons";
import { ProjectArtwork } from "../project-artwork";
import { formatCategory, isSoftwareProject, projects } from "../project-data";

/* Selected work, composed in three tiers so the portfolio reads with
   hierarchy instead of fourteen identical cards:
   1. a flagship project at cinematic scale,
   2. an asymmetric duo (website + live system),
   3. a typographic index of the remaining projects with hover previews. */
// Tier boundaries in the canonical order. Every project in the registry is
// rendered in exactly one tier; nothing is filtered out.
const DUO_END = 3;

export function PortfolioSection() {
  const flagship = projects[0];

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

        <Link
          className="gr-flagship"
          href={`/work/${flagship.slug}`}
          data-cursor="VIEW"
          aria-label={`${flagship.name} — View Case Study`}
        >
          <div className="gr-flagship-media gr-cut-lg" data-tilt>
            <ProjectArtwork
              project={flagship}
              sizes="(max-width: 720px) 100vw, (max-width: 1440px) 92vw, 1440px"
            />
            <span className="live-label"><i /> {isSoftwareProject(flagship) ? "Live system" : "Live website"}</span>
          </div>
          <div className="gr-flagship-meta">
            <span className="gr-number" aria-hidden="true">01</span>
            <div>
              <p className="gr-kicker">{formatCategory(flagship.category)}</p>
              <h3 className="gr-flagship-title">{flagship.name}</h3>
            </div>
            <div className="gr-flagship-copy">
              <p>{flagship.description}</p>
              <span className="project-cta">View Case Study <ArrowIcon /></span>
            </div>
          </div>
        </Link>

        <div className="gr-duo">
          {projects.map((project, i) => (i < 1 || i >= DUO_END) ? null : (
            <Link
              className={`gr-duo-item gr-duo-item--${i === 1 ? "lead" : "offset"}`}
              href={`/work/${project.slug}`}
              data-cursor="VIEW"
              data-reveal
              key={project.slug}
              aria-label={`${project.name} — View Case Study`}
            >
              <div data-tilt className={`gr-duo-media${isSoftwareProject(project) ? " gr-duo-media--system" : ""}`}>
                <div className="gr-browser-bar" aria-hidden="true"><i /><i /><i /><span>{project.displayUrl}</span></div>
                <div className="gr-duo-image">
                  <ProjectArtwork project={project} sizes="(max-width: 860px) 92vw, 58vw" />
                </div>
                <span className="live-label"><i /> {isSoftwareProject(project) ? "Live system" : "Live website"}</span>
              </div>
              <p className="gr-kicker"><span className="gr-kicker-num">{String(i + 1).padStart(2, "0")}</span> / {project.sector}</p>
              <h3>{project.name}</h3>
              <p className="gr-duo-text">{project.description}</p>
              <span className="project-cta">View Case Study <ArrowIcon /></span>
            </Link>
          ))}
        </div>

        <ul className="gr-index" aria-label="More live projects">
          {projects.map((project, i) => i < DUO_END ? null : (
            <li key={project.slug}><Link
              className="gr-index-row"
              href={`/work/${project.slug}`}
              data-cursor="VIEW"
              aria-label={`${project.name} — View Case Study`}
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
