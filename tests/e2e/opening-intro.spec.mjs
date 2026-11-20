import { expect, test } from "@playwright/test";
import { mkdirSync } from "node:fs";

// The intro declines for automation (webdriver, HeadlessChrome) and slow connections by design, so these
// tests present as a real browser on a fast connection.
const asRealBrowser = (page) => page.addInitScript(() => {
  const agent = Object.getOwnPropertyDescriptor(Navigator.prototype, "userAgent").get.call(navigator).replace("HeadlessChrome", "Chrome");
  Object.defineProperty(Navigator.prototype, "webdriver", { get: () => false });
  Object.defineProperty(Navigator.prototype, "userAgent", { get: () => agent });
  Object.defineProperty(Navigator.prototype, "connection", { get: () => ({ effectiveType: "4g", downlink: 10, saveData: false, addEventListener() {}, removeEventListener() {} }) });
});
const shots = process.env.QA_SHOTS;
if (shots) mkdirSync(shots, { recursive: true });
const overlay = (page) => page.locator("#opening-intro");
const hero = (page) => page.getByRole("heading", { level: 1 }).first();

function track(page) {
  const introRequests = [];
  const problems = [];
  page.on("request", (request) => { if (new URL(request.url()).pathname.startsWith("/intro/")) introRequests.push(new URL(request.url()).pathname); });
  // The Vercel-hosted Speed Insights script does not exist on a local server; that 404 is environmental.
  page.on("response", (response) => { const { pathname } = new URL(response.url()); if (response.status() >= 400 && !pathname.startsWith("/_vercel/")) problems.push(`${response.status()} ${pathname}`); });
  page.on("console", (message) => { if (["error", "warning"].includes(message.type()) && !/Failed to load resource|_vercel\/speed-insights/.test(message.text())) problems.push(message.text()); });
  page.on("pageerror", (error) => problems.push(error.message));
  return { introRequests, problems };
}

test("first visit plays the intro, then reveals the server-rendered hero; console is clean", async ({ page }, info) => {
  await asRealBrowser(page);
  const seen = track(page);
  await page.goto("/");
  await expect(overlay(page)).toBeVisible({ timeout: 8000 });
  await expect(page.locator("html")).toHaveAttribute("data-opening-intro", "on");
  await expect(page.getByRole("button", { name: "Skip intro" })).toBeFocused();
  expect(await page.evaluate(() => getComputedStyle(document.documentElement).overflow)).toBe("hidden");
  await expect.poll(() => page.locator("video").evaluate((v) => v.currentTime), { timeout: 5000 }).toBeGreaterThan(0.3);
  await page.waitForTimeout(1200);
  if (shots) await page.screenshot({ path: `${shots}/intro-midplay-${info.project.name}-${page.viewportSize().width}.png` });
  await expect(overlay(page)).toHaveCount(0, { timeout: 9000 });
  await expect(page.locator("html")).not.toHaveAttribute("data-opening-intro", /.*/);
  await expect(hero(page)).toBeVisible();
  expect(await page.evaluate(() => getComputedStyle(document.documentElement).overflow)).not.toBe("hidden");
  if (shots) await page.screenshot({ path: `${shots}/intro-after-${info.project.name}-${page.viewportSize().width}.png` });
  const mobile = page.viewportSize().width < 768;
  expect(seen.introRequests.some((p) => p.includes(mobile ? "ab-intro-mobile" : "ab-intro-1280"))).toBe(true);
  expect(seen.introRequests.some((p) => p.includes(mobile ? "ab-intro-1280" : "ab-intro-mobile"))).toBe(false);
  expect(seen.problems, seen.problems.join("\n")).toEqual([]);
});

test("a second visit in the same session shows no intro and fetches no video", async ({ page }) => {
  await asRealBrowser(page);
  await page.goto("/");
  await page.getByRole("button", { name: "Skip intro" }).click();
  await expect(overlay(page)).toHaveCount(0);
  const seen = track(page);
  await page.goto("/about");
  await page.goto("/");
  await page.waitForTimeout(1500);
  await expect(overlay(page)).toHaveCount(0);
  await expect(hero(page)).toBeVisible();
  expect(seen.introRequests).toEqual([]);
});

