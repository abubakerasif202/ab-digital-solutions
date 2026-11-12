import type { Metadata } from "next";
import Link from "next/link";
import type { CSSProperties } from "react";
import { Crumbs } from "../components/inspector/Crumbs";
import { InspectFrame } from "../components/inspector/InspectFrame";
import { StudioAbout } from "../components/studio/StudioAbout";
import { PageTransition } from "../components/motion/PageTransition";
import { ArrowIcon } from "../icons";
import { projectArtworkRatio } from "../project-artwork";
import { findProject, projects, type Project } from "../project-data";
import { SiteHeader } from "../site-chrome";
import { SiteFooter } from "../site-footer";
import { siteConfig } from "../site-config";

const description =
  "Meet AB Web Studio, a Sydney digital studio creating websites and custom software for Australian businesses with thoughtful design and practical technology.";

export const metadata: Metadata = {
  title: "About the Studio",
  description,
  alternates: { canonical: "/about" },
  openGraph: {
    title: `About the Studio | ${siteConfig.name}`,
    description,
    url: "/about",
    siteName: siteConfig.name,
    type: "website",
    locale: "en_AU",
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: `${siteConfig.name} — Sydney digital studio` }],
  },
  twitter: { card: "summary_large_image", title: `About the Studio | ${siteConfig.name}`, description, images: ["/opengraph-image"] },
};

const schema = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "AboutPage",
      name: "About AB Web Studio",
      description,
      url: `${siteConfig.url}/about`,
      about: { "@id": `${siteConfig.url}/#organization` },
    },
    {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: siteConfig.url },
        { "@type": "ListItem", position: 2, name: "About", item: `${siteConfig.url}/about` },
      ],
    },
  ],
};

const principles = [
  ["01", "Show the work first.", "Visitors understand who you help, what you offer and why your business is worth choosing."],
  ["02", "Explain the business value.", "Information hierarchy and calls to action work together to turn attention into genuine enquiries."],
  ["03", "Keep the next step obvious.", "Responsive, accessible, search-ready website foundations engineered to feel fast on the devices customers actually use."],
] as const;

const approach = [
  ["Design", "Positioning, content hierarchy and a visual direction shaped around the business behind the brief — never a generic template dressed in your colours."],
  ["Development", "Responsive web applications and digital products built around the way your business works, with accessibility-conscious implementation and technical SEO foundations."],
  ["Systems", "Inventory, purchasing, sales and invoicing workflows brought together in practical custom software when a website alone is not enough."],
] as const;

// A varied selection of studio projects, including a protected application.
const collage = ["aftab-sons-transport", "247-inventory-system", "decent-development"]
  .map((slug) => findProject(slug))
  .filter((project): project is Project => Boolean(project));

export default function AboutPage() {
  return (
    <>
      <SiteHeader />
      <PageTransition>
      <main className="ip ip-about inspector-home" id="main-content">
        <div className="ip-about-crumbs">
          <Crumbs items={[{ label: "Home", href: "/" }, { label: "About" }]} />
        </div>

        <StudioAbout headingAs="h1" index="01" variant="inspector" />

        <section className="ip-sec ip-sec--tight" aria-labelledby="approach-heading">
          <div className="ip-wrap">
            <div className="ip-head">
              <p className="ix-label">02 · Approach</p>
              <h2 id="approach-heading" className="ip-h2">Design, development and <em>systems</em> under one roof.</h2>
            </div>
            <ol className="ip-approach">
              {approach.map(([title, copy], index) => (
                <li key={title} style={{ "--i": index } as CSSProperties}>
                  <span className="ip-big-no" aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
                  <h3>{title}</h3>
                  <p>{copy}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="ip-sec ip-sec--line" aria-labelledby="collage-heading">
          <div className="ip-wrap">
            <div className="ip-head ip-head--row">
              <div>
                <p className="ix-label">Selected studio projects</p>
                <h2 id="collage-heading" className="ip-h2">From a first impression to <em>day-to-day operations.</em></h2>
              </div>
              <Link className="ip-link" href="/work">See all {projects.length} projects <ArrowIcon /></Link>
            </div>
            <div className="ip-collage">
              {collage.map((project, index) => (
                <Link className={`ip-tile ip-tile--${index + 1}`} href={`/work/${project.slug}`} key={project.slug}>
                  <span className="ip-tile-media">
                    <InspectFrame
                      src={project.image}
                      alt={project.alt}
                      ratio={projectArtworkRatio(project)}
                      sizes="(max-width: 860px) 92vw, 50vw"
                    />
                  </span>
                  <span className="ip-tile-cap"><span className="ip-kicker">{project.sector}</span><strong>{project.name}</strong></span>
                  <span className="ip-tile-note">{project.description}</span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className="ip-paper" aria-labelledby="principles-heading">
          <div className="ip-wrap">
            <div className="ip-head ip-head--paper">
              <p className="ix-label">03 · The AB standard</p>
              <h2 id="principles-heading" className="ip-h2">Feel the quality. <em>Then see the thinking.</em></h2>
            </div>
            <ol className="ip-principles">
              {principles.map(([number, title, copy], index) => (
                <li key={number} style={{ "--i": index } as CSSProperties}>
                  <span className="ip-big-no" aria-hidden="true">{number}</span>
                  <h3>{title}</h3>
                  <p>{copy}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <aside className="ip-cta" aria-labelledby="about-cta-heading">
          <div className="ip-wrap ip-cta-grid">
            <div>
              <p className="ix-label">Start a conversation</p>
              <h2 id="about-cta-heading" className="ip-h2">Tell us what you are building and where you want the business to <em>go.</em></h2>
            </div>
            <div className="ip-cta-side">
              <div className="ip-actions">
                <Link className="ix-btn ix-btn--solid" href="/contact">Start a project <ArrowIcon /></Link>
                <Link className="ix-btn ix-btn--ghost" href="/services">Explore services <ArrowIcon direction="right" /></Link>
              </div>
            </div>
          </div>
        </aside>

        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, "\\u003c") }} />
      </main>
      </PageTransition>
      <SiteFooter currentYear={new Date().getUTCFullYear()} />
    </>
  );
}
