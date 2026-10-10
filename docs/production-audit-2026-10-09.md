# AB Web Studio production audit and local upgrade

Audit date: 9 October 2026. Work remains local on `feat/cinematic-studio-upgrade`. No commit, push, merge, deployment, DNS change or real enquiry was performed. Pre-existing `package.json` and lockfile modifications were preserved.

## Result

Refined the existing Gilt & Ruby implementation rather than replacing it. All 14 portfolio projects, six service pages, business contact details, fonts, routing and static rendering remain. Existing case studies already provide overview, approach, features and technology; no results or business pricing were invented.

Detailed scope reports: [visual](visual-audit.md), [contact and analytics](contact-audit.md), [portfolio and SEO](portfolio-seo-audit.md), [security](security-audit.md).

## Verified findings and implementation

- Budget selection excluded enquiries below $1,500. Added `Under $1,500` and a custom software service choice, sharing option validation between browser and server. This is an enquiry range, not an advertised starting price.
- Existing form validation, honeypot, origin checks, body bounds, delivery timeout, duplicate lock and recovery were retained. Contact success now emits an enquiry event only after a successful response; honeypot submissions and failed requests do not produce leads.
- Analytics already existed through first-party ClickHouse. Extended meaningful contact/portfolio labels, honored DNT/GPC, and bounded chunked analytics bodies. No GA/GTM ID, cookies or extra third-party script was introduced.
- Hero now prioritizes Get a Website Quote and View Our Work, with genuine case-study proof and direct calling. Refined editorial scale, ruby/gold illumination, mobile contrast and supporting labels. Removed perpetual metallic-text repainting and the LCP paragraph's entrance delay; retained the headline sequence and original progressive 3D.
- Scroll reveals now handle tall sections, keyboard focus and cleanup without leaving content hidden.
- Featured six-project rotation is explicitly labelled Featured. Destinations distinguish hosted showcases, staff-access software and unavailable external sites. ZQ/HF links use verified redirect destinations. Gala Rentals remains in the portfolio but its HTTP503 destination is labelled unavailable.
- About/Services descriptions are more concise. Existing canonical, OG/Twitter, JSON-LD, sitemap and robots implementations were preserved. `llms.txt` matches the project registry.
- Added optional `CSP_REPORT_ONLY=true` strict-script diagnostics. Enforced CSP remains compatible with static Next hydration. A nonce migration would change rendering/caching and requires further measured work before enforcement.

## External audit findings

Missing CAA did not reproduce: three authorized certificate issuers already exist. Wildcard CORS is on public cached HTML; contact OPTIONS does not permit the tested foreign origin. Next's application fingerprint header was already disabled; Vercel platform headers remain. Production dependency audit reports zero vulnerabilities. Development ESLint dependency chain has five high-severity audit entries; an automatic incompatible config downgrade was not applied, and dirty dependency work was preserved.

Read-only production browser inspection confirmed the current Gilt & Ruby homepage, headline and no desktop document overflow. No separate Claude Design handoff was found in the scoped repository search; existing design documents describe the older Signal alternative, so its palette was not applied.

## Initial implementation performance measurements

Actual Lighthouse 13.5 runs on local production builds using Puppeteer's installed Chromium. Default mobile simulated throttling and desktop preset; results are lab measurements, not production field Core Web Vitals. The baseline screenshot job overlapped the first mobile baseline, so the performance delta is directional rather than an isolated causal benchmark.

| Metric | Mobile before | Mobile after | Desktop before | Desktop after |
| --- | ---: | ---: | ---: | ---: |
| Performance | 76 | 86 | 97 | 98 |
| Accessibility | 100 | 100 | 100 | 100 |
| Best Practices | 96 | 96 | 96 | 96 |
| SEO | 100 | 100 | 100 | 100 |
| LCP | 4.3 s | 4.2 s | 1.0 s | 1.0 s |
| TBT | 380 ms | 40 ms | 30 ms | 0 ms |
| CLS | 0 | 0 | 0 | 0 |

