# Immersive studio V3 — local review

> Superseded release status: see [studio-v3-release-readiness.md](studio-v3-release-readiness.md). The latest paired measurements below the earlier sequential run were not incorporated into this historical review. Subsequent prefetch edits have no completed final build, full 18-test run or paired benchmark evidence. Do not use this document alone as release approval.

Branch: `feat/immersive-studio-v3`. No push, merge, deployment or real enquiry submission.

## Implementation

- Server-rendered homepage entrance leads with the requested headline, studio/work links and explicit interactive label. Existing original poster is reused; the preview imports no scene or Three.js. The former oversized hero becomes a supporting service proposition and its separate 3D artwork is removed from the homepage.
- Dedicated mobile room compositions at eye level replace the scaled desktop overview. Reception uses an oblique entrance shot; portfolio frames the project displays; services frames the brass/ruby objects; consultation avoids the foreground plant. Short landscape viewports retain mobile room shots. Desktop shot coordinates and easing remain intact.
- Intent loading, reduced-motion still experience, WebGL failure/retry, DPR limits, demand rendering, offscreen suspension, shared materials and content remain. No new dependencies, textures, lights, shadows or postprocessing.
- Arrival advances from the entrance to reception. Welcome waits for the visitor. Start Exploring activates manual exploration; Guided tour is separate. Skip Intro remains available. Decorative intro rendering stops while waiting.
- Previous/Next Room, reset, exit and collapsible details supplement the room selector. Native page and panel scrolling, Escape and focus restoration remain. Consultation uses the requested headline and Start Your Project links to the existing `/contact` process.
- All 16 canonical project options and four service areas remain.

## Dependency diagnosis

The previous Node 20 `npm ci` process was still active and the dependency tree lacked `.bin/eslint`. npm `omit` was empty and `production` unset. The stale installer was stopped; an explicit dev-inclusive retry against the mounted incomplete tree also stalled before installation. The incomplete tree was preserved outside the repository at `../ab-v3-incomplete-dependencies` (a partial cross-filesystem copy also remains at `/tmp/ab-v3-partial-modules`).

Node 22.23.2/npm 10.9.8 installed the unchanged package.json/package-lock.json with `npm ci --include=dev` on native WSL storage in `/tmp/ab-v3-deps` in 30 seconds. Repository `node_modules` links there. No global ESLint, regenerated lockfile, ignored check or credential change was used. This local dependency link is temporary and should be recreated with `npm ci --include=dev` on a normal filesystem after a reboot/cleanup of `/tmp`.

Turbopack rejects that external dependency symlink under its hermetic root. The repository production build passed using `npm run build -- --webpack`, including lint/typecheck/99 Node tests. The exact patched tracked source was also copied to `/tmp/ab-v3-final` with local hardlinked dependencies; unmodified `npm run build` passed there with Turbopack. This verifies the default build independently from the mount workaround.

## Evidence

Screenshot pairs and raw laboratory samples are in `qa/studio-v3/`. Captures are Chromium emulation, not physical phones. Historical Gilt & Ruby activation medians (4.64/4.71/5.26 seconds) use another lab run and are not field timings. Read current before/after samples together with their recorded conditions; differences in browser, bundler and shared-host load limit historical comparisons.

## Physical-device acceptance

Physical iPhone Safari and Android GPU testing remains pending: portrait/landscape camera framing, VoiceOver/TalkBack, touch/scroll/pinch, context loss, warm/cold activation, thermal and battery behavior. No physical device result is claimed. No audio or live test email was added.

## Final local validation

- `npm run verify`: passed lint, type generation/type checking and 99/99 Node tests. Log: `qa/studio-v3/logs/verify.log`.
- `npm run build -- --webpack` in the mounted repository: passed. Log: `qa/studio-v3/logs/mounted-webpack-build.log`.
- Unmodified `npm run build` in the native copy of final application source: passed with Turbopack, 99/99 tests and static production generation. Log: `qa/studio-v3/logs/build.log`. The final scene and CSS hashes were compared with the mounted sources.
- Full Playwright run against that final default production build: **17 passed, 0 failed, 0 skipped**, 6.6 minutes. Log and JSON: `qa/studio-v3/logs/playwright.log` and `qa/studio-v3/after/browser/playwright-results.json`.
- Browser coverage includes all projects/services and quote links, manual exploration, tour/pause/completion, Previous/Next Room, reset without model reload, horizontal touch drag, pinch, vertical scrolling, keyboard/focus/Escape, reduced motion, slow connections, no WebGL/context loss/model retry, no-JavaScript HTML, no homepage GLB request, public metadata/routes and automated accessibility.
- Initial browser failures were obsolete assertions for the former homepage/consultation copy and automatic intro dismissal. Assertions now use the requested copy and explicit Start Exploring action. No behavior checks were disabled.
- 154 visual captures: 77 before and 77 after at 320/360/375/390/430/768/1440px. Each width includes homepage, welcome, four rooms with panels open/closed and landscape. `qa/studio-v3/comparison.html` presents all pairs. `qa/studio-v3/room-review.png` shows the final four-room contact sheet. Guided tour is also captured in `qa/studio-v3/after/guided-tour.png`.
- Visual review found and corrected the oversized reception logo, plant-blocked consultation camera, desktop overview in phone landscape, and homepage eyebrow under the fixed header. Final room compositions were inspected across all seven widths; individual homepage, reception, gallery, consultation, panel and landscape images were also inspected.

