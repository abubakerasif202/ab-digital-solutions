import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
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

  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      { "@type": "Service", name: service.title, description: service.summary, provider: { "@id": `${siteConfig.url}/#organization` }, areaServed: "Australia" },
      { "@type": "BreadcrumbList", itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: siteConfig.url },
        { "@type": "ListItem", position: 2, name: service.title, item: `${siteConfig.url}/services/${service.slug}` },
      ] },
    ],
  };

  return (
    <main className="content-page">
      <div className="container content-shell">
        <Link className="content-brand" href="/">AB <span>Digital Solutions</span></Link>
        <p className="eyebrow">Digital services / Sydney</p>
        <h1>{service.title}</h1>
        <p className="content-lead">{service.intro}</p>
        <section aria-labelledby="included-heading">
          <h2 id="included-heading">What&apos;s included</h2>
          <ul>{service.benefits.map((benefit) => <li key={benefit}>{benefit}</li>)}</ul>
        </section>
        <div className="content-actions">
          <Link className="button button-primary" href="/#contact">Start your project <span aria-hidden="true">↗</span></Link>
          <Link className="button button-ghost" href="/">Back to home</Link>
        </div>
      </div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, "\\u003c") }} />
    </main>
  );
}
