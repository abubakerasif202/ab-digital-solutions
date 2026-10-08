# Signal / Form — cinematic upgrade

This feature branch extends the existing studio identity with photographic metallic light, a shorter project sequence and consistent interaction states. It branches from main at `faea0c0`. It does not merge or deploy production.

## Before and after

The previous hero used directional lights without a reflection environment, leaving metal comparatively flat. Its inherited scroll animation also faded the artwork to 8% opacity. The homepage repeated all 14 projects as a long gallery. Gold logo artwork sat against a neutral graphite plate with little relationship to the cobalt surroundings.

The upgraded sculpture uses an original deterministic 256 × 128 softbox radiance map, PMREM reflections, physical clearcoat and thin-film iridescence. A custom view-dependent Fresnel shader adds controlled cyan/violet edges. Pointer movement changes the rim colour and light positions through the existing eased render loop. The camera moves closer; the atmospheric stage and caption remain independent of text.

The sculpture does not continuously animate. Rendering stops when settled, offscreen or backgrounded; listeners and GPU resources are disposed. Phones, coarse pointers, reduced motion, save-data and constrained devices receive a brighter inline SVG of the same geometry. Three.js is dynamically imported after idle and pointer intent over the installation. The SVG remains visible until the first WebGL frame, then crossfades over 300ms. At rest, the initial page load does not allocate a GPU context. Once activated, the context is retained and sleeps offscreen rather than recompiling on every scroll. There are no dependency additions in this PR.

The homepage selects six real projects, including inventory software and commerce, with two wide feature plates and two asymmetric pairs. All 14 projects remain in the canonical registry, Work index, case study routes and sitemap. Supplied portfolio images keep their intrinsic proportions.

Champagne rules, icy cyan type accents and onyx/graphite surfaces connect the original gold logo to the cobalt identity. Interactive capability rows use colour, drawn rules and visible keyboard focus. Project imagery receives restrained perspective and pointer lighting. Hero type has a small visible entrance; section indices move subtly on scroll. Reduced motion disables these enhancements.

Contact refinements are CSS-only: field surfaces, spacing, focus outlines and status contrast. Contact component/API code, validation, honeypot, rate limits and delivery integration remain untouched, keeping this PR independent of enquiry-form PR #12.

## Investigated visual issues

- **About duplication:** one “Inside the studio” link in source and browser DOM at all five widths. No duplicate component was reproduced, so no legitimate copy was removed.
- **About reveals:** nested reveal boundaries could leave paragraphs hidden during section captures. The About copy now uses one outer reveal, preserving every paragraph and studio detail.
- **Build clipping:** no clipping was reproduced in the settled baseline. Process headings now have explicit line height and breathing room; live scroll assertions check every heading and description.
- **Capture artefacts:** scroll-linked reveals and offscreen rendering can hide sections in full-page captures. The QA runner checks live behaviour first, then applies a temporary steady-state capture style. Section captures omit fixed navigation/CTA overlays. The style is removed before further assertions.
- **Contrast:** the new mineral contact surface initially yielded 4.49:1 for its small cobalt section number. Darker cobalt fixes the regression. Capability focus also explicitly overrides an inherited dark outline.

## Validation commands

Run with Node 22. On Windows, use PowerShell and `npm.cmd`/`npx.cmd`:

```powershell
npm.cmd run build
npm.cmd run start -- --port 3100
```

In another terminal:

```powershell
node scripts/cinematic-upgrade-qa.mjs
$env:QA_OUTPUT_DIR = "test-results/cinematic/site-qa"
$env:QA_SKIP_CAPTURE = "1"
node scripts/signal-browser-qa.mjs
$env:CHROME_PATH = node -e "require('puppeteer').executablePath({headless:'shell'}).then(console.log)"
npx.cmd --yes lighthouse http://localhost:3100 --chrome-flags="--headless" --only-categories=performance,accessibility,best-practices,seo --output=json --output-path=test-results/cinematic/after/lighthouse-mobile-final.json --quiet
npx.cmd --yes lighthouse http://localhost:3100 --chrome-flags="--headless" --preset=desktop --only-categories=performance,accessibility,best-practices,seo --output=json --output-path=test-results/cinematic/after/lighthouse-desktop-final.json --quiet
```

Browser runners require localhost. Form submissions are intercepted: no enquiry reaches a provider. WebGL scenarios simulate capable hardware, with a separate low-memory fallback case. Run Lighthouse sequentially after browser QA finishes to avoid concurrent capture load.

## Screenshot gallery

Each width includes a hero comparison and an updated full page. Desktop graphics captures show pointer-engaged WebGL on a capable-device fixture; mobile captures show SVG. Initial desktop SVG is also checked before any graphics intent. Full-resolution PNGs and individual section captures remain under ignored `test-results/cinematic/`.

