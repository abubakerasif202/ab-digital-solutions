import puppeteer from "puppeteer";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const base = process.env.QA_BASE_URL || "http://127.0.0.1:3100";
if (!["127.0.0.1", "localhost"].includes(new URL(base).hostname)) throw new Error("Local-only QA.");
const output = path.resolve("qa/studio-rebuild-20261020/browser");
await mkdir(output, { recursive: true });
const browser = await puppeteer.launch({ headless: true });
const page = await browser.newPage();
const checks = [];
try {
  for (const width of [360, 390, 768, 1024, 1440, 1920]) {
    await page.setViewport({ width, height: width < 768 ? 844 : 900, deviceScaleFactor: 1 });
    await page.goto(base, { waitUntil: "networkidle0" });
    await page.$eval("#contact", (section) => section.scrollIntoView({ block: "center", behavior: "instant" }));
    await page.waitForFunction(() => document.querySelector('.site-nav a[href="/contact"]')?.getAttribute("aria-current") === "location");
    await page.evaluate(() => scrollTo({ top: 0, behavior: "instant" }));
    await page.waitForFunction(() => !document.querySelector(".site-nav a[aria-current]"));
    const detail = await page.evaluate(() => ({ scrollY, overflow: document.documentElement.scrollWidth - innerWidth, current: document.querySelector(".site-nav a[aria-current]")?.textContent ?? null }));
    checks.push({ name: `Scroll spy clears at hero @${width}`, passed: detail.scrollY === 0 && detail.overflow <= 1 && detail.current === null, detail });
    await new Promise((resolve) => setTimeout(resolve, 600));
    await page.screenshot({ path: path.join(output, `${width}-home-fold.png`) });
  }
} finally {
  await browser.close();
  await writeFile(path.join(output, "header-report.json"), JSON.stringify({ base, capturedAt: new Date().toISOString(), checks }, null, 2));
}
console.log(JSON.stringify(checks, null, 2));
if (checks.some((check) => !check.passed)) process.exitCode = 1;
