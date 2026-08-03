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

- [ ] Complete `npm ci` in a network-enabled environment.
- [ ] Pass `npm run lint`.
- [ ] Pass `npm run typecheck`.
- [x] Pass `npm test`.
- [ ] Pass `npm run build`.
- [ ] Review and commit the final diff.
- [ ] Push `main` to the configured GitHub remote.
- [ ] Deploy the already-linked Vercel project with `vercel --prod`.
- [ ] Verify the live desktop and mobile experience, metadata, links and form actions.

## Post-launch maintenance

- Measure production LCP, INP and CLS after launch.
- Review service content quarterly and project previews after client-site redesigns.
- Add substantive service or case-study pages only when each route has genuinely unique content.
