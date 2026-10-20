# AB Web Studio local implementation and QA — 20 October 2026

## Scope and source

Branch: `feat/studio-complete-local-qa`, based on `dd1ecb1` (`fix(a11y): keep reveal text above contrast threshold on scroll-in`). Next.js 16.3.8, React 19.2.8, Node 22.23.1, npm 10.9.8. Production target remains the existing Next.js/Vercel application at https://www.abwebstudio.com.au/.

Preserved pre-existing package.json/package-lock.json additions for @tabler/icons, the untracked nested reference checkout and prior qa artifacts. No resets, archive overwrites, environment edits, commits, pushes, merges or deployments. Changes remain reviewable in the working tree.

The supplied ZIP was inspected without extraction over source. Its homepage contains an alternative atelier composition dated 19 October; the current checkout retains branch-specific fixes and was preserved. The archived glow logo matches the tracked asset byte-for-byte. No wholesale snapshot replacement was justified. The duplicate extracted reference tree is excluded from ESLint, as it is not the deployed source.

## Findings and implementation

- Corrected the public default mailbox from admin@ to the supplied enquiry@ address; server-only sender/destination overrides remain intact. Clarified websites, redesigns, stores and operational software without introducing prices or commercial promises.

- Verified 15 project destinations and assessed Fresh Stop; see [portfolio-verification.md](portfolio-verification.md). Corrected unavailable Gala status, framework attribution and unsupported functionality. Public sites, hosted showcases and staff sign-in have distinct labels. Existing real captures remain in use; Fresh Stop is excluded.

- Browser inspection found a block-letter hero differing from the authentic supplied ornate logo. Both static rendering and optional WebGL now use the same approved artwork. The desktop effect uses a lightly tilted image plane, not a claim of a physically extruded logo. Removed physical materials, procedural lighting and geometry allocations. Phone/reduced-motion/save-data/constrained-device fallbacks remain static, with reserved aspect ratio and visible CTAs.

- Reduced mobile hero art height and tightened navigation spacing. Fixed the final CSS cascade reintroducing a filtered containing block around fixed mobile navigation, and corrected a scroll-spy state that kept Contact highlighted after returning to the hero. Kept existing design tokens and stylesheet order; broad deletion of legacy CSS would risk regressions and is deferred.

- Improved dynamic reduced-motion handling, observer capability fallback, frame timestamps, texture error handling and GPU resource cleanup.

- Automated browser accessibility found a keyboard-inaccessible horizontal technology ledger and insufficient showcase label/index contrast. Added a named, focusable scroll region and corrected the final colour rules. Initial browser failures also identified harness issues: valid cache revalidation responses were incorrectly rejected, and deferred images were checked before loading; the assets themselves returned HTTP 200. Those checks were corrected before final validation.

- Contact success requires a provider acceptance ID and literal API ok:true. Invalid shared Redis pipeline results trigger the existing fallback. Client/server validation, honeypot, duplicate prevention, timeouts and useful failure states remain. Tests and intercepted browser submissions send no real enquiries.

- Corrected privacy disclosures, page-specific social metadata, work-page claims, sitemap change dates and the not-found landmark. Updated stale seven/eight-project and retired-build documentation. Six service URLs and 15 case-study URLs remain stable.

## Validation

- `npm ci`: PASS, 393 packages installed from the existing lockfile.

- `npm run build`: PASS after the final hero change. Its verify chain ran lint, typecheck and all 74 tests: 74 passed, zero failed, zero skipped. Next compiled and prerendered 35 outputs successfully.

- Independent read-only code review: no actionable findings, including contact, TypeScript boundaries, texture disposal and QA interception.

- `npm audit --omit=dev --audit-level=high`: PASS, zero vulnerabilities.

- Full `npm audit --audit-level=high`: FAIL, five high advisory entries through the same development-only braces -> micromatch -> fast-glob -> Next ESLint chain. Registry reports latest braces 3.0.3; no patched release is available in this dependency line. The suggested force fix downgrades eslint-config-next to 14.2.35 and was not applied.

