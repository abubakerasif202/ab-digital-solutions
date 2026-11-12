import type { Metadata } from "next";
import Link from "next/link";
import type { CSSProperties } from "react";
import { Crumbs } from "../components/inspector/Crumbs";
import { PageTransition } from "../components/motion/PageTransition";
import { ProjectArtwork } from "../project-artwork";
import { findProject, projects } from "../project-data";
import { ServiceIndex, type ServiceIndexItem } from "../components/ServiceIndex";
import { SiteHeader } from "../site-chrome";
import { SiteFooter } from "../site-footer";
import { servicePages } from "./service-data";
import { siteConfig } from "../site-config";
import { ArrowIcon } from "../icons";

export const metadata: Metadata = {
  title: "Digital Services",
  description:
    "Sydney web design, e-commerce, custom software, SEO and website care for Australian businesses. Explore practical digital services from AB Web Studio.",
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

const serviceItems: ServiceIndexItem[] = servicePages.map((service) => {
  const project = findProject(service.featuredProject);
  if (!project) throw new Error(`services: unknown featured project "${service.featuredProject}"`);
  return {
    slug: service.slug,
    title: service.title,
    summary: service.summary,
    intro: service.intro,
    benefits: service.benefits,
    project,
  };
});

const processSteps = [
  ["01", "Discover", "We clarify your audience, offer, goals and the actions your website needs to drive."],
  ["02", "Design", "We map the content, page structure and customer journey before visual design begins."],
  ["03", "Build", "We create, refine and develop the experience responsively, with clear review points."],
  ["04", "Launch", "We complete launch checks, publish with confidence and stay available as you grow."],
] as const;

export default function ServicesPage() {
  return (
    <>
      <SiteHeader />
      <PageTransition>
      <main className="ip ip-services inspector-home" id="main-content">
        <header className="ip-hero">
          <div className="ip-wrap ip-hero-grid">
            <div className="ip-hero-copy">
              <Crumbs items={[{ label: "Home", href: "/" }, { label: "Services" }]} />
              <p className="ix-label">Digital services / Sydney</p>
              <h1 className="ip-title">Websites to business systems. <em>Built with purpose.</em></h1>
              <p className="ip-lede">
                Websites, online stores and custom software for Australian businesses. Bring us a new
                project, an existing site to improve or a workflow that needs a better system.
              </p>
              <div className="ip-actions">
                <Link className="ix-btn ix-btn--solid" href="/contact">Start a Project <ArrowIcon /></Link>
                <Link className="ix-btn ix-btn--ghost" href="/work">View Our Work</Link>
              </div>
            </div>
            {/* Decorative detail crop of the lead portfolio project. */}
            <figure className="ip-hero-visual" aria-hidden="true">
              <div className="ip-plate">
                <ProjectArtwork project={projects[0]} priority sizes="(max-width: 900px) 92vw, 520px" />
              </div>
              <figcaption>
                <span>Studio project</span>
                {projects[0].name}
              </figcaption>
            </figure>
          </div>
          <span className="ip-ghost-num" aria-hidden="true">{String(servicePages.length).padStart(2, "0")}</span>
        </header>

        <section className="ip-sec ip-sec--tight" aria-labelledby="services-index-heading">
          <div className="ip-wrap">
            <div className="ip-head">
              <p className="ix-label">01 · Capabilities</p>
              <h2 id="services-index-heading" className="ip-h2">Explore each <em>service.</em></h2>
              <p className="ip-head-note">Explore the approach, scope and relevant project experience behind each service. We agree deliverables and costs in a written proposal.</p>
            </div>
            <ServiceIndex items={serviceItems} />
          </div>
        </section>

        <section className="ip-proof" aria-labelledby="systems-proof-heading">
          <div className="ip-wrap ip-proof-grid">
            <div className="ip-proof-copy">
              <p className="ix-label">Beyond the website</p>
              <h2 id="systems-proof-heading" className="ip-h2">Software for the way a business actually works.</h2>
              <p>Web applications, business systems and automation begin with the workflow. The 247 Inventory System brings stock, purchasing, sales and invoicing into a role-protected interface.</p>
              <Link className="ip-link" href="/services/custom-software-business-systems">Explore custom software and business systems <ArrowIcon /></Link>
            </div>
            <Link className="ip-proof-shot" href="/work/247-inventory-system">
              <span className="ip-proof-img"><ProjectArtwork project={findProject("247-inventory-system")!} sizes="(max-width: 900px) 92vw, 600px" /></span>
              <span className="ip-proof-cap">Public staff-access screen · View case study <ArrowIcon /></span>
            </Link>
          </div>
        </section>

        <section className="sx-process" aria-labelledby="services-process-heading">
          <div className="sx-process-inner">
            <div className="sx-process-head">
              <p className="ix-label">02 · How every engagement runs</p>
              <h2 id="services-process-heading">A clear path from ambition to <em>launch.</em></h2>
              <p>No black box. No unnecessary technical fog. Just collaborative decisions, visible progress and a dependable finish.</p>
            </div>
            <ol className="sx-steps">
              {processSteps.map(([number, title, description], index) => (
                <li key={number} style={{ "--i": index } as CSSProperties}>
                  <span className="sx-step-no">{number}</span>
                  <div className="sx-step-body">
                    <h3>{title}</h3>
                    <p>{description}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <aside className="ip-cta" aria-labelledby="services-cta-heading">
          <div className="ip-wrap ip-cta-grid">
            <div>
              <p className="ix-label">Ready when you are</p>
              <h2 id="services-cta-heading" className="ip-h2">Not sure which service fits? <em>Start with a conversation.</em></h2>
            </div>
            <div className="ip-cta-side">
              <p>Tell us what you are working toward. We will respond with a practical recommendation and a clear next step.</p>
              <div className="ip-actions">
                <Link className="ix-btn ix-btn--solid" href="/contact">Start a Project <ArrowIcon /></Link>
                <a className="ix-btn ix-btn--ghost" href={`tel:${siteConfig.phoneInternational}`}>Call {siteConfig.phoneDisplay}</a>
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
