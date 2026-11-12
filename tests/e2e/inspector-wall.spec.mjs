import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    window.__wallDraws = 0;
    const draw = WebGL2RenderingContext.prototype.drawElementsInstanced;
    WebGL2RenderingContext.prototype.drawElementsInstanced = function (...args) {
      if (this.canvas.classList.contains("hx-canvas")) window.__wallDraws++;
      return draw.apply(this, args);
    };
  });
});

test("fallback imagery follows the selected project without WebGL", async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "connection", { value: { saveData: true }, configurable: true });
  });
  await page.goto("/");
  const poster = page.locator(".hx-poster img");
  const initial = await poster.getAttribute("src");
  const second = page.getByRole("group", { name: "Featured projects" }).getByRole("button").nth(1);
  await second.click();
  await expect(second).toHaveAttribute("aria-pressed", "true");
  await expect(poster).not.toHaveAttribute("src", initial);
});

test("wall motion can be paused and reduced-motion preferences update live", async ({ page }) => {
  await page.goto("/");
  const toggle = page.getByRole("button", { name: "Pause portfolio motion" });
  await toggle.click();
  await expect(page.getByRole("button", { name: "Resume portfolio motion" })).toBeVisible();
  const selected = page.locator(".hx-pip[aria-pressed='true']");
  const label = await selected.getAttribute("aria-label");
  await page.waitForTimeout(7000);
  await expect(selected).toHaveAttribute("aria-label", label);
  const draws = await page.evaluate(() => window.__wallDraws);
  expect(draws).toBeGreaterThan(0);
  await page.waitForTimeout(500);
  expect(await page.evaluate(() => window.__wallDraws)).toBe(draws);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(page.locator(".hx-stage")).toHaveAttribute("data-motion", "reduced");
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await expect(page.locator(".hx-stage")).toHaveAttribute("data-motion", "paused");
});

test("the work composition removes hidden hero controls from keyboard focus", async ({ page }) => {
  await page.goto("/");
  await page.locator("#work").evaluate((element) => element.scrollIntoView({ block: "start" }));
  await expect(page.locator(".hx-stage")).toHaveAttribute("data-mode", "work");
  const acceptsHiddenFocus = await page.locator(".hx-motion").evaluate((button) => {
    button.focus({ preventScroll: true });
    return document.activeElement === button;
  });
  expect(acceptsHiddenFocus).toBe(false);
  await page.locator(".hx-stage").evaluate((stage) => {
    const before = document.createElement("button");
    before.textContent = "Keyboard test starting point";
    stage.before(before);
    before.focus({ preventScroll: true });
  });
  await page.keyboard.press("Tab");
  expect(await page.evaluate(() => !!document.activeElement?.closest(".hx-hud"))).toBe(false);
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
  await expect(page.locator(".hx-stage")).toHaveAttribute("data-mode", "hero");
  await expect(page.locator(".hx-motion")).toBeVisible();
  await page.locator(".hx-motion").focus();
  await expect(page.locator(".hx-motion")).toBeFocused();
});

test("a lost WebGL context restores the current project and survives navigation", async ({ page }) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await expect(page.locator(".hx-stage")).toHaveAttribute("data-ready", "true", { timeout: 30000 });
  const supported = await page.evaluate(() => {
    const canvas = document.querySelector(".hx-canvas");
    const extension = canvas.getContext("webgl2")?.getExtension("WEBGL_lose_context");
    if (!extension) return false;
    window.__wallContextExtension = extension;
    extension.loseContext();
    return true;
  });
  test.skip(!supported, "Browser does not expose WEBGL_lose_context");
  await expect(page.locator(".hx-stage")).toHaveAttribute("data-failed", "true");
  await page.evaluate(() => window.__wallContextExtension.restoreContext());
  await expect(page.locator(".hx-stage")).toHaveAttribute("data-ready", "true", { timeout: 30000 });
  await expect(page.locator(".hx-stage")).toHaveAttribute("data-failed", "false");
  await page.locator('.hx-assure a[href="/work"]').click();
  await expect(page).toHaveURL(/\/work$/);
  await expect(page.locator(".hx-stage")).toHaveCount(0);
  // Route transitions remove DOM before passive effect cleanup. Observe the
  // settled destination, then verify no ongoing rendering survives unmount.
  await page.waitForLoadState("networkidle");
  const draws = await page.evaluate(() => window.__wallDraws);
  await page.waitForTimeout(1700);
  expect(await page.evaluate(() => window.__wallDraws)).toBe(draws);
  await page.goBack();
  await expect(page.locator(".hx-stage")).toHaveAttribute("data-ready", "true", { timeout: 30000 });
  expect(errors).toEqual([]);
});
