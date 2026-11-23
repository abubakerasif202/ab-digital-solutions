import { expect, test } from "@playwright/test";

test("hero identity copy clears the fixed header at every layout breakpoint", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  for (const width of [320, 375, 768, 1024, 1440, 1920]) {
    await page.setViewportSize({ width, height: width < 768 ? 844 : 1024 });
    await page.goto("/", { waitUntil: "networkidle" });
    const geometry = await page.evaluate(() => ({
      headerBottom: document.querySelector(".site-header").getBoundingClientRect().bottom,
      copyTop: document.querySelector("#hero-heading").getBoundingClientRect().top,
    }));
    expect(geometry.copyTop, `identity copy at ${width}px`).toBeGreaterThanOrEqual(geometry.headerBottom);
  }
});

test("featured links expose their visible label and project name", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/", { waitUntil: "networkidle" });
  const controls = page.locator(".home-work-card .cinema-link");
  await expect(controls).toHaveCount(3);
  for (const control of await controls.all()) {
    const title = await control.locator("xpath=ancestor::article").locator("h3").innerText();
    await expect(control).toHaveAccessibleName(`View case study for ${title}`);
  }
});

test("direct contact values remain readable inside their rows at every layout width", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  for (const width of [320, 375, 390, 640, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    for (const route of ["/", "/contact"]) {
      await page.goto(route, { waitUntil: "networkidle" });
      const contacts = page.locator(".studio-contact-rows strong");
      await expect(contacts).toHaveCount(3);
      for (const contact of await contacts.all()) {
        await contact.scrollIntoViewIfNeeded();
        const geometry = await contact.evaluate((element) => {
          const value = element.getBoundingClientRect();
          const row = element.closest("a").getBoundingClientRect();
          return { width: value.width, left: value.left, right: value.right, rowLeft: row.left, rowRight: row.right, scroll: element.scrollWidth, client: element.clientWidth };
        });
        expect(geometry.width, `${route} contact width at ${width}px`).toBeGreaterThan(100);
        expect(geometry.left).toBeGreaterThanOrEqual(geometry.rowLeft);
        expect(geometry.right).toBeLessThanOrEqual(geometry.rowRight);
        expect(geometry.scroll).toBeLessThanOrEqual(geometry.client + 1);
      }
    }
  }
});

test("editorial accents use warm gilt and primary actions use ruby", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  for (const route of ["/work", "/services", "/about", "/contact"]) {
    await page.goto(route, { waitUntil: "networkidle" });
    const accent = page.locator("h1 em, h1 .accent-serif").first();
    await expect(accent).toHaveCSS("color", "rgb(201, 164, 92)");
    await expect(page.locator(".button-primary").first()).toHaveCSS("background-color", "rgb(179, 18, 46)");
  }
  await page.goto("/", { waitUntil: "networkidle" });
  const signature = page.locator("#hero-heading em");
  await expect(signature).toHaveCSS("color", "rgb(201, 164, 92)");
  await expect(signature).toHaveCSS("filter", "none");
});

test("service pillars expose a keyboard focus indicator and expand with or without motion", async ({ page }) => {
  for (const reducedMotion of ["no-preference", "reduce"]) {
    await page.emulateMedia({ reducedMotion });
    await page.goto("/", { waitUntil: "networkidle" });
    const pillars = page.locator(".ruby-disciplines details");
    const summary = pillars.nth(2).locator("summary");
    await expect(pillars.first()).toHaveAttribute("open", "");
    await summary.focus();
    await expect(summary).toBeFocused();
    await expect(summary).toHaveCSS("outline-style", "solid");
    await page.keyboard.press("Space");
    await expect(pillars.nth(2)).toHaveAttribute("open", "");
    await expect(pillars.first()).not.toHaveAttribute("open");
    await expect(pillars.nth(2).getByRole("link", { name: "Enquire about Custom Software & Business Systems" })).toBeVisible();
    if (reducedMotion === "reduce") {
      await expect(summary.locator(".ruby-discipline-arrow")).toHaveCSS("transition-duration", "0s");
    }
  }
});
