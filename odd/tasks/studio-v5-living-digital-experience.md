# AB Web Studio — 3D Studio V5: Living Digital Experience
Branch: feat/studio-personality-polish. Delivery: local only; no commit, merge, push or deploy. Runner: Node 22, Playwright.

## Specs
- S1: "Investigate the root cause using Playwright traces, browser performance profiles, long-task detection, input responsiveness, canvas rendering and hotspot raycasting." "Compare behaviour against the original baseline." "Fix the underlying problem without simply increasing timeouts."
- S2: "Upgrade each existing room with purposeful detail." Preserve real project screenshots, Gilt & Ruby identity, architecture, consultation path and low render/download cost.
- S3: "Improve the existing kangaroo, koala, cockatoo, receptionist and studio staff." Preserve deterministic timing and avoid furniture collisions and repetitive motions.
- S4: "Preserve the corrected time-based camera easing." Improve framing and safe, interruptible movement across the existing shots.
- S5: "Test viewport widths 320, 360, 375, 390, 430, 768 and 1440px, including landscape." Preserve native scroll, adaptive quality and all fallback paths.
- S6: Run `npm run verify`, `npm run build` and relevant Playwright suite; provide fresh room screenshots, measurements, Git status and readiness.

## Tasks
- [x] T1 · S1, S5 · inline fix following delegated trace map · Compare traces and same-browser baselines; repair confirmed bottleneck.
- [x] T2 · S2 · delegated room writer · Refine four existing room sets and project displays.
- [x] T3 · S3 · delegated cast writer · Refine existing staged character animations and reactions.
- [x] T4 · S4, S5 · inline · Refine camera framing, transitions and device-aware interaction.
- [x] T5 · S5, S6 · integrated local verification · Run checks and capture fresh evidence without replacing existing QA.

## Log
- L1: Original request (verbatim)

~~~markdown
# AB Web Studio — 3D Studio V5: Living Digital Experience

Continue the existing implementation on branch `feat/studio-personality-polish`.

**Mission:** Transform the current `/studio` route into a visually exceptional, responsive, interactive luxury digital agency experience. Preserve the existing Gilt & Ruby identity, approved architecture, actual projects, working functionality, and all unrelated local changes.

Do not rebuild the project from scratch.

## Phase 1 — Diagnose and repair

Read the existing Codex session changes and inspect the current Git diff.

The previous session implemented deterministic camera FOV interpolation and a Harbour Bridge reception inlay.

The production build and 291 unit tests passed, but Playwright checks failed at 768px, 1440px and during the phone landscape/responsive test. All failed while attempting to click Reception.

Investigate the root cause using Playwright traces, browser performance profiles, long-task detection, input responsiveness, canvas rendering and hotspot raycasting.

Do not assume a GPU issue without evidence. Compare behaviour against the original baseline.

Fix the underlying problem without simply increasing timeouts.

Do not overwrite unrelated modified or untracked files.

## Phase 2 — Visual transformation

Upgrade each existing room with purposeful detail.

**Reception:** Create a spectacular opening impression with a premium illuminated AB monogram, detailed reception counter, realistic furniture, tasteful architectural lighting and recognisable Sydney-inspired design.

**Portfolio gallery:** Create a true interactive exhibition where website projects appear on beautifully designed digital displays. Use existing project records and genuine screenshots. Include subtle animated transitions when selecting projects.

**Services atelier:** Give every major service a distinctive physical or animated visual representation. Make the room feel like a sophisticated software development studio rather than a collection of generic blocks.

**Consultation lounge:** Create a warm, inviting premium meeting space with refined furniture, compelling lighting, realistic objects and a prominent path to starting an enquiry.

Prioritise believable geometry, physically plausible materials, useful reflections, strong composition and excellent readability.

Avoid unnecessary bloom, heavy postprocessing, excessive polygons or new download-heavy assets.

## Phase 3 — Living characters and wildlife

Improve the existing kangaroo, koala, cockatoo, receptionist and studio staff.

Add natural idle gestures, occasional social interactions, subtle facial and body movement, believable reactions and carefully timed moments of humour.

Keep behaviour deterministic and performance-aware. Prevent collisions, movement through furniture and distracting repeated animations.

Make interactions genuinely enjoyable without disrupting navigation.

## Phase 4 — Cinematic camera system

Preserve the corrected time-based camera easing.

Improve transitions between all four rooms, outdoor views and animal-focused camera shots.

Remove abrupt jumps, clipping through geometry, awkward FOV changes, unwanted camera movement and disorienting orbit constraints.

Allow visitors to interrupt or skip animations and navigate directly to any room.

Maintain appropriate camera framing on phones and tablets.

## Phase 5 — Mobile experience

The mobile Studio must receive the same creative quality as desktop, with intelligently simplified detail rather than a completely different or lifeless experience.

Test viewport widths 320, 360, 375, 390, 430, 768 and 1440px, including landscape.

Preserve native vertical page scrolling, accessible navigation, readable controls and smooth touch interactions.

Use adaptive rendering quality based on actual performance and device capability.

Honor reduced-motion settings, data-saving preferences and WebGL fallback states.

## Phase 6 — Testing and verification

Run:

`npm run verify`

`npm run build`

Then run the relevant Playwright Studio suite using a compatible browser.

Capture fresh screenshots of every room on desktop and mobile.

Verify keyboard navigation, touch controls, project selection, consultation links, camera reset, guided tour, scene loading and recovery after WebGL failure.

Measure interaction responsiveness and rendering performance instead of making unverified performance claims.

Fix reproducible regressions and rerun their tests.

## Delivery requirements

Provide a clear report containing:

- Visual improvements completed
- Files modified
- Root cause and resolution of browser timeouts
- Screenshot locations and tested viewport sizes
- Actual test results and remaining limitations
- Performance measurements and trade-offs
- Git status and deployment readiness

Do not commit, merge, push or deploy until the browser failures are resolved and the result has been visually verified.

**Creative objective:** The experience should make visitors want to explore AB Web Studio, appreciate its technical capability, examine its real projects, and ultimately contact the agency.
~~~

- L2: Original committed baseline fbd6f8d; current working baseline includes the four pending prior-session files. Keep both distinct in diagnosis. Old trace shows distinct click-stage stalls with visible, enabled controls; no established cause yet.
- L3: Compared committed and prior working builds against installed Chrome with forced SwiftShader; correlated old ReadPixels warnings with real slow render paths. Removed skinned cast from hotspot occlusion, disabled immutable context MSAA and applied measured DPR budgets.
- L4: Room and cast writers completed scoped focused checks; review caught imperative DPR reset and camera hook lint. Corrected both, reviewer readback confirmed the seams. First integrated candidate: 299 unit tests, 24 browser tests.
- L5: Settled visual captures exposed an orientation issue in the stacked portrait panel. Camera now uses device orientation, a raised portrait atelier shot and a wider desktop atelier panel view. Added focused RED/GREEN camera check; final build and browser recapture underway.
- L6: The 768px overlay geometry assertion failed against the previous candidate and passed after the narrow-tablet detail layout was stacked. Stable device orientation and portrait/desktop atelier shots recaptured after the change.
- L7: Final Node 22 verify and build passed (300 tests); hardware Chrome Playwright passed 24/24 at requested widths and landscape. Inspected final 1440px and 390px contact sheets plus tablet atelier, and saved 12 room images and browser evidence in qa/studio-v5/. Performance table and caveats are in docs/virtual-studio/studio-v5-delivery-report.md.
- L8: Local only, nothing staged or committed. Physical phones, Safari, live deployment and enquiry delivery were not verified.
