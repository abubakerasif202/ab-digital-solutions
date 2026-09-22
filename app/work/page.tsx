import type { Metadata } from "next";
import Link from "next/link";
import { WorkIndexBody } from "../components/WorkIndexBody";
import { SiteHeader } from "../site-chrome";
import { SiteFooter } from "../site-footer";
import { siteConfig } from "../site-config";
import { ArrowIcon } from "../icons";

export const metadata: Metadata = {
  title: "Our Work & Case Studies",
  description:
    "Explore our portfolio of strategy-led, high-converting websites built for Australian mobility, logistics, construction and local service businesses.",
  alternates: { canonical: "/work" },
  openGraph: {
    title: `Our Work & Case Studies | ${siteConfig.name}`,
    description:
      "Explore selected websites and custom software engineered by AB Web Studio for Australian businesses.",
    url: "/work",
    siteName: siteConfig.name,
    type: "website",
    locale: "en_AU",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "AB Web Studio client portfolio and case studies",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `Our Work & Case Studies | ${siteConfig.name}`,
    description:
      "Explore selected websites and custom software engineered by AB Web Studio for Australian businesses.",
    images: ["/opengraph-image"],
  },
};

const schema = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "CollectionPage",
      name: "Our Work & Case Studies",
      description:
        "Selected client websites designed and developed by AB Web Studio.",
      url: `${siteConfig.url}/work`,
      publisher: { "@id": `${siteConfig.url}/#organization` },
    },
    {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: siteConfig.url },
        { "@type": "ListItem", position: 2, name: "Work", item: `${siteConfig.url}/work` },
      ],
    },
  ],
};

export default function WorkPage() {
  const currentYear = new Date().getUTCFullYear();

  return (
    <>
      <SiteHeader />
      <main className="work-index-page" id="main-content">
        <WorkIndexBody />

        <div className="work-index-transition" aria-hidden="true" />

        <section className="work-index-final-cta">
          <div className="container work-index-final-cta-layout" data-reveal>
            <div>
              <p className="eyebrow">Next</p>
              <h2>Your project could be the next one on this list.</h2>
            </div>
            <div>
              <p className="content-lead">
                Tell us what you are building and where you want the business to go. We will come
                back with a practical next step.
              </p>
              <div className="content-actions">
                <Link className="button button-primary" href="/#contact">
                  Start a Project <ArrowIcon />
                </Link>
                <a className="button button-ghost" href={`tel:${siteConfig.phoneInternational}`}>
                  Call {siteConfig.phoneDisplay}
                </a>
              </div>
            </div>
          </div>
        </section>

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, "\\u003c") }}
        />
      </main>
      <SiteFooter currentYear={currentYear} />
    </>
  );
}
