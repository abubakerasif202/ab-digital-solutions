# AB Web Studio release readiness — 20 October 2026

## Candidate and decision

Release candidate: `6a9667cfa8ebb35daceeba3740e24dead93fba4c` on `feat/studio-complete-local-qa`.

**NO-GO for production until the configuration and delivery gates below are resolved.** Local code validation is passing. This task does not authorise a push, PR creation, merge, deployment, environment change or real email submission. Two focused fixes were necessary: QA image completion/output handling in `0773791`, and responsive contact-row layout with a browser regression in `6a9667c`. The approved portfolio assets, registry and dependency files remain intact. No dependency correction is required. This report and the PR description remain uncommitted local drafts for review, outside the validated release commit. No new generated QA evidence is staged.

## Git evidence and preserved work

- `6fbcd71a3342b956f99269485dfe13ec54505189` exists, has parent `dd1ecb13e4df885491b744912edbc06ef8850dd5`, and contains the authentic hero, navigation, accessibility, business-content and contact acceptance improvements plus their QA documentation.
- `2ab41ab3bfbc6c7a2fc6cd6ec909925d567daa9d` exists, has parent `6fbcd71a3342b956f99269485dfe13ec54505189`, and adds Fresh Stop, its genuine capture, registry regression, ledger changes and portfolio documentation.
- `07737910fc3ae8013feadd4b449d2bcf0813b7af` adds a bounded wait for rendered image completion and an external output-directory option to the Fresh Stop QA harness. It changes one script only. A five-second delayed-image check reproduces one incomplete image under the old grace period and zero after the corrected wait.
- `6a9667cfa8ebb35daceeba3740e24dead93fba4c` corrects a visually confirmed contact email wrap at 1024, 1440 and 1920px. A container query applies the existing stacked label/value pattern when the actual enquiry column is narrow; the original phone fallback is retained. The header/browser harness now checks the email line count at six widths and accepts an external output directory.
- The feature branch has no remote tracking branch. A fetch updated `origin/main` to `c34d0382f9dfdcc4eac36920e5c981c144a057f4`. The comparison is **one commit on main / four on the feature branch**. Main's additional commit merges the common `dd1ecb1` change; it adds no competing source content.
- `git merge-tree --write-tree HEAD origin/main` completed without conflicts. Its result is content-identical to the candidate. Preserve both reported commits through a normal PR merge; no rebase, reset or cherry-pick is needed for this snapshot. Fetch and reassess if main advances.
- The two dirty tracked files are `package.json` and `package-lock.json`; together they only add `@tabler/icons@^3.49.0`. There are no application, script or test imports of that package. The committed manifest builds without it. Leave both user edits intact and outside the release.
- Starting untracked inventory: one `.claude/` local settings file, 690 files in the extracted `ab-digital-solutions/` reference directory and 114 older QA files. The detailed relative-path inventory is retained outside the repository. No blanket staging or destructive cleanup was used.
- Only `.env.example` is tracked among root environment files; no extracted reference directory is tracked. The earlier approved commits already contain 66 QA evidence files. No new generated QA artifacts or environment files are staged by this release preparation.

## Independent clean-checkout validation

Final native Linux clone: `/home/abuba/ab-studio-release-final-20261020`, obtained from committed Git objects and fast-forwarded to the exact candidate before the final fresh install. Node: **22.23.1**. No `.env.local`, Windows dependencies, dirty package changes or source-mirror overlays were copied into it.

| Command | Result |
|---|---|
| `npm ci` | PASS, 399 packages installed from the committed lockfile |
| `npm run verify` | PASS: lint, Next route types, TypeScript and 75/75 tests |
| `npm run build` | PASS: full verify chain again passes 75/75 tests; Next 16.3.8 generates 36 outputs |
| `npm audit --omit=dev --audit-level=high` | PASS, zero vulnerabilities |
| `npm audit --json` | Five high development-tooling findings; see below |

There is no required dependency correction. The Windows-mounted `node_modules` remains untouched. The checkout remained free of source modifications after install and build. Browser evidence is written outside the repository to avoid modifying historical tracked QA reports.

Raw logs and reports: `/home/abuba/ab-release-evidence-20261020/`.

## Application and security review

