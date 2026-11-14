import type { Metadata } from "next";
import Link from "next/link";
import { PageShell } from "./components/ui";
import { ArrowIcon } from "./icons";

// Without this the 404 inherits the homepage title, so the tab and any shared link claim to be the home page.
export const metadata: Metadata = {
  title: "Page not found",
  description: "This page could not be found. Head back to AB Web Studio's home page, case studies or services.",
  robots: { index: false, follow: true },
};

export default function NotFound() {
  return (
    <PageShell>
      <div className="shell lost">
        <p className="lost-code" aria-hidden="true">404</p>
        <h1>That page is not here.</h1>
        <p className="lead">The address may have changed, or the page may never have existed. These will get you back on track.</p>
        <div className="actions">
          <Link className="button button-primary" href="/">Back to home <ArrowIcon direction="right" /></Link>
          <Link className="button button-ghost" href="/work">Browse the work</Link>
        </div>
        <nav className="lost-links" aria-label="Helpful pages">
          <Link href="/services">Services</Link>
          <Link href="/about">About</Link>
          <Link href="/contact">Start a project</Link>
        </nav>
      </div>
    </PageShell>
  );
}
