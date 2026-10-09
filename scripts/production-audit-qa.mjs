import puppeteer from "puppeteer";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const base = process.env.QA_BASE_URL || "http://127.0.0.1:3100";
if (!["127.0.0.1", "localhost"].includes(new URL(base).hostname)) throw new Error("This harness is local-only.");
const output = path.resolve("test-results/production-audit");
await mkdir(output, { recursive: true });
const sitemap = await (await fetch(`${base}/sitemap.xml`)).text();
const routes = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => new URL(match[1]).pathname);
const axe = await readFile("node_modules/axe-core/axe.min.js", "utf8");
const report = { base, routes, checks: [], browserErrors: [], accessibility: [] };
const check = (name, passed, detail) => report.checks.push({ name, passed, detail });
const browser = await puppeteer.launch({ headless: true });
const page = await browser.newPage();
let mockedStatus = 200;
let mockedRequests = 0;
const analyticsEvents = [];
await page.setRequestInterception(true);
page.on("request", async (request) => {
  const url = new URL(request.url());
  if (url.pathname === "/api/contact") {
    mockedRequests++;
    setTimeout(() => { void request.respond({ status: mockedStatus, contentType: "application/json", body: JSON.stringify(mockedStatus === 200 ? { success: true } : { error: "Mocked provider failure" }) }); }, 500);
  }
  else if (url.pathname === "/api/analytics") {
    try { analyticsEvents.push(JSON.parse(await request.fetchPostData() || "{}")); } catch { /* Reported by the assertion below if a lead event is missing. */ }
    void request.respond({ status: 204 });
  }
  else if (url.pathname.startsWith("/_vercel/") || /google-analytics|googletagmanager|vitals\.vercel/.test(url.hostname)) void request.respond({ status: 200, contentType: "application/javascript", body: "" });
  else void request.continue();
});
page.on("pageerror", (error) => report.browserErrors.push({ route: page.url(), type: "exception", message: error.message }));
page.on("console", (message) => { if (message.type() === "error" && !(mockedStatus === 503 && /503/.test(message.text()))) report.browserErrors.push({ route: page.url(), type: "console", message: message.text() }); });
page.on("requestfailed", (request) => { if (request.failure()?.errorText !== "net::ERR_ABORTED") report.browserErrors.push({ route: page.url(), type: "network", url: request.url(), message: request.failure()?.errorText }); });
page.on("response", (response) => { if (response.status() >= 400 && new URL(response.url()).pathname !== "/api/contact") report.browserErrors.push({ route: page.url(), type: "http", url: response.url(), status: response.status() }); });
const open = (route) => page.goto(`${base}${route}`, { waitUntil: "networkidle0" });
try {
  check("26 canonical routes", routes.length === 26, routes.length);
  for (const width of process.env.QA_SUPPLEMENT_ONLY ? [] : [360, 390, 768, 1024, 1440, 1920]) {
    await page.setViewport({ width, height: width < 768 ? 844 : 900, deviceScaleFactor: 1 });
    for (const route of routes) {
      const response = await open(route);
      await page.evaluate(async () => {
        await document.fonts.ready;
        const height = Math.min(document.documentElement.scrollHeight, 40000);
        for (let y = 0; y < height; y += innerHeight * 0.8) {
          scrollTo(0, y);
          await new Promise((resolve) => setTimeout(resolve, 30));
        }
        await Promise.race([Promise.all([...document.images].map((image) => image.decode().catch(() => {}))), new Promise((resolve) => setTimeout(resolve, 2500))]);
        scrollTo(0, 0);
      });
      const state = await page.evaluate(() => ({
        h1: document.querySelectorAll("h1").length,
        canonical: document.querySelector("link[rel='canonical']")?.href,
        title: document.title,
        description: document.querySelector("meta[name='description']")?.content,
        overflow: document.documentElement.scrollWidth - innerWidth,
        brokenImages: [...document.images].filter((image) => image.complete && !image.naturalWidth).map((image) => image.currentSrc || image.src),
        deferredImages: [...document.images].filter((image) => !image.complete).map((image) => image.currentSrc || image.src),
      }));
      check(`${route} @${width}`, [200, 304].includes(response.status()) && state.h1 === 1 && state.overflow <= 1 && !!state.title && !!state.description && state.canonical === `https://www.abwebstudio.com.au${route === "/" ? "/" : route}` && state.brokenImages.length === 0, { status: response.status(), ...state });
      if ([390, 1440].includes(width)) {
        const representative = ["/", "/work", routes.find((item) => item.startsWith("/work/")), "/services", routes.find((item) => item.startsWith("/services/")), "/about", "/contact", "/privacy"];
        if (representative.includes(route)) {
          await new Promise((resolve) => setTimeout(resolve, 1200));
          await page.addScriptTag({ content: axe });
          const results = await page.evaluate(async () => window.axe.run(document, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"] } }));
          report.accessibility.push({ route, width, violations: results.violations, incomplete: results.incomplete });
          check(`WCAG automated ${route} @${width}`, results.violations.length === 0, results.violations.map(({ id, nodes }) => ({ id, targets: nodes.map((node) => node.target) })));
        }
        if (["/", "/work", "/contact"].includes(route)) {
          await page.addStyleTag({ content: "*{content-visibility:visible!important}[data-reveal],.reveal{animation:none!important;opacity:1!important;transform:none!important;translate:none!important;filter:none!important;clip-path:none!important}" });
          await page.evaluate(async () => { await document.fonts.ready; scrollTo(0, 0); });
          await new Promise((resolve) => setTimeout(resolve, 500));
          await page.screenshot({ path: path.join(output, `${width}-${route === "/" ? "home" : route.slice(1)}.png`), fullPage: true });
          if (route === "/") await page.screenshot({ path: path.join(output, `${width}-home-fold.png`) });
        }
      }
    }
    console.log(`Completed ${width}px`);
  }
  for (const viewport of [{ width: 320, height: 720 }, { width: 844, height: 390 }]) {
    await page.setViewport(viewport);
    for (const route of ["/", "/work", "/services", "/contact"]) {
      await open(route);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
      check(`${route} narrow/landscape ${viewport.width}x${viewport.height}`, overflow <= 1, overflow);
    }
  }
  if (process.env.QA_SUPPLEMENT_ONLY) {
    for (const width of [390, 1440]) {
      await page.setViewport({ width, height: width === 390 ? 844 : 900 });
      for (const route of ["/", "/work", "/contact"]) {
        await open(route);
        if (route === "/work") {
          await page.$eval(".gr-wi-list", (element) => element.scrollIntoView({ block: "start" }));
          await new Promise((resolve) => setTimeout(resolve, 1500));
          await page.addScriptTag({ content: axe });
          const results = await page.evaluate(async () => window.axe.run(document, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"] } }));
          report.accessibility.push({ route, width, violations: results.violations, incomplete: results.incomplete });
          check(`Natural settled WCAG ${route} @${width}`, results.violations.length === 0, results.violations.map(({ id, nodes }) => ({ id, targets: nodes.map((node) => node.target) })));
        }
        await page.addStyleTag({ content: "*{content-visibility:visible!important}[data-reveal],.reveal{animation:none!important;opacity:1!important;transform:none!important;translate:none!important;filter:none!important;clip-path:none!important}" });
        await page.evaluate(async () => { await document.fonts.ready; await Promise.race([Promise.all([...document.images].map((image) => image.decode().catch(() => {}))), new Promise((resolve) => setTimeout(resolve, 2500))]); scrollTo(0, 0); });
        await new Promise((resolve) => setTimeout(resolve, 500));
        await page.screenshot({ path: path.join(output, `${width}-${route === "/" ? "home" : route.slice(1)}.png`), fullPage: true });
        if (route === "/") await page.screenshot({ path: path.join(output, `${width}-home-fold.png`) });
      }
    }
  }
  await page.setViewport({ width: 390, height: 844 });
  for (const route of ["/", "/contact"]) {
    for (const status of [503, 200]) {
      mockedStatus = status;
      await open(route);
      const beforeInvalid = mockedRequests;
      await page.$eval(".contact-form", (form) => form.requestSubmit());
      await page.waitForFunction(() => document.querySelector("#full-name")?.getAttribute("aria-invalid") === "true");
      const invalid = await page.evaluate(() => ({ focused: document.activeElement?.id, linked: document.querySelector("#full-name")?.getAttribute("aria-describedby"), error: document.querySelector("#full-name-error")?.textContent, valid: document.querySelector(".contact-form")?.checkValidity() }));
      check(`${route} ${status} required fields block sending with accessible errors`, mockedRequests === beforeInvalid && invalid.focused === "full-name" && invalid.linked === "full-name-error" && !!invalid.error && invalid.valid === false, invalid);
      await page.evaluate(() => { window.__qaSuccess = 0; window.addEventListener("ab:enquiry-success", () => window.__qaSuccess++); });
      await page.type("#full-name", "Browser QA");
      await page.type("#email", "qa@example.invalid");
      await page.type("#message", "Mocked browser test only. No real delivery.");
      await page.select("#budget", "Under $1,500");
      const before = mockedRequests;
      const beforeLeads = analyticsEvents.filter((event) => event.event_name === "project_enquiry").length;
      await page.$eval(".contact-form", (form) => form.requestSubmit());
      await page.waitForSelector(".contact-form[aria-busy='true']");
      check(`${route} ${status} loading disables submit`, await page.$eval(".contact-form button[type='submit']", (button) => button.disabled));
      await page.$eval(".contact-form", (form) => form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true })));
      await page.waitForSelector(`.form-status.${status === 200 ? "success" : "error"}`);
      const state = await page.evaluate(() => ({ name: document.querySelector("#full-name").value, budget: document.querySelector("#budget").value, successes: window.__qaSuccess }));
      check(`${route} ${status} duplicate guard and success-only event`, mockedRequests === before + 1 && state.successes === (status === 200 ? 1 : 0) && state.name === (status === 200 ? "" : "Browser QA") && (status === 200 || state.budget === "Under $1,500"), state);
      if (status === 200) await page.waitForFunction(() => window.__qaSuccess === 1);
      await new Promise((resolve) => setTimeout(resolve, 150));
      const leads = analyticsEvents.filter((event) => event.event_name === "project_enquiry").slice(beforeLeads);
      check(`${route} ${status} analytics records only one successful lead without enquiry data`, leads.length === (status === 200 ? 1 : 0) && leads.every((event) => event.path === route && event.label === "contact_form" && !Object.hasOwn(event, "email") && !Object.hasOwn(event, "message")), leads);
    }
  }
  for (const width of [390, 1440]) {
    await page.setViewport({ width, height: width === 390 ? 844 : 900 });
    await open("/work");
    const focus = await page.$eval(".gr-wi-list a[href^='/work/']", (link) => {
      link.focus();
      const ancestor = link.closest("[data-reveal],.reveal");
      const style = getComputedStyle(ancestor || link);
      return { focused: document.activeElement === link, opacity: style.opacity, filter: style.filter, transform: style.transform, animation: style.animationName };
    });
    check(`Keyboard project focus restores visible ancestor @${width}`, focus.focused && focus.opacity === "1" && focus.filter === "none" && focus.transform === "none" && focus.animation === "none", focus);
  }
  await page.setViewport({ width: 390, height: 844 });
  await open("/");
  await page.$eval(".menu-toggle", (button) => button.focus());
  await page.keyboard.press("Enter");
  await page.waitForFunction(() => document.activeElement.closest("#primary-navigation"));
  check("Mobile navigation keyboard focus", await page.evaluate(() => !!document.activeElement.closest("#primary-navigation")));
  await page.keyboard.press("Escape");
  check("Mobile navigation Escape restores focus", await page.$eval(".menu-toggle", (button) => button === document.activeElement && button.getAttribute("aria-expanded") === "false"));
  await page.setViewport({ width: 1440, height: 900 });
  await page.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "reduce" }]);
  await open("/");
  check("Reduced-motion static hero", await page.$(".hero-3d-bg-wrap canvas") === null && await page.$eval(".hero-3d-fallback", (element) => element.getBoundingClientRect().height > 0));
  for (const mode of ["render", "failure"]) {
    const target = await browser.newPage();
    const targetErrors = [];
    target.on("pageerror", (error) => targetErrors.push({ type: "exception", message: error.message }));
    target.on("console", (message) => {
      if (message.type() !== "error") return;
      if (mode === "failure" && /^(?:THREE\.WebGLRenderer: ){1,2}Error creating WebGL context\.?$/.test(message.text())) return;
      targetErrors.push({ type: "console", message: message.text() });
    });
    target.on("requestfailed", (request) => {
      if (request.failure()?.errorText !== "net::ERR_ABORTED") targetErrors.push({ type: "network", url: request.url(), message: request.failure()?.errorText });
    });
    target.on("response", (response) => {
      if (response.status() >= 400) targetErrors.push({ type: "http", url: response.url(), status: response.status() });
    });
    await target.setViewport({ width: 1440, height: 900 });
    await target.setRequestInterception(true);
    target.on("request", (request) => {
      const url = new URL(request.url());
      if (url.pathname === "/api/contact" || url.pathname === "/api/analytics" || url.pathname.startsWith("/_vercel/")) void request.respond({ status: 200, body: "" });
      else void request.continue();
    });
    await target.evaluateOnNewDocument((mode) => {
      Object.defineProperty(navigator, "hardwareConcurrency", { value: 8 });
      Object.defineProperty(navigator, "deviceMemory", { value: 8 });
      if (mode === "failure") {
        const original = HTMLCanvasElement.prototype.getContext;
        HTMLCanvasElement.prototype.getContext = function (type, ...args) { return /webgl/.test(type) ? null : original.call(this, type, ...args); };
      }
    }, mode);
    await target.goto(base, { waitUntil: "networkidle0" });
    const bounds = await target.$eval(".hero-3d-bg-wrap", (element) => { const rect = element.getBoundingClientRect(); return { x: rect.x + rect.width / 2, y: rect.y + Math.min(rect.height / 2, 300) }; });
    await target.mouse.move(bounds.x, bounds.y);
    if (mode === "render") {
      const canvas = await target.waitForSelector(".hero-3d-bg-wrap canvas", { timeout: 15000 }).catch(() => null);
      const rendered = canvas && await target.waitForFunction(() => {
        const container = document.querySelector(".hero-3d-container[data-render-ready='true']");
        const canvas = container?.querySelector("canvas");
        return !!canvas && canvas.width > 0 && canvas.height > 0 && Number(getComputedStyle(canvas).opacity) >= 0.99;
      }, { timeout: 15000 }).then(() => true).catch(() => false);
      check("Desktop pointer intent renders visible WebGL canvas", !!rendered);
      if (canvas) {
        await target.screenshot({ path: path.join(output, "1440-home-webgl.png") });
        await canvas.evaluate((element) => element.dispatchEvent(new Event("webglcontextlost", { cancelable: true })));
        const restored = await target.waitForFunction(() => {
          const fallback = document.querySelector(".hero-3d-fallback");
          return !document.querySelector(".hero-3d-bg-wrap canvas") && fallback?.getBoundingClientRect().height > 0 && Number(getComputedStyle(fallback).opacity) >= 0.99;
        }, { timeout: 10000 }).then(() => true).catch(() => false);
        check("WebGL context loss restores visible fallback", restored);
      }
    } else {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      check("Unavailable WebGL retains fallback", await target.$(".hero-3d-bg-wrap canvas") === null && await target.$eval(".hero-3d-fallback", (element) => element.getBoundingClientRect().height > 0));
    }
    check(`Desktop WebGL ${mode} has no unexpected browser failures`, targetErrors.length === 0, targetErrors);
    await target.close();
  }
  await page.setJavaScriptEnabled(false);
  for (const route of ["/", "/work", "/contact"]) {
    await open(route);
    const state = await page.evaluate(() => ({ heading: document.querySelector("h1")?.textContent.trim(), email: !!document.querySelector("a[href='mailto:admin@abwebstudio.com.au']"), projectCount: new Set([...document.querySelectorAll("a[href^='/work/']")].map((link) => link.getAttribute("href"))).size }));
    check(`No JavaScript ${route}`, !!state.heading && state.email && (route !== "/work" || state.projectCount === 14), state);
  }
  check("No console, exception or network failures", report.browserErrors.length === 0, report.browserErrors);
} catch (error) { check("Harness completed", false, error.stack); }
finally {
  await browser.close();
  await writeFile(path.join(output, process.env.QA_SUPPLEMENT_ONLY ? "report-supplement.json" : "report.json"), JSON.stringify(report, null, 2));
  console.log(JSON.stringify({ passed: report.checks.filter((item) => item.passed).length, failed: report.checks.filter((item) => !item.passed) }, null, 2));
  if (report.checks.some((item) => !item.passed)) process.exitCode = 1;
}
