import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ProjectArtwork } from "../../project-artwork";
import { findProject, projects } from "../../project-data";
import { SiteHeader } from "../../site-chrome";
import { SiteFooter } from "../../site-footer";
import { siteConfig } from "../../site-config";
import { ArrowIcon } from "../../icons";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return projects.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const project = findProject((await params).slug);
  if (!project) return {};
  return {
    title: `${project.name} Case Study | ${siteConfig.name}`,
    description: project.description,
    alternates: { canonical: `/work/${project.slug}` },
    openGraph: {
      title: `${project.name} Case Study | ${siteConfig.name}`,
      description: project.description,
      url: `/work/${project.slug}`,
      siteName: siteConfig.name,
      type: "website",
      locale: "en_AU",
      images: [
        {
          url: "/opengraph-image",
          width: 1200,
          height: 630,
          alt: `${project.name} website case study by ${siteConfig.name}`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${project.name} Case Study | ${siteConfig.name}`,
      description: project.description,
      images: ["/opengraph-image"],
    },
  };
}

export default async function ProjectCaseStudyPage({ params }: Props) {
  const project = findProject((await params).slug);
  if (!project) notFound();

  const currentIndex = projects.findIndex((p) => p.slug === project.slug);
  const nextProject = projects[(currentIndex + 1) % projects.length];
  const currentYear = new Date().getUTCFullYear();

  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CreativeWork",
        name: `${project.name} Website Case Study`,
        description: project.description,
        url: `${siteConfig.url}/work/${project.slug}`,
        author: { "@id": `${siteConfig.url}/#organization` },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: siteConfig.url },
          { "@type": "ListItem", position: 2, name: "Work", item: `${siteConfig.url}/work` },
          {
            "@type": "ListItem",
            position: 3,
            name: project.name,
            item: `${siteConfig.url}/work/${project.slug}`,
          },
        ],
      },
    ],
  };

  return (
    <>
      <SiteHeader />
      <main className="content-page case-study-page" id="main-content">
        <div className="container content-shell">
          <nav className="content-breadcrumb" aria-label="Breadcrumb">
            <Link href="/">Home</Link>
            <span aria-hidden="true">/</span>
            <Link href="/work">Work</Link>
            <span aria-hidden="true">/</span>
            <span aria-current="page">{project.name}</span>
          </nav>

          <header className="case-study-hero">
            <p className="eyebrow">Case Study / {project.category}</p>
            <h1>{project.name}</h1>
            <p className="content-lead">{project.overview}</p>
            <div className="content-actions">
              <a
                className="button button-primary"
                href={project.url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Visit ${project.name} live website (opens in a new tab)`}
              >
                View Live Website <ArrowIcon />
              </a>
              <Link className="button button-ghost" href="/#contact">
                Start a conversation
              </Link>
            </div>
          </header>

          <div className="case-study-showcase-frame">
            <div className="browser-frame">
              <div className="browser-bar" aria-hidden="true">
                <i /><i /><i />
                <span>{project.displayUrl}</span>
              </div>
              <div className="case-study-hero-image">
                <ProjectArtwork project={project} priority sizes="(max-width: 1200px) 94vw, 80vw" />
              </div>
            </div>
          </div>

          <div className="case-study-grid">
            <section className="case-study-main" aria-labelledby="solution-heading">
              <div className="case-study-block">
                <p className="eyebrow">Strategy & Approach</p>
                <h2 id="solution-heading">Delivering a clearer path to customer action.</h2>
                <p className="case-study-body-text">{project.solution}</p>
              </div>

              <div className="case-study-block">
                <p className="eyebrow">Key Features</p>
                <h2>Implemented Functionality</h2>
                <ul className="key-features-list">
                  {project.keyFeatures.map((feature, idx) => (
                    <li key={feature}>
                      <span className="feature-num">{String(idx + 1).padStart(2, "0")}</span>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </section>

            <aside className="case-study-sidebar" aria-label="Project details">
              <div className="sidebar-card">
                <h3>Project Metadata</h3>
                <dl className="metadata-list">
                  <div>
                    <dt>Client / Project</dt>
                    <dd>{project.name}</dd>
                  </div>
                  <div>
                    <dt>Category</dt>
                    <dd>{project.category}</dd>
                  </div>
                  <div>
                    <dt>Live Domain</dt>
                    <dd>
                      <a href={project.url} target="_blank" rel="noopener noreferrer">
                        {project.displayUrl} ↗
                      </a>
                    </dd>
                  </div>
                </dl>

                <h3 className="sidebar-subheading">Services Delivered</h3>
                <div className="sidebar-tags">
                  {project.tags.map((tag) => (
                    <span key={tag} className="project-tag-pill">{tag}</span>
                  ))}
                </div>

                <h3 className="sidebar-subheading">Tech Stack</h3>
                <div className="sidebar-tech">
                  {project.techStack.map((tech) => (
                    <span key={tech} className="tech-pill">{tech}</span>
                  ))}
                </div>
              </div>
            </aside>
          </div>

          <section className="case-study-live-cta" aria-labelledby="live-proof-heading">
            <div className="live-cta-card">
              <div>
                <p className="eyebrow">Live Digital Experience</p>
                <h2 id="live-proof-heading">See {project.name} in action.</h2>
                <p>Explore the live website on desktop or mobile to test performance and user journeys.</p>
              </div>
              <a
                className="button button-primary"
                href={project.url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Visit ${project.name} live website (opens in a new tab)`}
              >
                Visit Live Site <ArrowIcon />
              </a>
            </div>
          </section>

          <nav className="next-project-nav" aria-label="Next Project">
            <span>Next Case Study</span>
            <Link className="next-project-card" href={`/work/${nextProject.slug}`}>
              <div>
                <p>{nextProject.category}</p>
                <h3>{nextProject.name}</h3>
              </div>
              <span className="next-arrow">Read Case Study <ArrowIcon /></span>
            </Link>
          </nav>

          <aside className="conversion-banner" data-reveal aria-label="Start your project">
            <div className="container conversion-banner-layout">
              <div className="conversion-banner-copy">
                <p className="eyebrow">Start A Project</p>
                <h3>Ready to create a website that elevates your business positioning?</h3>
              </div>
              <div className="conversion-banner-actions">
                <Link className="button button-primary" href="/#contact">
                  Book a free consultation <ArrowIcon />
                </Link>
                <a className="button button-ghost" href={`tel:${siteConfig.phoneInternational}`}>
                  Call {siteConfig.phoneDisplay}
                </a>
              </div>
            </div>
          </aside>
        </div>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, "\\u003c") }}
        />
      </main>
      <SiteFooter currentYear={currentYear} />
    </>
  );
}
