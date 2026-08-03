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

Business details and the canonical URL fallback live in `app/site-config.ts`. Portfolio data and page content live in `app/agency-home.tsx`. Project screenshots are stored in `public/site/ab-digital-premium/assets/`.
