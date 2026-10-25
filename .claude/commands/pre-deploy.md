---
description: Pre-deploy checklist for Vercel (verify gate, build, env, redirects) without deploying
allowed-tools: Bash(npm run verify), Bash(npm run build), Bash(git status:*), Bash(git log:*), Bash(git diff:*)
---

Prepare a release check. Do NOT push, merge, or deploy, and do not read `.env*` files.

1. `git status` and `git log origin/main..HEAD --oneline`: list unpushed/uncommitted work.
2. `npm run build` (this already runs `verify`). Report pass/fail and bundle/route output highlights.
3. Compare variable names in `.env.example` with `process.env.*` usage in `app/` (names only). Flag any unset-by-design gaps such as `RESEND_API_KEY` that must be set in Vercel.
4. Check `vercel.json` and `next.config.ts` headers/redirects still match AGENTS.md ("legacy concept URLs redirect to /").
5. Output a go/no-go with remaining manual steps (Vercel preview check, responsive screenshots, live-site probe after deploy).

Remember: a passing local build is not a verified Vercel deployment.