A second isolated mobile after run returned Performance86, LCP4.1s, TBT40ms, CLS0. Mobile Performance90 and LCP2.5s targets remain unmet; field INP cannot be established by navigation Lighthouse. Brand fonts and cinematic features were preserved. Raw reports are under `test-results/production-audit/lighthouse-*.json`.

## Validation and readiness

`npm run build` passed ESLint, TypeScript, all63 tests and production route generation. `git diff --check` passed. Independent code review found one CSP documentation typo, which was corrected; subsequent review found no actionable defects. Mocked endpoint tests cover contact delivery/errors/limits and analytics privacy/body bounds; no external messages were sent.

Browser validation checked all26 content routes at360/390/768/1024/1440/1920px:156/156 combinations had valid canonical/metadata, one H1 and no document overflow. Eight representative routes received16 mobile/desktop axe checks. Fourteen were initially clean; Work's two findings were traced to an offscreen low-opacity scroll timeline, then rechecked naturally visible and settled with no violations. This does not certify WCAG conformance. Hidden decorative service previews on mobile were correctly excluded from loaded-image assertions after verifying zero layout bounds; desktop visible previews decoded successfully.

The29-check supplement passed320px/landscape samples, mocked homepage/contact loading, errors, input preservation, duplicate prevention and success-only events; mobile keyboard navigation/Escape; no-JavaScript pages; reduced-motion fallback; actual desktop WebGL render readiness/visible canvas, context-loss restoration and forced WebGL failure. No unexpected runtime/network errors occurred in the supplement. Final mobile and desktop hero/contact screenshots were manually inspected.

Raw initial diagnostics remain in `report.json`; `report-matrix-reviewed.json` records156 validated combinations accepting legitimate cached304 responses, `report-recheck.json` records service-preview evidence, and `report-supplement.json` records visible contrast and interaction checks. Capture-only styles settle deferred content for screenshots; they do not alter runtime assertions. After the final rebuild, keyboard focus recovery passed2/2 checks at390/1440px, with opacity1 and no blur/transform/animation on the focused project ancestor; evidence is in `report-focus-final.json`. The final build again passed all63 tests, ESLint, TypeScript and route generation.

Commands executed include `npm run build`, `npm run verify`, targeted ESLint/TypeScript, Node contact/analytics/destination/security tests, `npm audit --omit=dev --json`, `npm audit --json`, `node scripts/gilt-ruby-qa.mjs`, `node scripts/production-audit-qa.mjs`, its `QA_SUPPLEMENT_ONLY=1` run, `npm exec --yes --package lighthouse -- lighthouse` with mobile/default and desktop presets, and `git diff --check`. Robots, sitemap, manifest and privacy returned HTTP200; enforced CSP/nosniff were present and X-Powered-By absent.

## Configuration and remaining limits

Local presence checks found no configured Resend, Upstash or ClickHouse credentials. The final pass queried Vercel environment names/scopes read-only: `RESEND_API_KEY` exists in Production; sender, recipient and public mailbox overrides exist in Production/Preview/Development. Upstash and ClickHouse variables were not listed. Secret values were neither retrieved nor saved. Presence does not establish credential validity, verified sending-domain status or deliverability. See [release configuration evidence](release-readiness-2026-10-09.md). Preserve the configured mailbox; the repository default remains `admin@abwebstudio.com.au`.

`CSP_REPORT_ONLY=true` is optional and build-time. Its policy reports in the browser console; no remote collector is configured. Do not enforce it without addressing framework inline scripts. Gala external availability and hosted-showcase production intent require owner confirmation.

The task changes pass local review and are suitable for merge review. `@tabler/icons` is a pre-existing unrelated dependency addition: no tracked application import establishes a current need, and it is not imported into application bundles. It was preserved. Production activation and live delivery verification remain separate steps. Optional Report-Only config has behavioral test coverage; a header-enabled production browser rollout was not performed.

## Final LCP optimisation and readiness pass

