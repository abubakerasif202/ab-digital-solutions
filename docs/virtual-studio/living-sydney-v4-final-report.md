# Living Sydney V4 completion and release evidence

Date: 30 October 2026. Repository: `abubakerasif202/ab-digital-solutions`.

**Release decision: Implementation, build, route and browser functionality gates PASS. Synthetic software-renderer performance FAILS; physical-device performance and release approval are PENDING. V4 has not been deployed or merged.**

## Recovery and rollback

- Recovered existing implementation on `feat/living-sydney-v4`; no restart, reset or unrelated cleanup.
- Starting HEAD and verified V3 rollback: `4534dfa2ae70c8c3f1f717ee0c3baf79b9377e0f`.
- Existing source, screenshots, benchmark samples and dirty historical QA files preserved.
- Remote main is merge commit `8ab9303e50eac71f40940d5d5acac100fbbd8d04`; GitHub comparison confirms its source tree has no differences from the supplied V3 rollback commit.
- Shell default was Node 20; validation uses Windows Node 22.23.1 (Linux 22.23.2 available).
- Existing Windows V3/V4 servers and an unrelated development server were identified. Only this task's own test processes were stopped. Final local V4 production server used port 3112 for browser QA, then port 8092 for diagnostics; Windows later excluded the original 3000-series ports.
- The saved `qa/virtual-studio/playwright.log` completed 15 tests. Its overwritten JSON contains one focused passing test, not an 18-test summary. The 18-pass recovery log is V3 evidence. Fresh full V4 suites were therefore required.
- Historical baseline checkout has linked dependencies that fail Turbopack's workspace boundary. A separate clean worktree at the exact V3 commit was created for a lockfile install and benchmark build.

## Completed integration and repairs

The existing original procedural Sydney exterior, harbour, Opera House shells, bridge, Australian left-side traffic, signals, pedestrians, articulated kangaroo, receptionist and staff remain interactive. No stock imagery, character videos or external character assets were substituted.

| Requirement or defect | Status | Evidence / resolution |
| --- | --- | --- |
| Reserved `world/layout.ts` | PASS | Already resolved as `world-layout.ts`; production route generation succeeds. |
| SceneClock React immutability lint | PASS | Imperative scheduler methods; final lint gate passes. |
| Kangaroo unused variable | PASS | No remaining warning in full lint. |
| Facade Array.from typing | PASS | Typed callback and production TypeScript pass. |
| Character imports and integration | PASS | All modules mounted under SceneClock; compiled production route. |
| Landmark far clipping | PASS | Camera far 560 covers the 340m sky dome and harbour scene; no short V3 far plane retained. |
| Exterior camera lane / framing | PASS | Establishing shot uses the centre gap; portrait opening lens widens to 88 degrees and eases to 80 so landmarks have room and the foreground lamp leaves the centre. |
| Interior facade obstruction | PASS | Desktop room shots moved inside the building so the facade sign cannot occupy the foreground. |
| Reception desk and welcome | PASS | Lowered existing counter; bounded greeting cue returns to work and resets on a return visit. |
| Kangaroo furniture clearance | PASS | Separate wildlife corridor; multi-seed travel/inspection clearance test. |
| Suspense animation startup | PASS | Registration wakes the scheduler if the first empty frame stopped it. |
| Idle polling / unnecessary invalidation | PASS | Removed permanent 2s polling; invalidate only after a system performs work. Internal tier changes and system registration no longer extend the visitor's idle deadline. |
| Frame budgets and capability tiers | PASS | Fractional intervals retained; two 24-frame downgrade windows; software renderers start low. |
| Character draw overhead | PASS | One rigidly skinned, vertex-coloured mesh per humanoid, retaining original transform hierarchy and facial motion. |
| Off-screen instance submission | PASS | Cars and pedestrians culled before packing draw counts; camera changes refresh visibility even while simulation rests. |
| Rig cleanup | PASS | Geometry and skeleton texture disposal tested. |
| Intro, skip, manual/tour and room controls | PASS | Complete 19-test local production browser suite, including the viewport regression. |
| Mobile camera controls outside viewport | PASS | Entrance/reset/tour now scroll the stage into view on explicit input; exterior has its own caption and room selection state. |
| Mobile layout and touch checks | PASS | All requested widths, initial landscape, 44px room targets, touch orbit/pinch/scroll and bottom-sheet assertions pass. Artistic review recorded below. |
| Forced SwiftShader / 4× CPU performance comparison | FAIL | All activations succeeded and the scene rests at idle, but measured active pacing was 0.58–2.59 FPS and activation medians regressed versus V3. See paired raw samples and limitations below. |
| Physical-device performance | PENDING | No physical iPhone, iPad or Android device available. |
| Deployment | PENDING approval | No production deployment or merge performed. |

