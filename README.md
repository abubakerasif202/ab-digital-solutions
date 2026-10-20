# AB Digital Solutions

Production website for AB Digital Solutions, a Sydney-based web design and digital growth studio serving businesses across Australia.

## Stack

- Next.js 16 App Router
- React 19 and TypeScript
- Tailwind CSS 4 pipeline with a custom editorial design system
- Vercel production hosting

The main route renders as native React content for accessibility, SEO and performance. `public/site/ab-digital-premium/assets/` holds the live brand and portfolio imagery; the legacy static concept has been retired and its old URLs permanently redirect to the canonical homepage.

## Local development

Use Node.js 22.x as required by `package.json` (validated with 22.23.1).

```bash
npm ci
npm run dev
```

Open `http://localhost:3000`.

## Quality gates

Run the complete release checks before deployment:

```bash
npm ci
npm run lint
npm run typecheck
npm test
npm run build
```

The legacy Sites/Vinext build has been retired; Next.js is the only deployment source.

## Contact delivery

The contact form posts to `/api/contact`, which validates and rate-limits enquiries before delivering them through Resend. Configure `RESEND_API_KEY` as a sensitive Vercel environment variable. See `.env.example`; never commit the real key.

## Vercel deployment

The committed `vercel.json` pins framework detection to Next.js and uses:

- Install command: `npm ci`
- Build command: `npm run build`
- Output: Next.js-managed `.next` output (do not override it in Vercel)

Use the existing linked Vercel project:

```bash
vercel pull --yes --environment=production
vercel --prod
```

The canonical production origin is `https://www.abwebstudio.com.au`.

## Content and contact

Business details and the canonical URL fallback live in `app/site-config.ts`. Homepage sections live in `app/agency-home.tsx`, service routes in `app/services/service-data.ts`, and the portfolio in `app/project-data.ts`.

### Adding or updating a portfolio project

1. Capture a homepage screenshot of the live site at **1348 × 926** (aspect ratio 1.46:1 — every card and hero slide assumes it) and save it as `public/site/ab-digital-premium/assets/ab-portfolio-<slug>.jpg`.
2. Follow the `Project` type and an existing registry entry, including a stable `slug`, `sector`, overview, solution, features, evidence-backed technology labels, destination classification and descriptive image `alt`. The project image is required and has no fallback.
3. Keep `public/llms.txt` and destination classifications in sync. Counts derive from the registry: the current source contains 15 projects, including public sites, hosted demonstrations and a protected internal application. Verify availability without accessing private data.
4. Run `npm run verify`. `tests/source-guards.test.mjs` checks canonical project and asset contracts; the local browser sweep checks rendered routes, images and metadata.

External project links always render with `target="_blank"` and `rel="noopener noreferrer"`, and the accessible name announces that the link opens in a new tab.

### SEO configuration

- Canonical origin, titles, Open Graph, Twitter cards, icons and the JSON-LD `@graph` (`Organization`/`ProfessionalService`, `Person`, `WebSite`) are defined in `app/layout.tsx`.
- `app/robots.ts`, `app/sitemap.ts` and `app/manifest.ts` generate `/robots.txt`, `/sitemap.xml` and `/manifest.webmanifest`. The sitemap is derived from `servicePages` and `projects`, so new routes must be registered there rather than hardcoded.
- `/opengraph-image` is generated at build time from `app/opengraph-image.tsx`.
- `public/llms.txt` is the AI-search summary; keep services, project list and contact details in sync with the site.

## Current local audit

See [20 October implementation and QA](docs/studio-rebuild-qa.md) and [portfolio verification](docs/portfolio-verification.md). Historical audit reports are snapshots. With a local production server running on port 3100, `node scripts/studio-rebuild-qa.mjs` checks all public routes at six widths and mocks contact delivery; `node scripts/studio-header-qa.mjs` verifies section highlighting. Screenshots and machine-readable results go to `qa/studio-rebuild-20261020/`.

For native WSL, use a separate Linux source/dependency mirror; do not install Linux packages into the mounted Windows `node_modules`. The browser harness accepts `QA_WIDTHS=390,1440` and `QA_OUTPUT_DIR=qa/custom-run` to run selected widths with separate evidence. It explicitly models desktop pointer input for the WebGL lifecycle checks. See the native WSL section in the QA report for verified commands and limitations.
