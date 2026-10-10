# AB Web Studio production QA continuation — 10 October 2026

## Production identity

Read-only Vercel inspection of `https://www.abwebstudio.com.au` resolved to production deployment `dpl_BykVHzV63y8nTdVeHtkzAfbcBM3V`, status **Ready**, URL `https://ab-digital-solutions-48kzx8kon-abubakerasif202s-projects.vercel.app`.

GitHub's production deployment record `6973510096` reports successful deployment of `13d6285899a916ba31eba3c6829758a394438625`. PR #16 is merged, and the commit's `verify` check succeeded. Current GitHub `main` matches this commit. The production domain returned HTTP 200; all 26 sitemap URLs independently returned HTTP 200.

## Environment and source preservation

The existing release worktree is `/mnt/c/Users/abuba/ab-final-20261010`, branch `fix/live-qa-captures`. On entry, its only tracked modification was `scripts/final-brand-qa.mjs`. The Windows-format `.git` pointer is not usable directly by WSL Git. Git commands therefore use the existing metadata explicitly with `--git-dir=/mnt/c/Users/abuba/ab-digital-solutions/.git/worktrees/ab-final-20261010 --work-tree=/mnt/c/Users/abuba/ab-final-20261010`; no worktree metadata was changed.

WSL initially selected Node 20.20.2. Validation selected the already installed Node 22.23.1 using nvm. An isolated source copy at `/home/abuba/qa-ab-20261010` received Linux dependencies with `npm ci` and Puppeteer's Linux Chrome 152. Windows `node_modules` and existing screenshots were preserved. No development servers were stopped.

## Contact and screenshot root cause

The inherited probe used `.stage-actions a`, which does not exist. The actual hero CTA is `.hero-actions .button-primary` and points to `#contact`. The recovered probe uses mobile touch input and checks its natural landing before separately scrolling the direct contact links into view. Normal and reduced-motion probes passed; links have nonzero dimensions, visible ancestors and opacity 1. JavaScript-disabled rendering also showed all three links at opacity 1.

The old diagnostic sweep called `scrollTo` repeatedly while the site's smooth scrolling was still active. Its viewport position therefore lagged behind the requested position. Reveals can also remain hidden or be mid-transition when a screenshot is taken. A timing probe after instantaneous positioning recorded contact opacity 0 immediately, 0.114 after 100 ms, 0.999948 after a further 600 ms, and 1 after a further 1,200 ms. This reproduces a transient capture state; natural CTA navigation and settled screenshots show the contact content.

The QA runner now uses instantaneous diagnostic scrolling, waits for transitions, limits full-page surfaces to 16,000 CSS pixels and falls back to viewport/section captures. Offscreen IntersectionObserver reveals and CSS view timelines also use viewport captures rather than misleading full-page images. Capture limitations are recorded separately from website failures. Natural touch CTA tests retain the site's normal motion.

## Tooling changes

Only `scripts/final-brand-qa.mjs` and this report are changed. Targeted GPU mode and optional fine-pointer browser emulation support focused reruns without repeating the route matrix. The runner now checks the five main routes at 320, 375, 390, 768, 1024, 1440 and 1920 pixels, and registry-derived project/service routes at 375 and 1440 pixels. It records runtime/console/request errors, asset responses, overflow, metadata, contact visibility and a structured PASS/FAIL summary. The 768px menu is included. Contact form submissions are intercepted and mocked; the former real invalid POST was removed. No real enquiry was submitted.

Regression coverage consists of added browser assertions for the natural hero CTA, contact anchor landing, reveal visibility and reduced-motion contact links, plus the expanded responsive route matrix. No production component, CSS, asset, business data, metadata or environment value was changed.

## Validation and evidence

Final Linux `npm run verify` passed ESLint, TypeScript and **63/63 Node tests**, with no skipped tests. The final `npm run build` also passed its verification gate and generated **34 routes**.

The five main pages received 35 automated WCAG audits across all seven widths. The 28 Home/Services/About/Contact audits passed. The seven initial Work audits sampled cards during their view-timeline fade; all 98 repeated audits of the 14 cards at seven widths passed after scrolling each card into view, without style overrides. Portfolio filtering returned the expected four property/construction projects and restored all 14 projects at every width; the first case-study link navigated successfully. Mobile contact-menu navigation and the hero portfolio anchor passed. These automated checks do not establish complete manual WCAG conformance.

