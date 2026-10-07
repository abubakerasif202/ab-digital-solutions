import puppeteer from "puppeteer";
import { mkdir, writeFile } from "node:fs/promises";

const base = process.env.QA_BASE_URL || "http://127.0.0.1:3100";
const label = process.env.QA_PHASE || "before";
const browser = await puppeteer.launch({ headless: true });
const samples = [];
try {
  for (const width of [390, 1440]) {
    for (let run = 1; run <= 3; run++) {
      const page = await browser.newPage();
      await page.setRequestInterception(true);
      page.on("request", (request) => {
        if (new URL(request.url()).pathname === "/api/analytics") void request.respond({ status: 204 });
        else void request.continue();
      });
      await page.setViewport({ width, height: width === 390 ? 844 : 900, deviceScaleFactor: 1 });
      const client = await page.createCDPSession();
      await client.send("Network.enable");
      await client.send("Network.setCacheDisabled", { cacheDisabled: true });
      await client.send("Network.emulateNetworkConditions", { offline: false, latency: 40, downloadThroughput: 1250000, uploadThroughput: 625000 });
      await client.send("Emulation.setCPUThrottlingRate", { rate: 4 });
      await page.evaluateOnNewDocument(() => {
        window.__lab = { lcp: 0, cls: 0, shifts: [] };
        new PerformanceObserver((list) => { for (const entry of list.getEntries()) window.__lab.lcp = entry.startTime; }).observe({ type: "largest-contentful-paint", buffered: true });
        new PerformanceObserver((list) => { for (const entry of list.getEntries()) if (!entry.hadRecentInput) {
          window.__lab.cls += entry.value;
          window.__lab.shifts.push({ value: entry.value, time: entry.startTime, sources: entry.sources.map((source) => ({ node: source.node?.className || source.node?.nodeName, previous: source.previousRect.toJSON(), current: source.currentRect.toJSON() })) });
        } }).observe({ type: "layout-shift", buffered: true });
      });
      await page.goto(base, { waitUntil: "networkidle0" });
      await new Promise((resolve) => setTimeout(resolve, 3000));
      samples.push({ width, run, ...await page.evaluate(() => ({ ...window.__lab, transferBytes: performance.getEntriesByType("resource").reduce((sum, entry) => sum + entry.transferSize, 0) })) });
      await page.close();
    }
  }
} finally {
  await browser.close();
}
await mkdir("test-results/studio", { recursive: true });
await writeFile(`test-results/studio/performance-${label}.json`, JSON.stringify({ base, label, conditions: "Chromium headless, cold cache, DPR 1, 4x CPU, 40ms latency, 10Mbps down/5Mbps up; 3 runs per width. Lab LCP; cls is cumulative observed unexpected layout shift, a conservative total rather than maximum session-window CLS. INP requires field data.", samples }, null, 2));
console.log(JSON.stringify(samples.map(({ width, run, lcp, cls, transferBytes }) => ({ width, run, lcp, cls, transferBytes })), null, 2));
