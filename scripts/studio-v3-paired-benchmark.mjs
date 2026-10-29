import { chromium } from "@playwright/test";
import { existsSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
const base = process.env.QA_BASE_URL || "http://localhost:3100";
if (!["localhost", "127.0.0.1"].includes(new URL(base).hostname)) throw new Error("Local-only benchmark.");
const root = process.env.QA_OUTPUT_DIR || "qa/studio-v3";
await mkdir(root, { recursive: true });
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || (existsSync("/usr/bin/chromium") ? "/usr/bin/chromium" : undefined), args: ["--no-sandbox", "--enable-unsafe-swiftshader", "--use-angle=swiftshader"] });
const samples = [];
try {
  for (const width of [390, 768, 1440]) for (let run = 1; run <= 3; run++) for (const label of ["before", "after"]) {
    const base = label === "before" ? "http://localhost:3103" : "http://localhost:3102";
    const context = await browser.newContext({ viewport: { width, height: 1000 }, deviceScaleFactor: 1 });
    const page = await context.newPage();
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
        if (draws) window.__frames.push({ draws, triangles: window.__gpu.triangles - start.triangles });
      });
    });
    await page.goto(`${base}/studio`, { waitUntil: "networkidle" });
    const start = await page.evaluate(() => performance.now());
    await page.getByRole("button", { name: "Enter the Studio", exact: true }).click();
    await page.waitForFunction(() => ["intro", "explore", "failed"].includes(document.querySelector("[data-mode]")?.dataset.mode), null, { timeout: 30000 });
    const result = await page.evaluate(started => ({ activationMs: performance.now() - started, mode: document.querySelector("[data-mode]").dataset.mode, transferBytes: performance.getEntriesByType("resource").filter(e => e.startTime >= started).reduce((s,e) => s+e.transferSize,0) }), start);
    if (result.mode === "failed") throw new Error("Activation failed");
    const skip = page.getByRole("button", { name: "Skip Intro", exact: true });
    if (await skip.isVisible()) await page.keyboard.press("Escape");
    await page.waitForTimeout(2300);
    const idleStart = await page.evaluate(() => window.__gpu.draws);
    await page.waitForTimeout(1200);
    result.idleDraws = await page.evaluate(started => window.__gpu.draws - started, idleStart);
    if (run === 1 && process.env.QA_CAPTURE !== "0") {
      await page.evaluate(() => { window.__frames = []; });
      const bounds = await page.locator("canvas").boundingBox();
      await page.mouse.move(bounds.x + bounds.width * .5, bounds.y + bounds.height * .55);
      await page.mouse.down();
      await page.mouse.move(bounds.x + bounds.width * .5 + 25, bounds.y + bounds.height * .55, { steps: 6 });
      await page.mouse.up();
      await page.waitForTimeout(300);
      result.orbitFrames = await page.evaluate(() => ({ count: window.__frames.length, maxDraws: Math.max(0,...window.__frames.map(f => f.draws)), maxTriangles: Math.max(0,...window.__frames.map(f => f.triangles)) }));
      // Return to the same establishing camera for repeatable comparison images.
      await page.getByRole("navigation", { name: "Studio spaces" }).getByRole("button", { name: "Reception" }).click();
      await page.keyboard.press("Escape");
      await page.waitForTimeout(2300);
    }
    if (run === 1 && process.env.QA_CAPTURE !== "0") {
      await page.screenshot({ path: `${root}/${label}-${width}-overview.png` });
      for (const [area, name] of [["reception","Reception"],["gallery","Portfolio gallery"],["services","Services atelier"],["consultation","Consultation lounge"]]) {
        await page.getByRole("navigation", { name: "Studio spaces" }).getByRole("button", { name }).click();
        await page.waitForTimeout(2100);
        await page.screenshot({ path: `${root}/${label}-${width}-${area}.png` });
      }
    }
    samples.push({ phase: label, width, run, ...result }); console.log(JSON.stringify(samples.at(-1)));
    await context.close();
  }
} finally { await browser.close(); }
await writeFile(`${root}/paired-benchmark.json`, JSON.stringify({ capturedAt: new Date().toISOString(), conditions: "Local production Chromium, software WebGL, DPR1, cold cache, 4x CPU, 40ms latency, 10Mbps down, 5Mbps up. Redraw counts cover resize transition, not a single frame. Not physical-device results.", samples }, null, 2));

for (const phase of ["before", "after"]) {
  await mkdir(`${root}/${phase}`, { recursive: true });
  await writeFile(`${root}/${phase}/benchmark.json`, JSON.stringify({ conditions: "Alternating before/after cold contexts, same Chromium process, local default Turbopack builds, forced SwiftShader, DPR1, 4x CPU, 40ms latency, 10/5Mbps; no concurrent browser/build work. Three samples per width. Not physical-device results.", samples: samples.filter(sample => sample.phase === phase) }, null, 2));
}
