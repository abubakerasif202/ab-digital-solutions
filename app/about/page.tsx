import type { Metadata } from "next";
import Link from "next/link";
import { ABLogo } from "../components/brand/ABLogo";
import { breadcrumbSchema, Crumbs, CtaBand, JsonLd, PageShell, SectionHead, WorkItem } from "../components/ui";
import { ArrowIcon } from "../icons";
import { findProject, projects, type Project } from "../project-data";
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

const trail = [["About", "/about"]] as const;

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
    breadcrumbSchema(trail),
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

const values = [
  ["Clear communication", "Simple advice and transparent decisions."],
  ["Reliable delivery", "A professional process from brief to launch."],
  ["Results-focused work", "Design choices connected to business goals."],
] as const;

export default function AboutPage() {
  return (
    <PageShell>
      <div className="shell">
        <Crumbs trail={trail} />
        <header className="page-hero" style={{ alignItems: "center" }}>
          <div className="page-hero-copy">
            <p className="label">About the studio</p>
            <h1>Your digital presence should work as hard as you do.</h1>
            <p className="lead">
              AB Web Studio is a Sydney-based digital studio helping ambitious Australian businesses build authority through thoughtful design, clear communication and practical technology.
            </p>
            <p className="muted" style={{ maxWidth: "40em" }}>
              Every engagement is shaped around the business behind the brief: the people you need to reach, the proof they need to see and the next step they should feel confident taking. The result is a distinctive website with a clear commercial purpose, not a generic template dressed in your colours.
            </p>
            <div className="actions">
              <Link className="button button-primary" href="/contact">Start a project <ArrowIcon /></Link>
              <Link className="button button-ghost" href="/work">See the work <ArrowIcon direction="right" /></Link>
            </div>
          </div>
          <figure className="mark-plate">
            <ABLogo title="AB Web Studio monogram" />
            <figcaption><span>AB / Web Studio</span><span>Sydney / Australia</span></figcaption>
          </figure>
        </header>

        <dl className="facts" data-reveal>
          <div><dt>Founder &amp; Lead Developer</dt><dd>Abubakar Asif</dd></div>
          <div><dt>Working Australia-wide</dt><dd>{siteConfig.location}</dd></div>
          <div><dt>Project case studies</dt><dd data-count={projects.length}>{projects.length}</dd></div>
        </dl>
      </div>

      <section className="section" aria-labelledby="approach-heading">
        <div className="shell">
          <SectionHead id="approach-heading" label="Approach" title="Design, development and systems under one roof." />
          <ol className="rows">
            {approach.map(([title, copy], index) => (
              <li key={title} data-reveal>
                <div className="row" style={{ gridTemplateColumns: "3.5rem minmax(0, 0.6fr) minmax(0, 1.4fr)" }}>
                  <span className="row-num">{String(index + 1).padStart(2, "0")}</span>
                  <h3>{title}</h3>
                  <p>{copy}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="section section--tint" aria-labelledby="collage-heading">
        <div className="shell">
          <SectionHead id="collage-heading" label="Selected studio projects" title="From a first impression to day-to-day operations.">
            <Link className="text-link" href="/work">See all {projects.length} projects <ArrowIcon /></Link>
          </SectionHead>
          <div className="trio">
            {collage.map((project) => (
              <div key={project.slug} data-reveal><WorkItem project={project} sizes="(max-width: 820px) 92vw, 520px" /></div>
            ))}
          </div>
        </div>
      </section>

      <section className="section" aria-labelledby="principles-heading">
        <div className="shell split">
          <div className="split-sticky" data-reveal>
            <p className="label">The AB standard</p>
            <h2 id="principles-heading">Feel the quality. Then see the thinking.</h2>
            <dl style={{ display: "grid", gap: "0.9rem", marginTop: "0.5rem" }}>
              {values.map(([term, detail]) => (
                <div key={term}><dt style={{ fontWeight: 600 }}>{term}</dt><dd className="muted">{detail}</dd></div>
              ))}
            </dl>
          </div>
          <ol className="rows">
            {principles.map(([number, title, copy]) => (
              <li key={number} data-reveal>
                <div className="row" style={{ gridTemplateColumns: "3.5rem minmax(0, 1fr)" }}>
                  <span className="row-num">{number}</span>
                  <div style={{ display: "grid", gap: "0.5rem" }}><h3>{title}</h3><p>{copy}</p></div>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <CtaBand id="about-cta-heading" label="Start a conversation" title="Tell us what you are building and where you want the business to go." />
      <JsonLd data={schema} />
    </PageShell>
  );
}
