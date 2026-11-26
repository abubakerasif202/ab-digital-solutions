import { test, expect } from "@playwright/test";
import { existsSync } from "node:fs";

if (!process.env.QA_BROWSER || process.env.QA_BROWSER === "chromium") {
  test.use({
    launchOptions: {
      executablePath: process.env.CHROMIUM_PATH || (existsSync("/usr/bin/chromium") ? "/usr/bin/chromium" : undefined),
      chromiumSandbox: true,
      args: ["--use-gl=angle", "--use-angle=swiftshader"],
    },
  });
}

test("hero: the Three.js scene still activates on desktop after pointer intent", async ({ page, browserName }) => {
  test.skip(browserName !== "chromium", "This test exercises Chromium software WebGL.");
  await page.addInitScript(() => {
    // Exercise the eligible desktop branch while retaining real WebGL rendering
    // in environments where Chromium uses a software renderer.
    Object.defineProperty(navigator, "hardwareConcurrency", { configurable: true, value: 8 });
    Object.defineProperty(navigator, "deviceMemory", { configurable: true, value: 8 });
    const prototype = WebGL2RenderingContext.prototype;
    const getParameter = prototype.getParameter;
    prototype.getParameter = function (parameter) {
      if (parameter === 0x9246) return "Playwright desktop renderer"; // UNMASKED_RENDERER_WEBGL
      return getParameter.call(this, parameter);
    };
  });
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/preview/opendesign");
  const hero = page.locator(".odp-hero-art");
  await expect(hero.locator(".hero-3d-bg-wrap")).toHaveAttribute("data-hero-mode", "fallback");
  const bounds = await hero.boundingBox();
  await page.mouse.move(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2);
  await expect(page.locator(".hero-3d-container canvas")).toBeVisible({ timeout: 20_000 });
});
