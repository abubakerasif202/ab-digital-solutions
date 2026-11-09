import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ContactForm } from "../../components/ContactForm";
import { Hero3DExperience } from "../../components/Hero3DExperience";
import { EnquirySection } from "../../components/studio/EnquirySection";
import { VirtualStudioPreview } from "../../components/studio/VirtualStudioPreview";
import { contactServiceKeys } from "../../contact-options";
import { ArrowIcon } from "../../icons";
import { ProjectArtwork, projectArtworkRatio } from "../../project-artwork";
import { formatCategory, projectDestinationLabel, projects, sectors } from "../../project-data";
import { findService } from "../../services/service-data";
import { SiteFooter } from "../../site-footer";
import { SiteHeader } from "../../site-chrome";
import linkCheck from "../../../opendesign/luxury-homepage/link-check.json";
import { CssMonogram } from "./_components/CssMonogram";
import { HarbourSkyline } from "./_components/HarbourSkyline";
import { PreviewDisciplines, type Discipline } from "./_components/PreviewDisciplines";
import { PreviewWork } from "./_components/PreviewWork";
import "./preview.css";

/**
 * Design-review preview of the OpenDesign "Gilt & Ruby" homepage. It is never
 * indexable (metadata, X-Robots-Tag header in next.config.ts, absent from the
 * sitemap) and is not served on Vercel production. The live homepage is untouched.
 */
export const metadata: Metadata = {
  title: "OpenDesign homepage preview",
  description: "Design-review preview. Not part of the public site.",
  alternates: { canonical: "/preview/opendesign" },
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: { index: false, follow: false, noimageindex: true, "max-snippet": 0 },
  },
};

// Same rule as scripts/export-homepage-data.mjs: only claim "Live website" when the dated
// read-only link check reached the site or the owner confirmed it (recorded in link-check.json).
const liveUrls = new Set(
  linkCheck.results
    .filter((entry) => entry.status === 200 || ("ownerConfirmedLive" in entry && entry.ownerConfirmedLive === true))
    .map((entry) => entry.url),
);
const statusLabel = (project: (typeof projects)[number]) => {
  const label = projectDestinationLabel(project);
  return label === "Live website" && !liveUrls.has(project.url) ? "Case study" : label;
};

const disciplineSources = [
  {
    id: "design", number: "01", title: "Website design", serviceSlug: "web-design-sydney", serviceKey: "web-design",
    summary: "Art-directed interfaces with a clear point of view.",
    points: ["Brand-led layouts, not templates", "Typography and motion systems", "Conversion paths mapped before pixels"],
  },
  {
    id: "development", number: "02", title: "Development", serviceSlug: "custom-software-business-systems", serviceKey: "custom-software",
    summary: "Fast, responsive builds that stay easy to use and edit.",
    points: ["Next.js and React websites and online stores", "Custom business systems for stock, quotes and invoices", "Responsive, keyboard-friendly interfaces with reduced-motion support"],
  },
  {
    id: "seo", number: "03", title: "SEO & marketing", serviceSlug: "seo-local-visibility", serviceKey: "seo",
    summary: "Be found by the people already looking for you.",
    points: ["Technical SEO and search-ready page structure", "Local-search content for service businesses", "Landing pages with a clear enquiry path"],
  },
] as const;

// Fail the build loudly if a discipline drifts from a canonical service page.
const disciplines: Discipline[] = disciplineSources.map(({ serviceSlug, serviceKey, ...rest }) => {
  if (!findService(serviceSlug)) throw new Error(`opendesign preview: unknown service slug "${serviceSlug}"`);
  return { ...rest, serviceLabel: contactServiceKeys[serviceKey], serviceHref: `/services/${serviceSlug}` };
});

const processSteps = [
  ["01", "Discover", "Goals, audience and what a good enquiry looks like for you."],
  ["02", "Design", "Direction, key pages and motion, reviewed with you early."],
  ["03", "Build", "Responsive development with real content."],
  ["04", "Launch", "Search-ready structure, redirects checked and a clear handover."],
] as const;