The saved after reports identify `p.hero-intro` as mobile LCP. Their **simulated** LCP was 4.21/4.09 seconds, while observed trace LCP was 1.10/0.84 seconds. The LCP breakdown's 965/835 ms render delay describes the observed trace, not a four-second animation. The paragraph already had computed animation `none`, opacity `1`, and no blur in the preceding implementation. Brand intro is skipped on coarse pointers/reduced motion, is non-blocking, and does not hide the page. Desktop `ed-rise` animations were not the remaining mobile delay.

Implemented bounded improvements:

- Essential hero label, introduction and quote/work actions are visible immediately. Headline entrances are disabled for narrow/coarse-pointer devices; desktop headline motion and the original progressive 3D remain.
- Moved portfolio-only and interior-only composition rules into route layouts. All original selector/declaration rules and media/support contexts were retained and independently reviewed. Homepage render-blocking CSS transfer dropped from 35,700 to 31,752 bytes (about 11%).
- Disabled initial homepage navigation/hero/ticker route speculation; opening the mobile menu restores navigation prefetch. Other routes retain normal navigation prefetch. Final work CSS requests start after observed LCP rather than competing before its paint. All links and URLs remain functional.
- Kept self-hosted `next/font` brand fonts, swap behavior, optical sizing and preload configuration. The three principal font responses total approximately 146 KiB; two mono faces add approximately 21 KiB. Removing typography indiscriminately was not justified.

An inline-CSS experiment regressed to Performance73, LCP4.4s and TBT408ms, substantially expanding HTML; it was reverted. Proposed Bodoni weight narrowing was rejected by the installed loader's supported weight/axis contract and reverted. Neither experimental configuration is in the final source.

### Final repeated Lighthouse measurements

Three mobile and three desktop runs used the same final production build, Lighthouse13.5 default mobile simulated throttling/desktop preset and installed Chromium. Browser QA did not overlap these runs. All repeats are reported; no passing run was selected as representative.

| Run | Performance | LCP | TBT | CLS |
| --- | ---: | ---: | ---: | ---: |
| Mobile 1 | 85 | 4.135 s | 93 ms | 0 |
| Mobile 2 | 87 | 4.101 s | 51 ms | 0 |
| Mobile 3 | 76 | 4.223 s | 394 ms | 0 |
| Desktop 1 | 99 | 0.944 s | 0 ms | 0.0005 |
| Desktop 2 | 99 | 0.937 s | 0 ms | 0 |
| Desktop 3 | 98 | 0.960 s | 0 ms | 0.0005 |

Mobile median Performance85/LCP4.135s; desktop median Performance99/LCP0.944s. Accessibility100, SEO100 and Best Practices96 in all six runs. Final mobile observed LCP was 0.957–1.093s, with observed render delay 0.945–1.077s. Main-thread audit totals include style/layout 0.90–1.14s and script evaluation 0.57–0.66s across the navigation trace. These totals are not exclusively pre-LCP time. Blocking styles, font dependencies and mobile CPU rendering/hydration remain costs; removing the paragraph animation alone cannot resolve them. CPU blocking varied materially across repeats. The stylesheet transfer improvement is verified; an overall performance-score improvement is **not established** against the previous86 runs.

**Mobile LCP <2.5s and Performance >90 remain unmet.** No production field INP or live deployment performance is claimed. Further work requires measured reduction of shared style/layout and startup execution while preserving the existing appearance, rather than treating an intro timer as the confirmed cause. Raw final reports: `test-results/production-audit/lcp-final-{mobile,desktop}-{1,2,3}.json`; trial reports/logs remain alongside them.

Final `npm run build`, `npm run verify` (ESLint, TypeScript, 63 tests) and `git diff --check` passed. Independent review approved the route CSS split, hero visibility and prefetch changes with no actionable findings.

### Final browser validation

The final production build passed **156/156 route-and-width checks** across all26 content routes at360/390/768/1024/1440/1920px. Canonicals, metadata, single H1, visible image loading and document overflow were checked. The initial full harness recorded206 passing assertions and five diagnostic failures: two offscreen scroll-animation contrast readings, two beacon-body capture failures and the expected forced WebGL failure diagnostic with a duplicated renderer prefix. These raw results remain in `report.json`; they are not presented as an entirely passing raw run.