## Verification

- `npm run build` includes `npm run verify`, which runs `npm run lint`, `npm run typecheck` and `npm test`.
- Final build gate: **PASS**, 154 Node tests, 0 failures, 37 generated static pages. See the whitespace-normalized captured log at `qa/living-sydney-v4/final/logs/normalized/build-final-visual.log` (the original terminal log remains in the local QA directory).
- Focused rig/behaviour suite:25 passed. Geometry tests compare transformed batched vertices with the original rigid parts and verify blinking and cleanup.
- Earlier V4 browser run exposed software-rendering interaction delays. It was stopped after10 tests (6 passed,4 failed) to implement batching and culling. Raw log preserved in `final/logs/playwright.log`.
- A subsequent run hit stale-server assets and was stopped. The next complete run passed 17/18 and exposed a quality-change idle deadline reset; that defect was repaired with two additional regression tests. Final verification used a fresh production server, full Chromium 1248, a separate results directory and unchanged meaningful assertions.
- Contact browser tests intercept `/api/contact`; no production enquiry sent.
- `git diff --check`: PASS for implementation paths. The full worktree check also passed; Git reported only CRLF normalization warnings for existing Windows-formatted files.

Final browser suite: **19/19 PASS**, no skipped or flaky tests, 237.4 seconds. This includes the mobile camera-control regression after timed captures exposed the viewport defect. Raw JSON: `qa/living-sydney-v4/final/playwright/playwright-results.json`. Local HTTP smoke: **29/29 PASS**, all 16 portfolio pages and six service pages; two initial service request timeouts passed on direct retry (`route-smoke-final.json`).

## Visual and animation evidence

Historical V4 captures remain in `qa/living-sydney-v4/captures/`. They show why the old desktop facade camera needed repair. Fresh evidence is generated with `scripts/living-sydney-final-qa.mjs`, using real elapsed time rather than the development-only camera-freeze hook. The final manifest records 78 screenshots across all eight requested viewport sizes, with no reported horizontal overflow or browser errors. It includes arrival at 0–15 seconds, all four room panels, street sequence, reception greeting/work and staff sequence: `qa/living-sydney-v4/final/visual/manifest.json`.

Required views: 320, 360, 375, 390, 430, 768, 1440, 844×390. Reviewed contact sheets and original captures show the street, studio entry, four room panels, receptionist, portfolio worker and staff travel across the studio. The introductory street view is stylized, with the Harbour Bridge arch visible and Opera House silhouette readable in the widened portrait frame. The 3D reception camera shows the receptionist above the lowered desk; the brass monogram sculpture remains visually dominant and the desk takes a large portion of the foreground. Treat this premium composition target as **PARTIAL**, not a complete visual pass. The diagnostic snapshots establish movement and animation poses but use forced high-quality capability and controlled virtual time; they are not representative performance samples or real-device GPU evidence. The visual manifest records 78 screenshots across all viewports. Motion manifest and 54 captures: `qa/living-sydney-v4/final/motion-diagnostic/manifest.json`; status `PASS_POSE_DIAGNOSTIC`, walking position changes observed.

## Performance comparison

The clean exact V3 worktree passed its production build and 99 Node tests. Final V3 and V4 browser benchmarks each completed nine successful activation samples (three each at 390, 768 and 1440 CSS pixels). One V4 Chromium context closed during the first desktop run; that failed attempt is preserved and a fresh replacement sample passed. Final merged data: `qa/living-sydney-v4/final/benchmark-baseline/benchmark.json` and `benchmark-v4/benchmark-final.json`. The interrupted raw set is `benchmark-v4/benchmark.json`; the replacement is `benchmark-v4-desktop-retry/benchmark.json`.

