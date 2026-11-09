import { expect, test } from "@playwright/test";

// Real rendered checks across every sitemap route, including all case studies
// and service pages. External delivery is always intercepted.
for (const width of [390, 1440]) {
  test(`public pages retain content and fit the viewport at ${width}px`, async ({ page, request }) => {
    test.setTimeout(300000);
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.route("**/api/contact", (route) => route.fulfill({ status: 503, contentType: "application/json", body: JSON.stringify({ error: "Test delivery disabled" }) }));
    await page.route("**/api/analytics", (route) => route.fulfill({ status: 204 }));
    const sitemap = await request.get("/sitemap.xml");
    expect(sitemap.ok()).toBeTruthy();
    const paths = [...(await sitemap.text()).matchAll(/<loc>(.*?)<\/loc>/g)].map((match) => new URL(match[1]).pathname);
    expect(paths).toContain("/contact");
    expect(paths.some((path) => path.startsWith("/work/"))).toBeTruthy();
    expect(paths.some((path) => path.startsWith("/services/"))).toBeTruthy();
    for (const path of paths) {
      await test.step(path, async () => {
        const response = await page.goto(path, { waitUntil: "networkidle" });
        expect(response.status()).toBe(200);
        await expect(page.locator("main")).toBeVisible();
        await expect(page.locator("h1")).toHaveCount(1);
        await expect(page.locator("h1")).toBeVisible();
        await expect(page.locator("link[rel=canonical]")).toHaveAttribute("href", new RegExp(`${path.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}/?$`));
        const dimensions = await page.evaluate(() => ({ viewport: innerWidth, content: document.documentElement.scrollWidth }));
        expect(dimensions.content, `${path} horizontal overflow`).toBeLessThanOrEqual(dimensions.viewport + 1);
        await expect(page.getByRole("navigation", { name: "Footer studio navigation" })).toBeVisible();
      });
    }
  });
}

test("mobile navigation closes with Escape and restores trigger focus", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  const trigger = page.locator("button[aria-controls]").filter({ hasText: /menu/i });
  await trigger.click();
  await expect(trigger).toHaveAttribute("aria-expanded", "true");
  await page.keyboard.press("Escape");
  await expect(trigger).toHaveAttribute("aria-expanded", "false");
  await expect(trigger).toBeFocused();
  await expect(page.locator("main")).not.toHaveAttribute("inert", "");
});

test("portfolio sector filters remain functional", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/work");
  const filters = page.getByRole("group", { name: "Filter by sector" });
  const all = filters.getByRole("button").first();
  const cards = page.locator(".gr-wi-card");
  const total = await cards.count();
  expect(total).toBeGreaterThan(1);
  const category = filters.getByRole("button").nth(1);
  await category.click();
  await expect(category).toHaveAttribute("aria-pressed", "true");
  await expect.poll(() => cards.count()).toBeLessThan(total);
  await all.click();
  await expect(cards).toHaveCount(total);
});
