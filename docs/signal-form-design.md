# Signal / Form — AB Web Studio

The cinematic extension is documented in [cinematic-upgrade.md](cinematic-upgrade.md). Release measurements below describe the original Signal / Form baseline; use the extension report for current validation.

## Direction and audit

The former homepage split attention between large serif headlines, a carousel and a background monogram. Layered theme styles created inconsistent colour inheritance, while most interior routes reused dark framed compositions. The existing canonical content, routes, contact protection, navigation accessibility and graphics lifecycle were sound foundations.

Three directions were considered: a technical atlas, a sculptural gallery, and a typographic broadcast identity. Signal / Form combines the strongest parts of the gallery and atlas: ink and mineral grounds, a controlled cobalt accent, a variable grotesk, precise rules and architectural form. The supplied AB logo remains authentic.

The homepage separates a clear proposition from a dedicated artwork stage. Large asymmetric project spreads introduce selected canonical projects; the Work index retains the complete registry. Capabilities become an editorial ledger, the process is a cobalt chapter, and enquiry fields sit on a quiet mineral surface. Interior work, case studies, services, about and contact share the same visual grammar.

## Original graphics

`signal-geometry.ts` generates a closed, twisted architectural ribbon with varying radius and width. A cobalt front, mineral reverse and four contour lines give its form depth. The static inline SVG projects and sorts the same deterministic geometry; it requires no image request or JavaScript to remain visible.

Three.js remains dynamically loaded after idle. Phones, coarse pointers, reduced motion and save-data use SVG. Constrained devices receive lower resolution. Rendering sleeps when settled, offscreen or backgrounded. Context failure returns to SVG. Geometry, materials, renderer, observers and listeners are disposed on unmount.

## Design contract

- Primary job: explain websites, software and operational systems, then invite an enquiry.
- Primary action: Start a Project. Secondary action: View Our Work.
- Palette: ink `#101114`, mineral `#e9e9e2`, cobalt `#3157ff`; lighter cobalt is reserved for dark surfaces.
- Type: self-hosted Schibsted Grotesk; IBM Plex Mono for indices and labels.
- Responsive: split artwork stage on desktop, compact stacked SVG on phones; unboxed layouts collapse to one column.
- Motion: short transform/opacity transitions, restrained pointer response, existing reveals and menu focus management; static reduced-motion presentation.
- Reject: new claims, substitute logos, invented results, generic cards, particles, decorative glows and interaction-blocking loading screens.
- CSS imports are centralized in the root layout, with the Signal contract last. Interior rules are explicitly scoped to avoid cross-route CSS leakage.

## Validation and release

Run `npm run build`, then `npm run start -- --port 3100`, then `node scripts/signal-browser-qa.mjs`. QA intercepts contact submissions and never sends an actual lead. Local Lighthouse reports and screenshots are written under ignored `test-results/`.

This is a feature-branch release. Review the PR and its screenshots before merging. No production deployment or live email delivery is implied by local checks. No database or environment changes are required. Rollback is a revert of the redesign commits followed by a normal Vercel deployment.

## Measured release evidence

- `npm run build`: lint, TypeScript, 51 Node tests and optimized production compilation pass; 34 generated route entries.
- Browser matrix: 320, 390, 768, 1440 and 1920px, with home, work, case study, services, service detail, about, contact and privacy samples. All canonical portfolio and service routes are also checked by HTTP.
- Additional checks cover immediate hero legibility, resize, first project imagery, reduced motion, no JavaScript and forced WebGL failure. Contact success, provider failure, rate limiting and duplicate prevention use intercepted requests; no lead is sent.
- Original graphics and responsive captures are included in `docs/screenshots/`. Browser automation is reproducible with `scripts/signal-browser-qa.mjs`; it refuses non-local origins.
- `npm audit --omit=dev`: zero vulnerabilities. Full audit reports five pre-existing high development-tool advisories in the braces / micromatch / fast-glob / Next ESLint chain. The offered forced downgrade is incompatible with this Next version; dependencies and lockfile are unchanged.
- Thirteen canonical client destinations return HTTP 200 (including expected redirects). Gala Rentals returns HTTP 503; its genuine project and URL are preserved. This external site requires separate attention.
- Local Vercel Speed Insights has no script endpoint and generates a 404/MIME console error. Browser QA stubs only that hosting-specific script. Lighthouse runs without that stub, so the effect remains visible in its Best Practices result.
- Local lab measurements do not establish production field Core Web Vitals or real provider delivery. The codebase graph connector was unavailable; source, registry and diff inspection provided the fallback audit.

### Final production-build measurements

The final browser run passed **116/116 checks**, with zero unexpected runtime/console errors. Ten additional targeted hero/resize checks passed. Automated contact checks intercepted exactly three requests; none reached the provider. Final code and TypeScript reviews approved with no remaining findings.

Lighthouse 13.5.0 measured the local production build in headless Chrome, sequentially without concurrent browser QA. Default mobile simulated throttling and the desktop preset were used; no Speed Insights stub was applied.

| Profile | Performance | Accessibility | Best Practices | SEO | LCP | TBT | CLS |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Mobile | 97 | 100 | 96 | 100 | 2.5s | 50ms | 0 |
| Desktop | 100 | 100 | 96 | 100 | 0.7s | 20ms | 0 |

All four categories exceed 90. The local hosting-specific Speed Insights error accounts for the Best Practices deduction. Full JSON evidence remains in ignored `test-results/signal-lighthouse-*-final.json`; the browser report is `test-results/signal/qa.json`.
