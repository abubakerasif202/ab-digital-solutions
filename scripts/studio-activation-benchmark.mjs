import { chromium } from "@playwright/test";
const base = new URL(process.env.QA_BASE_URL || "http://127.0.0.1:3102");
if (!["localhost", "127.0.0.1"].includes(base.hostname)) throw new Error("Local-only Studio benchmark.");
const browser = await chromium.launch({ args: ["--use-gl=angle", "--use-angle=swiftshader"], chromiumSandbox: true });
try {
  for (const width of [390, 1440]) for (let run = 1; run <= 3; run++) {
    const context = await browser.newContext({ viewport: { width, height: width === 390 ? 844 : 900 }, reducedMotion: "no-preference" });
    const page = await context.newPage();
    const cdp = await context.newCDPSession(page);
    await cdp.send("Network.enable");
    await cdp.send("Network.setCacheDisabled", { cacheDisabled: true });
    await cdp.send("Network.emulateNetworkConditions", { offline: false, latency: 40, downloadThroughput: 1250000, uploadThroughput: 625000 });
    await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 });
    await page.addInitScript(() => {
      window.activation = { phases: {} };
      document.addEventListener("click", (event) => {
        if (event.target.closest("button")?.textContent.includes("Enter the Studio")) window.activation.start = performance.now();
      }, true);
      new MutationObserver(() => {
        const phase = document.querySelector("[data-warmup]")?.dataset.warmup;
        if (phase && window.activation.start) window.activation.phases[phase] ??= performance.now() - window.activation.start;
      }).observe(document, { subtree: true, childList: true, attributes: true, attributeFilter: ["data-warmup"] });
    });
    await page.goto(new URL("/studio", base).href, { waitUntil: "networkidle" });
    await page.getByRole("button", { name: "Enter the Studio", exact: true }).click();
    await page.waitForFunction(() => window.activation.phases.done !== undefined || document.querySelector("[data-mode]")?.dataset.mode === "failed", null, { timeout: 40000 });
    console.log(JSON.stringify({ width, run, ...await page.evaluate(() => {
      const { start, phases } = window.activation;
      return { mode: document.querySelector("[data-mode]")?.dataset.mode, phases, assets: performance.getEntriesByType("resource").filter((entry) => /\.(?:bin(?:\.gz)?|glb)$/.test(new URL(entry.name).pathname)).map(({ name, startTime, responseEnd, transferSize }) => ({ asset: new URL(name).pathname.split("/").at(-1), start: startTime - start, end: responseEnd - start, transferSize })) };
    }) }));
    await context.close();
  }
} finally { await browser.close(); }
