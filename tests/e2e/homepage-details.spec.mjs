import { expect, test } from "@playwright/test";

test("home header keeps the wordmark, menu and project link inside a 320px viewport", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 820 });
  await page.goto("/");
  const header = page.getByRole("banner");
  const menu = header.getByRole("button", { name: "Open navigation" });
  const projectLink = header.getByRole("link", { name: "Start a project" });
  await expect(menu).toBeVisible();
  await expect(projectLink).toHaveAttribute("href", "#contact");
  expect(await header.evaluate(async element => {
    await document.fonts.ready;
    const wordmark = element.querySelector(".brand-lockup").getBoundingClientRect();
    const menu = element.querySelector(".menu-toggle").getBoundingClientRect();
    const project = element.querySelector(".header-project-cta").getBoundingClientRect();
    const row = element.querySelector(".nav-wrap--home").getBoundingClientRect();
    return wordmark.left >= row.left && wordmark.right <= menu.left && menu.right <= project.left
      && project.right <= row.right && menu.width >= 44 && menu.height >= 44 && project.height >= 44;
  })).toBe(true);
});

test.describe("static homepage header", () => {
  test.use({ javaScriptEnabled: false, viewport: { width: 320, height: 820 } });

  test("keeps navigation on a compact second row without JavaScript", async ({ page }) => {
    await page.goto("/");
    const header = page.getByRole("banner");
    const nav = header.getByRole("navigation", { name: "Primary navigation" });
    await expect(nav.getByRole("link", { name: "Work" })).toBeVisible();
    await expect(header.getByRole("button", { name: "Open navigation" })).toHaveCount(0);
    expect(await header.evaluate(element => {
      const nav = element.querySelector(".site-nav").getBoundingClientRect();
      const cta = element.querySelector(".header-project-cta").getBoundingClientRect();
      const brand = element.querySelector(".brand").getBoundingClientRect();
      return nav.top >= brand.bottom && cta.top >= nav.bottom && nav.left >= 0 && nav.right <= innerWidth
        && [...element.querySelectorAll(".site-nav a")].every(link => {
          const bounds = link.getBoundingClientRect();
          return bounds.left >= nav.left && bounds.right <= nav.right && bounds.height >= 44;
        });
    })).toBe(true);
  });
});

test("project exhibition frames the real capture without masking attribution or controls", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 850 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  const exhibition = page.getByRole("region", { name: "Project exhibition" });
  const feature = exhibition.locator(".exhibition-feature");
  await feature.scrollIntoViewIfNeeded();
  await expect(exhibition).toHaveAttribute("data-image-state", "ready");
  const project = await exhibition.getAttribute("data-project");
  await expect(feature.locator(".exhibition-feature-link")).toHaveAttribute("href", `/work/${project}`);
  await expect(feature.locator(".exhibition-destination")).toBeVisible();
  await expect(exhibition.getByRole("button", { name: "Next project" })).toBeEnabled();
  expect(await feature.evaluate(element => {
    const stack = element.querySelector(".exhibition-image-stack").getBoundingClientRect();
    const image = element.querySelector("img");
    const capture = image.getBoundingClientRect();
    const style = getComputedStyle(image);
    return capture.left > stack.left && capture.right < stack.right
      && image.naturalWidth > 0 && style.objectFit === "contain" && image.getAnimations().length === 0;
  })).toBe(true);
});
