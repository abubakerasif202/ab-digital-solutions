import { chromium } from "@playwright/test";
import { existsSync } from "node:fs";
import { mkdir } from "node:fs/promises";
const base = process.env.QA_BASE_URL || "http://localhost:3100";
const phase = process.env.QA_PHASE || "after";
const root = `qa/studio-v3/${phase}/visual`;
await mkdir(root, { recursive: true });
const browser = await chromium.launch({ args: ["--no-sandbox", "--enable-unsafe-swiftshader"] });
for (const width of [320,360,375,390,430,768,1440]) {
  if (process.env.QA_RESUME === "1" && existsSync(`${root}/${width}-landscape.png`)) continue;
  const page = await browser.newPage({ viewport: { width, height: 900 }, isMobile: width < 700, hasTouch: width < 700 });
  await page.goto(base, { waitUntil: "networkidle" });
  await page.screenshot({ path: `${root}/${width}-home.png` });
  await page.goto(`${base}/studio`, { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "Enter the Studio", exact: true }).click();
  await page.locator('[data-mode="intro"]').waitFor({ timeout: 30000 });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: `${root}/${width}-welcome.png` });
  const skip = page.getByRole("button", { name: "Skip Intro", exact: true });
  if (await skip.isVisible()) await skip.click();
  for (const room of ["Reception", "Portfolio gallery", "Services atelier", "Consultation lounge"]) {
    await page.getByRole("navigation", { name: "Studio spaces" }).getByRole("button", { name: room }).click();
    await page.waitForTimeout(1900);
    await page.screenshot({ path: `${root}/${width}-${room}-open.png` });
    await page.keyboard.press("Escape");
    await page.waitForTimeout(1900);
    await page.screenshot({ path: `${root}/${width}-${room}-closed.png` });
  }
  await page.setViewportSize({ width: 844, height: 390 });
  await page.waitForTimeout(1900);
  await page.screenshot({ path: `${root}/${width}-landscape.png` });
  await page.close();
}
await browser.close();
