# OpenDesign preview route — report

Branch `feat/opendesign-homepage-integration` (worktree `ab-digital-solutions-worktrees/opendesign-homepage`). **Uncommitted. Nothing pushed, merged or deployed.** Builds on `docs/opendesign-homepage-integration.md`.

## 1. What was built

`/preview/opendesign` is a Next.js route in the real app. It is a design review of the OpenDesign "Gilt & Ruby" homepage built from existing parts, not a second implementation.

| Concern | How it is handled |
| --- | --- |
| Header, footer | `SiteHeader`, `SiteFooter` reused unchanged |
| Enquiry | `EnquirySection` + `ContactForm` reused unchanged (same `/api/contact` contract, honeypot, `submissionId`, rate limit) |
| Projects | `projects`, `ProjectArtwork` (`next/image`), `projectDestinationLabel`, `/work/[slug]` case studies. All 19 cards are server-rendered; a small client island filters them |
| Hero | Existing `Hero3DExperience` (Three.js) kept as the hero. `?fallback=css` swaps the static stand-in for a zero-JS, zero-image CSS monogram (evaluation only) |
| 3D studio | Existing `VirtualStudioPreview` entry reused; `/studio` untouched |
| Theme | `preview.css`: every rule under `.odp`; palette tokens overridden only inside that wrapper |
| Services | Three disciplines mapped to real service pages and to the exact labels the API accepts (`contactServiceKeys`) |

Not indexable, in four independent ways: robots metadata (`noindex, nofollow, nocache`; googlebot `noindex, noimageindex`), `X-Robots-Tag: noindex, nofollow, noarchive` from `next.config.ts`, absent from `sitemap.xml`/`robots.txt`/`llms.txt`/all links, and a 404 when `VERCEL_ENV=production`. `robots.txt` deliberately does not `Disallow` it, because a blocked URL can never show crawlers its `noindex`.

## 2. Changed files

Modified (4 files, +18 / −7):
- `app/components/Hero3DExperience.tsx`, `Hero3DCanvas.tsx`: optional `fallback` prop, default is the approved artwork. No live page uses these today, so live behaviour is unchanged.
- `next.config.ts`: one added header rule for `/preview/:path*`. The security-header rule stays first.
- `package.json`: scripts `opendesign:data`, `opendesign:serve`. No dependency changes.

New:
- `app/preview/opendesign/` — `page.tsx`, `preview.css`, `_components/{CssMonogram,HarbourSkyline,PreviewDisciplines,PreviewWork}.tsx`
- `opendesign/luxury-homepage/` — corrected standalone prototype (+ self-hosted fonts, `data.json`, `link-check.json`)
- `scripts/` — `export-homepage-data`, `serve-luxury-prototype`, `capture-luxury-screenshots`, `capture-preview-comparison`, `a11y-axe-check`
- `tests/` — `luxury-homepage.test.mjs`, `opendesign-preview.test.mjs`, `e2e/luxury-homepage.spec.mjs`, `e2e/opendesign-preview.spec.mjs`
- `docs/` — this report and the integration plan

Untouched: `app/page.tsx`, `agency-home.tsx`, `project-data.ts`, `layout.tsx`, `sitemap.ts`, `robots.ts`, `/studio`, `vercel.json`, CSP.

## 3. Verification

