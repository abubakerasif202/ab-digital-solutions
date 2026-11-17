# Studio personality and site polish
Objective: review and enhance the existing site and 3D studio, then release.
Branch: feat/studio-personality-polish. Delivery: ask-on-risk, forecast ~350 authored lines. Runner: Node 22.23.1, npm verify/build and Playwright.

## Specs
- S1: "perform deep review full web site fix ui colour add animations". Preserve actual brand/content; repair contact clipping, harmonize editorial gold accents and add accessible micro-motion. Check phone/tablet/desktop geometry, colour and reduced motion.
- S2: "also perfgorm 3d studio enhance improve add more intrestring funny stuff ennhance chractewrs and movments and fix anything etc". Extend existing deterministic staff/wildlife systems with expressive bounded movement and original quips. Preserve quality budgets, idle/pause, keyboard/touch and fallback functionality.
- S3: "and push merge deploy". Validate intended changes, push and merge through existing GitHub origin, verify deployment through the already-linked Vercel project and smoke live routes. No real contact submissions or secret reads.

## Tasks
- T1 [S1,S2] inline, complete: source and baseline runtime audit; contact clipping reproduced at 320/390, route matrix below. No source edits.
- T2 [S1] delegated, complete (fresh-build browser 5/5 GREEN): visual fixes + focused browser regression; parallel disjoint UI edit surfaces with T3. Commit pending.
- T3 [S2] delegated, implemented (37/37 focused tests GREEN): studio personality + deterministic regression; parallel disjoint sim/UI surfaces with T2. Commit pending.
- T5 [S3] delegated install/check, complete: patch Next 16.4.3 to 16.4.6 and matching ESLint config; Risk item 5 dependencies. Commit cfc30a4.
- T4 [S1-S3] inline with delegated checks, pending: integrate, full verify/build, responsive/3D QA, independent review and approved release. Risk item 5: deployment. Commit pending.

## Route/scene matrix
| Routes | Goal and scene | Interaction / mobile / fallback |
| --- | --- | --- |
| / | Explain agency; existing cinematic project exhibition | Semantic links, selected project, retained 2D content; focused gold/crimson palette |
| /work, /work/[slug] | Authentic portfolio; project-specific visual plates | Existing filters, deep links and project imagery; responsive cards |
| /services, /services/[slug] | Understand services; existing editorial installations | Focus and hover micro-motion, ordinary links, no required motion |
| /about | Understand studio; preserve supplied Sydney gold/crimson artwork | Existing semantic copy and CTA; responsive composition |
| /contact | Start enquiry; semantic form and contact rows | Repair stacked mobile contacts; no delivery side effects in QA |
| /studio | Explore working studio; rooms, staff, wildlife | Existing camera controls, locals buttons, opt-in audio, pause/still, no-WebGL fallback |
| /privacy, /terms and sitemap routes | Read policy/detail content | Preserve metadata, heading and navigation; route sweep |

## Log
- L1 2026-11-17 user request verbatim: "@Doers-3d-Website-Creator perform deep review full web site fix ui colour add animations also perfgorm 3d studio enhance improve add more intrestring funny stuff ennhance chractewrs and movments and fix anything etc and push merge deploy"
- L2 Audit: working tree began with unrelated .claude/settings.json, modified qa/virtual-studio and untracked skills/QA. Preserve all. Base HEAD 0f2364be155a9fdead807efa7878e5e2a4ddb8ed; includes existing About artwork commit ahead of main. Existing .next runtime is baseline only, not fresh HEAD proof.
- L3 Review: 24 baseline combinations on /, /work, /services, /about, /contact, /privacy at 320/390/768/1440, one h1 and no reported document overflow; contact values nevertheless have zero width at narrow widths. Root cause is late mobile nowrap overriding intended wrap.
- L4 Existing staff and animals already use a seeded scheduler, bounded reactions and accessible buttons. Extend these; do not introduce new dependencies or continuous render loops. RDD is disabled globally; leave it disabled. Registry absent; installed exact skill paths loaded. Node default is 24, use process-local Node22 PATH.

- L5 T2 observed three RED browser regressions (contact geometry, palette, keyboard motion). Focused ruby tests 4/4 and eslint pass. T3 observed three new RED cases then 37/37 focused Node tests GREEN, focused eslint pass. Combined source/tests diff 174 authored lines before task doc. Separate reviewers and production build in progress.
- L6 origin/main advanced to d45fea6, merging the existing 0f2364b About artwork via PR55; source tree identical to feature base. No need to reapply that existing change. Native assess cannot classify the dirty untracked inventory; RDD remains disabled/unmanaged, so no native transaction or consent started.


- L7 Initial production build lint/typecheck/290 Node tests and 43-page compilation passed, then build exited 1 with Next SecurityFatalError. npm production audit high threshold exits 0 but reports moderate GHSA-mfr8-8qww-v76h (16.3.0–16.4.4 affected). Primary GitHub advisory verifies 16.4.5 patched; npm resolves current 16.4.6 patch. User's fix-anything/release scope includes minimal remediation, no warning bypass. Update Next and matching eslint-config-next to 16.4.6, preserve all other dependencies/config. Independent code and TypeScript reviews report no actionable source findings; studio 37/37 independently pass. Final browser exact gold check remains pending.


- L8 T5 patch GREEN: npm ci (443 packages) successful on native Windows Node22.23.1; exact Next+eslint config16.4.6; npm run build exit0, lint/typecheck/290 Node tests pass and 43 pages generated. Production audit moderate threshold reports zero vulnerabilities. Independent lockfile review and npm ls/audit pass with no unrelated package drift. Fresh production server session4414 on3100. Browser suites and 34-route x7-width sweep underway in isolated temp evidence folders.


- L9 Fresh UI browser suite5/5 PASS, including exact palette, readable contact geometry at320/375/390/640/768/1024/1440, focus motion and live reduced-motion switch. Full route sweep covers34 routes x7 widths=238 combinations;292 checks,289 pass and3 failures all stale .nav-cta harness selector, not product focus defect. All16 axe checks, no runtime exceptions/failed images/unexpected console errors. Updated script assertion to require focus on actual nonempty last nav focusable; check-only syntax/eslint/diff pass; interactions-only recheck pending.
- L10 Studio software-renderer run canceled after12 completed (6pass,6 action/screenshot10s timeouts; remaining incomplete). Parent probe confirms default Chromium156 uses SwiftShader CPU while installed Chrome157.0.8103.79 uses Intel IrisXe D3D11. Full24 unchanged assertions/timeouts rerun on hardware profile after route browser closed. No product change or inflated timeout used to conceal failures.
