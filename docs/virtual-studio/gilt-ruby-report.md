# Gilt & Ruby studio refinement

30 October 2026 (Australia/Sydney). Baseline: merged PR #28,
`bc56f2141ec0855b734198a6d8e049bad2101ac2`. At verification, changes were local, uncommitted and
not deployed. The user subsequently authorized push and deployment; release
status is tracked separately from this verification snapshot. Physical-device checks remain pending with the user's explicit
agreement to continue.

## Implemented

- Shared, original 256px procedural marble veining and brushed-brass roughness
  maps. Reception, service plinths, wall inlays and consultation tabletop share
  the marble texture instead of creating a separate map for every block.
- Original beveled ruby armchairs with arms and brass pedestal bases, a ruby
  reception bench, softened marble countertop and a planted lounge corner.
- Marble and ruby wall niches, warm integrated light strips and a warmer fill
  balance. Existing glass divisions, brass framework and four-space floor plan
  remain. No new dynamic lights, shadow passes or postprocessing were added.
- Lower, closer room camera shots, bounded 1.7-second quintic easing with gentle
  arrival/departure, and smoothly animated framing around HTML panels.
- On phones, a shorter bottom sheet occupies at most 48% of the stage. The selected
  room is framed above it. Native vertical page scrolling and panel scrolling
  remain available; focus and Escape behavior are preserved.
- Explicit sideways-drag/pinch/page-scroll instructions and a **Reset view**
  button that restores the overview without requesting the model again.
- Instanced wall fluting (38 instances in one draw), limited bevel tessellation,
  and a 128px generated reflection environment instead of 256px.
- Regenerated authentic 1440 × 900 fallback/homepage/social poster. Original AB
  GLB, project textures, all 16 canonical projects, four services, navigation,
  static SEO directory, schema and existing contact workflow are preserved.

No dependencies were added. Mobile DPR remains capped at 1, desktop at 1.5.
The scene stays intent-loaded, uses demand rendering, and suspends offscreen.
Reduced motion, slow connections, unsupported/lost WebGL, timeout and retry
behavior remain in the existing experience.

## Email and physical-device evidence

Exactly one authorized production enquiry was submitted through the live form.
HTTP 200 and the success UI confirmed provider acceptance. The user subsequently
supplied an iPhone Mail screenshot containing the matching subject and marker
`AB-STUDIO-QA-20261029-GILT-RUBY`, confirming mailbox receipt. No additional live
email was sent. Automated form regressions intercept requests.

The screenshot establishes email arrival, not Safari showroom behavior. No real
phone or physical-device lab is connected, so iPhone/Safari interactions,
physical GPU activation, thermal behavior and field performance remain unverified.
See [validation evidence](gilt-ruby-validation.md) for the device protocol.

## Review artifacts

Open [the side-by-side screenshot gallery](../../qa/gilt-ruby/comparison.html):
15 before/after pairs covering all four rooms and the overview at 390, 768 and
1440px. Raw measurements live beside them in `before/benchmark.json` and
`after/benchmark.json`. The viewport is 1000px high, DPR1, with the same capture
sequence. Room camera framing and mobile sheet placement intentionally change.

Controls are documented in [controls.md](controls.md), and original asset sources
in [asset-provenance.md](asset-provenance.md).

## Changed source files

- `app/studio/scene/Architecture.tsx`: wall treatment and instanced fluting.
- `app/studio/scene/Materials.tsx`: shared procedural surface maps and cleanup.
- `app/studio/scene/Spaces.tsx`: furniture, countertop and lounge composition.
- `app/studio/scene/StudioScene.tsx`: lighting, reflection size and camera framing.
- `app/studio/scene/camera-motion.ts`: bounded smooth camera easing.
- `app/studio/StudioExperience.tsx`, `studio-state.ts`, `studio.module.css`:
  reset interaction, clearer controls and responsive sheet.
- `public/studio/studio-poster.png`: rendered fallback preview.
- `tests/studio-camera.test.mjs`, `tests/virtual-studio.test.mjs`,
  `tests/e2e/virtual-studio.spec.mjs`: camera, reset and mobile-sheet regressions.
- `scripts/gilt-ruby-benchmark.mjs`: repeatable before/after measurements and
  captures; docs and QA evidence accompany the implementation.

## Measurement interpretation

