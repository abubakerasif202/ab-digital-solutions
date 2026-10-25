---
description: Draft a PR title and description from the branch diff (does not push or open the PR)
allowed-tools: Bash(git status:*), Bash(git diff:*), Bash(git log:*)
---

Draft a pull request for the current branch against `main`.

1. `git log main..HEAD --oneline` and `git diff main...HEAD --stat`, then read the key diffs.
2. Write a Conventional Commit style title (e.g. `feat(work): add portfolio project`).
3. Body: user-visible change, validation commands run (and their real results; run `/verify` first if unknown), related issues, and a responsive-screenshot reminder for visual changes.
4. Print the draft only. Do not commit, push, or run `gh pr create`; ask me first.
