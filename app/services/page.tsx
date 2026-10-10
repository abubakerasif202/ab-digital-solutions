import type { Metadata } from "next";
import Link from "next/link";
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
      <main className="content-page service-page gr-svc-page" id="main-content">
        <div className="container">
          <nav className="content-breadcrumb" aria-label="Breadcrumb">
            <Link href="/">Home</Link>
            <span aria-hidden="true">/</span>
            <span aria-current="page">Services</span>
          </nav>

          <header className="service-hero gr-svc-hero">
            <div className="service-hero-copy">
              <p className="eyebrow">Digital services / Sydney</p>
              <h1>Websites to business systems. <span className="accent-serif">Built with purpose.</span></h1>
              <p className="content-lead">
                One studio covering the full digital journey — from the first strategic decision to
                post-launch support, with every recommendation tied to a clear business goal.
              </p>
              <div className="content-actions">
                <Link className="button button-primary" href="/contact" data-magnetic>Start a Project <ArrowIcon /></Link>
                <Link className="button button-ghost" href="/work" data-magnetic>View Our Work</Link>
              </div>
            </div>
            {/* Decorative detail crop of the lead portfolio project. */}
            <figure className="service-hero-visual" aria-hidden="true">
              <div className="service-hero-visual-frame">
                <ProjectArtwork project={projects[0]} priority sizes="(max-width: 960px) 92vw, 520px" />
              </div>
              <figcaption>
                <span>Live work</span>
                {projects[0].name}
              </figcaption>
            </figure>
          </header>
        </div>

        <section className="gr-svc-section" aria-labelledby="services-index-heading">
          <div className="container">
            <div className="gr-section-head">
              <p className="eyebrow section-index"><span className="section-index-num">01</span><span className="micro-rule" aria-hidden="true" />Capabilities</p>
              <h2 id="services-index-heading" className="gr-display-l">Explore each <span className="accent-serif">service.</span></h2>
              <div className="gr-section-head-aside">
                <p>Every service links to a detailed page covering inclusions, approach, relevant live work and common questions.</p>
              </div>
            </div>
            <ServiceIndex items={serviceItems} />
          </div>
        </section>

        <section className="container studio-systems-proof" aria-labelledby="systems-proof-heading">
          <div><p className="eyebrow">Beyond the website</p><h2 id="systems-proof-heading">Software for the way a business actually works.</h2><p>Web applications, business systems and automation begin with the workflow. The 247 Inventory System brings stock, purchasing, sales and invoicing into a role-protected interface.</p><Link className="text-link" href="/work/247-inventory-system">Explore the inventory system <ArrowIcon /></Link></div>
          <Link className="studio-system-image" href="/work/247-inventory-system"><span className="studio-system-media"><ProjectArtwork project={findProject("247-inventory-system")!} sizes="(max-width: 900px) 92vw, 600px" /></span><span>Public staff-access screen · View case study <ArrowIcon /></span></Link>
        </section>

        <section className="gr-svc-process" aria-labelledby="services-process-heading">
          <div className="container">
            <div className="gr-section-head">
              <p className="eyebrow section-index"><span className="section-index-num">02</span><span className="micro-rule" aria-hidden="true" />How every engagement runs</p>
              <h2 id="services-process-heading" className="gr-display-l">A clear path from ambition to <span className="accent-serif">launch.</span></h2>
              <div className="gr-section-head-aside">
                <p>No black box. No unnecessary technical fog. Just collaborative decisions, visible progress and a dependable finish.</p>
              </div>
            </div>
            <ol className="gr-steps">
              {processSteps.map(([number, title, description]) => (
                <li key={number} data-reveal>
                  <span className="gr-steps-num" aria-hidden="true">{number}</span>
                  <h3>{title}</h3>
                  <p>{description}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <aside className="gr-final-cta" aria-labelledby="services-cta-heading">
          <div className="container gr-final-cta-inner" data-reveal>
            <p className="eyebrow">Ready when you are</p>
            <h2 id="services-cta-heading">Not sure which service fits? <span className="accent-serif">Start with a conversation.</span></h2>
            <p className="content-lead">Tell us what you are working toward. We will respond with a practical recommendation and a clear next step.</p>
            <div className="content-actions">
              <Link className="button button-primary" href="/contact" data-magnetic>Start a Project <ArrowIcon /></Link>
              <a className="button button-ghost" href={`tel:${siteConfig.phoneInternational}`}>Call {siteConfig.phoneDisplay}</a>
            </div>
          </div>
        </aside>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, "\\u003c") }} />
      </main>
      <SiteFooter currentYear={new Date().getUTCFullYear()} />
    </>
  );
}
