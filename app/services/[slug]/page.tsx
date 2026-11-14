import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { breadcrumbSchema, Crumbs, CtaBand, FaqList, JsonLd, PageShell, ProcessRail, ProjectFrame, SectionHead, WorkItem } from "../../components/ui";
import { findProject } from "../../project-data";
import { findService, serviceContactHref, serviceDelivery, servicePages } from "../service-data";
import { siteConfig } from "../../site-config";
import { ArrowIcon } from "../../icons";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return servicePages.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const service = findService((await params).slug);
  if (!service) return {};
  // Search titles carry the commercial and local intent; the SEO titles already end with the
  // brand, so they bypass the layout title template instead of repeating it.
  const { seoTitle, seoDescription: description } = service;
  return {
    title: { absolute: seoTitle },
    description,
    alternates: { canonical: `/services/${service.slug}` },
    openGraph: {
      title: seoTitle,
      description,
      url: `/services/${service.slug}`,
      siteName: siteConfig.name,
      type: "website",
      locale: "en_AU",
      images: [{
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: `${service.title} by ${siteConfig.name}`,
      }],
    },
    twitter: {
      card: "summary_large_image",
      title: seoTitle,
      description,
      images: ["/opengraph-image"],
    },
  };
}

const related: Record<string, string[]> = {
  "web-design-sydney": ["branding-content", "seo-local-visibility", "website-maintenance"],
  "ecommerce-website-development": ["digital-marketing", "web-design-sydney", "website-maintenance"],
  "seo-local-visibility": ["web-design-sydney", "digital-marketing", "ecommerce-website-development"],
  "branding-content": ["web-design-sydney", "digital-marketing", "seo-local-visibility"],
  "digital-marketing": ["seo-local-visibility", "ecommerce-website-development", "branding-content"],
  "website-maintenance": ["web-design-sydney", "ecommerce-website-development", "seo-local-visibility"],
  "custom-software-business-systems": ["web-design-sydney", "ecommerce-website-development", "website-maintenance"],
};

