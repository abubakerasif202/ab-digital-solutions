# Release report: production-readiness pass (2026-10-25)

Branch: `feat/hero-cinematic-2`. Nothing in this report has been committed, pushed or deployed.

## Changes

| File | Change | Why |
|---|---|---|
| `package.json` / lockfile | Removed unused `@tabler/icons`; lint script ignores `test-results` and `.remember` | Dependency had no importers; scratch files produced 2 lint warnings |
| `tests/source-guards.test.mjs` | Pinned lint script string updated | Guard test pins the script |
| `.gitignore` | Added `/ab-digital-solutions/` | 883 MB reference snapshot must not be committed (contents preserved) |
| `.claude/settings.json` | Extra deny rules for `.env.*` variants (Read/Edit/Write); `.env.example` stays readable | Stronger secret protection |
| `app/api/contact/rate-limit.ts` | Limiter takes an optional policy; per-scope memory tables; optional store back-off | Reused for analytics without sharing budget or capacity with the contact form |
| `app/api/analytics/route.ts` | Per-IP limit of 300 requests / 10 min, HTTP 429 with `Retry-After`; 30 s Redis back-off | Endpoint had origin check only |
| `tests/analytics-route.test.mjs` | Two new tests (rate limit; Redis outage) | Coverage for the above |

## Verification (local)

- lint: pass, no warnings. typecheck: pass. tests: 84 of 84. `npm run build` (runs verify first): pass, 36 static pages.
- Lighthouse (local production server): home mobile and desktop, `/contact` mobile: Accessibility 100, SEO 100, Best Practices 96. The only failure is the `_vercel/speed-insights` 404, which exists only on Vercel. CLS 0.00.
- 28 sitemap URLs: canonical correct, one `<h1>`, title, description, valid JSON-LD, no missing `alt`.
- Responsive (320, 375, 1440 px, 8 pages): no horizontal overflow.
- JS about 392 KB gzip across all chunks; CSS about 42 KB gzip (under the 50 KB app budget). Three.js is dynamically imported; the film loads on click.

## External configuration (read from Vercel and Resend; no secret values read)

| Item | State |
|---|---|
| `RESEND_API_KEY` | Present, sensitive, Production only (Preview intentionally absent; previews refuse to send) |
| `CONTACT_FROM_EMAIL` | Present, Production/Preview/Development, sender `admin@abwebstudio.com.au` |
| `UPSTASH_REDIS_REST_URL` / `_TOKEN` | Present, sensitive, Production and Preview |
| `CONTACT_TO_EMAIL`, `NEXT_PUBLIC_CONTACT_EMAIL` | `admin@abwebstudio.com.au` |
| ClickHouse variables | Not set, so analytics is inert (204) and the new limiter has no effect yet |
| Resend domains (connected account) | Only `freshstop.com.au` listed (verified). `abwebstudio.com.au` not listed |
| DNS for `abwebstudio.com.au` | `resend._domainkey` DKIM and `send.` SES MX records exist; mail MX points to iCloud |

## Remaining risks

1. **Blocker (likely):** the sender domain is not verified in the Resend account that is connected here. If the production API key belongs to the same account, Resend will reject sends and visitors will see "We could not send your enquiry". The DNS records suggest the domain was set up in another Resend account or team; confirm in the Resend dashboard.
2. Mailbox `admin@abwebstudio.com.au` could not be confirmed without sending mail. MX records point to iCloud, so receiving is plausible.
3. Public email default in code is `enquiry@`, while Vercel sets `admin@`. Confirm which is intended.
4. Some project meta descriptions are 59–67 characters. Left alone because lengthening them needs real business details.
5. Not measured: field Core Web Vitals, colour-contrast beyond Lighthouse, Vercel preview behaviour.
