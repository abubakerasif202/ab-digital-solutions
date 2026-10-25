---
description: SEO, accessibility, performance, and Vercel-readiness audit of the site (read-only)
argument-hint: "[optional route or area, e.g. /work or contact]"
---

Use the `web-quality-auditor` subagent to audit this site. Focus: $ARGUMENTS (whole site if empty).

Then, in parallel where independent, use `web-code-reviewer` on the current `git diff` if there are uncommitted changes.

Return one merged report: critical issues first, then a prioritized fix list, then what could not be verified without a browser or live URL. Make no edits.
