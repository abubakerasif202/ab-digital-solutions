import { test, expect } from "@playwright/test";

async function openCaseStudy(page) {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/work/wild-pest-solutions");
  const frame = page.locator(".ip-window .ifr").first();
  await expect(frame).toBeVisible();
  return frame;
}

test("standalone inspection frame exposes its keyboard toggle state", async ({ page }) => {
  const frame = await openCaseStudy(page);
  await expect(frame).toHaveAttribute("role", "button");
  await expect(frame).toHaveAttribute("aria-pressed", "false");
  await frame.focus();
  await page.keyboard.press("Enter");
  await expect(frame).toHaveAttribute("aria-pressed", "true");
  await expect(frame).toHaveAttribute("data-full", "true");
  await page.keyboard.press("Space");
  await expect(frame).toHaveAttribute("aria-pressed", "false");
  await expect(frame).toHaveAttribute("data-full", "false");
});

test("inspection lens follows scrolled geometry and stops writing when settled", async ({ page }) => {
  const frame = await openCaseStudy(page);
  await frame.evaluate((element) => {
    window.scrollTo({ top: window.scrollY + element.getBoundingClientRect().top - 130, behavior: "instant" });
  });
  const bounds = await frame.boundingBox();
  const x = bounds.x + bounds.width * 0.5;
  const y = 400;
  await page.mouse.move(x, y);
  await expect(frame).toHaveAttribute("data-live", "true");
  await page.evaluate(() => window.scrollBy({ top: 120, behavior: "instant" }));
  await page.mouse.move(x + 1, y);
  await expect.poll(() => frame.evaluate((element) => {
    const expected = 400 - element.getBoundingClientRect().top;
    return Math.abs(Number.parseFloat(element.style.getPropertyValue("--ly")) - expected);
  })).toBeLessThan(1);

  await expect.poll(() => frame.evaluate(async (element) => {
    let changes = 0;
    const observer = new MutationObserver((records) => { changes += records.length; });
    observer.observe(element, { attributes: true, attributeFilter: ["style"] });
    await new Promise((resolve) => setTimeout(resolve, 150));
    observer.disconnect();
    return changes;
  })).toBe(0);
});

for (const fallback of [
  { name: "coarse pointer", hasTouch: true, reducedMotion: "no-preference" },
  { name: "reduced motion", hasTouch: false, reducedMotion: "reduce" },
]) {
  test(`${fallback.name}: resting inspection lens tracks viewport resizing`, async ({ browser }) => {
    const context = await browser.newContext({
      viewport: { width: 375, height: 844 },
      hasTouch: fallback.hasTouch,
      reducedMotion: fallback.reducedMotion,
    });
    try {
      const page = await context.newPage();
      await page.goto("/work/wild-pest-solutions");
      const frame = page.locator(".ip-window .ifr").first();
      await expect.poll(() => frame.evaluate((element) => element.style.getPropertyValue("--lx"))).not.toBe("");
      await page.setViewportSize({ width: 812, height: 375 });
      await expect.poll(() => frame.evaluate((element) => {
        const expected = element.getBoundingClientRect().width * 0.64;
        return Math.abs(Number.parseFloat(element.style.getPropertyValue("--lx")) - expected);
      })).toBeLessThan(1);
    } finally {
      await context.close();
    }
  });
}
