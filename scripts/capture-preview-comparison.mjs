// Screenshots the existing homepage, the corrected standalone prototype and the
// Next.js preview route at the supported viewports, for side-by-side review.
//   QA_BASE_URL=http://127.0.0.1:3100 node scripts/capture-preview-comparison.mjs
// Output: test-results/opendesign-homepage/comparison/<target>/ (git-ignored).
import { chromium } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { startServer } from "./serve-luxury-prototype.mjs";

const root = fileURLToPath(new URL("../", import.meta.url));
const base = process.env.QA_BASE_URL || "http://127.0.0.1:3100";
const out = path.join(root, "test-results", "opendesign-homepage", "comparison");
const viewports = [["360", 360, 800], ["390", 390, 844], ["820", 820, 1180], ["1440", 1440, 900], ["1920", 1920, 1080]];
const { server, url: prototype } = await startServer();
const targets = [
  ["home", `${base}/`],
  ["prototype", `${prototype}/`],
  ["preview", `${base}/preview/opendesign`],
  ["preview-css-fallback", `${base}/preview/opendesign?fallback=css`],
];

async function settle(page) {
  await page.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += window.innerHeight * 0.7) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 90));
    }
    window.scrollTo(0, 0);
  });
  await page.waitForLoadState("networkidle").catch(() => {});
  await page.evaluate(() => document.fonts?.ready);
  await page.waitForTimeout(400);
}

const browser = await chromium.launch({ args: ["--enable-unsafe-swiftshader"] });
try {
  for (const [name, url] of targets) {
    const dir = path.join(out, name);
    await mkdir(dir, { recursive: true });
    for (const [label, width, height] of viewports) {
      // Reduced motion keeps captures deterministic (static hero art, no reveal states).
      const context = await browser.newContext({ viewport: { width, height }, reducedMotion: "reduce" });
      const page = await context.newPage();
      await page.goto(url, { waitUntil: "load" });
      await settle(page);
      await page.screenshot({ path: path.join(dir, `${label}-hero.png`) });
      await page.screenshot({ path: path.join(dir, `${label}-fullpage.png`), fullPage: true });
      await context.close();
    }
  }
  // The live Three.js hero on desktop, with motion allowed and the pointer over the stage.
  for (const [name, url] of [["home", `${base}/`], ["preview", `${base}/preview/opendesign`]]) {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await context.newPage();
    await page.goto(url, { waitUntil: "load" });
    await page.mouse.move(1000, 420);
    await page.waitForTimeout(5000);
    await page.screenshot({ path: path.join(out, name, "1440-hero-3d-motion.png") });
    await context.close();
  }
  console.log(`Comparison screenshots written to ${path.relative(root, out)}`);
} finally {
  await browser.close();
  server.close();
}
