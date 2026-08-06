# AB Digital Solutions

Production website for AB Digital Solutions, a Sydney-based web design and digital growth studio serving businesses across Australia.

## Stack

- Next.js 16 App Router
- React 19 and TypeScript
- Tailwind CSS 4 pipeline with a custom editorial design system
- Vercel production hosting

The main route renders as native React content for accessibility, SEO and performance. The original static concept remains under `public/site/ab-digital-premium/` as a retained source artifact; requests to its legacy `index.html` redirect to the canonical homepage.

## Local development

Node.js 22.13 or newer is required.

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

The legacy OpenAI Sites/Vinext build remains available as `npm run build:sites`.

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
2. Add an entry to `projects` in `app/project-data.ts` with `name`, `category`, `description`, `url`, `displayUrl`, `image` and a descriptive `alt`. Every field is required — `image` has no fallback.
3. Update the project count copy in `app/agency-home.tsx` (`View all seven projects`, `Seven responsive digital experiences`) and the list in `public/llms.txt`.
4. Run `npm run verify`. `tests/rendered-html.test.mjs` asserts each project URL is present and that every referenced image file exists on disk.

External project links always render with `target="_blank"` and `rel="noopener noreferrer"`, and the accessible name announces that the link opens in a new tab.

### SEO configuration

- Canonical origin, titles, Open Graph, Twitter cards, icons and the JSON-LD `@graph` (`Organization`/`ProfessionalService`, `Person`, `WebSite`) are defined in `app/layout.tsx`.
- `app/robots.ts`, `app/sitemap.ts` and `app/manifest.ts` generate `/robots.txt`, `/sitemap.xml` and `/manifest.webmanifest`. The sitemap is derived from `servicePages`, so new routes must be registered there rather than hardcoded.
- `/opengraph-image` is generated at build time from `app/opengraph-image.tsx`.
- `public/llms.txt` is the AI-search summary; keep services, project list and contact details in sync with the site.
