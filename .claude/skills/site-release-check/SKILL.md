---
name: site-release-check
description: Checklist for shipping changes to the AB Web Studio Next.js site on Vercel. Use when preparing a release, adding a page/project/service, or verifying SEO, accessibility, responsive layout, or performance.
---

# Site release check

Use alongside `/verify`, `/site-audit`, and `/pre-deploy`.

## Adding content
- **Portfolio project**: add to `app/project-data.ts` only (canonical registry); put imagery in `public/site/ab-digital-premium/assets/` with kebab-case names; confirm the route and sitemap pick it up.
- **Service page**: add to `app/services/service-data.ts`; it drives both the page and `app/sitemap.ts`.
- Add or extend a `tests/*.test.mjs` regression (rendered HTML, metadata, asset references).

## Gate
1. `npm run lint`, `npm run typecheck`, `npm test`, then `npm run verify`.
2. Visual changes: check 320, 375, 768, 1024, 1440 widths for overflow; keyboard-tab the page; confirm reduced-motion behavior.
3. SEO: unique title/description, OG image, canonical, sitemap entry, one `h1`.
4. Performance: explicit image dimensions, lazy-load below the fold, heavy libs (three.js, video) loaded on demand. Targets LCP < 2.5s, INP < 200ms, CLS < 0.1.

## Vercel
- `vercel.json` builds with `npm ci` + `npm run build`.
- Secrets (e.g. `RESEND_API_KEY`) live only in Vercel env settings, never in Git.
- A green local build or a push is not a deployment: verify the Vercel preview and the live URL separately.

## Guardrails
Do not commit, push, deploy, or touch secrets without explicit permission. Next.js 16 differs from older versions; read `node_modules/next/dist/docs/` before using framework APIs.
