import { expect, test } from "@playwright/test";

test("mobile homepage protects hero legibility, menu focus, work scrolling and contact order", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  const hero = page.locator(".home-hero");
  const pause = hero.getByRole("button", { name: "Pause project wall" });
  const eyebrow = hero.getByText("Independent web studio");
  await expect(pause).toBeVisible();
  await expect(eyebrow).toHaveCSS("white-space", "nowrap");
  await expect(hero.locator(".ruby-hero-topline > :nth-child(2)")).toBeHidden();
  await expect(hero.getByRole("link", { name: "20 Case studies" })).toBeVisible();
  const [chip, control] = await Promise.all([eyebrow.boundingBox(), pause.boundingBox()]);
  expect(control.width).toBeGreaterThanOrEqual(44);
  expect(control.height).toBeGreaterThanOrEqual(44);
  expect(chip.x + chip.width <= control.x || chip.y + chip.height <= control.y || control.y + control.height <= chip.y).toBe(true);
  await pause.click();
  await expect(pause).toHaveAttribute("aria-pressed", "true");

  const toggle = page.locator(".menu-toggle");
  const nav = page.getByRole("navigation", { name: "Primary navigation" });
  await page.locator("#work").scrollIntoViewIfNeeded();
  await toggle.click();
  await expect(nav.getByRole("link", { name: "Work", exact: true })).toHaveAttribute("aria-current", "location");
  await expect(nav.getByRole("link", { name: "Work", exact: true })).toBeFocused();
  await expect(page.locator("body")).toHaveCSS("overflow-y", "hidden");
  await page.keyboard.press("Shift+Tab");
  await expect(toggle).toBeFocused();
  await page.keyboard.press("Shift+Tab");
  await expect(nav.locator(".nav-phone")).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(toggle).toBeFocused();
  await expect(toggle).toHaveAttribute("aria-expanded", "false");
  await toggle.click();
  await nav.getByRole("link", { name: "Process" }).click();
  await expect(page).toHaveURL(/#process$/);
  await expect(toggle).toHaveAttribute("aria-expanded", "false");

  const work = page.getByRole("group", { name: "Selected work" });
  await expect(work).toHaveCSS("scroll-snap-type", "x mandatory");
  expect(await work.evaluate(region => region.scrollWidth > region.clientWidth)).toBe(true);
  for (const card of await work.getByRole("article").all()) {
    await expect(card.getByRole("link")).toHaveCount(1);
    await expect(card.getByText("View case study")).toBeVisible();
  }
  const contact = page.locator("#contact");
  for (const link of await contact.getByRole("list", { name: "Contact directly" }).getByRole("link").all()) {
    expect((await link.boundingBox()).height).toBeGreaterThanOrEqual(44);
  }
  expect(await contact.locator("form").evaluate(form => Boolean(form.compareDocumentPosition(
    form.closest("section").querySelector(".ruby-next-steps"),
  ) & Node.DOCUMENT_POSITION_FOLLOWING))).toBe(true);
});

test("desktop exposes all service categories and keeps Process within its height budget", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/");
  await expect(page.locator("#services button:visible")).toHaveCount(0);
  await expect(page.locator("#services .ruby-service-options:visible")).toHaveCount(3);
  expect((await page.locator("#process").boundingBox()).height).toBeLessThanOrEqual(850);
});