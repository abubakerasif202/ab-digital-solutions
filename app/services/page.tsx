import type { Metadata } from "next";
import Link from "next/link";
import { ProjectArtwork } from "../project-artwork";
import { projects } from "../project-data";
import { SiteHeader } from "../site-chrome";
import { SiteFooter } from "../site-footer";
import { servicePages } from "./service-data";
import { siteConfig } from "../site-config";

export const metadata: Metadata = {
  title: "Digital Services",
  description:
    "Web design, e-commerce development, SEO, branding, digital marketing and website care for Australian businesses — every engagement tied to a clear commercial goal.",
  alternates: { canonical: "/services" },
  openGraph: {
    title: `Digital Services | ${siteConfig.name}`,
    description:
      "Web design, e-commerce development, SEO, branding, digital marketing and website care for Australian businesses.",
    url: "/services",
    siteName: siteConfig.name,
    type: "website",
    locale: "en_AU",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: `${siteConfig.name} digital services`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `Digital Services | ${siteConfig.name}`,
    description:
      "Web design, e-commerce development, SEO, branding, digital marketing and website care for Australian businesses.",
    images: ["/opengraph-image"],
  },
};

const schema = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "CollectionPage",
      name: "Digital Services",
      description:
        "Web design, e-commerce development, SEO, branding, digital marketing and website care for Australian businesses.",
      url: `${siteConfig.url}/services`,
      publisher: { "@id": `${siteConfig.url}/#organization` },
    },
    {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: siteConfig.url },
        { "@type": "ListItem", position: 2, name: "Services", item: `${siteConfig.url}/services` },
      ],
    },
  ],
};

export default function ServicesPage() {
  return (
    <>
      <SiteHeader />
      <main className="content-page service-page" id="main-content">
        <div className="container content-shell">
          <nav className="content-breadcrumb" aria-label="Breadcrumb">
            <Link href="/">Home</Link>
            <span aria-hidden="true">/</span>
            <span aria-current="page">Services</span>
          </nav>

          <header className="service-hero">
            <div className="service-hero-copy">
              <p className="eyebrow">Digital services / Sydney</p>
              <h1>Digital services</h1>
              <p className="content-lead">
                One studio covering the full digital journey — from the first strategic decision to
                post-launch support, with every recommendation tied to a clear business goal.
              </p>
              <div className="content-actions">
                <Link className="button button-primary" href="/#contact">Start a Project <span aria-hidden="true">↗</span></Link>
                <Link className="button button-ghost" href="/work">View Our Work</Link>
              </div>
            </div>
            {/* Decorative detail crop of the lead portfolio project. */}
            <figure className="service-hero-visual" aria-hidden="true">
              <div className="service-hero-visual-frame">
                <ProjectArtwork project={projects[0]} sizes="440px" />
              </div>
              <figcaption>
                <span>Live work</span>
                {projects[0].name}
              </figcaption>
            </figure>
          </header>

          <section className="related-services" aria-labelledby="services-index-heading">
            <div className="service-section-heading">
              <p className="eyebrow">Capabilities</p>
              <h2 id="services-index-heading">Explore each service</h2>
              <p>Every service below links to a detailed page covering inclusions, approach, relevant live work and common questions.</p>
            </div>
            <div className="services-index-list">
              {servicePages.map((service, index) => (
                <Link className="services-index-row" href={`/services/${service.slug}`} key={service.slug} aria-label={`${service.title} — ${service.summary}`}>
                  <span className="services-index-number" aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
                  <span className="services-index-copy">
                    <strong>{service.title}</strong>
                    <small>{service.summary}</small>
                  </span>
                  <span className="services-index-arrow" aria-hidden="true">↗</span>
                </Link>
              ))}
            </div>
          </section>

          <section className="service-cta" aria-labelledby="services-cta-heading">
            <p className="eyebrow">Ready when you are</p>
            <h2 id="services-cta-heading">Not sure which service fits? Start with a conversation.</h2>
            <p>Tell us what you are working toward. We will respond with a practical recommendation and a clear next step.</p>
            <div className="content-actions">
              <Link className="button button-primary" href="/#contact">Start a Project <span aria-hidden="true">↗</span></Link>
              <a className="button button-ghost" href={`tel:${siteConfig.phoneInternational}`}>Call {siteConfig.phoneDisplay}</a>
            </div>
          </section>
        </div>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, "\\u003c") }} />
      </main>
      <SiteFooter currentYear={new Date().getUTCFullYear()} />
    </>
  );
}
