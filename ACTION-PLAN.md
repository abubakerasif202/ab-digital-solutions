# AB Digital Solutions Release Action Plan

## Completed in source

- [x] Replace the iframe homepage with native semantic React content.
- [x] Rebuild the visual system around premium black, white and red art direction.
- [x] Add the six required live projects and retained screenshot previews.
- [x] Add an accessible, pausable hero project slideshow.
- [x] Improve navigation, typography, spacing, cards, forms and mobile reflow.
- [x] Add canonical, social, robots, sitemap, manifest and JSON-LD metadata.
- [x] Configure native Next.js output for Vercel while retaining the Sites build fallback.
- [x] Add deployment contract tests and a custom not-found route.

## Release gates

- [x] Complete `npm ci` in Vercel's production build environment.
- [x] Pass `npm run lint`.
- [x] Pass `npm run typecheck`.
- [x] Pass `npm test`.
- [x] Pass `npm run build`.
- [x] Review and commit the final diff.
- [x] Push `main` to the configured GitHub remote.
- [x] Deploy the production release to the single Vercel project.
- [x] Verify the live responsive implementation, metadata, links, images and contact actions; confirm the production runtime error scan is clean.

## Post-launch maintenance

- Measure production LCP, INP and CLS after launch.
- Review service content quarterly and project previews after client-site redesigns.
- Add substantive service or case-study pages only when each route has genuinely unique content.
