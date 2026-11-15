import { expect, test } from "@playwright/test";

const section = (page) => page.locator(".exhibition");
async function enterExhibition(page) {
  await page.goto("/", { waitUntil: "networkidle" });
  await section(page).scrollIntoViewIfNeeded();
  await page.mouse.move(0, 0);
}

test("the exhibition advances automatically and hover and keyboard focus hold the active destination", async ({ page }) => {
  await enterExhibition(page);
  await expect(section(page)).toHaveAttribute("data-running", "true");
  const initial = await section(page).getAttribute("data-project");
  await expect.poll(() => section(page).getAttribute("data-project"), { timeout: 12000 }).not.toBe(initial);
  await page.locator(".exhibition-feature-link").hover();
  await expect(section(page)).toHaveAttribute("data-running", "false");
  const hovered = await section(page).getAttribute("data-project");
  await page.waitForTimeout(7600);
  await expect(section(page)).toHaveAttribute("data-project", hovered);
  await page.mouse.move(0, 0);
  const featured = page.locator(".exhibition-feature-link");
  await featured.focus();
  await featured.press("Tab");
  await expect(section(page)).toHaveAttribute("data-running", "false");
  const href = await featured.getAttribute("href");
  await page.waitForTimeout(7600);
  await expect(featured).toHaveAttribute("href", href);
  expect(href).toMatch(/^\/work\/[a-z0-9-]+$/);
});

test("resting over a non-interactive section area does not stall the living composition", async ({ page }) => {
  await enterExhibition(page);
  await page.locator(".exhibition-topline").hover();
  await expect(section(page)).toHaveAttribute("data-running", "true");
  const initial = await section(page).getAttribute("data-project");
  await expect.poll(() => section(page).getAttribute("data-project"), { timeout: 12000 }).not.toBe(initial);
  await expect(section(page)).toHaveAttribute("data-composition", "b");
});

test("mouse control clicks do not leave a permanent focus pause and compositions cycle predictably", async ({ page }) => {
  await enterExhibition(page);
  for (const composition of ["b", "c", "a"]) {
    await page.getByRole("button", { name: "Next project", exact: true }).click();
    await expect(section(page)).toHaveAttribute("data-composition", composition);
  }
  await page.mouse.move(0, 0);
  await expect(section(page)).toHaveAttribute("data-running", "true");
});

test("stalled requests cannot show an outgoing project beneath the new project identity", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.route((url) => url.pathname === "/_next/image" || /\/assets\/ab-portfolio-/.test(url.pathname), () => new Promise(() => {}));
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await section(page).scrollIntoViewIfNeeded();
  await page.getByRole("button", { name: "Next project", exact: true }).click();
  await expect(section(page)).toHaveAttribute("data-image-state", "loading");
  await expect(page.locator(".exhibition-image--previous")).toHaveCount(0);
  await expect(page.locator(".exhibition-image-loading")).toContainText("Loading project preview");
  await expect(section(page)).toHaveAttribute("data-image-state", "failed", { timeout: 11000 });
  await expect(page.locator(".exhibition-image--previous")).toHaveCount(0);
  const current = await section(page).getAttribute("data-project");
  await expect(page.locator(".exhibition-feature-link")).toHaveAttribute("href", `/work/${current}`);
});

test("mobile horizontal swipe changes a project without claiming vertical scroll", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 844 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await enterExhibition(page);
  const frame = page.locator(".exhibition-feature");
  const initial = await section(page).getAttribute("data-project");
  await frame.dispatchEvent("pointerdown", { pointerType: "touch", clientX: 260, clientY: 200 });
  await frame.dispatchEvent("pointerup", { pointerType: "touch", clientX: 160, clientY: 210 });
  await expect(section(page)).not.toHaveAttribute("data-project", initial);
  const afterSwipe = await section(page).getAttribute("data-project");
  await frame.dispatchEvent("pointerdown", { pointerType: "touch", clientX: 200, clientY: 180 });
  await frame.dispatchEvent("pointerup", { pointerType: "touch", clientX: 215, clientY: 340 });
  await expect(section(page)).toHaveAttribute("data-project", afterSwipe);
});

test("manual controls work from keyboard and explicit pause persists after reload", async ({ page }) => {
  await enterExhibition(page);
  await expect(page.getByRole("button", { name: "Previous project", exact: true })).toBeDisabled();
  const next = page.getByRole("button", { name: "Next project", exact: true });
  await next.focus();
  const initial = await section(page).getAttribute("data-project");
  await next.press("Enter");
  await expect(section(page)).not.toHaveAttribute("data-project", initial);
  await expect(page.getByRole("button", { name: "Previous project", exact: true })).toBeEnabled();
  await page.getByRole("button", { name: "Previous project", exact: true }).click();
  await expect(section(page)).toHaveAttribute("data-project", initial);
  await expect(page.getByRole("button", { name: "Previous project", exact: true })).toBeDisabled();
  await page.getByRole("button", { name: "Pause automatic project motion", exact: true }).click();
  await expect(page.getByRole("button", { name: "Resume automatic project motion", exact: true })).toHaveAttribute("aria-pressed", "true");
  await page.reload({ waitUntil: "networkidle" });
  await section(page).scrollIntoViewIfNeeded();
  await expect(page.getByRole("button", { name: "Resume automatic project motion", exact: true })).toHaveAttribute("aria-pressed", "true");
  await page.mouse.move(0, 0);
  await expect(section(page)).toHaveAttribute("data-running", "false");
});