- Next App Router pages use awaited route params, registry-driven static params/metadata and explicit client boundaries. The installed Next server/client guide was consulted. Lint, generated route types, TypeScript and the independent production build pass.
- Contact requests have bounded streamed bodies, option allowlists, field length/email validation, origin checks, honeypot handling, trusted Vercel IP selection, rate limiting and provider timeouts. Preview deployments explicitly refuse real delivery.
- Resend acceptance requires a nonempty provider identifier; the browser requires literal `ok: true`. Tests stub the provider and Redis. Browser submissions are intercepted. Neither suite proves actual mailbox delivery or sender verification.
- Upstash pipeline responses are checked before use; failures use the existing per-instance fallback and emit a warning without form contents. That fallback is not a global serverless rate limit. Production currently lacks the shared credentials.
- User enquiry content is sent as plain text. React renders UI strings safely; JSON-LD serialisation escapes `<`. Analytics inserts JSONEachRow with validated identifiers. Server credentials are not exposed through public environment names or client components.
- Production CSP, HSTS, frame restrictions, MIME sniffing prevention and referrer/permissions policies are configured. CSP intentionally permits inline Next scripts/styles; this review does not claim a nonce-based CSP or change the established caching architecture.
- WebGL is deferred behind desktop intent, device and motion checks. Cleanup disposes texture/geometry/material/renderer, cancels frames and removes observers/listeners. Context loss and reduced motion restore the supplied artwork. No invented replacement logo or extrusion has been introduced.

### Development dependency advisory

The five audit entries are one affected chain: `eslint-config-next` → `@next/eslint-plugin-next` → `fast-glob` → `micromatch` → `braces`. The current registry reports `braces` **3.0.3** as latest and `micromatch` **4.0.8** still depending on it. The latest compatible Next 16 ESLint plugin, **16.4.2**, still uses `fast-glob` **3.3.1**. Thus a routine compatible update does not remove this chain. No manifest was changed, and neither a forced fix nor the suggested downgrade to Next 14 tooling was applied.

[GHSA-vfj7-8cjw-p6xm](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm) lists no patched version for `braces <=3.0.3`. The risk is process termination when affected tooling evaluates malicious deeply nested brace patterns. It is not present in the production-only dependency audit. Keep lint/CI inputs trusted, retain the existing 15-minute CI timeout and recheck the advisory before release. The full audit remains nonzero; acceptance of that tooling risk must be explicit.

## Browser, visual and SEO evidence

The initial production build runs locally on port 3200; the independently rebuilt final candidate runs on port 3300. The committed browser harness is run in a fresh Chromium process per width, using `QA_WIDTHS` and an external `QA_OUTPUT_DIR`. Contact traffic is intercepted; analytics is suppressed. The full initial matrix precedes the scoped contact-row correction; final affected-route coverage is recorded below.

The complete matrix passed **168 route/width checks** (28 routes at 360, 390, 768, 1024, 1440 and 1920px), **16 representative axe audits**, and the **39-assertion interaction suite**. Interaction checks repeat in each fresh width process: **418/418 total assertions passed**, with no application exceptions, failed image responses or unexpected console errors. This includes keyboard focus/wrapping/restoration, mobile menu containment, reduced-motion fallback, WebGL texture loading/context-loss cleanup and intercepted contact success/failure/duplicate handling.

The corrected Fresh Stop harness passed **41/41 checks**, covering desktop/mobile screenshot decoding at exactly 1348 × 926, slide 16/16 selection, registry counts, Prisma ledger inclusion, safe external links, metadata, sitemap and `llms.txt`. The original report retained three image-completion failures under concurrent cold-cache processing despite zero HTTP image failures; the fixed harness waits for actual rendered image completion. A global network-idle approach was also tried and timed out; the final code waits specifically for images and retains its 15-second failure bound. Raw initial diagnostics and the controlled delayed-image regression are retained outside Git.

Homepage screenshots at all six widths, mobile navigation/contact screenshots and representative desktop/mobile portfolio/service views were visually reviewed. This caught the email wrap that automated axe/overflow assertions did not flag. The initial full matrix used the `2ab41ab` application build. The only application delta in the final candidate is the scoped contact-row CSS; affected homepage/contact routes, keyboard/contact behaviour and email line counts are rerun across all six widths on the final build. The final Fresh Stop harness is rerun as well. This is local Chromium coverage, not physical-device/cross-browser or manual screen-reader certification.

After the contact fix, the final build passed **55/55 affected-route checks**: homepage/contact at all six widths, four axe audits and the 39-assertion interaction suite. The revised header harness passed **12/12 checks**, comprising six scroll-spy checks and six email line-count/overflow regressions. Rebuilt screenshots confirm the full email remains on one line at every required width, with no new clipping or overlap.

