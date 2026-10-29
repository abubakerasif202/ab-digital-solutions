# AB Web Studio V3 release readiness

## Recovery verification — 30 October 2026

The earlier access and dependency blockers recorded below are resolved. This section supersedes the historical status below. Push and deployment are authorized; remote release evidence is recorded separately after the local gate.

- Native Windows Node 22.23.1/npm 10.9.8; repository and `.git` write probes passed. GitHub/Vercel DNS and CLI authentication passed. GitHub repository `abubakerasif202/ab-digital-solutions` reports ADMIN access.
- The missing `/tmp/ab-v3-deps/node_modules` Linux reparse point was preserved outside the checkout at `C:\Users\abuba\ab-v3-node_modules-linux-link-preserved-20261030`. Native `npm ci --include=dev` installed 443 packages. The unchanged lockfile SHA-256 is `12B3C85BD85689C99E8CA01B78FEB3775975B17625D8A4011F0633FC76E5DFA0`.
- `npm run verify` passed lint, type checking and 99/99 Node tests. Default `npm run build` passed with Turbopack, including the repeated verification gate. An initial build encountered the preserved broken link inside the checkout; moving that link outside the source tree resolved it without bypassing permissions.
- Complete Playwright run: **18 passed**, no failures, skips or flakes, 416.33 seconds, against the final source production build on port 3102. The contact test intercepted submissions; no live enquiry was sent. Raw evidence: `qa/studio-v3/recovery-20261030/local-playwright-results.json` and `local-playwright.log`.
- Source review corrected landscape OrbitControls limits to use the same mobile predicate as the first-person shots. Desktop camera coordinates/easing remain intact. Reviewer rechecked the fix with no remaining findings.
- The paired helper now explicitly forces ANGLE SwiftShader on Windows and supports a separate output directory, preserving historical measurements. Baseline `e76a995981bd18840013d1c44d3308c220c04506` was installed and built in a separate native detached worktree. Both phases use default Turbopack production builds.

| Viewport | Baseline median | Final V3 median | Change |
| --- | --- | --- | --- |
| 390px | 3,879.8 ms | 3,727.1 ms | -3.9% |
| 768px | 4,017.4 ms | 4,050.7 ms | +0.8% |
| 1440px | 4,387.4 ms | 4,256.4 ms | -3.0% |

Three cold samples per phase per width, alternating in one Chromium process, forced software WebGL, DPR1, 4x CPU, 40ms latency, 10/5Mbps. No concurrent build or browser QA ran during the measurement. All 18 samples reached intro. The historical +51.5% mobile and +16.9% desktop activation increases did not reproduce. This is local activation evidence, not field Core Web Vitals or physical-GPU frame pacing. Raw results: `qa/studio-v3/recovery-20261030/paired-benchmark.json`.

The benchmark's short post-entry window recorded 128 transient draws in two V3 desktop samples and one baseline tablet sample; it must not be represented as an all-zero idle result. The full browser suite's separate settled-idle test passed after a five-second wait.

Final visual capture completed successfully: 77 images at 320, 360, 375, 390, 430, 768 and 1440px plus landscape. Reviewed fresh mobile homepage, 320px consultation, landscape consultation and desktop homepage/reception. The separate desktop settled-idle/display-link/wheel test then passed **3/3 repeats** in 1.3 minutes; no continuous idle redraw regression reproduced. Selected new captures and raw local results are included with this release; regenerated historical QA files remain unstaged. Final targeted ESLint and `git diff --check` passed. Local release gate: **PASS**.

ADB detected a Huawei VOG-L29 on Android 10 with Chrome installed. Automatic approval review blocked the USB forwarding/browser-launch command with `blocked by policy`; it was not bypassed. **Physical Android browser/GPU and Safari testing remain pending.**

Vercel project access was independently confirmed for `prj_xQmMYKOOp3emOpv6bHesWKZxWZ6M`, team `team_cJFk6APDaky0rXTTZLj4xoWT`, owning `www.abwebstudio.com.au`. Project default Node is 24.x; package engines require 22.x, so deployment logs must confirm the selected build runtime. No project runtime setting was changed during recovery.

## Historical verification record

Review date: 30 October 2026 (Australia/Sydney). Overall: **PENDING — not cleared for release**.

## Authorized push/deploy attempt

The user subsequently authorized “push deploy”. Execution remains blocked by session access, not missing user approval:

- Staging the explicit V3 source/test/helper/report files failed: `.git/index.lock`: read-only filesystem. Nothing was staged or committed.
- `git push --set-upstream origin feat/immersive-studio-v3` failed because `github.com` could not resolve.
- The connected GitHub repository metadata reports `push: false`; it cannot provide a write-capable alternative. No matching remote V3 branch was returned by branch search.
- Vercel CLI is installed, but a direct Vercel API probe fails to resolve `api.vercel.com` (HTTP status 000). No deployment was created or live change verified.
- HEAD remains `e76a995981bd18840013d1c44d3308c220c04506`; V3 remains uncommitted. Logs: `qa/studio-v3/logs/push-deploy-*.log`.

