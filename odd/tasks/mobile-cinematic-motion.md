# Mobile cinematic motion upgrade
Branch: fix/remove-pause-controls (uncommitted, not pushed). Runner: `npm run verify`, `node scripts/run-tests.mjs`, Playwright emulation script (scratch).

## Specs
S1 "Preserve autoplaying, muted, inline Sydney footage on supported mobile browsers."
S2 "Retain cinematic word reveals, staggered entrances ... Adapt line wrapping and timing for narrower screens."
S3 "Keep the constantly changing project exhibition, automatic rotation ... Add smooth touch/swipe interaction."
S4 "Preserve image reveals, parallax, animated sections, ruby light effects and premium scrolling transitions."
S5 "Maintain animated ruby highlights, glowing accents, sophisticated interactive states."
S6 "Ensure playback, seeking, fullscreen and video presentation work smoothly on iPhone and Android."
S7 "Recompose complex desktop animation layouts for a portrait screen rather than removing the animations."
S8 "Use device capability, not screen width alone"; "Preserve prefers-reduced-motion"; "Do not modify the approved desktop appearance."

## Tasks (all inline; no writer trigger)
- T1 S1 hero video: first touch lifts a blocked autoplay; PiP/remote-playback off. Done.
- T2 S2 hero words: shorter stagger at <=600px. Done.
- T3 S5 touch ruby light: ambient drift (hover:none), finger-follow light, :active states, CTA sheen loop. Done.
- T4 S4 scroll depth fallback when CSS scroll-driven animation is unsupported (iOS Safari < 26). Done.
- T5 S3 exhibition finger-drag follow + slow depth drift on narrow stage. Done.
- T6 S7 hero chapters (Harbour/Arteries/Skyline) shown on phones. Done.
- T7 S6 brand film: fullscreen control never squeezed out at 320/360. Done.
- T8 Tests, build, preview. Done (see Log).

## Log
L1 (user, verbatim intro): "MISSION: Bring the full desktop cinematic experience to mobile."
L2 Verified in Chromium mobile emulation (touch, hover:none, DPR 3) at 320/360/375/390/430: hero webm plays (+1.5s), no horizontal overflow, words visible, chapters visible with running progress, exhibition auto-rotates and swipes (drag follows, settles), brand film plays/seeks, fullscreen control visible.
L3 Reduced motion: video not loaded, light animation none, rotation stopped, headline visible.
L4 Harness caveat: after a CDP swipe, a following tap intermittently produces no click in Chromium (same 50% on baseline code); film playback verified in runs without the prior swipe.
L5 Not verified: real iOS Safari / Android hardware, iOS Low Power Mode, native fullscreen on device. Intro overlay stays skipped on coarse pointers (scroll-lock risk) - deliberate, unchanged.

## Desktop vs mobile checklist
| Desktop motion | Mobile now |
|---|---|
| Sydney hero film, autoplay muted inline | Yes (mobile encode, retry on first touch) |
| Word-by-word headline reveal | Yes (tighter timing <=600px) |
| Harbour/Arteries/Skyline chapter progress | Yes (recomposed as full-width row) |
| Cursor-driven ruby light | Finger-driven light + ambient drift |
| CTA sheen on hover | Looping sheen + :active state |
| Exhibition auto-rotation | Yes |
| Exhibition mouse parallax / hover pause | Swipe with finger-follow; tap previews |
| Scroll-driven image drift, hero exit, progress | Native where supported, JS fallback otherwise |
| Reveal on scroll, kinetic band, grain, sweep | Yes (unchanged, grain slower) |
| Brand film play/seek/fullscreen | Yes, controls fit at 320 |
| Brand intro overlay | No (kept off on touch) |
| WebGL 3D hero (legacy component) | Not used on home; unchanged |