The final candidate also passed **41/41 Fresh Stop checks** on port 3300. All of the final affected/header/Fresh Stop reports have zero failed assertions. Final HTTP smoke checks also return 200 with expected MIME types and security headers for robots, sitemap, manifest, the homepage Open Graph image, the Fresh Stop Open Graph image and the original JPEG. The independent final checkout remains clean after validation; the performance output is under the ignored `test-results/` directory and was copied to the external evidence folder.

With other browser checks stopped, `QA_BASE_URL=http://127.0.0.1:3300 QA_PHASE=release-final node scripts/studio-performance.mjs` sampled three cold-browser-cache runs per width: DPR 1, 4× CPU throttling, 40ms latency, 10Mbps down/5Mbps up. Mobile 390px median LCP was **0.872s** (0.784–1.036s); desktop 1440px median was **0.912s** (0.824–1.024s). Maximum observed unexpected layout-shift total was **0** across all six samples. The origin's image cache was already warm. These are small local lab samples, not production Lighthouse scores, field INP or real-user Core Web Vitals.

Reproducible final browser commands from the isolated checkout, after `npm start -- --port 3300`:

```sh
QA_BASE_URL=http://127.0.0.1:3300 QA_OUTPUT_DIR=/home/abuba/ab-release-evidence-20261020/fresh-stop-release node scripts/fresh-stop-portfolio-qa.mjs
QA_BASE_URL=http://127.0.0.1:3300 QA_OUTPUT_DIR=/home/abuba/ab-release-evidence-20261020/header-final node scripts/studio-header-qa.mjs
```

The full-width matrix uses `QA_WIDTHS=WIDTH` with `scripts/studio-rebuild-qa.mjs` in a fresh process per width. The final affected-route pass uses the same harness with only its route list restricted to `/` and `/contact`, leaving assertions unchanged. All outputs stay in the external evidence folder. Initial failures/timeouts remain available; they are not relabelled as successful raw runs.

The HTTP crawl covers **28 sitemap pages**, including all **16 case studies** and **six service details**. It checks one H1, canonical/indexability, parseable JSON-LD, and **903 internal-link occurrences** with no broken destination or anchor. The root canonical's slashless and trailing-slash forms are equivalent; an initial strict-string diagnostic was reviewed and normalised, with its raw result retained.

## Fresh Stop

- Registry position 16 uses `https://www.freshstop.com.au/` and `/work/fresh-stop`; metadata, sitemap, counts, index, carousel and ledger derive from that registry.
- The committed 1348 × 926 JPEG is the previously approved genuine live homepage capture. SHA-256: `49aa6871bad0f653172fc42a60b65528f8000e62c79bfffc2ee3411b9ec57785`. No mockup or substitute artwork was made.
- The inspected Fresh Stop source files still match the hashes recorded with its integration. They support Next.js, React, TypeScript, Tailwind CSS, Prisma and PostgreSQL. Public copy describes grocery categories, indicative pricing, cart enquiries and wholesale/home-delivery email/WhatsApp pathways. It does not claim operational Stripe payments, completed orders or inventory synchronisation.
- Read-only recheck: `https://www.freshstop.com.au/` returns 200 but its canonical is `https://fresh-stop.vercel.app`. Fresh Stop source `src/lib/site.ts:1` reads `NEXT_PUBLIC_SITE_URL` and falls back to that old origin; `src/app/layout.tsx` uses it as `metadataBase`. Independent owner correction: approve setting Fresh Stop's Production `NEXT_PUBLIC_SITE_URL=https://www.freshstop.com.au`, review the fallback/example separately, rebuild/redeploy that site, then verify canonicals, Open Graph, sitemap and robots. This origin is also used by email tracking and checkout return URLs, so review those consumers in that separate task. The live cause could be an old environment override or fallback; Fresh Stop's deployed environment was not inspected. No Fresh Stop file, environment or deployment was changed. This does not block AB's correctly linked case study; AB's canonical and approved external URL remain unchanged.
- AB's current production `/work/fresh-stop` still returns 404 and its live sitemap does not list it, as expected before this release. Local success is not a claim of deployment.

## Production configuration: required decisions

Read-only Vercel inspection confirms project `ab-digital-solutions` is connected to `abubakerasif202/ab-digital-solutions` with production branch **main**. Current production deployment is **READY**, `dpl_9PGNMah9sEn4jNowHhDiiYyznzgk`, from main SHA `c34d0382f9dfdcc4eac36920e5c981c144a057f4`, aliased to `www.abwebstudio.com.au`.

