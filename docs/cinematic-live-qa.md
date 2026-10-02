# Cinematic production QA

Production target: `https://www.abwebstudio.com.au`.

## Approved brand and focused polish

The user supplied the luxury gold/ruby PNG. The original is retained unchanged at `public/brand/ab-logo-luxury-source.png`, SHA-256 `557D7657222034FF27AE353A03E5B0366E1F26CFDE909CBE6CAF16C6776CE2E6`. Optimized Next.js image assets provide the header/footer monogram and wordmark, full About artwork, Open Graph artwork and PNG application icons. Previous vector assets remain available; the static hero fallback retains the AB vector treatment.

The hero entrance now uses a bounded 12px rise, with tablet typography at 4.9vw; the existing 28px introduction margin is retained. Phone portfolio cards use `content-visibility: auto` with a 700px intrinsic estimate; measured rendered heights were 620–762px. The root's paired CDP samples showed initial LayoutDuration changes of approximately 104→80ms and 120→104ms. These are local profiling samples, not Core Web Vitals or final Lighthouse results.

## Browser scope and isolation

Run `scripts/cinematic-browser-qa.mjs` with `QA_BASE_URL` pointing to production. The runner uses the canonical portfolio and service registries, checks seven homepage viewports (1440, 1280, 1024, 768, 430, 390, 360px), and visits all thirteen case studies and six service pages. Every internal route is checked for HTTP 200, AB Web Studio title branding, description, one H1 and exact canonical URL. Case studies retain the registry's external live-site link. Internal routes also receive image-load and overflow checks at 1440 and 390px.

Contact coverage includes browser-native required-field/email validation, hidden honeypot structure, live status announcements and intercepted 200/503/429 responses. Exactly three contact requests are answered inside Chromium; no contact request reaches the production endpoint. Success resets fields; failure retains the enquiry and restores the enabled submit control. The 429 mock uses the backend's actual rate-limit message and checks that the UI displays it. These checks cover frontend behavior, not provider delivery or production rate limiting.

Fresh mobile and reduced-motion pages record WebGL context attempts and inspect fetched script bodies for Three.js renderer/program markers. Both must retain the static AB fallback without WebGL attempts or Three.js requests. Reduced motion also disables the custom cursor and running animations. A separate deliberately unsupported WebGL scenario confirms the static fallback; its exact Three.js context-creation error is recorded as an expected simulation. Mocked 503/429 network logs are likewise recorded separately from unexpected errors. Unexpected contact payloads are aborted inside Chromium and reported as a failed assertion.

Production Vercel telemetry remains active. The local-server telemetry substitution runs only for localhost/loopback targets. Asset HTTP failures, request failures, page errors and console errors are monitored on all pages.

## Evidence capture

Artifacts are local and ignored by Git under `test-results/cinematic-live/`. `report.json` contains individual assertions, timestamps, console evidence and failed-asset evidence. Screenshots include seven homepage viewports, desktop/mobile sections and cards, desktop/mobile internal routes, mobile navigation, contact response states, reduced motion and unsupported WebGL fallback.

Before screenshot capture, the runner visits individual reveal elements, including the footer, and waits for image completion. It then disables only the offscreen `content-visibility` optimization in the browser's capture DOM. Full-page captures taller than 16,000px use tiles of at most 8,000px stitched with the already installed Sharp runtime, preventing Chromium's tall-surface repetition. Overflow, heading spacing and footer geometry assertions run before that capture-only adjustment. Fixed mobile CTAs can appear within tall element screenshots at their viewport position.

## Initial deployment findings

The initial production run against cinematic commit `77a9e2e` completed with 155 passing checks and four harness failures: a hardcoded default mailbox assertion disagreed with the configured public mailbox, two portfolio-index image checks ran before lazy images completed, and the forced WebGL test's expected error was classified as unexpected. The runner was corrected to test the rendered branded mailbox, wait for images and narrowly classify the deliberate context failure. Initial production asset/request monitoring recorded no failures.

Visual inspection identified the footer domain link and location label running together at desktop/mobile sizes. The follow-up CSS change gives the domain its own row with a 44px target and displays the location below. The runner now checks their bounding rectangles at all seven homepage sizes.

At 1024px the wrapped red hero line overlapped the introduction because the previous 44% entrance translation grew with the wrapped line's height. The follow-up CSS bounds that rise to 12px and sets tablet typography to 4.9vw, retaining the existing introduction margin. The runner checks headline and paragraph bounding rectangles at every homepage viewport.

The root release audit separately found an obsolete 4 Point Concrete preview URL; the canonical registry now uses the verified existing deployment. Gala Rentals returned a third-party `ServiceSuspended` response during the external destination audit. That external service limitation does not affect its internal case study's rendering and is not a verified fix to the customer's deployment.

## Reproduce

```powershell
Set-Location -LiteralPath 'C:\Users\abuba\ab-digital-solutions'
$env:QA_BASE_URL = 'https://www.abwebstudio.com.au'
$env:QA_OUTPUT = 'test-results/cinematic-live'
node scripts/cinematic-browser-qa.mjs
```

## Final local build verification

The final production build served at `http://127.0.0.1:3100` passed **183 browser assertions with zero failures**. No asset/request failures or unexpected runtime errors were recorded. This includes all thirteen cases, six services, seven homepage viewports, desktop/mobile internal-route image and overflow checks, footer row separation, heading spacing, new luxury logo images, contact validation/honeypot/mocked responses and motion fallbacks.

The root's repository verification passed 44 tests, and the production build generated 30 pages. These local gates are separate from deployed runtime verification.

The actual head icon links resolve to the new 32px, 64px and 180px PNG artwork; manifest icons resolve to 192px and 512px PNG artwork. All five icon requests returned HTTP 200 and decoded at the expected dimensions. Hero screenshots at all seven widths and desktop/mobile section captures were inspected; the reported footer and tablet text collisions were resolved. Capture-only tile stitching was separately exercised on the four tall homepage screenshots after functional assertions completed.

Local functional evidence is in `test-results/cinematic-release-local/report.json`, with screenshots beside it. Deployment and live verification remain separate gates. Final deployed browser evidence is written to ignored `test-results/cinematic-live/report.json` and `test-results/cinematic-live/release-browser-summary.md`, so recording release results does not alter the committed source.
