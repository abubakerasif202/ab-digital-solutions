# Inspector redesign takeover

Local feature branch: `feat/immersive-3d-redesign`, inherited baseline `f559236`.
No push, merge, deployment, production edits, or real enquiry delivery is authorized.
The inherited uncommitted redesign, unrelated settings/tooling and supplied portfolio assets are preserved.

## Implementation

- Retained Inspector's portfolio wall, existing palette, type system, native CSS scroll sequences and interior-page composition.
- Synchronized fallback imagery with selection; added persistent Pause/Resume and live reduced-motion handling.
- Recovered WebGL after context restoration; abort pending image work and cancel warm-up, pulse and animation work on disposal. Failed initialization uses the same cleanup path.
- Removed invisible work-mode controls from keyboard navigation.
- Stopped settled inspection lenses; corrected scroll/orientation geometry and exposed standalone reveal controls with pressed state.
- Corrected build-sheet and mobile enquiry landmark semantics without changing visual layout.
- Updated retired class/composition guards and the legacy Reveal browser regression to verify the actual Inspector experience, retaining content, SEO, focus, motion and contact checks.

## Reproduce

Use Node 22 and the installed Windows dependencies. Do not install WSL native packages into this checkout.

```powershell
npm run verify
npm run build
npm audit --omit=dev --audit-level=high
```

Start an isolated local server with `RESEND_API_KEY`, Upstash and ClickHouse credentials explicitly empty. Do not load or copy real secret files for QA. Set `QA_NO_DELIVERY=1` only for this isolated server. All browser form journeys must intercept delivery except the deliberately unavailable-provider API check.

```powershell
$env:QA_BASE_URL = 'http://localhost:3114'
$env:QA_OUT = 'qa/inspector-production-suite'
$env:QA_TEST_RESULTS = 'test-results/inspector-production-suite'
npx playwright test tests/e2e/inspector-wall.spec.mjs tests/e2e/inspector-pages.spec.mjs tests/e2e/inspector-accessibility.spec.mjs tests/e2e/reveal-performance.spec.mjs
node scripts/inspector-qa.mjs
```

`scripts/inspector-qa.mjs` refuses non-local origins, blocks contact delivery, derives routes from the canonical sitemap, checks all routes at 320/375/768/1440/1920px, validates internal links and metadata, runs axe on representative surfaces and records screenshots after traversing lazy content. Its report records failures rather than silently excluding rules.

Use separate `QA_OUT` and `QA_TEST_RESULTS` for parallel Playwright runs. Serialize GPU-heavy studio tests and Lighthouse; software WebGL contention is not representative physical-device performance. The archived luxury prototype suite starts its own static server. The preview suite needs a non-production local server, with `QA_PROD_GATE_URL` pointing to a second server running `VERCEL_ENV=production` to verify its 404 gate.

## Evidence and limitations

Initial production build: **PASS**, lint/typecheck and **227/227 Node tests**, **42/42** generated pages. Runtime dependency audit: **0 vulnerabilities**.

Initial sitemap sweep: **33 routes × 5 widths = 165 checks**, no horizontal overflow, broken images, page exceptions, missing metadata, duplicate titles or failing internal links. Axe identified three landmark findings; those were corrected and the four focused desktop/mobile landmark regressions passed.

Final integrated build, final production browser counts and Lighthouse results are recorded here after completion. Do not interpret the initial build or development screenshots as final production proof.

No public deployment or live email/inbox test is performed. Emulated browser sizes and software WebGL do not establish physical phone, low-end GPU or field Core Web Vitals results. Lighthouse LCP/CLS/TBT are laboratory measurements; TBT is not field INP.