Measurements use local production Next.js, headless Chromium with software WebGL,
DPR1, cold browser-context cache, 4× CPU throttling, 40ms latency and 10Mbps down /
5Mbps up. There are three activation samples at each width. Activation is measured
from intent to the intro/explore state, including module/resource loading and
scene preparation. These are shared-host laboratory measurements, not iPhone
measurements, Lighthouse scores or guaranteed real-world timings.

Orbit telemetry records WebGL draw submissions and submitted triangles during a
short manual drag on the first run at each width, including instanced submissions.
It is not a complete frame-time, GPU-memory, thermal or battery benchmark. Idle
checks observe draw submissions during 1.2 seconds after motion settles.


## Reproduce locally

With Node 22 and lockfile dependencies installed:

```sh
npm run build
npm start -- --port 3100
# Separate terminal; run browser tests and benchmark sequentially:
npx playwright test
QA_PHASE=after node scripts/gilt-ruby-benchmark.mjs
```

Use the unchanged PR #28 production build with `QA_PHASE=before` for the baseline.
The benchmark supports `CHROMIUM_PATH` and local `QA_BASE_URL`. Do not run other
GPU/browser tests concurrently with performance measurements. All comparison
images and raw samples are retained; the initial desktop sample has a substantial
outlier, so medians and individual samples should be read together.


## Verification

- `npm run build`: passed lint, type checking, 99 Node tests and production
  generation, including the regenerated poster.
- Final scoped ESLint check of the benchmark and browser regression file: passed.
- `npx playwright test`: **16 passed**, no skipped/flaky tests in the final run,
  approximately 5.2 minutes. Raw JSON and log are in `qa/gilt-ruby/`.
- Verified 390/768/1440px layouts, all four panels, 16 projects, project mesh
  raycasting, quote links, touch orbit/pinch/native scrolling, keyboard focus,
  Escape, tour completion, wheel scrolling, idle draw suspension, reduced motion,
  slow connections, unsupported/lost WebGL, model failure/retry, repeated mount
  teardown, no-JavaScript HTML and existing public routes/metadata/no overflow.
- Automated WCAG checks on the studio and portfolio panel: passed with zero
  violations in the checked rules. This does not replace manual assistive-tech
  or physical Safari testing.
- Existing form required-field checks and mocked failure/retry/success: passed.
  No additional real email was sent.
- New regressions cover camera clamping/symmetry/gentle endpoints, reset state,
  mobile sheet bounds, exact visual restoration and no model reload on reset.

An initial full run had one exact reset-image mismatch. Four isolated executions
passed. The regression now establishes a stable reference frame and polls for the
rendered endpoint rather than relying solely on a fixed delay; no image tolerance
was relaxed. The subsequent full 16-test run passed.

The unchanged production site has not been redeployed. Before release, perform
physical iPhone/Safari and Android GPU checks using the recorded protocol, and
obtain deployment approval. There are no known outstanding local functional test
failures; physical-device performance remains unverified.


## Before/after results

Three cold activation samples per viewport, median shown:

| Width | Before | After | Change | Orbit max draws, before → after | Submitted triangles, before → after |
| --- | --- | --- | --- | --- | --- |
| 390px | 9.16s | 4.64s | -49.4% | 148 → 123 | 4,722 → 9,602 |
| 768px | 9.66s | 4.71s | -51.3% | 155 → 128 | 4,806 → 9,662 |
| 1440px | 10.71s | 5.26s | -50.9% | 155 → 128 | 4,806 → 9,662 |

All 18 before/after samples activated successfully and recorded **zero idle draws**
during the observation window. Additional activation transfer increased from
343,448 to 344,878 bytes (+1,430 bytes, about 0.4%). Furniture approximately doubles
submitted triangles to fewer than 9,700 in the sampled view; instancing lowers draw
submissions by about 17%. The reduced reflection resolution accompanies a roughly
49–51% lower median activation time in this software-GPU lab. Three samples per
width do not establish statistical significance or physical-device improvements.

The source poster grew from 243,656 to 260,852 bytes (+17,196 bytes); browsers use
responsive Next Image derivatives. Initial LCP and field INP were not rebenchmarked
in this comparison. No new visual postprocessing or continuous render cost was
introduced. Physical-device acceptance remains the outstanding performance check.