export default async function ServicePage({ params }: Props) {
  const service = findService((await params).slug);
  if (!service) notFound();

  const proofProjects = service.proof.map(({ slug, role }) => {
    const project = findProject(slug);
    if (!project) throw new Error(`service ${service.slug}: unknown project "${slug}"`);
    return { project, role };
  });
  const [primaryProof, ...supportingProof] = proofProjects;
  const featuredProject = primaryProof.project;
  const contactHref = serviceContactHref(service);
  const relatedServices = (related[service.slug] ?? [])
    .map((slug) => findService(slug))
    .filter((entry): entry is (typeof servicePages)[number] => Boolean(entry));
  const delivery = serviceDelivery[service.slug];
  const trail = [["Services", "/services"], [service.title, `/services/${service.slug}`]] as const;

  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Service",
        name: service.title,
        serviceType: service.title,
        description: service.summary,
        url: `${siteConfig.url}/services/${service.slug}`,
        provider: { "@id": `${siteConfig.url}/#organization`, name: siteConfig.name, email: siteConfig.email },
        areaServed: [
          { "@type": "City", name: "Sydney" },
          { "@type": "AdministrativeArea", name: "New South Wales" },
          { "@type": "Country", name: "Australia" },
        ],
      },
      breadcrumbSchema(trail),
      {
        "@type": "FAQPage",
        mainEntity: service.faqs.map(({ question, answer }) => ({
          "@type": "Question",
          name: question,
          acceptedAnswer: { "@type": "Answer", text: answer },
        })),
      },
    ],
  };

  return (
    <PageShell>
      <div className="shell">
        <Crumbs trail={trail} />
        <header className="page-hero">
          <div className="page-hero-copy">
            <p className="label">Digital services · Sydney</p>
            <h1>{service.h1}</h1>
            <p className="lead">{service.intro}</p>
            <div className="actions">
              <Link className="button button-primary" href={contactHref}>{service.ctaLabel} <ArrowIcon /></Link>
              <Link className="button button-ghost" href="/work">View our work <ArrowIcon direction="right" /></Link>
            </div>
          </div>
          <Link href={`/work/${featuredProject.slug}`} aria-label={`${featuredProject.name} case study`}>
            <ProjectFrame project={featuredProject} priority sizes="(max-width: 900px) 92vw, 520px" />
          </Link>
        </header>
      </div>

      <section className="section section--tint" aria-labelledby="concept-heading">
        <div className="shell">
          <SectionHead id="concept-heading" label="Planning the work" title={<>{service.title}, in layers.</>}>
            These are the areas we review together. Your proposal sets out the deliverables, responsibilities and costs.
          </SectionHead>
          <ol className="layers" style={{ paddingBottom: "2.5rem" }}>
            {delivery.layers.map((layer, index) => <li key={layer} data-reveal><span aria-hidden="true">0{index + 1}</span>{layer}</li>)}
          </ol>
        </div>
      </section>

      <section className="section service-context" aria-labelledby="service-context-heading">
        <div className="shell split">
          <div className="split-sticky" data-reveal>
            <p className="label">Strategy before output</p>
            <h2 id="service-context-heading">{service.detailTitle}</h2>
          </div>
          <div className="prose" data-reveal>
            <p>{service.detail}</p>
            <h3 id="included-heading" style={{ marginTop: "1.5rem" }}>What we can help with</h3>
            <ul className="ticks" aria-labelledby="included-heading">
              {service.benefits.map((benefit, index) => <li key={benefit}><span>{String(index + 1).padStart(2, "0")}</span>{benefit}</li>)}
            </ul>
            <p><Link className="text-link" href={contactHref}>Discuss your {service.title} project <ArrowIcon /></Link></p>
          </div>
        </div>
      </section>

      <section className="section section--deep" aria-labelledby="work-proof-heading">
        <div className="shell">
          <SectionHead id="work-proof-heading" label="Relevant project experience" title={<>{featuredProject.name}: the work behind the service.</>}>
            {featuredProject.overview}
          </SectionHead>
          <div className="proof-grid">
            <div data-reveal>
              <WorkItem project={featuredProject} sizes="(max-width: 820px) 92vw, 760px" />
              <p className="label label--plain" style={{ marginTop: "0.75rem" }}>{primaryProof.role}</p>
            </div>
            <ul className="proof-side" aria-label="More project experience">
              {supportingProof.map(({ project, role }) => (
                <li key={project.slug} data-reveal>
                  <Link className="work-item" href={`/work/${project.slug}`}>
                    <ProjectFrame project={project} sizes="(max-width: 820px) 92vw, 460px" />
                    <span className="work-meta"><span>{role}</span></span>
                    <h3 style={{ fontSize: "var(--type-h3)" }}>{project.name}</h3>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="section" aria-labelledby="service-process-heading">
        <div className="shell">
          <SectionHead id="service-process-heading" label="A visible process" title="From first conversation to a dependable result." />
          <ProcessRail steps={delivery.steps} />
        </div>
      </section>

      <section className="section section--tint" aria-labelledby="service-faq-heading">
        <div className="shell split">
          <div className="split-sticky" data-reveal>
            <p className="label">Useful details</p>
            <h2 id="service-faq-heading">Frequently asked questions</h2>
          </div>
          <FaqList items={service.faqs} />
        </div>
      </section>

      <section className="section" aria-labelledby="related-services-heading">
        <div className="shell">
          <SectionHead id="related-services-heading" label="Connected capabilities" title="Related services" />
          <div className="related">
            {relatedServices.map((entry) => (
              <Link href={`/services/${entry.slug}`} key={entry.slug}><span>{entry.title}</span><ArrowIcon /></Link>
            ))}
          </div>
        </div>
      </section>

      <CtaBand id="service-cta-heading" label="Ready when you are" title="Let&apos;s turn the next digital decision into useful progress." href={contactHref} cta={service.ctaLabel}>
        Tell us what you are working toward. We will respond with a practical recommendation and a clear next step.
      </CtaBand>
      <JsonLd data={schema} />
    </PageShell>
  );
}