test("failed foreground requests remove stale artwork while keeping the accurate case-study destination", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.route((url) => url.pathname === "/_next/image" || /\/assets\/ab-portfolio-/.test(url.pathname), (route) => route.abort());
  await enterExhibition(page);
  const first = await section(page).getAttribute("data-project");
  await page.getByRole("button", { name: "Next project", exact: true }).click();
  await expect(section(page)).not.toHaveAttribute("data-project", first);
  await expect(section(page)).toHaveAttribute("data-image-failed", "true");
  await expect(page.locator(".exhibition-image--previous")).toHaveCount(0);
  await expect(page.locator(".exhibition-image-stack img")).toHaveCount(0);
  await expect(page.locator(".exhibition-image-fallback")).toContainText("Project preview unavailable");
  const current = await section(page).getAttribute("data-project");
  await expect(page.locator(".exhibition-feature-link")).toHaveAttribute("href", `/work/${current}`);
});

test("offscreen and live reduced-motion preferences stop automatic changes", async ({ page }) => {
  await enterExhibition(page);
  await expect(section(page)).toHaveAttribute("data-running", "true");
  await page.locator("h1").scrollIntoViewIfNeeded();
  await expect(section(page)).toHaveAttribute("data-running", "false");
  await section(page).scrollIntoViewIfNeeded();
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(section(page)).toHaveAttribute("data-running", "false");
  await expect(page.getByRole("button", { name: "Automatic project motion disabled by your preferences", exact: true })).toBeDisabled();
  const before = await section(page).getAttribute("data-project");
  await page.getByRole("button", { name: "Next project", exact: true }).click();
  await expect(section(page)).not.toHaveAttribute("data-project", before);
});

test("page visibility events stop the timer without losing the featured project", async ({ page }) => {
  await enterExhibition(page);
  await expect(section(page)).toHaveAttribute("data-running", "true");
  await page.evaluate(() => {
    Object.defineProperty(document, "hidden", { configurable: true, get: () => true });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await expect(section(page)).toHaveAttribute("data-running", "false");
  const current = await section(page).getAttribute("data-project");
  await page.waitForTimeout(7600);
  await expect(section(page)).toHaveAttribute("data-project", current);
});

test("Save-Data starts in manual browsing without a heavy render surface", async ({ page }) => {
  await page.addInitScript(() => Object.defineProperty(navigator, "connection", { configurable: true, value: Object.assign(new EventTarget(), { saveData: true }) }));
  await enterExhibition(page);
  await expect(section(page)).toHaveAttribute("data-running", "false");
  await expect(page.getByRole("button", { name: "Automatic project motion disabled by your preferences", exact: true })).toBeDisabled();
  await expect(section(page).locator("canvas,video")).toHaveCount(0);
  expect(await section(page).locator("img").count()).toBeLessThanOrEqual(10);
});

test("1920px normal-motion compositions keep Next above the actual hit-test surface", async ({ page }) => {
  await page.setViewportSize({ width: 1920, height: 1200 });
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await enterExhibition(page);
  await expect(page.locator(".exhibition-pause")).toHaveCount(0);
  // Hovering holds the show still, as the pause button used to.
  await page.locator(".exhibition-stage").hover();
  for (const composition of ["a", "b", "c"]) {
    await expect(section(page)).toHaveAttribute("data-composition", composition);
    await expect.poll(() => page.locator(".exhibition-feature").evaluate((element) => element.getAnimations().every((animation) => animation.playState !== "running"))).toBe(true);
    const geometry = await page.evaluate(() => ({ feature: document.querySelector(".exhibition-feature").getBoundingClientRect().bottom, controls: document.querySelector(".exhibition-footer").getBoundingClientRect().top }));
    expect(geometry.feature).toBeLessThanOrEqual(geometry.controls);
    for (const control of [page.getByRole("button", { name: "Next project", exact: true })]) {
      await control.scrollIntoViewIfNeeded();
      expect(await control.evaluate((element) => {
        const rect = element.getBoundingClientRect();
        return element.contains(document.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2));
      })).toBe(true);
    }
    if (composition !== "c") await page.getByRole("button", { name: "Next project", exact: true }).click();
  }
});

for (const width of [320, 375, 768, 1440]) {
  test(`exhibition is composed and operable at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: width < 768 ? 844 : 1000 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await enterExhibition(page);
    await expect(page.locator("#work-heading")).toBeVisible();
    await expect(page.locator(".exhibition-feature-link")).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width + 1);
    for (const name of ["Previous project", "Next project"]) {
      const control = page.getByRole("button", { name, exact: true });
      const rect = await control.boundingBox();
      expect(rect.width).toBeGreaterThanOrEqual(44);
      expect(rect.height).toBeGreaterThanOrEqual(44);
    }
    const preview = page.locator(".exhibition-preview").first();
    await preview.click();
    const slug = await section(page).getAttribute("data-project");
    await expect(page.locator(".exhibition-feature-link")).toHaveAttribute("href", `/work/${slug}`);
    await expect.poll(() => section(page).locator("img").evaluateAll((images) => images.filter((image) => image.complete && image.naturalWidth === 0).length)).toBe(0);
  });
}
