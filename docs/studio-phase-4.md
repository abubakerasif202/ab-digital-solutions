# AB Web Studio Phase 4

The local integration branch is `hybrid-wsl`. Checkpoint `df3d86b` captures the coordinator’s verified work before Phase 4. The Claude and Codex worker trees were independently preserved, fast-forwarded to the checkpoint, and integrated locally. The coordinator owns integration and browser evidence. Claude Code owns the homepage and architectural finishes. Codex owns scene loading, shaders and the browser matrix. The local task manifest is in `test-results/phase-4/work-manifest.md`.

## Visual implementation

- The homepage uses the [documented Sydney Harbour plate](cinematic-footage.md) behind the project wall. The grade uses layered amber and ruby lighting with a dark vignette. The wall’s pause control also pauses the harbour movement. Reduced motion keeps it still, and Save-Data skips the decorative image.
- The virtual studio adds brass frames and architectural joinery, warmer metallic reflections, veined stone, ruby lacquer and velvet. Repeated pieces share instanced meshes. Existing portfolio captures remain the source used in the wall, project detail pages and studio screens.

## Activation engineering

The uncompressed reflection map was 1.6 MB and normally started after the scene module and canvas initialized. The monogram’s measured transfer was about 12 KB, so compressed geometry decoders would add substantial complexity for a small transfer. The scene now begins the model and reflection requests together. It prefers a separate gzip asset and falls back to the unchanged raw map if the browser cannot decode it or the download fails. The versions of existing immutable URLs are preserved.

Shader readiness is cached per renderer. Later stages reuse completion checks. Context loss still uses the HTML fallback, and the arrival film starts after all seven staged systems and the initial gallery textures have committed. Each stage retains its task boundary so the browser can process input between bouts of construction.

## Verification commands

Use the native WSL repository with Node 22.23.2. Build and browser jobs run separately with one Playwright worker.

```bash
npm run build
npm audit --omit=dev --audit-level=high
npm run start -- --port 3102
```

Run the production-only preview gate from a second terminal with `VERCEL_ENV=production npm run start -- --port 3103`.

```bash
QA_BASE_URL=http://127.0.0.1:3102 QA_PROD_GATE_URL=http://127.0.0.1:3103 npx playwright test
QA_BASE_URL=http://127.0.0.1:3102 node scripts/studio-activation-benchmark.mjs
```

The local browser runner, `test-results/phase-4/run-cross-browser.sh`, runs Firefox and WebKit separately against the same production build. WebKit uses the official Playwright Ubuntu image as an unprivileged user because the native WSL host lacks the compatible libraries and the package-manager dry run showed unresolved dependencies.

## Physical-device verification

Measure tap-to-usable time, frame pacing, heat and memory across repeated entry and exit on an iPhone with Safari and a mid-range Android device with Chrome. Repeat with reduced motion and constrained bandwidth. Check swipe and pinch gestures, browser chrome resizing, tab focus, and WebGL recovery after backgrounding. The software-rendered WSL benchmark covers cold activation and transfer size.
