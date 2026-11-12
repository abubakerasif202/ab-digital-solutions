import { expect, test } from "@playwright/test";

async function expectPainted(locator) {
  await expect(locator).toBeVisible();
  await expect.poll(() => locator.evaluate((element) => {
    let opacity = 1;
    for (let current = element; current; current = current.parentElement) {
      const style = getComputedStyle(current);
      if (style.visibility !== "visible" || style.display === "none") return 0;
      opacity *= Number(style.opacity);
    }
    return opacity;
  })).toBeGreaterThan(0.95);
}

async function expectScrolledContentPainted(page) {
  for (const selector of ["#services-heading", "#process-heading", "#stack-heading", "#about-heading", "#contact-heading"]) {
    const heading = page.locator(selector);
    await heading.scrollIntoViewIfNeeded();
    await expect(heading).toBeInViewport();
    await expectPainted(heading);
  }
  const steps = page.locator(".sx-steps li");
  await expect(steps).toHaveCount(4);
  for (const step of await steps.all()) {
    await step.scrollIntoViewIfNeeded();
    await expect(step).toBeInViewport();
    await expectPainted(step.locator("h3"));
    await expectPainted(step.locator("p"));
  }
}

test("Inspector content paints on scroll and retains real focus and reduced-motion behavior", async ({ page }) => {
  // Inspector sections replaced the legacy armed Reveal wrappers with visible
  // server content and native CSS scroll timelines. Keep the layout-read guard
  // for any shared Reveal wrappers that return, but assert the public behavior
  // rather than manufacturing focus targets or requiring the retired mechanism.
  await page.addInitScript(() => {
    window.__revealBoundsReads = 0;
    const original = Element.prototype.getBoundingClientRect;
    Element.prototype.getBoundingClientRect = function (...args) {
      if (this.matches(".reveal")) window.__revealBoundsReads++;
      return original.apply(this, args);
    };
  });
  await page.goto("/", { waitUntil: "networkidle" });
  await expectPainted(page.locator("h1"));
  expect(await page.evaluate(() => window.__revealBoundsReads)).toBe(0);
  await expectScrolledContentPainted(page);

  const serviceLink = page.locator(".sx-layers a").first();
  await serviceLink.scrollIntoViewIfNeeded();
  await serviceLink.focus();
  await expect(serviceLink).toBeFocused();
  await expectPainted(serviceLink);
  const name = page.locator("#full-name");
  await name.scrollIntoViewIfNeeded();
  await name.focus();
  await expect(name).toBeFocused();
  await expectPainted(name);

  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(page.locator(".hx-stage")).toHaveAttribute("data-motion", "reduced");
  await expectScrolledContentPainted(page);
  expect(await page.locator(".sx-steps li").evaluateAll((steps) => steps.every((step) => getComputedStyle(step).animationName === "none"))).toBe(true);

  await page.reload({ waitUntil: "networkidle" });
  await expect(page.locator(".hx-stage")).toHaveAttribute("data-motion", "reduced");
  await expectPainted(page.locator("h1"));
  await expectScrolledContentPainted(page);
  expect(await page.locator(".sx-steps li").evaluateAll((steps) => steps.every((step) => getComputedStyle(step).animationName === "none"))).toBe(true);
});