| Viewport width | V3 activation samples (ms) | V4 activation samples (ms) | Median V3 → V4 | V4 / V3 change | Median transferred bytes V3 → V4 | V4 draws / triangles per animated frame | V4 measured active pacing median |
| ---: | --- | --- | ---: | ---: | ---: | ---: | ---: |
| 390 | 3421, 5786, 8796 | 7380, 8742, 8497 | 5786 → 8497 ms | +46.9% | 342,053 → 376,863 (+10.2%) | 113 / 38,602 | 2.59 FPS (383 ms median frame gap) |
| 768 | 3559, 3219, 3581 | 6817, 7968, 13589 | 3559 → 7968 ms | +123.9% | 341,753 → 394,649 (+15.5%) | 249 / 58,608 | 1.15 FPS (833 ms median frame gap) |
| 1440 | 5567, 6381, 6314 | 13315, 14630, 10711 | 6314 → 13315 ms | +110.9% | 345,647 → 372,969 (+7.9%) | 254 / 60,368 | 0.58 FPS (1783 ms median frame gap) |

V3 is static during ambient periods, so it has no active animation FPS to compare. V4's active frames are instrumented RAF callbacks that submitted WebGL draws. First samples at all V4 widths recorded **zero draws in the 3-second post-rest window** after waiting through the 45-second idle period. Gesture wake samples recorded 1,015 / 2,016 / 1,520 draws over actual windows of 2.84 / 5.76 / 8.70 seconds; 4× CPU throttling stretches these beyond the nominal 1.5 seconds. V3 and V4 establish different camera views and V4 adds the Sydney exterior, so draw and triangle counts describe submitted scene work rather than a same-view microbenchmark.

**Performance status: FAIL under this synthetic stress contract; PENDING on physical hardware.** The renderer was ANGLE/SwiftShader, forced by Chromium arguments; DPR1, cache disabled, 4× CPU throttling, 40ms latency, 10Mbps down/5Mbps up. All nine V3 and nine final V4 activations succeeded. V4's measured animation pacing is below a smoothness target in this environment. Software rasterization plus 4× emulation is not a real iPhone, tablet, desktop GPU or normal browser configuration, so these FPS values are not device performance. V4 starts on the software-renderer low tier; its reduced animation density and this synthetic renderer affect the sample. Physical iOS/Android and hardware-accelerated Chromium measurements are required before production approval.

Benchmark contract: exact V3 rollback source versus final V4, production builds, same local Windows Chromium, SwiftShader, DPR1, cold browser contexts,4× CPU throttle,40ms latency,10Mbps down/5Mbps up, three samples at390/768/1440. No browser QA or builds run concurrently with benchmarks. Raw activation, transfer, frame submission and failure records are retained. Instrumented software WebGL is not an iPhone GPU measurement.

Ambient movement legitimately submits draws while active. After45s without input, the animation scheduler rests; hidden/reduced-motion alternatives suspend or replace the scene. No claim of zero draws during active ambient animation is made.

## Git and release

Implementation and evidence commit: `2059503`. Branch: `feat/living-sydney-v4`; parent / V3 rollback: `4534dfa2ae70c8c3f1f717ee0c3baf79b9377e0f`. Draft PR: [#31](https://github.com/abubakerasif202/ab-digital-solutions/pull/31), open against `main`, unmerged. This report is updated in a follow-up documentation commit.

Unrelated pre-existing AGENTS, skill, agent configuration and historical QA changes were excluded from selective staging. V3 rollback source remains available. The staged file manifest is `qa/living-sydney-v4/final/changed-files.txt`; branch and implementation commit will be recorded after the commit. Production remains V3; no live state is claimed from a local build or Git action.

## Reproduce local checks (PowerShell, Node22)

```powershell
npm.cmd run lint
npm.cmd run typecheck
npm.cmd test
npm.cmd run verify
npm.cmd run build
# In another terminal: npm.cmd run start -- --hostname 127.0.0.1 -p 8092
$env:QA_BASE_URL = "http://127.0.0.1:8092"
$env:QA_OUT = "qa/living-sydney-v4/recheck"
$env:CHROMIUM_PATH = "C:/Users/abuba/AppData/Local/ms-playwright/chromium-1248/chrome-win64/chrome.exe"
npx.cmd playwright test
node scripts/living-sydney-final-qa.mjs
# Run motion diagnostics and benchmarks separately, after browser QA has finished.
node scripts/living-sydney-motion-diagnostic.mjs
git diff --check
```
