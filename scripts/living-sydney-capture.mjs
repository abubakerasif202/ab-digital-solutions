// Time-sequenced captures of the V4 arrival and rooms. Local only; never submits the contact form.
import { chromium } from "@playwright/test";
import { existsSync, readdirSync } from "node:fs";
import { mkdir } from "node:fs/promises";
import { homedir } from "node:os";
import path from "node:path";

const base = process.env.QA_BASE_URL || "http://localhost:3100";
if (!["localhost", "127.0.0.1"].includes(new URL(base).hostname)) throw new Error("Local-only capture.");
const out = process.env.QA_OUT || "qa/living-sydney-v4/captures";
const widths = (process.env.QA_WIDTHS || "1440,390").split(",").map(Number);
const times = (process.env.QA_TIMES || "0.5,3,5.5,8,9.5,11,13,14.6").split(",").map(Number);
function chromePath() {
  if (process.env.CHROMIUM_PATH) return process.env.CHROMIUM_PATH;
  const root = path.join(homedir(), ".cache/puppeteer/chrome");
  const dirs = existsSync(root) ? readdirSync(root).sort().reverse() : [];
  for (const dir of dirs) { const exe = path.join(root, dir, "chrome-win64/chrome.exe"); if (existsSync(exe)) return exe; }
  return undefined;
}
await mkdir(out, { recursive: true });
const browser = await chromium.launch({ executablePath: chromePath(), args: ["--no-sandbox", "--enable-unsafe-swiftshader", "--use-angle=swiftshader"] });
try {
  for (const width of widths) {
    const height = width < 700 ? 844 : 900;
    const context = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 1, hasTouch: width < 700 });
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
    await page.route("**/api/analytics", (r) => r.fulfill({ status: 204 }));
    await page.route("**/_vercel/**", (r) => r.fulfill({ status: 200, body: "" }));
    await page.goto(`${base}/studio`, { waitUntil: "networkidle" });
    await page.getByRole("button", { name: "Enter the Studio", exact: true }).click();
    await page.waitForFunction(() => document.querySelector("[data-mode]")?.dataset.mode === "arrival", null, { timeout: 60000 });
    // Freeze the film at exact seconds via the development-only hook, however slow software GL is.
    for (const t of times) {
      await page.evaluate((seconds) => { window.__abArrivalSeconds = seconds; }, t);
      await page.waitForTimeout(900);
      await page.screenshot({ path: `${out}/${width}-arrival-${String(t).replace(".", "_")}.png` });
    }
    await page.evaluate(() => { delete window.__abArrivalSeconds; });
    await page.waitForFunction(() => document.querySelector("[data-mode]")?.dataset.mode === "intro", null, { timeout: 30000 });
    await page.waitForTimeout(800);
    await page.screenshot({ path: `${out}/${width}-intro.png` });
    await page.getByRole("button", { name: "Start Exploring", exact: true }).click();
    await page.waitForTimeout(2200);
    await page.screenshot({ path: `${out}/${width}-explore.png` });
    for (const [label, key] of [["Reception", "reception"], ["Portfolio gallery", "gallery"], ["Services atelier", "services"], ["Consultation lounge", "consultation"]]) {
      await page.getByRole("navigation", { name: "Studio spaces" }).getByRole("button", { name: label }).click();
      await page.waitForTimeout(2300);
      await page.screenshot({ path: `${out}/${width}-room-${key}.png` });
      await page.keyboard.press("Escape");
    }
    await page.getByRole("button", { name: "Back to entrance" }).click();
    await page.waitForTimeout(2300);
    await page.screenshot({ path: `${out}/${width}-entrance.png` });
    console.log(width, "errors:", JSON.stringify(errors.slice(0, 5)));
    await context.close();
  }
} finally { await browser.close(); }
