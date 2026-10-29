# AB virtual studio — implementation and verification

## Scope and reconstructed starting point

Work resumed from the uncommitted virtual-studio implementation on repository
base `018198c`. The existing site uses Next.js 16 App Router, React 19,
TypeScript, Three.js, Node tests and Puppeteer scripts. Its project and service
registries, contact handler, typography, security headers and primary navigation
remain the source of truth. There was no existing `/studio` route or Playwright
suite in the base revision.

The interrupted implementation already contained the route, scene, reducer,
content panels, a homepage preview and a small generated monogram. It had not
completed browser verification and still had a placeholder poster. Resumption
fixed the actual build and runtime issues rather than replacing that work.

## Delivered behavior

- A separate, static/SSR `/studio` page with its own canonical metadata, social
  image, schema, sitemap entry and ordinary HTML project/service directory.
- An intent-loaded original cutaway studio built with React Three Fiber and
  Drei, preserving Bodoni Moda, Schibsted Grotesk and IBM Plex Mono.
- Reception with an original extruded AB GLB, brass arch, marble counter,
  opening camera reveal and brief gold-particle animation.
- A portfolio gallery with three physical, clickable project displays and
  an HTML selector for all 16 existing case studies, preserving destination
  classifications and authentic project imagery.
- Four service installations for web design, SEO, branding and AI automation,
  each opening usable content and an existing service/contact CTA.
- A consultation lounge with a genuine `/contact` quote pathway. The existing
  form, validation, provider, rate limiting and analytics are unchanged.
- Guided tour, manual orbit, touch gestures, labelled hotspots, keyboard
  navigation, Escape/Close focus restoration, Skip Intro, still view and Exit.
- Still-image/HTML behavior for reduced motion, Save-Data/2G, unavailable WebGL,
  context loss, chunk/model failures and JavaScript-disabled browsing.
- A static homepage preview after the existing brand-film section. It never
  imports the studio canvas or model resources.

## Fixes established through verification

- Narrowed the existing `Reveal` component's HTML tag type to avoid a union
  overflow caused by R3F's additional JSX intrinsics. This is a type-only
  change with no visual or behavioral alteration to existing pages.
- Disabled unnecessary Draco/Meshopt decoder initialization; the original GLB
  needs neither. This preserves the existing CSP without enabling unsafe eval
  or downloading decoder code from external hosts.
- Kept R3F canvas fallback content free of side effects; it can mount even on
  browsers that support WebGL.
- Retained the loading watchdog when the intro is skipped before assets finish.
- Isolated HTML hotspot portals in their own overlay so canvas teardown cannot
  race React's DOM cleanup. Cloned the cached model hierarchy per mount.
- Attached orbit controls directly to the canvas, preserved native vertical
  touch panning and mouse-wheel page scrolling, and constrained orbit/pan.
- Cleared failed GLB and display-texture cache entries before a retry.
- Framed the studio on entry and room selection so panels and Skip Intro remain
  reachable below the sticky navigation. Replaced font-dependent arrow glyphs
  with SVGs.
- Used a 1.7-second elapsed-time camera transition so slower GPUs cannot stretch
  an animation into an extended frame-count-dependent movement.

## Performance decisions

The canvas uses demand rendering and suspends offscreen or while the document
is hidden. Tour timers pause offscreen; manual input cancels automatic movement.
DPR is capped at 1 on phone-width viewports and 1.5 otherwise. Only desktop-width
viewports enable antialiasing. There are no continuous shadows, bloom pipelines,
external HDRIs or physics engines. Architecture is procedural and the original
monogram has 576 triangles (58,476 bytes). Three generated 512px WebP display
textures total approximately 53 KB; higher-resolution originals remain available
for ordinary HTML portfolio content.

## Changed-file guide

| Location | Purpose |
| --- | --- |
| `app/studio/page.tsx` | Static page, metadata, schema and HTML directory |
| `app/studio/StudioExperience.tsx` | Intent/loading/fallback policy, panels and accessible controls |
| `app/studio/studio-state.ts` | Reducer for entry, intro, tour, manual input, panels and failures |
| `app/studio/studio-data.ts` | Minimal content derived from existing registries |
| `app/studio/scene/StudioScene.tsx` | Canvas, lighting, camera rig, resource reset and context lifecycle |
| `app/studio/scene/Architecture.tsx` | Original architectural geometry and procedural marble |
| `app/studio/scene/Spaces.tsx` | Reception, gallery displays, service sculptures and consultation furniture |
| `app/studio/StudioArrow.tsx`, `app/studio/studio.module.css` | Scoped visual system and SVG navigation glyphs |
| `app/components/studio/VirtualStudioPreview.tsx`, `app/agency-home.tsx` | Server-rendered homepage preview |
| `app/sitemap.ts` | New studio sitemap entry |
| `app/components/motion/Reveal.tsx` | R3F-compatible HTML tag typing |
| `package.json`, `package-lock.json` | R3F/Drei runtime packages and Playwright development dependency |
| `public/studio/` | Original monogram, rendered poster and derived display images |
| `scripts/generate-studio-assets.mjs`, `scripts/capture-studio-poster.mjs` | Reproducible local assets |
| `scripts/virtual-studio-performance.mjs` | Repeatable local production measurements |
| `tests/virtual-studio.test.mjs` | Reducer, canonical content and asset contracts |
| `tests/e2e/virtual-studio.spec.mjs`, `playwright.config.mjs` | Browser interactions, responsive and fallback coverage |
| `qa/virtual-studio/` | Screenshots, logs and machine-readable verification evidence |

