import { test, expect } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";
import * as THREE from "three";
import sharp from "sharp";
import { studioProjects } from "../../app/studio/studio-data.ts";
// Exercise WebGL in full Chromium, including its production compositor.
test.use({ channel: "chromium" });
const output = process.env.QA_OUT || "qa/virtual-studio";
test.beforeAll(() => {
  if (!["localhost", "127.0.0.1"].includes(new URL(process.env.QA_BASE_URL || "http://127.0.0.1:3100").hostname)) {
    throw new Error("Studio QA must run locally; contact submissions are intercepted.");
  }
});
const mode = (page) => page.locator("[data-mode]");
async function intercept(page) {
  await page.route("**/api/analytics", (route) => route.fulfill({ status: 204 }));
  await page.route("**/_vercel/**", (route) => route.fulfill({ status: 200, body: "" }));
}
async function enter(page) {
  await page.getByRole("button", { name: "Enter the Studio", exact: true }).click();
  await expect(mode(page)).toHaveAttribute("data-mode", /arrival|intro|explore/, { timeout: 30000 });
  const skip = page.getByRole("button", { name: "Skip intro", exact: true });
  if (await skip.isVisible()) await page.keyboard.press("Escape");
  await expect(mode(page)).toHaveAttribute("data-mode", "explore");
}
async function openOptions(page) {
  const toggle = page.getByRole("button", { name: "View options" });
  if ((await toggle.getAttribute("aria-expanded")) !== "true") await toggle.click();
}
async function space(page, label) {
  await page.getByRole("navigation", { name: "Studio rooms" }).getByRole("button", { name: label }).click();
  await expect(page.locator("#studio-panel-heading")).toBeFocused();
}
test.beforeEach(async ({ page }) => { await mkdir(output, { recursive: true }); await intercept(page); });

