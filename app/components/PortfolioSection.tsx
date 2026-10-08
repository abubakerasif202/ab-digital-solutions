import Link from "next/link";
import { ArrowIcon } from "../icons";
import { ProjectArtwork, projectArtworkRatio } from "../project-artwork";
import { isSoftwareProject, projects } from "../project-data";

export function PortfolioSection() {
  return (
    <section className="section work-section gr-work" id="work" aria-labelledby="work-heading">
      <div className="container">
        <header className="gr-section-head" data-reveal>
          <p className="eyebrow section-index"><span className="section-index-num">01</span><span className="micro-rule" aria-hidden="true" />Selected work</p>
          <h2 id="work-heading" className="gr-display-xl">Real businesses.<br />Distinctive digital worlds.</h2>
          <div className="gr-section-head-aside">
            <p>{projects.length} responsive websites and custom software projects across mobility, logistics, local services, construction and property.</p>
            <Link className="section-heading-link" href="/work">View all case studies <ArrowIcon /></Link>
          </div>
        </header>
        <div className="signal-work-grid">
          {projects.map((project, index) => (
            <Link className="signal-work-item" href={`/work/${project.slug}`} key={project.slug}>
              <div className="signal-work-media">
                <div className="signal-project-image" style={{ aspectRatio: projectArtworkRatio(project) }}><ProjectArtwork project={project} sizes={index % 5 === 0 ? "(max-width: 720px) 90vw, 75vw" : "(max-width: 720px) 90vw, 45vw"} /></div>
                <span className="live-label"><i />{isSoftwareProject(project) ? "Live system" : "Live website"}</span>
              </div>
              <div className="signal-work-meta">
                <span aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
                <div><h3>{project.name}</h3><p>{project.description}</p><span className="project-cta">View Case Study <ArrowIcon /></span></div>
                <ArrowIcon />
              </div>
            </Link>
          ))}
        </div>
        <div className="gr-work-foot">
          <p>Explore {projects.length} live digital projects, each with its own case study.</p>
          <Link className="button button-ghost" href="/work">Open the work index <ArrowIcon /></Link>
        </div>
      </div>
    </section>
  );
}
