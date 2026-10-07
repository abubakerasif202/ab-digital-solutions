# Portfolio evidence audit — 7 October 2026

All 14 projects, slugs, descriptions, features and canonical case-study URLs are retained. Only technology arrays with direct local source evidence have been corrected. Public labels now say “Project technology” rather than imply that every historical deployment has been independently verified.

## Confirmed source corrections

| Project | Evidence relative to this checkout | Corrected presentation |
| --- | --- | --- |
| Maple Rentals | `../maple-rental-clean/package.json` | React, TypeScript, Vite, Tailwind CSS |
| Gala Rentals | `../Gala-rentals/package.json`; README identifies galarentals.com.au | React, TypeScript, Vite, Tailwind CSS |
| ZQ Removals | `../zq/package.json`, `site-src/`, `scripts/build-site.mjs` | HTML, Vanilla CSS, JavaScript, JSON-LD |
| DECENT Development | `../decent-development/package.json` | React, Vite, Tailwind CSS, Framer Motion |
| Milestone Development | `../milestonedevelopment-site/package.json`, `src/` | HTML, CSS, JavaScript, GSAP |
| 1st Class Express | `../1st/package.json` | React, TypeScript, Vite, Tailwind CSS |

Local package manifests also support the existing Next.js/TypeScript labels for Jufaja Homes, the 247 site and inventory application, Adelaide Wholesale Tyres, HF and Cheap Adelaide. Aftab's `frontend/package.json` supports React and Framer Motion. Package evidence identifies source dependencies; it does not prove the currently deployed revision.

## Unresolved source / live destination differences

- 4 Point Concrete has two local candidates: `../4point-concrete` (React/Vite) and `../4-point-concrete-showcase` (TanStack/Vite). Neither directly proves the revision behind the portfolio's `4point-concrete-website.vercel.app` URL. Existing stack remains unchanged pending deployment provenance; it should not be considered independently verified.
- HF's local `lib/site-data.ts` declares `https://www.hfremovalsadelaide.com.au`, while the portfolio links to `.com`.
- ZQ's local `site-src/data/business.mjs` declares `https://zqremovalsadelaide.com.au`, while the portfolio links to `zqremovals.au`.
- Existing live destinations are preserved. Network redirect/status evidence and canonical ownership should determine any later destination changes; a successful HTTP response alone cannot verify a technical stack.

## Authentic imagery

`sharp.metadata()` confirms all 14 supplied captures: Jufaja 1920×1080, Adelaide Wholesale Tyres 1440×986, and the other 12 captures 1348×926. Work and case-study frames use these exact proportions, contain rather than stretch imagery, and remove the previous oversized crop/pan. No mobile capture was fabricated. The inventory case study retains only the existing public staff sign-in capture and explicitly identifies that limitation. No customer or operational records are exposed.

## Read-only live verification

Checked 7 October 2026 with unauthenticated public HTTP GETs, following redirects and inspecting titles and canonical links. No forms, credentials or private inventory screens were accessed. Machine-readable evidence: `outputs/portfolio-live-audit.json`.

| Project | HTTP status | Finding |
| --- | --- | --- |
| Jufaja Homes | 200 | Existing Vercel destination works; canonical is `https://www.jufajaconstructions.com.au`. That host independently returns 200 with the same JUFAJA title and canonical. Existing destination preserved. |
| Aftab & Sons Transport | 200 | Existing destination and canonical agree. |
| 247 Inventory System | 200 | Public root redirects to `/login`; title is 24/7 Inventory Operations. No canonical on public sign-in. |
| Adelaide Wholesale Tyres | 200 | Existing destination and canonical agree. |
| 24/7 Truck Tyre Services | 200 | Existing destination and canonical agree. |
| Maple Rentals | 200 | Existing destination and canonical agree. |
| Gala Rentals | 503 | Public homepage returns Service Suspended; repeated independent GET also returns 503. Existing known destination retained. Client-site restoration is outside this repository. |
| ZQ Removals | 200 | `zqremovals.au` redirects to `https://zqremovalsadelaide.com.au/`, agreeing with canonical and local source. Existing valid redirect preserved. |
| DECENT Development | 200 | Existing destination and canonical agree. |
| Milestone Development | 200 | Existing destination and canonical agree. |
| 4 Point Concrete | 200 | Existing Vercel destination and canonical agree. HTML loads `/assets/index-CB1AyZ0j.js` and `/assets/styles-D2sUS5o0.css`; no Next assets observed. Exact deployment/source provenance remains unresolved. |
| 1st Class Express | 200 | Existing destination and canonical agree. |
| HF Removals Adelaide | 200 | `.com` redirects to `https://www.hfremovalsadelaide.com.au/`, agreeing with canonical and local source. Existing valid redirect preserved. |
| Cheap Adelaide Removalist | 200 | Existing destination and canonical agree. |

These checks resolve the HF/ZQ destination questions above. Availability is a point-in-time observation. No URL targets were changed. Gala's availability issue and 4 Point's source-provenance uncertainty remain explicit limitations.
