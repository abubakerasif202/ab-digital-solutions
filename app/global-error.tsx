"use client";

import { useEffect } from "react";
import { siteConfig } from "./site-config";

// Replaces the root layout when it fails, so it ships its own <html> and inline
// styles: the site stylesheet and fonts are not guaranteed to be available here.
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("Global error", error.digest ?? error.message);
  }, [error]);

  return (
    <html lang="en-AU">
      <body style={{ margin: 0, minHeight: "100vh", display: "grid", placeItems: "center", background: "#0b0b0d", color: "#f5f1ea", fontFamily: "system-ui, sans-serif", textAlign: "center", padding: "24px" }}>
        <main style={{ width: "100%", maxWidth: "32rem", textAlign: "center" }}>
          <h1 style={{ fontSize: "1.75rem", lineHeight: 1.25, letterSpacing: "normal", fontWeight: 600, margin: "0 0 12px", padding: 0 }}>Something went wrong.</h1>
          <p style={{ fontSize: "1rem", lineHeight: 1.6, margin: "0 0 24px", padding: 0, opacity: 0.85 }}>
            Please try again, or email <a href={`mailto:${siteConfig.email}`} style={{ color: "inherit", textDecoration: "underline" }}>{siteConfig.email}</a>.
          </p>
          <button
            type="button"
            onClick={reset}
            style={{ font: "inherit", color: "inherit", background: "transparent", border: "1px solid currentColor", borderRadius: 4, padding: "10px 24px", cursor: "pointer" }}
          >
            Try again
          </button>
        </main>
      </body>
    </html>
  );
}
