import { expect, test } from "@playwright/test";
import { join } from "node:path";

for (const [width, height] of [[320, 844], [360, 844], [390, 844], [768, 960], [1024, 900], [1150, 631], [1280, 900], [1440, 900]]) {
  test(`hero and Selected work geometry at ${width} × ${height}`, async ({ page }) => {
    const errors = [];
    await page.route("**/_vercel/speed-insights/script.js", route => route.fulfill({ contentType: "application/javascript", body: "" }));
    page.on("pageerror", error => errors.push(error.message));
    page.on("console", message => { if (message.type() === "error") errors.push(message.text()); });
    await page.setViewportSize({ width, height });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    await page.evaluate(() => document.fonts.ready);
    const hero = page.locator(".home-hero");
    const work = page.locator("#work");
    await expect(hero.getByRole("heading")).toHaveText("Websites built for real businesses.");
    await expect(work.getByRole("article")).toHaveCount(3);
    await expect(page.locator(".ruby-process-step")).toHaveCount(4);
    const initial = await hero.evaluate(element => {
      const rect = selector => element.querySelector(selector).getBoundingClientRect();
      const copy = rect(".ruby-hero-composition");
      const visual = rect(".work-wall");
      const actions = [...element.querySelectorAll(".ruby-hero-actions a")].map(a => a.getBoundingClientRect());
      return {
        width: document.documentElement.scrollWidth,
        copyVisible: copy.top >= document.querySelector(".site-header").getBoundingClientRect().bottom && visual.width > 0,
        actionsFit: actions.every(action => action.left >= 0 && action.right <= innerWidth && action.bottom <= innerHeight && action.height >= 44),
      };
    });
    expect(initial).toEqual({ width, copyVisible: true, actionsFit: true });
    const shots = process.env.AB_HOME_SCREENSHOTS;
    await expect.poll(() => hero.locator(".work-wall img").first().evaluate(img => img.naturalWidth)).toBeGreaterThan(0);
    if (shots) await page.screenshot({ path: join(shots, `after-hero-${width}.png`), animations: "disabled" });

    const before = await work.locator(".home-work-image").evaluateAll(images => images.map(img => img.clientHeight));
    for (const card of await work.getByRole("article").all()) {
      await card.scrollIntoViewIfNeeded();
      await expect.poll(() => card.locator("img").evaluate(img => img.naturalWidth)).toBeGreaterThan(0);
      expect(await card.locator("h3").evaluate(title => title.scrollWidth <= title.clientWidth)).toBe(true);
    }
    expect(await work.locator(".home-work-image").evaluateAll(images => images.map(img => img.clientHeight))).toEqual(before);
    if (shots) await work.screenshot({
      path: join(shots, `after-work-${width}.png`),
      animations: "disabled",
      style: ".site-header, .skip-link { visibility: hidden !important; }",
    });
    expect(errors).toEqual([]);
  });
}

test("homepage enquiry keeps inputs after failure and accepts an undecided project without a budget", async ({ page }) => {
  await page.goto("/");
  await page.locator(".home-hero").getByRole("link", { name: "Start a project" }).click();
  await expect(page).toHaveURL(/#contact$/);
  const form = page.getByRole("form", { name: "Project enquiry" });
  await expect(form.getByRole("radio", { checked: true })).toHaveCount(0);
  const submit = form.getByRole("button", { name: "Send project enquiry" });
  await form.getByRole("textbox", { name: "Name", exact: true }).fill("Homepage QA");
  await form.getByRole("textbox", { name: "Email", exact: true }).fill("qa@example.invalid");
  await form.getByLabel("Project details").fill("A local QA enquiry with no live delivery.");
  let submissions = 0;
  await page.route("**/api/contact", async route => {
    submissions++;
    expect(route.request().postDataJSON()).toMatchObject({ services: ["Not sure yet"], budget: "" });
    await expect(form.getByRole("button", { name: "Sending…" })).toBeDisabled();
    await expect(form.locator(".form-spinner")).toBeVisible();
    await route.fulfill(submissions === 1 ? { status: 503, json: { error: "Try again shortly." } } : { json: { ok: true } });
  });
  await submit.click();
  await expect(form.locator("#services-error")).toBeVisible();
  expect(submissions).toBe(0);
  await form.getByRole("radio", { name: "Not sure yet", exact: true }).check();
  await submit.click();
  await expect(form.getByRole("status")).toContainText("Try again shortly.");
  await expect(form.getByRole("textbox", { name: "Name", exact: true })).toHaveValue("Homepage QA");
  await expect(form.getByRole("radio", { name: "Not sure yet", exact: true })).toBeChecked();
  await submit.click();
  await expect(form.getByRole("status")).toContainText("Enquiry received");
  expect(submissions).toBe(2);
});

test("homepage links to the service detail and preserves enquiry preselection", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/");
  await page.locator("#services").getByRole("link", { name: /Custom Software & Business Systems/ }).click();
  await expect(page).toHaveURL(/\/services\/custom-software-business-systems$/);

  await page.goto("/?service=seo-local-visibility#contact");
  await expect(page.getByRole("radio", { name: "SEO & local visibility" })).toBeChecked();
});

test("homepage metadata identifies the organisation and canonical public URL", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/AB Web Studio.*Web Design Studio in Sydney/);
  await expect(page.locator('meta[name="description"]')).toHaveAttribute("content", /Sydney/);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", "https://www.abwebstudio.com.au");
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute("content", /\/opengraph-image(?:\?|$)/);
  const graph = await page.locator('script[type="application/ld+json"]').evaluateAll(nodes =>
    nodes.map(node => JSON.parse(node.textContent)).flatMap(value => value["@graph"] ?? []));
  expect(graph).toEqual(expect.arrayContaining([expect.objectContaining({
    "@type": expect.arrayContaining(["Organization", "ProfessionalService"]),
    name: "AB Web Studio",
    address: expect.objectContaining({ addressLocality: "Sydney", addressCountry: "AU" }),
  })]));
});
