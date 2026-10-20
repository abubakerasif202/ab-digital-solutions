# Fresh Stop portfolio integration — 20 October 2026

## Approval and scope

The owner approved Fresh Stop as public project #16, attributed to AB Web Studio. This supersedes the previous unfinished-preview exclusion. The destination is https://www.freshstop.com.au/ and the display domain is `freshstop.com.au`. Branch: `feat/studio-complete-local-qa`; starting commit: `6fbcd71`. Existing package additions, local settings, nested reference tree and older QA artifacts are preserved outside this focused commit. No push, merge or deployment is authorised.

## Verified content and stack

Public Chromium inspection returned HTTP 200 and the title “Fresh Stop — Sydney Fresh Produce & Online Groceries”. The homepage visibly identifies Rockdale and Riverwood, Sydney, credits AB Web Studio and presents catalogue categories, indicative prices, wholesale/business contact and home delivery email/WhatsApp pathways. Supporting live route captures are recorded in `qa/fresh-stop-20261020/live-pathways.json`; no enquiry or order was sent.

Source evidence from `/mnt/c/Users/abuba/fresh-stop`:

- `package.json`: Next.js, React, TypeScript, Tailwind CSS and Prisma dependencies.
- `src/app/globals.css`: active Tailwind import and green, cream and red design tokens.
- `src/lib/db.ts` and `prisma/schema.prisma`: Prisma client and PostgreSQL provider.
- `src/components/checkout/OrderPreview.tsx`, `src/components/cart/CartSummary.tsx` and `src/components/enquiry/EnquirySheet.tsx`: indicative-price shopping-list enquiries and email/WhatsApp links.
- Public homepage plus `src/components/layout/Footer.tsx`: wholesale and home delivery contact pathways.

Declared versions, source repository HEAD and hashes of the inspected files are recorded in `qa/fresh-stop-20261020/technology-evidence.json`. Local source verifies technology choices, not exact parity with every deployed component. Stripe dependencies are present but do not establish live payments. This case study does not claim live Stripe payments, confirmed orders, inventory synchronisation or operational outcomes. Owner approval covers Fresh Stop attribution; this task does not revise permissions for other projects.

## Authentic screenshot

`public/site/ab-digital-premium/assets/ab-portfolio-fresh-stop.jpg` is an unaltered browser viewport capture of the published custom-domain homepage, at **1348 × 926**, DPR 1, JPEG quality 92. Fonts and network loading settled before capture. No replacement artwork, mockup or styling was injected. Original text, green/cream/red palette, produce artwork and navigation are preserved. The source website labels some product imagery as illustrative; this portfolio asset is a real screenshot of that website. URL, capture timestamp and viewport are recorded in `qa/fresh-stop-20261020/live-site.json`.

## Integration

The canonical project registry drives the homepage carousel/index, work index, filters, case study, metadata, related-project links and sitemap. Fresh Stop is appended at position 16 with a new grocery sector. No parallel project list or custom route was introduced. Existing external-link rendering uses `target="_blank"` with `rel="noopener noreferrer"` and an accessible new-tab announcement.

Technology counts derive from the registry. Supabase and PostgreSQL now have separate ledger rows so Fresh Stop's PostgreSQL usage cannot imply Supabase usage; Prisma has its own row. Existing layout and motion components are retained. Public `llms.txt`, README and the active plan now identify 16 projects. Earlier QA documents retain historical counts and carry an explicit supersession notice.

## Validation

Validated in `/home/abuba/ab-studio-local-qa` using the existing isolated Linux dependencies and Node 22.23.1. Windows `node_modules` remains untouched. SHA-256 comparison confirmed all 132 application/public files match the mounted checkout; see `qa/fresh-stop-20261020/source-sha256.json`.

- `npm run verify`: PASS — lint, route type generation, TypeScript and **75/75 tests**, including the new Fresh Stop registry regression. An initial assertion caught removal of the established Work-index guidance sentence in `llms.txt`; that sentence was restored while retaining the new 16-project count.
- `npm run build`: PASS — its full verify chain again passed 75/75 tests, then Next.js compiled and generated **36 outputs**. Case-study and Open Graph metadata derive from the registry. A build started before the final grocery-sector copy review was cancelled; the recorded final build contains the completed copy.
- `node scripts/fresh-stop-portfolio-qa.mjs`: **41/41 checks PASS** on the final production server. This covers `/`, `/work` and `/work/fresh-stop` at **360, 390, 768, 1024, 1440 and 1920px**, with zero page overflow, broken visible images or runtime exceptions. All six representative axe route/width checks passed. Carousel keyboard activation selects Fresh Stop as 16/16 and its image loads; the ledger includes Prisma and derived counts out of 16. Both case-study external links open in a new tab with `noopener noreferrer`.
- The original JPEG returned 200 and decoded at exactly **1348 × 926**. The sitemap contains all **16 case studies** and the new canonical route; `llms.txt` contains the custom domain and 16-project count. All **16 external portfolio destinations** and all **16 local case-study routes** returned 200.
- The first browser attempt timed out during mouse-based slide selection at 768px after 14 passing checks. Its partial report and log are retained. Explicit keyboard focus/Enter activation completed the full matrix without changing application behaviour. The final harness also passed focused ESLint validation.
- Desktop/mobile case-study and Fresh Stop carousel screenshots were visually reviewed. Existing AB artwork, palette, layouts and motion were preserved. Browser coverage is Chromium, not physical-device or cross-browser certification.

Commands, run from the isolated mirror with Node 22.23.1 on PATH:

```sh
npm run verify
npm run build
npm start -- --port 3100
# Separate terminal, same mirror and Node PATH:
node scripts/fresh-stop-portfolio-qa.mjs
```

Machine-readable evidence and representative screenshots: `qa/fresh-stop-20261020/`. The screenshot capture provenance is in `live-site.json`; public category/contact-pathway inspection is in `live-pathways.json`. No customer enquiry, order, payment, private session, source Fresh Stop repository modification or production deployment was performed.
