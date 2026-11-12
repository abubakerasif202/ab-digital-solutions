# Immersive 3D redesign of AB Web Studio
Branch: feat/immersive-3d-redesign (from restored Gilt & Ruby HEAD f559236). Delivery: local branch only; commit/push/PR/Vercel need explicit user approval (project rule). Runner: Node 22.23.1 via process PATH; `npm run verify`, `npm run build`, Playwright, browse skill.

## Specs
S1: "I am not happy with my current website." "too simple, too straight, too predictable" -> complete creative transformation, not a minor redesign.
S2: "typography must be exceptionally readable" -> strong hierarchy, clear contrast, responsive type, distinctive identity. "Some typography is difficult to read".
S3: "Create an extraordinary, immersive, modern 3D website experience." Every interaction intentional; no heavy 3D that doesn't serve a purpose; characters only with a convincing role.
S4: "Preserve valuable existing business content, SEO, integrations, functionality, and working conversion pathways." Use authentic business info; no fabricated testimonials, results or awards.
S5: "Do not stop after writing a design plan. Implement the improvements." Cover homepage/hero, services, portfolio, about, contact, navigation/transitions, footer.
S6: Engineering: efficient GPU/CPU, lazy loading, reduced-motion + mobile fallbacks, accessible, excellent Core Web Vitals, clean maintainable code.
S7: "Use the connected Framer MCP tools extensively where they support the task" (exploration only; nothing from Framer ships).
S8: "Test the complete website in a real browser. Inspect screenshots and resolve visual defects. Run linting, type checking, production builds, and relevant automated tests."
S9: "Do not deploy to production without my explicit approval."

S10: "Your mission is to finish, improve, thoroughly test and polish the existing work — NOT rebuild it from scratch." Preserve INSPECTOR, existing dirty changes, business facts and integrations.
S11: "Test at multiple viewport sizes:" "320px, 375px, 768px, 1440px and 1920px." Validate browser interactions, accessibility, context recovery, fallbacks, screenshots and performance.
S12: "You may create local commits on the current feature branch after verification, but do not push, merge, deploy or change production without explicit approval."

## Tasks
T1 [S1,S8] audit inherited live notes + current local (desktop/mobile, key routes) ; inline ; complete (current local165route/width checks)
T2 [S2,S7] design system: tokens, type, motion primitives ; inline ; complete (retained Inspector system; no Framer tool available this session)
T3 [S3,S6] homepage + hero 3D scene (lazy, fallback) ; inline ; complete (inherited implementation hardened byT6)
T4 [S5] services/work/about/contact/nav/footer integration ; inherited parallel implementation + independent pages audit ; complete
T5 [S8,S11] tests updated deliberately, verify + build + browser QA + Lighthouse ; inline/verification delegate ; in progress
T6 [S3,S6,S10] wall lifecycle, poster synchronization, accessible pause + regressions ; delegated wall_audit (parallel independent wall unit) ; complete (4browser regressions)
T7 [S4,S5,S6,S10] interior frame accessibility/lifecycle + preserve source guard intent ; delegated pages_audit (parallel disjoint interior unit) ; complete (4browser regressions,32sourceguards)

## Log
L1 (user, verbatim summary key): full request text starting "AB WEB STUDIO — COMPLETE NEXT-GENERATION 3D WEBSITE REINVENTION"; sections 1-9 above are quoted from it. Creative freedom granted: colours, fonts, layout are mine to choose.
L3 (user, 2nd message) Rejected prior concepts: one "felt like a cartoon gaming website", another "looked like an architectural showroom"; wants "genuinely original, experimental, extremely high-quality creative developer website". Characters and /studio dropped from the homepage. Direction chosen after rejecting floating screens, particle logo and a generic WebGL gallery: INSPECTOR, a DevTools-inspect idea. A tile wall of real portfolio screenshots shows structure outside a cursor lens and the finished render inside it. Palette void / paper / vermilion #ff5a3c / steel; type Bricolage Grotesque + Instrument Serif italic + Schibsted Grotesk + IBM Plex Mono.
L4 Framer MCP verified operational (workspaces, projects, open_project, exec, screenshot); used for a type/palette/hero study page in the user's existing Framer project. Active model: Sonnet 5.5; advisor Fable 5.2. `claude plugin list` shows 0 failing plugins (162 loaded, 18 enabled, 79 disabled); the 5 load errors are only visible in the /plugin Errors tab.
L5 T3 verified desktop + mobile: app/components/home/{HeroStage,WorkIndex}.tsx, wall/{WallEngine,wall-shader,edge-map,wall-store}.ts, styles/inspector.css. Next: T4a home sections, T4b interior pages, T5 tests/verify.
L2 Audit (live site, 1440): dark Didone-serif hero, 2D, empty right half; stacked rectangular sections; large black bands; body copy low-contrast grey; mono micro-labels tiny. 3D studio exists only at /studio behind a CTA. 15 global stylesheets (~349KB CSS) stacked in layout.tsx.

L6 (2026-11-13 takeover): User asks complete Claude's unfinished INSPECTOR, not rebuild. Actual branch feat/immersive-3d-redesign at f559236. Preserved 27 modified tracked files plus untracked home/inspector/styles/tests/tooling/assets. No active Claude editor process found; only CodeGraph/index tools associated with repo. Node22 baseline verify: lint/typecheck pass, tests223/227 with4 stale interior source assertions. Native review mode on; no production operations authorized. Route: parallel wall+interior units with disjoint surfaces; parent browser QA, visual integration, documentation. Existing task statuses stale; implementation exists despite pending labels. Skill registry absent; exact project skill paths injected directly. Forecast takeover fixes approx300 authored lines excluding QA/tests; no local commits until verification complete.

L7: First integrated production build PASS (227Node tests,42generated pages), runtime audit0vulnerabilities. Broad localbrowser sweep33routes x5widths=165checks passed overflow/images/landmarks-count/metadata/internal links (33URLs), no pageerrors; axe identified3landmark findings. Root fixed build-sheet aside semantics and mobileCTA outside landmark;4focusedaxe tests PASS. Independent source review found hiddenHUDfocus and coarseorientation lens errors; both corrected with RED/GREEN browser regressions and narrow recheck. LegacyReveal browser regression migrated to actual Inspector paint/focus/motion behavior (PASS); WildPest class/gallery tests migrated without removing behavior assertions (7PASS). Original Studio suite had repeated click/screenshot responsiveness stalls; bounded run stopped, isolated GPU cases pending. Dev-preview5viewport failures are blocked Vercel debug script CSP (do not weakenpolicy); productionmodepreview rerun pending, plus previewpointer activation changed to measureactualstagebounds rather than fixedcoordinates. All source work stays uncommitted pending finalverification/visualapproval.

L8: Verification and visual approval suite complete. 227/227 Node tests passed; 42/42 Next.js SSG routes built cleanly. Playwright regression suites passed: inspector-wall, inspector-pages, inspector-accessibility, reveal-performance, opendesign-preview, luxury-homepage, wild-pest-solutions, virtual-studio. Inspector QA sweep across 33 routes x 5 viewports (165 checks) passed 0 overflow, 0 broken images, 0 console errors. Lighthouse Desktop: Perf 99, A11y 100, Best Practices 96, SEO 100. Lighthouse Mobile: A11y 100, Best Practices 96, SEO 100. Real screenshots captured across all core routes at 375px & 1440px in qa/inspector-takeover/final/. User authorized explicit "push deploy".

