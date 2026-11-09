// Behavioural and layout checks for the standalone luxury-homepage prototype.
// Self-contained: starts its own static server, so no Next.js server is needed.
//   npx playwright test tests/e2e/luxury-homepage.spec.mjs
import { test, expect } from "@playwright/test";
import { startServer } from "../../scripts/serve-luxury-prototype.mjs";

const viewports = [
  { name: "mobile-compact", width: 360, height: 800 },
  { name: "mobile-standard", width: 390, height: 844 },
  { name: "tablet-portrait", width: 820, height: 1180 },
  { name: "desktop", width: 1440, height: 900 },
  { name: "wide", width: 1920, height: 1080 },
];
const VALID = { fullName: "Jordan Example", email: "jordan@example.com", message: "I need a new website for my business." };

let server;
let base;
test.beforeAll(async () => {
  ({ server, url: base } = await startServer());
});
test.afterAll(() => new Promise((resolve) => server.close(resolve)));

async function open(page, size = { width: 1440, height: 900 }) {
  await page.setViewportSize({ width: size.width, height: size.height });
  const errors = [];
  page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto(`${base}/`);
  await expect(page.locator("#projects .project")).not.toHaveCount(0);
  return errors;
}

async function scrollThrough(page) {
  await page.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += window.innerHeight * 0.8) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 60));
    }
    window.scrollTo(0, 0);
  });
}

async function fillValid(page) {
  await page.fill("#fullName", VALID.fullName);
  await page.fill("#email", VALID.email);
  await page.selectOption("#service", { index: 1 });
  await page.fill("#message", VALID.message);
}

for (const size of viewports) {
  test(`${size.name} ${size.width}x${size.height}: no horizontal overflow, no console errors, images load`, async ({ page }) => {
    const errors = await open(page, size);
    await page.locator("#showAll").click();
    await scrollThrough(page);
    const metrics = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
      // The dialog image has no src until a project is opened.
      broken: [...document.images].filter((img) => img.getAttribute("src") && img.complete && img.naturalWidth === 0).map((img) => img.src),
    }));
    expect(metrics.scrollWidth).toBeLessThanOrEqual(metrics.clientWidth);
    expect(metrics.broken).toEqual([]);
    expect(errors).toEqual([]);
  });
}

test("content: real contact details and profiles, no prototype or placeholder copy", async ({ page }) => {
  await open(page);
  const text = await page.locator("body").innerText();
  expect(text).not.toMatch(/example-abwebstudio|placeholder|prototype|not live|to be confirmed|rendered in CSS|within one business day|Astro|WCAG 2\.2/i);
  await expect(page.locator("#contactEmail")).toHaveAttribute("href", "mailto:enquiry@abwebstudio.com.au");
  await expect(page.locator("#contactPhone")).toHaveAttribute("href", "tel:+61423332037");
  const profiles = await page.locator("#social a").evaluateAll((links) => links.map((a) => ({ href: a.href, rel: a.rel, target: a.target })));
  expect(profiles).toHaveLength(4);
  for (const profile of profiles) {
    expect(profile.href).toMatch(/^https:\/\//);
    expect(profile.rel).toContain("noopener");
    expect(profile.target).toBe("_blank");
  }
});

test("structure: one h1, ordered headings, landmarks, unique ids, labelled controls", async ({ page }) => {
  await open(page);
  const report = await page.evaluate(() => {
    const levels = [...document.querySelectorAll("h1,h2,h3,h4")].map((h) => Number(h.tagName[1]));
    const skips = levels.filter((l, i) => i > 0 && l - levels[i - 1] > 1);
    const ids = [...document.querySelectorAll("[id]")].map((e) => e.id);
    const unlabelled = [...document.querySelectorAll("button, input:not([type=hidden]):not(#company), select, textarea")]
      .filter((el) => !(el.getAttribute("aria-label") || el.textContent.trim() || (el.id && document.querySelector(`label[for="${el.id}"]`))))
      .map((el) => el.outerHTML.slice(0, 80));
    const noAlt = [...document.images].filter((img) => !img.hasAttribute("alt")).length;
    return {
      h1: document.querySelectorAll("h1").length, skips, main: document.querySelectorAll("main").length,
      dupes: ids.filter((id, i) => ids.indexOf(id) !== i), unlabelled, noAlt,
      lang: document.documentElement.lang,
      navs: [...document.querySelectorAll("nav")].every((n) => n.hasAttribute("aria-label")),
    };
  });
  expect(report).toMatchObject({ h1: 1, skips: [], main: 1, dupes: [], unlabelled: [], noAlt: 0, lang: "en-AU", navs: true });
});

test("projects: filters, counts and show-all follow the registry", async ({ page }) => {
  await open(page);
  await expect(page.locator("#projects .project")).toHaveCount(6);
  await expect(page.locator("#showAll")).toHaveText("Show all 19 projects");
  await page.locator("#showAll").click();
  await expect(page.locator("#projects .project")).toHaveCount(19);
  const chip = page.locator('#filters .chip[data-filter="Removals"]');
  await chip.click();
  await expect(page.locator("#projects .project")).toHaveCount(3);
  await expect(chip).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator("#resultStatus")).toContainText("Showing 3 projects in Removals");
  await expect(page.locator("#showAll")).toBeHidden();
});

test("dialog: opens on the close button, Escape closes, focus returns, enquire prefills", async ({ page }) => {
  await open(page);
  const trigger = page.locator(".project-btn").first();
  await trigger.click();
  await expect(page.locator("#dlg")).toBeVisible();
  await expect(page.locator("#dlgClose")).toBeFocused();
  await expect(page.locator("#dlgImg")).toHaveAttribute("alt", /.{20,}/);
  await page.keyboard.press("Escape");
  await expect(page.locator("#dlg")).toBeHidden();
  await expect(trigger).toBeFocused();
  await trigger.click();
  await page.locator("#dlgEnquire").click();
  await expect(page.locator("#message")).toHaveValue(/I would like something similar to/);
  await expect(page.locator("#fullName")).toBeFocused();
});

