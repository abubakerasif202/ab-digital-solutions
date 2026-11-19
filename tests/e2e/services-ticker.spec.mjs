import { expect, test } from "@playwright/test";

const words = ["Websites", "Online stores", "Business systems", "Made in Sydney"];

for (const width of [390, 1150]) {
  test.describe(`homepage services ticker at ${width}px`, () => {
    test.use({ viewport: { width, height: 850 }, reducedMotion: "no-preference" });

    test("preserves placement and wording and loops seamlessly without overflow", async ({ page }) => {
      await page.goto("/");
      const ticker = page.locator(".ruby-hero + .ruby-service-ticker:has(+ #about)");
      await expect(ticker).toBeVisible();
      // Motion begins only once the pause control has hydrated.
      await expect(ticker.locator(".ruby-service-ticker-control[data-ready]")).toBeEnabled();
      await expect(ticker.getByRole("listitem")).toHaveText(words);

      const seam = await ticker.evaluate(async (band) => {
        await document.fonts.ready;
        const viewport = band.querySelector(".ruby-service-ticker-viewport");
        const track = viewport.firstElementChild;
        const [first, copy] = track.children;
        const [animation] = track.getAnimations();
        const duration = animation.effect.getComputedTiming().duration;
        const x = (element) => element.getBoundingClientRect().left;
        animation.pause();
        animation.currentTime = duration - 2;
        const before = x(copy);
        const right = copy.getBoundingClientRect().right;
        animation.currentTime = duration + 2;
        const after = x(first);
        const labelsFit = [...first.children].every((item) => {
          const label = document.createRange();
          label.selectNodeContents(item);
          return label.getBoundingClientRect().width <= viewport.clientWidth;
        });
        return {
          duration,
          runningInfinitely: animation.effect.getTiming().iterations === Infinity,
          covered: right >= viewport.getBoundingClientRect().right,
          labelsFit,
          seamDistance: before - after,
          overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
        };
      });
      expect(seam.duration).toBe(42000);
      expect(seam.runningInfinitely).toBe(true);
      expect(seam.covered).toBe(true);
      expect(seam.labelsFit).toBe(true);
      expect(seam.seamDistance).toBeGreaterThan(0);
      expect(seam.seamDistance).toBeLessThan(1);
      expect(seam.overflow).toBe(0);
    });

    test("can be paused and resumed with the keyboard", async ({ page }) => {
      await page.goto("/", { waitUntil: "networkidle" });
      const control = page.getByRole("button", { name: "Pause ticker" });
      const track = page.locator(".ruby-service-ticker-track");
      await expect(track).toHaveCSS("animation-play-state", "running");
      await control.focus();
      await page.keyboard.press("Space");
      await expect(control).toHaveAttribute("aria-pressed", "true");
      await expect(track).toHaveCSS("animation-play-state", "paused");
      await page.keyboard.press("Space");
      await expect(control).toHaveAttribute("aria-pressed", "false");
      await expect(track).toHaveCSS("animation-play-state", "running");
    });

    test.describe("before the pause control works", () => {
      test.use({ javaScriptEnabled: false });

      test("keeps all labels visible while its pause control is inert", async ({ page }) => {
        await page.goto("/");
        const ticker = page.getByRole("region", { name: "Studio capabilities" });
        await expect(ticker.getByRole("listitem")).toHaveText(words);
        await expect(ticker.locator(".ruby-service-ticker-track")).toHaveCSS("animation-name", "none");
        expect(await ticker.evaluate(async band => {
          await document.fonts.ready;
          const strip = band.getBoundingClientRect();
          return [...band.querySelectorAll("ul:not([aria-hidden]) li")].every(item => {
            const label = document.createRange();
            label.selectNodeContents(item);
            const bounds = label.getBoundingClientRect();
            return bounds.left >= strip.left && bounds.right <= strip.right
              && bounds.top >= strip.top && bounds.bottom <= strip.bottom;
          });
        })).toBe(true);
        await expect(ticker.getByRole("button", { name: "Pause ticker" })).toHaveCount(0);
        await expect(ticker.locator("[aria-hidden=true].ruby-service-ticker-group")).toBeHidden();
      });
    });

    test("shows every label in a readable static strip for reduced motion", async ({ page }) => {
      await page.emulateMedia({ reducedMotion: "reduce" });
      await page.goto("/");
      const ticker = page.getByRole("region", { name: "Studio capabilities" });
      await expect(ticker.getByRole("listitem")).toHaveText(words);
      await expect(ticker.locator(".ruby-service-ticker-track")).toHaveCSS("animation-name", "none");
      await expect(ticker.locator("[aria-hidden=true].ruby-service-ticker-group")).toBeHidden();
      await expect(ticker.getByRole("button", { name: "Pause ticker" })).toHaveCount(0);
      expect(await ticker.evaluate((band) => [...band.querySelectorAll("li")].filter((item) => item.getClientRects().length).every((item) => {
        const rect = item.getBoundingClientRect();
        const strip = band.getBoundingClientRect();
        return rect.left >= strip.left && rect.right <= strip.right;
      }))).toBe(true);
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(width);
    });
  });
}
