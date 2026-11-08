import { expect, test } from "@playwright/test";

// Accessibility regression for the "What do you need?" group on /contact. Run against a production
// server (QA_BASE_URL). Requests to /api/contact are intercepted, so no real enquiry is ever sent.
test.describe("contact form service group", () => {
  test.beforeEach(async ({ page }) => {
    await page.route("**/api/contact", () => {
      throw new Error("A contact request was sent while the service group was invalid");
    });
  });

  test("exposes a required, described group and keeps ?service= preselection", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/contact?service=seo", { waitUntil: "networkidle" });
    const group = page.getByRole("group", { name: /What do you need\?/ });
    await expect(group).toHaveAccessibleName(/required/i);
    await expect(group).toHaveAccessibleDescription(/Choose at least one service/);
    await expect(page.getByRole("checkbox", { name: "SEO & local visibility" })).toBeChecked();
    await expect(page.getByRole("checkbox", { name: "Website design & development" })).not.toBeChecked();
  });

  test("keeps multi-select and announces the error after deselecting every service", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/contact?service=web-design", { waitUntil: "networkidle" });
    const group = page.getByRole("group", { name: /What do you need\?/ });
    const web = page.getByRole("checkbox", { name: "Website design & development" });
    const seo = page.getByRole("checkbox", { name: "SEO & local visibility" });

    await seo.check();
    await expect(web).toBeChecked();
    await expect(seo).toBeChecked();

    await web.uncheck();
    await seo.uncheck();
    const alert = page.getByRole("alert").filter({ hasText: "Choose at least one service." });
    await expect(alert).toBeVisible();
    await expect(group).toHaveAccessibleDescription(/Choose at least one service.*Choose at least one service/s);

    await page.getByLabel("Name").fill("Accessibility QA");
    await page.getByLabel("Email").fill("qa@example.invalid");
    await page.getByLabel(/Tell us about your project/).fill("Automated check; the request is intercepted.");
    await page.getByRole("button", { name: /Send project enquiry/ }).click();
    await expect(alert).toBeVisible();
    await expect(web).toBeFocused();

    await web.check();
    await expect(alert).toHaveCount(0);
  });

  test("service choices are operable from the keyboard", async ({ page }) => {
    await page.goto("/contact", { waitUntil: "networkidle" });
    const first = page.getByRole("checkbox", { name: "Website design & development" });
    await first.focus();
    await page.keyboard.press("Space");
    await expect(first).not.toBeChecked();
    await page.keyboard.press("Space");
    await expect(first).toBeChecked();
  });
});
