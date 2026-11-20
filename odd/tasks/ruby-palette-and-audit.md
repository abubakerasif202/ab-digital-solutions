# Ruby palette and audit
Branch: fix/ruby-palette-and-audit at 4868284. Delivery: reviewed PR to main, no direct push to main.
Runner: Node 22, npm verify/build, local production Chrome and Lighthouse.

## Specs
S1. "Replace the orange/vermilion accent (#ff5a3c family) with a premium RUBY accent across the whole site." Use the seven requested values, AA contrast and 3:1 focus contrast, including OG, with gold details and untouched copy, layout, and motion.
S2. "Trace which routes/components actually use those selectors and move route-specific CSS into the route or component that needs it (homepage-only, /studio-only, /work/[slug]-only)." Preserve layout and compare six named routes at 1440/1024/768/390/360.
S3. "add a modern \"browserslist\" to package.json" and measure actual shipped polyfills.
S4. "Fix by batching reads/writes or using IntersectionObserver/ResizeObserver. Do not remove animations." Profile homepage, work and studio; fix visible content-visibility pop-in.
S5. "Never delete a file until you have proven it is unused (static imports, dynamic/template-string paths, CSS url(), scripts, tests, next.config, vercel.json)." Remove the two named root artifacts, ignore them, preserve Git history and all current v3 variants. List proven removals and sizes.
S6. "Only fix it if you can do so without eager-loading the whole wall" for desktop work-wall LCP. Leave unchanged when safe improvement cannot be verified.
S7. "npm ci && npm run lint && npm run typecheck && npm test" and "npm run build"; local Lighthouse and visual matrix, state/console checks, unchanged SEO/accessibility/headers/contact/404. PR contains real evidence and gaps. Latest authorization: "push deploy merge", through PR and existing configured integration once authorized and verified.

## Tasks
- T1 S1 — inline palette and regression verification; verified 6.90:1 primary and 5.77:1 hover.
- T2 S2–S4 — read-only mapping delegated; inline changes and independent browser review; local checks passed; framework polyfills and mobile Studio startup remain.
- T3 S5 — delegated read-only asset proof, inline cleanup verified; V3 untouched.
- T4 S6–S7 — local verification completed; remote delivery not started.

## Log
- L1: Original request in this conversation specifies ruby, audit remediation and a PR against 4868284. Follow-up approved GPT-6.2 Sol for unavailable explorer. The main working copy has unrelated changes; all operations use a clean sibling worktree.
- L2: Node 22 build, 308 unit tests, 60 viewport captures, 12 Lighthouse runs and two Studio E2E checks. Results and limitations: docs/ruby-audit-qa.md.
