"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function RouteError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("Route error", error.digest ?? error.message);
  }, [error]);

  return (
    <main className="shell lost" id="main-content">
      <div style={{ display: "grid", gap: "1.5rem", justifyItems: "start" }}>
        <p className="label">Something went wrong</p>
        <h1>This page did not load as expected.</h1>
        <p>Please try again. If it keeps happening, get in touch and we will sort it out.</p>
        <div className="actions">
          <button className="button button-primary" type="button" onClick={reset}>Try again</button>
          <Link className="button button-ghost" href="/contact">Contact the studio</Link>
        </div>
      </div>
    </main>
  );
}