1. **Public contact mismatch (rechecked read-only):** both `NEXT_PUBLIC_CONTACT_EMAIL` and `CONTACT_TO_EMAIL` differ from `enquiry@abwebstudio.com.au`. Both entries currently target Production, Preview and Development. The sender override uses `abwebstudio.com.au`; the sensitive Resend key targets Production only. Existing alternate addresses and credentials were not logged. Exact corrections and approval boundaries are below.
2. **Shared limiter absent:** AB has neither `UPSTASH_REDIS_REST_URL` nor `UPSTASH_REDIS_REST_TOKEN`. The accessible Vercel storage inventory contains Supabase, Edge Config and UI-testing resources, not Upstash Redis. The storage endpoint returned the same inventory with and without a project filter, so this is not evidence that those resources are attached to AB. No standalone Upstash account was accessible; an independently provisioned Redis database cannot be ruled out.
3. **Email delivery unverified:** the Resend connector returns `USER_NOT_LOGGED_IN`; no authenticated domain verification result or key-scope check is available. Public DNS resolves the root receiving MX to iCloud, `send.abwebstudio.com.au` MX to Amazon SES and a TXT record at `resend._domainkey.abwebstudio.com.au`. These records support an existing sending setup, but do not prove current Resend verification, API-key validity or mailbox existence. No delivery was attempted.
4. The project Node setting is 24.x, while the committed `engines.node` pins 22.x. Vercel documents that package engines override the project setting; the release is tested on 22.x. Confirm the effective Node major in the next deployment's build logs. No production setting was changed. See [Vercel Node version overrides](https://vercel.com/docs/functions/runtimes/node-js/node-js-versions).
5. No ClickHouse variable names were configured in the inspected project metadata. First-party ingestion therefore remains optional/inactive. Do not claim analytics collection or field Core Web Vitals without checking the eventual deployed configuration.
6. GitHub `main` is currently unprotected. Do not rely on enforced required checks; manually require the Quality workflow and Vercel preview to pass before merging. No repository setting was changed.

## Minimum configuration corrections — owner approval required

These are prepared instructions, **not changes performed**. Keep the four reviewed commits intact; no application code change is required to resolve these configuration gates.

### Public address and recipient routing

In Vercel → `ab-digital-solutions` → Settings → Environment Variables:

| Variable | Exact intended configuration | Approval / verification |
| --- | --- | --- |
| `NEXT_PUBLIC_CONTACT_EMAIL` | `enquiry@abwebstudio.com.au` | Approve updating the existing shared Production/Preview/Development entry, or split its targets if other environments intentionally differ. Ensure no branch-specific Preview override wins. |
| `CONTACT_TO_EMAIL` | `enquiry@abwebstudio.com.au` if this is the approved form inbox | Owner must confirm that the iCloud custom-domain address/alias exists and receives mail. A public address and a private form recipient can intentionally differ; retain the current recipient only if the owner explicitly confirms that routing. |
| `CONTACT_FROM_EMAIL` | Keep the existing AB-domain sender if its exact domain is verified for sending in the same Resend account as the deployed key | It need not equal the recipient/public mailbox. The source fallback is `AB Web Studio <admin@abwebstudio.com.au>`; that fallback also requires a verified sending domain. Do not change the sender merely to match the public address. |

