import type { Metadata } from "next";
import Link from "next/link";
import { assetBase } from "./site-config";
import { ArrowIcon } from "./icons";

// Without this the 404 inherits the homepage title, so the tab and any shared link claim to be the home page.
export const metadata: Metadata = {
  title: "Page not found",
  description: "This page could not be found. Head back to AB Web Studio's home page, case studies or services.",
  robots: { index: false, follow: true },
};

export default function NotFound() {
  return (
    <main className="ip-nf" id="main-content">
      <div className="ip-nf-grid" aria-hidden="true" />
      <span className="ip-nf-numeral" aria-hidden="true">404</span>
      <div className="ip-nf-content">
        {/* eslint-disable-next-line @next/next/no-img-element -- next/image blocks SVG optimization by default; this is a trusted, self-authored decorative asset */}
        <img
          src={`${assetBase}/ab-web-studio-lockup.svg`}
          alt="AB Web Studio"
          width={1020}
          height={500}
          loading="lazy"
        />
        <p className="ix-label">404 / Page not found</p>
        <h1>This page has moved off the <em>map.</em></h1>
        <p className="ip-nf-lede">The address may be outdated, but the studio is right where you left it.</p>
        <div className="ip-actions">
          <Link className="ix-btn ix-btn--solid" href="/">Return home <ArrowIcon /></Link>
          <Link className="ix-btn ix-btn--ghost" href="/contact">Start a project</Link>
        </div>
        <nav className="ip-nf-nav" aria-label="Popular pages">
          <Link href="/work">Case studies</Link>
          <Link href="/services/web-design-sydney">Web design</Link>
          <Link href="/services/seo-local-visibility">SEO</Link>
          <Link href="/about">About the studio</Link>
        </nav>
      </div>
    </main>
  );
}
