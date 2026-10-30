// Local pose evidence only: forced high tier + virtual RAF time. Never use for performance claims.
import { chromium } from "@playwright/test";
import { existsSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import { setTimeout as sleep } from "node:timers/promises";

const base = process.env.QA_BASE_URL || "http://127.0.0.1:3100";
const local = url => ["localhost", "127.0.0.1"].includes(new URL(url).hostname);
if (!local(base)) throw new Error("Motion diagnostics must run locally.");
const out = process.env.QA_OUT || "qa/living-sydney-v4/final/motion-diagnostic";
const times = (process.env.QA_MOTION_SECONDS || "0,8,16,24,28,32,36,40,44,48,52,56,60").split(",").map(Number);
if (times.some((time, i) => !Number.isFinite(time) || time < 0 || time > 180 || (i && time <= times[i - 1]))) throw new Error("Expected increasing diagnostic seconds between 0 and 180.");
await mkdir(out, { recursive: true });
const manifest = {
  purpose: "POSE DIAGNOSTIC ONLY. Not activation, frame-pacing, GPU, physical-device or production-tier evidence.",
  overrides: {
    forcedHighTier: true, hardwareConcurrency: 16, deviceMemoryGb: 16,
    rendererDetection: "UNMASKED_RENDERER_WEBGL overridden in this browser only; actual value retained below.",
    clock: "Playwright Clock.install/pauseAt/runFor: virtual performance, timers and nominal 16ms RAF. No fastForward.",
    betweenCaptures: "Native GL draws suppressed after the fully rendered initial scene, while application simulation and bone transforms run normally. Draws restored and RAF stepped before every screenshot.",
    visitorInput: "Synthetic pointer activity keeps ambient simulation awake. Input behavior is covered by the separate functional suite.",
    camera: "Normal overview/services presets, diagnostic walker/reception close-ups, and street-wide [-14,3,23] looking at [0,1.7,11] with FOV50. Reception close-up temporarily permits a camera distance below the normal orbit minimum. Local browser state only.",
    introspection: "Read the installed R3F Canvas rootState ref through React's private fiber hooks. Fail explicitly if unavailable.",
  },
  base, node: process.version, capturedAt: new Date().toISOString(), errors: [], captures: [],
};
const persist = () => writeFile(`${out}/manifest.json`, JSON.stringify(manifest, null, 2));
await persist();
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || (existsSync("/usr/bin/chromium") ? "/usr/bin/chromium" : undefined),
  args: ["--no-sandbox", "--enable-unsafe-swiftshader", "--use-angle=swiftshader"],
});
try {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 1, reducedMotion: "no-preference" });
  const page = await context.newPage();
  page.on("pageerror", error => manifest.errors.push(error.message));
  page.on("console", message => { if (message.type() === "error") manifest.errors.push(message.text()); });
  await page.route("**/api/analytics", route => route.fulfill({ status: 204 }));
  await page.route("**/_vercel/**", route => route.fulfill({ status: 200, body: "" }));
  await page.route("**/api/contact", route => route.abort());
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "hardwareConcurrency", { configurable: true, get: () => 16 });
    Object.defineProperty(navigator, "deviceMemory", { configurable: true, get: () => 16 });
    window.__abMotionDiagnostic = { skipDraws: false, realDraws: 0, suppressedDraws: 0, actualRenderer: null };
    const proto = WebGL2RenderingContext.prototype;
    const originalParameter = proto.getParameter;
    proto.getParameter = function (parameter) {
      const actual = originalParameter.call(this, parameter);
      if (parameter === 37446) { // WEBGL_debug_renderer_info.UNMASKED_RENDERER_WEBGL
        window.__abMotionDiagnostic.actualRenderer = String(actual);
        return "AB_LOCAL_POSE_DIAGNOSTIC_HARDWARE";
      }
      return actual;
    };
    for (const name of ["drawArrays", "drawElements", "drawArraysInstanced", "drawElementsInstanced"]) {
      const original = proto[name];
      proto[name] = function (...args) {
        const diagnostic = window.__abMotionDiagnostic;
        if (diagnostic.skipDraws) { diagnostic.suppressedDraws++; return; }
        diagnostic.realDraws++;
        return original.apply(this, args);
      };
    }
  });
  // Installed API documentation: playwright-core/types/types.d.ts Clock interface.
  // Install before navigation, let hydration complete, then pause before creating any 3D scene.
  await page.clock.install({ time: new Date("2026-10-30T00:00:00Z") });
  await page.goto(`${base}/studio`, { waitUntil: "networkidle" });
  if (!local(page.url())) throw new Error("Unexpected non-local redirect.");
  await page.clock.pauseAt(await page.evaluate(() => Date.now() + 100));
  const click = async text => {
    const found = await page.evaluate(label => {
      const button = [...document.querySelectorAll("button")].find(element => element.textContent.trim().replace(/^\d{2}\s*/, "") === label);
      button?.click();
      return !!button;
    }, text);
    if (!found) throw new Error(`Diagnostic control unavailable: ${text}`);
    await sleep(30); // Node time, so asset/React work can settle while the page clock is paused.
  };
  await click("Enter the Studio");
  let ready = false;
  for (let attempt = 0; attempt < 600; attempt++) {
    await page.clock.runFor(16);
    const state = await page.evaluate(() => ({ mode: document.querySelector("[data-mode]")?.dataset.mode, draws: window.__abMotionDiagnostic.realDraws }));
    if (state.mode === "failed") throw new Error("Scene activation failed during pose setup.");
    if (["arrival", "intro", "explore"].includes(state.mode) && state.draws > 0) { ready = true; break; }
    await sleep(100);
  }
  if (!ready) throw new Error("No fully rendered scene within diagnostic setup budget.");
  // Keep all initial environment/PMREM/texture passes intact before enabling draw suppression.
  await page.clock.runFor(64);
  await page.evaluate(() => {
    const canvas = document.querySelector("canvas");
    let fiber = canvas?.[Object.keys(canvas).find(key => key.startsWith("__reactFiber$"))];
    for (let depth = 0; fiber && depth < 40; depth++, fiber = fiber.return) {
      for (let hook = fiber.memoizedState, count = 0; hook && count < 80; hook = hook.next, count++) {
        const candidate = hook.memoizedState?.current;
        if (candidate?.scene?.isScene && candidate?.camera && candidate?.gl) {
          // Canvas keeps its initial onCreated state; controls are attached by a later effect.
          // Read the current external-store snapshot rather than retaining that initial value.
          const current = typeof candidate.get === "function" ? candidate.get() : candidate;
          if (!current.controls) throw new Error("Diagnostic scene controls have not mounted.");
          window.__abDiagnosticScene = current;
          return;
        }
      }
    }
    throw new Error("Installed React/R3F rootState diagnostic introspection is unavailable.");
  });
  const advance = async milliseconds => {
    await page.evaluate(() => { window.__abMotionDiagnostic.skipDraws = true; });
    for (let remaining = milliseconds; remaining > 0; remaining -= 2000) {
      await page.evaluate(() => window.dispatchEvent(new PointerEvent("pointermove", { clientX: 20, clientY: 20 })));
      await page.clock.runFor(Math.min(2000, remaining));
      await sleep(10);
    }
    await page.evaluate(() => { window.__abMotionDiagnostic.skipDraws = false; window.__abDiagnosticScene.invalidate(); });
    await page.clock.runFor(32);
  };
  // Let the normal arrival cue summon the kangaroo before skipping the camera introduction.
  // This uses the existing simulation cue, with no character-state overrides.
  await advance(900);
  await click("Skip Intro");
  const cameraPreset = () => page.evaluate(() => {
    const { camera, controls } = window.__abDiagnosticScene;
    return { position: camera.position.toArray(), target: controls.target.toArray(), fov: camera.fov, minDistance: controls.minDistance, view: camera.view ? { ...camera.view } : null };
  });
  await advance(1900);
  const overview = await cameraPreset();
  await click("Services atelier");
  await advance(1900);
  await click("Collapse details");
  const services = await cameraPreset();
  const started = await page.evaluate(() => performance.now());
  const capture = async (seconds, preset, beat) => {
    await page.evaluate(({ preset, overview, services }) => {
      const state = window.__abDiagnosticScene, camera = state.camera;
      const frames = [];
      state.scene.traverse(object => { if (object.isSkinnedMesh) frames.push(object.parent); });
      const walker = frames.find(root => Math.abs(root.scale.x - .98) < .001);
      const chosen = preset === "overview" ? overview : services;
      camera.position.fromArray(chosen.position); state.controls.target.fromArray(chosen.target); camera.fov = chosen.fov;
      state.controls.minDistance = chosen.minDistance;
      camera.clearViewOffset();
      if (chosen.view?.enabled) {
        const v = chosen.view;
        camera.setViewOffset(v.fullWidth, v.fullHeight, v.offsetX, v.offsetY, v.width, v.height);
      }
      if (preset === "walker-closeup") {
        if (!walker) throw new Error("Walking rig unavailable.");
        camera.clearViewOffset(); camera.fov = 42;
        camera.position.set(walker.position.x + 3.8, 2.25, walker.position.z + 4.8);
        state.controls.target.set(walker.position.x, 1.05, walker.position.z);
      }
      if (preset === "street-wide") {
        camera.clearViewOffset(); camera.fov = 50;
        camera.position.set(-14, 3, 23);
        state.controls.target.set(0, 1.7, 11);
      }
      if (preset === "reception-closeup") {
        const receptionist = frames.find(root => Math.abs(root.scale.x - 1) < .001);
        if (!receptionist) throw new Error("Receptionist rig unavailable.");
        const position = receptionist.getWorldPosition(receptionist.position.clone());
        camera.clearViewOffset(); camera.fov = 42;
        state.controls.minDistance = 0;
        camera.position.set(position.x + 2.5, position.y + 1.7, position.z + 3.5);
        state.controls.target.set(position.x, position.y + 1.1, position.z + .3);
      }
      camera.updateProjectionMatrix(); state.controls.update(); state.invalidate();
    }, { preset, overview, services });
    await page.clock.runFor(32);
    const file = `1440-staff-${String(seconds).replace(".", "_")}-${preset}${beat ? `-${beat}` : ""}.png`;
    await page.screenshot({ path: `${out}/${file}`, animations: "disabled" });
    const raw = await page.evaluate(() => {
      const rigs = [];
      window.__abDiagnosticScene.scene.traverse(object => {
        if (object.isSkinnedMesh) rigs.push({ height: object.parent.scale.x, position: object.parent.position.toArray(), worldPosition: object.parent.getWorldPosition(object.parent.position.clone()).toArray(), yaw: object.parent.rotation.y, boneRotations: object.skeleton.bones.map(bone => bone.rotation.toArray().slice(0, 3)) });
      });
      const state = window.__abDiagnosticScene;
      return {
        virtualPerformanceMs: performance.now(), rigs,
        camera: { position: state.camera.position.toArray(), target: state.controls.target.toArray(), fov: state.camera.fov },
        drawInstrumentation: { ...window.__abMotionDiagnostic },
      };
    });
    manifest.captures.push({ file, requestedSeconds: seconds, cameraPreset: preset, beat, virtualElapsedMs: raw.virtualPerformanceMs - started, ...raw });
    await persist();
    console.log(JSON.stringify({ file, virtualElapsedMs: raw.virtualPerformanceMs - started, walker: raw.rigs.find(rig => Math.abs(rig.height - .98) < .001)?.position }));
  };
  for (const seconds of times) {
    const elapsed = await page.evaluate(() => performance.now()) - started;
    await advance(Math.max(0, seconds * 1000 - elapsed));
    for (const preset of ["overview", "services", "walker-closeup", "street-wide"]) await capture(seconds, preset);
  }
  await click("Reception");
  await advance(1900);
  await click("Collapse details");
  await capture(Math.round(await page.evaluate(() => performance.now()) - started) / 1000, "reception-closeup", "greeting");
  await advance(7000);
  await capture(Math.round(await page.evaluate(() => performance.now()) - started) / 1000, "reception-closeup", "typing");
  const positions = manifest.captures.map(capture => capture.rigs.find(rig => Math.abs(rig.height - .98) < .001)?.position).filter(Boolean);
  manifest.walkingObserved = positions.some(position => Math.hypot(position[0] - positions[0][0], position[2] - positions[0][2]) > .25);
  manifest.status = manifest.walkingObserved && manifest.errors.length === 0 ? "PASS_POSE_DIAGNOSTIC" : "FAIL_POSE_DIAGNOSTIC";
  await persist();
  if (manifest.status !== "PASS_POSE_DIAGNOSTIC") process.exitCode = 1;
  await context.close();
} catch (error) {
  manifest.status = "FAIL_POSE_DIAGNOSTIC";
  manifest.failure = String(error.stack || error);
  await persist();
  throw error;
} finally { await browser.close(); }
