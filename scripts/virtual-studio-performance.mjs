import { chromium } from "@playwright/test";
import { existsSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
const base = process.env.QA_BASE_URL || "http://localhost:3100";
if (!["localhost", "127.0.0.1"].includes(new URL(base).hostname)) throw new Error("Local-only performance test.");
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || (existsSync("/usr/bin/chromium") ? "/usr/bin/chromium" : undefined), args: ["--no-sandbox", "--enable-unsafe-swiftshader"] });
const samples = [], activation = [];
try {
  for (const width of [390,768,1440]) for (const route of ["/", "/studio"]) for (let run=1; run<=3; run++) {
    const context = await browser.newContext({ viewport: { width, height: width === 390 ? 844 : 1000 }, deviceScaleFactor: 1 });
    const page = await context.newPage();
    await page.route("**/api/analytics", (request) => request.fulfill({ status: 204 }));
    await page.route("**/_vercel/**", (request) => request.fulfill({ status: 200, body: "" }));
    const client = await context.newCDPSession(page);
    await client.send("Network.enable"); await client.send("Network.setCacheDisabled", { cacheDisabled: true });
    await client.send("Network.emulateNetworkConditions", { offline: false, latency: 40, downloadThroughput: 1250000, uploadThroughput: 625000 });
    await client.send("Emulation.setCPUThrottlingRate", { rate: 4 });
    await page.addInitScript(() => {
      window.__lab = { lcp: 0, unexpectedShiftTotal: 0, longTaskMs: 0 };
      new PerformanceObserver((list) => { for (const entry of list.getEntries()) window.__lab.lcp = entry.startTime; }).observe({ type: "largest-contentful-paint", buffered: true });
      new PerformanceObserver((list) => { for (const entry of list.getEntries()) if (!entry.hadRecentInput) window.__lab.unexpectedShiftTotal += entry.value; }).observe({ type: "layout-shift", buffered: true });
      new PerformanceObserver((list) => { for (const entry of list.getEntries()) window.__lab.longTaskMs += entry.duration; }).observe({ type: "longtask", buffered: true });
    });
    await page.goto(`${base}${route}`, { waitUntil: "networkidle" }); await page.waitForTimeout(2000);
    samples.push({ width, route, run, ...await page.evaluate(() => ({ ...window.__lab, transferBytes: performance.getEntriesByType("resource").reduce((sum, entry) => sum+entry.transferSize, 0), modelRequests: performance.getEntriesByType("resource").filter((entry) => /\.glb/.test(entry.name)).length, canvasCount: document.querySelectorAll("canvas").length })) });
    if (route === "/studio" && run === 1) {
      const start = await page.evaluate(() => performance.now());
      await page.getByRole("button", { name: "Enter the Studio", exact: true }).click();
      await page.waitForFunction(() => ["intro", "explore", "failed"].includes(document.querySelector("[data-mode]")?.dataset.mode), null, { timeout: 30000 });
      activation.push({ width, ...await page.evaluate((started) => ({ elapsedMs: performance.now()-started, mode: document.querySelector("[data-mode]").dataset.mode, transferBytes: performance.getEntriesByType("resource").filter((entry) => entry.startTime >= started).reduce((sum, entry) => sum+entry.transferSize,0), modelRequests: performance.getEntriesByType("resource").filter((entry) => /\.glb/.test(entry.name)).length }), start) });
    }
    await context.close();
    console.log(`${route} ${width}px run ${run}: LCP ${Math.round(samples.at(-1).lcp)}ms`);
  }
} finally { await browser.close(); }
const median = (values) => [...values].sort((a,b) => a-b)[Math.floor(values.length/2)];
const summary = [390,768,1440].flatMap((width) => ["/", "/studio"].map((route) => {
  const group = samples.filter((sample) => sample.width === width && sample.route === route);
  return { width, route, medianLcpMs: median(group.map((sample) => sample.lcp)), maxUnexpectedShiftTotal: Math.max(...group.map((sample) => sample.unexpectedShiftTotal)), medianTransferBytes: median(group.map((sample) => sample.transferBytes)) };
}));
await mkdir("qa/virtual-studio", { recursive: true });
await writeFile("qa/virtual-studio/performance.json", JSON.stringify({ capturedAt: new Date().toISOString(), base, browser: browser.version(), conditions: "Local production Next.js; Chromium headless; cold per-context cache; DPR 1; 4× CPU; 40ms RTT; 10Mbps down/5Mbps up; three runs per route/width; software WebGL for activation. No scores or field INP. unexpectedShiftTotal is the cumulative observed unexpected layout shift, not the maximum CLS session window. Analytics intercepted. Initial pages measured before scrolling or 3D intent.", samples, activation, summary }, null, 2));
console.log(JSON.stringify({ summary, activation }, null, 2));
