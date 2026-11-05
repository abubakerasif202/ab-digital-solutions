import { test, expect } from "@playwright/test";

for (const width of [320, 375, 768, 1024, 1440]) {
  test(`Wild Pest case study at ${width}px`, async ({ page }) => {
    const errors = [];
    page.on("pageerror", error => errors.push(error.message));
    await page.setViewportSize({ width, height: 1000 });
    await page.goto("/work/wild-pest-solutions", { waitUntil: "networkidle" });
    await expect(page).toHaveTitle("Wild Pest Solutions Website Project | AB Web Studio");
    await expect(page.locator("h1")).toHaveText("Wild Pest Solutions");
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", /\/work\/wild-pest-solutions$/);
    await expect(page.getByRole("link", { name: /Visit Live Website/ }).first()).toHaveAttribute("href", "https://wildpestsolutions.com.au/");
    await expect(page.getByRole("heading", { name: "Digital Experiences Built for the Wild." })).toBeAttached();
    for (let y = 0; y < await page.locator("body").evaluate(el => el.scrollHeight); y += 700) {
      await page.evaluate(y => window.scrollTo(0, y), y);
      await page.waitForTimeout(80);
    }
    await page.waitForTimeout(700);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    expect(await page.locator("main img").evaluateAll(imgs => imgs.every(img => img.complete && img.naturalWidth > 0))).toBe(true);
    await page.screenshot({ path: `qa/wild-pest-solutions/case-study-${width}.png`, fullPage: true });
    await page.emulateMedia({ reducedMotion: "reduce" });
    expect(await page.locator(".gr-cs-pan img").evaluate(el => getComputedStyle(el).animationName)).toBe("none");
    await page.keyboard.press("Tab");
    expect(await page.evaluate(() => document.activeElement !== document.body)).toBe(true);
    expect(errors).toEqual([]);
  });
}

test("portfolio filtering retains accessible project and live links", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/work", { waitUntil: "networkidle" });
  await page.getByRole("button", { name: /Environmental & Wildlife Management/ }).click();
  const card = page.locator("article").filter({ hasText: "Wild Pest Solutions" });
  await expect(card.getByRole("link", { name: /View Project/ })).toHaveAttribute("href", "/work/wild-pest-solutions");
  await expect(card.getByRole("link", { name: /Visit Live Website/ })).toHaveAttribute("href", "https://wildpestsolutions.com.au/");
  await card.scrollIntoViewIfNeeded();
  await page.waitForTimeout(1200);
  await card.screenshot({ path: "qa/wild-pest-solutions/portfolio-card.png" });
  await page.getByRole("button", { name: /All work/ }).click();
  await expect(page.locator("article")).toHaveCount(18);
});

test("Pept Up Labs metadata, gallery and responsive layouts", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  for (const width of [320, 375, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto("/work/pept-up-labs", { waitUntil: "networkidle" });
    await expect(page).toHaveTitle("Pept Up Labs Website Project | AB Web Studio");
    await expect(page.locator("h1")).toHaveText("Pept Up Labs");
    await expect(page.getByRole("link", { name: /Visit Live Website/ }).first()).toHaveAttribute("href", "https://peptuplabs.com.au/");
    await page.locator(".gr-cs-gallery").scrollIntoViewIfNeeded();
    await page.waitForTimeout(1000);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    expect(await page.locator(".gr-cs-gallery img").evaluateAll(imgs => imgs.every(img => img.complete && img.naturalWidth > 0))).toBe(true);
    await page.screenshot({ path: `qa/wild-pest-solutions/peptup-case-study-${width}.png`, fullPage: true });
  }
  expect(errors).toEqual([]);
});
