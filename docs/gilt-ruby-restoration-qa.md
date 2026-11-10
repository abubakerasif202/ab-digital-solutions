# Gilt & Ruby restoration — independent QA

## Scope
Restoration branch `fix/restore-gilt-ruby-studio-characters`, initial HEAD `8798146d92816f8402429579037ee43392de8081`; approved visual baseline `13ea815`; rejected redesign `73d841c`. No merge, production deployment or alias changes are authorized.

## Forensic inventory
- Core homepage, layout, about, services, contact, work, chrome and footer match the approved baseline exactly before follow-up QA.
- Staged removals are redesign CSS/imports, redesign-only test/evidence and obsolete test logs; no active route deletion.
- Preserve legitimate CI action upgrades in HEAD. Do not merge the redesign back from main.
- Preserve unrelated untracked `.agents/skills/` and `.codex/agents/` tooling outside restoration commits.
- Staff remain custom skinned meshes; pedestrians use nine instanced draws including one shared shadow draw. Shadow geometry/material disposal is owned by existing component/kit cleanup.

## Environment and initial gates
Node default is24; explicit process PATH selects installed22.23.1 without changing the machine default. No unexpected process NODE_ENV was present. No real environment files were read or edited.


`npm run build`: PASS lint, typecheck, 222 tests (zero fail/skip), production compile and 42 generated pages. Production-only audit: PASS zero vulnerabilities.
`npm ls --depth=0`: PASS. Manifest and lockfile unchanged; no dependency installation was needed for the existing healthy tree.

Production QA server3111 was started from the verified build; occupied3100 was preserved. Read-only production homepage probe returned200, Gilt/Ruby markup and no redesign stylesheet references. This does not establish all production routes or integration health.

## Follow-up fixes and safety
- Benchmark selector `Skip Intro` did not match actual `Skip intro`; corrected the exact label after observed benchmark timeout. No application timeout was relaxed.
- The old OpenDesign browser suite assumed a local mail key was absent. Its unmocked valid contact probe returned502 instead of expected503. The run was stopped; no provider acceptance or inbox delivery was established. A later failure-UI test was also unmocked.
- Valid direct contact API testing now requires explicit `QA_NO_DELIVERY=1`; the failure-UI test always intercepts503. All normal browser contact interactions remain mocked.
- Isolated production3113 starts with `RESEND_API_KEY`, Redis and ClickHouse credentials set to empty strings **inside the Node process before importing Next**, preventing dotenv from filling them. No actual env file is changed. `QA_NO_DELIVERY=1` is an assertion by the runner, not a production security setting; never use it against an ordinary credential-bearing server.

## Evidence
Full logs and raw browser/Lighthouse/profile artifacts: `test-results/restoration-20261111/` (ignored local evidence). Reviewable screenshots and final result summary will be recorded after checks finish. Never substitute local mocked-contact proof for provider or inbox proof.

## Release boundary and rollback
Original authorization was branch push/draft PR only. The owner subsequently authorized "push merge deploy"; release remains gated by validation. Before any eventual authorized production release, record and retain the current known-good immutable production deployment; rollback by promoting that exact retained deployment, not by deploying the broken current main. Production alias operations require owner approval.

## Final verification (11 November 2026)
Latest clean `npm run build`: lint, typecheck, 223/223 tests, 42 pages; `npm audit --omit=dev --audit-level=high`: 0 vulnerabilities.

- Playwright, full suite on a fresh production build: 59 passed, 1 skipped (production-only gate). With Playwright's bundled headless Chromium, 11 Studio WebGL tests timed out under software rendering; the same spec passes 24/24 with installed Chrome 157 (`CHROMIUM_PATH`), matching the earlier Chrome 152 result. Contact tests intercept `/api/contact`; nothing is delivered.
- Responsive and axe sweep, widths 320, 375, 390, 768, 1024, 1280, 1440, 1920: 319 checks, 319 passed, no failures or exceptions. Remaining console errors are the expected mocked contact 503 and the deliberate 404 route.
- Lighthouse 12.8.2 default mobile and desktop settings, three runs each against the local production build. Mobile 83/100/96/100 in every run (simulated LCP 4.62-4.69s, observed LCP 434ms, element `p.hero-intro`, CLS 0, TBT 40-42ms, five long tasks, three render-blocking stylesheets). Desktop 99/100/96/100 (LCP about 0.93s, CLS 0, TBT 0). Mobile target 90 is not met: the shortfall is Lighthouse's simulated 4x CPU and slow-4G model applied to blocking CSS and main-thread work, not a measured visibility delay. No configuration or design change was made to inflate scores.
- Studio: the 24-test spec covers entry/exit, controls, room navigation, wildlife interaction, keyboard, reduced motion, WebGL context loss, retries and teardown. Character closeups remain in `qa/restoration-20261111/characters/`. Render counts above are submissions, not presentation FPS, and not physical-device results.