Push and deployment need a session with writable repository Git metadata, working network access and a GitHub identity with write permission. The earlier verification gaps below still apply.

Branch: `feat/immersive-studio-v3`. HEAD: `e76a995981bd18840013d1c44d3308c220c04506` (baseline merge). V3 application changes remain uncommitted. This verification pass changes documentation and records diagnostics; it does not change application code, dependencies or the lockfile. Existing work and QA artifacts are preserved. No live enquiry, push, merge or deployment was performed.

## Requirement decisions

| Requirement | Status | Completed evidence and remaining gate |
| --- | --- | --- |
| 1. Confirm all 18 Playwright tests | PENDING | Saved full run: 17 passed, zero failures/skips/flakes, 398.38 seconds. Saved focused run: 4 passed, zero failures/skips/flakes, 106.49 seconds, including the new 18th test. These are separate runs. No full 18-test result against current source exists. Fresh execution cannot start without dependencies. |
| 2. Inspect the reported 10 warnings | PENDING | No ten-warning inventory is present in the saved V3 logs/results. The notices actually available are classified below; the other warnings cannot responsibly be classified without their messages. |
| 3. Finish production build and paired benchmarks | FAIL | Current `npm run build` exits 127 at `eslint: not found`. The paired benchmark exits before launching a browser because `@playwright/test` is missing. Historical production builds passed, but do not cover the latest prefetch changes. |
| 4. Review captured mobile screenshots | PASS | Reviewed the existing seven-width room contact sheet, individual 390px welcome/reception/gallery/services/consultation sheets, 320px consultation sheet, 390px homepage, 844x390 landscape and initial-landscape capture, plus desktop homepage/reception. This is review of existing Chromium captures, not newly captured or physical-device evidence. |
| 5. Fix remaining layout/interaction defects and rerun | PENDING | No clear new layout defect was established by the captures. Current source guards 32/32, studio tests 7/7 and camera tests 2/2 pass when run directly with the repository TypeScript hooks. Current browser interactions and latest prefetch edits still require the full suite. No speculative application patch was made. |
| 6. Homepage prominently invites entry | PASS | Current server component begins with “Don't Just Visit Our Website. Step Inside Our Studio.”, “Enter Our 3D Studio” links to `/studio`, and the linked poster says “INTERACTIVE 3D / TAP TO ENTER”. Mobile and desktop captures show the invitation above the supporting service section. The preview does not import the scene. |
| 7. Preserve smooth desktop experience | PENDING | Desktop camera coordinates/easing remain in source, and existing desktop captures retain the composition. The last paired activation median is 16.9% slower; no final post-optimization measurement or physical-GPU frame-time result establishes smoothness for current source. |
| 8. Supply branch/commit/files/screenshots/measurements | PASS | Branch and commit state above; file inventory, screenshot links, raw results and measurement table below. |

## Verification blocker and attempts

Repository `node_modules` points to `/tmp/ab-v3-deps/node_modules`, which no longer exists. The native final/baseline build directories referenced in the historical report are also absent. The checked-in workspace `.next` build predates the latest application edits and cannot establish current-source readiness.

Used the installed required Node 22.23.2. Recovery was attempted in an isolated `/tmp/ab-v3-verify` directory with unchanged manifests, preserving the broken repository link and unrelated work:

- Linux npm cache, offline: `ENOTCACHED` for `zustand-5.0.16.tgz`.
- Online clean install into the temporary directory: npm registry requests fail `EAI_AGAIN`; npm exits 1. No successful install is claimed.
- Windows npm cache, offline: also `ENOTCACHED` for the same locked package.
- Current production build: fails at missing ESLint, before compilation.
- Current Playwright command: cannot resolve the offline Playwright package.
- Current paired benchmark: cannot import `@playwright/test`.
- Broad Node runner: three test-file processes fail on missing Next/TypeScript packages. This is not an application assertion failure or a full unit-test pass.
- Direct checks using the repository TypeScript resolution hooks: source guards 32/32, studio 7/7, camera 2/2 passed. Early direct attempts without hooks failed extensionless TypeScript resolution; the corrected runs are the final direct evidence.

Attempt logs are `qa/studio-v3/logs/resume-*.log`. No missing check was bypassed to produce a green build.

## Available warning classification

| Available message/finding | Classification | Effect |
| --- | --- | --- |
| `NO_COLOR` ignored because `FORCE_COLOR` is set | Harmless tooling notice | Affects terminal colours; no evidence of a UI or interaction fault. |
| Playwright slow-file recommendation | Harmless execution notice | The saved full suite completed successfully with one worker. Parallel execution is not necessary for correctness and would contaminate paired performance measurements. |
| `eslint: not found`, missing `next`, `typescript`, `@playwright/test` | Actual verification infrastructure defects | Prevent current build, full unit, browser and benchmark gates. These are errors, not part of an identified ten-warning list. |
| Last paired mobile/desktop activation increases | Unresolved performance concern | Must be measured again after the existing prefetch edits. These measurements do not prove a frame-rate regression. |
| Remaining reported warnings | Unverified | The exact ten messages were not saved in the available evidence. They cannot be labelled harmless from their count alone. |

