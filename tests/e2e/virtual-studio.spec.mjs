import { test, expect } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";
import * as THREE from "three";
import sharp from "sharp";
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
  const skip = page.getByRole("button", { name: "Skip Intro", exact: true });
  if (await skip.isVisible()) await page.keyboard.press("Escape");
  await expect(mode(page)).toHaveAttribute("data-mode", "explore");
}
async function space(page, label) {
  await page.getByRole("navigation", { name: "Studio spaces" }).getByRole("button", { name: label }).click();
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
    for (const [label, heading] of [["Reception", "Ideas start here."], ["Portfolio gallery", "Work with purpose."], ["Services atelier", "Considered. Connected."], ["Consultation lounge", "Let’s Build Something Extraordinary."]]) {
      await space(page, label);
      await expect(page.locator("#studio-panel-heading")).toHaveText(heading);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      if (width === 390) {
        const sheet = await page.locator("aside[aria-labelledby='studio-panel-heading']").boundingBox();
        const stage = await mode(page).boundingBox();
        expect(sheet.height).toBeLessThanOrEqual(stage.height * .49);
        expect(sheet.y).toBeGreaterThan(stage.y + stage.height * .35);
      }
      if (label === "Portfolio gallery") {
        await expect(page.locator("#studio-project option")).toHaveCount(16);
        await page.locator("#studio-project").selectOption("1");
        await expect(page.getByRole("link", { name: "Open Project" })).toHaveAttribute("href", "/work/milestone-renovate");
      }
      if (label === "Services atelier") {
        await page.locator("#studio-service").selectOption("3");
        await expect(page.getByRole("link", { name: "Discuss automation" })).toHaveAttribute("href", "/contact");
      }
      await page.screenshot({ path: `${output}/${width}-${label.split(" ")[0].toLowerCase()}.png` });
      await page.keyboard.press("Escape");
      await expect(page.locator("aside[aria-labelledby='studio-panel-heading']")).toHaveCount(0);
      await expect(page.getByRole("navigation", { name: "Studio spaces" }).getByRole("button", { name: label })).toBeFocused();
    }
    await page.getByRole("button", { name: "Guided tour", exact: true }).click();
    await expect(page.getByRole("button", { name: "Pause tour" })).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("button", { name: "Guided tour", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Guided tour", exact: true }).click();
  await expect(page.getByRole("button", { name: "Pause tour", exact: true })).toBeVisible();
  await page.screenshot({ path: `${output}/guided-tour.png` });
  await page.getByRole("button", { name: "Pause tour", exact: true }).click();
    await page.getByRole("button", { name: "Use still view" }).click();
    await expect(page.locator("canvas")).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Enter the Studio" })).toBeFocused();
    await space(page, "Consultation lounge");
    await page.locator("aside").getByRole("link", { name: "Start Your Project" }).click();
    await expect(page).toHaveURL(/\/contact$/); await expect(page.locator("form")).toBeVisible();
    expect(errors).toEqual([]);
  });
}

test("keyboard enters, skips, opens and closes without trapping focus", async ({ page }) => {
  await page.goto("/studio", { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "Enter the Studio" }).focus(); await page.keyboard.press("Enter");
  const skip = page.getByRole("button", { name: "Skip Intro" }); await expect(skip).toBeVisible();
  await skip.focus(); await page.keyboard.press("Enter");
  const gallery = page.getByRole("navigation", { name: "Studio spaces" }).getByRole("button", { name: "Portfolio gallery" });
  await gallery.focus(); await page.keyboard.press("Enter");
  await expect(page.locator("#studio-panel-heading")).toBeFocused();
  await page.keyboard.press("Tab"); await expect(page.locator("#studio-project")).toBeFocused();
  await page.keyboard.press("Escape"); await expect(gallery).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(page.getByRole("navigation", { name: "Studio spaces" }).getByRole("button", { name: "Services atelier" })).toBeFocused();
});

