# AB Web Studio cinematic portfolio implementation

## Audit and source of truth

The baseline Next.js 16.3.5 / React 19 / Node 22 checkout passed lint, strict typecheck, 38 tests and the production build before modification. The canonical registry in `app/project-data.ts` contains 13 projects; it remains unchanged. Samra Transport is not present and was not invented. See `cinematic-audit.md` for the repository audit.

Figma context and screenshot requests for `hs0Mn6agDoDvn6PrytS4W7`, nodes `3:2` and `0:1`, returned an editor-access denial. The implementation follows the supplied visual brief. Exact Figma fidelity has not been verified.

## Design and portfolio

The homepage now leads with the studio proposition and a real-project browser presentation, then immediately shows every canonical portfolio project. A large featured panel introduces the gallery; the remaining work uses paired editorial browser panels on desktop and a dedicated single-column composition on mobile. Existing names, descriptions, technologies, URLs and case-study data are preserved.

Instrument Sans provides the self-hosted editorial type system. Near-black is the dominant canvas, ruby provides energy and calls to action, and gold is reserved for small details. The cream contact section creates the final visual break. Four primary capabilities introduce websites, web development, business systems and AI/automation discussions, followed by the existing service offerings and URLs. Discover, Design, Build and Launch retain a clear four-step process.

`PortfolioSection` and `StudioCapabilities` keep the new sections reusable. `studio.css` contains the new studio composition while `globals.css` retains shared route styling. No runtime dependencies were added.

## Motion and WebGL

CSS controls headline, viewport reveal, image drift, process progress and short route-content arrival. Unsupported scroll timelines leave content visible. JavaScript motion tokens centralize carousel timing, cursor interpolation, magnetic strength and the maximum three-degree project tilt. CSS timing/easing tokens cover the studio layer.

Pointer interactions require a wide viewport, a fine hover pointer and no reduced-motion preference. Native cursor behavior remains available. Animation loops settle when idle and stop on hidden tabs; magnetic and tilt styles reset on cleanup. The existing carousel retains previous/next, explicit pause/play, keyboard controls and at most two mounted slides.

Three.js stays behind the existing client-side dynamic/Suspense loading boundary and idle capability check. Three bevelled A/slash/B meshes share two materials; particles, torus knot, cage and cyan lights were removed. Phones, reduced motion and save-data use the inline SVG fallback. DPR is capped, constrained devices use lower quality, rendering pauses offscreen/background, and context failure and resource disposal remain covered.

The static fallback uses inline vector geometry, avoiding a decorative CSS image on the LCP loading path. The homepage intro overlay is no longer mounted.

## Logo system

Created `public/brand/ab-monogram.svg`, `ab-logo-horizontal.svg`, `ab-logo-light.svg`, `ab-logo-dark.svg` and `ab-mark.svg`. Light/dark lockups support monochrome; `ABLogo` supports brand and monochrome rendering, responsive dimensions and decorative or titled accessible SVG use. Header, footer, favicon, Apple icon, manifest and Open Graph branding use the new identity. Legacy brand assets remain available.

## SEO, accessibility and contact

Canonical www URLs, service/project routing, metadata, sitemap, robots and structured data remain intact. Site description now includes websites, web applications and business systems; organization logo metadata references the vector lockup. Each project retains its verified case-study metadata and live destination.

Keyboard focus, navigation trapping, Escape dismissal and inert background behavior are verified. Mobile header blur was removed because it changed the fixed menu's containing block; the panel now has an explicit viewport height and focuses after its visible state commits. About-label contrast was corrected. Reduced motion removes choreography and WebGL without hiding content.

The public email fallback is the user-supplied `enquiry@abwebstudio.com.au`; the existing environment override still works. Phone details, contact API validation, honeypot, rate limiting, Resend delivery settings and analytics remain intact. Browser form tests intercept responses; no real lead was sent.

Case-study galleries use available real imagery. The reused desktop crop in a phone mockup was removed rather than labelled a mobile capture.

## Validation and release boundary

The final production build passed lint, strict typecheck and all 44 tests, then generated 30 static pages. Baseline checks had no existing failures. The latest production-server browser run passed 51 assertions with zero failures across all seven requested widths (including an additional 360px check). Browser artifacts are in the ignored `test-results/cinematic/` directory. Local checks are distinct from deployment and live verification. No production settings, DNS, domains or redirects were changed.

### Performance evidence

Final local Lighthouse: desktop performance/accessibility/best-practices/SEO 100/100/100/100; mobile 86/100/100/100. Desktop LCP 0.7s, TBT 0ms, CLS 0; throttled mobile LCP 3.1s, TBT 330ms, CLS 0. Mobile performance varied from 86 to 90 during the final tuning runs. This is local lab evidence, not live Core Web Vitals. The Vercel-only Speed Insights endpoint was excluded on the local server; tracking remains installed.

The largest JavaScript chunk is the dynamically loaded Three.js module, approximately 551KB raw / 138KB gzip. Phone and reduced-motion modes do not request it. Existing optimized project imagery remains in use; removal of the intro overlay, inline fallback, reduced mobile scroll motion and disabled unused serif preload reduce startup and rendering work.

General and TypeScript code reviews found no unresolved findings. Vercel configuration retains Next.js, Node 22, npm ci and npm run build. No push or deployment was performed. Local success does not verify remote framework settings, environment variables or custom-domain runtime.

### Exact changed files

- `app/agency-home.tsx`
- `app/components/Hero3DCanvas.tsx`
- `app/components/Hero3DExperience.tsx`
- `app/components/HeroFallback.tsx`
- `app/components/PointerFX.tsx`
- `app/components/PortfolioSection.tsx`
- `app/components/ProjectShowcase.tsx`
- `app/components/StudioCapabilities.tsx`
- `app/components/WorkIndexBody.tsx`
- `app/components/brand/ABLogo.tsx`
- `app/components/motion/tokens.ts`
- `app/globals.css`
- `app/layout.tsx`
- `app/manifest.ts`
- `app/opengraph-image.tsx`
- `app/page.tsx`
- `app/site-chrome.tsx`
- `app/site-config.ts`
- `app/site-footer.tsx`
- `app/studio.css`
- `app/work/[slug]/page.tsx`
- `docs/cinematic-audit.md`
- `docs/cinematic-browser-qa.md`
- `docs/cinematic-implementation.md`
- `public/apple-touch-icon.png`
- `public/brand/ab-logo-dark.svg`
- `public/brand/ab-logo-horizontal.svg`
- `public/brand/ab-logo-light.svg`
- `public/brand/ab-mark-192.png`
- `public/brand/ab-mark-512.png`
- `public/brand/ab-mark.svg`
- `public/brand/ab-monogram.svg`
- `public/favicon.svg`
- `scripts/cinematic-browser-qa.mjs`
- `tests/cinematic-brand.test.mjs`
- `tests/source-guards.test.mjs`