The corrected targeted supplement passed **41/41 assertions, zero unexpected browser errors** (`report-supplement.json`). Beacon assertions now inspect actual request bodies using Chromium's `fetchPostData()`: each mocked successful form produced exactly one `project_enquiry` event, failed requests produced none, and neither email nor message was included. Empty required fields prevented sending and linked accessible errors; loading, input preservation, duplicate protection and the lower-budget enquiry option were checked. The WebGL exclusion matches only the exact expected context-creation diagnostic in the forced-failure test.

Fourteen initial axe checks were clean; Work's mobile/desktop offscreen findings were rechecked with the cards naturally visible and settled, yielding zero violations. Keyboard focus restores visible project ancestors at390/1440px. Supplement checks also cover320px/landscape layouts, mobile menu keyboard/Escape, reduced motion, no-JavaScript content, actual desktop WebGL rendering, context recovery and unavailable-WebGL fallback. Final mobile and desktop hero screenshots were manually inspected. Prior-pass reports/screenshots are archived in `test-results/production-audit/previous-pass`; Lighthouse reports were retained separately. Automated checks do not certify complete WCAG conformance.

After harness corrections, focused ESLint, `node --check` and `git diff --check` passed; independent review confirmed the assertions still inspect genuine payloads and unexpected renderer errors. No product source changed after the measured build.

### Deployment decision

**GO for merge review; NO-GO for production deployment under the requested performance/readiness gates.** Mobile performance targets remain unmet, and the production sending domain/key/recipient delivery path has not been verified. No real enquiry was sent. Configure Upstash URL/token for shared rate limiting or explicitly accept the per-instance fallback limitation. Configure ClickHouse credentials/schema if persisted conversion reporting is required; currently the optional endpoint accepts events without storing them. Missing analytics is not a rendering blocker, but conversion reporting cannot be claimed. Resend is listed only for Production, so Preview/Development need mocks or deliberately isolated test configuration. No infrastructure changes are made automatically.

Additional files changed in this final pass: `app/compositions.css`, `app/work/compositions.css`, `app/interior-compositions.css`, `app/layout.tsx`, `app/work/layout.tsx`, new `app/about/layout.tsx`, `app/contact/layout.tsx`, `app/services/layout.tsx`, `app/gilt-ruby-stage.css`, `app/site-chrome.tsx`, `app/agency-home.tsx`, `app/components/LiveTicker.tsx`, `tests/source-guards.test.mjs`, `scripts/production-audit-qa.mjs`, this report and `docs/release-readiness-2026-10-09.md`. The earlier implementation files listed below remain preserved on the same feature branch. No commit, push, merge or deployment occurred.

## Files changed

Homepage/motion: `app/agency-home.tsx`, `app/gilt-ruby-stage.css`, `app/motion.css`, `app/components/motion/Reveal.tsx`, `app/components/LiveTicker.tsx`.

Contact/measurement: `app/contact-options.ts`, `app/components/ContactForm.tsx`, `app/api/contact/route.ts`, `app/api/analytics/route.ts`, `app/lib/contact-analytics.ts`, `app/lib/clickhouse.ts`, `app/web-vitals.tsx`, `app/privacy/page.tsx`, `.env.example`.

Portfolio/SEO: `app/project-data.ts`, `app/components/WorkIndexBody.tsx`, `app/work/page.tsx`, `app/work/[slug]/page.tsx`, `app/about/page.tsx`, `app/services/page.tsx`, `public/llms.txt`.

Security/validation: `next.config.ts`, `tests/contact-route.test.mjs`, `tests/analytics-route.test.mjs`, `tests/project-destinations.test.mjs`, `tests/security-config.test.mjs`, `tests/source-guards.test.mjs`, `scripts/production-audit-qa.mjs`, and the audit documents.