- Local HTTP checks: sitemap, robots, manifest and Open Graph image return 200; legacy concept redirects 308 to /; unknown route returns 404. Security headers remain configured.

- Internal-link crawl: PASS, 845 internal-link occurrences across all 27 sitemap pages, zero broken destinations or missing anchor targets.

- Responsive/browser and lab performance results are recorded below after the final production-server sweep. No production Lighthouse score, field INP or real-user Core Web Vitals are claimed.

## Production and business requirements

Production readiness is conditional, not a deployment claim. Verify the branded mailbox and configured public override, Resend sender/domain/destination, shared Upstash credentials and an authorised test delivery. Per-instance memory fallback cannot enforce a global serverless quota; a warning records that limitation without exposing personal data. Provider acceptance is not proof of inbox delivery.

Confirm permission for client attribution/screenshots, hosted showcase launch status, detailed internal application feature descriptions and any future pricing offer. No new package price is published. Fresh Stop requires an approved preview label and authentic capture before inclusion. Verify analytics storage/provider configuration and privacy disclosures against the deployed environment.

The full dependency audit remains a development-tooling issue to revisit when a compatible patched release is available. Production has not been touched. A future release requires final review and commit, explicit push/deploy authorisation, current remote SHA proof, deployment readiness and live smoke checks.

## Local lab performance after the authentic hero update

Existing `scripts/studio-performance.mjs` sampled three cold-cache Chromium runs per width at DPR 1, 4x CPU throttling, 40ms latency and 10Mbps down/5Mbps up. At 390px, median LCP was 1.388s (range 1.064–1.908s); at 1440px, median LCP was 1.760s (range 1.480–1.924s). Maximum observed unexpected layout-shift total was 0.00156. This is a small local lab sample under concurrent QA, not a Lighthouse score, production CWV assessment or field INP. Raw results: `qa/studio-rebuild-20261020/performance-final.json`.



## Resumed in native WSL — 20 October 2026

### Exact starting state

The branch was already `feat/studio-complete-local-qa`, HEAD `dd1ecb1`. There were 36 modified tracked files, two new QA scripts, two new documentation files and existing `qa/` evidence. The application fixes described above were already present, including contact acceptance validation, public business copy, portfolio classification, the authentic image-plane hero, GPU cleanup, reduced-motion handling, mobile-menu containment, scroll-spy clearing and ledger/slider accessibility fixes. The previous browser log and report already recorded **217/217 checks passing**, plus six passing header checks; the handover document had omitted that final sweep. The historical base-commit subject above has been corrected from the actual Git log.

The package manifest and lockfile also contained a pre-existing `@tabler/icons` addition. It is preserved and intentionally left outside this task's commit, along with `.claude/settings.local.json`, the nested extracted reference tree and older untracked QA artifacts. No source was reset or replaced. This continuation finishes evidence collection, review, documentation and a selective local commit; it does not claim the earlier implementation as newly written.

### Environment and reproducibility

The mounted checkout's Windows `node_modules` was preserved. A separate source mirror at `/home/abuba/ab-studio-local-qa` received Linux dependencies with `npm ci`, using Node **22.23.1**. The initial copied test run encountered a missing Open Design fixture because the broad source copy had not finished; copying `opendesign/` resolved that setup issue. The complete subsequent build passed all gates. SHA-256 comparison confirms **136 application, public-asset and configuration files match** the mounted checkout exactly; see `qa/studio-resume-wsl-20261020/source-sha256.json`. Brand asset hashes are recorded separately; no brand asset was changed.

Commands used inside the isolated mirror:

```sh
export PATH=/home/abuba/.nvm/versions/node/v22.23.1/bin:$PATH
npm ci
npm run build
npm start -- --port 3100
# In another terminal, with the same Node PATH and working directory:
node scripts/studio-rebuild-qa.mjs
node scripts/studio-header-qa.mjs
# Optional fresh browser per width (repeat with 360,390,768,1024,1440,1920):
QA_WIDTHS=1440 QA_OUTPUT_DIR=qa/studio-width-1440 node scripts/studio-rebuild-qa.mjs
QA_INTERACTIONS_ONLY=1 QA_OUTPUT_DIR=qa/studio-interactions node scripts/studio-rebuild-qa.mjs
npm audit --omit=dev --audit-level=high
npm audit --audit-level=high
```

