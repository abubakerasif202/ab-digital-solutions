import type { Metadata } from "next";
import Link from "next/link";
import { ProjectArtwork } from "../project-artwork";
import { projects } from "../project-data";
import { SiteHeader } from "../site-chrome";
import { SiteFooter } from "../site-footer";
import { siteConfig } from "../site-config";
import { ArrowIcon } from "../icons";

export const metadata: Metadata = {
  title: "Our Work & Case Studies | AB Digital Solutions",
  description:
    "Explore our portfolio of strategy-led, high-converting websites built for Australian mobility, logistics, construction and local service businesses.",
  alternates: { canonical: "/work" },
  openGraph: {
    title: `Our Work & Case Studies | ${siteConfig.name}`,
    description:
      "Explore selected live websites engineered by AB Digital Solutions for Australian businesses.",
    url: "/work",
    siteName: siteConfig.name,
    type: "website",
    locale: "en_AU",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "AB Digital Solutions client portfolio and case studies",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `Our Work & Case Studies | ${siteConfig.name}`,
    description:
      "Explore selected live websites engineered by AB Digital Solutions for Australian businesses.",
    images: ["/opengraph-image"],
  },
};

const schema = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "CollectionPage",
      name: "Our Work & Case Studies",
      description:
        "Selected client websites designed and developed by AB Digital Solutions.",
      url: `${siteConfig.url}/work`,
      publisher: { "@id": `${siteConfig.url}/#organization` },
    },
    {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: siteConfig.url },
        { "@type": "ListItem", position: 2, name: "Work", item: `${siteConfig.url}/work` },
      ],
    },
  ],
};

export default function WorkPage() {
  const currentYear = new Date().getUTCFullYear();

  return (
    <>
      <SiteHeader />
      <main className="content-page work-index-page" id="main-content">
        <div className="container content-shell">
          <nav className="content-breadcrumb" aria-label="Breadcrumb">
            <Link href="/">Home</Link>
            <span aria-hidden="true">/</span>
            <span aria-current="page">Work</span>
          </nav>

          <header className="work-hero" data-reveal>
            <p className="eyebrow">Portfolio / Selected Work</p>
            <h1>Real websites. Real commercial impact.</h1>
            <p className="content-lead">
              Seven responsive digital experiences across mobility, logistics, local services, construction and property—built with sharp positioning, fast performance and clear paths to enquiry.
            </p>
          </header>

          <section className="work-showcase-section" aria-labelledby="work-heading">
            <h2 className="sr-only" id="work-heading">Featured Client Projects</h2>
            <div className="work-grid">
              {projects.map((project, index) => (
                <article className="project-card work-page-card" data-reveal key={project.slug}>
                  <div className="browser-frame">
                    <div className="browser-bar" aria-hidden="true">
                      <i /><i /><i />
                      <span>{project.displayUrl}</span>
                    </div>
                    <div className="project-image">
                      <ProjectArtwork
                        project={project}
                        priority={index === 0}
                        sizes="(max-width: 720px) 94vw, (max-width: 1100px) 47vw, 42vw"
                      />
                      <span className="live-label"><i /> Live website</span>
                      <span className="project-index">{String(index + 1).padStart(2, "0")}</span>
                    </div>
                  </div>
                  <div className="project-details">
                    <p className="project-category-tag">{project.category}</p>
                    <h3>{project.name}</h3>
                    <p className="project-description-text">{project.description}</p>
                    <div className="project-tags">
                      {project.tags.map((tag) => (
                        <span key={tag} className="project-tag-pill">{tag}</span>
                      ))}
                    </div>
                    <div className="project-actions-group">
                      <Link className="button button-primary case-study-btn" href={`/work/${project.slug}`}>
                        Read Case Study <ArrowIcon />
                      </Link>
                      <a
                        className="project-cta live-site-link"
                        href={project.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`Visit ${project.name} live website (opens in a new tab)`}
                      >
                        View Live Website <ArrowIcon />
                      </a>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <aside className="conversion-banner work-page-banner" data-reveal aria-label="Start a project">
            <div className="container conversion-banner-layout">
              <div className="conversion-banner-copy">
                <p className="eyebrow">Strategy & Execution</p>
                <h3>Have a project in mind? Let&apos;s build something impossible to ignore.</h3>
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
