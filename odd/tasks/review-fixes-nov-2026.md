# AB Web Studio — review fixes (15 Nov 2026 review)
Branch: fix/review-nov-2026 (from feat/cinematic-luxury @ 0e521f7). Delivery: local commits, one per numbered item; no push/deploy. Runner: Node 22, `npm run verify`, Playwright probe at 1440/1024/820/390.

## Specs
S1. "text below 12px" — "New floor: 12px for uppercase mono labels at 768px and up, 13px below 768px." Accept: "the count of visible text nodes under 12px is 0 on `/`, `/work`, `/studio`, `/services`, one service page and one case study, at 1440 and 390 widths."
S2. Mobile sticky bar: "Reserve space", "Show the bar only after the hero has scrolled out of view. Hide it while the enquiry form or the footer is in the viewport, and while the mobile menu is open. Use IntersectionObserver, not scroll listeners." "Animate with transform/opacity only."
S3. Mobile header: "Make the scrolled-state header background fully opaque `#08070B`".
S4. Hero: left-weighted scrim, bottom fade; italic line solid `#FF9DB8` (or gradient clearing 4.5:1 in Harbour/Arteries/Skyline); at 1024px+ CTAs under supporting sentence; "Move 'Pause motion' into the bottom rail on desktop"; 44px min.
S5. "about 160px between sections at desktop, 120px at tablet, 96px at mobile"; "Renumber sequentially 01 to 06".
S6. Process section, `id` matching nav anchor, H2 "The thinking behind the feeling.", 4 steps (4-col / 2x2 / stacked), copy reused from the service pages' "From first conversation to a dependable result" steps; no new claims.
S7. Nav labels: "About" for /about, "Virtual Studio" for /studio, consistent in header, mobile menu, footer; list before/after.
S8. Featured work card <768px: show screenshot whole, text beneath; carousel controls >= 44x44.
S9. /work two columns from ~700px.
S10. Touch targets >= 44px (film buttons, footer links, /studio controls).
S11. Footer WhatsApp icon + label on one row, icon aria-hidden.
S12. Every `<img>` with intrinsic width/height; hero poster not lazy + fetchpriority high; Lighthouse CLS < 0.1.
S13. Meta descriptions 120-158 chars for the 11 listed pages, facts from the page only.
S14. Titles <= 60 chars (7 listed), one case-study title pattern for all 19.
S15. /studio H1 vs title; visible breadcrumb on /work; /privacy breadcrumb + WebPage schema; 404 no canonical; case studies get Related service + prev/next.

## Tasks
T1 | S1 | inline | done, commit c9d3388
T2 | S2 | inline | done, commit 626f641 + 09c50f9 + ccd183a
T3 | S3 | inline | done, commit 094f4a7
T4 | S4 | inline | done, commit 07e0fbf
T5 | S5 | inline (shares section order with T6) | done, commit 799afce (shared with T6)
T6 | S6 | inline | done, commit 799afce
T7 | S7 | inline | done, commit 6ede19d
T8 | S8 | inline | done, commit 80b1fd0
T9 | S9 | inline | done, commit 00f603b
T10 | S10 | inline | done, commit 39c0d11
T11 | S11 | inline | done, commit 76a7c87
T12 | S12 | inline | done, commit 1180a2e
T13 | S13 | inline | done, commit 3103bfe (shared with T14)
T14 | S14 | inline | done, commit 3103bfe
T15 | S15 | inline | done, commit 6dd2935

## Log
L1 (2026-11-15) User request: fix the 15 numbered review findings (P1 1-3, P2 4-7, P3 8-11, Technical/SEO 12-15) with measured baselines, one conventional commit per item, branch fix/review-nov-2026, no push/deploy, verify with lint/typecheck/tests/build + Playwright at 1440/1024/820/390 + Lighthouse mobile before/after. Full text lives in the session prompt.
L2 Baseline (base build, probe corrected to include aria-hidden text, exclude clipped sr-only): small-text nodes 1440: / 59, /work 52, /studio 22, /services 4, case 4, service 3; tap<44: / 8, /studio 33; imgs w/o dims: / 9/16, /work 19/21, /services 9/11, service 4/6, case 3/5. Lighthouse mobile: / perf 61 LCP 5.4s CLS 0 TBT 530; /work 78 LCP 5.2s; case 78 LCP 4.4s. Local-only console noise: /_vercel/speed-insights/script.js 404.

L3 Final (prod build, Node 22): lint/typecheck/273 tests/next build pass. Probe at 1440/1024/820/390 over 8 routes: small text 0, tap targets <44px 0, images without dimensions 0, overflow 0, console errors 0 (local-only speed-insights 404 ignored). Sticky bar: 3-4 visible stops of ~70, never over hero/form/footer or any link/button/text. Lighthouse mobile after: home 46/71, /work 79/82, case 80/78 (baseline 61/78/78); CLS 0-0.002. Known noise: single Lighthouse runs vary widely on this machine.
L4 Open: T13/T14 share a commit and T5/T6 share a commit (shared data and section order). AGENTS.md asks for a Co-Authored-By trailer; the user's global rule forbids AI attribution, so commits carry none.
