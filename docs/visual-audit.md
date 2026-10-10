# Homepage visual and motion audit

## Verified source findings

- The live homepage source uses Bodoni Moda, Schibsted Grotesk and IBM Plex Mono and the Gilt & Ruby stage layer. These are preserved.
- Hero WebGL is already progressive enhancement: the server renders an inline geometric sculpture, phones/coarse pointers/data-saving/constrained devices use that fallback, and desktop WebGL starts only after pointer intent and idle scheduling. Rendering stops when motion settles, when the stage leaves the viewport, or when the document is hidden. Context loss and renderer creation failures restore the fallback. No replacement renderer or dependency was needed.
- Metallic text previously animated background position indefinitely. This causes repeated text painting despite the stage layer's transform/opacity-only comment. The metallic finish is now static; the entrance sequence and lightweight orbit motion remain.
- The homepage hero CTA used generic project language. It now offers **Get a Website Quote**, alongside **View Our Work**, a registry-derived case-study count and a direct call link using the existing business phone.
- Reveal used a 12% intersection threshold, which can be unreachable for very tall content, and did not reveal on keyboard focus. It now reveals as soon as content intersects the inset viewport, reveals when a descendant receives focus, restores server-visible state during cleanup, and leaves content visible when IntersectionObserver is unavailable.
- The homepage referred to every case study as live. Destination review by the portfolio audit found a suspended destination and hosted showcases; the wording now accurately says digital project case studies.

## Implemented refinement

- Enlarged desktop editorial title with the existing mobile bounds and viewport-height cap preserved.
- Refined ruby/gold light balance without extra assets, canvas passes or scripts.
- Added a contrast veil at tablet widths and softened the decorative phone sculpture.
- Increased featured-work technical label from 11px to 12px.
- Added forced-colour support so metallic headline text remains visible in high-contrast mode.
- Removed duplicated homepage registry commentary.

## Validation

- `npx eslint app/agency-home.tsx app/components/motion/Reveal.tsx`: passed.
- Next.js installed guides read before changes: `01-app/02-guides/lazy-loading.md` and `01-app/03-api-reference/01-directives/use-client.md`.
- Integrated build, test, browser and responsive results are recorded in the main implementation report. Source inspection alone does not establish live WebGL behaviour, colour contrast conformance or production performance.

## Files

- `app/agency-home.tsx`
- `app/gilt-ruby-stage.css`
- `app/components/motion/Reveal.tsx`

No production release, business pricing, project outcomes or external infrastructure changed in this scope.
