import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { CountUp } from "../components/motion/CountUp";
import { PageTransition } from "../components/motion/PageTransition";
import { ArrowIcon } from "../icons";
import { projects } from "../project-data";
import { SiteHeader } from "../site-chrome";
import { SiteFooter } from "../site-footer";
import { siteConfig } from "../site-config";
import { industries, industryProjects } from "./industry-data";
import "./industries.css";

const description =
  "Websites and business systems by AB Web Studio for Australian removalists, transport and logistics companies, builders and developers, car rental and automotive businesses.";

export const metadata: Metadata = {
  title: "Industries We Build For",
  description,
  alternates: { canonical: "/industries" },
  openGraph: {
    title: `Industries We Build For | ${siteConfig.name}`,
    description,
    url: "/industries",
    siteName: siteConfig.name,
    type: "website",
    locale: "en_AU",
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "AB Web Studio industry portfolio" }],
  },
  twitter: {
    card: "summary_large_image",
    title: `Industries We Build For | ${siteConfig.name}`,
    description,
    images: ["/opengraph-image"],
  },
};

export default function IndustriesPage() {
  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        name: "Industries We Build For",
        description,
        url: `${siteConfig.url}/industries`,
        publisher: { "@id": `${siteConfig.url}/#organization` },
        mainEntity: {
          "@type": "ItemList",
          itemListElement: industries.map((industry, index) => ({
            "@type": "ListItem",
            position: index + 1,
            name: industry.title,
            url: `${siteConfig.url}/industries/${industry.slug}`,
          })),
        },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: siteConfig.url },
          { "@type": "ListItem", position: 2, name: "Industries", item: `${siteConfig.url}/industries` },
        ],
      },
    ],
  };

  return (
    <>
      <SiteHeader />
      <PageTransition>
        <main className="gr-ind-page" id="main-content">
          <section className="gr-ind-hero">
            <div className="container">
              <nav className="content-breadcrumb" aria-label="Breadcrumb">
                <Link href="/">Home</Link>
                <span aria-hidden="true">/</span>
                <span aria-current="page">Industries</span>
              </nav>
              <div className="gr-ind-hero-grid">
                <div>
                  <p className="eyebrow" data-reveal><span className="eyebrow-mark" />Index / Industries</p>
                  <h1 className="gr-ind-title">
                    <span className="mask-line"><span>Built for the way{" "}</span></span>
                    <span className="mask-line"><span>your <span className="accent-serif">industry</span> works.</span></span>
                  </h1>
                  <p className="content-lead" data-reveal>
                    Every industry asks something different of a website. Here is our work grouped by the businesses it was built for, with the live sites behind each one.
                  </p>
                </div>
                <dl className="gr-ind-figures" data-reveal>
                  <div><dt>Industries</dt><dd><CountUp value={industries.length} /></dd></div>
                  <div><dt>Client projects</dt><dd><CountUp value={projects.length} /></dd></div>
                </dl>
              </div>
            </div>
          </section>

          <section className="gr-ind-index" aria-label="Industries">
            <div className="container">
              <ol className="gr-ind-list">
                {industries.map((industry, index) => {
                  const work = industryProjects(industry);
                  return (
                    <li key={industry.slug} data-reveal>
                      <Link className="gr-ind-row" href={`/industries/${industry.slug}`} data-cursor="VIEW">
                        <span className="gr-ind-row-num" aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
                        <span className="gr-ind-row-main">
                          <span className="gr-ind-row-name">{industry.name}</span>
                          <span className="gr-ind-row-summary">{industry.summary}</span>
                        </span>
                        <span className="gr-ind-row-count">
                          {work.length} {work.length === 1 ? "project" : "projects"}
                        </span>
                        <span className="gr-ind-row-fan" aria-hidden="true">
                          {work.slice(0, 3).map((project) => (
                            <span className="gr-ind-row-card" key={project.slug}>
                              <Image src={project.image} alt="" fill sizes="200px" loading="lazy" />
                            </span>
                          ))}
                        </span>
                        <span className="gr-ind-row-arrow" aria-hidden="true"><ArrowIcon /></span>
                      </Link>
                    </li>
                  );
                })}
              </ol>
            </div>
          </section>

          <aside className="gr-final-cta" aria-labelledby="industries-cta-heading">
            <div className="container gr-final-cta-inner" data-reveal>
              <p className="eyebrow">Your industry is not listed?</p>
              <h2 id="industries-cta-heading">Every brief starts with the business, <span className="accent-serif">not the sector.</span></h2>
              <p className="content-lead">Tell us what you do and who you need to reach. We will come back with a practical next step.</p>
              <div className="content-actions">
                <Link className="button button-primary" href="/contact" data-magnetic>Start a Project <ArrowIcon /></Link>
                <Link className="button button-ghost" href="/work" data-magnetic>View Our Work <ArrowIcon /></Link>
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
