# Studio V5 — local delivery report

Branch: `feat/studio-personality-polish`, starting commit `fbd6f8d`. Scope: existing `/studio` only. No commit, push, merge, deploy, or upload.

## Visual and interaction changes

| Room | Existing scene upgrade |
| --- | --- |
| Reception | Illuminated arch around the original AB monogram, brass counter detailing around the Sydney Harbour Bridge inlay, no new asset or dynamic shadow light. |
| Portfolio gallery | Bronze display mounts and a short selected-display light transition. Retains real project imagery, current projects, and the existing three-display texture budget. |
| Services atelier | Four distinct physical exhibits: responsive web screens, checkout and parcel, search visibility signal, and connected software systems. Existing service routing remains in place. |
| Consultation lounge | Refined ruby seating and lit pendant, brass table edge, folio and cups. The existing consultation enquiry link remains the direct next action. |

The existing cast gains a receptionist nod, alternating staff conversation gestures, a resident kangaroo sniff, an asymmetric koala peek and a cockatoo blink. These use existing deterministic clocks, do not add paths, and leave furniture collision footprints unchanged.

The camera retains frame-independent timing and skip/orbit interruption, uses the facade opening for eye-level indoor/outdoor crossings, and reserves actual screen space for the desktop details panel. Device orientation stays stable when the stage resizes, the atelier has raised/wider shots, and the details panel stacks through 899px so 768px tablets keep the full scene width. No general-purpose camera collision solver was added.

## Reception timeout diagnosis

The original failing Playwright traces did not fail a single React handler: 1440px stalled during scroll before dispatch, 768px during dispatch, and the resize sequence failed at its 1440px step after six smaller widths. The 1440px trace recorded Chromium `GPU stall due to ReadPixels` warnings. Reproduction from an unmodified snapshot of `fbd6f8d` matched the render contention seen with the prior-session lens/inlay patch. Neither matched single Chrome/SwiftShader probe crossed the original 10-second click deadline; the exact legacy-shell timeout threshold was not reproduced in those probes.

Chromium CPU profiles attributed costly skinned-mesh bone transforms to hotspot occlusion raycasts and a separate first-render cost to WebGL shader-info validation. The prior renderer also requested native antialiasing before tier detection; downgrading the tier could not remove the immutable context setting. A delivered click reached the handler normally. The evidence points to renderer and compositor contention, not a blocked or hidden Reception button.

V5 restricts hotspot rays to visible solid occluders, excludes skinned cast/glass and non-rendered targets, and reuses scratch buffers. It starts without MSAA and sizes the backing buffer from the actual canvas host, device DPR, measured quality tier and software-renderer detection. Existing tier downgrades and fallbacks remain. Hardware-backed Chrome passed all previously failing flows with unchanged Playwright timeouts.

## Local measurements

Single sequential 1440 × 1000 viewport probes on Windows, Chrome 157.0.8103.80, Intel Iris Xe/D3D11 or forced SwiftShader. Same capture-then-click procedure, taken before the final presentation-only framing adjustment. Click time is full Playwright action wall time (scroll, stability and dispatch), not INP. Frame interval p95 is a short rAF sample around that click, not steady-state FPS. CPU timings are sampled self-time within the profiling window.

| Build / renderer | Drawing buffer | Pre-click screenshot | Reception click | Frame p95 | Long tasks count / max | Sampled bone transforms |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Committed baseline / SwiftShader | 1440 × 708 | 6946 ms | 3432 ms | 2117 ms | 2 / 803 ms | 694 ms |
| Prior working build / SwiftShader | 1440 × 708 | 4258 ms | 1877 ms | 1517 ms | 2 / 357 ms | 433 ms |
| V5 / SwiftShader | 924 × 454 | 2283 ms | 1708 ms | 770 ms | 4 / 245 ms | 0 ms |
| Prior working build / Iris Xe | 1440 × 708 | 169 ms | 96 ms | 50 ms | 6 / 105 ms | 591 ms |
| V5 / Iris Xe | 1440 × 708 | 144 ms | 70 ms | 17 ms | 0 / — | 0 ms |

Software rendering still has visible slow frames. V5 trades sharper edges on low-tier devices for fewer raster pixels and lower worst observed task duration; it is not a claim that software rendering is fluid. Shader validation still appears in the software profile. No production INP or physical phone measurements were performed.

## Verification and evidence

- Node 22.23.1: `npm run verify` and `npm run build` passed; all **300** unit tests passed.
- `playwright test tests/e2e/virtual-studio.spec.mjs`: **24/24 passed** on installed Chrome with Intel Iris Xe. The landscape/resize test covered 320, 360, 375, 390, 430, 768 and 1440px. The suite also covered keyboard/focus, touch orbit and native scroll, projects, camera reset, guided tour, enquiry, shader/asset loading, WebGL recovery, reduced motion, and data-saving fallback.
- The enquiry test intercepted requests; it does not prove production email delivery. No physical device, Safari, or live deployment verification.
- Evidence: `qa/studio-v5/` (new; previous QA files left intact). The `1440-*`, `768-*`, and `390-*` room files are settled captures; `room-capture-metrics.json` records their backing-buffer sizes and room action times.

## Files and readiness

- Scene: `app/studio/scene/{Spaces,StudioScene,RoomDetails}.tsx`, `camera-motion.ts`, `hotspot-occlusion.ts`; `app/studio/studio.module.css`.
- Simulation: `app/studio/world/sim/{cast-idle,quality,receptionist-behavior,resident-kangaroo,staff-behavior,wildlife}.ts`; `app/studio/world/wildlife/{Cockatoo,Koala}.tsx`.
- Tests: `tests/{living-world,studio-camera,studio-cast-idle,studio-hotspot-occlusion}.test.mjs`; `tests/e2e/virtual-studio.spec.mjs` adds the 768px stacked-panel assertion.
- Tracking: `odd/tasks/studio-v5-living-digital-experience.md`. Existing modified and untracked files remain. Candidate is locally verified, not released; stage only the intended paths before any separately authorized release.
