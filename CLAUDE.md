@AGENTS.md

## Claude Code workflow (project-level)

Stack: Next.js 16 App Router, React 19, Tailwind 4, deployed on Vercel. Read `node_modules/next/dist/docs/` before using framework APIs.

- `/verify` runs lint, typecheck, and tests. `npm run verify` is the full gate.
- `/site-audit [area]` runs the read-only SEO, accessibility, performance, and Vercel-readiness audit (`web-quality-auditor` + `web-code-reviewer` subagents).
- `/pre-deploy` runs build, env-name, and redirect checks without deploying.
- `/pr-draft` drafts a PR description; it never pushes or opens the PR.
- The `site-release-check` skill covers adding projects/services and the release checklist.
- Commit, push, PR creation, and Vercel commands require explicit approval. Never read or edit `.env*` secrets.
