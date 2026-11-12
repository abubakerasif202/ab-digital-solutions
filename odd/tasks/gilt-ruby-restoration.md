# Gilt & Ruby restoration release readiness
Branch: fix/restore-gilt-ruby-studio-characters; baseline 13ea815; initial HEAD 8798146.
Delivery: single restoration draft PR as explicitly requested; no merge or production deployment. Runner: npm run build, Playwright, local browser QA.

## Specs
S1: "Do not lose Claude's uncommitted improvements." Preserve staged, unstaged and unrelated untracked work.
S2: "Preserve the approved Gilt & Ruby visual identity." Compare baseline, redesign and current source; preserve contact, SEO and custom Studio.
S3: "Continue implementation through all feasible phases, not merely planning or reviewing." Verify Node22, build, full E2E, responsive visuals, accessibility, Lighthouse and Studio profiling; fix evidenced defects.
S4: "push merge deploy". Commit verified restoration, push branch, merge via PR, deploy using linked Vercel project, verify production.
S5: Original production restriction is superseded by L8 explicit approval: "push merge deploy". Preserve known-good rollback and do not release broken redesign bytes.

## Tasks
T1 [S1,S2] delegated read-only forensic audit; in progress; initial HEAD 8798146.
T2 [S3] inline fixes after evidence; pending; no source writes yet.
T3 [S3] delegated long build and browser verification; in progress.
T4 [S4,S5] inline selective commit/push/draft PR after verification; pending.

## Log
L1 User original request: full 11-phase handoff in current conversation, beginning "CODEX CLI — TAKE OVER CLAUDE'S UNFINISHED AB WEB STUDIO RESTORATION". Exact original remains in runtime transcript; this abbreviated locator is not a replacement for that request.
L2 Initial shell ignored supplied cwd and ran from home; all subsequent shell calls explicitly Set-Location. No mutation occurred there.
L3 Correct branch confirmed; HEAD and cached origin/main 8798146. 21 staged files include baseline restoration and obsolete redesign artifacts; 11 unstaged files contain Studio/contrast/404 improvements. Untracked contact-shadow.ts belongs to characters; skills and .codex/agents are separate tooling, preserve unstaged.
L4 Core restored page/layout source has no diff against 13ea815. Node default24, installed22.23.1 available; use process-only PATH, no global version changes or env-file access.
L5 Benchmark RED: old exact selector "Skip Intro" misses live "Skip intro", causing arrival wait failure. Corrected selector only; no product timeout change. GREEN pending real benchmark rerun. Risk: none (QA-only exact label repair).
L6 Full browser run found unsafe pre-existing QA assumptions: opendesign test submitted valid payloads to ambient local contact configuration (502 received; no provider acceptance/inbox proof). Stopped run. Direct valid API probe now requires QA_NO_DELIVERY=1; failure UI test mocks503. Isolated production3113 clears email/Redis/analytics credentials in process before Next dotenv loading; no env file edits. Full rerun pending.
L7 QA RED: Studio hardcoded18 options but canonical studioProjects has19. Replaced magic count with exact canonical option labels; Playwright discovery24 tests passes. Sweep regex matched nested service proof-project slugs and invented105404 failures; changed discovery to validated sitemap routes. Contended software-rendering click/screenshot stalls remain unproven and require isolated rerun; no timeouts inflated.
L8 User authorization update: "push merge deploy". Supersedes S4/S5 delivery restriction only: after validated restoration, push branch, merge and deploy through existing linked Vercel project; verify live release. No destructive production data/credential changes authorized.

L9 Chrome152 uncontended differential passes formerly failing Studio content at390/768/1440, keyboard, context loss, touch orbit and idle rendering. Chrome156 artifacts retained as failed environment evidence, not erased or called product PASS. Full final suite pending.
L10 Full Chrome152 E2E completed:64 pass,5 fail,1 production-only skip; all24 Studio tests passed. Five failures are standalone prototype viewport console404 reports; investigating missing request before patch, no assertions suppressed. Earlier incremental all-pass reports were incomplete and are superseded by aggregate.
L11 Resume: favicon5/5, fullE2E69pass0fail1skip (all24Studio). Lighthouse mobile83/A100/BP96/SEO100 desktop99/100/96/100. Corrected sitemap sweep315/317pass;2stale homepage lifecycle assertions unresolved. Software profile mobile~2.96 renderedfps131draws60910tris, desktop~0.50fps293draws96504tris;idle0draws. Devmirrorcloseups activation timeout120s. Release held; source preserved; finalbuild in progress. See docs/gilt-ruby-restoration-qa.md.
L12 Final production build PASS223tests42pages;lint/typecheckPASS;audit0;diffcheckPASS. Release remains held for explicitly documented missing/failed performance/visual proofs. All changes preserved;HEAD8798146.
L13 Owner final recovery priorities: "Begin with the mobile LCP investigation and the two stale QA checks." Preserve verified baseline; pursue actual mobile bottleneck, approved architecture QA, hydrated character captures, representative GPU baseline, then native risk review and authorized release. Investigation corrects simulated4389ms vs observed704ms LCP; no visibilitybug found. Existing broad CV:auto suggests inspect synchronous Reveal bounds reads before sourcefix.
L14 Studio QA hydration recovered bycorrectlocalhost origin,CSPunchanged; all5hookcloseups visuallyapproved,noactualcharacterdefect. IntelIrisXe hardware baseline19/20.53render submissions/s mobile/desktop,notFPS;SwiftShader2.79/.54;RMGPU0draws2s;hiddenproofunavailable. NewRevealoptimizationRED10syncboundsreads;firstIOprototypefailsarming so investigationcontinues; donotclaimGREENyet.
L15 Measured10synchronousRevealboundsreads forced20.7ms offscreenlayout AFTERLCP. ReplacedwithasyncIOgeometry. PrototypecaughtCV:autoemptyrecttop0falselyabovefold; boundedprobeproved10zero-sizeentries; hasBoundsguardfix. FinalregressionGREEN1/1 zeroinitialreads plusfocus/scroll/dynamic+initialRM. BuildPASS223tests42pages; sourceReviewnofindings; independentbehaviorverificationandfull8widthqueued. NotclaimingdirectLCPfix.
