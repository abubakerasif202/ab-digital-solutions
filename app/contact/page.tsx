import type { Metadata } from "next";
import Link from "next/link";
import { Mail, MessageCircle, Phone } from "lucide-react";
import { ContactForm } from "../components/ContactForm";
import { ArrowIcon, Glyph } from "../icons";
import { SiteHeader } from "../site-chrome";
import { SiteFooter } from "../site-footer";
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
    {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: siteConfig.url },
        { "@type": "ListItem", position: 2, name: "Contact", item: `${siteConfig.url}/contact` },
      ],
    },
  ],
};

const nextSteps = [
  ["01", "Tell us what you are building", "Share the business, the goal and anything you already have — a site, a brief or just an idea."],
  ["02", "We come back with a next step", "A practical recommendation for where to start, based on what you told us."],
  ["03", "Discover, design, build, launch", "A clear path from ambition to launch, with visible progress and clear review points."],
] as const;

export default function ContactPage() {
  const whatsapp = `https://wa.me/${siteConfig.phoneInternational.replace("+", "")}`;
  return (
    <>
      <SiteHeader />
      <main className="content-page gr-contact" id="main-content">
        <section className="container gr-contact-layout contact-section" id="contact" aria-labelledby="contact-heading">
          <div className="gr-contact-copy">
            <nav className="content-breadcrumb" aria-label="Breadcrumb">
              <Link href="/">Home</Link>
              <span aria-hidden="true">/</span>
              <span aria-current="page">Contact</span>
            </nav>
            <p className="eyebrow">Start a conversation</p>
            <h1 id="contact-heading">A useful conversation. <span className="accent-serif">A clear next step.</span></h1>
            <p className="content-lead">Tell us what you are building and where you want the business to go. We will come back with a practical next step.</p>

            <ul className="gr-contact-direct" aria-label="Contact directly">
              <li>
                <a href={`tel:${siteConfig.phoneInternational}`}><span><Glyph icon={Phone} />Call</span><strong>{siteConfig.phoneDisplay}</strong><ArrowIcon /></a>
              </li>
              <li>
                <a href={`mailto:${siteConfig.email}`}><span><Glyph icon={Mail} />Email</span><strong>{siteConfig.email}</strong><ArrowIcon /></a>
              </li>
              <li>
                <a href={whatsapp} target="_blank" rel="noopener noreferrer"><span><Glyph icon={MessageCircle} />WhatsApp</span><strong>Message directly</strong><ArrowIcon /><span className="sr-only"> (opens in a new tab)</span></a>
              </li>
            </ul>
            <p className="gr-contact-location">{siteConfig.location} · Working Australia-wide</p>
          </div>

          <div className="gr-contact-form">
            <ContactForm />
          </div>
        </section>

        <section className="gr-contact-next" aria-labelledby="next-steps-heading">
          <div className="container">
            <h2 id="next-steps-heading" className="eyebrow">What happens next</h2>
            <ol className="gr-contact-steps">
              {nextSteps.map(([number, title, copy]) => (
                <li key={number}>
                  <span className="gr-number" aria-hidden="true">{number}</span>
                  <h3>{title}</h3>
                  <p>{copy}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, "\\u003c") }} />
      </main>
      <SiteFooter currentYear={new Date().getUTCFullYear()} />
    </>
  );
}
