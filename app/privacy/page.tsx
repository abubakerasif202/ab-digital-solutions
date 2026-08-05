import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "../site-chrome";
import { SiteFooter } from "../site-footer";
import { siteConfig } from "../site-config";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: `How ${siteConfig.name} handles website enquiries and personal information.`,
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  return (
    <>
      <SiteHeader />
      <main className="content-page legal-page" id="main-content">
        <div className="container content-shell">
          <p className="eyebrow">Privacy / Australia</p>
          <h1>Privacy policy</h1>
          <p className="content-lead">We collect only the information you choose to provide when you contact us, such as your name, contact details and project information.</p>
          <section><h2>How we use information</h2><p>We use enquiry information to respond, prepare recommendations or quotes, deliver requested services and maintain necessary business records. We do not sell personal information or add enquiries to unrelated mailing lists.</p></section>
          <section><h2>Service providers and retention</h2><p>Our website and email delivery providers may process information on our behalf. We retain records only for as long as reasonably necessary for the purpose collected, legal obligations and legitimate business administration.</p></section>
          <section><h2>Your choices</h2><p>You may ask to access, correct or delete personal information we hold, subject to applicable Australian law. Do not include sensitive information in the website enquiry form.</p></section>
          <section><h2>Contact</h2><p>For a privacy question, email <a href={`mailto:${siteConfig.email}`}>{siteConfig.email}</a> or call <a href={`tel:${siteConfig.phoneInternational}`}>{siteConfig.phoneDisplay}</a>.</p></section>
          <Link className="button button-ghost" href="/">Back to home</Link>
        </div>
      </main>
      <SiteFooter currentYear={new Date().getUTCFullYear()} />
    </>
  );
}
