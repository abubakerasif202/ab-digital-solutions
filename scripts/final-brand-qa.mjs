import puppeteer from "puppeteer";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const base = process.env.QA_BASE_URL || "http://localhost:3120";
const homeOnly = process.env.QA_HOME_ONLY === "1";
const contactOnly = process.env.QA_CONTACT_ONLY === "1";
const gpuOnly = process.env.QA_GPU_ONLY === "1";
const finePointer = process.env.QA_FINE_POINTER === "1";
const out = path.resolve(process.env.QA_OUTPUT || "test-results/final-brand", new URL(base).hostname);
await mkdir(out, { recursive: true });
// Headless Linux may have no pointer hardware; opt in to desktop pointer emulation.
const browser = await puppeteer.launch({ headless: true, args: ["--enable-webgl", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", ...(finePointer ? ["--blink-settings=availablePointerTypes=4,primaryPointerType=4,availableHoverTypes=2,primaryHoverType=2"] : [])] });
process.once("SIGINT", async () => { await browser.close(); process.exit(130); });
process.once("SIGTERM", async () => { await browser.close(); process.exit(143); });
const results = { base, pages: [], checks: [], errors: [], consoleErrors: [], httpErrors: [], artifactLimitations: [] };
const checkedAssets = new Set();
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
function check(name, passed, detail) { results.checks.push({ name, passed, detail }); }
async function captureRoute(page, filename) {
  const { height, armed, scrollDriven } = await page.evaluate(() => ({ height: document.documentElement.scrollHeight, armed: document.querySelectorAll('[data-reveal-state="armed"]').length, scrollDriven: [...document.querySelectorAll("main *")].some((el) => getComputedStyle(el).animationTimeline.includes("view(")) }));
  // Full-page captures do not settle observers or offscreen CSS view timelines.
  // Preserve natural rendering and capture viewports when content is still armed.
  if (height <= 16000 && !armed && !scrollDriven) {
    try { await page.screenshot({ path: path.join(out, filename), fullPage: true }); return; }
    catch (error) { results.artifactLimitations.push({ url: page.url(), width: page.viewport().width, height, reason: "full-page capture failed", message: error.message }); }
  } else results.artifactLimitations.push({ url: page.url(), width: page.viewport().width, height, reason: armed || scrollDriven ? "offscreen reveals require viewport captures" : "document exceeds 16000px capture limit" });
  const stem = filename.replace(/\.png$/, "");
  await page.evaluate(() => scrollTo({ top: 0, behavior: "instant" }));
  await page.screenshot({ path: path.join(out, `${stem}-viewport.png`) });
  const selector = "main section, main article, footer";
  const count = await page.$$eval(selector, (elements) => elements.length);
  if (!count) throw new Error(`No meaningful section targets for screenshot fallback: ${page.url()}`);
  for (let index = 0; index < count; index++) {
    await page.evaluate(({ selector, index }) => document.querySelectorAll(selector)[index]?.scrollIntoView({ behavior: "instant" }), { selector, index });
    await delay(1200);
    await page.evaluate(({ selector, index }) => { const element = document.querySelectorAll(selector)[index]; if (element) scrollTo({ top: element.getBoundingClientRect().top + scrollY - 80, behavior: "instant" }); }, { selector, index });
    await delay(300);
    await page.screenshot({ path: path.join(out, `${stem}-viewport-${index}.png`) });
  }
  await page.evaluate(() => scrollTo({ top: 0, behavior: "instant" }));
}
async function pageFor(width, reduced = false) {
  const page = await browser.newPage();
  await page.setViewport({ width, height: 960, deviceScaleFactor: 1, isMobile: width < 768, hasTouch: width < 1024 });
  if (reduced) await page.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "reduce" }]);
  await page.evaluateOnNewDocument(() => {
    Object.defineProperty(navigator, "deviceMemory", { get: () => 8 });
    Object.defineProperty(navigator, "hardwareConcurrency", { get: () => 8 });
    window.__qaDraws = 0;
    for (const Constructor of [window.WebGLRenderingContext, window.WebGL2RenderingContext]) {
      if (!Constructor) continue;
      for (const key of ["drawElements", "drawArrays"]) {
        const original = Constructor.prototype[key];
        Constructor.prototype[key] = function (...args) { window.__qaDraws++; return original.apply(this, args); };
      }
    }
  });
  page.on("pageerror", (error) => results.errors.push({ url: page.url(), type: "pageerror", message: error.message }));
  page.on("console", (message) => { if (message.type() === "error") results.consoleErrors.push({ url: page.url(), source: message.location().url, message: message.text() }); });
  page.on("response", (response) => { if (response.status() >= 400) results.httpErrors.push({ url: response.url(), status: response.status() }); });
  page.on("requestfailed", (request) => {
    if (!request.failure()?.errorText.includes("ERR_ABORTED")) results.errors.push({ url: request.url(), type: "requestfailed", message: request.failure()?.errorText });
  });
  return page;
}
async function visit(page, route) {
  const response = await page.goto(`${base}${route}`, { waitUntil: "domcontentloaded", timeout: 45000 });
  await delay(1800);
  await page.evaluate(async () => {
    await document.fonts.ready;
    for (let top = 0; top < document.documentElement.scrollHeight; top += 650) {
      window.scrollTo({ top, behavior: "instant" });
      await new Promise((resolve) => setTimeout(resolve, 60));
    }
    window.scrollTo({ top: 0, behavior: "instant" });
    await Promise.race([
      Promise.all([...document.images].map((img) => img.complete ? Promise.resolve() : new Promise((resolve) => { img.addEventListener("load", resolve, { once: true }); img.addEventListener("error", resolve, { once: true }); }))),
      new Promise((resolve) => setTimeout(resolve, 5000)),
    ]);
  });
  await delay(600);
  const audit = await page.evaluate(() => ({
    overflow: document.documentElement.scrollWidth > innerWidth + 1,
    scrollWidth: document.documentElement.scrollWidth,
    brokenImages: [...document.images].filter((img) => img.complete && !img.naturalWidth).map((img) => img.currentSrc),
    pendingImages: [...document.images].filter((img) => !img.complete).map((img) => img.currentSrc || img.src),
    visiblePendingImages: [...document.images].filter((img) => { const rect = img.getBoundingClientRect(); return !img.complete && rect.width > 0 && rect.height > 0 && rect.bottom > 0 && rect.top < innerHeight && getComputedStyle(img).visibility !== "hidden"; }).map((img) => img.currentSrc || img.src),
    title: document.title,
    canonical: document.querySelector('link[rel="canonical"]')?.getAttribute("href"),
    description: document.querySelector('meta[name="description"]')?.getAttribute("content"),
    og: document.querySelector('meta[property="og:image"]')?.getAttribute("content"),
    h1: document.querySelectorAll("h1").length,
  }));
  results.pages.push({ route, width: page.viewport().width, status: response?.status(), ...audit });
  check(`${route} ${page.viewport().width}px layout/assets/metadata`, [200, 304].includes(response?.status()) && !audit.overflow && !audit.brokenImages.length && !audit.visiblePendingImages.length && !!audit.title && !!audit.canonical && !!audit.description && audit.h1 === 1, audit);
  const assetUrls = await page.$$eval("img", (elements) => elements.map((img) => img.currentSrc || img.src));
  for (const url of assetUrls) {
    if (!url || checkedAssets.has(url)) continue;
    checkedAssets.add(url);
    const asset = await fetch(url);
    check(`image asset ${url}`, asset.ok && asset.headers.get("content-type")?.startsWith("image/"), asset.status);
    await asset.arrayBuffer();
  }
  return audit;
}
try {
  for (const reducedMotion of gpuOnly ? [] : [false, true]) {
    const suffix = reducedMotion ? "-reduced" : "";
    const contactProbe = await pageFor(390, reducedMotion);
    await contactProbe.goto(`${base}/`, { waitUntil: "domcontentloaded", timeout: 45000 });
    await delay(2400);
    await contactProbe.evaluate(() => document.fonts.ready);
    await contactProbe.tap(".hero-actions .button-primary");
    await delay(2200);
    await contactProbe.evaluate(() => document.fonts.ready);
    check(`primary CTA reaches contact section${suffix}`, new URL(contactProbe.url()).hash === "#contact" && await contactProbe.$(".contact-form") !== null, contactProbe.url());
    await contactProbe.screenshot({ path: path.join(out, `contact-natural-cta-390${suffix}.png`) });
    await contactProbe.goto(`${base}/`, { waitUntil: "domcontentloaded", timeout: 45000 });
    await delay(2200);
    const contactAnchor = await contactProbe.$('a[href="#contact"]');
    if (!contactAnchor) throw new Error("Homepage contact anchor missing for natural navigation probe");
    await contactAnchor.tap();
    await delay(2200);
    await contactProbe.evaluate(() => document.fonts.ready);
    const anchorLanding = await contactProbe.$eval("#contact", (el) => ({ top: el.getBoundingClientRect().top, hash: location.hash }));
    check(`contact anchor lands at section${suffix}`, anchorLanding.hash === "#contact" && Math.abs(anchorLanding.top) < 250, anchorLanding);
    await contactProbe.screenshot({ path: path.join(out, `contact-anchor-landing-390${suffix}.png`) });
    // Diagnose natural landing before separately testing links further down the section.
    const landingReveal = await contactProbe.$eval(".contact-options", (el) => ({ state: el.getAttribute("data-reveal-state"), top: el.getBoundingClientRect().top, opacity: getComputedStyle(el).opacity }));
    check(`contact reveal at anchor landing${suffix}`, landingReveal.top >= 960 || Number(landingReveal.opacity) > 0.95, landingReveal);
    await contactProbe.$eval(".contact-options", (el) => el.scrollIntoView({ block: "center", behavior: "instant" }));
    await delay(1200);
    const contactVisibility = await contactProbe.$$eval(".contact-options a", (elements) => elements.map((el) => {
      const ancestors = []; let node = el;
      while (node && node instanceof Element) { const style = getComputedStyle(node); ancestors.push({ class: node.className, reveal: node.getAttribute("data-reveal-state"), opacity: style.opacity, visibility: style.visibility, display: style.display, contentVisibility: style.contentVisibility }); node = node.parentElement; }
      const rect = el.getBoundingClientRect();
      return { href: el.getAttribute("href"), rect: rect.toJSON(), ancestors, visible: rect.width > 0 && rect.height > 0 && rect.bottom > 0 && rect.top < innerHeight && ancestors.every((item) => Number(item.opacity) > 0.95 && item.visibility === "visible" && item.display !== "none" && item.contentVisibility !== "hidden") };
    }));
    results.contactNaturalVisibility ??= [];
    results.contactNaturalVisibility.push({ reducedMotion, links: contactVisibility });
    check(`natural contact anchor reveals direct links${suffix}`, contactVisibility.length > 0 && contactVisibility.every((item) => item.visible), contactVisibility);
    await contactProbe.screenshot({ path: path.join(out, `home-contact-natural-390${suffix}.png`) });
    await contactProbe.close();
  }
  if (!contactOnly) {
    if (!gpuOnly) {
      const routes = ["/work", "/services", "/about", "/contact"];
      for (const [file, prefix] of [["app/project-data.ts", "/work/"], ["app/services/service-data.ts", "/services/"]]) {
        const source = await readFile(file, "utf8");
        for (const match of source.matchAll(/slug:\s*"([^"]+)"/g)) routes.push(prefix + match[1]);
      }
      for (const width of [320, 375, 390, 768, 1024, 1440, 1920]) {
        const page = await pageFor(width);
        await visit(page, "/");
        await page.screenshot({ path: path.join(out, `home-${width}-fold.png`) });
        await captureRoute(page, `home-${width}-full.png`);
        if (width <= 960) {
          await page.click(".menu-toggle");
          check(`mobile menu ${width}px opens`, await page.$eval(".menu-toggle", (el) => el.getAttribute("aria-expanded") === "true"));
          await page.keyboard.press("Escape");
          check(`mobile menu ${width}px closes`, await page.$eval(".menu-toggle", (el) => el.getAttribute("aria-expanded") === "false"));
          check(`touch ${width}px skips GPU`, await page.$(".hero-3d-bg-wrap canvas") === null);
        }
        await page.close();
      }
      for (const width of homeOnly ? [] : [320, 375, 390, 768, 1024, 1440, 1920]) {
        const page = await pageFor(width);
        for (const route of [...new Set(routes)].filter((route) => !route.slice(1).includes("/") || width === 375 || width === 1440)) {
          await visit(page, route);
          await captureRoute(page, `${route.slice(1).replaceAll("/", "-")}-${width}.png`);
        }
        await page.close();
      }
      const form = await pageFor(390);
      await visit(form, "/contact");
      await form.setRequestInterception(true);
      let mockStatus = 200;
      let submissions = 0;
      form.on("request", (request) => {
        if (new URL(request.url()).pathname === "/api/contact" && request.method() === "POST") {
          submissions++;
          void request.respond({ status: mockStatus, contentType: "application/json", body: JSON.stringify(mockStatus === 200 ? { success: true } : { error: "QA simulated delivery failure" }) });
        } else void request.continue();
      });
      await form.click('button[type="submit"]');
      await delay(200);
      check("required form fields block submission", submissions === 0);
      for (const status of [200, 503]) {
        mockStatus = status;
        await form.type('[name="fullName"]', "QA Test");
        await form.type('[name="email"]', "qa@example.invalid");
        await form.type('[name="message"]', "Browser QA mocked request. No real enquiry is sent.");
        await form.click('button[type="submit"]');
        await form.waitForFunction((state) => document.querySelector(".contact-form")?.getAttribute("data-state") === state, { timeout: 10000 }, status === 200 ? "success" : "error");
        check(`mock form ${status}`, true, await form.$eval(".form-status", (el) => el.textContent));
      }
      await form.close();
      for (const route of ["/sitemap.xml", "/robots.txt", "/opengraph-image"]) {
        const response = await fetch(`${base}${route}`);
        check(`${route} loads`, response.ok, { status: response.status, type: response.headers.get("content-type") });
        await response.arrayBuffer();
      }
    }
    const gpu = await pageFor(1440);
    await visit(gpu, "/");
    if (finePointer) check("fine pointer emulation active", await gpu.evaluate(() => matchMedia("(hover: hover) and (pointer: fine)").matches));
    const bounds = await gpu.$eval(".hero-3d-bg-wrap", (el) => { const rect = el.getBoundingClientRect(); return { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 }; });
    await gpu.mouse.move(bounds.x, bounds.y);
    let activated = true;
    try { await gpu.waitForSelector(".hero-3d-bg-wrap canvas", { timeout: 12000 }); } catch { activated = false; }
    check("desktop pointer activates GPU", activated);
    if (activated) {
      await gpu.waitForSelector('.hero-3d-container[data-render-ready="true"]', { timeout: 15000 });
      await delay(600);
      check("GPU artwork crossfade completes", await gpu.$eval(".hero-3d-container", (el) => getComputedStyle(el.querySelector("canvas")).opacity === "1" && getComputedStyle(el.querySelector(".hero-3d-fallback")).opacity === "0"));
      await gpu.screenshot({ path: path.join(out, "gpu-1440.png") });
      const start = await gpu.evaluate(() => window.__qaDraws);
      await gpu.mouse.move(bounds.x + 40, bounds.y + 30);
      await delay(1000);
      const pointer = await gpu.evaluate(() => ({ fineHover: matchMedia("(hover: hover) and (pointer: fine)").matches, draws: window.__qaDraws }));
      check(pointer.fineHover ? "GPU draws after fine pointer input" : "GPU skips pointer parallax without fine hover", pointer.fineHover ? pointer.draws > start : pointer.draws === start, pointer);
      let settled = false;
      const deadline = Date.now() + 12000;
      while (Date.now() < deadline) {
        const count = await gpu.evaluate(() => window.__qaDraws);
        await delay(500);
        if (await gpu.evaluate(() => window.__qaDraws) === count) { settled = true; break; }
      }
      check("GPU sleeps after pointer settles", settled);
      await gpu.evaluate(() => scrollTo({ top: document.body.scrollHeight, behavior: "instant" }));
      await delay(1000);
      const offscreen = await gpu.evaluate(() => window.__qaDraws);
      await delay(1000);
      check("GPU sleeps offscreen", await gpu.evaluate(() => window.__qaDraws) === offscreen);
      await gpu.evaluate(() => { const canvas = document.querySelector(".hero-3d-bg-wrap canvas"); canvas?.dispatchEvent(new Event("webglcontextlost", { cancelable: true })); });
      await delay(500);
      check("context loss restores fallback", await gpu.$eval(".hero-3d-fallback", (el) => getComputedStyle(el).opacity !== "0") && await gpu.$(".hero-3d-bg-wrap canvas") === null);
    }
    await gpu.close();
    const reduced = await pageFor(1440, true);
    await visit(reduced, "/");
    await reduced.mouse.move(850, 350);
    await delay(2000);
    check("reduced motion skips GPU", await reduced.$(".hero-3d-bg-wrap canvas") === null);
    await reduced.close();
  }
} catch (error) {
  results.errors.push({ type: "runner", message: error.stack });
} finally {
  await browser.close();
  const local = ["localhost", "127.0.0.1"].includes(new URL(base).hostname);
  const expectedHttp = (entry) => (local && entry.status === 404 && new URL(entry.url).pathname.startsWith("/_vercel/speed-insights/")) || (entry.status === 503 && new URL(entry.url).pathname === "/api/contact");
  check("no unexpected HTTP errors", results.httpErrors.every(expectedHttp), results.httpErrors);
  const unexpectedConsole = results.consoleErrors.filter((entry) => {
    if (local && entry.message.includes(`${base}/_vercel/speed-insights/script.js`) && entry.message.startsWith("Refused to execute script") && entry.message.includes("MIME type")) return false;
    if (local && entry.source && new URL(entry.source, base).pathname.startsWith("/_vercel/speed-insights/") && entry.message.includes("404")) return false;
    if (entry.source && new URL(entry.source, base).pathname === "/api/contact" && entry.message.includes("503")) return false;
    return true;
  });
  check("no unexpected console errors", unexpectedConsole.length === 0, unexpectedConsole);
  results.summary = { status: results.errors.length || results.checks.some((item) => !item.passed) ? "FAIL" : "PASS", pages: results.pages.length, passed: results.checks.filter((item) => item.passed).length, failed: results.checks.filter((item) => !item.passed).length, runtimeErrors: results.errors.length, artifactLimitations: results.artifactLimitations.length };
  await writeFile(path.join(out, contactOnly ? "results-contact-probe.json" : gpuOnly ? finePointer ? "results-gpu-fine-probe.json" : "results-gpu-probe.json" : "results.json"), JSON.stringify(results, null, 2));
  console.log(JSON.stringify({ out, summary: results.summary, pages: results.pages.length, checks: results.checks.length, failures: results.checks.filter((item) => !item.passed), errors: results.errors }, null, 2));
  process.exitCode = results.errors.length || results.checks.some((item) => !item.passed) ? 1 : 0;
}