test("reduced motion never plays the video and never covers the page", async ({ page }) => {
  await asRealBrowser(page);
  await page.emulateMedia({ reducedMotion: "reduce" });
  const seen = track(page);
  await page.goto("/");
  await page.waitForTimeout(1500);
  await expect(overlay(page)).toHaveCount(0);
  await expect(hero(page)).toBeVisible();
  expect(seen.introRequests).toEqual([]);
  expect(await page.evaluate(() => getComputedStyle(document.querySelector(".opening-intro-shade")).display)).toBe("none");
});

test("Skip is keyboard-operable, restores scroll and focus", async ({ page }) => {
  await asRealBrowser(page);
  await page.goto("/");
  const skip = page.getByRole("button", { name: "Skip intro" });
  await expect(skip).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(overlay(page)).toHaveCount(0, { timeout: 3000 });
  expect(await page.evaluate(() => getComputedStyle(document.documentElement).overflow)).not.toBe("hidden");
  // The site header keeps its own `inert` on a closed menu; only what the intro made inert must be released.
  expect(await page.evaluate(() => [document.querySelector("main"), document.querySelector("header")].filter((el) => el?.closest("[inert]")).length)).toBe(0);
  expect(await page.evaluate(() => document.activeElement?.id)).toBe("main-content");
  await page.mouse.wheel(0, 600);
  await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(100);
});

test("Escape skips the intro", async ({ page }) => {
  await asRealBrowser(page);
  await page.goto("/");
  await expect(overlay(page)).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(overlay(page)).toHaveCount(0, { timeout: 3000 });
  await expect(hero(page)).toBeVisible();
});

test("a blocked video request skips the intro quickly and the page is never stuck", async ({ page }) => {
  await asRealBrowser(page);
  await page.route("**/intro/*.{webm,mp4}", (route) => route.abort());
  await page.goto("/");
  const started = Date.now();
  await expect(overlay(page)).toHaveCount(0, { timeout: 4000 });
  expect(Date.now() - started).toBeLessThan(3500);
  await expect(page.locator("html")).not.toHaveAttribute("data-opening-intro", /.*/);
  await expect(hero(page)).toBeVisible();
});

test("a video that never responds is skipped within the safety limits", async ({ page }) => {
  await asRealBrowser(page);
  await page.route("**/intro/*.{webm,mp4}", () => { /* hang forever */ });
  await page.goto("/");
  const started = Date.now();
  await expect(overlay(page)).toHaveCount(0, { timeout: 6000 });
  expect(Date.now() - started).toBeLessThan(4500);
});

test("automation, other routes and back/forward navigation never see the intro", async ({ page, browser }) => {
  // Default Playwright presents navigator.webdriver = true: the Lighthouse-style case.
  const automated = track(page);
  await page.goto("/");
  await page.waitForTimeout(1200);
  await expect(overlay(page)).toHaveCount(0);
  expect(automated.introRequests).toEqual([]);

  const context = await browser.newContext();
  const real = await context.newPage();
  await asRealBrowser(real);
  const seen = track(real);
  for (const route of ["/work", "/studio", "/about", "/services"]) {
    await real.goto(route);
    await real.waitForTimeout(500);
    await expect(overlay(real)).toHaveCount(0);
  }
  expect(seen.introRequests).toEqual([]);
  // A normal navigation to "/" in a fresh session plays once...
  await real.goto("/");
  await expect(overlay(real)).toBeVisible();
  await real.getByRole("button", { name: "Skip intro" }).click();
  await expect(overlay(real)).toHaveCount(0);
  // ...but returning with the back button never replays it, even with the session flag cleared.
  await real.evaluate(() => sessionStorage.removeItem("ab-opening-intro-seen"));
  await real.goto("/about");
  await real.goBack();
  await real.waitForTimeout(1500);
  await expect(overlay(real)).toHaveCount(0);
  await context.close();
});
