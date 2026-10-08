import puppeteer from "puppeteer";
import sharp from "sharp";
import { readFile, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const base = process.env.QA_BASE_URL || "http://127.0.0.1:3100";
if (!["127.0.0.1", "localhost"].includes(new URL(base).hostname)) throw new Error("QA requires localhost.");
const output = path.resolve("test-results/signal");
await mkdir(output, { recursive: true });
const projects = [...(await readFile("app/project-data.ts", "utf8")).matchAll(/slug: "([^"]+)"/g)].map((match) => match[1]);
const services = [...(await readFile("app/services/service-data.ts", "utf8")).matchAll(/slug: "([^"]+)"/g)].map((match) => match[1]);
const routes = ["/", "/work", ...projects.map((slug) => `/work/${slug}`), "/services", ...services.map((slug) => `/services/${slug}`), "/about", "/contact", "/privacy"];
const representatives = ["/", "/work", `/work/${projects[0]}`, "/services", `/services/${services[0]}`, "/about", "/contact", "/privacy"];
const results = [];
const errors = [];
const internalLinks = new Set();
const check = (name, passed, detail) => { results.push({ name, passed, detail }); if (!passed) console.log("FAIL", name, JSON.stringify(detail)); };
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const browser = await puppeteer.launch({ headless: true });
let contactStatus = 200;
let contactDelay = 0;
let contactRequests = 0;
async function prepare(page) {
  page.on("pageerror", (error) => errors.push({ url: page.url(), message: error.message }));
  page.on("console", (message) => {
    const forcedContextFailure = page.forcingWebGLFailure && /THREE\.WebGLRenderer: Error creating WebGL context/.test(message.text());
    if (message.type() === "error" && !forcedContextFailure && !message.location().url?.includes("/api/contact")) errors.push({ url: page.url(), message: message.text() });
  });
  await page.setRequestInterception(true);
  page.on("request", async (request) => {
    const url = new URL(request.url());
    if (url.pathname === "/api/contact") {
      contactRequests++;
      await wait(contactDelay);
      await request.respond({ status: contactStatus, contentType: "application/json", body: JSON.stringify(contactStatus === 200 ? { ok: true } : { error: contactStatus === 429 ? "QA rate limit. Please try again later." : "QA provider unavailable. Please email the studio." }) });
    } else if (url.pathname === "/api/analytics") await request.respond({ status: 204 });
    else if (url.pathname === "/_vercel/speed-insights/script.js") await request.respond({ status: 200, contentType: "application/javascript", body: "" });
    else await request.continue();
  });
}
const page = await browser.newPage();
await prepare(page);
async function open(route) {
  await page.goto(`${base}${route}`, { waitUntil: "networkidle0" });
  await page.evaluate(() => document.fonts.ready);
}
async function reveal() {
  await page.evaluate(async () => {
    for (let y = 0; y < document.documentElement.scrollHeight; y += innerHeight * .8) {
      scrollTo(0, y);
      await new Promise((resolve) => setTimeout(resolve, 35));
    }
    for (const image of document.images) {
      if (!image.getClientRects().length) continue;
      if (image.complete && image.naturalWidth) continue;
      image.scrollIntoView({ block: "center", behavior: "instant" });
      await Promise.race([
        image.decode().catch(() => {}),
        new Promise((resolve) => setTimeout(resolve, 3000)),
      ]);
    }
    await Promise.race([
      Promise.all([...document.images].map((image) => image.decode().catch(() => {}))),
      new Promise((resolve) => setTimeout(resolve, 3000)),
    ]);
    scrollTo(0, 0);
  });
  await wait(1200);
}
async function capture(width) {
  await page.evaluate(() => {
    const style = document.createElement("style");
    style.id = "qa-capture";
    style.textContent = "*{content-visibility:visible!important;animation:none!important;transition:none!important}[data-reveal],.reveal{opacity:1!important;transform:none!important;translate:none!important;filter:none!important;clip-path:none!important}";
    document.head.append(style);
  });
  await reveal();
  const height = await page.evaluate(() => document.documentElement.scrollHeight);
  const tiles = [];
  for (let top = 0; top < height; top += 4000) {
    const tileHeight = Math.min(4000, height - top);
    const input = await page.screenshot({ clip: { x: 0, y: top, width, height: tileHeight }, captureBeyondViewport: true });
    tiles.push({ input, top, left: 0 });
  }
  await sharp({ create: { width, height, channels: 4, background: "#101114" } }).composite(tiles).png().toFile(path.join(output, `${width}-home.png`));
  await page.evaluate(() => document.getElementById("qa-capture")?.remove());
}
try {
  for (const route of routes) {
    const response = await fetch(`${base}${route}`);
    check(`HTTP ${route}`, response.status === 200, response.status);
  }
  for (const width of [320, 390, 768, 1440, 1920]) {
    await page.setViewport({ width, height: width < 768 ? 844 : 1000, deviceScaleFactor: 1 });
    for (const route of representatives) {
      console.log(`Checking ${width} ${route}`);
      await open(route);
      await reveal();
      const state = await page.evaluate(() => ({
        width: document.documentElement.scrollWidth, viewport: innerWidth,
        h1: document.querySelectorAll("h1").length,
        brokenImages: [...document.images].filter((image) => image.getClientRects().length && (!image.complete || !image.naturalWidth)).map((image) => image.currentSrc || image.src),
        title: document.title, canonical: document.querySelector("link[rel='canonical']")?.href,
        internalLinks: [...document.querySelectorAll("a[href]")].map((element) => new URL(element.href)).filter((url) => url.origin === location.origin).map((url) => url.pathname),
        brokenAnchors: [...document.querySelectorAll("a[href^='#']")].map((element) => element.getAttribute("href").slice(1)).filter((id) => id && !document.getElementById(id)),
        unnamed: [...document.querySelectorAll("button,a[href]")].filter((element) => !element.textContent.trim() && !element.getAttribute("aria-label") && !element.querySelector("img[alt]")).map((element) => element.outerHTML.slice(0, 200)),
        overflow: [...document.querySelectorAll("main *")].filter((element) => { const r = element.getBoundingClientRect(); return r.width && r.right > innerWidth + 1 && getComputedStyle(element).position !== "absolute"; }).slice(0, 6).map((element) => element.className),
      }));
      state.internalLinks.forEach((link) => internalLinks.add(link));
      check(`${width} ${route} layout and semantics`, state.width <= width + 1 && state.h1 === 1 && !state.brokenImages.length && !state.unnamed.length && !state.brokenAnchors.length && state.canonical === `https://www.abwebstudio.com.au${route}` && state.title.includes("AB Web Studio"), state);
      await page.addScriptTag({ path: "node_modules/axe-core/axe.min.js" });
      // Audit the fully revealed steady state, including sections Chromium
      // otherwise excludes while content-visibility keeps them off screen.
      await page.evaluate(() => {
        const style = document.createElement("style");
        style.id = "qa-axe-steady-state";
        style.textContent = "*{content-visibility:visible!important}[data-reveal],.reveal{opacity:1!important;transform:none!important;translate:none!important;filter:none!important;clip-path:none!important;animation:none!important;transition:none!important}";
        document.head.append(style);
      });
      const violations = await page.evaluate(async () => (await window.axe.run(document, {
        runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] },
        // This WCAG 2.5.3 rule remains experimental and is disabled by default.
        rules: { "label-content-name-mismatch": { enabled: true } },
      })).violations.map(({ id, impact, nodes }) => ({ id, impact, nodes: nodes.map((node) => ({ target: node.target, summary: node.failureSummary })) })));
      check(`${width} ${route} axe`, !violations.length, violations);
      await page.evaluate(() => document.getElementById("qa-axe-steady-state")?.remove());
      if (!process.env.QA_SKIP_CAPTURE && route === "/" && [390, 1440, 1920].includes(width)) await capture(width);
    }
    console.log(`Completed ${width}px`);
  }
  for (const link of internalLinks) {
    if (routes.includes(link)) continue;
    const response = await fetch(`${base}${link}`);
    check(`Linked route ${link}`, response.status === 200, response.status);
  }
  await page.setViewport({ width: 390, height: 844 });
  await open("/");
  await page.click(".menu-toggle");
  await wait(500);
  await page.focus(".site-nav a:last-child");
  await page.keyboard.press("Tab");
  check("Mobile Tab wraps to menu toggle", await page.$eval(".menu-toggle", (el) => el === document.activeElement));
  await page.keyboard.down("Shift"); await page.keyboard.press("Tab"); await page.keyboard.up("Shift");
  check("Mobile Shift+Tab wraps to last link", await page.$eval(".site-nav a:last-child", (el) => el === document.activeElement));
  await page.keyboard.press("Escape");
  check("Mobile Escape closes and restores focus", await page.$eval(".menu-toggle", (el) => el.getAttribute("aria-expanded") === "false" && el === document.activeElement));
  for (const status of [200, 503, 429]) {
    contactStatus = status; contactDelay = 400;
    await open("/contact");
    await page.type("#full-name", "QA Local Test");
    await page.type("#email", "qa@example.com");
    await page.type("#message", "Local intercepted enquiry for interface verification.");
    const before = contactRequests;
    await page.$eval(".contact-form", (form) => { form.requestSubmit(); form.requestSubmit(); });
    await page.waitForFunction(() => ["success", "error"].includes(document.querySelector(".contact-form")?.dataset.state));
    const state = await page.$eval(".contact-form", (form) => ({ state: form.dataset.state, busy: form.getAttribute("aria-busy"), text: form.querySelector(".form-status").textContent, disabled: form.querySelector("button[type=submit]").disabled, name: form.querySelector("#full-name").value }));
    check(`Mock contact ${status} and duplicate prevention`, contactRequests - before === 1 && state.state === (status === 200 ? "success" : "error") && state.busy === "false" && !state.disabled && !!state.text && (status !== 200 || !state.name), state);
  }
  await page.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "reduce" }]);
  await page.setViewport({ width: 1440, height: 1000 });
  await open("/");
  await wait(800);
  check("Reduced motion renders sculpture without WebGL", await page.evaluate(() => !!document.querySelector(".signal-fallback svg") && !document.querySelector("canvas")));
  const failedWebGL = await browser.newPage();
  failedWebGL.forcingWebGLFailure = true;
  await prepare(failedWebGL);
  await failedWebGL.setViewport({ width: 1440, height: 1000 });
  await failedWebGL.evaluateOnNewDocument(() => {
    window.qaWebGLAttempts = 0;
    const getContext = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (type, ...args) {
      if (/webgl/i.test(type)) { window.qaWebGLAttempts++; return null; }
      return getContext.call(this, type, ...args);
    };
  });
  await failedWebGL.goto(base, { waitUntil: "networkidle0" });
  await wait(2500);
  check("WebGL creation failure preserves sculpture, headline and enquiry CTA", await failedWebGL.evaluate(() => window.qaWebGLAttempts > 0 && !!document.querySelector(".signal-fallback svg") && !document.querySelector("canvas") && !!document.querySelector("h1")?.textContent.includes("Websites") && !!document.querySelector(".hero-actions a[href='#contact']")));
  await failedWebGL.close();
  const nojs = await browser.newPage();
  await prepare(nojs);
  await nojs.setJavaScriptEnabled(false);
  await nojs.goto(base, { waitUntil: "networkidle0" });
  check("No-JS hero, portfolio, enquiry fallback remain usable", await nojs.evaluate(() => !!document.querySelector("h1")?.textContent.includes("Websites") && !!document.querySelector(".signal-fallback svg") && !!document.querySelector(".signal-work-item") && !!document.querySelector(".contact-form noscript a[href^='mailto:']")));
  await nojs.close();
  check("No unexpected runtime or console errors", !errors.length, errors);
} catch (error) {
  check("QA execution completed", false, error.stack);
} finally {
  await browser.close();
  const summary = { checks: results.length, passed: results.filter((result) => result.passed).length, failed: results.filter((result) => !result.passed).length, projects: projects.length, services: services.length, contactRequests, errors, results };
  await writeFile(path.join(output, "qa.json"), JSON.stringify(summary, null, 2));
  console.log(JSON.stringify({ ...summary, results: undefined }, null, 2));
  process.exitCode = summary.failed ? 1 : 0;
}