for (const width of [390, 768, 1440]) {
  test(`content, controls and screenshots at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: width === 390 ? 844 : 1000 });
    const errors = [], models = [];
    page.on("pageerror", (error) => errors.push(error.stack || error.message));
    page.on("request", (request) => { if (/\.glb/.test(request.url())) models.push(request.url()); });
    await page.goto("/studio", { waitUntil: "networkidle" });
    await expect(page.locator("h1")).toHaveText("A different perspective.");
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", "https://www.abwebstudio.com.au/studio");
    await expect(page.locator("canvas")).toHaveCount(0); expect(models).toEqual([]);
    await page.screenshot({ path: `${output}/${width}-entry.png`, fullPage: true });
    await enter(page); await expect(page.locator("canvas")).toHaveCount(1);
    await page.waitForTimeout(1800);
    await page.screenshot({ path: `${output}/${width}-studio.png` });
    for (const [label, heading] of [["Reception", "Ideas start here."], ["Portfolio gallery", "Work with purpose."], ["Services atelier", "What we can build for you."], ["Consultation lounge", "Tell us what you’re building."]]) {
      await space(page, label);
      await expect(page.locator("#studio-panel-heading")).toHaveText(heading);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      if (width <= 768) {
        const sheet = await page.locator("aside[aria-labelledby='studio-panel-heading']").boundingBox();
        const stage = await mode(page).boundingBox();
        // Details sit below the scene as page content, never over it or in a nested scroller.
        expect(sheet.y).toBeGreaterThanOrEqual(stage.y + stage.height - 1);
      }
      if (label === "Portfolio gallery") {
        await expect(page.locator("#studio-project option")).toHaveText(studioProjects.map((project) => project.name));
        await page.locator("#studio-project").selectOption("1");
        await expect(page.getByRole("link", { name: "View case study" })).toHaveAttribute("href", "/work/milestone-renovate");
      }
      if (label === "Services atelier") {
        await page.getByRole("button", { name: "Custom Software & Business Systems" }).click();
        await expect(page.getByRole("link", { name: "Explore this service" })).toHaveAttribute("href", "/services/custom-software-business-systems");
        await page.getByRole("button", { name: "E-commerce Website Development" }).click();
        await expect(page.getByRole("link", { name: "Enquire about this" })).toHaveAttribute("href", "/contact?service=E-commerce%20solutions");
      }
      await page.screenshot({ path: `${output}/${width}-${label.split(" ")[0].toLowerCase()}.png` });
      await page.keyboard.press("Escape");
      await expect(page.locator("aside[aria-labelledby='studio-panel-heading']")).toHaveCount(0);
      await expect(page.getByRole("navigation", { name: "Studio rooms" }).getByRole("button", { name: label })).toBeFocused();
    }
    await page.getByRole("button", { name: "Guided tour", exact: true }).click();
    await expect(page.getByRole("button", { name: "Pause tour" })).toBeVisible();
    await page.keyboard.press("Escape");
    // Escape pauses the tour; it can be resumed from the same room.
    await expect(page.getByRole("button", { name: "Resume tour", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Resume tour", exact: true }).click();
  await expect(page.getByRole("button", { name: "Pause tour", exact: true })).toBeVisible();
  await page.screenshot({ path: `${output}/guided-tour.png` });
  await page.getByRole("button", { name: "Pause tour", exact: true }).click();
    await openOptions(page); await page.getByRole("button", { name: "Still view", exact: true }).click();
    await expect(page.locator("canvas")).toHaveCount(0);
    // Still view keeps the selected room open and moves focus to its details.
    await expect(page.locator("#studio-panel-heading")).toBeFocused();
    await space(page, "Consultation lounge");
    await page.locator("aside").getByRole("link", { name: "Start a project" }).click();
    await expect(page).toHaveURL(/\/contact$/); await expect(page.locator("form")).toBeVisible();
    expect(errors).toEqual([]);
  });
}

test("keyboard enters, skips, opens and closes without trapping focus", async ({ page }) => {
  await page.goto("/studio", { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "Enter the Studio" }).focus(); await page.keyboard.press("Enter");
  const skip = page.getByRole("button", { name: "Skip intro" }); await expect(skip).toBeVisible();
  await skip.focus(); await page.keyboard.press("Enter");
  const gallery = page.getByRole("navigation", { name: "Studio rooms" }).getByRole("button", { name: "Portfolio gallery" });
  await gallery.focus(); await page.keyboard.press("Enter");
  await expect(page.locator("#studio-panel-heading")).toBeFocused();
  await page.keyboard.press("Tab"); await expect(page.getByRole("button", { name: "Previous project" })).toBeFocused();
  await page.keyboard.press("Escape"); await expect(gallery).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(page.getByRole("navigation", { name: "Studio rooms" }).getByRole("button", { name: "Services atelier" })).toBeFocused();
});

test("WebGL context loss preserves HTML functionality", async ({ page }) => {
  await page.goto("/studio", { waitUntil: "networkidle" }); await enter(page);
  await page.locator("canvas").evaluate((canvas) => canvas.dispatchEvent(new Event("webglcontextlost", { cancelable: true })));
  await expect(mode(page)).toHaveAttribute("data-mode", "failed"); await expect(page.locator("canvas")).toHaveCount(0);
  await space(page, "Portfolio gallery"); await expect(page.getByRole("link", { name: "View case study" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Try 3D again" })).toBeVisible();
});

test("no WebGL, reduced motion and slow connections keep usable fallback", async ({ browser }) => {
  for (const fallback of ["no-webgl", "reduced-motion", "save-data", "2g"]) {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: fallback === "reduced-motion" ? "reduce" : "no-preference" });
    const page = await context.newPage(); await intercept(page);
    if (fallback === "no-webgl") await page.addInitScript(() => {
      const original = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext = function(type, ...args) { return /webgl/.test(type) ? null : original.call(this, type, ...args); };
    });
    if (fallback === "save-data" || fallback === "2g") await page.addInitScript((kind) => {
      Object.defineProperty(navigator, "connection", { value: Object.assign(new EventTarget(), { saveData: kind === "save-data", effectiveType: kind === "2g" ? "2g" : "4g" }), configurable: true });
    }, fallback);
    await page.goto("/studio", { waitUntil: "networkidle" });
    if (fallback === "no-webgl") {
      await page.getByRole("button", { name: "Enter the Studio" }).click();
      await expect(mode(page)).toHaveAttribute("data-mode", "failed", { timeout: 25000 });
    } else await expect(page.getByRole("button", { name: "Enter the Studio" })).toHaveCount(0);
    await expect(page.locator("canvas")).toHaveCount(0); await space(page, "Services atelier");
    await expect(page.getByRole("list", { name: "Services" }).getByRole("button")).toHaveCount(7);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({ path: `${output}/390-${fallback}.png` }); await context.close();
  }
});

test("model load failure recovers even after Skip Intro", async ({ page }) => {
  await page.route("**/ab-monogram.glb", (route) => route.abort()); await page.goto("/studio", { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "Enter the Studio" }).click();
  const skip = page.getByRole("button", { name: "Skip intro" }); if (await skip.isVisible()) await page.keyboard.press("Escape");
  await expect(mode(page)).toHaveAttribute("data-mode", "failed", { timeout: 25000 });
  await space(page, "Consultation lounge"); await expect(page.locator("aside").getByRole("link", { name: "Start a project" })).toHaveAttribute("href", "/contact");
});

test("server HTML works without JavaScript; homepage preview loads no model", async ({ browser, page }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
  const staticPage = await context.newPage(); await staticPage.goto("/studio");
  await expect(staticPage.getByRole("heading", { name: "Good design opens doors." })).toBeVisible();
  await staticPage.getByText("Browse the projects", { exact: true }).click();
  await expect(staticPage.locator("#studio-content").getByRole("link", { name: "Milestone Renovate", exact: true })).toBeVisible();
  await staticPage.screenshot({ path: `${output}/390-no-javascript.png`, fullPage: true });
  expect(await staticPage.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true); await context.close();
  const models = []; page.on("request", (request) => { if (/\.glb/.test(request.url())) models.push(request.url()); });
  await page.goto("/"); await expect(page.getByRole("heading", { name: "Websites built for real businesses." })).toBeAttached();
  await expect(page.getByRole("link", { name: "Virtual Studio", exact: true }).first()).toHaveAttribute("href", "/studio"); expect(models).toEqual([]);
});

test("touch orbit changes view and vertical swipe scrolls the page", async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
  const page = await context.newPage(); await intercept(page); await page.goto("/studio", { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "Enter the Studio" }).tap();
  await expect(mode(page)).toHaveAttribute("data-mode", /arrival|intro|explore/, { timeout: 30000 });
  await page.getByRole("button", { name: "Skip intro", exact: true }).click();
  await expect(mode(page)).toHaveAttribute("data-mode", "explore", { timeout: 10000 });
  await page.locator("canvas").scrollIntoViewIfNeeded(); await page.waitForTimeout(2500);
  const client = await context.newCDPSession(page), bounds = await page.locator("canvas").boundingBox();
  const x = bounds.x + bounds.width*.5, y = Math.max(bounds.y+130, 200);
  const before = await page.locator("canvas").screenshot();
  await client.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x, y }] });
  for (let i=1; i<=6; i++) await client.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: x+i*12, y }] });
  await client.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] }); await page.waitForTimeout(300);
  expect((await page.locator("canvas").screenshot()).equals(before)).toBe(false);
  expect(await page.locator("canvas").evaluate((canvas) => canvas.width/canvas.clientWidth)).toBeLessThanOrEqual(1.76);
  const pinchBefore = await page.locator("canvas").screenshot();
  await client.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: x-30, y, id: 1 }, { x: x+30, y, id: 2 }] });
  await client.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: x-65, y, id: 1 }, { x: x+65, y, id: 2 }] });
  await client.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  await page.waitForTimeout(300);
  expect((await page.locator("canvas").screenshot()).equals(pinchBefore)).toBe(false);
  const scroll = await page.evaluate(() => scrollY);
  // CDP's synthetic scroll does not dispatch a native touch pan in this
  // Chromium build; send the same touch sequence a finger would produce.
  const swipeBounds = await page.locator("canvas").boundingBox();
  const swipeY = Math.min(swipeBounds.y + 300, 650);
  await client.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x, y: swipeY, id: 7 }] });
  for (let i=1; i<=8; i++) {
    await client.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x, y: swipeY-i*22, id: 7 }] });
    await page.waitForTimeout(25);
  }
  await client.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(scroll);
  await page.screenshot({ path: `${output}/390-touch-orbit.png` }); await context.close();
});

test("idle rendering stops; physical display opens its project; wheel scrolls", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1100 });
  await page.addInitScript(() => {
    window.__studioDraws = 0;
    for (const proto of [WebGLRenderingContext.prototype, WebGL2RenderingContext.prototype]) for (const name of ["drawArrays", "drawElements"]) {
      const original = proto[name]; proto[name] = function(...args) { window.__studioDraws++; return original.apply(this,args); };
    }
  });
  await page.goto("/studio", { waitUntil: "networkidle" }); await enter(page);
  // Ambient traffic and people animate while the visitor is active, then the world rests: no timers, no draws.
  await page.waitForTimeout(48000);
  const start = await page.evaluate(() => window.__studioDraws); await page.waitForTimeout(2500);
  expect(await page.evaluate(() => window.__studioDraws)).toBe(start);
  const bounds = await page.locator("canvas").boundingBox();
  await page.mouse.move(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2);
  await expect.poll(() => page.evaluate(() => window.__studioDraws)).toBeGreaterThan(start);
  const camera = new THREE.PerspectiveCamera(42, bounds.width/bounds.height, .1, 560);
  camera.position.set(19,15,24); camera.lookAt(0,.2,0); camera.updateMatrixWorld();
  const point = new THREE.Vector3(-4.9,2.45,-4.87).project(camera);
  await page.mouse.click(bounds.x+(point.x+1)/2*bounds.width, bounds.y+(1-point.y)/2*bounds.height);
  await expect(page.locator("#studio-panel-heading")).toHaveText("Work with purpose."); await expect(page.locator("#studio-project")).toHaveValue("1");
  await page.keyboard.press("Escape"); await page.waitForTimeout(2500);
  await page.mouse.move(bounds.x+bounds.width/2, bounds.y+bounds.height/2);
  const scroll = await page.evaluate(() => scrollY); await page.mouse.wheel(0, 250);
  await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(scroll);
});

test("guided tour visits four spaces and finishes with a genuine quote link", async ({ page }) => {
  await page.goto("/studio", { waitUntil: "networkidle" }); await enter(page);
  await page.getByRole("button", { name: "Guided tour", exact: true }).click();
  const caption = page.locator('[class*="sceneCaption"]');
  for (const name of ["Reception", "Portfolio gallery", "Services atelier", "Consultation lounge"]) {
    await expect(caption).toContainText(name, { timeout: 9000 });
  }
  await expect(page.locator("#studio-panel-heading")).toHaveText("Tell us what you’re building.", { timeout: 9000 });
  await expect(page.locator("aside").getByRole("link", { name: "Start a project" })).toHaveAttribute("href", "/contact");
});

test("quote journey preserves form validation, successful submission and recoverable errors", async ({ page }) => {
  await page.goto("/studio", { waitUntil: "networkidle" }); await space(page, "Consultation lounge");
  await page.locator("aside").getByRole("link", { name: "Start a project" }).click();
  let response = { status: 503, body: { ok: false, error: "Email is temporarily unavailable. Please try again." } };
  const payloads = [];
  await page.route("**/api/contact", (route) => {
    payloads.push(route.request().postDataJSON());
    return route.fulfill({ status: response.status, contentType: "application/json", body: JSON.stringify(response.body) });
  });
  await page.getByRole("button", { name: "Send project enquiry" }).click(); expect(payloads).toHaveLength(0);
  await page.locator("#full-name").fill("Studio local QA");
  await page.locator("#email").fill("studio-qa@example.com");
  await page.locator("#message").fill("Local browser QA enquiry. This submission is intercepted and must not send email.");
  await page.getByRole("checkbox", { name: "Website design & development" }).check();
  await page.getByRole("button", { name: "Send project enquiry" }).click();
  await expect(page.locator(".form-status")).toContainText("temporarily unavailable");
  await expect(page.locator("#full-name")).toHaveValue("Studio local QA");
  response = { status: 200, body: { ok: true } };
  await page.getByRole("button", { name: "Send project enquiry" }).click();
  await expect(page.locator(".form-status")).toContainText("your enquiry has been sent");
  expect(payloads).toHaveLength(2);
  expect(payloads[0].services).toEqual(["Website design & development"]);
  expect(payloads[1].submissionId).toBe(payloads[0].submissionId);
});

test("existing public routes retain metadata and responsive navigation", async ({ page }) => {
  for (const width of [390,768,1440]) {
    await page.setViewportSize({ width, height: 900 });
    for (const route of ["/", "/work", "/services", "/about", "/contact"]) {
      const response = await page.goto(route, { waitUntil: "networkidle" }); expect(response.status()).toBe(200);
      await expect(page.locator("h1")).toHaveCount(1);
      await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", `https://www.abwebstudio.com.au${route === "/" ? "" : route}`);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      if (route === "/") await page.screenshot({ path: `${output}/${width}-homepage.png` });
    }
  }
});

