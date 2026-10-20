import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "../site-chrome";
import { SiteFooter } from "../site-footer";
import { siteConfig } from "../site-config";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: `How ${siteConfig.name} handles website enquiries and personal information.`,
  alternates: { canonical: "/privacy" },
  openGraph: {
    title: `Privacy Policy | ${siteConfig.name}`,
    description: `How ${siteConfig.name} handles enquiries and website information.`,
    url: "/privacy",
    siteName: siteConfig.name,
    type: "website",
    locale: "en_AU",
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: siteConfig.name }],
  },
  twitter: {
    card: "summary_large_image",
    title: `Privacy Policy | ${siteConfig.name}`,
    description: `How ${siteConfig.name} handles enquiries and website information.`,
    images: ["/opengraph-image"],
  },
};

const sections = [
  ["use", "How we use information"],
  ["providers", "Service providers and retention"],
  ["measurement", "Website measurement"],
  ["choices", "Your choices"],
  ["privacy-contact", "Contact"],
] as const;

export default function PrivacyPage() {
  return (
    <>
      <SiteHeader />
      <main className="content-page legal-page" id="main-content">
        <div className="container content-shell">
          <p className="eyebrow">Privacy / Australia</p>
          <h1>Privacy policy</h1>
          <p className="content-lead">This policy explains how AB Web Studio handles enquiry details and technical information collected when you use this website.</p>
          <div className="legal-layout">
          <nav className="legal-toc" aria-labelledby="legal-toc-heading">
            <h2 id="legal-toc-heading">On this page</h2>
            <ol>
              {sections.map(([id, title]) => <li key={id}><a href={`#${id}`}>{title}</a></li>)}
            </ol>
          </nav>
          <div className="legal-body">
          <section id="use"><h2>How we use information</h2><p>When you contact us, we receive the name, contact details and project information you provide. We use these details to respond, prepare recommendations or quotes, deliver requested services and maintain necessary business records. We do not sell personal information or add enquiries to unrelated mailing lists.</p></section>
          <section id="providers"><h2>Service providers and retention</h2><p>Vercel hosts this website and Resend provides enquiry email delivery. When configured, Upstash supports abuse prevention and ClickHouse stores website measurement. These providers may process technical or enquiry information on our behalf. We retain enquiry records for as long as reasonably necessary to respond, deliver services and meet business record obligations.</p></section>
          <section id="measurement"><h2>Website measurement</h2><p>When configured, our first-party measurement records pages visited, contact and portfolio interactions, successful enquiry submissions, browser information and page performance. It does not use tracking cookies or send form contents to analytics, and respects browser Do Not Track and Global Privacy Control signals. The analytics storage configuration sets a 180-day retention period. Vercel Speed Insights also measures page performance when enabled by the hosting platform. Hosting and abuse-prevention services may process request information, including IP addresses, to deliver and protect the website.</p></section>
          <section id="choices"><h2>Your choices</h2><p>You may ask to access, correct or delete personal information we hold, subject to applicable Australian law. Do not include sensitive information in the website enquiry form.</p></section>
          <section id="privacy-contact"><h2>Contact</h2><p>For a privacy question, email <a href={`mailto:${siteConfig.email}`}>{siteConfig.email}</a> or call <a href={`tel:${siteConfig.phoneInternational}`}>{siteConfig.phoneDisplay}</a>.</p></section>
          <Link className="button button-ghost" href="/">Back to home</Link>
          </div>
          </div>
        </div>
      </main>
      <SiteFooter currentYear={new Date().getUTCFullYear()} />
    </>
  );
}
