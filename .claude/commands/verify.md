---
description: Run the full local quality gate (lint, typecheck, tests) and summarize results
allowed-tools: Bash(npm run lint), Bash(npm run typecheck), Bash(npm test), Bash(git status:*), Bash(git diff:*)
---

Run the project's local gate and report honestly.

1. `git status --short` to note what changed.
2. Run `npm run lint`, `npm run typecheck`, and `npm test` separately (so one failure doesn't hide another).
3. Report a table: step, pass/fail, first failing message if any.
4. If something fails, diagnose the root cause. Do not weaken tests or add ignores to make it pass.

Do not commit, push, or deploy.
