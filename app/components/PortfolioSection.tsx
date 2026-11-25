import Link from "next/link";
import { SectionEyebrow } from "./SectionEyebrow";
import { ArrowIcon } from "../icons";
import { projects, type Project } from "../project-data";
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
          <div><SectionEyebrow section="work" /><h2 id="work-heading">Selected work</h2></div>
          <Link className="cinema-link" href="/work" prefetch={false}>Explore all {projects.length} projects <ArrowIcon /></Link>
        </header>
        <div className="home-work-scroll" role="group" aria-labelledby="work-heading">
          <ul className="home-work-grid" role="list">
            {featured.map(({ slug, category, description }) => {
              const project: Project | undefined = projects.find((item) => item.slug === slug);
              if (!project) throw new Error(`Unknown featured project: ${slug}`);
              const title = project.titleName ?? project.name;
              return (
                <li key={slug} className="home-work-card">
                  <article>
                    <Link className="home-work-card-link" href={`/work/${project.slug}`} prefetch={false}>
                      <div className="home-work-image">
                        <ProjectArtwork project={project} sizes="(max-width: 767px) 77vw, (max-width: 1660px) 31vw, 495px" />
                      </div>
                      <div className="home-work-copy">
                        <p className="cinema-label">{category}</p>
                        <h3>{title}</h3>
                        <p>{description}</p>
                        <span className="cinema-link">View case study <ArrowIcon /></span>
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
