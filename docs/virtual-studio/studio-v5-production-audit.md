# Studio V5 — production visual and UX audit

**Baseline:** [Live Studio V5](https://www.abwebstudio.com.au/studio), previously released from merge `81617aa`. **Corrections:** local production build only; not committed, pushed, or deployed.

## Method

Captured all four settled room views in Windows Chrome at 1440×1000, 768×1000, and 390×844. Compared each live view with the approved `qa/studio-v5` capture from the same viewport and room. Compared composition, lighting, asset identity, captions and controls instead of demanding pixel equality from a scene with ambient animation and asynchronous focus. Live runs intercepted optional analytics and did not submit an enquiry. Separately sampled touch and SwiftShader in Chrome and ran focused cast simulation tests.

## Room review

| Room | Live comparison against approved V5 |
| --- | --- |
| Reception | The lit arch, AB monogram, Harbour Bridge counter inlay and staffed reception match. Reception hotspot covers the caption at 768 and 1440 px. |
| Portfolio | Real display screenshots and their framing match. Settled 390 px Portfolio was clear in this pass; the same hotspot/caption collision is repeatable at 768 and 1440 px. Desktop details scroll inside the overlay and contained the wheel at the boundary. |
| Services atelier | Four exhibits retain their materials, plinths and daylit composition. Native architecture still partially occludes the rightmost exhibit from the default angle; the room retains direct service controls. No modelling change made. |
| Consultation | Ruby seating, brass pendant and table props match. Desktop preserves an overlay and tablet/phone details remain in the page flow. Readable enquiry action and no horizontal overflow. |

The twelve baseline room captures produced no browser page errors or horizontal overflow. Settled room transitions reached the expected framing at all three sizes. The dominant lighting/material treatment matched approval; thin geometry remains visibly aliased on cheaper renders, and small on-screen portfolio text is better read in the companion details panel. This was not an exhaustive frame-by-frame occlusion or WCAG audit.

## Confirmed defects and local repair

| Defect | Live evidence | Local repair |
| --- | --- | --- |
| Phone welcome over Back to website | At 390 px the welcome overlapped the link vertically by **22.84 CSS px**; the link center failed hit-testing. | Reserve the stacked header's vertical space before the welcome/loading overlay. Local 390 px overlap fell to **0**, and the link center is clickable. A compact short-landscape style also keeps controls inside the stage at 500×300. |
| Projected hotspots over the stage caption | Settled 768 px Portfolio overlaps by about **1,475 CSS px²**; 1440 px by **1,292 CSS px²**. The Reception badge also overlaps at both widths. | Keep projected buttons above the caption/hint footer while preserving targets, world occlusion and existing room navigation. All 12 settled local room captures measured zero caption overlap. |
| Desktop detail scroll boundary | At 1440 px the gallery used a 602 px-high scrollport for 861 px of content. Wheel moved the panel to its bottom, but a second wheel left the outside page at **161 px**. | Keep the approved overlay and its own scrollable content; allow wheel scrolling to chain back to the outer page at its boundaries. Local panel still reached 259 px, then the outer page advanced from **161 px to 611 px**. |
| Wildlife bubble over orbit hint | Live portrait captures show the speech bubble covering the caption/hint. | Show the announcement bubble in place of the decorative stage caption while it is visible; restore the caption on dismissal/expiry. The local after capture shows only the speech bubble in the footer. |

Affected source: `app/studio/StudioExperience.tsx`, `app/studio/scene/Spaces.tsx`, `app/studio/studio.module.css`. Four regressions in `tests/e2e/virtual-studio.spec.mjs`. No changes to models, materials, lighting, assets, portfolio records, contacts, routes or dependency files.

## Cast, input and performance

- Live captures at 1440 and 390 px show the receptionist and gallery staff, an engaging kangaroo reaction, a visible koala, and cockatoo interaction. A pedestrian briefly crosses the desktop bird's line of sight, and a passing vehicle can briefly obscure the kangaroo from the street camera. These are screen-space occlusions, not observed physical collisions. No locomotion change made.
- All **32 targeted cast/simulation tests** passed, including ten simulated minutes of staff obstacle clearance, grounded kangaroo movement, and cockatoo flight clearance and perch return. This is not proof against every possible live collision or camera occlusion.
- Cold live room capture sessions reported **2.96–4.01 s** from entry click completion to arrival. A separate 390 px, 3× DPR Chrome touch run saw orbit change the frame and **161 px** of native vertical page scroll.
- Single 390 px touch/renderer samples, not device benchmarks: Iris Xe/D3D11 opened Portfolio in **83 ms** (487×710 backing buffer); forced SwiftShader did so in **1,571 ms** (390×568 backing buffer). Both entered WebGL. SwiftShader remains visibly slower; not a substitute for low-end-phone testing or field INP.
- No physical Android device was connected. Native Safari was unavailable on Windows, and Playwright WebKit was not installed. iOS Safari, physical-device gestures and thermal performance remain release risks.

## Dependency alert #73

[GHSA-g3hv-75wg-m249](https://github.com/advisories/GHSA-g3hv-75wg-m249) affects `minimatch >=7.0.0 <11.0.1`. The affected path in this checkout is `eslint-config-next@16.4.6 → typescript-eslint@8.59.3 → @typescript-eslint/typescript-estree@8.59.3 → minimatch@10.2.5`. `npm ls minimatch --omit=dev --all` returned no production dependency. The separate 3.1.5 installs are outside the affected range for this advisory.

A compatible-by-metadata candidate is a scoped parent refresh to [`typescript-eslint@8.73.0`](https://registry.npmjs.org/typescript-eslint/8.73.0), allowed by the existing range. Its [ESTree package](https://registry.npmjs.org/@typescript-eslint%2Ftypescript-estree/8.73.0) requests patched `minimatch:^11.0.1`; its ESLint and TypeScript peers match the current stack. Keep that update separate, check the lockfile delta and run Node 22 clean-install/CI before calling it safe in this project. No dependency change was made in this UX patch; the alert is not resolved.

## Verification and evidence

- Node 22: `npm run verify` and `npm run build` passed with **300/300 unit tests**. `npm audit --omit=dev --audit-level=high` returned **zero** production dependency advisories. The final standalone Chrome Studio suite passed **28/28**, including all four new regressions and the 500×300 landscape clause. The four targeted tests first failed on the approved baseline for the intended assertions; the short-landscape clause also failed on the first correction build before the compact override. An intermediate browser run overlapped an output rebuild and had old-server pointer failures; the final standalone run passed those unchanged cases.
- All captures and geometry measurements: `qa/studio-v5-production-audit/`. Comparisons place approved V5 on the left and live baseline on the right; local after captures do not depict the deployed site.
- No release was made. Production enquiry delivery, native Safari and physical mobile/low-end validation remain unverified. Inspect scoped changes and these limitations before authorizing a separate release.

