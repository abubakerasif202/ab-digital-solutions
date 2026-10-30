import { chromium } from "@playwright/test";
import { existsSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
const base = process.env.QA_BASE_URL || "http://localhost:3100";
if (!["localhost", "127.0.0.1"].includes(new URL(base).hostname)) throw new Error("Local-only benchmark.");
const label = process.env.QA_PHASE || "baseline";
if (!["baseline", "v4"].includes(label)) throw new Error("Expected baseline or v4");
const root = process.env.QA_OUT || `qa/living-sydney-v4/final/benchmark-${label}`;
await mkdir(root, { recursive: true });
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || (existsSync("/usr/bin/chromium") ? "/usr/bin/chromium" : undefined), args: ["--no-sandbox", "--enable-unsafe-swiftshader", "--use-angle=swiftshader"] });
const browserVersion = browser.version();
const samples = [];
const retrySample = process.env.QA_SAMPLE?.split(":").map(Number);
if (retrySample && (retrySample.length !== 2 || retrySample.some(value => !Number.isInteger(value) || value < 1))) throw new Error("QA_SAMPLE must be WIDTH:RUN, for example 1440:3.");
const runs = retrySample ? [retrySample] : [390, 768, 1440].flatMap(width => [1, 2, 3].map(run => [width, run]));
const conditions = "Local production Chromium, software WebGL, DPR1, cold cache, 4x CPU, 40ms latency, 10Mbps down, 5Mbps up. Active frame records are instrumented RAF callbacks that submitted draws. No physical-device claims.";
const save = () => writeFile(`${root}/benchmark.json`, JSON.stringify({ capturedAt: new Date().toISOString(), phase: label, sourceCommit: process.env.QA_COMMIT || "working-tree", node: process.version, platform: process.platform, browserVersion, conditions, samples }, null, 2));
try {
  for (const [width, run] of runs) {
    const context = await browser.newContext({ viewport: { width, height: 1000 }, deviceScaleFactor: 1 });
    const page = await context.newPage();
    try {
    await page.route("**/api/analytics", r => r.fulfill({ status: 204 }));
    await page.route("**/_vercel/**", r => r.fulfill({ status: 200, body: "" }));
    const client = await context.newCDPSession(page);
    await client.send("Network.enable");
    await client.send("Network.setCacheDisabled", { cacheDisabled: true });
    await client.send("Network.emulateNetworkConditions", { offline: false, latency: 40, downloadThroughput: 1250000, uploadThroughput: 625000 });
    await client.send("Emulation.setCPUThrottlingRate", { rate: 4 });
    await page.addInitScript(() => {
      window.__gpu = { draws: 0, triangles: 0 };
      for (const name of ["drawElements", "drawArrays", "drawElementsInstanced", "drawArraysInstanced"]) {
        const original = WebGL2RenderingContext.prototype[name];
        WebGL2RenderingContext.prototype[name] = function (...args) {
          window.__gpu.draws++;
          if (args[0] === this.TRIANGLES) window.__gpu.triangles += (name.startsWith("drawElements") ? args[1] : args[2]) / 3 * (name.endsWith("Instanced") ? args[name === "drawElementsInstanced" ? 4 : 3] : 1);
          return original.apply(this, args);
        };
      }
      window.__frames = [];
      const raf = window.requestAnimationFrame.bind(window);
      window.requestAnimationFrame = callback => raf(time => {
        const start = { ...window.__gpu };
        callback(time);
        const draws = window.__gpu.draws - start.draws;
        if (draws) window.__frames.push({ time, draws, triangles: window.__gpu.triangles - start.triangles });
      });
    });
    await page.goto(`${base}/studio`, { waitUntil: "networkidle" });
    const start = await page.evaluate(() => performance.now());
    await page.getByRole("button", { name: "Enter the Studio", exact: true }).click();
    await page.waitForFunction(() => ["arrival", "intro", "explore", "failed"].includes(document.querySelector("[data-mode]")?.dataset.mode), null, { timeout: 30000 });
    const result = await page.evaluate(started => ({ activationMs: performance.now() - started, mode: document.querySelector("[data-mode]").dataset.mode, transferBytes: performance.getEntriesByType("resource").filter(e => e.startTime >= started).reduce((s,e) => s+e.transferSize,0) }), start);
    if (result.mode === "failed") {
      samples.push({ width, run, ...result, success: false });
      await save();
      await context.close();
      continue;
    }
    result.success = true;
    Object.assign(result, await page.locator("canvas").evaluate(canvas => {
      const gl = canvas.getContext("webgl2");
      const debug = gl?.getExtension("WEBGL_debug_renderer_info");
      return { renderer: debug ? gl.getParameter(debug.UNMASKED_RENDERER_WEBGL) : "unavailable", canvasPixels: [canvas.width, canvas.height] };
    }));
    const skip = page.getByRole("button", { name: "Skip Intro", exact: true });
    if (await skip.isVisible()) await skip.click();
    await page.waitForFunction(() => document.querySelector("[data-mode]")?.dataset.mode === "explore", null, { timeout: 10000 });
    await page.waitForTimeout(2300);
    const bounds = await page.locator("canvas").boundingBox();
    if (bounds) {
      const x = bounds.x + bounds.width * .5, y = bounds.y + bounds.height * .55;
      await page.mouse.move(x, y); await page.mouse.down(); await page.mouse.move(x + 12, y, { steps: 3 }); await page.mouse.up();
      await page.waitForTimeout(250);
    }
    // Ambient motion (traffic, people) legitimately draws while the visitor is active.
    const activeStart = await page.evaluate(() => ({ draws: window.__gpu.draws, time: performance.now() }));
    await page.waitForTimeout(1200);
    Object.assign(result, await page.evaluate(started => ({ activeDrawsPer1200ms: window.__gpu.draws - started.draws, activeDrawWindowMs: performance.now() - started.time }), activeStart));
    const frameWindowStart = await page.evaluate(() => { window.__frames = []; return performance.now(); });
    await page.waitForTimeout(4000);
    Object.assign(result, await page.evaluate(started => ({ activeFrames: window.__frames, activeWindowMs: performance.now() - started }), frameWindowStart));
    if (run === 1 && process.env.QA_IDLE !== "0") {
      // After the idle window the world must rest: no timers, no draws.
      await page.waitForTimeout(47000);
      const restStart = await page.evaluate(() => ({ draws: window.__gpu.draws, time: performance.now() }));
      await page.waitForTimeout(3000);
      Object.assign(result, await page.evaluate(started => ({ restedDrawsPer3s: window.__gpu.draws - started.draws, restWindowMs: performance.now() - started.time }), restStart));
      const wakeStart = await page.evaluate(() => ({ draws: window.__gpu.draws, time: performance.now() }));
      const bounds = await page.locator("canvas").boundingBox();
      if (bounds) {
        const x = bounds.x + bounds.width * .5, y = bounds.y + bounds.height * .55;
        await page.mouse.move(x, y); await page.mouse.down(); await page.mouse.move(x + 16, y, { steps: 4 }); await page.mouse.up();
      }
      await page.waitForTimeout(1500);
      Object.assign(result, await page.evaluate(started => ({ drawsAfterWake1500ms: window.__gpu.draws - started.draws, wakeWindowMs: performance.now() - started.time }), wakeStart));
    }
    if (run === 1) {
      await page.evaluate(() => { window.__frames = []; });
      const bounds = await page.locator("canvas").boundingBox();
      await page.mouse.move(bounds.x + bounds.width * .5, bounds.y + bounds.height * .55);
      await page.mouse.down();
      await page.mouse.move(bounds.x + bounds.width * .5 + 25, bounds.y + bounds.height * .55, { steps: 6 });
      await page.mouse.up();
      await page.waitForTimeout(300);
      result.orbitFrames = await page.evaluate(() => ({ count: window.__frames.length, maxDraws: Math.max(0,...window.__frames.map(f => f.draws)), maxTriangles: Math.max(0,...window.__frames.map(f => f.triangles)) }));
      result.orbitRawFrames = await page.evaluate(() => window.__frames);
      // Return to the same establishing camera for repeatable comparison images.
      await page.getByRole("navigation", { name: "Studio spaces" }).getByRole("button", { name: "Reception" }).click();
      await page.keyboard.press("Escape");
      await page.waitForTimeout(2300);
    }
    if (run === 1 && process.env.QA_CAPTURE !== "0") {
      await page.screenshot({ path: `${root}/${width}-overview.png` });
      for (const [area, name] of [["reception","Reception"],["gallery","Portfolio gallery"],["services","Services atelier"],["consultation","Consultation lounge"]]) {
        await page.getByRole("navigation", { name: "Studio spaces" }).getByRole("button", { name }).click();
        await page.waitForTimeout(2100);
        await page.screenshot({ path: `${root}/${width}-${area}.png` });
      }
    }
    samples.push({ width, run, ...result });
    } catch (error) {
      samples.push({ width, run, success: false, error: error.message });
    } finally {
      await save();
      await context.close();
    }
    console.log(JSON.stringify(samples.at(-1)));
  }
} finally { await browser.close(); }
await save();
if (samples.some(sample => !sample.success)) process.exitCode = 1;
