# AB Digital Solutions SEO Audit

## Audit summary

Scope: full repository and single public homepage, covering crawlability, metadata, content structure, structured data, images, accessibility-linked SEO and deploy configuration.

Overall rating: implementation-ready. The original root route exposed only an iframe, which was a confirmed rendering and content-discovery weakness. The homepage now renders its complete semantic content natively through Next.js, with a canonical URL, crawl directives, structured data, responsive images and a generated sitemap.

Top remediated issues:

1. Root content was isolated inside an iframe and is now native server-rendered markup.
2. Vercel would have run a Cloudflare/Vinext artifact build and now runs the native Next.js production build.
3. Metadata lacked a canonical URL, complete robots directives, a sitemap route and an app manifest; all are now implemented.

Top opportunities after launch:

1. Collect real-user Core Web Vitals once the production origin has enough traffic.
2. Validate the production schema and social preview against Google's and major social platforms' live tools.
3. Add dedicated service and case-study routes when unique, substantive content is available.

## Findings

| Area | Severity | Confidence | Finding | Evidence | Fix |
| --- | --- | --- | --- | --- | --- |
| Rendering | Critical | Confirmed | Root content was presented only through an iframe. | Previous `app/page.tsx` contained only an iframe pointing to a public HTML file. | Replaced with a native React App Router page exposing all content in initial HTML. |
| Deployment | Critical | Confirmed | The primary build produced a Vinext Cloudflare worker rather than Vercel's Next.js output. | Previous `build` script ran `scripts/build-verified.sh`; the script invokes Vite/Vinext. | Primary `build`, `dev` and `start` scripts now use Next.js; the old build remains as `build:sites`. |
| Metadata | Warning | Confirmed | Canonical, publisher, detailed robots and PWA metadata were incomplete. | Previous layout had title, description and social fields but no canonical or manifest. | Added canonical, publisher/creator, robots, manifest, richer Open Graph and Twitter metadata. |
| Structured data | Warning | Confirmed | Business schema was valid but sparse. | Previous JSON-LD contained only type, name, description, phone, email and area served. | Added an Organization/ProfessionalService graph, WebSite entity, contact point, address locality and service catalogue. |
| Crawlability | Warning | Confirmed | No generated sitemap or robots route existed. | No `app/sitemap.ts` or `app/robots.ts` was present. | Added both routes with the canonical production origin. |
| Duplicate content | Warning | Confirmed | The old public HTML homepage remained directly addressable. | `public/site/ab-digital-premium/index.html` duplicated the homepage concept. | Added a permanent redirect from the legacy HTML URL to `/`. |
| Images | Pass | Confirmed | Portfolio previews have descriptive alternatives and stable dimensions. | All project images are rendered with `next/image`, `fill`, reserved aspect ratios and responsive `sizes`. | Retain the current image pipeline and re-capture previews after material client-site redesigns. |
| Accessibility | Pass | Confirmed | Core landmarks, headings, form labels, keyboard controls and motion preferences are implemented. | Source includes a skip link, one H1, labelled sections, explicit labels, Escape handling, slideshow pause and reduced-motion CSS. | Re-test with axe and keyboard navigation after production deployment. |
| Performance | Info | Hypothesis | Field LCP, INP and CLS are not available before deployment. | No production CrUX/PageSpeed measurement exists for the new page. | Measure the live production URL; target LCP ≤2.5 s, INP ≤200 ms and CLS ≤0.1. |

## Prioritised action plan

1. Complete local lint, typecheck, test and production build gates.
2. Deploy to the existing Vercel project and verify canonical URLs use its production hostname.
3. Run desktop/mobile browser, keyboard, link, form and console checks against production.
4. Capture PageSpeed and field data after launch, then optimise only measured bottlenecks.

## Unknowns and follow-ups

- Real-user Core Web Vitals require the final production URL and field data.
- Search Console ownership, indexing state and query performance are external account checks.
- Social-card cache behaviour can only be confirmed after the production URL is publicly reachable.
