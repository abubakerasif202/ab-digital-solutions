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
  const controls = page.locator(".home-work-card").getByRole("link");
  await expect(controls).toHaveCount(3);
  for (const control of await controls.all()) {
    const title = await control.locator("xpath=ancestor::article").locator("h3").innerText();
    await expect(control).toHaveAccessibleName(new RegExp(title));
    await expect(control).toHaveAccessibleName(/View case study/);
  }
});

test("direct contact values remain readable inside their rows at every layout width", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  for (const width of [320, 375, 390, 640, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    for (const route of ["/", "/contact"]) {
      await page.goto(route, { waitUntil: "networkidle" });
      const compact = route === "/" && width < 768;
      const contacts = page.locator(compact ? ".studio-contact-rows .studio-contact-label" : ".studio-contact-rows strong");
      await expect(contacts).toHaveCount(3);
      for (const contact of await contacts.all()) {
        await contact.scrollIntoViewIfNeeded();
        const geometry = await contact.evaluate((element) => {
          const value = element.getBoundingClientRect();
          const row = element.closest("a").getBoundingClientRect();
          return { width: value.width, left: value.left, right: value.right, rowLeft: row.left, rowRight: row.right, rowHeight: row.height, scroll: element.scrollWidth, client: element.clientWidth };
        });
        expect(geometry.width, `${route} contact width at ${width}px`).toBeGreaterThan(compact ? 0 : 100);
        expect(geometry.rowHeight).toBeGreaterThanOrEqual(44);
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

test("mobile service pillars expose keyboard focus and disclosure state", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  for (const reducedMotion of ["no-preference", "reduce"]) {
    await page.emulateMedia({ reducedMotion });
    await page.goto("/", { waitUntil: "networkidle" });
    const toggle = page.locator("#services").getByRole("button", { name: "Business systems" });
    const detail = page.locator("#services").getByRole("link", { name: /Custom Software & Business Systems/ });
    await expect(toggle).toHaveAttribute("aria-expanded", "false");
    await expect(detail).toBeHidden();
    await toggle.focus();
    await expect(toggle).toBeFocused();
    await expect(toggle).toHaveCSS("outline-style", "solid");
    await page.keyboard.press("Space");
    await expect(toggle).toHaveAttribute("aria-expanded", "true");
    await expect(detail).toBeVisible();
  }
});

test("studio entrance offers both paths within the first phone screen", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/studio", { waitUntil: "networkidle" });
  const enter = page.getByRole("button", { name: "Enter the Studio" });
  const skip = page.getByRole("link", { name: "Explore without 3D" });
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("The Virtual Studio");
  await expect(enter).toBeInViewport({ ratio: 1 });
  await enter.focus();
  await page.keyboard.press("Tab");
  await expect(skip).toBeFocused();
  await expect(skip).toBeInViewport({ ratio: 1 });
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/#studio-content$/);
  await expect(page.getByRole("heading", { name: "Projects and services" })).toBeInViewport();
  await expect(page.getByRole("link", { name: "View all work" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Explore services", exact: true })).toBeVisible();
  await expect(page.locator(".ab-spatial-canvas")).toHaveCount(0);
});

for (const width of [390, 1135]) {
  test(`homepage contact choices are visible and submit the existing value at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 });
    let submission;
    await page.route("**/api/contact", async (route) => {
      submission = route.request().postDataJSON();
      await route.fulfill({ json: { ok: true } });
    });
    await page.goto("/", { waitUntil: "networkidle" });
    await page.locator(".ruby-hero-actions").getByRole("link", { name: "Start a project" }).click();
    const form = page.locator("#contact form");
    await expect(page.getByRole("heading", { name: "Tell us about your project" })).toBeVisible();
    for (const label of ["Website", "Online store", "Business system", "SEO & local visibility", "Digital marketing", "Branding & content", "Website care & support", "Not sure yet"]) {
      await expect(form.getByRole("radio", { name: label, exact: true }).locator("..")).toBeVisible();
    }
    await form.locator("#full-name").fill("Browser Test");
    await form.locator("#email").fill("browser@example.com");
    await form.locator("#message").fill("Local browser test of the enquiry form; do not send.");
    await form.getByRole("button", { name: /send/i }).click();
    await expect(form.getByText("Choose a project type.")).toBeVisible();
    expect(submission).toBeUndefined();
    const seo = form.getByRole("radio", { name: "SEO & local visibility" });
    await seo.focus();
    await page.keyboard.press("Space");
    await expect(seo).toBeChecked();
    await form.getByRole("button", { name: /send/i }).click();
    await expect.poll(() => submission?.services).toEqual(["SEO & local visibility"]);
  });
}

test("short landscape studio entrance scrolls with the document", async ({ page }) => {
  await page.setViewportSize({ width: 740, height: 360 });
  await page.goto("/studio");
  const link = page.getByRole("link", { name: "Explore without 3D" });
  await link.scrollIntoViewIfNeeded();
  await expect(link).toBeInViewport({ ratio: 1 });
  const scroll = await page.locator("[data-entrance]").evaluate(stage => ({
    stage: stage.scrollTop,
    page: window.scrollY,
  }));
  expect(scroll.stage).toBe(0);
  expect(scroll.page).toBeGreaterThan(0);
});
