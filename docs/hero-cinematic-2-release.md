# Cinematic Hero 2.0 release evidence

## Recovery

Continued `feat/hero-cinematic-2` from `1aec0ec9f15ad0666d50b08c83b8f52647f97236` (PR #24). Initial tracked edits only added `@tabler/icons` to the package manifests; no application source implementation was present. Those manifest changes, the nested extracted project, and existing untracked QA/release documents were preserved and excluded from this release. An existing production-mode server on port 3100 supplied the baseline; subsequent builds used separate local servers. Installed framework: Next.js 16.3.8, React 19.2.8, TypeScript 5.9.3, Three.js 0.185.1; local Node 22.23.1.

## Implementation

- `Hero3DCanvas.tsx` extends the existing renderer and authentic image plane with a 4.6-second assembly, 450 tablet / 900 desktop gold/ruby particles, a metallic light sweep and small camera dolly. The particle dataset is dynamically imported after the existing idle/pointer-intent gate. No second hero canvas or new animation dependency was added.
- `film/logo-reveal-math.ts` extracts the existing deterministic assembly calculations shared by the film reveal and hero. A shared session key prevents full automatic replay between sections/routes. The hero stops rendering when settled, offscreen or hidden; its resources are disposed on teardown. Mobile, coarse pointers, Save-Data, reduced motion and constrained devices retain the existing static fallback.
- `PointerFX.tsx` reuses the existing listener for up to three pixels of CTA icon magnetism across the shared header, services and portfolio. Button hit areas remain fixed. Existing portfolio tilt/reveals, interior title entrances and reduced-motion handling remain in place, with no additional motion system.
- `studio-harmony.css` refines hero spacing, mark placement, paragraph rhythm, CTA focus and small-phone button stacking; removes overlapping CSS hero parallax where WebGL already controls it. Existing content, navigation and business facts are preserved.
- `LogoReveal.tsx` defers its two previously eager below-fold logo images, avoids automatic heavy animation on constrained devices, and cancels work on unmount, hidden tabs, offscreen changes, resize and reduced-motion changes. Async import generations prevent stale animation starts.
- `BrandFilmPlayer.tsx` preserves both existing encodes, poster, chapters and click-to-load behavior. Playback pauses offscreen/hidden; failed media can be retried; rejected playback clears the spinner. The play button's accessible name now includes its visible label. Film CSS adds focus treatment and framing while removing the perpetual play-button pulse.
- Contact limiter uses an atomic Redis transaction, hashed visitor keys, bounded local fallback, HTTPS endpoint validation and 429 retry/cache headers. Existing API validation, origin checks, honeypot and delivery acceptance checks remain. See [exact environment steps](hero-cinematic-2-contact-configuration.md).

## Verification method

`npm run build` runs lint, typecheck, all Node tests, then the production build. `scripts/hero-cinematic-2-qa.mjs` uses real headless Chromium against the production build. It checks the home/services/work/about/contact routes at 320, 375, 390, 430, 768, 1024, 1440 and 1920 pixels, captures screenshots, instruments WebGL drawing, verifies media gating/playback/seeking/offscreen pause, reduced motion, mobile fallback, axe accessibility and mocked contact 503/429/success with duplicate-submission prevention. Contact requests and telemetry are intercepted; no real enquiry is sent.

Lighthouse 13.5.0 runs on localhost against production builds, using default simulated mobile and desktop presets with cold storage. Scores are lab snapshots on this machine, not production field measurements. Full artifacts remain under ignored `test-results/hero-2/`; selected review evidence is checked in under `qa/hero-cinematic-2/`.

## Remaining limitations

- Redis credentials are absent in Vercel. Distributed protection remains unverified; per-instance fallback remains explicitly logged to preserve submission availability.
- Native Safari/iOS and physical Android devices are unavailable; Chromium touch/reduced-motion checks do not establish native Safari compatibility.
- No valid field INP dataset is available. TBT is reported separately and is not INP.
- CSS inlining was trialled and rejected after a mobile regression (76 performance, ~4.90s LCP, ~248ms TBT versus 84/~4.43s/~59ms on the first non-inline candidate). Final configuration retains the existing external stylesheets and font setup.
- One pre-existing lint warning remains in `.remember/tmp/last-ndc.ts`; lint has no errors.
- Production merge/deployment is not authorized. Preview delivery is intentionally disabled even if a mail credential were present.

## Final measurements and outcomes

| Lab run | Performance | Accessibility | SEO | LCP | CLS | TBT | Transfer |
|---|---:|---:|---:|---:|---:|---:|---:|
| baseline-mobile | 82 | 100 | 100 | 4.91s | 0.00005 | 26.0ms | 905.6 KB |
| baseline-desktop | 99 | 100 | 100 | 1.02s | 0.00179 | 0.0ms | 981.0 KB |
| final-mobile | 84 | 100 | 100 | 4.52s | 0.00005 | 59.0ms | 610.8 KB |
| final-mobile-repeat | 84 | 100 | 100 | 4.49s | 0.00005 | 50.5ms | 610.8 KB |
| final-desktop | 99 | 100 | 100 | 0.93s | 0.00172 | 0.0ms | 686.3 KB |

Mobile initial transfer falls by 32.5%. Mobile 90+ performance and sub-2.5s LCP targets remain unmet. Desktop, accessibility, SEO, CLS and TBT lab results meet the corresponding goals. INP has no valid field measurement. JavaScript transfer/resource bytes and initial image/media bytes are recorded separately in `qa/hero-cinematic-2/lighthouse-summary.json`; video requests are zero on initial navigation. The actual Three.js chunk (`3sanoyc5p0snu.js` in this build) is absent from the mobile network record.

Final validation: PASS — 82 Node tests, lint (one existing warning), typecheck, production build (36 prerendered pages), 79 Chromium QA checks and five supplemental navigation/no-JavaScript checks. No browser exceptions or unexpected console errors were observed. No source, package, hosting or production environment configuration changes beyond the scoped implementation are included.

Review screenshots: [mobile 390px](../qa/hero-cinematic-2/mobile-390.png), [tablet 768px](../qa/hero-cinematic-2/tablet-768.png), [desktop 1440px](../qa/hero-cinematic-2/desktop-1440.png). Full responsive captures for all eight widths remain in `test-results/hero-2/browser/`.
