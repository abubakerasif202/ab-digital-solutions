// Browser checks for the noindex Next.js preview at /preview/opendesign.
// Needs a running production server (default http://127.0.0.1:3100, see playwright.config.mjs):
//   npx next build && npx next start -p 3100
// Optional: QA_PROD_GATE_URL points at a server started with VERCEL_ENV=production.
import { test, expect } from "@playwright/test";

const PATH = "/preview/opendesign";
const viewports = [
  { name: "mobile-compact", width: 360, height: 800 },
  { name: "mobile-standard", width: 390, height: 844 },
  { name: "tablet-portrait", width: 820, height: 1180 },
  { name: "desktop", width: 1440, height: 900 },
  { name: "wide", width: 1920, height: 1080 },
];
const VALID = { name: "Jordan Example", email: "jordan@example.com", message: "I need a new website for my business." };

async function open(page, size = { width: 1440, height: 900 }, query = "") {
  const problems = [];
  await page.addInitScript(() => {
    window.__csp = [];
    document.addEventListener("securitypolicyviolation", (event) => window.__csp.push(`${event.violatedDirective} ${event.blockedURI}`));
  });
  // The Vercel Speed Insights script only exists on Vercel; its 404 on a local server is identical on the live homepage.
  const environmental = /speed-insights|Failed to load resource: the server responded with a status of 404/;
  page.on("console", (message) => { if (message.type() === "error" && !environmental.test(message.text())) problems.push(message.text()); });
  page.on("pageerror", (error) => problems.push(error.message));
  await page.setViewportSize({ width: size.width, height: size.height });
  await page.goto(`${PATH}${query}`);
  await expect(page.locator("h1")).toBeVisible();
  return problems;
}

async function scrollThrough(page) {
  await page.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += window.innerHeight * 0.8) {
      window.scrollTo(0, y);
      await new Promise((resolve) => setTimeout(resolve, 80));
    }
    window.scrollTo(0, 0);
  });
}

async function fillForm(page) {
  await page.fill("#full-name", VALID.name);
  await page.fill("#email", VALID.email);
  await page.fill("#message", VALID.message);
}

for (const size of viewports) {
  test(`${size.name} ${size.width}x${size.height}: no overflow, no console or CSP errors, images load`, async ({ page }) => {
    const problems = await open(page, size);
    await page.getByRole("button", { name: /Show all \d+ projects/ }).click();
    await scrollThrough(page);
    await page.waitForLoadState("networkidle");
    const report = await page.evaluate(() => ({
      overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      broken: [...document.images].filter((img) => img.currentSrc && img.complete && img.naturalWidth === 0).map((img) => img.currentSrc),
      csp: window.__csp,
    }));
    expect(report.overflow).toBeLessThanOrEqual(0);
    expect(report.broken).toEqual([]);
    expect(report.csp).toEqual([]);
    expect(problems).toEqual([]);
  });
}

test("noindex everywhere it can be set, and absent from sitemap, robots and the live homepage", async ({ page, request }) => {
  const response = await page.goto(PATH);
  expect(response.headers()["x-robots-tag"]).toMatch(/noindex/);
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
  await expect(page.locator('meta[name="googlebot"]')).toHaveAttribute("content", /noindex/);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", /\/preview\/opendesign$/);
  expect(await (await request.get("/sitemap.xml")).text()).not.toContain("preview");
  expect(await (await request.get("/robots.txt")).text()).not.toContain("preview");
  const home = await request.get("/");
  expect(home.headers()["x-robots-tag"] ?? "").not.toMatch(/noindex/);
  expect(await home.text()).not.toContain("/preview/");
});

test("production gate: the route is a 404 when VERCEL_ENV=production", async ({ request }) => {
  test.skip(!process.env.QA_PROD_GATE_URL, "set QA_PROD_GATE_URL to a server started with VERCEL_ENV=production");
  const response = await request.get(`${process.env.QA_PROD_GATE_URL}${PATH}`);
  expect(response.status()).toBe(404);
});

test("the live homepage is unchanged", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("h1.stage-title")).toContainText("Websites with");
  await expect(page.locator(".stage-hero")).toBeVisible();
  await expect(page.locator(".odp")).toHaveCount(0);
});