## Updated release authorization
Owner subsequently instructed: "push merge deploy". Production release is now authorized after required gates, using only the linked Vercel project and preserving rollback deployment.

Retained pre-release rollback target: `dpl_GSBwqmspYHV1Xvvp7gDB7D8mFcLg`, `ab-digital-solutions-a174up1m0-abubakerasif202s-projects.vercel.app` (READY production at inspection).


## Resumed verification results
- Favicon fix: five affected viewport checks PASS5/5; complete Chrome152 Playwright PASS69, FAIL0, SKIP1 (production-only OpenDesign gate); all24 Studio tests pass. Logs five-final.log/full-final.log.
- Lighthouse mobile83/100/96/100; desktop99/100/96/100 (performance/accessibility/best practices/SEO). Mobile LCP4.39s,90% render delay; target90 not met. No measurement manipulation applied.
- Eight-width sitemap-based route sweep:317 checks,315pass,2fail, zero runtime exceptions. Failures are legacy homepage hero3D lifecycle/static-artwork assumptions that do not match restored baseline; investigate/update against actual approved behavior rather than suppress assertions. All route-width checks completed.
- Studio software WebGL, DPR1,4x CPU: mobile131 draws/60,910 triangles per active frame,12 frames/4.053s (~2.96 rendered fps); desktop293 draws/96,504 triangles,2 frames/4.013s (~0.50 rendered fps). Idle zero draws/3s on both. These are SwiftShader lab measurements, not hardware-device performance or an acceptable-smoothness claim.
- Character closeups remain unverified: separate source-matched QA mirror dev compilation/entry succeeds, but scene activation times out120s. Original dev3100 preserved. Production camera hook absent from all compiled JS.
- Vercel project default24.x; authoritative package engines22.x overrides settings per current official docs. Effective deployed build/runtime22 still requires new deployment proof. No project settings or credentials changed.
- RELEASE HELD: no commit/push/merge/deploy claimed. Known-good rollback dpl_GSBwqmspYHV1Xvvp7gDB7D8mFcLg retained. Required follow-up: mobile render-delay investigation, active-baseline QA lifecycle verification, reviewed character captures, native risk review, then authorized release and live verification.

Final production gate rerun PASS: lint, typecheck,223/223 tests, optimized build42 pages; production dependency audit0 vulnerabilities; git diff --check clean. Log build-final-complete.log. No commit or deployment performed.


## Recovery investigation: simulated versus observed LCP
The earlier 4.39s/90% render-delay interpretation described Lighthouse simulated throttling, not a measured3.9s visibility wait. The same report records observedLCP704ms and actual render delay689.867ms. A bounded production probe observed868ms; the hero paragraph computed animation:none,opacity1,filter:none,visibilityvisible,transformnone, with fonts loaded by316ms. The approved CSS already exempts the paragraph from entrance animations. Do not remove branding effects based on the simulated audit alone.

Initial main-thread and critical CSS work remain optimization candidates: three blocking stylesheets45,951 transferred bytes, estimated477ms blocking savings; adjusted style/layout1015ms and React scripting773.5ms. Below-fold containment already exists broadly. An instrumented forced-layout investigation is pending before any product change.

## Character and hardware verification recovered
The QA mirror was not hydrated when accessed via127.0.0.1:3112: Next's development HMR connection was blocked and the server-rendered Enter button had no React handler. Access via localhost:3112 restored hydration and scene activation without changing CSP or other security policy. All five requested camera-hook closeups were captured and visually inspected. No character rendering defect was established. Evidence: characters/ and dev-probe.json in the named local artifact directory.

Unthrottled Chrome152,DPR1,5s single samples using IntelIrisXe/D3D11 hardware:390px19.00 render submissions/s,median132draws65,430triangles;1440px20.53submissions/s,293draws101,012triangles. Matched forced software samples were2.79/.54submissions/s. These are instrumentation submission counts, not presentationFPS or physical-phone results; no blanket smoothness claim. Hardware reduced-motion windows0draws/2s. Hidden-tab unavailable(document.hiddenremainedfalse); offscreen samples include transitiondraws and are not settled suspension proof. See studio-unthrottled-renderer.json/log.
