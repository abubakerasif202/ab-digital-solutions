# Studio upgrade validation

Implemented locally on 7 October 2026. No deployment, commit or production test enquiry was performed. Two pre-existing untracked session-export documents remain untouched.

## Implementation

- Navigation: `app/site-chrome.tsx` waits for the mobile panel to become focusable, preserves its focus trap and cancels pending focus work on close.
- Homepage: `app/agency-home.tsx`, `app/components/ProjectShowcase.tsx`, `PortfolioSection.tsx`, `app/studio-premium.css`.
- Motion: existing `PointerFX`, `Hero3DExperience`, `Hero3DCanvas`, and intro components; new `app/components/motion/ProcessTimeline.tsx`.
- Work: `app/components/WorkIndexBody.tsx`, shared `app/work/[slug]/page.tsx`, `app/work/layout.tsx`, `app/work-premium.css`, intrinsic image proportions in `app/project-artwork.tsx`.
- Services and studio: both service templates, `app/services/service-data.ts`, about/contact pages, footer, `app/studio-pages.css`.
- Enquiry: shared `app/components/ContactForm.tsx` now exposes native validation errors through field associations; server integration, budgets, timeout, duplicate guard, value preservation and direct-contact fallback retained. Public default email is admin@abwebstudio.com.au.
- Evidence: six technology arrays corrected in the canonical portfolio registry; see `docs/portfolio-evidence-audit.md` for sources and uncertainty.

The browser stage uses real project captures, a labelled conceptual layout layer, 3-degree pointer tilt, depth/crossfade transitions, active project metadata and all previous/next/pause/direct-selection controls. Hover and keyboard focus pause independently. Offscreen/hidden tabs stop autoplay. The brand introduction is a nonblocking 1.4-second session accent; it does not download the former film. WebGL stays homepage-only, loads progressively, settles after input, caps DPR, pauses offscreen/hidden and disposes resources. Supporting depth uses CSS.

All 14 project routes and six service URLs remain. No fabricated mobile captures, private inventory records, new dependencies or SEO pages were introduced.

## Local gates

`npm ci` installed the existing lockfile without dependency-file changes. Node 22.23.1 / Next.js 16.3.8. `npm run build` passed its lint, type-check and 50-test verification gate and generated all routes. Final `npm run verify`: 50 passed, 0 failed, 0 skipped. `git diff --check` passed. Independent code review has no unresolved actionable findings.

Logs: `test-results/studio/build.log`, `test-results/studio/verify.log`.

## Baseline and measurement limits

The before lab measurements used the pre-existing local production build (Next.js 16.3.5), not a clean build of the initial source. After uses the lockfile version 16.3.8. Browser settings are comparable, but differences cannot be attributed exclusively to this visual upgrade. Details and raw samples are in `test-results/studio/BASELINE.md` and `performance-before.json`.

These are Chromium observer lab measurements, not Lighthouse scores or field Core Web Vitals. Field INP was unavailable. Initial concurrent after samples are diagnostic only; final isolated samples are reported separately.

## Remaining external evidence

Gala Rentals returns HTTP503 Service Suspended (confirmed twice); its existing destination is preserved. 4 Point Concrete deployment/source provenance remains uncertain; no stack was guessed. Existing HF and ZQ URLs redirect correctly and remain unchanged. The portfolio evidence audit records all 14 read-only destination checks.

## Responsive and runtime checks

The 26 content routes were checked at 320, 375, 390, 768, 1024, 1440 and 1920px: 182/182 route/viewport combinations had HTTP200, no horizontal overflow, one H1, correct canonical/metadata, valid JSON-LD and no broken decoded images. `verified-route-matrix.json` joins independent HTTP status checks with the DOM records; the original cached304 diagnostics remain available.

## Final isolated performance

Three cold-cache samples per width, with no concurrent browser work, use the baseline conditions above. Mobile390px LCP: 1636 / 900 / 936ms, median936ms; cumulative unexpected layout shifts: 0 in all three. Desktop1440px LCP: 1152 / 820 / 1044ms, median1044ms; cumulative unexpected shifts: 0.016316 in all three. All samples meet the requested LCP2.5s / shift0.1 thresholds. The shift metric conservatively sums observed unexpected shifts; it is not the standard maximum CLS session-window score. No field INP data is available.

The isolated check caught a mobile0.167 shift caused by the location label wrapping with a size-adjusted fallback before IBM Mono loaded. A narrowly scoped system monospace label removed that font-swap layout change. Before medians were772ms /1072ms LCP and0.00374 /0.00213 cumulative shifts (mobile/desktop); the existing-build/version caveat prevents attributing differences solely to these edits.

## Screenshots and reproducibility

Representative desktop/mobile artifacts: `test-results/studio/after-hero-1440.png`, `after-hero-390.png`, `1440-work.png`, `390-work.png`, `1440-work-247-inventory-system.png`, `390-work-247-inventory-system.png`, services/e-commerce/about/contact/privacy pairs, and process/work/services/contact section pairs. Full-page captures explicitly settle reveals/content visibility for capture; runtime checks use the actual interaction behaviour. Read-only production reference captures and the original before images are retained.

Tracked repeatable harnesses: `scripts/studio-browser-qa.mjs` and `scripts/studio-performance.mjs`. Delivery is mocked or aborted; browser QA refuses a production base URL. Raw reports and images are ignored local artifacts under `test-results/studio/`.

## Final functional result

52/52 browser interaction checks passed, zero failed: mobile menu initial focus, focus trap/Escape, work filters/counts, carousel controls/hover/focus/resume, homepage/contact native and malformed-input errors, mocked provider failure/success, loading/duplicate prevention and preservation of every entered field/choice. No-JavaScript samples, reduced motion, unavailable WebGL, coarse pointer, save-data and context loss passed. No unexpected console/runtime errors were observed, including guard pages. Four delivery requests were mocked; none were delivered. Final report: `test-results/studio/report-interactions.json`.

Delayed-font checks at320/390/1440px confirmed the location label retains its height throughout font loading without overflow. Final hero captures include320px. Final `npm run verify` passed50 tests with0 failures/0 skips after all source and harness edits; production build passed. No unresolved implementation findings remain.
