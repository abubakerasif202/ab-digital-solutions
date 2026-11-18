import { expect, test } from "@playwright/test";

test("homepage work link puts a stable featured preview just beneath the sticky header", async ({ page }) => {
  await page.setViewportSize({ width: 1150, height: 850 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await expect(page.locator(".exhibition")).toHaveAttribute("data-project", "jufaja-homes");
  await expect(page.locator(".ruby-hero a[href='#work']")).toHaveCount(1);
  await page.getByRole("link", { name: "See the work", exact: true }).click();
  await expect.poll(() => page.locator("#work-heading").evaluate((heading) => {
    const header = document.querySelector(".site-header").getBoundingClientRect();
    const preview = document.querySelector(".exhibition-image-stack").getBoundingClientRect();
    const top = heading.getBoundingClientRect().top;
    return top >= header.bottom && top - header.bottom <= 90 && preview.top < innerHeight / 2;
  })).toBe(true);
  await expect(page.locator(".exhibition")).toHaveAttribute("data-image-state", "ready");
  const next = page.getByRole("button", { name: "Next project", exact: true });
  await next.focus();
  await next.press("Enter");
  await expect(page.locator(".exhibition")).toHaveAttribute("data-project", "milestone-renovate");
  await expect(page.locator(".exhibition-feature-link")).toHaveAttribute("href", "/work/milestone-renovate");
  await expect(page.locator(".exhibition-feature-caption strong")).toHaveText("Milestone Renovate");
  await expect(page.locator(".exhibition-image--current img")).toHaveAttribute("src", /ab-portfolio-milestone-renovate/);
  await expect(page.locator(".exhibition")).toHaveAttribute("data-image-state", "ready");
});
