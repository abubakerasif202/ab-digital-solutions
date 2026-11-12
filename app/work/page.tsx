import type { Metadata } from "next";
import Link from "next/link";
import { PageTransition } from "../components/motion/PageTransition";
import { WorkIndexBody } from "../components/WorkIndexBody";
import { SiteHeader } from "../site-chrome";
import { SiteFooter } from "../site-footer";
import { siteConfig } from "../site-config";
import { ArrowIcon } from "../icons";

export const metadata: Metadata = {
  title: "Our Work & Case Studies",
  description:
    "Explore websites and custom business systems built for Australian grocery, mobility, logistics, construction and local service businesses.",
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
        "Selected websites, hosted showcases and business software by AB Web Studio.",
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
      <PageTransition>
      <main className="ip ip-work inspector-home" id="main-content">
        <WorkIndexBody />

        <aside className="ip-cta" aria-labelledby="work-cta-heading">
          <div className="ip-wrap ip-cta-grid">
            <div>
              <p className="ix-label">Next</p>
              <h2 id="work-cta-heading" className="ip-h2">Your project could be the next one on <em>this list.</em></h2>
            </div>
            <div className="ip-cta-side">
              <p>
                Tell us what you are building and where you want the business to go. We will come
                back with a practical next step.
              </p>
              <div className="ip-actions">
                <Link className="ix-btn ix-btn--solid" href="/contact">
                  Get a Website Quote <ArrowIcon />
                </Link>
                <a className="ix-btn ix-btn--ghost" href={`tel:${siteConfig.phoneInternational}`}>
                  Call {siteConfig.phoneDisplay}
                </a>
              </div>
            </div>
          </div>
        </aside>

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, "\\u003c") }}
        />
      </main>
      </PageTransition>
      <SiteFooter currentYear={currentYear} />
    </>
  );
}
