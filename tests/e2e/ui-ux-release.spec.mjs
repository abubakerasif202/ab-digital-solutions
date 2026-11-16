import { expect, test } from "@playwright/test";

test("hero identity copy clears the fixed header at every layout breakpoint", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  for (const width of [320, 375, 768, 1024, 1440, 1920]) {
    await page.setViewportSize({ width, height: width < 768 ? 844 : 1024 });
    await page.goto("/", { waitUntil: "networkidle" });
    const geometry = await page.evaluate(() => ({
      headerBottom: document.querySelector(".site-header").getBoundingClientRect().bottom,
      copyTop: Math.min(...[...document.querySelectorAll(".ruby-hero-topline p")].map((element) => element.getBoundingClientRect().top)),
    }));
    expect(geometry.copyTop, `identity copy at ${width}px`).toBeGreaterThanOrEqual(geometry.headerBottom);
  }
});

test("exhibition controls expose their complete visible labels as accessible names", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/", { waitUntil: "networkidle" });
  await page.locator(".exhibition").scrollIntoViewIfNeeded();
  const controls = page.locator(".exhibition-feature-link, .exhibition-preview");
  await expect(controls).toHaveCount(3);
  for (const control of await controls.all()) {
    const visibleLabel = (await control.innerText()).replace(/\s+/g, " ").trim();
    await expect(control).toHaveAccessibleName(visibleLabel, { ignoreCase: true });
  }
});
