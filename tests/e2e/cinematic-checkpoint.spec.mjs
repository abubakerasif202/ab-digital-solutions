import { expect, test } from "@playwright/test";

test.use({ viewport: { width: 1440, height: 900 } });

for (const fallback of ["unavailable WebGL", "reduced motion"]) {
  test(`the homepage studio poster and keyboard entry work with ${fallback}`, async ({ page }) => {
    const reducedMotion = fallback === "reduced motion";
    await page.emulateMedia({ reducedMotion: reducedMotion ? "reduce" : "no-preference" });
    await page.addInitScript(() => {
      // Keep the result independent of the host's hardware and network profile.
      Object.defineProperties(navigator, {
        hardwareConcurrency: { value: 8 },
        deviceMemory: { value: 8 },
        connection: { value: Object.assign(new EventTarget(), { effectiveType: "4g", saveData: false }) },
        getBattery: { value: undefined },
      });
      window.webGLContextRequested = false;
      const original = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext = function (type, ...args) {
        if (/webgl/.test(type)) {
          window.webGLContextRequested = true;
          return null;
        }
        return original.call(this, type, ...args);
      };
    });

    await page.goto("/");
    const studio = page.getByRole("region", { name: "A different perspective." });
    const stage = studio.locator(".sydney-night-stage");
    // The poster's pointer-only link is deliberately hidden from the accessibility tree.
    const poster = stage.getByAltText(/^A view into the AB Web Studio virtual studio/);
    await poster.scrollIntoViewIfNeeded();

    if (reducedMotion) {
      await expect.poll(() => stage.locator(":scope > div").first().evaluate((layer) => layer.style.transition)).toBe("none");
    } else {
      await expect.poll(() => page.evaluate(() => window.webGLContextRequested)).toBe(true);
    }

    await expect(poster).toBeInViewport();
    await expect.poll(() => poster.evaluate((image) =>
      image.complete && image.naturalWidth > 0 && image.checkVisibility({ checkOpacity: true }),
    )).toBe(true);
    await expect(stage).toHaveAttribute("data-webgl-active", "false");
    await expect(stage.locator("canvas")).toHaveCount(0);
    await expect(stage.getByRole("group", { name: "3D camera viewpoints" })).toBeHidden();

    if (reducedMotion) {
      // Wait for a positive probe after changing the live preference. This ensures
      // a hardware or hydration fallback cannot make the reduced-motion test pass.
      expect(await page.evaluate(() => window.webGLContextRequested)).toBe(false);
      await page.emulateMedia({ reducedMotion: "no-preference" });
      await expect.poll(() => page.evaluate(() => window.webGLContextRequested)).toBe(true);
    }

    const entry = studio.getByRole("link", { name: "Enter the Virtual Studio", exact: true });
    await entry.focus();
    await expect(entry).toBeFocused();
    await entry.press("Enter");
    await expect(page).toHaveURL(/\/studio$/);
    await expect(page.getByRole("heading", { name: "A different perspective.", level: 1 })).toBeVisible();
  });
}
