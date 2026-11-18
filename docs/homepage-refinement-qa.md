# Homepage refinement — local QA

This is evidence from a local Next.js production build, not from Vercel Preview or the live domain. No changes were committed, pushed or deployed.

## Change map

| Area | Source |
| --- | --- |
| Hero proof, device mockup, capability band and service pillars | `app/agency-home.tsx`, `app/styles/homepage-refinement.css`, `app/project-artwork.tsx` |
| Header, mobile navigation and closing footer | `app/site-chrome.tsx`, `app/site-footer.tsx` |
| Work captions, previews and controls | `app/components/PortfolioSection.tsx`, `app/components/cinematic/ProjectExhibition.tsx`, `app/styles/project-exhibition.css` |
| Hero media, ticker, capability count and reveal styles | `app/components/cinematic/{CinematicMedia,TickerToggle,CapabilityCount}.tsx`, `app/styles/ruby-*.css`, `app/layout.tsx`, `public/cinematic/*-lite.*` |
| Film, process and enquiry | `app/components/film/BrandFilmPlayer.tsx`, `app/styles/brand-film.css`, `app/components/ProcessSection.tsx`, `app/components/studio/EnquirySection.tsx` |

## Verification

- Node 22.23.1: `npm run build` passed, including lint, route type generation, TypeScript, and 301 Node tests.
- Playwright: 45 tests passed in the final parallel run; the 1440 px screenshot readiness wait timed out under concurrency and passed on an otherwise unchanged isolated rerun.
- Normal-motion readback confirmed that display text fits its reveal masks after animation at all six widths. The first process marker stayed pinned through a 36 px scroll at 768 px and wider, and moved with the document at 390 and 360 px.
- Production-mode Chromium checks cover 1440, 1280, 1024, 768, 390 and 360 px. The homepage and film screenshot set is under `%TEMP%/ab-home-verified-screens`. The suite's localhost console assertions stub only the Vercel-injected Speed Insights script, which standalone Next does not serve.
- Verified keyboard menu/focus return, carousel controls, ticker, play/pause, accordion enquiry preselection, and form submission against a mocked `/api/contact`. No actual email was sent.
- Verified the rendered homepage title, description, Open Graph image, `https://www.abwebstudio.com.au` canonical, and Organization / ProfessionalService structured data against the existing repository details.
- Confirmed that reduced-motion and Save-Data sessions do not request the hero video. The separate brand film remains click-to-load.

## Performance

Cold-cache Chromium samples of the locally built homepage. An earlier repeat measured 0.42 s desktop and 2.34 s mobile; both runs transferred approximately the same bytes. Transfer is CDP-reported bytes for the local origin, including the deferred hero loop. Interaction timing is a single keyboard ticker sample, not page INP or field data.

| Profile | LCP | CLS | Sample interaction | Transferred |
| --- | ---: | ---: | ---: | ---: |
| Desktop, 1440 px | 0.63 s | 0 | 48 ms | 1.55 MB |
| Mobile, 390 px, simulated Fast 4G and 4× CPU throttling | 1.51 s | 0 | 64 ms | 0.97 MB |

## Content still needed

Publish only verified Lighthouse benchmarks and field Core Web Vitals, including INP. The homepage labels these slots as unmeasured. No response-time promise was added because none was verified.