test("WebGL context loss preserves HTML functionality", async ({ page }) => {
  await page.goto("/studio", { waitUntil: "networkidle" }); await enter(page);
  await page.locator("canvas").evaluate((canvas) => canvas.dispatchEvent(new Event("webglcontextlost", { cancelable: true })));
  await expect(mode(page)).toHaveAttribute("data-mode", "failed"); await expect(page.locator("canvas")).toHaveCount(0);
  await space(page, "Portfolio gallery"); await expect(page.getByRole("link", { name: "Open Project" })).toBeVisible();
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
    await expect(page.locator("#studio-service option")).toHaveCount(4);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({ path: `${output}/390-${fallback}.png` }); await context.close();
  }
});

test("model load failure recovers even after Skip Intro", async ({ page }) => {
  await page.route("**/studio/ab-monogram.glb", (route) => route.abort()); await page.goto("/studio", { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "Enter the Studio" }).click();
  const skip = page.getByRole("button", { name: "Skip Intro" }); if (await skip.isVisible()) await page.keyboard.press("Escape");
  await expect(mode(page)).toHaveAttribute("data-mode", "failed", { timeout: 25000 });
  await space(page, "Consultation lounge"); await expect(page.locator("aside").getByRole("link", { name: "Start Your Project" })).toHaveAttribute("href", "/contact");
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
  await page.goto("/"); await expect(page.getByRole("heading", { name: /Don.t Just Visit Our Website.*Step Inside Our Studio/ })).toBeAttached();
  await expect(page.getByRole("link", { name: "Enter Our 3D Studio", exact: true }).first()).toHaveAttribute("href", "/studio"); expect(models).toEqual([]);
});

test("touch orbit changes view and vertical swipe scrolls the page", async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
  const page = await context.newPage(); await intercept(page); await page.goto("/studio", { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "Enter the Studio" }).tap();
  await expect(mode(page)).toHaveAttribute("data-mode", /arrival|intro|explore/, { timeout: 30000 });
  await page.getByRole("button", { name: "Skip Intro", exact: true }).click();
  await expect(mode(page)).toHaveAttribute("data-mode", "explore", { timeout: 10000 });
  await page.locator("canvas").scrollIntoViewIfNeeded(); await page.waitForTimeout(2500);
  const client = await context.newCDPSession(page), bounds = await page.locator("canvas").boundingBox();
  const x = bounds.x + bounds.width*.5, y = Math.max(bounds.y+130, 200);
  const before = await page.locator("canvas").screenshot();
  await client.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x, y }] });
  for (let i=1; i<=6; i++) await client.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: x+i*12, y }] });
  await client.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] }); await page.waitForTimeout(300);
  expect((await page.locator("canvas").screenshot()).equals(before)).toBe(false);
  expect(await page.locator("canvas").evaluate((canvas) => canvas.width/canvas.clientWidth)).toBeLessThanOrEqual(1.01);
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
  await page.mouse.move(5, 5); await page.mouse.move(25, 25); await page.waitForTimeout(800);
  expect(await page.evaluate(() => window.__studioDraws)).toBeGreaterThan(start);
  const bounds = await page.locator("canvas").boundingBox();
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
  await expect(page.locator("#studio-panel-heading")).toHaveText("Let’s Build Something Extraordinary.", { timeout: 9000 });
  await expect(page.locator("aside").getByRole("link", { name: "Start Your Project" })).toHaveAttribute("href", "/contact");
});

test("quote journey preserves form validation, successful submission and recoverable errors", async ({ page }) => {
  await page.goto("/studio", { waitUntil: "networkidle" }); await space(page, "Consultation lounge");
  await page.locator("aside").getByRole("link", { name: "Start Your Project" }).click();
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
  await page.route("**/studio/ab-monogram.glb", (route) => blocked ? route.abort() : route.continue());
  await page.goto("/studio", { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "Enter the Studio" }).click();
  await expect(mode(page)).toHaveAttribute("data-mode", "failed", { timeout: 25000 });
  blocked = false; errors.length = 0;
  await page.getByRole("button", { name: "Try 3D again" }).click();
  await expect(mode(page)).toHaveAttribute("data-mode", /intro|explore/, { timeout: 25000 });
  await page.getByRole("button", { name: "Use still view" }).click();
  await expect(page.locator("canvas")).toHaveCount(0); await page.waitForTimeout(800);
  await enter(page);
  await page.getByRole("button", { name: "Use still view" }).click(); await page.waitForTimeout(800);
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


test("reset view restores the establishing camera after orbit without reloading assets", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 1000 });
  const models = [];
  page.on("request", request => { if (/\.glb/.test(request.url())) models.push(request.url()); });
  await page.goto("/studio", { waitUntil: "networkidle" }); await enter(page);
  await page.waitForTimeout(2300);
  await expect(page.locator('[class*="sceneCaption"]')).toContainText("Swipe up to scroll");
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
  await page.getByRole("button", { name: "Reset view", exact: true }).click();
  await page.waitForTimeout(2300);
  // Wait for the actual rendered endpoint rather than a fixed GPU deadline.
  await expect.poll(async () => similarity(await canvas.screenshot(), original), { intervals: [300, 500, 1000], timeout: 10000 }).toBeGreaterThan(.93);
  await writeFile(`${output}/reset-original.png`, original);
  await writeFile(`${output}/reset-restored.png`, await canvas.screenshot());
  expect(models.length).toBe(requests);
});