`npm run build` includes lint, Next route type generation, TypeScript and all Node tests. Results: **lint PASS; TypeScript PASS; tests 74/74 PASS; production build PASS**, with 35 generated outputs. Logs are saved under `qa/studio-resume-wsl-20261020/`. This validates the existing working-tree implementation in Linux; it does not imply a production release.

### Additional checks and review

- Header scroll-spy checks passed at 360, 390, 768, 1024, 1440 and 1920px.
- Supplementary Chromium checks passed: the menu CTA remains reachable at 390 × 420, carousel next/previous controls select the expected projects, and the authentic hero plus primary links remain available with JavaScript disabled. The first supplemental run used an incorrect harness selector `.showcase`; correcting it to the actual `.project-showcase` resolved the harness error. No application change was needed.
- All 15 public portfolio destinations returned 200 with expected business titles. No private sessions or customer forms were accessed. Contact details match the central configuration; delivery and ownership limits remain as documented in `portfolio-verification.md`.
- A fresh production-server crawl checked **872 internal-link occurrences across 27 sitemap pages**, with zero broken destinations or anchor targets. Sitemap, robots, manifest and Open Graph routes returned 200, the legacy concept redirected 308 to `/`, and an unknown route returned 404.
- Source review covered the existing contact delivery guards, Redis response validation, navigation focus handling, WebGL lifecycle, reduced motion, semantic metadata and content classifications. No additional application defect was established. Existing design and accessibility fixes were retained.
- Production dependency audit: zero vulnerabilities. Full audit: five high advisory entries in the development ESLint chain remain; the suggested forced downgrade to `eslint-config-next@14.2.35` was not applied.

Fresh browser evidence and screenshots are retained separately from the Windows-session artifacts in `qa/studio-resume-wsl-20261020/browser/`. Browser checks are local Chromium coverage, not Safari, Firefox, physical-device or manual screen-reader certification. Contact browser requests are intercepted and never sent to a mail provider. Business confirmation of mailbox/sender configuration, attribution permissions and real delivery remains outstanding before release. No push, merge or deployment is authorised or performed.


### Browser sweep completion and harness repair

The initial WSL Chromium process closed unexpectedly after 95 passing assertions, partway through 1024px. Its partial report and error log are retained. Fresh browser processes completed every desktop route: 27 checks at 1024px, 35 at 1440px including eight axe audits, and 27 at 1920px. All route assertions passed. The repeated interaction checks exposed a harness assumption: Linux headless Chromium reported both fine and coarse pointer media queries as false. Its desktop prerequisite assertion failed, while WebGL loading, reduced-motion cleanup, context-loss recovery, mobile keyboard navigation and intercepted contact submissions passed.

The QA harness now explicitly configures desktop pointer/hover capabilities using Chromium Blink settings and supports `QA_WIDTHS` and `QA_OUTPUT_DIR` for separate browser runs. Assertions were retained. With explicit fine-pointer capability, all 39 interaction assertions pass. The final harness received focused ESLint validation. The browser recovery method and raw reports preserve the failed prerequisite attempts rather than obscuring them. No application source change was needed during this continuation.

Final consolidated result: **223/223 unique checks PASS** (213 distinct route/accessibility/interaction checks, six header checks and four supplementary checks). The original 217-assertion suite repeats the required-field assertion four times; the consolidated report counts each named check once. All 27 routes passed at six widths, with zero horizontal overflow or broken visible images. The 16 axe route/width audits reported zero violations. No application runtime exceptions or failed image responses were recorded. The final updated harness itself passed all 39 interaction assertions and focused ESLint. `qa/studio-resume-wsl-20261020/browser/report.json` consolidates the latest successful assertions and identifies the retained earlier failures. Representative desktop/mobile screenshots are committed alongside the reports; the complete screenshot set remains in the isolated mirror.