test("retry recovers a failed model request and repeated entry has clean teardown", async ({ page }) => {
  const errors = []; page.on("pageerror", (error) => errors.push(error.message));
  let blocked = true;
  await page.route("**/ab-monogram.glb", (route) => blocked ? route.abort() : route.continue());
  await page.goto("/studio", { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "Enter the Studio" }).click();
  await expect(mode(page)).toHaveAttribute("data-mode", "failed", { timeout: 25000 });
  blocked = false; errors.length = 0;
  await page.getByRole("button", { name: "Try 3D again" }).click();
  await expect(mode(page)).toHaveAttribute("data-mode", /intro|explore/, { timeout: 25000 });
  await openOptions(page); await page.getByRole("button", { name: "Still view", exact: true }).click();
  await expect(page.locator("canvas")).toHaveCount(0); await page.waitForTimeout(800);
  await openOptions(page); await page.getByRole("button", { name: "3D view", exact: true }).click();
  await expect(mode(page)).toHaveAttribute("data-mode", "explore", { timeout: 30000 });
  await expect(page.locator("canvas")).toHaveCount(1);
  await openOptions(page); await page.getByRole("button", { name: "Still view", exact: true }).click(); await page.waitForTimeout(800);
  await expect(page.locator("canvas")).toHaveCount(0);
  expect(errors).toEqual([]);
});