test("welcome separates exploration from tour and details collapse accessibly", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await page.goto("/studio");
  await page.getByRole("button", { name: "Enter the Studio", exact: true }).click();
  await expect(mode(page)).toHaveAttribute("data-mode", "intro", { timeout: 30000 });
  await page.getByRole("button", { name: "Start Exploring", exact: true }).click();
  await expect(mode(page)).toHaveAttribute("data-mode", "explore");
  await expect(page.getByRole("button", { name: "Guided tour", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Guided tour", exact: true }).click();
  await expect(page.getByRole("button", { name: "Pause tour", exact: true })).toBeVisible();
  await page.screenshot({ path: `${output}/guided-tour.png` });
  await page.getByRole("button", { name: "Pause tour", exact: true }).click();
  await page.getByRole("button", { name: "Next Room", exact: true }).click();
  await expect(page.locator("#studio-panel-heading")).toHaveText("Work with purpose.");
  await page.getByRole("button", { name: "Collapse details" }).click();
  await expect(page.locator("#studio-panel-content")).toBeHidden();
  await page.getByRole("button", { name: "Expand details" }).click();
  await expect(page.locator("#studio-panel-content")).toBeVisible();
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "Previous Room", exact: true }).click();
  await expect(page.locator("#studio-panel-heading")).toHaveText("Ideas start here.");
});

test("initial phone landscape caps DPR and all requested layouts stay within viewport", async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 844, height: 390 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
  const page = await context.newPage(); await intercept(page);
  await page.goto("/studio"); await enter(page);
  await expect.poll(() => page.locator("canvas").evaluate(canvas => canvas.width / canvas.clientWidth)).toBeLessThanOrEqual(1.01);
  await page.waitForTimeout(1900);
  const landscapeStage = await mode(page).boundingBox();
  expect(landscapeStage.y + landscapeStage.height).toBeLessThanOrEqual(391);
  await page.screenshot({ path: `${output}/initial-landscape.png` });
  for (const width of [320, 360, 375, 390, 430, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.getByRole("navigation", { name: "Studio spaces" }).getByRole("button", { name: "Reception" }).click();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    for (const button of await page.getByRole("navigation", { name: "Studio spaces" }).getByRole("button").all()) {
      const bounds = await button.boundingBox();
      expect(bounds.width).toBeGreaterThanOrEqual(44); expect(bounds.height).toBeGreaterThanOrEqual(44);
    }
    await page.keyboard.press("Escape");
  }
  await context.close();
});

test("phone camera controls return the scene to view and label the exterior correctly", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/studio", { waitUntil: "networkidle" });
  await enter(page);
  const top = () => mode(page).evaluate(element => element.getBoundingClientRect().top);
  for (const name of ["Back to entrance", "Reset view", "Guided tour"]) {
    const control = page.getByRole("button", { name, exact: true });
    await control.scrollIntoViewIfNeeded();
    await control.click();
    await expect.poll(top).toBeGreaterThanOrEqual(0);
    await expect.poll(top).toBeLessThan(110);
    if (name === "Back to entrance") {
      await expect(page.locator('[class*="sceneCaption"]')).toContainText("Sydney / Studio entrance");
      await expect(page.getByRole("navigation", { name: "Studio spaces" }).locator('[aria-pressed="true"]')).toHaveCount(0);
    }
  }
});
