# AB Web Studio — Phase 5 local release report

Date: 26 November 2026 · Branch: `hybrid-wsl` · Environment: Ubuntu-24.04 WSL, Node.js 22.23.2

## What shipped to the local branch

- Recovered the Antigravity coordinator, design, performance, reviewer and verifier records. `066e0f4` integrated the design (`87e4a35f`) and performance (`e0151236`) work on top of `d6a4bc9`. Git confirmed the branch was subsequently fast-forwarded to the reviewer-approved responsive fix `04d1303c` before this handoff.
- The inherited fix in `app/styles/homepage-refinement.css` sizes the lead Jufaja Homes image from its grid track at 768px and up. The 1348:926 frame keeps the capture centered and uncropped without spilling over the copy. Mobile retains the stacked card inside its carousel.
- The original production audit was clean. A broader audit flagged 11 entries from two dev-only findings: [minimatch](https://github.com/advisories/GHSA-g3hv-75wg-m249) and [Zod](https://github.com/advisories/GHSA-mrhx-c7xc-m3w5). Lockfile commit `8931084f1d7d` refreshes the affected ESLint and Puppeteer trees within the existing manifest ranges. All non-dev lock records are unchanged. No application source, tests, or deployment configuration changed during takeover.

## Final verification

The release checks ran from a fresh WSL copy of `04d1303c` with the exact committed lockfile (SHA-256 `c8e4ee08d62ec442c589e54333e3077785aa7f2cfd1014f95b2be6127fccf55a`). The original WSL checkout also passed `npm ci` and `npm run verify` after applying those same bytes.

| Check | Result |
| --- | --- |
| Clean install and production build | PASS — ESLint, type check, 349/349 unit tests, 43 prerendered pages |
| Playwright Chromium, full suite | PASS — 135/135, zero failed, flaky or skipped |
| Playwright Firefox, handoff subset | PASS — 13/13 |
| Playwright WebKit, handoff subset | PASS — 13/13 in the local Playwright container over loopback TLS |
| Production and full dependency audits | PASS — zero reported vulnerabilities in both |
| Puppeteer smoke on the updated toolchain | PASS — bundled Chrome opened the local production homepage |
| Local production-mode route guard | PASS — `/preview/opendesign` returned 404 |
| Responsive visual and geometry sweep | PASS — 40 inspected captures at 320, 360, 375, 390, 430, 768, 1024, 1280, 1440 and 1920px |
| Independent local review | PASS — no release-blocking findings in the lockfile and visual scope |

The 768px before/after comparison confirms unobstructed text and no image/copy intersection. The 1440px comparison shows the previously cropped logo and headline. The homepage and studio had no horizontal overflow at any tested width. The studio details remained below the stage at phone and tablet widths, and below the fixed header at desktop widths.

The first Chromium run on the inherited lock finished 134/135: a shader re-entry check timed out during warmup while browser jobs overlapped. The unchanged check passed on a focused rerun and in the final 135/135 run; no assertions or timeouts were changed. Native WSL WebKit lacked shared libraries, so the successful WebKit runs used the existing container workflow instead.

## Evidence and release limits

- Original evidence and handoff: `test-results/phase-5/work-manifest.md` and `test-results/phase-5/screenshots-10w/`.
- Final evidence: `test-results/phase-5/release-04d1303c.akvYNj/remediated/`. Build and browser logs, JSON results, the independent review, four visual contact sheets and the raw viewport captures are retained locally. The parent run folder preserves the first Chromium trace and the focused rerun.
- The 16.3% mobile and 12.8% desktop studio activation improvements are historical SwiftShader measurements from the performance worker. Performance was not rebenchmarked during this handoff.
- Claude Code was installed, but a new authenticated Claude review was not run without authorization for a session to use. The independent local review is separate. Physical-device QA, authenticated preview, live integrations and production deployment were not verified.
- Local commits only. The original Windows checkout and the 11 pre-existing untracked QA images were not changed. Nothing was pushed or deployed.
