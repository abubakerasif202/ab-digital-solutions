import { expect, test } from "@playwright/test";
import { join } from "node:path";

for (const width of [1440, 1280, 1024, 768, 390, 360]) {
  test(`homepage editorial and interaction geometry at ${width}px`, async ({ page }) => {
    const errors = [];
    // The deployment injects this script; plain next start does not serve it.
    await page.route("**/_vercel/speed-insights/script.js", route => route.fulfill({ contentType: "application/javascript", body: "" }));
    page.on("pageerror", error => errors.push(error.message));
    page.on("console", message => { if (message.type() === "error") errors.push(message.text()); });
    await page.setViewportSize({ width, height: width >= 768 ? 960 : 844 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    await page.evaluate(() => document.fonts.ready);
    await expect(page.getByRole("banner").getByRole("link", { name: "Start a project" })).toBeVisible();
    await expect(page.getByRole("list", { name: "Selected case studies" }).getByRole("link")).toHaveCount(3);
    await expect(page.getByRole("heading", { name: "Built to perform." })).toBeVisible();
    await expect(page.locator(".ruby-device-study img")).toHaveCount(2);
    await expect(page.locator('img:not([alt])')).toHaveCount(0);
    await expect(page.locator(".ruby-process-marker").first()).toHaveCSS("position", width >= 768 ? "sticky" : "static");
    await expect(page.locator(".ruby-process-step")).toHaveCount(4);
    await expect(page.getByRole("heading", { name: "What happens next" })).toBeVisible();
    await expect(page.getByRole("contentinfo").getByRole("navigation", { name: "Footer work" })).toBeVisible();

    await page.locator(".exhibition-feature-link").scrollIntoViewIfNeeded();
    const bounds = await page.evaluate(() => {
      const rect = selector => document.querySelector(selector).getBoundingClientRect();
      const marker = rect(".exhibition-destination");
      const title = document.querySelector(".exhibition-feature-caption strong");
      const linesUnclipped = [...document.querySelectorAll(".ruby-statement .ruby-line")].every(line => {
        const mask = line.getBoundingClientRect();
        const range = document.createRange();
        range.selectNodeContents(line.firstElementChild);
        const glyphs = range.getBoundingClientRect();
        return glyphs.left >= mask.left - 1 && glyphs.right <= mask.right + 1
          && glyphs.top >= mask.top - 1 && glyphs.bottom <= mask.bottom + 1;
      });
      return {
        linesUnclipped,
        width: document.documentElement.scrollWidth,
        markerStartsBelowImage: marker.top >= rect(".exhibition-image-stack").bottom,
        titleUnclipped: getComputedStyle(title).overflow === "visible" && title.scrollWidth <= title.clientWidth + 1,
        primaryOutsideVideo: rect(".film-primary").top >= rect(".film-stage").bottom,
      };
    });
    expect(bounds).toEqual({ width, linesUnclipped: true, markerStartsBelowImage: true, titleUnclipped: true, primaryOutsideVideo: true });
    const screenshotDir = process.env.AB_HOME_SCREENSHOTS;
    if (screenshotDir) {
      await page.evaluate(() => {
        for (const image of document.images) image.loading = "eager";
      });
      await expect.poll(() => page.locator("img").evaluateAll(images => images.every(image => image.complete && image.naturalWidth > 0))).toBe(true);
      await page.locator(".film-stage").scrollIntoViewIfNeeded();
      await page.locator(".film-player").screenshot({ path: join(screenshotDir, `${width}-film.png`), animations: "disabled" });
      await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
      await page.screenshot({ path: join(screenshotDir, `${width}-homepage.png`), fullPage: true, animations: "disabled", style: ".studio-enquiry, .studio-footer, .work-show, .studio-footer-main { content-visibility: visible !important }" });
    }
    expect(errors).toEqual([]);
  });
}

test("keyboard opens and exits navigation, selects projects, controls film, and preselects a service", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/", { waitUntil: "networkidle" });
  const menu = page.getByRole("button", { name: "Open navigation" });
  await menu.focus();
  await page.keyboard.press("Enter");
  const nav = page.getByRole("navigation", { name: "Primary navigation" });
  await expect(nav.getByRole("link", { name: "Work" })).toBeFocused();
  await expect(nav.getByRole("link", { name: "Film" })).toHaveAttribute("href", "#film");
  await expect(nav.getByRole("link", { name: "Studio" })).toHaveAttribute("href", "/studio");
  await page.keyboard.press("Escape");
  await expect(menu).toBeFocused();

  const next = page.getByRole("button", { name: "Next project" });
  await next.focus();
  await page.keyboard.press("Enter");
  await expect(page.locator(".exhibition-feature-link")).toHaveAttribute("href", "/work/milestone-renovate");
  const preview = page.locator(".exhibition-preview").first();
  await preview.focus();
  await page.keyboard.press("Space");
  await expect(page.locator(".exhibition-feature-link")).toHaveAttribute("href", "/work/aftab-sons-transport");

  const controls = page.getByRole("group", { name: "Film controls" });
  const play = controls.getByRole("button", { name: "Play the film" });
  await expect(play).toHaveCount(1);
  await expect(page.locator(".film-video")).toHaveCount(0);
  await play.focus();
  await page.keyboard.press("Enter");
  const pause = controls.getByRole("button", { name: "Pause", exact: true });
  await expect(pause).toBeFocused();
  await expect(page.locator(".film-video")).toHaveAttribute("src", /-720\.mp4$/);
  await page.keyboard.press("Space");
  await expect(controls.getByRole("button", { name: "Resume" })).toBeFocused();

  const pillar = page.locator("summary").filter({ hasText: "Software & connected systems" });
  await pillar.focus();
  await page.keyboard.press("Enter");
  const enquire = page.getByRole("link", { name: "Enquire about Custom Software & Business Systems", exact: true });
  await enquire.focus();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/contact\?service=custom-software-business-systems$/);
  await expect(page.getByRole("checkbox", { name: /Custom software/ })).toBeChecked();

  let submissions = 0;
  await page.route("**/api/contact", async route => {
    submissions++;
    expect(route.request().postDataJSON().services).toEqual(["Custom software & business systems"]);
    await route.fulfill({ status: 200, json: { ok: true } });
  });
  for (const [name, value] of [
    [/^Name$/, "Keyboard QA"],
    [/^Email$/, "keyboard@example.invalid"],
    [/Tell us about your project/, "Keyboard QA of the enquiry form. No email should be sent."],
  ]) {
    await page.getByRole("textbox", { name }).focus();
    await page.keyboard.insertText(value);
  }
  await page.getByRole("button", { name: "Send project enquiry" }).focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("status")).toContainText(/sent|thank|received/i);
  expect(submissions).toBe(1);
});

test("homepage metadata identifies the organisation and canonical public URL", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/AB Web Studio.*Web Design Studio in Sydney/);
  await expect(page.locator('meta[name="description"]')).toHaveAttribute("content", /Sydney/);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", "https://www.abwebstudio.com.au");
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute("content", /abwebstudio\.com\.au\/opengraph-image/);
  const graph = await page.locator('script[type="application/ld+json"]').evaluateAll(nodes =>
    nodes.map(node => JSON.parse(node.textContent)).flatMap(value => value["@graph"] ?? []));
  expect(graph).toEqual(expect.arrayContaining([expect.objectContaining({
    "@type": expect.arrayContaining(["Organization", "ProfessionalService"]),
    name: "AB Web Studio",
    address: expect.objectContaining({ addressLocality: "Sydney", addressCountry: "AU" }),
  })]));
});
