import puppeteer from "puppeteer";
import { readFile, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const base = process.env.QA_BASE_URL || "http://127.0.0.1:3100";
const isLocal = ["localhost", "127.0.0.1", "[::1]"].includes(new URL(base).hostname);
const output = path.resolve(process.env.QA_OUTPUT || "test-results/cinematic");
await mkdir(output, { recursive: true });
const registry = await readFile("app/project-data.ts", "utf8");
const serviceRegistry = await readFile("app/services/service-data.ts", "utf8");
const config = await readFile("app/site-config.ts", "utf8");
const canonicalOrigin = config.match(/url: "([^"]+)"/)[1];
const canonicalHome = new URL(canonicalOrigin).href;
const slugs = [...registry.matchAll(/slug: "([^"]+)"/g)].map((match) => match[1]);
const urls = [...registry.matchAll(/url: "([^"]+)"/g)].map((match) => match[1]);
const serviceSlugs = [...serviceRegistry.matchAll(/slug: "([^"]+)"/g)].map((match) => match[1]);
const results = [];
const check = (name, passed, detail = null) => results.push({ name, passed, detail });
const browser = await puppeteer.launch({ headless: true });
const errors = [];
const assetFailures = [];
const contactPayloads = [];
const contactInterceptionFailures = [];
let mockedStatus = 200;
let mockedRequests = 0;
const mockedMessage = (status) => status === 429 ? "Too many enquiries. Please wait a few minutes or contact us directly." : "QA simulated provider failure";
const page = await browser.newPage();
const monitor = (target, scenario = "live") => {
  target.on("pageerror", (error) => errors.push({ page: target.url(), scenario, message: error.message }));
  target.on("console", (message) => { if (message.type() === "error") errors.push({ page: target.url(), scenario, message: `${message.location().url || "console"} ${message.text()}` }); });
  target.on("response", (response) => {
    if (response.status() >= 400 && response.request().resourceType() !== "document" && new URL(response.url()).pathname !== "/api/contact") {
      assetFailures.push({ page: target.url(), url: response.url(), status: response.status(), type: response.request().resourceType() });
    }
  });
  target.on("requestfailed", (request) => assetFailures.push({ page: target.url(), url: request.url(), type: request.resourceType(), error: request.failure()?.errorText }));
};
monitor(page);
const interceptRequests = async (target) => {
  await target.setRequestInterception(true);
  target.on("request", async (request) => {
    const pathname = new URL(request.url()).pathname;
    if (isLocal && pathname === "/_vercel/speed-insights/script.js") {
      void request.respond({ status: 200, contentType: "application/javascript", body: "/* Vercel edge script is unavailable on the local Next.js server. */" });
    } else if (pathname === "/api/contact") {
      mockedRequests++;
      try {
        contactPayloads.push(JSON.parse(request.postData() || "{}"));
        await request.respond({ status: mockedStatus, contentType: "application/json", body: JSON.stringify(mockedStatus === 200 ? { success: true } : { error: mockedMessage(mockedStatus) }) });
      } catch (error) {
        contactInterceptionFailures.push({ method: request.method(), contentType: request.headers()["content-type"], error: error.message });
        // Never continue an unexpected/native submission to a real endpoint.
        if (!request.isInterceptResolutionHandled()) {
          await request.abort("failed").catch((abortError) => contactInterceptionFailures.push({ error: abortError.message }));
        }
      }
    } else void request.continue();
  });
};
await interceptRequests(page);
const open = async (route = "/") => {
  const response = await page.goto(`${base}${route}`, { waitUntil: "networkidle0" });
  await page.evaluate(() => document.fonts.ready);
  return response;
};
const settle = () => page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));
const revealSections = async (target = page) => {
  for (const section of await target.$$("main section, main [data-reveal], .site-footer, .site-footer [data-reveal]")) {
    await section.evaluate((element) => element.scrollIntoView({ behavior: "instant", block: "center" }));
    await target.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    await target.waitForFunction(() => document.getAnimations().every((animation) => !(animation.timeline instanceof DocumentTimeline) || animation.effect?.getComputedTiming().iterations === Infinity || animation.playState !== "running"));
  }
};
const assertImages = async (label) => {
  await page.waitForFunction(() => [...document.images].every((image) => image.complete && image.naturalWidth > 0), { timeout: 10000 }).catch(() => {});
  const brokenImages = await page.evaluate(() => [...document.images].filter((image) => !image.complete || image.naturalWidth === 0).map((image) => ({ src: image.currentSrc || image.src, alt: image.alt })));
  check(`${label} images loaded`, brokenImages.length === 0, brokenImages);
};
const stabilizeCapture = async (target = page) => {
  // Chromium full-page capture can retain stale offscreen intrinsic sizes.
  // Reveal content first; override only the capture optimization, after checks.
  await target.evaluate(() => {
    for (const element of document.querySelectorAll("main, main *")) {
      if (getComputedStyle(element).contentVisibility === "auto") element.style.contentVisibility = "visible";
    }
  });
  await target.evaluate(() => document.fonts.ready);
  await target.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));
};
const captureFullPage = async (target, filename) => {
  const { width, height } = await target.evaluate(() => ({ width: innerWidth, height: Math.ceil(document.documentElement.scrollHeight) }));
  if (height <= 16000) {
    await target.screenshot({ path: filename, fullPage: true });
    return;
  }
  const tiles = [];
  // Keep each Chromium surface below its 16,384px raster limit.
  for (let top = 0; top < height; top += 8000) {
    const input = Buffer.from(await target.screenshot({ clip: { x: 0, y: top, width, height: Math.min(8000, height - top) }, captureBeyondViewport: true }));
    tiles.push({ input, top, left: 0 });
  }
  await sharp({ create: { width, height, channels: 3, background: "#070707" } }).composite(tiles).png().toFile(filename);
};
const staticMode = async (name, width, reducedMotion) => {
  const target = await browser.newPage();
  monitor(target);
  await interceptRequests(target);
  const heavyScripts = [];
  const inspections = [];
  target.on("response", (response) => {
    if (response.request().resourceType() === "script") inspections.push(response.text().then((body) => {
      if (/THREE\.WebGLRenderer|THREE\.WebGLProgram|WebGLRenderer:/.test(body)) heavyScripts.push(response.url());
    }).catch(() => {}));
  });
  await target.setViewport({ width, height: width < 720 ? 844 : 900 });
  if (reducedMotion) await target.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "reduce" }]);
  await target.evaluateOnNewDocument(() => {
    window.__qaWebGLAttempts = 0;
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (type, ...args) {
      if (/webgl/.test(type)) window.__qaWebGLAttempts++;
      return original.call(this, type, ...args);
    };
  });
  await target.goto(base, { waitUntil: "networkidle0" });
  await target.waitForFunction(() => document.readyState === "complete" && !!document.querySelector(".hero-3d-fallback"));
  await Promise.all(inspections);
  const state = await target.evaluate(() => ({ attempts: window.__qaWebGLAttempts, canvas: !!document.querySelector(".hero-3d-bg-wrap canvas"), cursor: !!document.querySelector(".cursor-dot,.cursor-ring"), runningAnimations: document.getAnimations().filter((animation) => animation.playState === "running").length }));
  check(`${name} skips WebGL and Three.js scripts`, state.attempts === 0 && !state.canvas && heavyScripts.length === 0, { ...state, heavyScripts });
  if (reducedMotion) check("Reduced motion disables cursor and running animations", !state.cursor && state.runningAnimations === 0, state);
  await revealSections(target);
  await stabilizeCapture(target);
  await target.evaluate(() => scrollTo({ top: 0, behavior: "instant" }));
  await captureFullPage(target, path.join(output, `${name}.png`));
  await target.close();
};
try {
  for (const [width, height] of [[1440, 900], [1280, 800], [1024, 768], [768, 1024], [430, 932], [390, 844], [360, 800]]) {
    await page.setViewport({ width, height, deviceScaleFactor: 1 });
    await open();
    // Visit sections first so content-visibility and IntersectionObserver reveal
    // states are exercised before measuring the fully rendered document.
    await revealSections();
    await assertImages(`Homepage ${width}`);
    const brandImages = await page.evaluate(() => [...document.querySelectorAll(".brand-lockup img,.brand-artwork")].map((image) => ({ src: image.getAttribute("src"), loaded: image.complete && image.naturalWidth > 0 })));
    check(`Luxury brand images ${width} are retained and loaded`, brandImages.length === 5 && brandImages.every((image) => image.loaded && /ab-(?:luxury-|logo-luxury)/.test(image.src)), brandImages);
    const overflow = await page.evaluate(() => ({
      documentWidth: document.documentElement.scrollWidth,
      viewport: innerWidth,
      offenders: [...document.querySelectorAll("main *")].filter((element) => {
        const rect = element.getBoundingClientRect();
        return rect.width > 0 && (rect.left < -1 || rect.right > innerWidth + 1) && getComputedStyle(element).position !== "absolute";
      }).slice(0, 15).map((element) => ({ tag: element.tagName, className: element.className, rect: element.getBoundingClientRect().toJSON() })),
    }));
    check(`Homepage ${width} has no document overflow`, overflow.documentWidth <= width + 1, overflow);
    const headingSpacing = await page.evaluate(() => {
      const lines = [...document.querySelectorAll(".hero-title .mask-line > span")];
      const intro = document.querySelector(".hero-intro");
      return lines.length && intro ? { headingBottom: Math.max(...lines.map((line) => line.getBoundingClientRect().bottom)), introTop: intro.getBoundingClientRect().top } : null;
    });
    check(`Homepage ${width} heading does not overlap its introduction`, !!headingSpacing && headingSpacing.introTop >= headingSpacing.headingBottom - 1, headingSpacing);
    const footerRows = await page.evaluate(() => {
      const intro = document.querySelector(".footer-intro");
      const anchor = intro?.querySelector("a:not(.brand)");
      const location = intro?.querySelector(":scope > span");
      return anchor && location ? { domainBottom: anchor.getBoundingClientRect().bottom, locationTop: location.getBoundingClientRect().top } : null;
    });
    check(`Footer ${width} domain and location use separate rows`, !!footerRows && footerRows.locationTop >= footerRows.domainBottom - 1, footerRows);
    await stabilizeCapture();
    await page.evaluate(() => scrollTo({ top: 0, behavior: "instant" }));
    await settle();
    await captureFullPage(page, path.join(output, `home-${width}.png`));
    if ([1440, 390].includes(width)) {
      let cardIndex = 0;
      for (const card of await page.$$("#work .project-card, .capability-card")) {
        await card.evaluate((element) => element.scrollIntoView({ behavior: "instant", block: "center" }));
        await settle();
        await page.screenshot({ path: path.join(output, `${width}-card-${++cardIndex}.png`) });
      }
      for (const selector of [".hero", "#work", "#services", "#process", ".standard-section", "#about", "#contact", ".site-footer"]) {
        const section = await page.$(selector);
        if (section) {
          await section.evaluate((element) => element.scrollIntoView({ behavior: "instant", block: "start" }));
          await settle();
          await section.screenshot({ path: path.join(output, `${width}-${selector.replace(/[.#]/g, "")}.png`) });
        }
      }
    }
  }
  await page.setViewport({ width: 1440, height: 900 });
  await open();
  const homepageMetadata = await page.evaluate(() => ({ title: document.title, canonical: document.querySelector("link[rel='canonical']")?.href, description: document.querySelector("meta[name='description']")?.content, h1: document.querySelectorAll("h1").length, openGraphTitle: document.querySelector("meta[property='og:title']")?.content, openGraphUrl: document.querySelector("meta[property='og:url']")?.content }));
  check("Homepage branding and metadata", homepageMetadata.title.includes("AB Web Studio") && !!homepageMetadata.description && homepageMetadata.h1 === 1 && homepageMetadata.canonical === canonicalHome && homepageMetadata.openGraphTitle?.includes("AB Web Studio") && !!homepageMetadata.openGraphUrl && new URL(homepageMetadata.openGraphUrl).href === canonicalHome, homepageMetadata);
  const iconEvidence = await page.evaluate(async () => {
    const headIcons = [...document.querySelectorAll("link[rel='icon'],link[rel='apple-touch-icon']")].map((link) => link.href);
    const expectedHead = ["/brand/ab-luxury-mark-32.png", "/brand/ab-luxury-mark-64.png", "/brand/ab-luxury-mark-180.png"];
    const manifestResponse = await fetch("/manifest.webmanifest");
    const manifest = manifestResponse.ok ? await manifestResponse.json() : {};
    const manifestIcons = (manifest.icons || []).map((icon) => new URL(icon.src, location.origin).href);
    const decoded = await Promise.all([...headIcons, ...manifestIcons].map(async (url) => {
      try {
        const response = await fetch(url);
        const image = new Image();
        image.src = url;
        await image.decode();
        return { pathname: new URL(url).pathname, status: response.status, contentType: response.headers.get("content-type"), width: image.naturalWidth, height: image.naturalHeight };
      } catch (error) { return { pathname: new URL(url).pathname, error: error.message }; }
    }));
    return { headCorrect: expectedHead.every((pathname) => headIcons.some((url) => new URL(url).pathname === pathname)), manifestStatus: manifestResponse.status, manifestCorrect: ["/brand/ab-luxury-mark-192.png", "/brand/ab-luxury-mark-512.png"].every((pathname) => manifestIcons.some((url) => new URL(url).pathname === pathname)), decoded };
  });
  check("Luxury head and manifest PNG icons return 200 and decode", iconEvidence.headCorrect && iconEvidence.manifestStatus === 200 && iconEvidence.manifestCorrect && iconEvidence.decoded.every((icon) => icon.status === 200 && icon.contentType?.includes("image/png") && icon.width > 0 && icon.height > 0), iconEvidence);
  const homepage = await page.evaluate(() => ({
    projects: [...document.querySelectorAll("#work a[href^='/work/']")].map((a) => a.getAttribute("href")),
    anchors: [...document.querySelectorAll("#primary-navigation a")].map((a) => ({ href: a.getAttribute("href"), valid: !!document.querySelector(a.hash) })),
    logo: (() => {
      const images = [...(document.querySelector(".brand-lockup")?.querySelectorAll("img") || [])];
      return images.length === 2 && images.every((image) => image.complete && image.naturalWidth > 0);
    })(),
    email: [...document.querySelectorAll("a[href^='mailto:']")].some((anchor) => /^mailto:[^@]+@abwebstudio\.com\.au$/.test(anchor.getAttribute("href")) && anchor.textContent.trim() === anchor.getAttribute("href").slice(7)),
    form: !!document.querySelector("form[action='/api/contact']"),
  }));
  check("All canonical projects retained on homepage", slugs.length === 13 && slugs.every((slug) => homepage.projects.includes(`/work/${slug}`)), homepage.projects);
  check("Navigation anchors, contact and logo", homepage.anchors.every((anchor) => anchor.valid) && homepage.logo && homepage.email && homepage.form, homepage);
  const activeSlide = () => page.$eval(".showcase-slides a[aria-hidden='false']", (element) => element.getAttribute("href"));
  const before = await activeSlide();
  await page.click("button[aria-label='Next project']");
  check("Carousel next changes the project", await activeSlide() !== before);
  if (await page.$eval(".slider-controls button[aria-pressed]", (element) => element.getAttribute("aria-pressed") === "true")) {
    await page.click(".slider-controls button[aria-pressed]");
    await settle();
  }
  await page.click(".slider-controls button[aria-pressed]");
  await settle();
  check("Carousel pause is explicit", await page.$eval(".slider-controls button[aria-pressed]", (element) => element.getAttribute("aria-pressed") === "true"));
  await page.setViewport({ width: 390, height: 844 });
  await open();
  await page.click(".menu-toggle");
  await page.waitForFunction(() => document.querySelector(".menu-toggle").getAttribute("aria-expanded") === "true");
  await settle();
  check("Mobile menu initial focus", await page.evaluate(() => !!document.activeElement.closest("#primary-navigation")));
  await page.waitForFunction(() => getComputedStyle(document.querySelector("#primary-navigation")).opacity === "1");
  await page.screenshot({ path: path.join(output, "mobile-menu.png") });
  await page.$eval("#primary-navigation a:last-child", (element) => element.focus());
  await page.keyboard.press("Tab");
  check("Mobile menu traps forward focus", await page.$eval(".menu-toggle", (element) => element === document.activeElement));
  await page.keyboard.down("Shift"); await page.keyboard.press("Tab"); await page.keyboard.up("Shift");
  check("Mobile menu traps reverse focus", await page.$eval("#primary-navigation a:last-child", (element) => element === document.activeElement));
  await page.keyboard.press("Escape");
  await settle();
  check("Escape closes menu and restores focus", await page.$eval(".menu-toggle", (element) => element.getAttribute("aria-expanded") === "false" && element === document.activeElement));
  check("Six canonical service routes retained", serviceSlugs.length === 6, serviceSlugs);
  const routes = ["/work", ...slugs.map((slug) => `/work/${slug}`), "/services", ...serviceSlugs.map((slug) => `/services/${slug}`), "/privacy"];
  for (const route of routes) {
    const response = await open(route);
    const metadata = await page.evaluate(() => ({ title: document.title, canonical: document.querySelector("link[rel='canonical']")?.href, description: document.querySelector("meta[name='description']")?.content, h1: document.querySelectorAll("h1").length, links: [...document.querySelectorAll("a")].map((a) => a.href) }));
    check(`${route} route and metadata`, response.status() === 200 && metadata.title.includes("AB Web Studio") && !!metadata.description && metadata.h1 === 1 && metadata.canonical === `${canonicalOrigin}${route}`, metadata);
    if (route.startsWith("/work/")) {
      const index = slugs.indexOf(route.split("/").at(-1));
      check(`${route} canonical live URL`, metadata.links.includes(urls[index]), urls[index]);
    }
  }
  await page.setViewport({ width: 1440, height: 900 });
  for (const width of [1440, 390]) {
    await page.setViewport({ width, height: width === 1440 ? 900 : 844 });
    for (const route of routes) {
      await open(route);
      await revealSections();
      await assertImages(`${route} ${width}`);
      const overflow = await page.evaluate(() => ({ documentWidth: document.documentElement.scrollWidth, viewport: innerWidth }));
      check(`${route} ${width} has no document overflow`, overflow.documentWidth <= width + 1, overflow);
      await stabilizeCapture();
      await page.evaluate(() => scrollTo({ top: 0, behavior: "instant" }));
      await settle();
      await captureFullPage(page, path.join(output, `${width}-route-${route.replaceAll("/", "-")}.png`));
    }
  }
  await page.setViewport({ width: 1440, height: 900 });
  await staticMode("reduced-motion", 1440, true);
  await staticMode("mobile-static", 390, false);
  const fallback = await browser.newPage();
  monitor(fallback, "forced-webgl-failure");
  await interceptRequests(fallback);
  await fallback.setViewport({ width: 1440, height: 900 });
  await fallback.evaluateOnNewDocument(() => {
    window.__qaWebGLAttempts = 0;
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (type, ...args) { if (/webgl/.test(type)) { window.__qaWebGLAttempts++; return null; } return original.call(this, type, ...args); };
  });
  await fallback.goto(base, { waitUntil: "networkidle0" });
  await fallback.waitForFunction(() => window.__qaWebGLAttempts > 0 && !!document.querySelector(".hero-3d-fallback") && !document.querySelector(".hero-3d-bg-wrap canvas"));
  check("WebGL failure retains static fallback", await fallback.$eval(".hero-3d-fallback", (element) => element.getBoundingClientRect().height > 0));
  await fallback.screenshot({ path: path.join(output, "webgl-fallback.png") });
  await fallback.close();
  await open();
  const formStructure = await page.evaluate(() => {
    const trap = document.querySelector("#company");
    return { honeypot: !!trap && trap.name === "company" && trap.tabIndex === -1 && trap.autocomplete === "off" && trap.closest("[aria-hidden='true']") !== null && trap.getClientRects().length === 0, required: ["full-name", "email", "message"].every((id) => document.getElementById(id)?.required), liveStatus: !!document.querySelector(".form-status[role='status'][aria-live='polite']") };
  });
  check("Contact required fields, hidden honeypot and live status", formStructure.honeypot && formStructure.required && formStructure.liveStatus, formStructure);
  await page.click(".contact-form button[type='submit']");
  check("Empty contact submission stays in browser", mockedRequests === 0 && await page.$eval("#full-name", (element) => element.validity.valueMissing));
  await page.type("#full-name", "Live QA Test");
  await page.type("#email", "invalid-email");
  await page.type("#message", "Mocked browser test. No lead is sent.");
  await page.click(".contact-form button[type='submit']");
  check("Malformed email stays in browser", mockedRequests === 0 && await page.$eval("#email", (element) => element.validity.typeMismatch));
  for (const status of [200, 503, 429]) {
    await open();
    mockedStatus = status;
    await page.type("#full-name", "Live QA Test");
    await page.type("#email", "qa@example.invalid");
    await page.type("#message", "Mocked browser test. No lead is sent.");
    await page.click(".contact-form button[type='submit']");
    await page.waitForSelector(status === 200 ? ".form-status.success" : ".form-status.error");
    const form = await page.evaluate(() => ({ status: document.querySelector(".form-status").textContent, name: document.querySelector("#full-name").value, email: document.querySelector("#email").value, message: document.querySelector("#message").value, busy: document.querySelector(".contact-form").getAttribute("aria-busy"), disabled: document.querySelector(".contact-form button[type='submit']").disabled }));
    check(`Contact mocked ${status} state`, form.busy === "false" && !form.disabled && (status === 200 ? form.status.includes("Thanks") && !form.name && !form.email && !form.message : form.status.includes(mockedMessage(status)) && !!form.name && !!form.email && !!form.message), form);
    await page.screenshot({ path: path.join(output, `contact-${status}.png`) });
  }
  check("Contact requests intercepted without sending a lead", mockedRequests === 3 && contactPayloads.every((payload) => payload.company === ""), { mockedRequests, honeypotsEmpty: contactPayloads.every((payload) => payload.company === "") });
  // A simulated HTTP 503 is expected to produce Chromium's network error log.
  const unexpectedErrors = errors.filter((error) => !(
    (/\b(503|429)\b/.test(error.message) && error.message.includes("/api/contact"))
    || (error.scenario === "forced-webgl-failure" && error.message.endsWith("THREE.WebGLRenderer: Error creating WebGL context."))
  ));
  check("No unexpected runtime or console errors", unexpectedErrors.length === 0, { unexpectedErrors, expectedSimulationErrors: errors.filter((error) => !unexpectedErrors.includes(error)) });
  check("No failed production assets or requests", assetFailures.length === 0, assetFailures);
} catch (error) {
  check("Browser runner completed", false, error.stack);
} finally {
  check("Contact interception handled every payload safely", contactInterceptionFailures.length === 0, contactInterceptionFailures);
  await browser.close();
  await writeFile(path.join(output, "report.json"), JSON.stringify({ base, testedAt: new Date().toISOString(), telemetryMocked: isLocal, errors, assetFailures, results }, null, 2));
  console.log(JSON.stringify({ output, passed: results.filter((result) => result.passed).length, failed: results.filter((result) => !result.passed) }, null, 2));
  if (results.some((result) => !result.passed)) process.exitCode = 1;
}
