# AB Web Studio visual refinement (MRK + mobile/inner-page polish)
Branch: fix/ui-ux-release-20261116. Delivery: local only; no commit, merge or deploy. Runner: Node 22, `npm run verify`.

## Specs
S1. Add MRK Removals Adelaide (https://mrkremovalsadelaide.com.au/) under Removals with an authentic screenshot; derive counts (19 -> 20).
S2. Fix the 320px Virtual Studio overlap of the studio name / "Back to website" over the intro label.
S3. Shorten the mobile enquiry journey; keep existing phone/WhatsApp numbers unchanged (owner confirmed).
S4. Reduce wasted space above inner-page content; make the /work sector filter scroll visible.
S5. Portfolio motion stability on mobile (reproduce first); typography and pointer effects.

## Tasks
T1 | S1 | inline | done: entry appended last (slug mrk-removals-adelaide), asset, Studio textures, llms.txt, data.json, test counts.
T2 | S2 | inline | done: stacked controls + reserved space at <=520px; measured no overlap at 320.
T3 | S3 | inline | done: contact section 1960 -> 1784px at 390; email arrow stays on the line at 320. Numbers untouched.
T4 | S4 | inline | done: content-page top padding, breadcrumb margin, services hero heading; filter scroll cue.
T5 | S5 | pending | not reproduced or changed: exhibition scroll-position shift, typography sizes, Studio mobile control hierarchy.

## Log
L1 User request: pasted "AB Web Studio live visual review and Claude implementation prompt" (16 Nov 2026), full text in the conversation.
L2 Pointer glow: PointerFX already limits to min-width 721 + hover + fine pointer; no change.
L3 Verify: lint, typecheck and 287 node tests pass. Not run: production build, Playwright suites, route sweep, reduced-motion/no-WebGL checks.
