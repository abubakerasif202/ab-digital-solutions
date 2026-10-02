import puppeteer from "puppeteer";
import { readFile, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const base = process.env.QA_BASE_URL || "http://127.0.0.1:3100";
const output = path.resolve(process.env.QA_OUTPUT || "test-results/cinematic");
await mkdir(output, { recursive: true });
const registry = await readFile("app/project-data.ts", "utf8");
const config = await readFile("app/site-config.ts", "utf8");
const canonicalOrigin = config.match(/url: "([^"]+)"/)[1];
const slugs = [...registry.matchAll(/slug: "([^"]+)"/g)].map((match) => match[1]);
const urls = [...registry.matchAll(/url: "([^"]+)"/g)].map((match) => match[1]);
const results = [];
const check = (name, passed, detail = null) => results.push({ name, passed, detail });
const browser = await puppeteer.launch({ headless: true });
const errors = [];
let mockedStatus = 200;
let mockedRequests = 0;
const page = await browser.newPage();
page.on("pageerror", (error) => errors.push(error.message));
page.on("console", (message) => { if (message.type() === "error") errors.push(`${message.location().url || "console"} ${message.text()}`); });
await page.setRequestInterception(true);
page.on("request", (request) => {
  const pathname = new URL(request.url()).pathname;
  if (pathname === "/_vercel/speed-insights/script.js") {
    void request.respond({ status: 200, contentType: "application/javascript", body: "/* Vercel edge script is unavailable on the local Next.js server. */" });
  } else if (pathname === "/api/contact") {
    mockedRequests++;
    void request.respond({ status: mockedStatus, contentType: "application/json", body: JSON.stringify(mockedStatus === 200 ? { success: true } : { error: "QA simulated provider failure" }) });
  } else void request.continue();
});
const open = async (route = "/") => {
  const response = await page.goto(`${base}${route}`, { waitUntil: "networkidle0" });
  await page.evaluate(() => document.fonts.ready);
  return response;
};
const settle = () => page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));
try {
  for (const [width, height] of [[1440, 900], [1280, 800], [1024, 768], [768, 1024], [430, 932], [390, 844], [360, 800]]) {
    await page.setViewport({ width, height, deviceScaleFactor: 1 });
    await open();
    // Visit sections first so content-visibility and IntersectionObserver reveal
    // states are exercised before measuring the fully rendered document.
    for (const section of await page.$$("main section")) {
      await section.evaluate((element) => element.scrollIntoView({ behavior: "instant", block: "center" }));
      await settle();
      await page.waitForFunction(() => document.getAnimations().every((animation) => !(animation.timeline instanceof DocumentTimeline) || animation.effect?.getComputedTiming().iterations === Infinity || animation.playState !== "running"));
    }
    const overflow = await page.evaluate(() => ({
      documentWidth: document.documentElement.scrollWidth,
      viewport: innerWidth,
      offenders: [...document.querySelectorAll("main *")].filter((element) => {
        const rect = element.getBoundingClientRect();
        return rect.width > 0 && (rect.left < -1 || rect.right > innerWidth + 1) && getComputedStyle(element).position !== "absolute";
      }).slice(0, 15).map((element) => ({ tag: element.tagName, className: element.className, rect: element.getBoundingClientRect().toJSON() })),
    }));
    check(`Homepage ${width} has no document overflow`, overflow.documentWidth <= width + 1, overflow);
    await page.evaluate(() => scrollTo({ top: 0, behavior: "instant" }));
    await settle();
    await page.screenshot({ path: path.join(output, `home-${width}.png`), fullPage: true });
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
  const homepage = await page.evaluate(() => ({
    projects: [...document.querySelectorAll("#work a[href^='/work/']")].map((a) => a.getAttribute("href")),
    anchors: [...document.querySelectorAll("#primary-navigation a")].map((a) => ({ href: a.getAttribute("href"), valid: !!document.querySelector(a.hash) })),
    logo: !!document.querySelector(".brand svg"),
    email: !!document.querySelector("a[href='mailto:enquiry@abwebstudio.com.au']"),
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
  for (const route of ["/work", ...slugs.map((slug) => `/work/${slug}`), "/services", "/services/web-design-sydney", "/privacy"]) {
    const response = await open(route);
    const metadata = await page.evaluate(() => ({ title: document.title, canonical: document.querySelector("link[rel='canonical']")?.href, description: document.querySelector("meta[name='description']")?.content, h1: document.querySelectorAll("h1").length, links: [...document.querySelectorAll("a")].map((a) => a.href) }));
    check(`${route} route and metadata`, response.status() === 200 && !!metadata.title && !!metadata.description && metadata.h1 === 1 && metadata.canonical === `${canonicalOrigin}${route}`, metadata);
    if (route.startsWith("/work/")) {
      const index = slugs.indexOf(route.split("/").at(-1));
      check(`${route} canonical live URL`, metadata.links.includes(urls[index]), urls[index]);
    }
  }
  await page.setViewport({ width: 1440, height: 900 });
  for (const width of [1440, 390]) {
    await page.setViewport({ width, height: width === 1440 ? 900 : 844 });
    for (const route of ["/work", `/work/${slugs[0]}`]) {
      await open(route);
      await page.screenshot({ path: path.join(output, `${width}-route-${route.replaceAll("/", "-")}.png`), fullPage: true });
    }
  }
  await page.setViewport({ width: 1440, height: 900 });
  await page.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "reduce" }]);
  await open();
  check("Reduced motion skips WebGL, cursor and running animations", await page.evaluate(() => !document.querySelector(".hero-3d-bg-wrap canvas,.cursor-dot,.cursor-ring") && document.getAnimations().every((animation) => animation.playState !== "running")));
  await page.screenshot({ path: path.join(output, "reduced-motion.png"), fullPage: true });
  await page.emulateMediaFeatures([]);
  const fallback = await browser.newPage();
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
  for (const status of [200, 503]) {
    mockedStatus = status;
    await page.type("#full-name", "Local QA Test");
    await page.type("#email", "qa@example.invalid");
    await page.type("#message", "Local mocked browser test. No lead is sent.");
    await page.click(".contact-form button[type='submit']");
    await page.waitForSelector(status === 200 ? ".form-status.success" : ".form-status.error");
    check(`Contact mocked ${status} state`, true);
  }
  check("Contact requests intercepted without sending a lead", mockedRequests === 2, mockedRequests);
  // A simulated HTTP 503 is expected to produce Chromium's network error log.
  check("No unexpected runtime or console errors", errors.filter((error) => !(error.includes("503") && error.includes("/api/contact"))).length === 0, errors);
} catch (error) {
  check("Browser runner completed", false, error.stack);
} finally {
  await browser.close();
  await writeFile(path.join(output, "report.json"), JSON.stringify({ base, results }, null, 2));
  console.log(JSON.stringify({ output, passed: results.filter((result) => result.passed).length, failed: results.filter((result) => !result.passed) }, null, 2));
  if (results.some((result) => !result.passed)) process.exitCode = 1;
}
