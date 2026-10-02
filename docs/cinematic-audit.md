# Cinematic portfolio audit

Audit performed before implementation on 3 October 2026. Source inspection was read-only. The codebase graph did not contain this repository (`check_index_coverage`: project not found), so inspection used direct file reads and searches. Figma design-context and screenshot requests for file hs0Mn6agDoDvn6PrytS4W7, node 3:2 were denied editor access; the supplied written direction remains available, but the Figma frame was not verified.

## Baseline evidence

`npm run build` completed with exit code 0 before edits. This script runs `npm run verify` followed by `next build`.

| Check | Baseline result |
| --- | --- |
| ESLint | Passed |
| Route type generation and TypeScript | Passed |
| Node tests | 38 passed; 0 failed; 0 skipped |
| Next production build | Passed; compilation 26.3 seconds; 30 prerendered pages |

The mocked rate-limit-store failure test emitted its expected fallback warning; it did not fail. No pre-existing quality-check failures were recorded. Two untracked kimi-export-session files were present and are unrelated work.

## Application and production configuration

- Next.js 16.3.5 App Router, React/React DOM 19.2.8, TypeScript 5.9.3 with strict mode.
- Installed runtime Node 22.23.1, npm 10.9.8; package engine requires Node 22.x.
- Tailwind CSS 4.2.1 with app-only source scanning and 4,168 lines of global CSS. Palette, typography and motion easing are centralized in CSS variables.
- Existing fonts: Nunito Sans and Source Serif 4, self-hosted through next/font; display serif loads only its rendered weight.
- Vercel uses Next.js, npm ci and npm run build. next.config.ts supplies security headers, AVIF/WebP optimization, explicit legacy redirects and a pinned Turbopack workspace root. Build filesystem cache is intentionally disabled following prior stale CSS behaviour.
- Runtime dependencies are Next, React, Three and Vercel Speed Insights. No Motion, GSAP, React Three Fiber or Drei dependency is installed.

## Routes and canonical content

Existing routes: /, /work, /work/[slug], /services, /services/[slug], /privacy, /api/contact, plus robots, sitemap, manifest and Open Graph image routes. There are six canonical service pages and thirteen project case studies. About and process are homepage sections, not independent routes.

app/project-data.ts is the canonical project registry, including real URLs, preview assets, descriptive copy, features and verified technology fields:

1. Aftab & Sons Transport
2. 247 Inventory System
3. Adelaide Wholesale Tyres
4. 247 Truck Tyre Services
5. Maple Rentals
6. Gala Rentals
7. ZQ Removals
8. Decent Development
9. Milestone Development
10. 4 Point Concrete
11. 1st Class Express
12. HF Removals Adelaide
13. Cheap Adelaide Removalist

Samra Transport is absent. No project, URL, metric or testimonial should be invented. Existing homepage features six projects; the full work index retains all thirteen. Service routes and sitemap entries derive from app/services/service-data.ts.

## Media, interaction and 3D

ProjectArtwork uses next/image with responsive sizes, lazy loading and explicit preload for priority imagery. The largest canonical preview inspected was approximately 299 KB. Existing brand and portfolio assets live under public/site/ab-digital-premium/assets and must be retained.

Hero3DExperience dynamically imports direct Three.js after browser idle. It skips phones, reduced motion and save-data devices, constrains quality and DPR, and retains a CSS fallback. Hero3DCanvas pauses offscreen and while the document is hidden, and handles WebGL context loss. Its torus knot, gold cage and cyan lighting differ from the requested AB/ruby identity.

Existing carousel pauses offscreen, in background tabs and during interaction, and supports reduced motion. PointerFX provides a native-cursor-preserving ring and restrained magnetic links, gated to fine pointers without reduced motion; its animation stops after settling. The session intro uses a 2.4-second timer and should be evaluated against immediate presentation of the work. Do not add another competing animation framework.

## Forms, analytics, SEO and accessibility

The contact form posts to the protected /api/contact endpoint. Existing backend includes bounded validation, a honeypot, IP rate limiting, optional shared Upstash storage and Resend delivery. Preserve this business logic and provider-failure tests.

Analytics include Vercel Speed Insights and a reportWebVitals callback. Metadata includes canonical URLs, Open Graph, Twitter, browser icons and Organization/ProfessionalService, Person and WebSite structured data. Case studies have route-specific metadata and CreativeWork/Breadcrumb schema. Sitemap, robots and llms.txt cover canonical content.

Existing header has keyboard focus trapping, Escape dismissal, inert background regions, scroll state and a mobile contact CTA. Existing CSS includes focus and reduced-motion support. Responsive visual and runtime accessibility checks remain necessary after implementation; source inspection alone does not prove contrast, layout or browser behaviour.

The current site configuration uses https://www.abwebstudio.com.au and defaults public email to admin@abwebstudio.com.au, with an optional configured override. The requested enquiry address differs from the baseline and should be treated deliberately. Existing phone details and social links are centralized/source-backed.

## Implementation implications

Preserve all thirteen projects, working routes, analytics, backend and SEO. Reuse the existing performance-conscious Three and pointer architecture. Replace the visual direction with restrained ruby, editorial typography, vector branding and richer real-project presentation. Source-guard tests assert some current typography, intro and CSS details; update obsolete design assertions while keeping behavioural regression protection. The large global stylesheet warrants focused consolidation, but unused-code removal must be evidenced rather than assumed.
