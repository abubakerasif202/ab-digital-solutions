import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { ArrowIcon, Glyph } from "../icons";
import { ProjectArtwork } from "../project-artwork";
import { formatCategory, isSoftwareProject, projects } from "../project-data";

export function PortfolioSection() {
  return (
        <section className="section work-section" id="work" aria-labelledby="work-heading">
          <div className="container">
            <div className="section-heading" data-reveal>
              <div>
                <p className="eyebrow section-index"><span className="section-index-num">01</span><span className="micro-rule" aria-hidden="true" />Selected work</p>
                <h2 id="work-heading">The work <span className="accent-serif">speaks first.</span></h2>
              </div>
              <div className="section-heading-aside">
                <p>{projects.length} responsive websites and custom software projects across mobility, logistics, local services, construction and property.</p>
                <Link className="section-heading-link" href="/work">
                  View all case studies <ArrowIcon />
                </Link>
              </div>
            </div>
            <div className="work-grid">
              {projects.map((project, index) => (
                <Link
                  className="project-card glow-surface"
                  data-tilt
                  data-reveal
                  data-cursor="VIEW"
                  href={`/work/${project.slug}`}
                  key={project.name}
                  aria-label={`${project.name} — View Case Study`}
                >
                  <div className="portfolio-browser-bar" aria-hidden="true"><i /><i /><i /><span>{project.displayUrl}</span><Glyph icon={ArrowUpRight} size={12} /></div>
                  <div className="project-image">
                    <ProjectArtwork
                      project={project}
                      sizes="(max-width: 720px) 92vw, (max-width: 1440px) 46vw, (max-width: 1800px) 700px, 810px"
                    />
                    <span className="live-label"><i /> {isSoftwareProject(project) ? "Live system" : "Live website"}</span>
                    <span className="project-index">{String(index + 1).padStart(2, "0")}</span>
                  </div>
                  <div className="project-details">
                    <p className="project-category-tag"><span className="project-category-index">{String(index + 1).padStart(2, "0")}</span>{formatCategory(project.category)}</p>
                    <div className="project-title-row">
                      <h3>{project.name}</h3>
                      <span className="project-arrow" aria-hidden="true"><ArrowIcon /></span>
                    </div>
                    <p className="project-description-text">{project.description}</p>
                    <div className="project-tags">
                      {project.tags.map((tag) => (
                        <span key={tag} className="project-tag-pill">{tag}</span>
                      ))}
                    </div>
                    <p className="project-stack">
                      <span aria-hidden="true">stack:</span> {project.techStack.join(" · ")}
                    </p>
                    <span className="project-cta">View Case Study <ArrowIcon /></span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

  );
}