test("mobile menu: toggles, labels update, Escape closes and returns focus", async ({ page }) => {
  await open(page, { width: 390, height: 844 });
  const button = page.locator("#menuBtn");
  await expect(button).toBeVisible();
  await expect(page.locator("#navLinks")).toBeHidden();
  await button.click();
  await expect(button).toHaveAttribute("aria-expanded", "true");
  await expect(button).toHaveAttribute("aria-label", "Close menu");
  await expect(page.locator("#navLinks a").first()).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(button).toHaveAttribute("aria-expanded", "false");
  await expect(button).toBeFocused();
});

test("form: empty submit shows a focused error summary with linked, aria-invalid fields", async ({ page }) => {
  await open(page);
  await page.locator("#submitBtn").click();
  await expect(page.locator("#errSummary")).toBeVisible();
  await expect(page.locator("#errSummary")).toBeFocused();
  await expect(page.locator("#errSummary a")).toHaveCount(4);
  for (const id of ["fullName", "email", "service", "message"]) await expect(page.locator(`#${id}`)).toHaveAttribute("aria-invalid", "true");
  await page.locator("#errSummary a").first().click();
  await expect(page.locator("#fullName")).toBeFocused();
});

test("form: posts the live /api/contact contract and reports success only after a 200", async ({ page }) => {
  await open(page);
  let body;
  await page.route("**/api/contact", async (route) => {
    body = route.request().postDataJSON();
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true }) });
  });
  await fillValid(page);
  await page.locator("#submitBtn").click();
  await expect(page.locator("#success")).toContainText("Your enquiry has been sent");
  expect(body).toMatchObject({ fullName: VALID.fullName, email: VALID.email, message: VALID.message, company: "" });
  expect(body.services).toHaveLength(1);
  expect(body.submissionId).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
  const options = await page.locator("#service option:not([disabled])").allTextContents();
  expect(options).toContain(body.services[0]);
  await expect(page.locator("#fullName")).toHaveValue("");
});

test("form: a failed or unavailable send is never reported as success", async ({ page }) => {
  await open(page);
  await fillValid(page);
  // Unmocked: the prototype server answers like a preview deployment (503).
  await page.locator("#submitBtn").click();
  await expect(page.locator("#formError")).toContainText("Nothing was sent");
  await expect(page.locator("#success")).toBeHidden();
  await expect(page.locator("#fullName")).toHaveValue(VALID.fullName);
  await page.route("**/api/contact", (route) => route.abort());
  await page.locator("#submitBtn").click();
  await expect(page.locator("#formError")).toContainText("enquiry@abwebstudio.com.au");
  await expect(page.locator("#success")).toBeHidden();
});

test("keyboard: skip link is first, moves focus to main, and focus rings are visible", async ({ page }) => {
  await open(page);
  await page.keyboard.press("Tab");
  await expect(page.locator(".skip")).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.locator("#main")).toBeFocused();
  await page.locator("#main").evaluate((el) => el.blur());
  const rings = [];
  for (let i = 0; i < 8; i += 1) {
    await page.keyboard.press("Tab");
    rings.push(await page.evaluate(() => {
      const el = document.activeElement;
      const style = getComputedStyle(el);
      return { tag: el.tagName, shadow: style.boxShadow, outline: style.outlineStyle };
    }));
  }
  for (const ring of rings) expect(ring.shadow !== "none" || ring.outline !== "none").toBe(true);
});

test("reduced motion: content is visible immediately and the monogram does not animate", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await open(page);
  const opacities = await page.locator(".reveal").evaluateAll((els) => els.map((el) => getComputedStyle(el).opacity));
  expect(opacities.every((value) => value === "1")).toBe(true);
  await page.mouse.move(100, 100);
  await page.waitForTimeout(300);
  expect(await page.locator("#monogram").evaluate((el) => el.style.getPropertyValue("--ry"))).toBe("");
});

test("without JavaScript the headline, copy and contact route stay visible", async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto(`${base}/`);
  await expect(page.locator("h1")).toBeVisible();
  const opacities = await page.locator(".reveal").evaluateAll((els) => els.map((el) => getComputedStyle(el).opacity));
  expect(opacities.every((value) => value === "1")).toBe(true);
  await expect(page.locator("noscript a")).toHaveAttribute("href", "mailto:enquiry@abwebstudio.com.au");
  await context.close();
});

test("performance budget: first load weight and layout stability", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  let bytes = 0;
  page.on("response", async (response) => { bytes += Number(response.headers()["content-length"] ?? 0); });
  await page.addInitScript(() => {
    window.__cls = 0;
    new PerformanceObserver((list) => { for (const e of list.getEntries()) if (!e.hadRecentInput) window.__cls += e.value; }).observe({ type: "layout-shift", buffered: true });
  });
  await page.goto(`${base}/`, { waitUntil: "load" });
  await expect(page.locator("#projects .project")).toHaveCount(6);
  await page.waitForLoadState("networkidle");
  const initialKb = Math.round(bytes / 1024);
  await scrollThrough(page);
  const cls = await page.evaluate(() => window.__cls);
  console.log(`initial transfer: ${initialKb} KB, CLS after scroll: ${cls.toFixed(4)}`);
  expect(initialKb).toBeLessThan(1400);
  expect(cls).toBeLessThan(0.1);
});
