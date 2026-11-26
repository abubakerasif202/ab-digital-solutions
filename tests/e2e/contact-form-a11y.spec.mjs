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
    await expect(first).not.toBeChecked();
    await first.focus();
    await page.keyboard.press("Space");
    await expect(first).toBeChecked();
    await page.keyboard.press("Space");
    await expect(first).not.toBeChecked();
  });
});

for (const { label, retryAfter, waitMs } of [
  { label: "valid hint", retryAfter: "2", waitMs: 2_000 },
  { label: "oversized hint", retryAfter: "86400", waitMs: 600_000 },
  { label: "malformed hint", retryAfter: "2.5", waitMs: 0 },
  { label: "missing hint", retryAfter: undefined, waitMs: 0 },
]) {
  test(`a rate-limited enquiry remains retryable with a ${label}`, async ({ page }) => {
    const payloads = [];
    const error = "Too many enquiries. Please wait a few minutes or contact us directly.";
    await page.route("**/api/contact", async (route) => {
      payloads.push(route.request().postDataJSON());
      if (payloads.length === 1) {
        await route.fulfill({
          status: 429,
          headers: retryAfter === undefined ? {} : { "Retry-After": retryAfter },
          json: { error },
        });
        return;
      }
      await route.fulfill({ status: 200, json: { ok: true } });
    });
    await page.clock.install();
    await page.goto("/contact", { waitUntil: "networkidle" });
    const form = page.getByRole("form", { name: "Project enquiry" });
    const email = form.getByLabel("Email");
    const service = form.getByRole("checkbox", { name: "Website design & development" });
    const submit = form.getByRole("button", { name: /Send project enquiry/ });
    const status = form.getByRole("status");
    await form.getByLabel("Name").fill("Accessibility QA");
    await email.fill("qa@example.invalid");
    await service.check();
    await form.getByLabel(/Tell us about your project/).fill("A website for my business.");
    await page.clock.pauseAt(await page.evaluate(() => Date.now() + 1_000));
    await form.evaluate((element) => element.requestSubmit());
    await expect(status).toContainText(error);
    await expect(status.getByRole("link", { name: /email us/i })).toHaveAttribute("href", /^mailto:/);
    await expect(form.getByRole("link", { name: /or call/i })).toHaveAttribute("href", /^tel:/);
    await expect(email).toHaveValue("qa@example.invalid");
    await expect(service).toBeChecked();

    if (waitMs) {
      await expect(submit).toBeDisabled();
      await form.evaluate((element) => element.requestSubmit());
      await page.clock.fastForward(waitMs - 1);
      await expect(submit).toBeDisabled();
      expect(payloads).toHaveLength(1);
      await page.clock.fastForward(1);
      await expect(status).toContainText("You can try again now.");
    }
    await expect(submit).toBeEnabled();
    await page.clock.resume();
    await submit.click();
    await expect(status).toContainText("Enquiry received");
    expect(payloads).toHaveLength(2);
    expect(payloads[0].submissionId).toEqual(expect.any(String));
    expect(payloads[1]).toEqual(payloads[0]);
    await expect(email).toHaveValue("");
  });
}
