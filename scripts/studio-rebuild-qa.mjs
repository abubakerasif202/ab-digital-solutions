import puppeteer from "puppeteer";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const base = process.env.QA_BASE_URL || "http://127.0.0.1:3100";
if (!["127.0.0.1", "localhost"].includes(new URL(base).hostname)) throw new Error("Local-only QA.");
const output = path.resolve(process.env.QA_OUTPUT_DIR || "qa/studio-rebuild-20261020/browser");
const widths = process.env.QA_WIDTHS ? process.env.QA_WIDTHS.split(",").map(Number) : [360, 390, 768, 1024, 1440, 1920];
if (widths.some((width) => !Number.isInteger(width) || width < 320 || width > 3840)) throw new Error("QA_WIDTHS must contain integer widths between 320 and 3840.");
await mkdir(output, { recursive: true });
// The sitemap is derived from the canonical registries. Source regexes also match nested
// service proof-project slugs and accidentally invent /services/<project> routes.
const sitemapResponse = await fetch(new URL("/sitemap.xml", base));
if (!sitemapResponse.ok) throw new Error(`Sitemap request failed: ${sitemapResponse.status}`);
const sitemap = await sitemapResponse.text();
const routes = [...new Set([...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => new URL(match[1]).pathname))];
if (!routes.includes("/") || !routes.includes("/services") || !routes.includes("/contact")) throw new Error("Sitemap is missing required QA routes.");
const report = { base, capturedAt: new Date().toISOString(), routes, checks: [], exceptions: [], consoleErrors: [], failedImageResponses: [] };
const axe = await readFile("node_modules/axe-core/axe.min.js", "utf8");
let contactMock = null;
let contactRequests = 0;
let contactResponseGate = Promise.resolve();
const check = (name, passed, detail) => report.checks.push({ name, passed, detail });
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const browser = await puppeteer.launch({ headless: true, args: [
  "--enable-unsafe-swiftshader",
  // Headless Linux can report pointer:none; explicitly model desktop input.
  // Mobile layout and reduced-motion behavior are checked separately below.
  "--blink-settings=primaryHoverType=2,availableHoverTypes=2,primaryPointerType=4,availablePointerTypes=4",
] });
report.browser = await browser.version();
const page = await browser.newPage();
page.on("pageerror", (error) => report.exceptions.push({ route: page.url(), message: error.message }));
page.on("response", (response) => {
  if (response.request().resourceType() === "image" && response.status() >= 400) report.failedImageResponses.push({ url: response.url(), status: response.status() });
});
page.on("console", (message) => {
  if (message.type() !== "error") return;
  const source = message.location().url || "";
  const expected = (contactMock?.status === 503 && source.endsWith("/api/contact") && /503/.test(message.text()))
    || (page.url().endsWith("/qa-route-does-not-exist") && /404/.test(message.text()));
  report.consoleErrors.push({ route: page.url(), source, message: message.text(), expected });
});
await page.setRequestInterception(true);
page.on("request", (request) => {
  const url = new URL(request.url());
  if (url.pathname === "/api/contact") {
    if (!contactMock) return void request.abort();
    contactRequests++;
    const mock = contactMock;
    void contactResponseGate.then(() => request.respond({ status: mock.status, contentType: "application/json", body: JSON.stringify(mock.body) }));
    return;
  }
  if (url.pathname === "/api/analytics") return void request.respond({ status: 204 });
  if (url.pathname.startsWith("/_vercel/") || /google-analytics|googletagmanager/.test(url.hostname)) {
    return void request.respond({ status: 200, contentType: "application/javascript", body: "" });
  }
  void request.continue();
});
try {
  for (const width of process.env.QA_INTERACTIONS_ONLY ? [] : widths) {
    await page.setViewport({ width, height: width < 768 ? 844 : 900, deviceScaleFactor: 1 });
    for (const route of routes) {
      const response = await page.goto(`${base}${route}`, { waitUntil: "networkidle0" });
      await page.evaluate(async () => {
        await document.fonts.ready;
        for (let y = 0; y < document.documentElement.scrollHeight; y += innerHeight * 0.85) {
          scrollTo({ top: y, behavior: "instant" });
          await new Promise((resolve) => setTimeout(resolve, 24));
        }
        await Promise.race([Promise.all([...document.images].map((image) => image.decode().catch(() => {}))), new Promise((resolve) => setTimeout(resolve, 1500))]);
        scrollTo({ top: 0, behavior: "instant" });
      });
      const state = await page.evaluate(() => ({
        overflow: document.documentElement.scrollWidth - innerWidth,
        h1: document.querySelectorAll("h1").length,
        canonical: document.querySelector("link[rel='canonical']")?.href,
        title: document.title,
        description: document.querySelector("meta[name='description']")?.content,
        brokenImages: [...document.images].filter((image) => image.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true }) && image.complete && !image.naturalWidth).map((image) => image.currentSrc || image.src),
        hiddenOrDeferredImages: [...document.images].filter((image) => !image.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true }) || !image.complete).length,
        navOverflow: document.querySelector(".nav-wrap")?.scrollWidth - document.querySelector(".nav-wrap")?.clientWidth,
        brokenAnchors: [...document.querySelectorAll("a[href]")].filter((link) => {
          const url = new URL(link.href);
          return url.origin === location.origin && url.pathname === location.pathname && url.hash && !document.getElementById(decodeURIComponent(url.hash.slice(1)));
        }).map((link) => link.getAttribute("href")),
      }));
      check(`${route} @${width}`, [200, 304].includes(response.status()) && state.overflow <= 1 && state.h1 === 1 && Boolean(state.description) && state.canonical === `https://www.abwebstudio.com.au${route === "/" ? "/" : route}` && !state.brokenImages.length && !state.brokenAnchors.length && (width <= 960 || state.navOverflow <= 1), { status: response.status(), ...state });
      if ([390, 1440].includes(width) && ["/", "/work", "/services", "/about", "/contact", "/privacy", "/work/jufaja-homes", "/services/web-design-sydney"].includes(route)) {
        await wait(800);
        await page.addScriptTag({ content: axe });
        const accessibility = await page.evaluate(async () => {
          const result = await window.axe.run(document, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"] } });
          return { violations: result.violations.map(({ id, impact, nodes }) => ({ id, impact, targets: nodes.map((node) => node.target) })), incomplete: result.incomplete.length };
        });
        check(`Automated accessibility ${route} @${width}`, accessibility.violations.length === 0, accessibility);
      }
      if (route === "/" || ([390, 1440].includes(width) && ["/work", "/services", "/about", "/contact", "/privacy", "/work/jufaja-homes", "/services/web-design-sydney"].includes(route))) {
        await wait(800);
        const filename = `${width}-${route === "/" ? "home" : route.slice(1).replaceAll("/", "-")}`;
        await page.screenshot({ path: path.join(output, `${filename}-fold.png`) });
        if ([390, 1440].includes(width)) {
          // Full-page captures expose deferred sections and settle reveals;
          // route assertions, axe checks and fold captures use natural styles.
          await page.addStyleTag({ content: "*{content-visibility:visible!important}[data-reveal],.reveal{animation:none!important;opacity:1!important;transform:none!important;translate:none!important;filter:none!important;clip-path:none!important}" });
          await page.screenshot({ path: path.join(output, `${filename}-full.png`), fullPage: true });
        }
      }
    }
    console.log(`Route sweep completed at ${width}px`);
  }

  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
  await page.goto(base, { waitUntil: "networkidle0" });
  const hero = await page.evaluate(() => ({
    heading: document.querySelector("#hero-heading")?.textContent,
    contact: document.querySelector('.ruby-hero-actions a[href="#contact"]')?.textContent,
    work: document.querySelector('.ruby-hero-actions a[href="#work"]')?.textContent,
    studio: Boolean(document.querySelector('a[href="/studio"]')),
    heroCanvases: document.querySelectorAll(".ruby-hero canvas").length,
  }));
  check("Approved semantic hero preserves enquiry, portfolio and studio journeys", Boolean(hero.heading && hero.contact && hero.work && hero.studio) && hero.heroCanvases === 0, hero);
  await page.waitForFunction(() => document.querySelector(".cinema-media-video")?.currentTime > 0);
  check("Cinematic background motion starts when permitted", await page.$eval(".cinema-media", (media) => media.dataset.playing === "true"));
  await page.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "reduce" }]);
  await page.waitForFunction(() => !document.querySelector(".cinema-media-video")?.hasAttribute("src"));
  check("Live reduced motion detaches the decorative video and preserves its poster", await page.evaluate(() => {
    const video = document.querySelector(".cinema-media-video");
    const poster = document.querySelector(".cinema-media-poster img");
    return video.paused && !video.hasAttribute("src") && poster.complete && poster.naturalWidth > 0;
  }));
  await page.screenshot({ path: path.join(output, "1440-hero-reduced-motion.png") });
  await page.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "no-preference" }]);

  for (const width of [360, 390, 768]) {
    await page.setViewport({ width, height: 844, deviceScaleFactor: 1 });
    await page.goto(base, { waitUntil: "networkidle0" });
    await page.click(".menu-toggle");
    await wait(600);
    const menu = await page.evaluate(() => {
      const nav = document.querySelector(".site-nav");
      const box = nav.getBoundingClientRect();
      return { top: box.top, bottom: box.bottom, height: box.height, viewport: innerHeight, focused: nav.contains(document.activeElement), mainInert: document.querySelector("main").inert, backdrop: getComputedStyle(document.querySelector("header")).backdropFilter };
    });
    check(`Mobile menu viewport and initial focus @${width}`, menu.height > 600 && Math.abs(menu.bottom - menu.viewport) < 2 && menu.focused && menu.mainInert && menu.backdrop === "none", menu);
    await page.keyboard.down("Shift");
    await page.keyboard.press("Tab");
    await page.keyboard.press("Tab");
    await page.keyboard.up("Shift");
    check(`Mobile menu keyboard wraps backwards @${width}`, await page.evaluate(() => {
      const items = document.querySelectorAll('.site-nav a[href], .site-nav button:not([disabled]), .site-nav [tabindex]:not([tabindex="-1"])');
      return items.length > 0 && document.activeElement === items[items.length - 1];
    }));
    await page.keyboard.press("Tab");
    check(`Mobile menu keyboard wraps forwards @${width}`, await page.evaluate(() => document.activeElement === document.querySelector(".menu-toggle")));
    await page.screenshot({ path: path.join(output, `${width}-menu.png`) });
    await page.keyboard.press("Escape");
    check(`Mobile menu Escape focus restoration @${width}`, await page.evaluate(() => document.activeElement === document.querySelector(".menu-toggle") && !document.querySelector("main").inert));
  }
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 1 });
  await page.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "reduce" }]);
  await page.goto(base, { waitUntil: "networkidle0" });
  const motion = await page.evaluate(() => ({
    armed: document.querySelectorAll('[data-reveal-state="armed"]').length,
    heading: Boolean(document.querySelector("#hero-heading")?.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true })),
    artwork: Boolean(document.querySelector(".cinema-media-poster img")?.naturalWidth),
    videoStatic: !document.querySelector(".cinema-media-video")?.hasAttribute("src"),
    marqueeAnimation: getComputedStyle(document.querySelector(".ruby-band-track")).animationName,
    intro: Boolean(document.querySelector(".brand-intro")),
  }));
  check("Reduced-motion semantic hero, decorative video and content stay static", !motion.armed && motion.heading && motion.artwork && motion.videoStatic && motion.marqueeAnimation === "none" && !motion.intro, motion);
  await page.screenshot({ path: path.join(output, "390-home-reduced-motion.png") });
  for (const route of ["/", "/contact"]) {
    for (const mock of [{ status: 200, body: { ok: true }, outcome: "success" }, { status: 200, body: {}, outcome: "error" }, { status: 503, body: { error: "Local QA simulated delivery failure" }, outcome: "error" }]) {
      contactMock = mock;
      await page.goto(`${base}${route}`, { waitUntil: "networkidle0" });
      const before = contactRequests;
      await page.$eval(".contact-form", (form) => form.requestSubmit());
      const invalid = await page.$eval(".contact-form", (form) => !form.checkValidity());
      check(`${route} required fields block sending`, invalid && contactRequests === before);
      await page.type("#full-name", "Browser QA");
      await page.type("#email", "qa@example.invalid");
      await page.type("#message", "Local intercepted browser test. No real enquiry is sent.");
      let releaseResponse;
      contactResponseGate = new Promise((resolve) => { releaseResponse = resolve; });
      await page.$eval(".contact-form", (form) => form.requestSubmit());
      await page.waitForSelector('.contact-form[aria-busy="true"]');
      check(`${route} ${mock.status}/${mock.outcome} loading disables submit`, await page.$eval('.contact-form button[type="submit"]', (button) => button.disabled));
      await page.$eval(".contact-form", (form) => form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true })));
      releaseResponse();
      await page.waitForSelector(`.form-status.${mock.outcome}`);
      check(`${route} ${mock.status}/${mock.outcome} delivery contract and duplicate prevention`, contactRequests === before + 1 && await page.$eval("#full-name", (input, success) => input.value === (success ? "" : "Browser QA"), mock.outcome === "success"));
      if (route === "/contact") await page.screenshot({ path: path.join(output, `390-contact-${mock.status}-${mock.outcome}.png`) });
    }
  }
  contactMock = null;
  const missing = await page.goto(`${base}/qa-route-does-not-exist`, { waitUntil: "networkidle0" });
  check("Not found responds 404 with useful content", missing.status() === 404 && Boolean(await page.$("h1")));
  check("No browser runtime exceptions", !report.exceptions.length, report.exceptions);
  check("No failed image responses", !report.failedImageResponses.length, report.failedImageResponses);
  check("No unexpected console errors", !report.consoleErrors.some((error) => !error.expected), report.consoleErrors);
} finally {
  await writeFile(path.join(output, "report.json"), JSON.stringify(report, null, 2));
  await browser.close();
}
const failures = report.checks.filter((item) => !item.passed);
console.log(JSON.stringify({ checks: report.checks.length, passed: report.checks.length - failures.length, failures, exceptions: report.exceptions, consoleErrors: report.consoleErrors }, null, 2));
if (failures.length) process.exitCode = 1;