test("studio and portfolio panel pass automated accessibility checks", async ({ page }) => {
  const { readFile } = await import("node:fs/promises");
  const axe = await readFile("node_modules/axe-core/axe.min.js", "utf8");
  await page.goto("/studio", { waitUntil: "networkidle" });
  await page.addScriptTag({ content: axe });
  const scan = () => page.evaluate(async () => (await window.axe.run("main", { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21aa"] } })).violations.map(({ id, nodes }) => ({ id, elements: nodes.map((node) => node.target) })));
  expect(await scan()).toEqual([]);
  await space(page, "Portfolio gallery"); expect(await scan()).toEqual([]);
});


test("reset view restores the current room framing after orbit without reloading assets", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 1000 });
  const models = [];
  page.on("request", request => { if (/\.glb/.test(request.url())) models.push(request.url()); });
  await page.goto("/studio", { waitUntil: "networkidle" }); await enter(page);
  await page.waitForTimeout(2300);
  await expect(page.locator('[class*="sceneCaption"]')).toContainText(/scroll/i);
  // Reset view re-frames the current room, not the first-visit whole-studio overview.
  // Establish a room-level baseline before manual orbit so we test that contract.
  await space(page, "Reception");
  await page.keyboard.press("Escape");
  await expect(page.locator("aside[aria-labelledby='studio-panel-heading']")).toHaveCount(0);
  await page.waitForTimeout(2300);
  const canvas = page.locator("canvas");
  // Ambient traffic and people keep a few pixels moving, so compare views by similarity, not byte equality.
  const similarity = async (a, b) => {
    const [x, y] = await Promise.all([a, b].map((png) => sharp(png).resize(195).raw().toBuffer()));
    let same = 0;
    for (let i = 0; i < x.length; i++) if (Math.abs(x[i] - y[i]) < 14) same++;
    return same / x.length;
  };
  await page.waitForTimeout(1500);
  const original = await canvas.screenshot();
  const bounds = await canvas.boundingBox();
  await page.mouse.move(bounds.x + bounds.width * .5, bounds.y + bounds.height * .5);
  await page.mouse.down(); await page.mouse.move(bounds.x + bounds.width * .7, bounds.y + bounds.height * .5, { steps: 6 }); await page.mouse.up();
  await page.waitForTimeout(300);
  expect(await similarity(await canvas.screenshot(), original)).toBeLessThan(.9);
  const requests = models.length;
  await openOptions(page);
  await page.getByRole("button", { name: /^Reset view/ }).click();
  await page.waitForTimeout(2300);
  // Wait for the actual rendered endpoint rather than a fixed GPU deadline.
  await expect.poll(async () => similarity(await canvas.screenshot(), original), { intervals: [300, 500, 1000], timeout: 10000 }).toBeGreaterThan(.93);
  await writeFile(`${output}/reset-original.png`, original);
  await writeFile(`${output}/reset-restored.png`, await canvas.screenshot());
  expect(models.length).toBe(requests);
});

test("welcome separates exploration from tour and details open under the scene", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await page.goto("/studio");
  await page.getByRole("button", { name: "Enter the Studio", exact: true }).click();
  await expect(mode(page)).toHaveAttribute("data-mode", "intro", { timeout: 30000 });
  await page.getByRole("button", { name: "Start exploring", exact: true }).click();
  await expect(mode(page)).toHaveAttribute("data-mode", "explore");
  await expect(page.getByRole("button", { name: "Guided tour", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Guided tour", exact: true }).click();
  await expect(page.getByRole("button", { name: "Pause tour", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Pause tour", exact: true }).click();
  // The tour may have advanced before Pause was activated. Navigate from a known room.
  await space(page, "Reception");
  await page.getByRole("button", { name: "Next room", exact: true }).click();
  await expect(page.locator("#studio-panel-heading")).toHaveText("Work with purpose.");
  await expect(page.locator("#studio-panel-heading")).toBeVisible();
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "Previous room", exact: true }).click();
  await expect(page.locator("#studio-panel-heading")).toHaveText("Ideas start here.");
});

test("initial phone landscape caps DPR and all requested layouts stay within viewport", async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 844, height: 390 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
  const page = await context.newPage(); await intercept(page);
  await page.goto("/studio"); await enter(page);
  await expect.poll(() => page.locator("canvas").evaluate(canvas => canvas.width / canvas.clientWidth)).toBeLessThanOrEqual(1.76);
  await page.waitForTimeout(1900);
  const landscapeStage = await mode(page).boundingBox();
  expect(landscapeStage.y + landscapeStage.height).toBeLessThanOrEqual(391);
  await page.screenshot({ path: `${output}/initial-landscape.png` });
  for (const width of [320, 360, 375, 390, 430, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.getByRole("navigation", { name: "Studio rooms" }).getByRole("button", { name: "Reception" }).click();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    for (const button of await page.getByRole("navigation", { name: "Studio rooms" }).getByRole("button").all()) {
      const bounds = await button.boundingBox();
      expect(bounds.width).toBeGreaterThanOrEqual(44); expect(bounds.height).toBeGreaterThanOrEqual(44);
    }
    await page.keyboard.press("Escape");
  }
  await context.close();
});

test("room tabs keep the page still on desktop and the tab bar on screen on a phone", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/studio", { waitUntil: "networkidle" });
  await enter(page);
  const nav = page.getByRole("navigation", { name: "Studio rooms" });
  await nav.scrollIntoViewIfNeeded();
  const metrics = () => page.evaluate(() => {
    const bar = document.querySelector('[aria-label="Studio rooms"]').getBoundingClientRect();
    return { y: window.scrollY, top: bar.top, bottom: bar.bottom, height: window.innerHeight };
  });
  const before = await metrics();
  for (const label of ["Portfolio gallery", "Services atelier", "Consultation lounge", "Reception"]) {
    await nav.getByRole("button", { name: label }).click();
    await expect(page.locator("#studio-panel-heading")).toBeVisible();
    const after = await metrics();
    expect(Math.abs(after.y - before.y)).toBeLessThanOrEqual(8);
    expect(Math.abs(after.top - before.top)).toBeLessThanOrEqual(8);
    await page.keyboard.press("Escape");
  }
  await page.setViewportSize({ width: 390, height: 812 });
  await nav.scrollIntoViewIfNeeded();
  for (const label of ["Portfolio gallery", "Services atelier", "Consultation lounge", "Reception"]) {
    await nav.getByRole("button", { name: label }).click();
    const bar = await metrics();
    expect(bar.top).toBeGreaterThanOrEqual(-4);
    expect(bar.bottom).toBeLessThanOrEqual(bar.height + 4);
  }
});

test("stacked room details keep the room bar on screen when its size changes", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  for (const { width, height, top } of [
    { width: 320, height: 568, top: 454 },
    { width: 768, height: 900, top: 180 },
  ]) {
    await page.setViewportSize({ width, height });
    await page.goto("/studio");
    const nav = page.getByRole("navigation", { name: "Studio rooms" });
    await nav.evaluate((bar, position) => {
      window.scrollBy({ top: bar.getBoundingClientRect().top - position, behavior: "instant" });
    }, top);
    const room = nav.getByRole("button", { name: "Portfolio gallery" });
    await room.click();
    await expect(page.locator("#studio-panel-heading")).toBeFocused();
    const open = await nav.boundingBox();
    expect(Math.abs(open.y - top)).toBeLessThanOrEqual(10);
    expect(open.y + open.height).toBeLessThanOrEqual(height + 1);
    await page.keyboard.press("Escape");
    await expect(room).toBeFocused();
    const closed = await nav.boundingBox();
    expect(Math.abs(closed.y - open.y)).toBeLessThanOrEqual(2);
    expect(closed.y + closed.height).toBeLessThanOrEqual(height + 1);
  }
});

test("phone camera controls return the scene to view and label the exterior correctly", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/studio", { waitUntil: "networkidle" });
  await enter(page);
  const top = () => mode(page).evaluate(element => element.getBoundingClientRect().top);
  for (const name of ["Back to entrance", "Reset view", "Guided tour"]) {
    if (name !== "Guided tour") await openOptions(page);
    const control = name === "Guided tour" ? page.getByRole("button", { name, exact: true }) : page.getByRole("button", { name: new RegExp(`^${name}`) });
    await control.scrollIntoViewIfNeeded();
    await control.click();
    await expect.poll(top).toBeGreaterThanOrEqual(0);
    await expect.poll(top).toBeLessThan(110);
    if (name === "Back to entrance") {
      await expect(page.locator('[class*="sceneCaption"]')).toContainText("Sydney / Studio entrance");
      await expect(page.getByRole("navigation", { name: "Studio rooms" }).locator('[aria-pressed="true"]')).toHaveCount(0);
    }
  }
});

test("warmup fetches gallery textures alongside the model and commits stages in order", async ({ page }) => {
  let releaseModel;
  const pendingModel = new Promise((resolve) => { releaseModel = resolve; });
  let modelRequests = 0;
  let galleryRequests = 0;
  page.on("request", (request) => {
    if (/\/studio\/[^/]+\/screens\/[^/]+\.webp$/.test(request.url())) galleryRequests++;
  });
  await page.route("**/ab-monogram.glb", async (route) => {
    modelRequests++;
    await pendingModel;
    await route.continue();
  });
  await page.addInitScript(() => {
    window.__warmupStages = [];
    window.__earlyArrival = false;
    new MutationObserver(() => {
      const phase = document.querySelector("[data-warmup]")?.getAttribute("data-warmup");
      if (phase && window.__warmupStages.at(-1) !== phase) window.__warmupStages.push(phase);
      if (document.querySelector("[data-mode]")?.getAttribute("data-mode") === "arrival" && phase !== "done") window.__earlyArrival = true;
    }).observe(document, { subtree: true, childList: true, attributes: true, attributeFilter: ["data-warmup", "data-mode"] });
  });
  try {
    await page.goto("/studio", { waitUntil: "networkidle" });
    expect(galleryRequests).toBe(0);
    await page.getByRole("button", { name: "Enter the Studio", exact: true }).click();
    await expect.poll(() => modelRequests).toBeGreaterThan(0);
    await expect.poll(() => galleryRequests).toBe(3);
    await expect(page.locator("[data-warmup]")).toHaveAttribute("data-warmup", "core");
  } finally {
    releaseModel();
  }
  await expect(page.locator("[data-warmup]")).toHaveAttribute("data-warmup", "done", { timeout: 30000 });
  expect(await page.evaluate(() => window.__warmupStages)).toEqual(["core", "interior", "exterior", "traffic", "pedestrians", "wildlife", "staff", "done"]);
  expect(await page.evaluate(() => window.__earlyArrival)).toBe(false);
  await expect(mode(page)).toHaveAttribute("data-mode", /arrival|intro|explore/);
});

test("warmup waits for gallery textures before starting the arrival film", async ({ page }) => {
  let release;
  const pending = new Promise((resolve) => { release = resolve; });
  let requests = 0;
  await page.route("**/studio/*/screens/*.webp", async (route) => {
    requests++;
    await pending;
    await route.continue();
  });
  try {
    await page.goto("/studio", { waitUntil: "networkidle" });
    await page.getByRole("button", { name: "Enter the Studio", exact: true }).click();
    await expect.poll(() => requests).toBeGreaterThan(0);
    await expect(page.locator("[data-warmup]")).toHaveAttribute("data-warmup", "interior");
    await expect(mode(page)).toHaveAttribute("data-mode", "loading");
  } finally {
    release();
  }
  await expect(page.locator("[data-warmup]")).toHaveAttribute("data-warmup", "done", { timeout: 30000 });
  await expect(mode(page)).toHaveAttribute("data-mode", /arrival|intro|explore/);
});

test("pending shader compilation tears down safely and can re-enter", async ({ page }) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.addInitScript(() => {
    window.__holdStudioShaders = true; window.__studioShaderPolls = 0;
    // Exercise the pending-compile path even on renderers without the optional KHR extension.
    const simulated = new WeakSet();
    const getExtension = WebGL2RenderingContext.prototype.getExtension;
    WebGL2RenderingContext.prototype.getExtension = function (name) {
      const native = getExtension.call(this, name);
      if (native || name !== "KHR_parallel_shader_compile") return native;
      simulated.add(this);
      return { COMPLETION_STATUS_KHR: 0x91b1 };
    };
    const original = WebGL2RenderingContext.prototype.getProgramParameter;
    WebGL2RenderingContext.prototype.getProgramParameter = function (program, parameter) {
      // KHR_parallel_shader_compile completion status; only this status is held.
      if (parameter === 0x91b1) {
        window.__studioShaderPolls++;
        if (window.__holdStudioShaders) return false;
        if (simulated.has(this)) return true;
      }
      return original.call(this, program, parameter);
    };
  });
  await page.goto("/studio", { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "Enter the Studio", exact: true }).click();
  await expect.poll(() => page.evaluate(() => window.__studioShaderPolls)).toBeGreaterThan(0);
  await expect(mode(page)).toHaveAttribute("data-mode", "loading");
  await page.keyboard.press("Escape");
  await openOptions(page); await page.getByRole("button", { name: "Still view", exact: true }).click();
  await expect(page.locator("canvas")).toHaveCount(0);
  const polls = await page.evaluate(() => window.__studioShaderPolls);
  await page.evaluate(() => { window.__holdStudioShaders = false; });
  await page.waitForTimeout(800);
  expect(await page.evaluate(() => window.__studioShaderPolls)).toBe(polls);
  expect(errors).toEqual([]);
  await openOptions(page); await page.getByRole("button", { name: "3D view", exact: true }).click();
  await expect(page.locator("[data-warmup]")).toHaveAttribute("data-warmup", "done", { timeout: 30000 });
  await expect(mode(page)).toHaveAttribute("data-mode", "explore");
  expect(errors).toEqual([]);
});