test("structure: one h1, ordered headings, one main landmark, unique ids, skip link target exists", async ({ page }) => {
  await open(page);
  const report = await page.evaluate(() => {
    const levels = [...document.querySelectorAll("main h1, main h2, main h3, main h4")].map((h) => Number(h.tagName[1]));
    const ids = [...document.querySelectorAll("[id]")].map((element) => element.id);
    return {
      h1: document.querySelectorAll("h1").length,
      skips: levels.filter((level, i) => i > 0 && level - levels[i - 1] > 1),
      main: document.querySelectorAll("main").length,
      dupes: ids.filter((id, i) => ids.indexOf(id) !== i),
      skipTarget: Boolean(document.querySelector(`a.skip-link[href="#main-content"]`) && document.getElementById("main-content")),
    };
  });
  expect(report).toEqual({ h1: 1, skips: [], main: 1, dupes: [], skipTarget: true });
});

test("work: server-rendered cards, six shown first, filters, case-study links, honest status labels", async ({ page }) => {
  await open(page);
  const visible = () => page.locator(".odp-project:visible");
  await expect(page.locator(".odp-project")).toHaveCount(19);
  await expect(visible()).toHaveCount(6);
  await page.getByRole("button", { name: "Show all 19 projects" }).click();
  await expect(visible()).toHaveCount(19);
  const chip = page.locator(".odp-chip", { hasText: "Removals" });
  await chip.click();
  await expect(visible()).toHaveCount(3);
  await expect(chip).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator(".odp-sr[role=status]")).toContainText("Showing 3 projects in Removals");
  await page.locator(".odp-chip", { hasText: /^All/ }).click();
  const hrefs = await page.locator(".odp-project-link").evaluateAll((links) => links.map((a) => a.getAttribute("href")));
  expect(hrefs.every((href) => /^\/work\/[a-z0-9-]+$/.test(href))).toBe(true);
  const trailers = page.locator('.odp-project-link[href="/work/on-call-trailers"] .odp-project-status');
  // Owner-confirmed live (link-check.json), so it keeps the registry's "Live website" label.
  await expect(trailers).toHaveText("Live website");
  await expect(page.locator(".odp-project-status", { hasText: "Live website" }).first()).toBeAttached();
});

test("the existing 3D studio entry is present and leads to the unchanged /studio route", async ({ page }) => {
  await open(page);
  const link = page.getByRole("link", { name: /Enter Our 3D Studio/ });
  await expect(link).toHaveAttribute("href", "/studio");
  await expect(page.locator("#virtual-studio-preview")).toContainText("Step Inside Our Studio");
  const response = await page.request.get("/studio");
  expect(response.status()).toBe(200);
});

test("without JavaScript every project is listed and the headline is visible", async ({ browser, baseURL }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, baseURL });
  const page = await context.newPage();
  await page.goto(PATH);
  await expect(page.locator("h1")).toBeVisible();
  await expect(page.locator(".odp-project:visible")).toHaveCount(19);
  await context.close();
});

test("disciplines: accordion semantics and 'Discuss this' selects the service in the shared form", async ({ page }) => {
  await open(page);
  const toggle = page.locator(".odp-card-toggle").nth(1);
  await expect(toggle).toHaveAttribute("aria-expanded", "false");
  await toggle.click();
  await expect(toggle).toHaveAttribute("aria-expanded", "true");
  await expect(page.locator(".odp-card-body").nth(1)).toBeVisible();
  await page.locator(".odp-card-body").nth(1).getByRole("button", { name: "Discuss this" }).click();
  const checked = await page.locator('#contact input[name="service"]:checked').evaluateAll((inputs) => inputs.map((input) => input.value));
  expect(checked).toEqual(["Custom software & business systems"]);
  await expect(page.locator("#full-name")).toBeFocused();
});

