# Repository Instructions

## Commands and verification

- Use Node.js 22.x and `npm ci`. Keep native WSL dependencies in a separate Linux source/dependency mirror; never install them into Windows `node_modules`.
- `npm run verify` runs lint → typecheck → Node tests. `npm run build` already runs that gate before `next build`; CI also runs `npm audit --omit=dev --audit-level=high`.
- Use `npm run typecheck`, not bare `tsc`: `scripts/typecheck.mjs` runs `next typegen` first and avoids Windows shell wrappers.
- Focused lint: `npx eslint app/path/to/file.tsx`.
- Focused Node test: `node --experimental-strip-types --import ./tests/register-ts-hooks.mjs --test tests/contact-route.test.mjs`. Preserve the import hook for TypeScript source resolution. `npm test` discovers only root `tests/*.test.mjs`, not browser specs.
- Browser tests: build, run `npm run start -- --port 3100` in another terminal, then `npx playwright test` (`tests/e2e/`). The Playwright config does not start a server; override its target with `QA_BASE_URL` and browser binary with `CHROMIUM_PATH`.
- The separate route/viewport sweep is `node scripts/studio-rebuild-qa.mjs` against a local server on port 3100. It mocks contact delivery; `QA_WIDTHS` and `QA_OUTPUT_DIR` limit scope and separate evidence. See `docs/studio-rebuild-qa.md` for setup/WSL limitations.

## Sources of truth and asset traps

- Next.js in `app/` is the deployment source; do not revive the retired Cloudflare/vinext or static concept toolchains. Homepage content is in `app/agency-home.tsx`; business details/canonical origin are in `app/site-config.ts`.
- Register portfolio entries in `app/project-data.ts` and services in `app/services/service-data.ts`; `app/sitemap.ts` derives their detail URLs. Keep `public/llms.txt` synchronized. Sitemap modification dates track content changes, not build time.
- Portfolio captures must be authentic 1348 × 926 homepage screenshots at `public/site/ab-digital-premium/assets/ab-portfolio-<slug>.jpg`. Images are required, with no fallback; preserve stable slugs and destination classifications. See README's portfolio checklist and `tests/source-guards.test.mjs`.
- Legacy concept redirects in `next.config.ts` are deliberately enumerated: a wildcard would swallow the still-live `/site/ab-digital-premium/assets/` images. That asset directory has immutable one-year caching; use a new URL when replacing cached bytes.
- When changing versioned studio asset bytes, bump `STUDIO_ASSET_REV` in **both** `app/studio/studio-assets.ts` and `next.config.ts`. The config is tested in isolation and must not import the app.
- Keep `turbopackFileSystemCacheForBuild: false` in `next.config.ts`: restored Vercel caches previously served stale CSS under content-hashed URLs.

## Operational boundaries

- Commit, push, PR creation, and Vercel commands require explicit user approval (also recorded in `CLAUDE.md`). Use scoped Conventional Commits; AI-authored commits require a `Co-Authored-By` trailer identifying the model. Include responsive screenshots with visual PRs.
- Use committed `.env.example` for variable names; do not read or edit real `.env*` secrets. Contact delivery needs `RESEND_API_KEY`; Upstash credentials enable shared rate limiting, otherwise the fallback is per-instance only.
- Deploy only through the existing linked Vercel project, using `vercel.json` and Next-managed `.next` output; do not override the output directory. A successful build or push does not verify deployment or the live site.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
