import { expect, test } from "@playwright/test";

test("mobile selected work supports keyboard navigation and exposes the current project", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/#work");

  const controls = page.getByRole("group", { name: "Selected work navigation" });
  const previous = controls.getByRole("button", { name: "Previous project" });
  const next = controls.getByRole("button", { name: "Next project" });
  await expect(controls.getByText("Project 1 of 3")).toBeVisible();
  await expect(previous).toHaveAttribute("aria-disabled", "true");

  await next.press("Enter");
  const second = controls.getByRole("button", { name: /^Show project 2 of 3/ });
  await expect(second).toHaveAttribute("aria-current", "true");
  await expect(controls.getByText("Project 2 of 3")).toBeVisible();
  const gallery = page.getByRole("group", { name: "Selected work", exact: true });
  await expect.poll(() => gallery.evaluate((element) => element.scrollLeft)).toBeGreaterThan(0);
  await expect(gallery.getByRole("listitem").first()).toHaveCSS("opacity", "1");

  await second.press("ArrowRight");
  const third = controls.getByRole("button", { name: /^Show project 3 of 3/ });
  await expect(third).toBeFocused();
  await expect(third).toHaveAttribute("aria-current", "true");
  await expect(next).toHaveAttribute("aria-disabled", "true");
  await expect(gallery.getByRole("link", { name: /247 Inventory/ })).toBeVisible();

  await page.setViewportSize({ width: 1440, height: 900 });
  await expect(controls).toBeHidden();
});