| Check | Result |
| --- | --- |
| `npm run lint` / `typecheck` | pass / pass |
| `npm test` | **220/220** (213 existing + 7 new preview guards; the 8 prototype guards are included) |
| Playwright: preview, prototype, contact-form-a11y, wild-pest | **46/46** at 360, 390, 820, 1440, 1920 (overflow, CSP violations, console, images, structure, filters, no-JS, form contract, keyboard, reduced motion, noindex, production gate, 3D canvas activation, studio entry) |
| Playwright: `virtual-studio.spec` (existing) | **13 of 24 fail, and fail identically on the untouched base commit** (sampled 4 of them in a clean worktree: all fail). Causes seen: a stale `toHaveCount(18)` (the registry has 19) and WebGL/screenshot timeouts under software rendering. Not caused by this work; not fixed |
| Real form contract | The `ContactForm` payload (`fullName`, `email`, `services[]`, `submissionId`, `company: ""`) is accepted by the real route (valid payload reaches delivery and returns 503 because no mail key is set; an invalid service returns 400). When the suite exceeds the route's 5-per-10-minutes limit it returns 429 and that assertion degrades to a noted skip. No email was sent |
| CSP | No `securitypolicyviolation` events at any viewport; no new hosts; fonts via `next/font` |
| axe-core 4.14 (A, AA, WCAG 2.2 AA, best practice) | Preview **desktop: 1 serious, pre-existing**; **mobile: that plus 1 moderate, pre-existing** (both below). Nothing introduced by the new sections |
| Lighthouse 13.6 (local `next start`, simulated throttling) | Table below |

Lighthouse (accessibility 100 and best-practices 96 on every page; the 4-point best-practices loss is the Vercel-only Speed Insights script 404 on a local server, identical on the live homepage):

| Page | Mobile perf | Mobile LCP | Desktop perf | Desktop LCP |
| --- | --- | --- | --- | --- |
| Live homepage `/` | 99–100 | 1.2 s | 100 | 0.3 s |
| Preview, default hero (image fallback) | **83–86** | **4.1–4.3 s** | 99 | 0.9 s |
| Preview `?fallback=css` | 99–100 | 1.4 s | n/a | n/a |

SEO is 69 on the preview because Lighthouse correctly reports "blocked from indexing". That is the intent. Three runs per mobile variant; some runs on both the home and the preview returned no metrics and were discarded. These are lab numbers, not field data.

## 4. CSS monogram as the mobile/performance fallback

On mobile the LCP element in the default preview is `img.hero-sculpture` (the 190 KB approved artwork); with the CSS monogram it is text with no network resource. Result: **LCP 4.2 s → 1.4 s, performance 85 → 100**.

Trade-off: it is a flatter wine-and-champagne extrusion, not the rendered gold-and-red AB with the blade. Whether that is an acceptable brand stand-in is your call. A lower-risk alternative to test first: give the existing `HeroFallback` image a `preload`/priority hint.

## 5. Screenshots

`test-results/opendesign-homepage/` (git-ignored):
- `comparison/{home,prototype,preview,preview-css-fallback}/` — hero and full page at 360, 390, 820, 1440, 1920; plus `1440-hero-3d-motion.png` for home and preview
- `screenshots/{original,corrected}/` — original OpenDesign export vs corrected prototype, with dialog, form-error and mobile-menu states
- `lighthouse/*.json`, `axe-report.json`, `playwright-*.log`

Full-page captures show a blank area where the footer should be. That is the site's own `content-visibility` optimisation; the footer renders when scrolled to and is identical on the live homepage.

## 6. Visual regressions and unsupported claims

Differences against the live homepage and the corrected prototype:
1. **Mixed palette.** Reused chrome and form take the scoped tokens only where they use CSS variables. The header CTA, the hero art (red-and-gold render) and the form's wine button no longer match each other.
2. **Prototype features dropped on purpose:** skyline parallax, pointer-driven CSS monogram, process-rail progress, reveal animations, the project dialog (cards link to the existing case-study pages instead).
3. **Header "Process" and the logo leave the preview** (they point at `/#process` and `/`). Expected for shared chrome.
4. **Default hero is slower on mobile** (section 3).
5. **Different hero copy** from the live homepage ("Websites that look expensive and earn their keep." vs "Websites with presence."). A content decision.
6. The preview omits live-home sections it does not need to evaluate (film, capabilities, stack ledger, about).

