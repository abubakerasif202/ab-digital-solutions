# Ruby palette and audit verification

Base: `4868284`. Candidate: `fix/ruby-palette-and-audit`. Local production build, Node 22.23.1, Chromium, and Lighthouse 13.6.0. No production or provider checks are claimed here.

## Summary

- Centralizes the ruby accent in a single CSS token file. Both generated Open Graph images read that file; both server trace manifests include it. Gold remains the default for branding, display accents and fine details. The footer band and service ticker use white on ruby. CTA states, keyboard focus and validation errors were checked separately.
- Keeps common cinematic and ruby primitives in the root; moves homepage-only rules behind the home route and interior rules behind the work, services and about layouts. Production screenshots and computed typography caught an import-order regression; the final ordering preserves the baseline layout. Existing work layouts still share some case-study CSS.
- Batches geometry reads before scroll writes and measures progress range on resize. Studio room tabs use resize-driven document geometry rather than reading a bounding box on every scroll; the room picker stayed at the same Y coordinate when opening and closing details. Services, enquiry and footer were visible on immediate scroll. No motion or pause controls were removed.
- Declares a modern Browserslist. The Next.js legacy audit result did not disappear. The framework emits its prebuilt polyfill independently of this declaration ([Next.js #86785](https://github.com/vercel/next.js/issues/86785)); no private framework alias or bundler patch was shipped.
- Retires assets proven unused by the tracked application, scripts, configuration and active tests. All ten V3 files and companion plates are retained. The logo master moved intact out of `public/`. The two root artifacts remain in Git history; no rewrite was attempted.

## Palette and contrast

| Token | Value | Verified contrast |
|---|---|---|
| `--ruby` | `#B3122E` | White 6.90:1 |
| `--ruby-hover` | `#C8173A` | White 5.77:1 |
| `--ruby-deep` | `#7A0C1F` | White 11.05:1 |
| `--ruby-on` | `#FFFFFF` | 6.90:1 on the closing band (including focus) |
| `--ruby-text-dark` | `#FF8A9B` | 8.87:1 on near-black, 6.80:1 for focus on the raised form field |
| `--ruby-text-paper` | `#9B111E` | 7.21:1 on the cream services section (text and focus) |
| `--ruby-glow` | `rgba(179, 18, 46, 0.14)` | Decorative only |

## Verification

```text
npm ci: added 441 packages
npm run lint: exit 0
npm run typecheck: Types generated successfully; exit 0
npm test: 308 tests, 308 pass, 0 fail
npm run build: compiled successfully; generated 43 static pages; exit 0
Playwright Studio focus and room tabs: 2 passed (10.4s)
```

- 60 full-page captures: baseline and candidate for `/`, `/work`, `/work/hf-removals-adelaide`, `/studio`, `/services/web-design-sydney`, and `/contact`, each at 1440, 1024, 768, 390, and 360px. All returned HTTP 200; no horizontal overflow. At initial measurement the homepage document height changes because skipped contact content now lays out; visible section typography and dimensions were compared separately.
- [Desktop comparisons](../qa/ruby-palette-audit/desktop.jpg) · [Mobile comparisons](../qa/ruby-palette-audit/mobile.jpg)
- Browser checks: primary CTA normal, hover, keyboard focus and pressed; white on ruby in the ticker and closing band; keyboard form focus, validation and submitting/disabled state with a mocked contact request; fast scroll to services, enquiry and footer; Work → Home → Work; Studio still-mode room tab anchoring; both OG image endpoints HTTP 200. No live contact request was sent.
- Expected localhost Speed Insights script 404 and the resulting MIME warning are present in baseline and candidate. No new console errors were observed in the 30-entry candidate matrix.

## Lighthouse

One run per route and preset; lab results are not field data. Byte columns are Lighthouse estimates. Best Practices is 96 on localhost due to the Speed Insights script 404 and resulting MIME error; Accessibility and SEO scored 100. Desktop work-wall tiles remain lazy, avoiding eager loading for a variable LCP element.

| Route / preset | Perf | LCP (s) | TBT (ms) | CLS | Unused CSS (B) | Blocking CSS requests / B | Legacy JS (B) | Forced reflow (ms) | A11y / BP / SEO |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| home mobile | 99 → 100 | 1.37 → 1.21 | 94 → 52 | 0.001 → 0.001 | 37566 → 30603 | 4 / 58546 → 3 / 54502 | 15226 → 15226 | 72.3 → 0.0 | 100/96/100 → 100/96/100 |
| home desktop | 98 → 98 | 1.07 → 1.16 | 0 → 0 | 0.001 → 0.001 | 38437 → 31577 | 4 / 58546 → 3 / 54502 | 15226 → 15226 | 90.6 → 0.0 | 100/96/100 → 100/96/100 |
| studio mobile | 64 → 64 | 4.20 → 4.05 | 1014 → 1093 | 0.000 → 0.000 | 38153 → 32721 | 4 / 62470 → 3 / 46741 | 15226 → 15226 | 0.0 → 48.0 | 100/96/100 → 100/96/100 |
| studio desktop | 94 → 95 | 0.87 → 0.80 | 188 → 173 | 0.000 → 0.000 | 38122 → 33561 | 4 / 62470 → 3 / 46741 | 15226 → 15226 | 56.7 → 44.9 | 100/96/100 → 100/96/100 |
| work-hf-removals-adelaide mobile | 97 → 97 | 1.22 → 1.21 | 82 → 29 | 0.099 → 0.099 | 35598 → 31014 | 4 / 61302 → 4 / 49454 | 15226 → 15226 | 64.5 → 41.1 | 100/96/100 → 100/96/100 |
| work-hf-removals-adelaide desktop | 100 → 100 | 0.29 → 0.29 | 0 → 0 | 0.000 → 0.000 | 36452 → 31844 | 4 / 61302 → 4 / 49454 | 15226 → 15226 | 0.0 → 0.0 | 100/96/100 → 100/96/100 |

Encoded stylesheet bytes observed through the browser at 1440px:

| Route | Before | After |
|---|---:|---:|
| `/` | 54,466 | 51,438 |
| `/work` | 61,385 | 61,314 |
| `/work/hf-removals-adelaide` | 61,385 | 61,314 |
| `/studio` | 58,388 | 43,677 |
| `/services/web-design-sydney` | 61,385 | 61,314 |
| `/contact` | 61,385 | 61,314 |

## Removed or relocated

23,204,515 bytes deleted from the public tree, plus 990,426 bytes moved to docs. Sizes are from the baseline Git blobs.

| Path | Bytes |
|---|---:|
| `AB-Web-Studio-OpenDesign-Kit.zip` | 8,672 |
| `kimi-export-session_-20260922-144747.md` | 521,286 |
| `public/cinematic/sydney-gold-crimson-plate.webp` | 120,860 |
| `public/cinematic/sydney-night-v1-desktop.mp4` | 1,061,753 |
| `public/cinematic/sydney-night-v1-desktop.webm` | 611,246 |
| `public/cinematic/sydney-night-v1-mobile-poster.webp` | 19,376 |
| `public/cinematic/sydney-night-v1-mobile.mp4` | 553,498 |
| `public/cinematic/sydney-night-v1-mobile.webm` | 606,736 |
| `public/cinematic/sydney-night-v1-poster.webp` | 30,952 |
| `public/cinematic/sydney-ruby-v2-desktop.mp4` | 1,355,334 |
| `public/cinematic/sydney-ruby-v2-desktop.webm` | 741,777 |
| `public/cinematic/sydney-ruby-v2-mobile-poster.webp` | 26,480 |
| `public/cinematic/sydney-ruby-v2-mobile.mp4` | 709,233 |
| `public/cinematic/sydney-ruby-v2-mobile.webm` | 483,991 |
| `public/cinematic/sydney-ruby-v2-poster.webp` | 56,344 |
| `public/cinematic/sydney-studio-plate.webp` | 96,906 |
| `public/film/ab-film-poster.webp` | 23,692 |
| `public/film/ab-studio-ruby-v2-1080.mp4` | 3,325,264 |
| `public/film/ab-studio-ruby-v2-720.mp4` | 1,131,433 |
| `public/film/ab-studio-ruby-v2-poster.webp` | 43,616 |
| `public/film/ab-web-studio-film-1080.mp4` | 8,410,510 |
| `public/film/ab-web-studio-film-720.mp4` | 3,795,514 |
| `public/brand/ab-logo-luxury-source.png` → `docs/brand/ab-logo-luxury-source.png` | 990,426 (moved, not deleted) |

Studio mobile TBT stayed high (1,014 → 1,093 ms in the single local pair). The dominant long task was in a React DOM client chunk, not the on-demand 3D scene. No reduced-motion setting, runtime workaround or scene change was applied.

Use existing CI, a preview smoke pass, and production verification before treating the release as live. Remaining framework polyfills, mobile Studio startup cost and shared route CSS are reported, not hidden. There is no external backlink inventory for retired media.