export default async function OpenDesignPreview({ searchParams }: { searchParams: Promise<{ fallback?: string }> }) {
  // Never serve the preview on production, even if a link to it leaks.
  if (process.env.VERCEL_ENV === "production") notFound();
  const { fallback } = await searchParams;
  const heroFallback = fallback === "css" ? <CssMonogram /> : undefined;
  const sectorCounts = sectors.map((name) => ({ name, count: projects.filter((project) => project.sector === name).length }));

  return (
    <div className="odp">
      <SiteHeader />
      <main id="main-content" className="odp-main" data-hero-fallback={fallback === "css" ? "css" : "image"}>
        <section className="odp-hero odp-wrap" aria-labelledby="odp-hero-title">
          <div className="odp-hero-copy">
            <p className="odp-mono-label odp-eyebrow">Sydney · Websites · Online stores · Business systems</p>
            <h1 id="odp-hero-title" className="odp-display">
              Websites that look expensive and <em>earn their keep.</em>
            </h1>
            <p className="odp-lede">We design and build bespoke digital experiences for businesses that want to be remembered, and contacted.</p>
            <div className="odp-actions">
              <a className="odp-btn odp-btn--primary" href="#contact">Start an enquiry <ArrowIcon /></a>
              <a className="odp-btn odp-btn--ghost" href="#work">View selected work</a>
            </div>
          </div>
          <div className="odp-hero-art">
            <Hero3DExperience fallback={heroFallback} />
          </div>
        </section>

        <HarbourSkyline />

        <section className="odp-section" id="services" aria-labelledby="odp-services-title">
          <div className="odp-wrap">
            <header className="odp-head">
              <p className="odp-mono-label odp-eyebrow">01 — Services</p>
              <h2 id="odp-services-title" className="odp-display odp-h2">Three disciplines, one accountable studio.</h2>
            </header>
            <PreviewDisciplines items={disciplines} />
            <p className="odp-section-link"><Link className="odp-text-link" href="/services">Explore every service</Link></p>
          </div>
        </section>

        <section className="odp-section odp-section--work" id="work" aria-labelledby="odp-work-title">
          <div className="odp-wrap">
            <header className="odp-head">
              <p className="odp-mono-label odp-eyebrow">02 — Selected work</p>
              <h2 id="odp-work-title" className="odp-display odp-h2">{projects.length} project case studies.</h2>
              <p className="odp-muted">Each one states whether it is a live client website, a hosted showcase or a staff-access system.</p>
            </header>
            <PreviewWork sectors={sectorCounts} total={projects.length}>
              <ul className="odp-projects">
                {projects.map((project, index) => (
                  <li key={project.slug} className="odp-project" data-sector={project.sector} data-extra={index >= 6 ? "" : undefined}>
                    <Link className="odp-project-link" href={`/work/${project.slug}`}>
                      <span className="odp-thumb" style={{ aspectRatio: projectArtworkRatio(project) }}>
                        <ProjectArtwork project={project} sizes="(max-width: 599px) 92vw, (max-width: 1099px) 46vw, 31vw" priority={index < 2} />
                      </span>
                      <span className="odp-project-meta">
                        <span className="odp-mono-label odp-project-sector">{formatCategory(project.category)}</span>
                        <span className="odp-project-name">{project.name}</span>
                        <span className="odp-project-sum">{project.description}</span>
                        <span className="odp-mono-label odp-project-status">{statusLabel(project)}</span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </PreviewWork>
          </div>
        </section>

        {/* The existing static 3D-studio entry (poster + link to /studio), reused unchanged. */}
        <VirtualStudioPreview />

        <section className="odp-section" id="process" aria-labelledby="odp-process-title">
          <div className="odp-wrap">
            <header className="odp-head">
              <p className="odp-mono-label odp-eyebrow">03 — Process</p>
              <h2 id="odp-process-title" className="odp-display odp-h2">From first call to launch, in four moves.</h2>
            </header>
            <ol className="odp-steps">
              {processSteps.map(([number, title, text]) => (
                <li key={number} className="odp-step">
                  <span className="odp-mono-label odp-step-index">{number}</span>
                  <h3>{title}</h3>
                  <p>{text}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <EnquirySection id="contact" index="04">
          <ContactForm />
        </EnquirySection>
      </main>
      <SiteFooter currentYear={new Date().getUTCFullYear()} />
    </div>
  );
}