test("form: the shared ContactForm posts the live /api/contact contract and the API accepts that shape", async ({ page, request }) => {
  await open(page);
  let payload;
  await page.route("**/api/contact", async (route) => {
    payload = route.request().postDataJSON();
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true }) });
  });
  await fillForm(page);
  await page.getByRole("button", { name: /Send project enquiry/ }).click();
  await expect(page.locator(".form-status")).toContainText("Enquiry received");
  expect(payload).toMatchObject({ fullName: VALID.name, email: VALID.email, message: VALID.message, company: "" });
  expect(Array.isArray(payload.services) && payload.services.length >= 1).toBe(true);
  expect(payload.submissionId).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
  // Direct valid submissions require an explicitly isolated no-delivery server. A developer's
  // ordinary local server may load real credentials, so never infer safety from localhost.
  if (process.env.QA_NO_DELIVERY !== "1") {
    test.info().annotations.push({ type: "note", description: "direct API check requires QA_NO_DELIVERY=1 and a server started with an empty RESEND_API_KEY" });
    return;
  }
  // On that isolated server a valid payload stops at delivery (503); invalid options return 400.
  const accepted = await request.post("/api/contact", { data: payload });
  if (accepted.status() === 429) {
    // The route allows 5 enquiries per 10 minutes per client; a long suite can exhaust that. The shape check above still ran.
    test.info().annotations.push({ type: "note", description: "direct API check skipped: contact rate limit reached (429)" });
    expect(accepted.headers()["retry-after"]).toBeTruthy();
    return;
  }
  expect(accepted.status()).toBe(503);
  expect((await accepted.json()).error).toMatch(/temporarily unavailable/i);
  const rejected = await request.post("/api/contact", { data: { ...payload, services: ["Not a real service"] } });
  expect(rejected.status()).toBe(400);
});

test("form: a failed send is reported as a failure, never as success", async ({ page }) => {
  await page.route("**/api/contact", (route) => route.fulfill({
    status: 503, contentType: "application/json",
    body: JSON.stringify({ error: "Online enquiries are temporarily unavailable." }),
  }));
  await open(page);
  await fillForm(page);
  await page.getByRole("button", { name: /Send project enquiry/ }).click();
  await expect(page.locator(".form-status")).toContainText("Please check your enquiry");
  await expect(page.locator(".form-status")).not.toContainText("Enquiry received");
});

test("hero: the approved artwork is the fallback, and ?fallback=css swaps in the CSS monogram", async ({ page }) => {
  await open(page, { width: 390, height: 844 });
  await expect(page.locator(".odp-hero-art img.hero-sculpture")).toBeVisible();
  await expect(page.locator(".odp-mono")).toHaveCount(0);
  await page.goto(`${PATH}?fallback=css`);
  await expect(page.locator(".odp-mono")).toBeVisible();
  await expect(page.locator(".odp-mono-layer")).toHaveCount(12);
  await expect(page.locator(".odp-hero-art img")).toHaveCount(0);
  const box = await page.locator(".odp-mono").boundingBox();
  const art = await page.locator(".odp-hero-art").boundingBox();
  expect(box.y).toBeGreaterThanOrEqual(art.y);
  expect(box.y + box.height).toBeLessThanOrEqual(art.y + art.height + 1);
});

test("hero: the Three.js scene still activates on desktop after pointer intent", async ({ page }) => {
  await open(page, { width: 1440, height: 900 });
  const cores = await page.evaluate(() => navigator.hardwareConcurrency);
  test.skip(cores <= 4, "Hero3DExperience deliberately stays on the static artwork for devices with 4 or fewer cores");
  await page.mouse.move(1000, 400);
  await expect(page.locator(".hero-3d-container canvas")).toBeVisible({ timeout: 20_000 });
});

test("reduced motion: the CSS monogram does not animate", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await open(page, { width: 1440, height: 900 }, "?fallback=css");
  expect(await page.locator(".odp-mono").evaluate((element) => getComputedStyle(element).animationName)).toBe("none");
});

test("keyboard: skip link first, then the shared header menu works on mobile", async ({ page }) => {
  await open(page, { width: 390, height: 844 });
  await page.keyboard.press("Tab");
  await expect(page.locator("a.skip-link")).toBeFocused();
  const toggle = page.locator(".menu-toggle");
  await toggle.click();
  await expect(toggle).toHaveAttribute("aria-expanded", "true");
  await page.keyboard.press("Escape");
  await expect(toggle).toHaveAttribute("aria-expanded", "false");
  await expect(toggle).toBeFocused();
});