Claims:
- **Live website, unresolved (owner says it works):** the owner confirmed on 9 Nov 2026 that `oncalltrailers.com.au` is live, so the registry label is kept and the preview/prototype show "Live website", with the evidence file recording it as *owner-confirmed, not independently verified*. From this machine it looks like a **parked domain**: HTTPS fails the TLS handshake on apex and `www` on every TLS version, from three local clients and an independent fetcher; plain HTTP serves "Domain Parked With VentraIP". `project-data.ts` labels it "Live website" with a "Visit Live Website" button; if the owner's view is the exception (for example a different network or route), the case study would send some visitors to a broken page. Worth one check from a second network.
- **Live homepage copy:** "19 real projects" in the hero bar overstates: Jufaja and 4 Point are hosted showcases and On Call Trailers is parked.
- **Preview copy,** reviewed against the registry: "Next.js and React websites and online stores", "custom business systems for stock, quotes and invoices", "reduced-motion support" and "local-search content" are supported. "Redirects checked" (Launch step) is only partly evidenced (HF and ZQ redirects in the October audit); soften or remove it. "Art-directed", "brand-led" and "look expensive" are subjective marketing language, not claims that can be verified.

## 7. Production integration recommendation

1. **Now, separately from this branch:** correct "19 real projects", and confirm On Call Trailers from a second network (if it is genuinely unreachable for some visitors, the registry supports `destination: "unavailable"`). Jufaja has been moved to its canonical domain on this branch.
2. **Do not swap the homepage wholesale.** The live home is already a Gilt & Ruby design with a strong studio story, ~1.2 s mobile LCP, and many pinned tests. The export's palette conflicts with the repo's red-and-gold tokens.
3. **Adopt the wins selectively:** the sector filter with counts and honest status labels, the three-discipline summary tied to real service pages, and the verified copy. These reuse existing components and carry no palette change.
4. **If a full cut-over is still wanted:** resolve the palette decision first, keep the existing hero and decide the mobile fallback (section 4), restore the omitted sections, then rewrite the `source-guards` assertions that pin the current homepage in the same change.
5. Keep the preview route behind its four gates until then; delete it, `opendesign/luxury-homepage/` and the scripts when the decision is made.

## 8. Remaining issues, ranked

| # | Priority | Issue |
| --- | --- | --- |
| 1 | Medium | On Call Trailers: owner says it is live, but it fails HTTPS and shows a parking page from this machine. Confirm from a second network |
| 2 | High | Preview default hero: mobile LCP ≈ 4.2 s vs 1.2 s on the live home. Needs the fallback decision |
| 3 | Medium | Palette decision: mixed scoped tokens look inconsistent; repo tests pin the current palette |
| 4 | Medium | `virtual-studio.spec` has 13 failures on the base commit (stale count of 18 vs 19, WebGL timeouts under software rendering). Pre-existing; needs its own fix |
| 5 | Medium | "19 real projects" copy on the live home |
| 6 | Low | Pre-existing axe findings on the live home, carried into the preview via shared components: `label-content-name-mismatch` on the `VirtualStudioPreview` link (accessible name omits the visible "INTERACTIVE 3D / TAP TO ENTER" text; serious) and the mobile sticky CTA sitting outside any landmark (moderate) |
| 7 | Low | Preview depends on `opendesign/luxury-homepage/link-check.json` for status evidence; at integration this belongs in the registry, not a prototype folder |
| 8 | Low | Chromium only; Firefox/Safari not run; Lighthouse is lab-only and intermittently returns no metrics locally |
| 9 | Low | `docs/portfolio-evidence-audit.md` is stale (14 projects, 1348 px captures) |

## 9. Run it

```powershell
npx next build; npx next start -p 3100      # then open /preview/opendesign  (add ?fallback=css to compare)
npx playwright test tests/e2e/opendesign-preview.spec.mjs
node scripts/capture-preview-comparison.mjs
AXE_PATH=<axe.min.js> node scripts/a11y-axe-check.mjs
```
Do not set `RESEND_API_KEY` locally when running the form checks.