test("failed baked environment recovers through the existing model retry", async ({ page }) => {
  let blocked = true, requests = 0;
  await page.route("**/room-environment.bin", (route) => { requests++; return blocked ? route.abort() : route.continue(); });
  await page.goto("/studio", { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "Enter the Studio", exact: true }).click();
  await expect(mode(page)).toHaveAttribute("data-mode", "failed", { timeout: 25000 });
  blocked = false;
  await page.getByRole("button", { name: "Try 3D again" }).click();
  await expect(page.locator("[data-warmup]")).toHaveAttribute("data-warmup", "done", { timeout: 30000 });
  await expect(mode(page)).toHaveAttribute("data-mode", /arrival|intro|explore/);
  expect(requests).toBeGreaterThan(1);
});

test("production audit: phone welcome leaves the exit unobstructed", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/studio");
  await page.getByRole("button", { name: "Enter the Studio", exact: true }).click();
  const intro = page.locator('[data-stage="intro"]');
  await expect(intro).toBeVisible({ timeout: 30000 });
  const back = page.locator("[data-mode]").getByRole("link", { name: "Back to website" });
  const [introBox, backBox] = await Promise.all([intro.boundingBox(), back.boundingBox()]);
  expect(introBox.y).toBeGreaterThanOrEqual(backBox.y + backBox.height);
  await back.click({ trial: true });
  await page.setViewportSize({ width: 500, height: 300 });
  const shortStage = await mode(page).boundingBox();
  const dismissIntro = intro.getByRole("button", { name: "Skip intro" });
  const shortSkip = await dismissIntro.boundingBox();
  expect(shortSkip.y + shortSkip.height).toBeLessThanOrEqual(shortStage.y + shortStage.height);
  await dismissIntro.click({ trial: true });
  await page.screenshot({ path: `${output}/500-short-landscape-intro.png` });
});

