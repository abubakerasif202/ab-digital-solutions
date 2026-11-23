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

for (const width of [390, 720]) {
  test(`three case-study cards show sharp unfiltered captures at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 850 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    const cards = page.getByRole("region", { name: "Selected work" }).getByRole("article");
    await expect(cards).toHaveCount(3);
    for (const card of await cards.all()) {
      await card.scrollIntoViewIfNeeded();
      const image = card.getByRole("img");
      await expect.poll(() => image.evaluate((element) => element.naturalWidth >= element.clientWidth)).toBe(true);
      await expect(image).toHaveCSS("object-fit", "contain");
      await expect(image).toHaveCSS("filter", "none");
    }
  });
}
