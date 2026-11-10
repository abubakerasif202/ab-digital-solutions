import { expect, test } from "@playwright/test";

test("scroll reveals avoid synchronous mount layout and retain focus and motion behavior", async ({ page }) => {
  await page.addInitScript(() => {
    window.__revealBoundsReads = 0;
    const original = Element.prototype.getBoundingClientRect;
    Element.prototype.getBoundingClientRect = function (...args) {
      if (this.matches(".reveal")) window.__revealBoundsReads++;
      return original.apply(this, args);
    };
  });
  await page.goto("/", { waitUntil: "networkidle" });
  const armed = page.locator('.reveal[data-reveal-state="armed"]');
  await expect(armed.first()).toBeAttached();
  expect(await page.evaluate(() => window.__revealBoundsReads)).toBe(0);
  await armed.first().evaluate((element) => element.setAttribute("data-qa-reveal", "focus"));
  const first = page.locator('[data-qa-reveal="focus"]');
  await first.evaluate((element) => { element.tabIndex = 0; element.focus({ preventScroll: true }); });
  await expect(first).toHaveAttribute("data-reveal-state", "in");
  await armed.first().evaluate((element) => element.setAttribute("data-qa-reveal", "scroll"));
  const next = page.locator('[data-qa-reveal="scroll"]');
  await next.scrollIntoViewIfNeeded();
  await expect(next).toHaveAttribute("data-reveal-state", "in");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(armed).toHaveCount(0);
  await page.reload({ waitUntil: "networkidle" });
  await expect(armed).toHaveCount(0);
  expect(await page.locator("h1").isVisible()).toBe(true);
});
