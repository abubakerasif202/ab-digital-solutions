# Portfolio and SEO audit — 9 October 2026

## Verified findings and changes

- All 14 canonical project slugs and case studies are preserved. Existing overview, approach, features and technology content already provide useful case-study structure; no client results were invented.
- Read-only HTTP GET checks of every destination returned 200 for 13 projects, including the public login page of 247 Inventory System. Gala Rentals returned HTTP 503 with a `Service Suspended` page. It now retains its case study and external link with an explicit unavailable label rather than being described as a live website. Recheck its availability before removing that label.
- ZQ Removals redirects from `zqremovals.au` to `zqremovalsadelaide.com.au`; HF redirects from the `.com` domain to `www.hfremovalsadelaide.com.au`. Registry and `llms.txt` now use the verified destinations directly.
- Jufaja and 4Point are reachable at Vercel-hosted addresses. Reachability does not prove that these are client production domains or temporary previews. Their labels now say `Hosted website showcase`; no production status is asserted.
- The hero ticker's six-item counter now says `Featured`, distinguishing its selected rotation from the 14-item portfolio.
- Work and case-study conversion links now say `Get a Website Quote`. Existing live-site links, telephone links, screenshots and project navigation remain intact.
- About and Services descriptions were already meaningful but comparatively long. They now describe the studio and offer more concisely, retaining Sydney/Australian context. Existing canonicals, metadata API, OG/Twitter cards, structured data, robots and sitemap registry routing were retained.

## Destination checks

| Project | HTTP result | Destination interpretation |
| --- | --- | --- |
| Jufaja | 200 | Hosted website showcase; production intent unverified |
| Aftab & Sons Transport | 200 | Branded public website |
| 247 Inventory System | 200 → `/login` | Public staff-access entry; internal records not inspected |
| Adelaide Wholesale Tyres | 200 | Branded public website |
| 24/7 Truck Tyre Services | 200 | Branded public website |
| Maple Rentals | 200 | Branded public website |
| Gala Rentals | 503 | Service Suspended; external owner follow-up required |
| ZQ Removals | 200 after redirect | Current branded `.com.au` domain |
| DECENT Development | 200 | Branded public website |
| Milestone Development | 200 | Branded public website |
| 4Point Concrete | 200 | Hosted website showcase; production intent unverified |
| 1st Class Express | 200 | Branded public website |
| HF Removals Adelaide | 200 after redirect | Current branded `.com.au` domain |
| Cheap Adelaide Removalist | 200 | Branded public website |

These checks establish current reachability and page identity only; they do not establish ownership, deployment history, client approval or complete external-site functionality.

## Validation

- Read the installed Next.js metadata guide at `node_modules/next/dist/docs/01-app/01-getting-started/14-metadata-and-og-images.md` before editing metadata.
- Targeted ESLint passed for all changed portfolio, metadata and ticker source files.
- `npx tsc --noEmit` passed.
- `node --experimental-strip-types --import ./tests/register-ts-hooks.mjs --test tests/project-destinations.test.mjs` passed both registry/destination regression tests.
- Full production build, rendered-route/browser checks and full-source guard updates are integrated into the primary audit workflow.

## External follow-up

Gala Rentals requires its owner to restore or confirm the correct public website. The implementation does not change that external infrastructure. Client approval/production status of Vercel-hosted showcases requires owner knowledge; the current labels explicitly avoid guessing.
