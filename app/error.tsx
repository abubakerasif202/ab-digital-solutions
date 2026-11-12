"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function RouteError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("Route error", error.digest ?? error.message);
  }, [error]);

  return (
    <main className="ip-nf" id="main-content">
      <div className="ip-nf-grid" aria-hidden="true" />
      <span className="ip-nf-numeral" aria-hidden="true">500</span>
      <div className="ip-nf-content">
        <p className="ix-label">Something went wrong</p>
        <h1>This page did not load as <em>expected.</em></h1>
        <p className="ip-nf-lede">Please try again. If it keeps happening, get in touch and we will sort it out.</p>
        <div className="ip-actions">
          <button className="ix-btn ix-btn--solid" type="button" onClick={reset}>Try again</button>
          <Link className="ix-btn ix-btn--ghost" href="/contact">Contact the studio</Link>
        </div>
      </div>
    </main>
  );
}
