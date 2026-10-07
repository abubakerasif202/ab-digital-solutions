import puppeteer from "puppeteer";
import { readFile, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const base = process.env.QA_BASE_URL || "http://127.0.0.1:3100";
if (!["127.0.0.1", "localhost"].includes(new URL(base).hostname)) throw new Error("Local-only QA: no production enquiries.");
const output = path.resolve("test-results/studio");
await mkdir(output, { recursive: true });
const registry = await readFile("app/project-data.ts", "utf8");
const services = await readFile("app/services/service-data.ts", "utf8");
const slugs = [...registry.matchAll(/slug: "([^"]+)"/g)].map((match) => match[1]);
const serviceSlugs = [...services.matchAll(/slug: "([^"]+)"/g)].map((match) => match[1]);
const routes = ["/", "/work", ...slugs.map((slug) => `/work/${slug}`), "/services", ...serviceSlugs.map((slug) => `/services/${slug}`), "/about", "/contact", "/privacy"];
const results = [];
const errors = [];
const check = (name, passed, detail) => results.push({ name, passed, detail });
const browser = await puppeteer.launch({ headless: true });
let status = 200;
let delay = 0;
let requests = 0;
let forcingWebGLFailure = false;
const page = await browser.newPage();
await page.setCacheEnabled(false);
page.on("pageerror", (error) => errors.push({ url: page.url(), message: error.message }));
page.on("console", (message) => {
  const expectedMock = message.location().url?.includes("/api/contact")
    || (forcingWebGLFailure && /THREE\.WebGLRenderer: Error creating WebGL context/.test(message.text()));
  if (message.type() === "error" && !expectedMock) errors.push({ url: page.url(), message: message.text() });
});
await page.setRequestInterception(true);
page.on("request", async (request) => {
  const url = new URL(request.url());
  if (url.pathname === "/api/contact") {
    requests++;
    await new Promise((resolve) => setTimeout(resolve, delay));
    await request.respond({ status, contentType: "application/json", body: JSON.stringify(status === 200 ? { success: true } : { error: "QA simulated provider failure" }) });
  } else if (url.pathname === "/api/analytics") {
    await request.respond({ status: 204 });
  } else if (url.pathname === "/_vercel/speed-insights/script.js") {
    await request.respond({ status: 200, contentType: "application/javascript", body: "" });
  } else await request.continue();
});
const open = (route) => page.goto(`${base}${route}`, { waitUntil: "networkidle0" });
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const submit = async () => {
  await page.$eval(".contact-form button[type='submit']", (el) => el.scrollIntoView({ block: "center", behavior: "instant" }));
  await wait(500);
  await page.$eval(".contact-form button[type='submit']", (el) => el.focus());
  await page.keyboard.press("Enter");
};
const reveal = async () => {
  await page.evaluate(async () => {
    for (let y = 0; y < document.documentElement.scrollHeight; y += innerHeight * 0.8) {
      scrollTo(0, y);
      await new Promise((resolve) => setTimeout(resolve, 20));
    }
    scrollTo(0, 0);
  });
};
try {
  check("Canonical registries retain 14 projects and six services", slugs.length === 14 && serviceSlugs.length === 6, { slugs, serviceSlugs });
  for (const width of process.env.QA_INTERACTIONS_ONLY ? [] : [320, 375, 390, 768, 1024, 1440, 1920]) {
    await page.setViewport({ width, height: width < 768 ? 844 : 900, deviceScaleFactor: 1 });
    for (const route of routes) {
      const response = await open(route);
      await reveal();
      const state = await page.evaluate(() => {
        const schemas = [...document.querySelectorAll("script[type='application/ld+json']")];
        let schemaValid = true;
        for (const script of schemas) { try { JSON.parse(script.textContent); } catch { schemaValid = false; } }
        return { width: document.documentElement.scrollWidth, viewport: innerWidth, h1: document.querySelectorAll("h1").length, title: document.title, canonical: document.querySelector("link[rel='canonical']")?.href, description: document.querySelector("meta[name='description']")?.content, schemaValid, schemas: schemas.length, brokenImages: [...document.images].filter((image) => image.complete && !image.naturalWidth).map((image) => image.currentSrc || image.src) };
      });
      check(`${route} ${width}: route, semantic metadata, images and overflow`, [200, 304].includes(response.status()) && state.width <= width + 1 && state.h1 === 1 && !!state.description && state.title.includes("AB Web Studio") && state.canonical === `https://www.abwebstudio.com.au${route === "/" ? "/" : route}` && state.schemaValid && state.brokenImages.length === 0, { status: response.status(), ...state });
      if ([390, 1440].includes(width) && ["/", "/work", "/work/247-inventory-system", "/services", "/services/ecommerce-website-development", "/about", "/contact", "/privacy"].includes(route)) {
        await wait(route === "/" ? 2000 : 500);
        // Capture only: defeat Chromium's offscreen intrinsic-size optimization
        // after layout assertions, and wait for decoded, revealed content.
        await page.evaluate(async () => {
          const style = document.createElement("style");
          style.id = "qa-capture-stabilizer";
          style.textContent = "[data-reveal]{animation:none!important;opacity:1!important;transform:none!important}.reveal{opacity:1!important;translate:none!important;filter:none!important;clip-path:none!important}";
          document.head.append(style);
          for (const el of document.querySelectorAll("body *")) {
            if (getComputedStyle(el).contentVisibility === "auto") el.style.contentVisibility = "visible";
          }
          await document.fonts.ready;
          await Promise.all([...document.images].filter((image) => image.complete).map((image) => image.decode().catch(() => {})));
          scrollTo(0, 0);
        });
        await wait(400);
        await page.screenshot({ path: path.join(output, `${width}-${route === "/" ? "home" : route.slice(1).replaceAll("/", "-")}.png`), fullPage: true });
        await page.evaluate(() => document.getElementById("qa-capture-stabilizer")?.remove());
      }
    }
  }
  await page.setViewport({ width: 1440, height: 900 });
  await open("/about");
  check("Founder identity retained", await page.evaluate(() => document.body.textContent.includes("Abubakar Asif") && document.body.textContent.includes("Founder & Lead Developer")));
  await open("/contact");
  check("Direct email, phone and WhatsApp retained", await page.evaluate(() => !!document.querySelector("a[href='mailto:admin@abwebstudio.com.au']") && !!document.querySelector("a[href='tel:+61423332037']") && [...document.querySelectorAll("a")].some((link) => /wa\.me\/61423332037/.test(link.href))));
  await open("/work");
  const filters = await page.$$(".work-index-filter");
  for (let index = 0; index < filters.length; index++) {
    await filters[index].focus();
    await page.keyboard.press("Enter");
    await wait(500);
    const state = await page.evaluate(() => ({ pressed: document.querySelector(".work-index-filter[aria-pressed='true']")?.textContent, count: new Set([...document.querySelectorAll(".gr-wi-list a[href^='/work/']")].map((link) => link.getAttribute("href"))).size }));
    const expected = Number(state.pressed?.match(/\d+\s*$/)?.[0]);
    check(`Keyboard sector filter ${index}`, state.count === expected && expected > 0, state);
  }
  await open("/");
  const active = () => page.$eval(".showcase-slides a[aria-hidden='false']", (el) => el.getAttribute("href"));
  const initial = await active();
  const initialTitle = await page.$eval(".showcase-caption strong", (el) => el.textContent);
  await page.click("button[aria-label='Next project']");
  check("Carousel next and synchronised link", await active() !== initial && await page.$eval(".showcase-case-study", (el) => el.getAttribute("href")) === await active());
  check("Carousel title and category update", await page.$eval(".showcase-caption strong", (el) => el.textContent) !== initialTitle && await page.$eval(".showcase-category", (el) => el.textContent.trim().length > 0));
  await page.click("button[aria-label='Previous project']");
  check("Carousel previous", await active() === initial);
  await page.click(".slider-tabs button:last-child");
  check("Carousel direct selection", (await active()).endsWith(slugs.at(-1)));
  const pause = await page.$(".pause-control");
  check("Carousel explicit pause", await pause.evaluate((el) => el.getAttribute("aria-pressed") === "true"));
  await pause.click();
  await page.evaluate(() => document.activeElement.blur());
  await page.hover(".project-showcase");
  let current = await active();
  await wait(7000);
  check("Carousel hover pauses autoplay", await active() === current);
  await page.$eval(".showcase-slide.is-active", (el) => el.focus());
  await page.mouse.move(0, 0);
  current = await active();
  await wait(7000);
  check("Carousel keyboard focus pauses autoplay", await active() === current);
  await page.evaluate(() => document.activeElement.blur());
  await wait(7000);
  check("Carousel resumes autoplay after hover and focus leave", await active() !== current);
  await page.setViewport({ width: 390, height: 844 });
  await open("/");
  await page.click(".menu-toggle");
  await page.waitForFunction(() => !!document.activeElement.closest("#primary-navigation"), { timeout: 1000 }).catch(() => {});
  check("Mobile menu keyboard focus", await page.evaluate(() => !!document.activeElement.closest("#primary-navigation")), await page.evaluate(() => ({ active: document.activeElement.outerHTML.slice(0, 300), expanded: document.querySelector(".menu-toggle").getAttribute("aria-expanded"), visibility: getComputedStyle(document.querySelector("#primary-navigation")).visibility, width: innerWidth })));
  await page.keyboard.press("Escape");
  check("Mobile menu Escape restores trigger", await page.$eval(".menu-toggle", (el) => el.getAttribute("aria-expanded") === "false" && el === document.activeElement));
  for (const route of ["/", "/contact"]) {
    await open(route);
    const before = requests;
    await submit();
    check(`${route} required validation prevents delivery`, requests === before && await page.$eval("#full-name", (el) => el.validity.valueMissing));
    await page.waitForFunction(() => document.querySelector("#full-name").getAttribute("aria-invalid") === "true");
    check(`${route} invalid fields expose accessible errors`, await page.$eval("#full-name", (el) => el.getAttribute("aria-invalid") === "true" && !!document.getElementById(el.getAttribute("aria-describedby"))));
    await page.type("#full-name", "Browser QA");
    await page.type("#email", "invalid-email");
    await page.type("#message", "Mocked only. No production delivery.");
    await submit();
    await page.waitForFunction(() => document.querySelector("#email").getAttribute("aria-invalid") === "true");
    check(`${route} malformed email prevents delivery`, requests === before && await page.$eval("#email", (el) => el.getAttribute("aria-invalid") === "true"));
    for (const mocked of [503, 200]) {
      await open(route);
      status = mocked;
      delay = 500;
      await page.type("#full-name", "Browser QA");
      await page.type("#email", "qa@example.invalid");
      await page.type("#message", "Mocked only. No production delivery.");
      await page.select("#budget", "$3,000–$6,000");
      await page.select("#timeline", "Within 1 month");
      await page.click(".form-service-option:last-child input");
      const formBefore = await page.$eval(".contact-form", (el) => Object.fromEntries(new FormData(el)));
      const count = requests;
      await submit();
      await page.waitForSelector(".contact-form[aria-busy='true']");
      check(`${route} loading disables duplicate submission`, await page.$eval(".contact-form button[type='submit']", (el) => el.disabled));
      await page.$eval(".contact-form", (el) => el.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true })));
      await page.waitForSelector(`.form-status.${mocked === 200 ? "success" : "error"}`);
      const name = await page.$eval("#full-name", (el) => el.value);
      check(`${route} mocked ${mocked} and duplicate guard`, requests === count + 1 && (mocked === 200 ? name === "" : name === "Browser QA"), { requests: requests - count, name });
      if (mocked !== 200) check(`${route} failure preserves all entered fields and choices`, JSON.stringify(await page.$eval(".contact-form", (el) => Object.fromEntries(new FormData(el)))) === JSON.stringify(formBefore));
      check(`${route} status remains accessible`, await page.$eval(".form-status", (el) => el.getAttribute("role") === "status" && el.getAttribute("aria-live") === "polite"));
    }
  }
  await page.setViewport({ width: 1440, height: 900 });
  await page.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "reduce" }]);
  await open("/");
  check("Reduced motion keeps static scene and pauses carousel", await page.$eval(".hero-3d-fallback", (el) => el.getBoundingClientRect().height > 0) && await page.$eval(".pause-control", (el) => el.getAttribute("aria-pressed") === "true"));
  check("Reduced motion loads no WebGL canvas", await page.$(".hero-3d-bg-wrap canvas") === null);
  await page.emulateMediaFeatures([]);
  await page.setViewport({ width: 1440, height: 900 });
  forcingWebGLFailure = true;
  await page.evaluateOnNewDocument(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (type, ...args) {
      if (/webgl/.test(type)) return null;
      return original.call(this, type, ...args);
    };
  });
  await open("/");
  check("Unavailable WebGL retains static visual and useful heading", await page.$eval(".hero-3d-fallback", (el) => el.getBoundingClientRect().height > 0) && await page.$eval("h1", (el) => el.textContent.trim().length > 0));
  const sitemap = await (await fetch(`${base}/sitemap.xml`)).text();
  check("Sitemap retains every project and service", [...slugs.map((slug) => `/work/${slug}`), ...serviceSlugs.map((slug) => `/services/${slug}`)].every((route) => sitemap.includes(route)));
  await page.setJavaScriptEnabled(false);
  for (const route of ["/", "/work", "/contact"]) {
    await open(route);
    const content = await page.evaluate(() => ({ heading: document.querySelector("h1")?.textContent.trim(), email: !!document.querySelector("a[href='mailto:admin@abwebstudio.com.au']"), projects: new Set([...document.querySelectorAll("a[href^='/work/']")].map((link) => link.getAttribute("href"))).size }));
    check(`${route} no-JavaScript semantic content and contact`, !!content.heading && content.email && (route !== "/work" || content.projects === 14), content);
  }
  for (const mode of ["coarse", "save-data", "context-loss"]) {
    const target = await browser.newPage();
    target.on("pageerror", (error) => errors.push({ url: target.url(), mode, message: error.message }));
    target.on("console", (message) => {
      if (message.type() === "error") errors.push({ url: target.url(), mode, message: message.text() });
    });
    await target.setViewport({ width: 1440, height: 900, hasTouch: mode === "coarse" });
    await target.setRequestInterception(true);
    target.on("request", (request) => {
      const pathname = new URL(request.url()).pathname;
      if (pathname === "/api/analytics") void request.respond({ status: 204 });
      else if (pathname === "/api/contact") void request.abort();
      else if (pathname === "/_vercel/speed-insights/script.js") void request.respond({ status: 200, contentType: "application/javascript", body: "" });
      else void request.continue();
    });
    await target.evaluateOnNewDocument((mode) => {
      window.__qaAttempts = 0;
      const original = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext = function (type, ...args) {
        if (/webgl/.test(type)) window.__qaAttempts++;
        return original.call(this, type, ...args);
      };
      if (mode === "save-data") {
        const connection = new EventTarget();
        connection.saveData = true;
        Object.defineProperty(navigator, "connection", { value: connection, configurable: true });
      }
    }, mode);
    await target.goto(base, { waitUntil: "networkidle0" });
    await wait(2000);
    if (mode === "context-loss") {
      const canvas = await target.waitForSelector(".hero-3d-bg-wrap canvas", { timeout: 5000 }).catch(() => null);
      if (canvas) {
        await canvas.evaluate((el) => el.dispatchEvent(new Event("webglcontextlost", { cancelable: true })));
        await target.waitForSelector(".hero-3d-fallback");
      }
      check("WebGL context-loss handler restores static fallback", !!canvas && await target.$eval(".hero-3d-fallback", (el) => el.getBoundingClientRect().height > 0));
    } else {
      const state = await target.evaluate(() => ({ attempts: window.__qaAttempts, canvas: !!document.querySelector(".hero-3d-bg-wrap canvas"), fallback: !!document.querySelector(".hero-3d-fallback") }));
      check(`${mode} skips WebGL and retains static visual`, state.attempts === 0 && !state.canvas && state.fallback, state);
    }
    await target.close();
  }
  check("No unexpected browser errors", errors.length === 0, errors);
} catch (error) { check("Runner completes", false, error.stack); }
finally {
  await browser.close();
  await writeFile(path.join(output, process.env.QA_INTERACTIONS_ONLY ? "report-interactions.json" : "report.json"), JSON.stringify({ base, results, errors, mockedRequests: requests }, null, 2));
  console.log(JSON.stringify({ passed: results.filter((r) => r.passed).length, failed: results.filter((r) => !r.passed) }, null, 2));
  if (results.some((r) => !r.passed)) process.exitCode = 1;
}
