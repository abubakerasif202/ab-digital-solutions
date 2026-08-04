import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ProjectArtwork } from "../../project-artwork";
import { projects } from "../../project-data";
import { SiteHeader } from "../../site-chrome";
import { SiteFooter } from "../../site-footer";
import { findService, servicePages } from "../service-data";
import { siteConfig } from "../../site-config";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return servicePages.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const service = findService((await params).slug);
  if (!service) return {};
  return {
    title: service.title,
    description: service.summary,
    alternates: { canonical: `/services/${service.slug}` },
    openGraph: { title: `${service.title} | ${siteConfig.name}`, description: service.summary, url: `/services/${service.slug}` },
  };
}

export default async function ServicePage({ params }: Props) {
  const service = findService((await params).slug);
  if (!service) notFound();

  const featuredProject = projects.find((project) => project.name === service.featuredProject) ?? projects[0];
  const relatedServices = servicePages.filter(({ slug }) => slug !== service.slug).slice(0, 3);
  const process = [
    ["01", "Clarify", "We define the audience, commercial goal, constraints and evidence the work needs to communicate."],
    ["02", "Shape", "We turn that context into a clear direction, structure and practical delivery plan."],
    ["03", "Create", "We design, build and refine the work through visible review points and direct collaboration."],
    ["04", "Launch & improve", "We complete quality checks, launch confidently and identify the next useful improvement."],
  ] as const;
  const faqs = [
    {
      question: "What happens before work begins?",
      answer: "We start with a focused conversation about your business, audience, priorities and existing materials. You receive a clear recommended scope before committing to delivery.",
    },
    {
      question: `How is ${service.title.toLowerCase()} priced?`,
      answer: "Pricing is based on the agreed scope, complexity and delivery requirements. We provide a written proposal with inclusions, review points and costs before work starts.",
    },
    {
      question: "Can you work with an existing website or brand?",
      answer: "Yes. We can strengthen an existing foundation or recommend a clean rebuild when that is the more reliable and cost-effective path.",
    },
  ] as const;

  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Service",
        name: service.title,
        description: service.summary,
        provider: { "@id": `${siteConfig.url}/#organization` },
        areaServed: { "@type": "Country", name: "Australia" },
        offers: { "@type": "Offer", priceCurrency: "AUD", availability: "https://schema.org/InStock" },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: siteConfig.url },
          { "@type": "ListItem", position: 2, name: service.title, item: `${siteConfig.url}/services/${service.slug}` },
        ],
      },
    ],
  };

  return (
    <>
      <SiteHeader />
      <main className="content-page service-page" id="main-content">
        <div className="container content-shell">
          <nav className="content-breadcrumb" aria-label="Breadcrumb">
            <Link href="/">Home</Link>
            <span aria-hidden="true">/</span>
            <Link href="/#services">Services</Link>
            <span aria-hidden="true">/</span>
            <span aria-current="page">{service.title}</span>
          </nav>

          <header className="service-hero">
            <p className="eyebrow">Digital services / Sydney</p>
            <h1>{service.title}</h1>
            <p className="content-lead">{service.intro}</p>
            <div className="content-actions">
              <Link className="button button-primary" href="/#contact">Start your project <span aria-hidden="true">↗</span></Link>
              <a className="button button-ghost" href={`tel:${siteConfig.phoneInternational}`}>Call {siteConfig.phoneDisplay}</a>
            </div>
          </header>

          <section className="service-inclusions" aria-labelledby="included-heading">
            <div className="service-section-heading">
              <p className="eyebrow">Built around the goal</p>
              <h2 id="included-heading">What&apos;s included</h2>
            </div>
            <ul>{service.benefits.map((benefit, index) => <li key={benefit}><span>{String(index + 1).padStart(2, "0")}</span>{benefit}</li>)}</ul>
          </section>

          <section className="service-showcase" aria-labelledby="work-proof-heading">
            <div className="service-section-heading">
              <p className="eyebrow">Relevant live work</p>
              <h2 id="work-proof-heading">See the standard in practice.</h2>
              <p>Explore a real client website that reflects the same focus on clarity, credibility and an obvious next step.</p>
            </div>
            <a className="service-project" href={featuredProject.url} target="_blank" rel="noopener noreferrer">
              <div className="service-project-image">
                <ProjectArtwork project={featuredProject} sizes="(max-width: 900px) 94vw, 48vw" />
                <span>Live website ↗</span>
              </div>
              <div>
                <p>{featuredProject.category}</p>
                <h3>{featuredProject.name}</h3>
                <span>{featuredProject.description}</span>
              </div>
            </a>
          </section>

          <section className="service-process" aria-labelledby="service-process-heading">
            <div className="service-section-heading">
              <p className="eyebrow">A visible process</p>
              <h2 id="service-process-heading">From first conversation to a dependable result.</h2>
            </div>
            <ol>
              {process.map(([number, title, description]) => (
                <li key={number}>
                  <span>{number}</span>
                  <div><h3>{title}</h3><p>{description}</p></div>
                </li>
              ))}
            </ol>
          </section>

          <section className="service-faq" aria-labelledby="service-faq-heading">
            <div className="service-section-heading">
              <p className="eyebrow">Useful details</p>
              <h2 id="service-faq-heading">Frequently asked questions</h2>
            </div>
            <div>
              {faqs.map(({ question, answer }) => (
                <details key={question}>
                  <summary>{question}<span aria-hidden="true">+</span></summary>
                  <p>{answer}</p>
                </details>
              ))}
            </div>
          </section>

          <section className="related-services" aria-labelledby="related-services-heading">
            <div className="service-section-heading">
              <p className="eyebrow">Connected capabilities</p>
              <h2 id="related-services-heading">Related services</h2>
            </div>
            <div>
              {relatedServices.map((related) => (
                <Link href={`/services/${related.slug}`} key={related.slug}>
                  <span>{related.title}</span><span aria-hidden="true">↗</span>
                </Link>
              ))}
            </div>
          </section>

          <section className="service-cta" aria-labelledby="service-cta-heading">
            <p className="eyebrow">Ready when you are</p>
            <h2 id="service-cta-heading">Let&apos;s turn the next digital decision into useful progress.</h2>
            <p>Tell us what you are working toward. We will respond with a practical recommendation and a clear next step.</p>
            <Link className="button button-primary" href="/#contact">Start a conversation <span aria-hidden="true">↗</span></Link>
          </section>
        </div>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, "\\u003c") }} />
      </main>
      <SiteFooter currentYear={new Date().getUTCFullYear()} />
    </>
  );
}
