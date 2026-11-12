import type { Metadata } from "next";
import Link from "next/link";
import type { CSSProperties } from "react";
import { Crumbs } from "../../components/inspector/Crumbs";
import { PageTransition } from "../../components/motion/PageTransition";
import { notFound } from "next/navigation";
import { ProjectArtwork } from "../../project-artwork";
import { findProject, projectDisplayDomain } from "../../project-data";
import { SiteHeader } from "../../site-chrome";
import { SiteFooter } from "../../site-footer";
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
  const relatedMap: Record<string, string[]> = {
    "web-design-sydney": ["branding-content", "seo-local-visibility", "website-maintenance"],
    "ecommerce-website-development": ["digital-marketing", "web-design-sydney", "website-maintenance"],
    "seo-local-visibility": ["web-design-sydney", "digital-marketing", "ecommerce-website-development"],
    "branding-content": ["web-design-sydney", "digital-marketing", "seo-local-visibility"],
    "digital-marketing": ["seo-local-visibility", "ecommerce-website-development", "branding-content"],
    "website-maintenance": ["web-design-sydney", "ecommerce-website-development", "seo-local-visibility"],
    "custom-software-business-systems": ["web-design-sydney", "ecommerce-website-development", "website-maintenance"],
  };

  const relatedSlugs = relatedMap[service.slug] ?? [];
  const relatedServices = relatedSlugs
    .map((slug) => findService(slug))
    .filter((s): s is (typeof servicePages)[number] => Boolean(s));
  const delivery = serviceDelivery[service.slug];
  const process = delivery.steps.map(([title, copy], index) => [String(index + 1).padStart(2, "0"), title, copy]);
  const faqs = service.faqs;

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
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: siteConfig.url },
          { "@type": "ListItem", position: 2, name: "Services", item: `${siteConfig.url}/services` },
          { "@type": "ListItem", position: 3, name: service.title, item: `${siteConfig.url}/services/${service.slug}` },
        ],
      },
      {
        "@type": "FAQPage",
        mainEntity: faqs.map(({ question, answer }) => ({
          "@type": "Question",
          name: question,
          acceptedAnswer: { "@type": "Answer", text: answer },
        })),
      },
    ],
  };

  return (
    <>
      <SiteHeader />
      <PageTransition>
      <main className="ip ip-service inspector-home" id="main-content">
        <header className="ip-hero">
          <div className="ip-wrap ip-hero-grid">
            <div className="ip-hero-copy">
              <Crumbs items={[{ label: "Home", href: "/" }, { label: "Services", href: "/services" }, { label: service.title }]} />
              <p className="ix-label">Digital services / Sydney</p>
              <h1 className="ip-title">{service.h1}</h1>
              <p className="ip-lede">{service.intro}</p>
              <div className="ip-actions">
                <Link className="ix-btn ix-btn--solid" href={contactHref}>{service.ctaLabel} <ArrowIcon /></Link>
                <Link className="ix-btn ix-btn--ghost" href="/work">View Our Work</Link>
              </div>
            </div>
            {/* Decorative detail crop; the same project is linked in full below. */}
            <figure className="ip-hero-visual" aria-hidden="true">
              <div className="ip-plate">
                <ProjectArtwork project={featuredProject} priority sizes="(max-width: 900px) 92vw, 440px" />
              </div>
              <figcaption>
                <span>Studio project</span>
                {featuredProject.name}
              </figcaption>
            </figure>
          </div>
        </header>

        <section className="ip-sec ip-sec--tight" aria-labelledby="concept-heading">
          <div className="ip-wrap ip-split">
            <div className="ip-side">
              <p className="ix-label">Planning the work</p>
              <h2 id="concept-heading" className="ip-h2">{service.title}, in <em>layers.</em></h2>
              <p className="ip-side-note">These are the areas we review together. Your proposal sets out the deliverables, responsibilities and costs.</p>
            </div>
            <ol className="ip-layers">
              {delivery.layers.map((layer, index) => (
                <li key={layer} style={{ "--i": index } as CSSProperties}>
                  <span className="ip-layer-no" aria-hidden="true">0{index + 1}</span>
                  <span className="ip-layer-text">{layer}</span>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="ip-sec ip-sec--tight ip-sec--line" aria-labelledby="included-heading">
          <div className="ip-wrap ip-split">
            <div className="ip-side">
              <p className="ix-label">Built around the goal</p>
              <h2 id="included-heading" className="ip-h2">What we can help with</h2>
            </div>
            <ul className="ip-rows">
              {service.benefits.map((benefit, index) => (
                <li key={benefit}><span className="ip-row-n">{String(index + 1).padStart(2, "0")}</span><span className="ip-row-t">{benefit}</span></li>
              ))}
            </ul>
          </div>
        </section>

        <section className="ip-paper" aria-labelledby="service-context-heading">
          <div className="ip-wrap ip-split">
            <div className="ip-side">
              <p className="ix-label">Strategy before output</p>
            </div>
            <div className="ip-paper-body">
              <h2 id="service-context-heading" className="ip-h2">{service.detailTitle}</h2>
              <p>{service.detail}</p>
              <Link className="ix-btn sx-btn-ink" href={contactHref}>Discuss your {service.title} project <ArrowIcon /></Link>
            </div>
          </div>
        </section>

        <section className="ip-sec" aria-labelledby="work-proof-heading">
          <div className="ip-wrap">
            <div className="ip-head">
              <p className="ix-label">Relevant project experience</p>
              <h2 id="work-proof-heading" className="ip-h2">{featuredProject.name}: the work behind the service.</h2>
              <p className="ip-head-note">{featuredProject.overview}</p>
            </div>
            <Link className="ip-feature" href={`/work/${featuredProject.slug}`}>
              <span className="ip-feature-img">
                <ProjectArtwork project={featuredProject} sizes="(max-width: 900px) 92vw, (max-width: 1440px) 52vw, 700px" />
                <span className="ip-feature-go">View Case Study <ArrowIcon direction="right" /></span>
              </span>
              <span className="ip-feature-copy">
                <span className="ip-kicker">{primaryProof.role}</span>
                <strong>{featuredProject.name}</strong>
                <span>{featuredProject.description}</span>
              </span>
            </Link>
            <ul className="ip-support" aria-label="More project experience">
              {supportingProof.map(({ project, role }, index) => (
                <li key={project.slug} style={{ "--i": index } as CSSProperties}>
                  <Link href={`/work/${project.slug}`}>
                    <span className="ip-support-img">
                      <ProjectArtwork project={project} sizes="(max-width: 900px) 92vw, 380px" />
                    </span>
                    <span className="ip-support-copy">
                      <small>{role}</small>
                      <strong>{project.name}</strong>
                      <span>{projectDisplayDomain(project)} <ArrowIcon direction="right" /></span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="ip-sec ip-sec--line" aria-labelledby="service-process-heading">
          <div className="ip-wrap ip-split">
            <div className="ip-side">
              <p className="ix-label">A visible process</p>
              <h2 id="service-process-heading" className="ip-h2">From first conversation to a dependable <em>result.</em></h2>
            </div>
            <ol className="ip-steps">
              {process.map(([number, title, description]) => (
                <li key={number}>
                  <span className="ip-step-no" aria-hidden="true">{number}</span>
                  <div><h3>{title}</h3><p>{description}</p></div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="ip-sec ip-sec--tight" aria-labelledby="service-faq-heading">
          <div className="ip-wrap ip-split">
            <div className="ip-side">
              <p className="ix-label">Useful details</p>
              <h2 id="service-faq-heading" className="ip-h2">Frequently asked questions</h2>
            </div>
            <div className="ip-faq">
              {faqs.map(({ question, answer }) => (
                <details key={question}>
                  <summary>{question}<span aria-hidden="true">+</span></summary>
                  <p>{answer}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section className="ip-sec ip-sec--tight ip-sec--line" aria-labelledby="related-services-heading">
          <div className="ip-wrap ip-split">
            <div className="ip-side">
              <p className="ix-label">Connected capabilities</p>
              <h2 id="related-services-heading" className="ip-h2">Related services</h2>
            </div>
            <ul className="ip-related">
              {relatedServices.map((related, index) => (
                <li key={related.slug} style={{ "--i": index } as CSSProperties}>
                  <Link href={`/services/${related.slug}`}>
                    <span>{related.title}</span><ArrowIcon />
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="ip-cta" aria-labelledby="service-cta-heading">
          <div className="ip-wrap ip-cta-grid">
            <div>
              <p className="ix-label">Ready when you are</p>
              <h2 id="service-cta-heading" className="ip-h2">Let&apos;s turn the next digital decision into useful <em>progress.</em></h2>
            </div>
            <div className="ip-cta-side">
              <p>Tell us what you are working toward. We will respond with a practical recommendation and a clear next step.</p>
              <div className="ip-actions">
                <Link className="ix-btn ix-btn--solid" href={contactHref}>{service.ctaLabel} <ArrowIcon /></Link>
                <Link className="ix-btn ix-btn--ghost" href="/work">View Our Work</Link>
              </div>
            </div>
          </div>
        </section>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, "\\u003c") }} />
      </main>
      </PageTransition>
      <SiteFooter currentYear={new Date().getUTCFullYear()} />
    </>
  );
}
