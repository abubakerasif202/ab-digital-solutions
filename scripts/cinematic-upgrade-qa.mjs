import puppeteer from "puppeteer";
import sharp from "sharp";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const base = process.env.QA_BASE_URL || "http://127.0.0.1:3100";
if (!["127.0.0.1", "localhost"].includes(new URL(base).hostname)) throw new Error("QA requires localhost.");
const output = path.resolve("test-results/cinematic/after");
await mkdir(output, { recursive: true });
const results = [];
const errors = [];
const check = (name, passed, detail) => {
  results.push({ name, passed, detail });
  if (!passed) console.log("FAIL", name, detail);
};
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const browser = await puppeteer.launch({ headless: true });
const page = await browser.newPage();
page.on("pageerror", (error) => errors.push(error.message));
page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
await page.setRequestInterception(true);
page.on("request", async (request) => {
  const url = new URL(request.url());
  // These local-host integrations are not available on a Next production server.
  if (url.pathname === "/_vercel/speed-insights/script.js") await request.respond({ status: 200, contentType: "application/javascript", body: "" });
  else if (url.pathname === "/api/analytics") await request.respond({ status: 204 });
  else if (url.pathname === "/api/contact") await request.abort();
  else await request.continue();
});
await page.evaluateOnNewDocument(() => {
  Object.defineProperty(navigator, "deviceMemory", { configurable: true, get: () => 8 });
  Object.defineProperty(navigator, "hardwareConcurrency", { configurable: true, get: () => 8 });
  window.qaDraws = 0;
  for (const Context of [WebGLRenderingContext, WebGL2RenderingContext]) {
    for (const method of ["drawElements", "drawArrays"]) {
      const original = Context.prototype[method];
      Context.prototype[method] = function (...args) {
        window.qaDraws++;
        return original.apply(this, args);
      };
    }
  }
});
async function open(route = "/") {
  await page.goto(`${base}${route}`, { waitUntil: "networkidle0" });
  await page.evaluate(() => document.fonts.ready);
}
async function scrollToElement(selector) {
  await page.$eval(selector, (element) => {
    const top = element.getBoundingClientRect().top + scrollY - 120;
    scrollTo({ top, behavior: "instant" });
  });
  await wait(1000);
}
async function capture(selector, filename, fullPage = false) {
  // Capture steady-state content; live animation checks run without this style.
  await page.addStyleTag({ content: `
    * { content-visibility: visible !important; }
    [data-reveal], .reveal { animation: none !important; opacity: 1 !important; transform: none !important; translate: none !important; filter: none !important; clip-path: none !important; }
    .mobile-project-cta { visibility: hidden !important; }
    ${fullPage ? "" : ".site-header { visibility: hidden !important; }"}
  ` }).then((style) => style.evaluate((el) => { el.id = "cinematic-capture-style"; }));
  if (fullPage) await page.screenshot({ path: filename, fullPage: true });
  else await (await page.$(selector)).screenshot({ path: filename });
  await page.evaluate(() => document.getElementById("cinematic-capture-style")?.remove());
}
async function readText(selector) {
  return page.$$eval(selector, (elements) => elements.map((element) => {
    const bounds = element.getBoundingClientRect();
    const style = getComputedStyle(element);
    return { text: element.textContent, height: bounds.height, lineHeight: style.lineHeight, opacity: style.opacity, clip: style.clipPath, overflow: element.scrollWidth > element.clientWidth + 1 };
  }));
}
try {
  for (const width of [320, 390, 768, 1440, 1920]) {
    await page.setViewport({ width, height: width < 768 ? 844 : 1000, deviceScaleFactor: 1 });
    await page.mouse.move(0, 0);
    await open();
    await wait(1200);
    if (width >= 768) {
      await page.hover(".signal-art-stage");
      await page.waitForSelector(".hero-3d-container[data-render-ready=\"true\"]");
      await wait(500);
    }
    check(`${width} initial hero is readable`, await page.$eval("h1", (el) => getComputedStyle(el).opacity === "1" && el.getBoundingClientRect().height > 100));
    await page.screenshot({ path: path.join(output, `${width}-hero.png`) });
    const sections = await page.$$eval("main > section", (elements) => elements.map((element, index) => ({ index, name: element.id || element.className.split(" ")[0] })));
    for (const { index, name } of sections) {
      console.log(`Capturing ${width}px ${name}`);
      const element = (await page.$$("main > section"))[index];
      await element.evaluate((el) => scrollTo({ top: el.getBoundingClientRect().top + scrollY, behavior: "instant" }));
      await wait(1000);
      // Traverse tall sections to load every image and trigger each native reveal.
      await element.evaluate(async (el) => {
        const top = el.getBoundingClientRect().top + scrollY;
        const height = el.offsetHeight;
        for (let y = top; y < top + height; y += innerHeight * .7) {
          scrollTo({ top: y, behavior: "instant" });
          await new Promise((resolve) => setTimeout(resolve, 100));
        }
        await Promise.all([...el.querySelectorAll("img")].map((image) => image.decode().catch(() => {})));
        scrollTo({ top, behavior: "instant" });
      });
      await wait(800);
      await capture(`main > section:nth-child(${index + 1})`, path.join(output, `${width}-${name === "hero" ? "hero-section" : name}.png`));
    }
    for (let index = 1; index <= 4; index++) {
      const selector = `[data-process-step]:nth-child(${index})`;
      await scrollToElement(selector);
      const text = await readText(`${selector} h3, ${selector} p`);
      check(`${width} process step ${index} visible without clipping`, text.length === 2 && text.every((el) => el.height > 20 && el.opacity === "1" && el.clip === "none" && !el.overflow), text);
    }
    await scrollToElement(".about-copy");
    check(`${width} studio link occurs once`, await page.$$eval("main a", (elements) => elements.filter((el) => el.textContent.includes("Inside the studio")).length === 1));
    const paragraphs = await readText(".about-copy > p");
    check(`${width} About copy remains present and unmasked`, paragraphs.length === 4 && paragraphs.every((el) => el.height > 10 && el.opacity === "1" && el.clip === "none"), paragraphs);
    check(`${width} six selected projects`, await page.$$eval(".signal-work-item", (elements) => elements.length === 6));
    const layout = await page.evaluate(() => ({ width: innerWidth, scrollWidth: document.documentElement.scrollWidth, images: [...document.images].filter((img) => img.getClientRects().length && (!img.complete || !img.naturalWidth)).map((img) => img.src) }));
    check(`${width} no overflow or broken imagery`, layout.scrollWidth <= width && !layout.images.length, layout);
    await page.evaluate(() => scrollTo({ top: 0, behavior: "instant" }));
    await wait(500);
    await capture("main", path.join(output, `${width}-home.png`), true);
    await sharp(path.join(output, `${width}-home.png`)).resize({ width: Math.min(1100, width), height: 16000, fit: "inside", withoutEnlargement: true }).webp({ quality: 80 }).toFile(path.join(output, `${width}-home.webp`));
    console.log(`Cinematic visual capture ${width}px complete`);
  }
  await page.setViewport({ width: 1440, height: 1000 });
  await page.mouse.move(0, 0);
  await open();
  check("Initial desktop uses visible SVG before graphics intent", await page.$("canvas") === null && await page.$(".signal-fallback svg") !== null);
  await page.evaluate(() => {
    window.qaCrossfade = null;
    const observer = new MutationObserver((entries) => {
      const entry = entries.find((item) => item.target.dataset.renderReady === "true");
      if (!entry) return;
      const root = entry.target;
      window.qaCrossfade = {
        canvas: getComputedStyle(root.querySelector("canvas")).opacity,
        svg: getComputedStyle(root.querySelector(".signal-fallback")).opacity,
        duration: getComputedStyle(root.querySelector("canvas")).transitionDuration,
      };
      observer.disconnect();
    });
    observer.observe(document.querySelector(".signal-art-stage"), { subtree: true, attributes: true, attributeFilter: ["data-render-ready"] });
  });
  await page.hover(".signal-art-stage");
  await page.waitForSelector(".hero-3d-container[data-render-ready=\"true\"]");
  const crossfade = await page.evaluate(() => window.qaCrossfade);
  check("SVG-to-WebGL crossfade starts from a visible SVG and hidden canvas", crossfade && parseFloat(crossfade.canvas) < .1 && parseFloat(crossfade.svg) > .9 && parseFloat(crossfade.duration) >= .25, crossfade);
  await wait(3000);
  const settled = await page.evaluate(() => window.qaDraws);
  await wait(500);
  check("GPU sleeps after settling", await page.evaluate((count) => window.qaDraws === count, settled), settled);
  await page.mouse.move(1000, 300);
  await wait(400);
  check("Pointer wakes the graphics", await page.evaluate((count) => window.qaDraws > count, settled));
  await wait(3000);
  const stage = await page.$(".signal-art-stage");
  await stage.screenshot({ path: path.join(output, "sculpture-pointer.png") });
  await scrollToElement(".signal-work-item");
  const projectBounds = await (await page.$(".signal-work-item")).boundingBox();
  await page.mouse.move(projectBounds.x + projectBounds.width * .65, projectBounds.y + 150);
  await wait(600);
  const hover = await page.$eval(".signal-work-item", (el) => ({
    pointer: el.style.getPropertyValue("--pointer-x"),
    light: getComputedStyle(el.querySelector(".signal-work-media"), "::after").opacity,
    transform: getComputedStyle(el.querySelector(".signal-project-image")).transform,
  }));
  check("Portfolio pointer lighting and perspective respond", !!hover.pointer && hover.light === "1" && hover.transform !== "none", hover);
  await page.screenshot({ path: path.join(output, "portfolio-hover.png") });
  await scrollToElement(".capability-card");
  await page.focus(".capability-card");
  const focus = await page.$eval(".capability-card", (el) => ({
    outline: getComputedStyle(el).outlineColor,
    width: getComputedStyle(el).outlineWidth,
    light: getComputedStyle(el, "::before").opacity,
  }));
  await wait(600);
  check("Capabilities have a visible keyboard focus outline", focus.outline === "rgb(168, 232, 245)" && parseFloat(focus.width) >= 2, focus);
  await page.screenshot({ path: path.join(output, "capability-focus.png") });
  await scrollToElement("#process");
  const offscreen = await page.evaluate(() => window.qaDraws);
  await wait(600);
  check("Offscreen graphics stop drawing", await page.evaluate((count) => window.qaDraws === count, offscreen));
  await page.evaluate(() => scrollTo({ top: 0, behavior: "instant" }));
  await wait(800);
  await page.$eval("canvas", (canvas) => canvas.getContext("webgl2").getExtension("WEBGL_lose_context").loseContext());
  await page.waitForSelector(".signal-fallback svg");
  check("Context loss restores SVG", await page.$("canvas") === null);
  await page.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "reduce" }]);
  await open();
  await wait(1000);
  check("Reduced motion uses SVG", await page.$("canvas") === null && await page.$(".signal-fallback svg") !== null);
  const staticTitle = await page.$eval("h1 > span", (el) => ({ animation: getComputedStyle(el).animationName, translate: getComputedStyle(el).translate }));
  check("Reduced motion disables typography motion", staticTitle.animation === "none" && staticTitle.translate === "none", staticTitle);
  await page.emulateMediaFeatures([]);
  await page.evaluateOnNewDocument(() => Object.defineProperty(navigator, "deviceMemory", { get: () => 2 }));
  await open();
  await wait(1500);
  check("Low memory devices use SVG", await page.$("canvas") === null && await page.$(".signal-fallback svg") !== null);
  await open("/work");
  const slugs = [...(await readFile("app/project-data.ts", "utf8")).matchAll(/slug: "([^"]+)"/g)].map((match) => match[1]);
  const links = await page.$$eval("main a[href]", (els) => els.map((el) => el.getAttribute("href")));
  check("Work index retains all 14 canonical projects", slugs.length === 14 && slugs.every((slug) => links.includes(`/work/${slug}`)));
  check("No unexpected console or runtime errors", !errors.length, errors);
} catch (error) {
  check("Cinematic QA completed", false, error.stack);
} finally {
  await browser.close();
  const summary = { checks: results.length, passed: results.filter((result) => result.passed).length, errors, results };
  await writeFile(path.join(output, "qa.json"), JSON.stringify(summary, null, 2));
  console.log(JSON.stringify({ ...summary, results: undefined }, null, 2));
  process.exitCode = summary.checks !== summary.passed ? 1 : 0;
}