## Performance evidence

The newest completed paired artifact is `qa/studio-v3/paired-benchmark.json`, captured at `2026-10-29T17:46:12.771Z`. It is byte-identical to `paired-before-optimization.json`. Both `StudioExperience.tsx` and `site-chrome.tsx` have later modifications, so **these are pre-optimization measurements, not final current-source results**. The earlier sequential table in the historical report must not substitute for this paired table.

| Width | Baseline median | V3 median | Difference |
| --- | --- | --- | --- |
| 390px | 4,337.7 ms | 6,572.5 ms | +51.5% |
| 768px | 6,621.8 ms | 6,374.3 ms | -3.7% |
| 1440px | 5,324.4 ms | 6,225.0 ms | +16.9% |

All 18 activation samples reached intro; all 18 recorded zero idle draws. Three cold samples per phase per width, alternating phases in one Chromium process, software WebGL, DPR1, 4x CPU, 40ms latency, 10/5Mbps. This small local laboratory sample measures activation rather than desktop animation smoothness, field Core Web Vitals or real-phone GPU performance. No performance improvement is claimed for current source.

## Screenshot review

Existing captures reviewed:

- [Seven-width four-room contact sheet](../../qa/studio-v3/room-review.png).
- [Mobile homepage](../../qa/studio-v3/after/visual/390-home.png) and [desktop homepage](../../qa/studio-v3/after/visual/1440-home.png).
- [Welcome/reception view](../../qa/studio-v3/after/visual/390-welcome.png).
- [Reception bottom sheet](../../qa/studio-v3/after/visual/390-Reception-open.png).
- [Portfolio bottom sheet](../../qa/studio-v3/after/visual/390-Portfolio%20gallery-open.png).
- [Services bottom sheet](../../qa/studio-v3/after/visual/390-Services%20atelier-open.png).
- [Consultation bottom sheet](../../qa/studio-v3/after/visual/390-Consultation%20lounge-open.png), including its [320px layout](../../qa/studio-v3/after/visual/320-Consultation%20lounge-open.png).
- [Landscape consultation](../../qa/studio-v3/after/visual/390-landscape.png) and [initial landscape reception](../../qa/studio-v3/after/initial-landscape.png).
- [All before/after pairs](../../qa/studio-v3/comparison.html).

Reception frames the desk and monogram at eye level; gallery presents the project displays; services frames the three objects; consultation shows seating/table without the former foreground plant obstruction. Bottom sheets leave the upper scene visible. Longer content and the consultation CTA continue within the scrolling sheet. Some world-space hotspot labels clip at scene boundaries; the separate four-room navigation supplies their accessible destinations. Landscape captures retain room framing. Static captures cannot establish scrolling, focus restoration, touch response or frame pacing; those remain browser verification gates.

## Changed files

Current application diff consists of:

```text
app/agency-home.tsx
app/components/studio/VirtualStudioPreview.tsx
app/gilt-ruby-stage.css
app/site-chrome.tsx
app/studio/StudioExperience.tsx
app/studio/scene/StudioScene.tsx
app/studio/studio.module.css
```

Tests: `tests/e2e/virtual-studio.spec.mjs`, `tests/source-guards.test.mjs`.

Existing untracked QA helpers: `scripts/studio-v3-benchmark.mjs`, `scripts/studio-v3-paired-benchmark.mjs`, `scripts/studio-v3-visual.mjs`. Documentation includes this readiness report and the historical `studio-v3-report.md`. QA changes include tracked screenshots/results under `qa/virtual-studio` and `qa/gilt-ruby`, plus the untracked V3 evidence directory. Full tracked diff inventory: `qa/studio-v3/resume-tracked-changed-files.txt`. Working-tree inventory: `qa/studio-v3/resume-changed-files.txt`. Existing `.agents`/`.codex` additions are preserved and outside this verification's authorship.

## Remaining validation commands

Run with Node 22 and restored exact lockfile dependencies, in a network-capable environment. The temporary external dependency symlink needs a valid target or an installation inside a native source copy for default Turbopack. Preserve the existing symlink before replacing it. Do not treat the stale `.next` directory as a final build.

```sh
npm ci --include=dev
npm run verify
npm run build
npm start -- --port 3102
# Separate terminal, current source production server:
QA_BASE_URL=http://localhost:3102 npx playwright test
# Start a separately built e76a995 baseline on 3103; stop other QA/build work.
QA_CAPTURE=0 node scripts/studio-v3-paired-benchmark.mjs
git diff --check
```

The existing paired script uses fixed local ports 3103 (baseline) and 3102 (V3). The Playwright enquiry test intercepts `/api/contact` and uses `example.com`; never run an additional live enquiry. Physical Safari/Android acceptance remains pending. Releasing, pushing or merging requires explicit approval after completed verification.