| Width | Before hero | After hero | Updated full page |
| --- | --- | --- | --- |
| 320 | [Before](screenshots/cinematic/before-320-hero.webp) | [After](screenshots/cinematic/after-320-hero.webp) | [Full page](screenshots/cinematic/after-320-home.webp) |
| 390 | [Before](screenshots/cinematic/before-390-hero.webp) | [After](screenshots/cinematic/after-390-hero.webp) | [Full page](screenshots/cinematic/after-390-home.webp) |
| 768 | [Before](screenshots/cinematic/before-768-hero.webp) | [After](screenshots/cinematic/after-768-hero.webp) | [Full page](screenshots/cinematic/after-768-home.webp) |
| 1440 | [Before](screenshots/cinematic/before-1440-hero.webp) | [After](screenshots/cinematic/after-1440-hero.webp) | [Full page](screenshots/cinematic/after-1440-home.webp) |
| 1920 | [Before](screenshots/cinematic/before-1920-hero.webp) | [After](screenshots/cinematic/after-1920-hero.webp) | [Full page](screenshots/cinematic/after-1920-home.webp) |

Desktop details: [Work](screenshots/cinematic/after-1440-work.webp), [Services](screenshots/cinematic/after-1440-services.webp), [Process](screenshots/cinematic/after-1440-process.webp), [About](screenshots/cinematic/after-1440-about.webp), [Contact](screenshots/cinematic/after-1440-contact.webp).

## Measured acceptance evidence

- `npm.cmd run build`: lint, typecheck, **53/53 Node tests** and production compilation pass; 34 generated route entries.
- `signal-browser-qa.mjs`: **116/116 checks** across the five requested widths, representative interior pages and all canonical project/service routes. Axe accessibility audits, image/overflow checks, mobile keyboard focus trap, reduced motion, no-JS and forced-WebGL failure pass.
- `cinematic-upgrade-qa.mjs`: **58/58 checks**, including every process heading/description, one studio link, preserved About paragraphs, all 14 Work links, initial SVG, a measured 300ms SVG/WebGL crossfade, portfolio lighting/perspective, keyboard focus and renderer idle/offscreen/context-loss/low-memory behaviour.
- Zero unexpected console/runtime errors in browser QA. The local-only Vercel Speed Insights script is stubbed in browser QA, but not in Lighthouse.
- Three form requests were intercepted for success, provider failure and rate limiting, including duplicate-submit protection. None reached a delivery provider.
- Independent code and graphics reviews have no remaining findings. The initial crossfade review finding was fixed and verified in Chromium.

Lighthouse **13.5.0**, Chrome **Headless Shell 152.0.7977.54**, Node 22 on Windows. Sequential localhost production-server audits use the default mobile simulated throttling (412px, DPR 1.75, 4× CPU) and desktop preset. Only the four requested categories are audited. The same engine/profiles measured an isolated, unchanged main build at `faea0c0` on port 3101; the upgraded build ran on port 3100.

| Build / profile | Performance | Accessibility | Best practices | SEO | LCP | TBT | CLS |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Main / mobile | 75 | 100 | 96 | 100 | 3.13s | 760.5ms | 0 |
| Upgrade / mobile | **93** | **100** | **96** | **100** | 3.07s | 95.5ms | 0.000016 |
| Main / desktop | 80 | 100 | 96 | 100 | 0.76s | 452ms | 0.000200 |
| Upgrade / desktop | **100** | **100** | **96** | **100** | 0.70s | 9.5ms | 0.000200 |

All four final categories exceed 90. Mobile simulated LCP remains above the 2.5s “good” threshold; this is a lab result, not a production field-CWV claim. The Best Practices deduction is the local Vercel script's 404/MIME error. No site code was changed to hide it from Lighthouse.

Earlier full-Chrome runs were unreliable here (`NO_NAVSTART` / `NO_FCP`), and valid mobile runs varied from 55–57 with large unattributed tasks. Direct Headless Shell eliminated those multi-second unattributed stalls. Reports are retained under `test-results/cinematic/`; the table uses the matched Headless Shell comparison, not mixed-browser results. Before pointer gating, the richer auto-starting WebGL also measured a desktop performance regression, which prompted the startup refinement.

The final desktop score measures the unengaged page load. Cold GPU setup still occurs on first artwork intent; real-device interaction latency and field INP have not been measured. Active graphics are exercised separately by the browser runner. A compact committed record is available in [cinematic-evidence.json](cinematic-evidence.json).

## Release boundaries

Local browser/lab evidence does not establish production field Core Web Vitals or real email delivery. Chrome DevTools MCP failed to connect; QA uses isolated Puppeteer Chromium. The original logo and genuine client data are unchanged. Existing local package and Claude settings modifications are excluded from this PR. Review and merge remain separate from this feature-branch push.
