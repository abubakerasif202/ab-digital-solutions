# Repository Guidelines

## Project Structure

- `app/` is the live Next.js App Router source: routes, shared UI, metadata, API handlers, and site configuration.
- `app/project-data.ts` is the canonical portfolio registry; `app/services/service-data.ts` drives service pages and sitemap entries.
- `public/` contains public assets, icons, and the retained legacy concept under `public/site/ab-digital-premium/`.
- `tests/` contains Node test files; `scripts/` contains portable test, environment, build, and artifact-validation helpers.
- `db/`, `drizzle/`, and `examples/` hold database code, migration metadata, and example app code.

## Build, Test, and Development

Use Node.js 22.x and npm. Install from the lockfile with `npm ci`.

```powershell
npm run dev          # Start the local Next.js server
npm run lint         # Run ESLint
npm run typecheck    # Run TypeScript without emitting files
npm test             # Run tests through scripts/run-tests.mjs
npm run verify       # Lint, typecheck, and tests
npm run build        # Verify, then create the production Next.js build
```

For a focused check, run `npx eslint app/path/to/file.tsx` or `npx tsc --noEmit`; use `npm run verify` before submitting broader changes.

## Coding Style and Naming

Write TypeScript and React components with existing ESLint/Next conventions. Use two-space indentation, semicolons, and double quotes to match current source. Name React components and route folders in PascalCase or descriptive lowercase URL form respectively; use kebab-case for asset filenames and stable slugs for portfolio routes. Keep shared business data centralized rather than duplicating it across pages.

## Testing Guidelines

Tests use Node’s built-in `node:test` runner and are named `tests/*.test.mjs`. Add regression coverage for rendered HTML, routes, metadata, accessibility, and asset references when changing those areas. Run `npm test`, then `npm run verify` for the full local gate.

## Commits and Pull Requests

Use imperative, scoped Conventional Commit subjects such as `fix(ui): correct mobile navigation` or `feat(work): add portfolio project`. Keep commits focused. Pull requests should explain the user-visible change, identify validation commands, link related issues when applicable, and include responsive screenshots for visual changes. Never commit secrets; use `.env.example` as the configuration reference.

## Deployment and Configuration

`vercel.json` defines the Vercel build using `npm ci` and `npm run build`. Configure sensitive values such as `RESEND_API_KEY` only in the environment, not in Git. Treat a successful local build or Git push as separate from Vercel deployment and live-site verification.

## Commit Attribution

AI-authored commits must include a `Co-Authored-By` trailer identifying the agent model.
