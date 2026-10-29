# Original assets and provenance

The virtual studio is an original AB composition authored for this repository.
No reference site's assets, office plan, textures, models or interactions were
copied. No marketplace models, HDRIs or remote 3D resources are used.

| Asset | Source | Processing / rights context |
| --- | --- | --- |
| `public/studio/ab-monogram.glb` | Existing AB outlines in `public/brand/ab-monogram.svg` and `app/components/logo-mark.ts` | Original local extrusion of AB's existing identity. 58,476 bytes, 576 triangles; no decoder, external buffers or textures. |
| `public/studio/screens/*.webp` | First three canonical `app/project-data.ts` portfolio images already supplied in the repository | 512px WebP derivatives for GPU displays. Original portfolio imagery remains intact for HTML panels and case studies. No new claims of ownership or client outcomes. |
| `public/studio/studio-poster.png` | Local Chromium capture of the actual original Three.js scene | 1440 × 900 still, with interface overlays hidden. Used for the homepage preview, static/reduced-motion experience and social metadata. |
| Architecture, furniture, light shafts, sculpture pedestals and particles | Original TypeScript geometry in `app/studio/scene/` | Procedural meshes, deterministic particles and a small generated marble texture. No externally sourced surface maps. |
| Typography | Existing Bodoni Moda, Schibsted Grotesk and IBM Plex Mono setup | Existing Next/font configuration is preserved. Canvas does not download extra fonts. |
| Three.js / R3F / Drei | Existing Three.js, added React Three Fiber and Drei packages | MIT-licensed software dependencies; their licenses remain in the installed packages. |

## Reproduce

Use the repository's Node 22 environment and installed lockfile dependencies:

```sh
node scripts/generate-studio-assets.mjs
npm run build
npm start -- --port 3100
# In another terminal, with the local production server running:
node scripts/capture-studio-poster.mjs
```

The generator derives its three display textures from the current first three
canonical projects. If the portfolio ordering changes, regenerate the assets.
The capture script uses Playwright Chromium, or `CHROMIUM_PATH` where provided;
it uses `/usr/bin/chromium` when available. Captures do not contact project sites
or send real enquiries. Rebuild after changing the poster before release to
avoid retaining a previous Next Image derivative in the local cache.