The public variable controls rendered copy, mailto links and JSON-LD. Correcting only that variable does **not** correct the explicit `CONTACT_TO_EMAIL` override. Set the entries before the next authorised deployments, then inspect actual rendered output. [Vercel environment changes apply only to new deployments](https://vercel.com/docs/environment-variables/managing-environment-variables); do not rebuild/promote an old artifact and assume its public address changed.

### Shared serverless limiter

1. Owner checks the Upstash console for an existing **dedicated AB Web Studio Redis database**. Reuse it only after confirming ownership, purpose and available capacity; otherwise approve provisioning one. Do not reuse Fresh Stop's Supabase database, another application's Redis store, or a temporary trial resource.
2. In AB's **Production** environment set `UPSTASH_REDIS_REST_URL` to that database's HTTPS REST endpoint and `UPSTASH_REDIS_REST_TOKEN` to its matching write-capable REST token. Mark credentials sensitive, keep both server-only, and enter them directly in the dashboard. No `NEXT_PUBLIC_` prefix, Git file, PR comment or pasted token is needed. Prefer a dedicated database; if custom ACLs are already supported, scope the token to `contact-rate:*` and the required `INCR`/`PEXPIRE` commands. A read-only token, TCP connection URL, QStash token or Vector token is unsuitable. See [Upstash REST credentials and permissions](https://upstash.com/docs/redis/features/restapi).
3. Preview does not need Production Redis credentials: valid submissions are stopped by `VERCEL_ENV=preview` before the provider call. Rate limiting runs earlier in the handler, so sharing Production Redis credentials would still consume Production counters. Keep the guard. If a separate test environment needs Redis, use a separate store/token so QA cannot consume Production counters.
4. After authorisation, verify connectivity privately and exercise the limiter against disposable keys with the configured token, not real visitor keys. Confirm counts and the ten-minute expiry; verify the sixth request is rejected across independent serverless instances without provider sends. This requires separately authorised stateful testing. A read-only `PING` alone cannot prove write permissions or shared enforcement.

The existing implementation allows five requests per IP per ten-minute window using `INCR` and `PEXPIRE ... NX`. Missing credentials or Redis errors fall back to process memory; configuration names alone therefore do not prove global protection. Review runtime warnings after the authorised deployment. No new dependency or limiter rewrite is necessary for this release.

### Resend and the one real delivery test

Before authorising a send, the owner or an authenticated account operator must:

1. Open the Resend account used by AB's Production `RESEND_API_KEY`. Confirm `abwebstudio.com.au` is **Verified**, sending is enabled, and its required SPF/DKIM records are valid. Existing public DNS is supporting evidence only. Confirm the deployed key has sending permission for this exact sender domain; its sensitive Vercel value was not extracted or tested. Use the existing key if valid; do not rotate it solely for inspection.
2. Confirm the exact configured sender and approved recipient routing above, plus that `enquiry@abwebstudio.com.au` is provisioned as an iCloud mailbox/alias. Preserve the root iCloud MX records. Resend sending verification does not require migrating inbound mail to Resend or replacing the receiving MX; [sending and receiving are separate capabilities](https://resend.com/docs/dashboard/domains/introduction).
3. Explicitly approve **one labelled test enquiry**, its recipient and a controlled reply-to address, plus the deployment on which it will run. Preview intentionally returns HTTP 503 with `code: preview-disabled` and cannot establish real delivery. Do not remove the guard or add Production mail credentials to Preview to work around it.
4. After the separately approved Production build/deployment has the corrected settings, submit once through the actual form. Check application success, Resend acceptance/delivery event and actual inbox receipt (including spam); verify Reply-To targets the controlled submitter. A provider ID or HTTP 200 alone is not delivery evidence. If it fails, retain the error/event evidence and resolve it before calling the release GO; do not send repeated unapproved tests.

This creates two explicit decisions: **ready to authorise release** after configuration/provider preflight and green CI/Preview; **GO confirmed** only after the authorised deployment, shared-limiter validation and real inbox receipt. No current local/browser test result substitutes for these checks.

### GitHub Quality and Vercel Preview gate

Read-only GitHub checks still show main at `c34d0382f9dfdcc4eac36920e5c981c144a057f4`, unprotected, and no PR for this feature branch. `.github/workflows/quality.yml` triggers on pull requests and pushes to main; a feature-branch push alone does not run Quality. Its `verify` job uses Node 22, `npm ci`, `npm run build` (including verification), then `npm audit --omit=dev --audit-level=high`, with a 15-minute timeout. It requires no mail/Redis secrets.

After explicit publishing approval, push the existing branch and create the prepared draft PR. Require successful **Quality / verify** and the Vercel Preview check for the exact reviewed head, not merely a running check or a previous main build. Check Preview's public enquiry address, Fresh Stop image/case study and the expected disabled-delivery response. A missing/pending/skipped required check is not a pass. Main protection does not currently enforce this, so verify manually. No push, PR creation, environment change, email, merge or deployment was performed during this blocker review.

## Release procedure — only after authorisation

First resolve the configuration decisions above and explicitly approve any real email test. Review `docs/release-pr-description.md`. The following commands are preparation instructions, not actions executed by this task.

From the mounted repository, re-fetch and require the reviewed main/candidate SHAs before publishing anything:

```sh
git fetch origin
test "$(git rev-parse origin/main)" = "c34d0382f9dfdcc4eac36920e5c981c144a057f4"
test "$(git rev-parse feat/studio-complete-local-qa)" = "6a9667cfa8ebb35daceeba3740e24dead93fba4c"
git merge-tree --write-tree feat/studio-complete-local-qa origin/main
```

Stop if either SHA changed or the merge simulation fails. Revalidate the new candidate rather than continuing past a failed check. The dirty package files and untracked reference tree need no staging for this push.

After explicit **push/preview** approval:

```sh
(
  set -eu
  git fetch origin
  test "$(git rev-parse origin/main)" = "c34d0382f9dfdcc4eac36920e5c981c144a057f4"
  test "$(git rev-parse feat/studio-complete-local-qa)" = "6a9667cfa8ebb35daceeba3740e24dead93fba4c"
  git merge-tree --write-tree feat/studio-complete-local-qa origin/main
  git push --set-upstream origin feat/studio-complete-local-qa
  gh pr create --repo abubakerasif202/ab-digital-solutions \
    --base main --head feat/studio-complete-local-qa --draft \
    --title "Complete AB Web Studio improvements and add Fresh Stop" \
    --body-file docs/release-pr-description.md
)
```

Pushing can create a Vercel Preview deployment. Review it at desktop and mobile widths; confirm Fresh Stop, navigation, screenshots, contact failure handling and public details. A real contact submission must remain disabled in Preview.

Before a separately approved **production merge**, substitute the returned PR number:

```sh
gh pr checks PR_NUMBER --repo abubakerasif202/ab-digital-solutions --watch
gh pr view PR_NUMBER --repo abubakerasif202/ab-digital-solutions \
  --json headRefOid,baseRefName,mergeable,mergeStateStatus,url
```

Require the exact candidate head, base `main`, passing Quality/Vercel checks and no conflicts. Re-fetch/review main if it advanced. Once the owner authorises the production effect:

```sh
(
  set -eu
  git fetch origin
  test "$(git rev-parse origin/main)" = "c34d0382f9dfdcc4eac36920e5c981c144a057f4"
  test "$(gh pr view PR_NUMBER --repo abubakerasif202/ab-digital-solutions --json headRefOid --jq .headRefOid)" = "6a9667cfa8ebb35daceeba3740e24dead93fba4c"
  gh pr checks PR_NUMBER --repo abubakerasif202/ab-digital-solutions --watch
  gh pr ready PR_NUMBER --repo abubakerasif202/ab-digital-solutions
  gh pr merge PR_NUMBER --repo abubakerasif202/ab-digital-solutions \
    --merge --match-head-commit 6a9667cfa8ebb35daceeba3740e24dead93fba4c
)
```

**Merging to main automatically triggers Vercel production deployment.** Do not merge under permission that covers only pushing or creating a PR. Use a merge commit to retain all four reviewed local commits.

Confirm the new main merge SHA, Vercel READY state and production aliases. Then perform read-only live checks:

```sh
curl --fail --silent --show-error --output /dev/null https://www.abwebstudio.com.au/
curl --fail --silent --show-error --output /dev/null https://www.abwebstudio.com.au/work
curl --fail --silent --show-error --output /dev/null https://www.abwebstudio.com.au/work/fresh-stop
curl --fail --silent --show-error https://www.abwebstudio.com.au/sitemap.xml | rg -q '/work/fresh-stop'
```

Repeat responsive/browser checks on live pages and inspect canonicals, images, public contact details and headers. Perform an actual mail submission only under explicit approval and confirm receipt as well as provider acceptance. Do not infer delivery from a successful HTTP response.

## Rollback

Before merging, retain the current deployment identifier and URL:

`dpl_9PGNMah9sEn4jNowHhDiiYyznzgk` — `https://ab-digital-solutions-w4h67xm2p-abubakerasif202s-projects.vercel.app`.

If live checks fail after release, use Vercel's deployment view to select this previous READY production deployment and perform an authorised Instant Rollback. Confirm domain aliases and repeat HTTP/navigation/contact-display smoke checks. A rollback restores the previous deployment and its build-time configuration; it does not validate newly edited environment settings.

For a lasting Git rollback, open a rollback branch in a clean checkout, run `git revert -m 1 MERGE_SHA`, review the inverse diff, run the same validation and merge its PR after authorisation. Preserve history; do not reset main or force-push. No database migrations are part of this AB release. Coordinate the Git revert with the Vercel rollback so a later main deployment does not reintroduce the rejected change.

## Final handoff state

The release head is `6a9667c`. The staging area is empty. The mounted checkout retains its two original dependency edits and original untracked local settings/reference/QA folders. The only additional uncommitted files are this release-readiness draft and `docs/release-pr-description.md`. No environment values or credentials are included in the reports. All new generated logs/screenshots remain outside the repository. The final native checkout is clean at the exact release head.