test("production audit: projected Portfolio label clears the room caption", async ({ page }) => {
  await page.setViewportSize({ width: 768, height: 1000 });
  await page.goto("/studio");
  await enter(page);
  await space(page, "Portfolio gallery");
  const stage = mode(page);
  await stage.evaluate((el) => el.scrollIntoView({ block: "start", behavior: "instant" }));
  await page.waitForTimeout(1850);
  const hotspot = stage.getByRole("button", { name: "Explore Portfolio" });
  const caption = stage.getByText("02 / Portfolio gallery", { exact: true });
  await expect(hotspot).toBeVisible();
  const [buttonBox, captionBox] = await Promise.all([hotspot.boundingBox(), caption.boundingBox()]);
  expect(buttonBox.y + buttonBox.height).toBeLessThanOrEqual(captionBox.y);
});

test("production audit: desktop gallery hands wheel scrolling back to the page", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/studio");
  await enter(page);
  await space(page, "Portfolio gallery");
  await mode(page).evaluate((el) => el.scrollIntoView({ block: "start", behavior: "instant" }));
  const panel = page.locator("aside[aria-labelledby='studio-panel-heading']");
  const baseline = await panel.evaluate((el) => {
    const maxScroll = el.scrollHeight - el.clientHeight;
    el.scrollTop = maxScroll;
    return { maxScroll, pageY: window.scrollY };
  });
  expect(baseline.maxScroll).toBeGreaterThan(0);
  const box = await panel.boundingBox();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.wheel(0, 380);
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(baseline.pageY);
});

