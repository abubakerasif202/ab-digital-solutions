// Captures full-page and interaction-state screenshots of the luxury homepage.
//   node scripts/capture-luxury-screenshots.mjs                       -> corrected prototype
//   node scripts/capture-luxury-screenshots.mjs --original <dir>      -> the untouched OpenDesign export
// Output: test-results/opendesign-homepage/screenshots/<corrected|original>/ (git-ignored).
import { chromium } from "@playwright/test";
import { createServer } from "node:http";
import { readFile, mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { startServer } from "./serve-luxury-prototype.mjs";

const root = fileURLToPath(new URL("../", import.meta.url));
const args = process.argv.slice(2);
const originalDir = args.includes("--original") ? path.resolve(args[args.indexOf("--original") + 1]) : null;
const label = originalDir ? "original" : "corrected";
const outDir = path.join(root, "test-results", "opendesign-homepage", "screenshots", label);
const viewports = [
  ["mobile-360", 360, 800], ["mobile-390", 390, 844], ["tablet-820", 820, 1180], ["desktop-1440", 1440, 900], ["wide-1920", 1920, 1080],
];

function serveDirectory(dir) {
  const types = { ".html": "text/html; charset=utf-8", ".css": "text/css", ".js": "text/javascript", ".json": "application/json" };
  const server = createServer(async (request, response) => {
    const name = new URL(request.url, "http://x").pathname.replace(/^\/$/, "/index.html");
    const file = path.join(dir, name);
    if (!file.startsWith(dir + path.sep)) { response.writeHead(403).end(); return; }
    try {
      response.writeHead(200, { "Content-Type": types[path.extname(file)] ?? "application/octet-stream" });
      response.end(await readFile(file));
    } catch { response.writeHead(404).end(); }
  });
  return new Promise((resolve) => server.listen(0, "127.0.0.1", () => resolve({ server, url: `http://127.0.0.1:${server.address().port}` })));
}

async function scrollThrough(page) {
  await page.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += window.innerHeight * 0.7) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 80));
    }
    window.scrollTo(0, 0);
  });
  await page.waitForLoadState("networkidle").catch(() => {});
  await page.evaluate(() => document.fonts?.ready);
}

await mkdir(outDir, { recursive: true });
const { server, url } = originalDir ? await serveDirectory(originalDir) : await startServer();
const browser = await chromium.launch();
try {
  for (const [name, width, height] of viewports) {
    // Reduced motion makes the capture deterministic: reveals are visible, the monogram is static.
    const context = await browser.newContext({ viewport: { width, height }, reducedMotion: "reduce" });
    const page = await context.newPage();
    await page.goto(`${url}/`, { waitUntil: "load" });
    await scrollThrough(page);
    await page.screenshot({ path: path.join(outDir, `${name}-fullpage.png`), fullPage: true });
    await page.screenshot({ path: path.join(outDir, `${name}-hero.png`) });
    await context.close();
  }

  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: "reduce" });
  const page = await context.newPage();
  await page.goto(`${url}/`, { waitUntil: "load" });
  await scrollThrough(page);
  await page.locator("#work").scrollIntoViewIfNeeded();
  await page.locator("#work").screenshot({ path: path.join(outDir, "state-work-section.png") });
  await page.locator(".project-btn").first().click();
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(outDir, "state-project-dialog.png") });
  await page.keyboard.press("Escape");
  await page.locator("#submitBtn").scrollIntoViewIfNeeded();
  await page.locator("#submitBtn").click();
  await page.waitForTimeout(300);
  await page.locator("#enquire").screenshot({ path: path.join(outDir, "state-form-errors.png") });
  await context.close();

  const mobile = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: "reduce" });
  const mobilePage = await mobile.newPage();
  await mobilePage.goto(`${url}/`, { waitUntil: "load" });
  await mobilePage.locator("#menuBtn").click();
  await mobilePage.waitForTimeout(400);
  await mobilePage.screenshot({ path: path.join(outDir, "state-mobile-menu.png") });
  await mobile.close();
  console.log(`Screenshots written to ${path.relative(root, outDir)}`);
} finally {
  await browser.close();
  server.close();
}
