import { expect, test } from "@playwright/test";

for (const reducedMotion of ["no-preference", "reduce"]) {
  test(`the monogram leaves the first paint interactive with ${reducedMotion}`, async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled: false, reducedMotion });
    const page = await context.newPage();
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Websites built for real businesses.");
    await expect(page.locator(".home-hero").getByRole("link", { name: "Start a project" })).toBeVisible();
    await expect(page.locator(".home-hero").getByRole("link", { name: "See our work" })).toBeVisible();
    await expect(page.locator(".nav-wrap--home .brand-monogram-image")).toBeVisible();
    await expect(page.locator("#opening-intro")).toHaveCount(0);
    const animation = await page.locator(".nav-wrap--home .brand-lockup").evaluate((mark) => getComputedStyle(mark, "::after").animationName);
    expect(animation).toBe(reducedMotion === "reduce" ? "none" : "home-monogram-reveal");
    await context.close();
  });
}
