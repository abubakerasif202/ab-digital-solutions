# AB Web Studio homepage refinement
Baseline: 0216c6d · Local delivery only · Node 22 / Playwright
One integrated homepage candidate; forecast over 400 lines including responsive QA. No commit or remote delivery under repository rules.

## Specs
- S1: “Reveal/split-text animations clip glyphs” / “don't sit over screenshot content” / “keep ONE primary play control” / “small accessible icon toggle button (aria-pressed)” / “Add meaningful alt text”.
- S2: “Start a project” / “Film” / “proof strip built from real repo data” / “Built to perform” / “replace the composite AI-style image with a real project device mockup”.
- S3: “enlarge the thumbnail rail” / “3 pillars, each expanding” / “sticky-scroll timeline” / “what happens next” / “large closing CTA band”.
- S4: “no download on reduced-motion/save-data” / “Target LCP < 2.5s, CLS < 0.05, INP < 200ms” / “Verify title/description/canonical/OG/JSON-LD”.
- S5: “run lint, type-check, tests and production build” / “1440, 1280, 1024, 768, 390 and 360px”.

## Tasks
- T1 · S1 · Inline · Verified · Defect fixes and motion controls
- T2 · S2–S4 · Inline · Verified · Brand-preserving homepage composition and media
- T3 · S5 · Inline · Verified · Production validation and evidence

## Log

### L1 — Original request

```text
You are working on the AB Web Studio site (abwebstudio.com.au). Inspect the repo, git status, stack and scripts first. Preserve brand: logo, ruby/cream/black palette, Bodoni Moda + Schibsted Grotesk + IBM Plex Mono. Do NOT invent testimonials, stats, clients, awards or metrics — use only data already in the repo; leave clearly-marked TODO slots where real content is needed.

GOAL: make the homepage feel like a top-tier, technically elite design+dev studio — memorable, confident, restrained motion, fast.

P0 – FIX DEFECTS
1. Reveal/split-text animations clip glyphs (descenders, line ends; Process titles truncated mid-animation). Add padding/overflow allowance to the mask wrappers; ensure final state never clips at any breakpoint.
2. Featured project card: move the "LIVE WEBSITE" badge and arrow button so they don't sit over screenshot content (place in a caption bar or outside the image frame). Fix the truncated project title at the bottom of the card.
3. Film section: remove collision between the "DESIGN THAT EARNS ATTENTION." overlay and the Play button; keep ONE primary play control.
4. Restyle the "Pause ticker" checkbox as a small accessible icon toggle button (aria-pressed), aligned to the ticker.
5. Add meaningful alt text to the 4 images missing it (decorative → alt="").

P1 – ELEVATE
6. Header: add a persistent compact "Start a project" CTA button; rename "Virtual Studio" to a clearer label (e.g. "Film"), keeping the anchor working.
7. Hero: keep the video + headline, but replace the "Harbour/Arteries/Skyline" chapter labels with a proof strip built from real repo data: e.g. "20 case studies" + a hover/auto-cycling stack of 3 real project thumbnails linking to case studies. Sharpen the subhead toward design + engineering.
8. Add a "Built to perform" capability band (between Work and Services): stack/technology chips ONLY from what the projects actually use (read package.json / case-study data), plus slots for real Lighthouse/CWV scores (TODO if not measured). Mono type, subtle grid lines, count-up on view (respect prefers-reduced-motion).
9. About: replace the composite AI-style image with a real project device mockup (use an existing case-study screenshot in a laptop+phone frame) or leave a TODO for a real studio photo.
10. Work: enlarge the thumbnail rail, raise contrast, add hover preview (slow scroll of the site screenshot inside the frame). Keyboard + touch accessible.
11. Services: merge the 3 pillars and the 7-item ENQUIRE grid into one system — 3 pillars, each expanding (accordion/hover) to its sub-services with an enquire link pre-selecting the matching form chip. Use Bodoni at heavier weight/optical size on the cream background for legibility.
12. Process: make it a sticky-scroll timeline (left: step number/title pinned; right: step detail + small illustrative UI snippet). Fallback to stacked cards on mobile.
13. Contact: fill the empty left column on desktop (response-time note only if true, short "what happens next" 3-step list, WhatsApp/email cards).
14. Footer: add a large closing CTA band ("Let's build something…" + button), then a 3–4 column footer (Studio / Services / Work / Contact & socials) instead of the single link column.

P2 – PERFORMANCE / SEO
15. Hero video: poster image, mobile-specific smaller source, no download on reduced-motion/save-data. Target LCP < 2.5s, CLS < 0.05, INP < 200ms; cut initial transfer below ~1.9MB.
16. Verify title/description/canonical/OG/JSON-LD (Organization + LocalBusiness/ProfessionalService using only real details already in the repo).

VERIFY: run lint, type-check, tests and production build. Visually check at 1440, 1280, 1024, 768, 390 and 360px; check the console for errors and test the form, mobile menu, carousel and video controls with the keyboard. Report changed files, checks run, and remaining TODOs needing real content.
```

- Baseline: `main` at `0216c6d`; unrelated QA and tooling edits preserved.
- RED: updated ticker keyboard regression reproduced the missing button in the original implementation.
- The hero keeps the V3 film; the separate brand film now has one out-of-frame play/pause control. Portfolio and stack evidence are sourced from the project registry.
- No commit, push, or deployment is authorised.
- GREEN: final Node 22 build passed lint, typecheck and all 301 Node tests. All 46 scoped Chromium cases passed across the parallel run and isolated 1440 px screenshot rerun.
- Normal-motion layout probes confirmed settled glyph bounds and sticky/mobile process behavior at 1440, 1280, 1024, 768, 390 and 360 px.
- Local browser evidence and outstanding public performance measurements: docs/homepage-refinement-qa.md. Native review did not start because its workspace candidate inventory mixed in pre-existing unrelated files.

