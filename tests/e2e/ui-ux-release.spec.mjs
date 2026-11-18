import { expect, test } from "@playwright/test";

test("hero identity copy clears the fixed header at every layout breakpoint", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  for (const width of [320, 375, 768, 1024, 1440, 1920]) {
    await page.setViewportSize({ width, height: width < 768 ? 844 : 1024 });
    await page.goto("/", { waitUntil: "networkidle" });
    const geometry = await page.evaluate(() => ({
      headerBottom: document.querySelector(".site-header").getBoundingClientRect().bottom,
      copyTop: Math.min(...[...document.querySelectorAll(".ruby-hero-topline p")].map((element) => element.getBoundingClientRect().top)),
    }));
    expect(geometry.copyTop, `identity copy at ${width}px`).toBeGreaterThanOrEqual(geometry.headerBottom);
  }
});

test("exhibition controls expose their complete visible labels as accessible names", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/", { waitUntil: "networkidle" });
  await page.locator(".exhibition").scrollIntoViewIfNeeded();
  const controls = page.locator(".exhibition-feature-link, .exhibition-preview");
  await expect(controls).toHaveCount(3);
  for (const control of await controls.all()) {
    const visibleLabel = (await control.innerText()).replace(/\s+/g, " ").trim();
    await expect(control).toHaveAccessibleName(visibleLabel, { ignoreCase: true });
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

test("interior editorial accents use warm gilt while the homepage keeps its ruby identity", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  for (const route of ["/work", "/services", "/about", "/contact"]) {
    await page.goto(route, { waitUntil: "networkidle" });
    const accent = page.locator("h1 em, h1 .accent-serif").first();
    await expect(accent).toHaveCSS("color", "rgb(229, 197, 154)");
    await expect(page.locator(".button-primary").first()).toHaveCSS("background-color", "rgb(167, 19, 59)");
  }
  await page.goto("/", { waitUntil: "networkidle" });
  const signature = page.locator(".ruby-hero h1 em");
  await expect(signature).toHaveCSS("-webkit-text-fill-color", "rgb(255, 192, 202)");
  await expect(signature).toHaveCSS("font-weight", "500");
  await expect(signature).toHaveCSS("filter", "none");
});

test("service pillars expose a keyboard focus indicator and expand with or without motion", async ({ page }) => {
  for (const reducedMotion of ["no-preference", "reduce"]) {
    await page.emulateMedia({ reducedMotion });
    await page.goto("/", { waitUntil: "networkidle" });
    const pillars = page.locator(".ruby-disciplines details");
    const summary = pillars.nth(1).locator("summary");
    await expect(pillars.first()).toHaveAttribute("open", "");
    await summary.focus();
    await expect(summary).toBeFocused();
    await expect(summary).toHaveCSS("outline-style", "solid");
    await page.keyboard.press("Space");
    await expect(pillars.nth(1)).toHaveAttribute("open", "");
    await expect(pillars.first()).not.toHaveAttribute("open");
    await expect(pillars.nth(1).getByRole("link", { name: "Enquire about Custom Software & Business Systems" })).toBeVisible();
    if (reducedMotion === "reduce") {
      await expect(summary.locator(".ruby-discipline-arrow")).toHaveCSS("transition-duration", "0s");
    }
  }
});
