// Runs axe-core (WCAG 2.0/2.1/2.2 A and AA plus best practices) against the live homepage and the
// preview route, and separates findings the preview introduced from ones the shared chrome already has.
// axe-core is not a repository dependency; point AXE_PATH at an installed copy:
//   AXE_PATH=<dir>/node_modules/axe-core/axe.min.js QA_BASE_URL=http://127.0.0.1:3100 node scripts/a11y-axe-check.mjs
import { chromium } from "@playwright/test";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = fileURLToPath(new URL("../", import.meta.url));
const base = process.env.QA_BASE_URL || "http://127.0.0.1:3100";
const axePath = process.env.AXE_PATH;
if (!axePath) throw new Error("Set AXE_PATH to axe.min.js");
const axeSource = await readFile(axePath, "utf8");
const targets = [["home", "/"], ["preview", "/preview/opendesign"]];
const viewports = [["mobile-390", 390, 844], ["desktop-1440", 1440, 900]];
const tags = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa", "best-practice"];

const browser = await chromium.launch();
const results = {};
try {
  for (const [name, route] of targets) {
    for (const [vpName, width, height] of viewports) {
      const context = await browser.newContext({ viewport: { width, height }, reducedMotion: "reduce" });
      const page = await context.newPage();
      await page.goto(`${base}${route}`, { waitUntil: "load" });
      await page.evaluate(async () => {
        for (let y = 0; y < document.body.scrollHeight; y += window.innerHeight * 0.7) {
          window.scrollTo(0, y);
          await new Promise((resolve) => setTimeout(resolve, 80));
        }
        window.scrollTo(0, 0);
      });
      if (name === "preview") {
        await page.getByRole("button", { name: /Show all \d+ projects/ }).click();
        await page.locator(".odp-card-toggle").first().click();
      }
      await page.waitForLoadState("networkidle").catch(() => {});
      await page.addScriptTag({ content: axeSource });
      const report = await page.evaluate((runTags) => window.axe.run(document, { runOnly: { type: "tag", values: runTags } }), tags);
      results[`${name}@${vpName}`] = {
        violations: report.violations.map((v) => ({
          id: v.id, impact: v.impact, help: v.help, count: v.nodes.length,
          targets: v.nodes.slice(0, 3).map((n) => n.target.join(" ")),
        })),
        passes: report.passes.length,
        incomplete: report.incomplete.map((v) => ({ id: v.id, count: v.nodes.length })),
      };
      await context.close();
    }
  }
} finally {
  await browser.close();
}

const out = path.join(root, "test-results", "opendesign-homepage");
await mkdir(out, { recursive: true });
await writeFile(path.join(out, "axe-report.json"), JSON.stringify(results, null, 2));
for (const [key, value] of Object.entries(results)) {
  console.log(`\n${key}: ${value.violations.length} violation rule(s), ${value.passes} rules passed, ${value.incomplete.length} need review`);
  for (const v of value.violations) console.log(`  [${v.impact}] ${v.id} x${v.count} — ${v.help}\n      ${v.targets.join(" | ")}`);
}
for (const vp of viewports.map(([n]) => n)) {
  const home = new Set(results[`home@${vp}`].violations.map((v) => v.id));
  const added = results[`preview@${vp}`].violations.filter((v) => !home.has(v.id)).map((v) => v.id);
  console.log(`\n${vp}: rules violated on the preview but not on the live homepage: ${added.length ? added.join(", ") : "none"}`);
}
