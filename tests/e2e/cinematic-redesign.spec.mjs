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
        // The transformed wall's tiles are clipped by their container. A viewport
        // rectangle alone can mistake a clipped lazy tile for a visible image.
        const visibleImages = await new Promise(resolve => {
          if (images.length === 0) return resolve(new Set());
          const visible = new Set();
          const pending = new Set(images);
          const observer = new IntersectionObserver(entries => {
            for (const entry of entries) {
              if (entry.isIntersecting && entry.intersectionRatio > 0) visible.add(entry.target);
              pending.delete(entry.target);
            }
            if (pending.size === 0) {
              observer.disconnect();
              resolve(visible);
            }
          });
          images.forEach(image => observer.observe(image));
        });
        const results = await Promise.all(images.map(async (image) => {
          const visible = visibleImages.has(image) && image.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true });
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
        await expect(page.locator("#hero-heading")).toHaveText("Websites built for real businesses.");
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
        expect(contrast, "Selected work heading contrast").toBeGreaterThanOrEqual(3);
        await mkdir(evidence, { recursive: true });
        await page.screenshot({ path: `${evidence}/${width}-selected-work.png` });
        await page.evaluate(() => scrollTo({ top: 0, behavior: "instant" }));
        await page.screenshot({ path: `${evidence}/${width}-home.png` });
      }
    }
    expect(errors).toEqual([]);
  });
}

test("the project wall moves, supports keyboard pause and respects live reduced motion", async ({ page }) => {
  await page.goto("/");
  const column = page.locator(".work-wall-column").first();
  const pause = page.getByRole("button", { name: "Pause project wall" });
  await expect(column).toHaveCSS("animation-play-state", "running");
  await expect(column).toHaveCSS("animation-name", "work-wall-rise");
  await pause.focus();
  await pause.press("Space");
  await expect(pause).toBeFocused();
  await expect(pause).toHaveAttribute("aria-pressed", "true");
  await expect(column).toHaveCSS("animation-play-state", "paused");
  await pause.press("Space");
  await expect(column).toHaveCSS("animation-play-state", "running");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(column).toHaveCSS("animation-name", "none");
  await expect(pause).toBeHidden();
  await page.getByRole("link", { name: "See our work", exact: true }).click();
  await expect(page).toHaveURL(/#work$/);
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
  await page.locator(".home-hero").getByRole("link", { name: "Start a project" }).click();
  await expect(page).toHaveURL(/#contact$/);
  await expect(page.locator('input[name="service"]:checked')).toHaveCount(0);
  await page.getByRole("radio", { name: "Website", exact: true }).check();
  await page.getByLabel("Name").fill("Cinematic QA");
  await page.getByLabel("Email").fill("qa@example.invalid");
  await page.getByLabel(/Project details/).fill("Automated browser validation. No real email is sent.");
  await page.getByRole("button", { name: "Send project enquiry", exact: true }).click();
  await expect(page.getByRole("status")).toContainText(/sent|thank|received/i);
  expect(submissions).toBe(1);
});