The clean baseline is commit `e76a995981bd18840013d1c44d3308c220c04506`. Existing historical QA files regenerated by the browser suite were copied into the V3 evidence folder and their original tracked versions preserved. Untracked `.agents` and `.codex` files were preserved.

## Reproduce

```sh
source /home/abuba/.nvm/nvm.sh
nvm use 22
npm ci --include=dev
npm run verify
npm run build
npm start -- --port 3100
# Separate terminal, same Node version; browser tests and measurements sequentially:
npx playwright test
QA_PHASE=after node scripts/studio-v3-visual.mjs
QA_CAPTURE=0 QA_PHASE=after node scripts/studio-v3-benchmark.mjs
```

For this mounted checkout's external dependency link, use the documented webpack build or a native source copy with dependencies inside its root. Performance samples do not measure physical GPU frame times, thermal behavior, field INP or production LCP. Homepage no-model loading and metadata are covered; field Core Web Vitals require post-approval production observation.

## Sequential laboratory performance

Both builds use default Turbopack, identical Node/browser/host, DPR1, cold browser contexts, 4x CPU throttling, 40ms latency and 10/5Mbps network emulation. Three activations per width; no other browser QA or build was running. Screenshot/drag collection was disabled for this measurement pass.

| Width | Current Gilt & Ruby baseline | V3 | Median difference |
| --- | --- | --- | --- |
| 390px | 4.01s | 4.34s | +8.1% |
| 768px | 4.12s | 6.09s | +47.9% |
| 1440px | 4.97s | 4.69s | -5.6% |

All 18 samples activated successfully and observed zero idle draws. Raw samples are `before/benchmark.json` and `after/benchmark.json`. The earlier concurrent exploratory batch is retained separately as `before/exploratory-contended-benchmark.json` and excluded.

The tablet median is higher in this small sample; its individual V3 values are approximately 4.36/6.10/6.31 seconds. Tablet camera/render settings and geometry are unchanged, and this measurement cannot distinguish host/software-GPU variation from an activation regression. Treat this as an unresolved laboratory variance, not a demonstrated speed improvement. Desktop activation remains within the existing lab range. No statistical significance or real-phone performance is claimed.

The activation batch preceded the final initial-landscape DPR/starting-position guard. That guard changes the 844×390 initial orientation branch; measured portrait/tablet/desktop branches are unchanged. Final build and focused landscape/layout checks cover the guard separately.

## Final landscape guard verification

After the 17-test full run, the initial-landscape guard was built with the default production command again (`logs/build-final.log`). The final focused browser run passed 4/4 checks: homepage/no-JavaScript, touch orbit/pinch/scroll, exploration/tour/details, and initial 844×390 landscape at DPR3 with canvas DPR capped at 1. The new layout check also passes at all seven requested widths with no horizontal overflow and every room button at least 44×44px. Evidence: `logs/playwright-focused.log`, `after/browser/focused-results.json` and `after/initial-landscape.png`. The full suite now contains 18 tests; the earlier full 17-test run and final focused 4-test run are reported separately, not represented as a single 18-test run.

A final `npm run verify` against the current mounted source passed lint, type checking and all 99 Node tests after this guard and the focused test were added. Both manifest and lockfile are unchanged (lockfile v3); `.bin/eslint` exists. The local review server runs at http://localhost:3102 from the native final production build.

## Changed-file summary

Application files: `app/agency-home.tsx`, `app/components/studio/VirtualStudioPreview.tsx`, `app/gilt-ruby-stage.css`, `app/studio/StudioExperience.tsx`, `app/studio/scene/StudioScene.tsx`, `app/studio/studio.module.css`.

Tests: `tests/e2e/virtual-studio.spec.mjs`, `tests/source-guards.test.mjs`. QA helpers: `scripts/studio-v3-benchmark.mjs`, `scripts/studio-v3-visual.mjs`. Documentation: this report. Generated evidence and the exact file inventory live under `qa/studio-v3/`; see `changed-files.txt`. No commit or deployment was made.
