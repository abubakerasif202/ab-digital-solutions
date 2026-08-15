import type { NextConfig } from "next";

const isProduction = process.env.NODE_ENV === "production";

/**
 * Content Security Policy.
 *
 * `'unsafe-inline'` on script-src is still required: the JSON-LD blocks and the
 * Next.js bootstrap are inline scripts, and moving to a nonce needs middleware
 * that forces every page to render dynamically — trading the whole static
 * prerender (and its TTFB) for a marginal gain on a site with no user accounts,
 * no sessions and no third-party scripts. `'unsafe-eval'` is dev-only: the
 * Turbopack dev runtime needs it, the production bundle does not.
 *
 * connect-src stays 'self' — Resend is called from the server, never the
 * browser, so allowing it here would only widen the exfiltration surface.
 */
const contentSecurityPolicy = [
  "default-src 'self'",
  "img-src 'self' data: https:",
  `script-src 'self' 'unsafe-inline'${isProduction ? "" : " 'unsafe-eval'"}`,
  "style-src 'self' 'unsafe-inline'",
  "font-src 'self' data:",
  "connect-src 'self'",
  "frame-ancestors 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "form-action 'self'",
  "upgrade-insecure-requests",
].join("; ");

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), interest-cohort=()" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains; preload" },
  { key: "Content-Security-Policy", value: contentSecurityPolicy },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  compress: true,
  // Pin the workspace root so an unrelated lockfile in a parent directory
  // cannot be inferred as the build root.
  turbopack: { root: import.meta.dirname },
  images: {
    formats: ["image/avif", "image/webp"],
    deviceSizes: [640, 750, 828, 1080, 1200, 1440, 1920],
    imageSizes: [32, 64, 96, 128, 256, 384],
  },
  async redirects() {
    // The legacy standalone prototype that used to live under
    // /site/ab-digital-premium/ has been removed; only its image assets remain.
    // These keep any indexed prototype URLs pointing at the real site instead of
    // 404ing, and stop a duplicate copy of the homepage being crawled.
    return [
      { source: "/site/ab-digital-premium", destination: "/", permanent: true },
      { source: "/site/ab-digital-premium/", destination: "/", permanent: true },
      { source: "/site/ab-digital-premium/index.html", destination: "/", permanent: true },
      { source: "/site/ab-digital-premium/styles.css", destination: "/", permanent: true },
      { source: "/site/ab-digital-premium/script.js", destination: "/", permanent: true },
    ];
  },
  async headers() {
    return [
      { source: "/(.*)", headers: securityHeaders },
      {
        source: "/site/ab-digital-premium/assets/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
    ];
  },
};

export default nextConfig;
