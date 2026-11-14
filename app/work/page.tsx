import type { Metadata } from "next";
import { WorkIndex } from "../components/WorkIndex";
import { breadcrumbSchema, Crumbs, CtaBand, JsonLd, PageShell, WorkItem } from "../components/ui";
import { projects, sectors } from "../project-data";
import { siteConfig } from "../site-config";

const description = "Explore websites and custom business systems built for Australian grocery, mobility, logistics, construction and local service businesses.";
const socialDescription = "Explore selected websites and custom software engineered by AB Web Studio for Australian businesses.";

export const metadata: Metadata = {
  title: "Our Work & Case Studies",
  description,
  alternates: { canonical: "/work" },
  openGraph: {
    title: `Our Work & Case Studies | ${siteConfig.name}`,
    description: socialDescription,
    url: "/work",
    siteName: siteConfig.name,
    type: "website",
    locale: "en_AU",
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "AB Web Studio client portfolio and case studies" }],
  },
  twitter: { card: "summary_large_image", title: `Our Work & Case Studies | ${siteConfig.name}`, description: socialDescription, images: ["/opengraph-image"] },
};

const trail = [["Work", "/work"]] as const;
const schema = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "CollectionPage",
      name: "Our Work & Case Studies",
      description: "Selected websites, hosted showcases and business software by AB Web Studio.",
      url: `${siteConfig.url}/work`,
      publisher: { "@id": `${siteConfig.url}/#organization` },
    },
    breadcrumbSchema(trail),
  ],
};

export default function WorkPage() {
  const items = projects.map((project, index) => ({
    slug: project.slug,
    sector: project.sector,
    card: <WorkItem project={project} sizes="(max-width: 820px) 92vw, 720px" priority={index < 2} />,
  }));

  return (
    <PageShell>
      <div className="shell">
        <Crumbs trail={trail} />
        <header className="page-hero page-hero--solo">
          <div className="page-hero-copy">
            <p className="label">Work · {projects.length} projects</p>
            <h1>Websites and systems in daily use.</h1>
            <p className="lead">
              Public websites, hosted showcases and business software across {sectors.length} industries. Each case study states what the project is and where you can see it.
            </p>
          </div>
        </header>
        <section aria-label="Projects" style={{ paddingBottom: "var(--section)" }}>
          <WorkIndex items={items} sectors={sectors} />
        </section>
      </div>
      <CtaBand id="work-cta-heading" label="Your project next" title="Have something similar in mind, or something we have not built yet?" />
      <JsonLd data={schema} />
    </PageShell>
  );
}
