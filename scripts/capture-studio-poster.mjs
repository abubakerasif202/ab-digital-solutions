import { chromium } from "@playwright/test";
import { existsSync } from "node:fs";

const base = process.env.QA_BASE_URL || "http://localhost:3100";
if (!["localhost", "127.0.0.1"].includes(new URL(base).hostname)) throw new Error("Local-only capture.");
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || (existsSync("/usr/bin/chromium") ? "/usr/bin/chromium" : undefined), args: ["--no-sandbox", "--enable-unsafe-swiftshader"] });
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1600 }, deviceScaleFactor: 1 });
  page.setDefaultTimeout(30000);
  page.setDefaultNavigationTimeout(30000);
  await page.route("**/api/analytics", (route) => route.fulfill({ status: 204 }));
  await page.goto(`${base}/studio`, { waitUntil: "networkidle" });
  await page.locator("[data-mode]").evaluate((element) => { element.style.height = "900px"; element.style.minHeight = "900px"; element.style.border = "0"; });
  await page.getByRole("button", { name: "Enter the Studio", exact: true }).click();
  await page.waitForFunction(() => document.querySelector("[data-mode]")?.dataset.mode === "explore", null, { timeout: 30000 });
  await page.waitForTimeout(2200);
  await page.evaluate(() => scrollTo({ top: 0, behavior: "instant" }));
  await page.waitForTimeout(200);
  const bounds = await page.locator("canvas").boundingBox();
  // Explicit integer clip avoids a one-pixel fractional-box rounding difference.
  await page.screenshot({ clip: { x: Math.round(bounds.x), y: Math.round(bounds.y), width: 1440, height: 900 }, path: "public/studio/studio-poster.png", style: '[class*="stageTop"], [class*="sceneCaption"], .ab-spatial-hotspot, nextjs-portal { visibility: hidden !important; }' });
  console.log("Captured original scene at 1440 × 900: public/studio/studio-poster.png");
} finally { await browser.close(); }
