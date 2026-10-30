// Production arrival and responsive evidence. No clock overrides; timestamps are actual wall time.
import { chromium } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";

const base = process.env.QA_BASE_URL || "http://127.0.0.1:3100";
if (!["localhost", "127.0.0.1"].includes(new URL(base).hostname)) throw new Error("Local QA only.");
const out = process.env.QA_OUT || "qa/living-sydney-v4/final/visual";
await mkdir(out, { recursive: true });
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined, args: ["--no-sandbox", "--enable-unsafe-swiftshader", "--use-angle=swiftshader"] });
const results = [];
try {
  for (const [width, height] of [[390,844], [1440,1000], [320,844], [360,844], [375,844], [430,844], [768,1000], [844,390]]) {
    const context = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 1, hasTouch: width < 1000 });
    const page = await context.newPage();
    const errors = [], captures = [];
    page.on("pageerror", error => errors.push(error.message));
    page.on("console", message => { if (message.type() === "error") errors.push(message.text()); });
    await page.route("**/api/analytics", route => route.fulfill({ status: 204 }));
    await page.route("**/_vercel/**", route => route.fulfill({ status: 200, body: "" }));
    await page.route("**/api/contact", route => route.abort());
    await page.goto(`${base}/studio`, { waitUntil: "networkidle" });
    await page.getByRole("button", { name: "Enter the Studio", exact: true }).click();
    await page.waitForFunction(() => ["arrival", "intro", "explore", "failed"].includes(document.querySelector("[data-mode]")?.dataset.mode), null, { timeout: 60000 });
    if (await page.locator("[data-mode]").getAttribute("data-mode") === "failed") throw new Error(`WebGL activation failed at ${width}x${height}`);
    const started = Date.now();
    const capture = async label => {
      const file = `${width}x${height}-${label}.png`;
      await page.screenshot({ path: `${out}/${file}` });
      captures.push({ file, elapsedMs: Date.now() - started, mode: await page.locator("[data-mode]").getAttribute("data-mode") });
    };
    if ([390,1440].includes(width)) {
      for (const seconds of [0, 2, 4, 6, 8, 10, 12, 15]) {
        await page.waitForTimeout(Math.max(0, started + seconds * 1000 - Date.now()));
        await capture(`arrival-${seconds}`);
      }
      await page.waitForFunction(() => document.querySelector("[data-mode]")?.dataset.mode === "intro", null, { timeout: 30000 });
      await capture("welcome");
      await page.getByRole("button", { name: "Start Exploring", exact: true }).click();
    } else await page.keyboard.press("Escape");
    for (const [name, key] of [["Reception","reception"], ["Portfolio gallery","gallery"], ["Services atelier","services"], ["Consultation lounge","consultation"]]) {
      await page.getByRole("navigation", { name: "Studio spaces" }).getByRole("button", { name }).click();
      await page.waitForTimeout(2200);
      await capture(`${key}-panel`);
      await page.keyboard.press("Escape");
      // Closing a panel restores overview on desktop; capture room with details collapsed instead.
    }
    await page.getByRole("button", { name: "Back to entrance", exact: true }).click();
    await page.waitForTimeout(2100);
    if ([390,1440].includes(width)) {
      // Long enough for signal changes, pedestrian travel and a complete kangaroo visit.
      for (let i = 0; i < 6; i++) { await capture(`street-motion-${i}`); await page.waitForTimeout(4000); }
      await page.getByRole("navigation", { name: "Studio spaces" }).getByRole("button", { name: "Reception" }).click();
      await page.getByRole("button", { name: "Collapse details", exact: true }).click();
      for (let i = 0; i < 4; i++) { await page.waitForTimeout(2000); await capture(`reception-motion-${i}`); }
      await page.getByRole("navigation", { name: "Studio spaces" }).getByRole("button", { name: "Services atelier" }).click();
      await page.getByRole("button", { name: "Collapse details", exact: true }).click();
      for (let i = 0; i < 4; i++) { await page.waitForTimeout(2500); await capture(`staff-motion-${i}`); }
    }
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth);
    results.push({ width, height, overflow, errors, captures });
    await writeFile(`${out}/manifest.json`, JSON.stringify(results, null, 2));
    console.log(JSON.stringify({ width, height, overflow, errors, captures: captures.length }));
    await context.close();
  }
} finally { await browser.close(); }
if (results.some(result => result.overflow || result.errors.length)) process.exitCode = 1;
