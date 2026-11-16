# UI/UX review — 16 November 2026

Status: partial source review and local fixes; release incomplete.

The requested ui-ux-pro-max workflow was run for a premium digital agency portfolio, including its design-system search and Next.js guidance. Recommendations were assessed against the existing ruby/gold design, rather than replacing the established brand with the search's generic palette.

## Verified source findings and fixes

- The project exhibition could advance after 7.2 seconds while a visitor held a finger on its image or controls. Touch interaction now suspends the timer until release, cancellation or leaving the region. This protects the active case-study destination during the gesture.
- Finger drag animation ignored Save-Data. It now follows the same preference guard as mouse depth. Changing reduced-motion or Save-Data preferences clears the existing drag offset and dragging attribute.
- The exhibition browser suite still expected a persistent pause button removed by earlier commits. Removed those obsolete assertions while retaining keyboard navigation and project-history checks. Added browser regressions for a held touch, cancellation/release and changing reduced-motion during a drag. These browser regressions have not been executed in this session.

Source inspection also covered header focus trapping/inert handling, mobile navigation breakpoint cleanup, sticky CTA exclusion zones, contact labels/validation/status handling, hero media preference gates, touch lighting cleanup and exhibition loading/error handling. This does not establish visual or accessibility conformance across every route.

## Validation and environment

- Runtime: Node 22.23.2.
- Full lint step passed within `npm run verify`.
- `npm run typecheck` passed, including Next route generation.
- Focused Node run passed both `mobile-motion.test.mjs` and `project-exhibition.test.mjs`.
- `npm test`: 38 of 39 test files passed. `luxury-homepage.test.mjs` failed importing Sharp because the installed dependencies contain a Windows binary and no Linux binary. No dependency files or lockfiles were changed.
- Browser spec syntax and scoped `git diff --check` passed.
- A separate `/tmp` dependency install failed with registry DNS errors (`EAI_AGAIN`). An offline retry failed with `ENOTCACHED` for locked dependency `zustand@5.0.16`.
- Local server capability probe failed with `EPERM` binding `127.0.0.1:3199`. Responsive screenshots, browser interaction tests and live computed contrast checks remain outstanding.
- Windows PowerShell interoperability failed with WSL `UtilBindVsockAnyPort` socket error.
- The session mounts repository `.git` read-only. Commit/push cannot be completed here. The request authorizes push/deploy; no additional user approval was requested.

Production build, dependency audit, responsive visual review, independent code review, push, Vercel deployment and live smoke verification are incomplete. No release or all-issues-fixed claim is made. Pre-existing settings and QA changes were preserved.

## Remaining validation commands

Run with Node 22 and platform-correct dependencies. Keep Linux dependencies in a separate Linux mirror when using WSL.

```powershell
npm ci
npm run build
npm audit --omit=dev --audit-level=high
# Separate terminal:
npm run start -- --port 3100
# With the local server running:
npx playwright test
$env:QA_WIDTHS = '375,768,1024,1440'
$env:QA_OUTPUT_DIR = 'qa/ui-ux-review-20261116'
node scripts/studio-rebuild-qa.mjs
```

Inspect the screenshots and resolve any failures before selectively committing these changes and deploying through the existing linked Vercel project. Keep unrelated dirty files out of the release.