See [controls](controls.md) and [asset provenance](asset-provenance.md).

## Verification results

Verified on Node **22.23.4**, Chromium **154.0.8037.57**, against the local
production server on port 3100. No production deployment was used.

| Check | Result |
| --- | --- |
| `npm run build` | Passed: lint, TypeScript, all 96 Node tests and production compilation/static generation |
| Final `npm run lint` | Passed after the final browser-test assertion correction |
| `npx playwright test` | **15 passed**, 0 failed, 0 skipped; final full run 331.6s |
| Route/asset HTTP sweep | **32 successful responses**, correct single H1 on HTML pages |
| Responsive coverage | Studio and main routes at **390, 768, 1440px**; no horizontal overflow |
| Touch | Native-event drag/orbit, two-finger zoom, vertical page swipe; phone-width canvas DPR capped at 1 even with device DPR 3 |
| Keyboard | Entry/Skip Intro, panel heading focus, normal Tab traversal, Escape/Close focus restoration |
| Portfolio/services | Physical display raycast opens the correct project; selectors expose 16 projects and four services |
| Tour/lifecycle | Four spaces, genuine contact destination, manual interruption, repeated entry, model retry and context-loss recovery |
| Contact | Required-field validation, intercepted 503 recovery and successful POST, retry identifier retained; real server handler covered by existing mocked-provider tests |
| Fallbacks | No JavaScript, no WebGL, lost context, failed model after Skip Intro, reduced motion, Save-Data and 2G |
| Accessibility | No axe violations for tested WCAG 2 A/AA and 2.1 AA rules on the studio and portfolio panel |
| Idle GPU work | No additional instrumented draw calls during the 1.2s quiet window after settling |

One early regression assertion assumed the homepage canonical had a trailing
slash. The existing canonical without a slash was preserved; the assertion was
corrected. The complete subsequent 15-test run passes. Intermediate software-GPU
runs also exposed the frame-count-dependent camera easing and portal cleanup
race, both corrected before the final run.

### Repeatable local performance

`node scripts/virtual-studio-performance.mjs` collected **18 samples**: three
cold per-context browser-cache runs for each route/width, DPR 1, 4× CPU throttle,
40ms RTT, 10Mbps download/5Mbps upload. These are local production measurements,
not Lighthouse scores, field CWV or INP.

| Width | Homepage median LCP | Studio median initial LCP | Studio median initial transfer |
| --- | --- | --- | --- |
| 390px | 0.928s | **0.736s** | 502,514 bytes |
| 768px | 0.976s | **0.784s** | 504,778 bytes |
| 1440px | 1.012s | **0.804s** | 516,983 bytes |

The observed cumulative unexpected layout-shift total was **0** in these short
samples. This is not a field CLS guarantee. No GLB was requested before entry in
any sample. The homepage retains its existing decorative hero implementation.

**Optional 3D startup remains the hardware-sensitive cost:** intent-to-scene-ready
took **9.09s / 9.89s / 10.51s** at the three widths in this throttled, software-WebGL
lab. All reached the intro successfully and transferred another **343,448 bytes**.
This measurement includes client scene initialization and is not INP or a
physical-GPU estimate. The still image/HTML remains the default; loading has
Skip Intro and a 20-second failure watchdog. Check cold activation on physical
mobile GPUs before approving release.

Raw evidence: `qa/virtual-studio/build.log`, `playwright.log`,
`playwright-results.json`, `http-results.json`, `performance.json`,
`performance.log` and `source-sha256.json`.

To reproduce, with Node 22 and the production server running:

```sh
npm run build
npm start -- --port 3100
# In a separate terminal:
npx playwright test
node scripts/virtual-studio-performance.mjs
```

Use Playwright's installed Chromium or set `CHROMIUM_PATH`. The harness uses
`/usr/bin/chromium` automatically where available. Set `QA_BASE_URL` to another
local port if necessary. Performance and asset-capture scripts reject nonlocal
origins.

## Limits and release status

Real email delivery is not exercised without the deployed provider credentials.
Browser submissions are intercepted locally, and Node tests exercise the real
contact handler against mocked providers. No test enquiry is sent to the live
business. Chromium touch emulation and software WebGL do not replace physical
iOS/Android and Safari checks. Performance figures are local lab measurements,
not Lighthouse scores or field Core Web Vitals.

The owner subsequently authorized push, merge and production deployment. The
verified source is being released through the existing GitHub/Vercel project;
release commit and live verification are recorded separately in the release handoff.

## Screenshot guide

Each width has entry, active studio and room-panel captures in
`qa/virtual-studio/`. The homepage and fallback captures are in the same folder.

| Viewport | Active scene | Portfolio panel |
| --- | --- | --- |
| 390px | [Mobile studio](../../qa/virtual-studio/390-studio.png) | [Mobile portfolio](../../qa/virtual-studio/390-portfolio.png) |
| 768px | [Tablet studio](../../qa/virtual-studio/768-studio.png) | [Tablet portfolio](../../qa/virtual-studio/768-portfolio.png) |
| 1440px | [Desktop studio](../../qa/virtual-studio/1440-studio.png) | [Desktop portfolio](../../qa/virtual-studio/1440-portfolio.png) |

Fallback evidence includes `390-reduced-motion.png`, `390-no-webgl.png`,
`390-save-data.png`, `390-2g.png` and `390-no-javascript.png`. The original scene
poster is `public/studio/studio-poster.png`.