The broad run completed **78 page visits** and **224 assertions**. It recorded **zero runtime errors**, zero unexpected console/HTTP errors, no horizontal overflow or broken-image failures, and 68 safe capture fallbacks. There were 111 successful image-asset assertions; the largest captured document measured 16,767 CSS pixels, above the full-page limit. One GPU assertion incorrectly assumed a fine-hover pointer on Linux headless Chrome. That browser reported `pointer: none` / `hover: none`; the unchanged renderer correctly kept pointer parallax disabled. The corrected capability-aware GPU rerun passed **32/32 assertions**. A separate fine-hover browser emulation proved pointer rendering (draw calls increased from 4 to 57), and the full fine-pointer GPU rerun passed **32/32 assertions**; the final run also asserted that fine-pointer emulation was active on the loaded site and passed **45/45 assertions**. The browser capability assertion runs after navigation, when Chromium has applied the emulated settings to the target renderer.

The initial raw broad-run JSON retains its tooling failure for traceability. Final status is based on that completed route matrix and the corrected targeted reruns, rather than claiming a fresh broad run after the GPU assertion correction. No application code changed between these checks. Normal/reduced-motion contact, menu, portfolio filtering, mocked form success/error, GPU activation/crossfade/sleep/context loss and reduced-motion GPU fallback were verified.

The broad runner also left a large Open Graph fetch body unread, keeping Node's HTTP connection alive after printing results. The metadata resource loop now drains each response. A focused live resource check drained sitemap (4,374 bytes), robots (273 bytes) and Open Graph (70,898 bytes), all HTTP 200, and exited normally. The already reported broad process was stopped after its browser closed; the targeted GPU runners exited normally. Evidence is retained under `test-results/wsl-production-qa-2026-10-10/` in the release worktree; this directory is ignored by Git.

## Performance

Fresh production mobile Lighthouse 13.5.0 / Linux Chrome 152 initially measured Performance 84, LCP 2.9 s, FCP 1.4 s, TBT 460 ms, speed index 1.9 s and CLS 0. Accessibility, best practices and SEO each scored 100. This is simulated mobile laboratory evidence, not field Core Web Vitals, and the earlier Windows handoff is not directly comparable.

Desktop Lighthouse measured Performance 90, LCP 0.7 s, TBT 260 ms and CLS 0, with accessibility, best practices and SEO each at 100.

The LCP element is the authentic AB hero image, discovered in initial HTML and eagerly loaded via preload. Lighthouse suggests a high fetch-priority hint. Main-thread time is concentrated in script evaluation and style/layout; the site already dynamically imports the Three.js canvas after pointer intent and skips it on phones, coarse pointers and reduced motion. Fonts are self-hosted through Next's font pipeline. These are remaining profiling opportunities, not a reason to change the approved design or redeploy during QA.

## Reproduce

Use Linux-installed dependencies and browser binaries with Node 22:

```bash
cd /home/abuba/qa-ab-20261010
source ~/.nvm/nvm.sh
nvm use 22.23.1
npm run verify
npm run build
QA_BASE_URL=https://www.abwebstudio.com.au node scripts/final-brand-qa.mjs
QA_BASE_URL=https://www.abwebstudio.com.au QA_CONTACT_ONLY=1 node scripts/final-brand-qa.mjs
QA_BASE_URL=https://www.abwebstudio.com.au QA_GPU_ONLY=1 node scripts/final-brand-qa.mjs
QA_BASE_URL=https://www.abwebstudio.com.au QA_GPU_ONLY=1 QA_FINE_POINTER=1 node scripts/final-brand-qa.mjs
```

## Git and scope

The branch remains `fix/live-qa-captures`. This continuation saves a focused local tooling/report commit with the required model attribution. No new PR is opened, and no push, merge or deployment is performed. The existing production PR #16 and its successful CI/deployment remain the live release.

There are no unresolved website defects from this scope. Testing used Linux Chromium with viewport/touch/media emulation; physical devices, other browsers and real outbound enquiry delivery were not exercised. Form delivery states were mocked as required.

No production release is needed for QA tooling alone. This continuation does not push, merge or deploy a change.
