import type { Metadata } from "next";
import Link from "next/link";
import { breadcrumbSchema, Crumbs, CtaBand, JsonLd, PageShell, ProcessRail, ProjectFrame, SectionHead } from "../components/ui";
import { ArrowIcon } from "../icons";
import { findProject, projects } from "../project-data";
import { siteConfig } from "../site-config";
import { servicePages } from "./service-data";

const socialDescription = "Web design, e-commerce development, SEO, branding, digital marketing and website care for Australian businesses.";

export const metadata: Metadata = {
  title: "Digital Services",
  description: "Sydney web design, e-commerce, custom software, SEO and website care for Australian businesses. Explore practical digital services from AB Web Studio.",
  alternates: { canonical: "/services" },
  openGraph: {
    title: `Digital Services | ${siteConfig.name}`,
    description: socialDescription,
    url: "/services",
    siteName: siteConfig.name,
    type: "website",
    locale: "en_AU",
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: `${siteConfig.name} digital services` }],
  },
  twitter: { card: "summary_large_image", title: `Digital Services | ${siteConfig.name}`, description: socialDescription, images: ["/opengraph-image"] },
};

const trail = [["Services", "/services"]] as const;
const schema = {
  "@context": "https://schema.org",
  "@graph": [
    { "@type": "CollectionPage", name: "Digital Services", description: socialDescription, url: `${siteConfig.url}/services`, publisher: { "@id": `${siteConfig.url}/#organization` } },
    breadcrumbSchema(trail),
  ],
};

const services = servicePages.map((service) => {
  const project = findProject(service.featuredProject);
  if (!project) throw new Error(`services: unknown featured project "${service.featuredProject}"`);
  return { service, project };
});
const systemProject = (() => {
  const project = findProject("247-inventory-system");
  if (!project) throw new Error('services: unknown project "247-inventory-system"');
  return project;
})();

export default function ServicesPage() {
  return (
    <PageShell>
      <div className="shell">
        <Crumbs trail={trail} />
        <header className="page-hero">
          <div className="page-hero-copy">
            <p className="label">Digital services · Sydney</p>
            <h1>Websites to business systems, built with purpose.</h1>
            <p className="lead">Websites, online stores and custom software for Australian businesses. Bring us a new project, an existing site to improve or a workflow that needs a better system.</p>
            <div className="actions">
              <Link className="button button-primary" href="/contact">Start a project <ArrowIcon /></Link>
              <Link className="button button-ghost" href="/work">View our work <ArrowIcon direction="right" /></Link>
            </div>
          </div>
          <Link href={`/work/${projects[0].slug}`} aria-label={`${projects[0].name} case study`}>
            <ProjectFrame project={projects[0]} priority sizes="(max-width: 900px) 92vw, 520px" />
          </Link>
        </header>
      </div>

      <section className="section section--tint" aria-labelledby="services-index-heading">
        <div className="shell">
          <SectionHead id="services-index-heading" label="Capabilities" title="Explore each service.">
            The approach, scope and relevant project experience behind each service. We agree deliverables and costs in a written proposal.
          </SectionHead>
          <ol className="rows">
            {services.map(({ service, project }, index) => (
              <li key={service.slug} data-reveal>
                <Link className="row service-row" href={`/services/${service.slug}`}>
                  <span className="row-num">{String(index + 1).padStart(2, "0")}</span>
                  <h2 style={{ fontSize: "var(--type-h3)", lineHeight: 1.2 }}>{service.title}</h2>
                  <span style={{ display: "grid", gap: "0.75rem" }}>
                    <span className="muted">{service.summary}</span>
                    <span className="chips">
                      {service.benefits.slice(0, 3).map((benefit) => <span className="chip" key={benefit}>{benefit}</span>)}
                    </span>
                    <span className="muted" style={{ fontSize: "var(--type-small)" }}>Project experience: {project.name}</span>
                  </span>
                  <span className="row-arrow"><ArrowIcon /></span>
                </Link>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="section" aria-labelledby="systems-proof-heading">
        <div className="shell proof-grid">
          <Link href={`/work/${systemProject.slug}`} aria-label={`${systemProject.name} case study`} data-reveal>
            <ProjectFrame project={systemProject} sizes="(max-width: 820px) 92vw, 760px" />
          </Link>
          <div className="proof-side" data-reveal>
            <p className="label">Beyond the website</p>
            <h2 id="systems-proof-heading">Software for the way a business actually works.</h2>
            <p className="muted">Web applications, business systems and automation begin with the workflow. The 247 Inventory System brings stock, purchasing, sales and invoicing into a role-protected interface.</p>
            <Link className="text-link" href="/services/custom-software-business-systems">Explore custom software and business systems <ArrowIcon /></Link>
          </div>
        </div>
      </section>

      <section className="section section--deep" aria-labelledby="services-process-heading">
        <div className="shell">
          <SectionHead id="services-process-heading" label="How every engagement runs" title="A clear path from brief to launch.">
            No black box. Collaborative decisions, visible progress and a dependable finish.
          </SectionHead>
          <ProcessRail />
        </div>
      </section>

      <CtaBand id="services-cta-heading" label="Ready when you are" title="Not sure which service fits? Start with a conversation.">
        Tell us what you are working toward. We will respond with a practical recommendation and a clear next step.
      </CtaBand>
      <JsonLd data={schema} />
    </PageShell>
  );
}
