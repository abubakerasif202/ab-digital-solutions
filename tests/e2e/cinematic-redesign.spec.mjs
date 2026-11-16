import { expect, test } from "@playwright/test";
import { mkdir } from "node:fs/promises";

const evidence = process.env.QA_OUT || "outputs/cinematic-review";
const routes = ["/", "/work", "/services", "/about", "/contact", "/work/jufaja-homes", "/services/web-design-sydney"];
for (const width of [320, 375, 390, 768, 1440, 1920]) {
  test(`cinematic routes preserve layout and SEO at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: width < 768 ? 844 : 1000 });
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    for (const route of routes) {
      const response = await page.goto(route, { waitUntil: "networkidle" });
      expect(response.status(), route).toBe(200);
      await page.evaluate(() => document.fonts.ready);
      await expect(page.locator("h1")).toHaveCount(1);
      await expect(page.locator("h1")).toBeVisible();
      expect(await page.locator('link[rel="canonical"]').getAttribute("href")).toContain("abwebstudio.com.au");
      const bounds = await page.evaluate(() => ({ viewport: innerWidth, content: document.documentElement.scrollWidth }));
      expect(bounds.content, route).toBeLessThanOrEqual(bounds.viewport + 1);
      await page.locator("footer").scrollIntoViewIfNeeded();
      // A lazy image can expose its fallback src before the browser selects a
      // request. Decode selected sources; viewport-visible images must load too.
      await expect.poll(() => page.locator("img").evaluateAll(async (images) => {
        const results = await Promise.all(images.map(async (image) => {
          const rect = image.getBoundingClientRect();
          const visible = image.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true })
            && rect.width > 0 && rect.height > 0 && rect.bottom > 0 && rect.top < innerHeight
            && rect.right > 0 && rect.left < innerWidth;
          if (!image.currentSrc && !visible) return null;
          try {
            if (!visible) {
              // An offscreen responsive element may wait on a later lazy-load
              // candidate. Validate the exact already-selected bytes separately.
              const selected = new Image();
              selected.src = image.currentSrc;
              await selected.decode();
              return selected.naturalWidth > 0 ? null : { currentSrc: image.currentSrc, error: "selected source has no decoded pixels" };
            }
            await image.decode();
            return image.currentSrc && image.naturalWidth > 0 ? null : { src: image.src, currentSrc: image.currentSrc, error: "visible image has no decoded pixels" };
          } catch (error) {
            return { src: image.src, currentSrc: image.currentSrc, error: String(error) };
          }
        }));
        return results.filter(Boolean);
      }), { message: `${route}: selected images decode and visible images load` }).toEqual([]);
      if (route === "/") {
        await page.locator("#work-heading").scrollIntoViewIfNeeded();
        await expect(page.locator(".ruby-title")).toHaveText(/Digital experiences\.\s*Beyond ordinary\./);
        const contrast = await page.locator("#work-heading").evaluate((element) => {
          const rgb = value => value.match(/[\d.]+/g).slice(0, 3).map(Number);
          const luminance = channels => channels.map(channel => {
            const value = channel / 255;
            return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
          }).reduce((total, value, index) => total + value * [0.2126, 0.7152, 0.0722][index], 0);
          let ancestor = element;
          while (ancestor && getComputedStyle(ancestor).backgroundColor === "rgba(0, 0, 0, 0)") ancestor = ancestor.parentElement;
          const background = luminance(rgb(getComputedStyle(ancestor || document.body).backgroundColor));
          return Math.min(...[element, ...element.querySelectorAll("em")].map(text => {
            const foreground = luminance(rgb(getComputedStyle(text).color));
            return (Math.max(foreground, background) + 0.05) / (Math.min(foreground, background) + 0.05);
          }));
        });
        expect(contrast, "large exhibition heading and ruby accent contrast").toBeGreaterThanOrEqual(3);
        await mkdir(evidence, { recursive: true });
        await page.screenshot({ path: `${evidence}/${width}-selected-work.png` });
        await page.evaluate(() => scrollTo({ top: 0, behavior: "instant" }));
        await page.screenshot({ path: `${evidence}/${width}-home.png` });
      }
    }
    expect(errors).toEqual([]);
  });
}

test("cinematic motion plays by default, has no pause toggle and respects live reduced motion", async ({ page }) => {
  await page.goto("/", { waitUntil: "networkidle" });
  const video = page.locator(".cinema-media-video");
  await expect.poll(() => video.evaluate((element) => element.currentTime)).toBeGreaterThan(0);
  await expect(page.getByRole("button", { name: /background motion/i })).toHaveCount(0);
  await expect(page.locator(".cinema-media")).toHaveAttribute("data-playing", "true");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(video).not.toHaveAttribute("src");
  await expect(page.locator(".cinema-media")).toHaveAttribute("data-playing", "false");
  await page.getByRole("link", { name: "See the work", exact: true }).click();
  await expect(page).toHaveURL(/#work$/);
});

test("reduced-motion and Save-Data start poster-only; failed media retains a usable fallback", async ({ browser }) => {
  for (const mode of ["reduced", "save-data", "error"]) {
    const context = await browser.newContext({ reducedMotion: mode === "reduced" ? "reduce" : "no-preference" });
    const page = await context.newPage();
    if (mode === "save-data") await page.addInitScript(() => {
      Object.defineProperty(navigator, "connection", { configurable: true, value: Object.assign(new EventTarget(), { saveData: true, effectiveType: "4g" }) });
    });
    const downloads = [];
    page.on("request", (request) => { if (/sydney-ruby-v3.*\.(mp4|webm)/.test(request.url())) downloads.push(request.url()); });
    if (mode === "error") await page.route(/sydney-ruby-v3.*\.(mp4|webm)/, (route) => route.abort());
    await page.goto("/", { waitUntil: "networkidle" });
    await expect(page.locator(".cinema-media-poster img")).toBeVisible();
    if (mode === "error") {
      await expect(page.locator(".cinema-media")).toHaveAttribute("data-failed", "true");
      await expect(page.locator(".cinema-media-video")).not.toHaveAttribute("src");
      await expect(page.locator(".cinema-media")).toHaveAttribute("data-playing", "false");
    } else {
      expect(downloads).toEqual([]);
      await expect(page.locator(".cinema-media-video")).not.toHaveAttribute("src");
    }
    await page.getByRole("link", { name: "See the work", exact: true }).click();
    await expect(page).toHaveURL(/#work$/);
    await context.close();
  }
});

test("mobile menu preserves keyboard focus and homepage enquiries retain submission behavior", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/", { waitUntil: "networkidle" });
  const menu = page.getByRole("button", { name: "Open navigation" });
  await menu.click();
  await expect(page.getByRole("navigation", { name: "Primary navigation" })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(menu).toBeFocused();
  await expect(menu).toHaveAttribute("aria-expanded", "false");
  let submissions = 0;
  await page.route("**/api/contact", async (route) => {
    submissions++;
    expect(route.request().postDataJSON().services).toContain("Website design & development");
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true }) });
  });
  await page.locator("#contact").scrollIntoViewIfNeeded();
  await page.getByLabel("Name").fill("Cinematic QA");
  await page.getByLabel("Email").fill("qa@example.invalid");
  await page.getByLabel(/Tell us about your project/).fill("Automated browser validation. No real email is sent.");
  await page.getByRole("button", { name: "Send project enquiry", exact: true }).click();
  await expect(page.getByRole("status")).toContainText(/sent|thank|received/i);
  expect(submissions).toBe(1);
});
