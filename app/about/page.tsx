import type { Metadata } from "next";
import Link from "next/link";
import { ABBrandImage } from "../components/brand/ABBrandImage";
import { ArrowIcon } from "../icons";
import { ProjectArtwork } from "../project-artwork";
import { findProject, projects, type Project } from "../project-data";
import { SiteHeader } from "../site-chrome";
import { SiteFooter } from "../site-footer";
import { siteConfig } from "../site-config";

const description =
  "AB Web Studio is a Sydney-based digital studio helping ambitious Australian businesses build authority through thoughtful design, clear communication and practical technology.";

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

const values = [
  ["Clear communication", "Simple advice and transparent decisions."],
  ["Reliable delivery", "A professional process from brief to launch."],
  ["Results-focused work", "Design choices connected to business goals."],
] as const;

const approach = [
  ["Design", "Positioning, content hierarchy and a visual direction shaped around the business behind the brief — never a generic template dressed in your colours."],
  ["Development", "Responsive web applications and digital products built around the way your business works, with accessibility-conscious implementation and technical SEO foundations."],
  ["Systems", "Inventory, purchasing, sales and invoicing workflows brought together in practical custom software when a website alone is not enough."],
] as const;

// A small, deliberately varied selection of real live work for the collage.
const collage = ["aftab-sons-transport", "247-inventory-system", "decent-development"]
  .map((slug) => findProject(slug))
  .filter((project): project is Project => Boolean(project));

export default function AboutPage() {
  return (
    <>
      <SiteHeader />
      <main className="content-page gr-about" id="main-content">
        <header className="container gr-about-hero">
          <nav className="content-breadcrumb" aria-label="Breadcrumb">
            <Link href="/">Home</Link>
            <span aria-hidden="true">/</span>
            <span aria-current="page">About</span>
          </nav>
          <p className="eyebrow">About AB / Sydney, Australia</p>
          <h1>Your digital presence should <span className="accent-serif">work as hard</span> as you do.</h1>
          <div className="gr-about-intro">
            <p className="gr-about-lede">{description}</p>
            <p>We create digital experiences that look considered, feel effortless to use and give your business a stronger platform for sustainable growth.</p>
          </div>
        </header>

        <section className="gr-about-brand" aria-label="Studio identity">
          <div className="container gr-about-brand-grid">
            <div className="gr-about-mark" data-reveal>
              <ABBrandImage full />
            </div>
            <div className="gr-about-founder" data-reveal>
              <p className="eyebrow">The studio</p>
              <dl className="gr-about-facts">
                <div><dt>Founder</dt><dd>Abubakar Asif<span>Founder &amp; Lead Developer</span></dd></div>
                <div><dt>Based in</dt><dd>Sydney, Australia<span>Working Australia-wide</span></dd></div>
                <div><dt>Portfolio</dt><dd>{projects.length} live projects<span>Websites, e-commerce and custom software</span></dd></div>
              </dl>
              <p className="gr-about-quote">
                Every engagement is shaped around the business behind the brief: the people you need to reach, the proof they need to see and the next step they should feel confident taking.
              </p>
            </div>
          </div>
        </section>

        <section className="container gr-about-approach" aria-labelledby="approach-heading">
          <div className="gr-section-head">
            <p className="eyebrow section-index"><span className="section-index-num">01</span><span className="micro-rule" aria-hidden="true" />Approach</p>
            <h2 id="approach-heading" className="gr-display-l">Design, development and <span className="accent-serif">systems</span> under one roof.</h2>
          </div>
          <ol className="gr-about-approach-list">
            {approach.map(([title, copy], index) => (
              <li key={title} data-reveal>
                <span className="gr-number" aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
                <h3>{title}</h3>
                <p>{copy}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="gr-about-collage" aria-labelledby="collage-heading">
          <div className="container">
            <div className="gr-about-collage-head" data-reveal>
              <p className="eyebrow">Selected live work</p>
              <h2 id="collage-heading">The result is a distinctive website with a clear <span className="accent-serif">commercial purpose.</span></h2>
              <Link className="text-link" href="/work">See all {projects.length} projects <ArrowIcon /></Link>
            </div>
            <div className="gr-about-collage-grid">
              {collage.map((project, index) => (
                <Link className={`gr-about-tile gr-about-tile--${index + 1}`} href={`/work/${project.slug}`} key={project.slug} data-cursor="VIEW" data-reveal>
                  <span className="gr-about-tile-media">
                    <ProjectArtwork project={project} sizes="(max-width: 860px) 92vw, 50vw" />
                  </span>
                  <span className="gr-about-tile-caption"><span>{project.sector}</span>{project.name}</span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className="gr-about-principles" aria-labelledby="principles-heading">
          <div className="container">
            <div className="gr-section-head">
              <p className="eyebrow section-index"><span className="section-index-num">02</span><span className="micro-rule" aria-hidden="true" />The AB standard</p>
              <h2 id="principles-heading" className="gr-display-l">Feel the quality. <span className="accent-serif">Then see the thinking.</span></h2>
            </div>
            <ol className="gr-about-principles-list">
              {principles.map(([number, title, copy]) => (
                <li key={number} data-reveal>
                  <span>{number}</span>
                  <h3>{title}</h3>
                  <p>{copy}</p>
                </li>
              ))}
            </ol>
            <dl className="gr-about-values">
              {values.map(([term, detail]) => (
                <div key={term}><dt>{term}</dt><dd>{detail}</dd></div>
              ))}
            </dl>
          </div>
        </section>

        <aside className="gr-final-cta" aria-labelledby="about-cta-heading">
          <div className="container gr-final-cta-inner" data-reveal>
            <p className="eyebrow">Start a conversation</p>
            <h2 id="about-cta-heading">Tell us what you are building and where you want the business to <span className="accent-serif">go.</span></h2>
            <div className="content-actions">
              <Link className="button button-primary" href="/contact" data-magnetic>Start a Project <ArrowIcon /></Link>
              <Link className="button button-ghost" href="/services" data-magnetic>Explore services</Link>
            </div>
          </div>
        </aside>

        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, "\\u003c") }} />
      </main>
      <SiteFooter currentYear={new Date().getUTCFullYear()} />
    </>
  );
}
