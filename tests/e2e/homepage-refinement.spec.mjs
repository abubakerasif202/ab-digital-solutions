import { expect, test } from "@playwright/test";

test("hero work anchor focuses Selected work below the sticky header", async ({ page }) => {
  await page.setViewportSize({ width: 1150, height: 631 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  const work = page.getByRole("region", { name: "Selected work" });
  const action = page.getByRole("link", { name: "See our work" });
  await expect(action).toBeInViewport({ ratio: 1 });
  await action.focus();
  await action.press("Enter");
  await expect(work).toBeFocused();
  await expect.poll(() => work.evaluate((section) => {
    const header = document.querySelector(".site-header").getBoundingClientRect();
    const top = section.querySelector("h2").getBoundingClientRect().top;
    return top >= header.bottom && top - header.bottom <= 90;
  })).toBe(true);
});

test("all featured work and both studio entries reach their destinations", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  const links = [
    [/Jufaja Homes.*View case study/, "/work/jufaja-homes"],
    [/On Call Trailers.*View case study/, "/work/on-call-trailers"],
    [/247 Inventory System.*View case study/, "/work/247-inventory-system"],
    [/Explore all \d+ projects/, "/work"],
    ["Enter the Virtual Studio", "/studio"],
    ["Explore the studio without 3D", "/studio#studio-content"],
  ];
  for (const [name, path] of links) {
    await page.goto("/");
    await page.locator("main").getByRole("link", { name, exact: true }).click();
    await expect(page).toHaveURL(new RegExp(`${path}$`));
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    if (path.includes("#")) await expect(page.locator("#studio-content")).toBeInViewport();
  }
});

test("project wall previews follow pointer and keyboard without taking over the native case-study links", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  const links = page.getByRole("list", { name: "Selected case studies" }).getByRole("link");
  const previews = page.locator(".hero-project-inspector-view");
  const column = page.locator(".work-wall-column").first();

  await links.nth(1).hover();
  await expect(previews.nth(1)).toBeVisible();
  await expect(previews.nth(1)).toContainText("On Call Trailers");
  await expect.poll(() => previews.nth(1).locator("img").evaluate(image => image.naturalWidth)).toBeGreaterThan(0);
  await expect(column).toHaveCSS("animation-play-state", "paused");

  await page.mouse.move(0, 0);
  await expect(previews.nth(1)).toBeHidden();
  await expect(column).toHaveCSS("animation-play-state", "running");

  await page.keyboard.press("Tab");
  await links.nth(0).focus();
  await expect(previews.nth(0)).toBeVisible();
  await links.nth(2).hover();
  await expect(previews.nth(0)).toBeHidden();
  await expect(previews.nth(2)).toBeVisible();

  await page.mouse.move(0, 0);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(previews.nth(0)).toBeVisible();
  await expect(column).toHaveCSS("animation-name", "none");
  await links.nth(0).press("Enter");
  await expect(page).toHaveURL(/\/work\/jufaja-homes$/);
});
