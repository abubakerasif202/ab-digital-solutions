import Link from "next/link";
import { SectionEyebrow } from "./SectionEyebrow";
import { ArrowIcon } from "../icons";
import { projectDestinationLabel, projects, type Project } from "../project-data";
import { ProjectArtwork } from "../project-artwork";

const featured = [
  {
    slug: "jufaja-homes",
    category: "Website design & development",
    description: "We built a responsive construction website with a home design catalogue and dedicated enquiry paths.",
  },
  {
    slug: "on-call-trailers",
    category: "Trailer hire & booking",
    description: "We built a trailer hire website with fleet comparisons, hire information and direct links to book.",
  },
  {
    slug: "247-inventory-system",
    category: "Custom business software",
    description: "We built a staff platform that brings tyre inventory, purchasing, sales and invoicing into one system.",
  },
] as const;

export function PortfolioSection() {
  return (
    <section className="home-work" id="work" aria-labelledby="work-heading" tabIndex={-1}>
      <div className="cinema-shell">
        <header className="home-work-head">
          <div>
            <SectionEyebrow section="work" />
            <h2 id="work-heading">Selected <em>work</em></h2>
          </div>
          <Link className="cinema-link" href="/work" prefetch={false}>Explore all {projects.length} projects <ArrowIcon /></Link>
        </header>
        <div className="home-work-scroll" role="group" aria-labelledby="work-heading">
          <ul className="home-work-grid" role="list">
            {featured.map(({ slug, category, description }, index) => {
              const project: Project | undefined = projects.find((item) => item.slug === slug);
              if (!project) throw new Error(`Unknown featured project: ${slug}`);
              const title = project.titleName ?? project.name;
              const isLead = index === 0;
              return (
                <li key={slug} className={`home-work-card${isLead ? " home-work-card--lead" : ""}`} data-tilt>
                  <article>
                    <Link className="home-work-card-link" href={`/work/${project.slug}`} prefetch={false}>
                      <div className="home-work-image">
                        <ProjectArtwork
                          project={project}
                          sizes={isLead
                            ? "(max-width: 767px) 84vw, (max-width: 1520px) 52vw, 780px"
                            : "(max-width: 767px) 84vw, (max-width: 1520px) 44vw, 680px"}
                        />
                      </div>
                      <div className="home-work-copy">
                        <div className="home-work-meta">
                          <span className="home-work-index" aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
                          <p className="cinema-label">{category}</p>
                        </div>
                        <h3>{title}</h3>
                        <p>{description}</p>
                        {isLead && project.techStack.length > 0 && (
                          <ul className="home-work-stack" aria-label="Technology">
                            {project.techStack.slice(0, 3).map((tech) => (
                              <li key={tech}>{tech}</li>
                            ))}
                          </ul>
                        )}
                        <div className="home-work-foot">
                          <span className="home-work-destination">{projectDestinationLabel(project)}</span>
                          <span className="cinema-link">View case study <ArrowIcon /></span>
                        </div>
                      </div>
                    </Link>
                  </article>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </section>
  );
}