test("production audit: wildlife speech replaces the on-canvas caption until dismissed", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/studio");
  await enter(page);
  await page.getByRole("button", { name: "Meet the locals", exact: true }).click();
  await page.getByRole("button", { name: "Say g’day", exact: true }).click();
  const stage = mode(page);
  const dismiss = stage.getByRole("button", { name: "Dismiss speech bubble" });
  const stageCaption = stage.locator('[class*="sceneCaption"]');
  await expect(dismiss).toBeVisible();
  await expect(stageCaption).toBeHidden();
  await dismiss.click();
  await expect(stageCaption).toBeVisible();
});

test("studio map reframes the 3D cutaway and navigates directly to a room", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/studio");
  await enter(page);
  await space(page, "Services atelier");

  const toggle = page.getByRole("button", { name: "Studio map", exact: true });
  await toggle.click();
  const map = page.getByRole("group", { name: "Studio floor plan" });
  await expect(map).toBeVisible();
  await expect(map.getByRole("button", { name: "Portfolio gallery" })).toBeFocused();
  await expect(mode(page).locator("[class*='sceneCaption']")).toContainText("Studio overview");
  await expect(mode(page).locator("canvas")).toBeVisible();
  await expect(page.locator("#studio-panel-heading")).toHaveCount(0);
  // Capture the settled cutaway rather than the first frame of the camera move.
  await page.waitForTimeout(2200);
  await page.screenshot({ path: `${output}/studio-map-1440.png` });

  await page.keyboard.press("Escape");
  await expect(toggle).toBeFocused();
  await expect(map).toBeHidden();
  await toggle.press("Enter");
  await map.getByRole("button", { name: "Portfolio gallery" }).press("Enter");
  await expect(page.locator("#studio-panel-heading")).toBeFocused();
  await expect(page.locator("#studio-panel-heading")).toHaveText("Work with purpose.");
  await expect(map).toBeHidden();
});

test("studio map is usable on a phone in still view without loading 3D", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/studio");
  await page.getByRole("button", { name: "Studio map", exact: true }).click();
  const map = page.getByRole("group", { name: "Studio floor plan" });
  await expect(map).toBeVisible();
  await map.scrollIntoViewIfNeeded();
  await page.screenshot({ path: `${output}/studio-map-still-390.png` });
  await map.getByRole("button", { name: "Consultation lounge" }).click();
  await expect(page.locator("#studio-panel-heading")).toBeFocused();
  await expect(mode(page)).toHaveAttribute("data-mode", "static");
  await expect(mode(page).locator("canvas")).toHaveCount(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth === document.documentElement.clientWidth)).toBe(true);

  const toggle = page.getByRole("button", { name: "Studio map", exact: true });
  await toggle.click();
  await expect(map.getByRole("button", { name: "Portfolio gallery" })).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(toggle).toBeFocused();
  await expect(page.locator("#studio-panel-heading")).toBeVisible();

  await toggle.click();
  await map.getByRole("button", { name: "Consultation lounge" }).click();
  await expect(page.locator("#studio-panel-heading")).toBeFocused();
});
