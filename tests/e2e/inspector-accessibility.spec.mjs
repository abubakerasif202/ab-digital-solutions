import { readFile } from "node:fs/promises";
import { expect, test } from "@playwright/test";

const axe = await readFile(new URL("../../node_modules/axe-core/axe.min.js", import.meta.url), "utf8");

for (const width of [375, 1440]) {
  for (const route of ["/", "/services/web-design-sydney"]) {
    test(`Inspector landmarks at ${width}px on ${route}`, async ({ page }) => {
      await page.setViewportSize({ width, height: 844 });
      await page.goto(route, { waitUntil: "networkidle" });
      if (width === 375 && route !== "/") {
        await page.locator("main > section").first().evaluate((element) => element.scrollIntoView({ block: "start" }));
        await expect(page.locator(".mobile-project-cta")).toBeVisible();
      }
      await page.addScriptTag({ content: axe });
      const violations = await page.evaluate(async () => (await window.axe.run(document, {
        runOnly: { type: "rule", values: ["landmark-complementary-is-top-level", "region"] },
      })).violations.map((v) => ({ id: v.id, targets: v.nodes.map((n) => n.target) })));
      expect(violations).toEqual([]);
    });
  }
}
