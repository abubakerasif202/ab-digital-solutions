import type { Metadata } from "next";
import { ContactForm } from "../components/ContactForm";
import { breadcrumbSchema, Crumbs, EnquiryAside, JsonLd, PageShell, ProcessRail } from "../components/ui";
import { siteConfig } from "../site-config";

const description =
  "Start a project with AB Web Studio. Tell us what you are building and where you want the business to go — we will come back with a practical next step.";

export const metadata: Metadata = {
  title: "Start a Project",
  description,
  alternates: { canonical: "/contact" },
  openGraph: {
    title: `Start a Project | ${siteConfig.name}`,
    description,
    url: "/contact",
    siteName: siteConfig.name,
    type: "website",
    locale: "en_AU",
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: `Start a project with ${siteConfig.name}` }],
  },
  twitter: { card: "summary_large_image", title: `Start a Project | ${siteConfig.name}`, description, images: ["/opengraph-image"] },
};

const trail = [["Contact", "/contact"]] as const;

const schema = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "ContactPage",
      name: "Start a Project",
      description,
      url: `${siteConfig.url}/contact`,
      about: { "@id": `${siteConfig.url}/#organization` },
    },
    breadcrumbSchema(trail),
  ],
};

const nextSteps = [
  ["Tell us what you are building", "Share the business, the goal and anything you already have — a site, a brief or just an idea."],
  ["We come back with a next step", "A practical recommendation for where to start, based on what you told us."],
  ["Discover, design, build, launch", "A clear path from ambition to launch, with visible progress and clear review points."],
] as const;

export default function ContactPage() {
  return (
    <PageShell>
      <div className="shell">
        <Crumbs trail={trail} />
        <section className="enquiry" id="contact" aria-labelledby="contact-heading" style={{ paddingBlock: "clamp(1.5rem, 4vw, 3rem) var(--section)" }}>
          <EnquiryAside headingAs="h1" id="contact-heading" />
          <ContactForm titleAs="h2" />
        </section>
      </div>

      <section className="section section--deep" aria-labelledby="next-steps-heading">
        <div className="shell">
          <p className="label">What happens next</p>
          <h2 id="next-steps-heading" style={{ margin: "1rem 0 clamp(2rem, 5vw, 3.5rem)" }}>Three steps, no surprises.</h2>
          <ProcessRail steps={nextSteps} />
        </div>
      </section>
      <JsonLd data={schema} />
    </PageShell>
  );
}
