import puppeteer from "puppeteer";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const base = process.env.QA_BASE_URL || "http://127.0.0.1:3100";
if (!["127.0.0.1", "localhost"].includes(new URL(base).hostname)) throw new Error("Local-only QA.");
const output = path.resolve(process.env.QA_OUTPUT_DIR || "qa/fresh-stop-20261020/browser");
await mkdir(output, { recursive: true });
const axe = await readFile("node_modules/axe-core/axe.min.js", "utf8");
const checks = [];
const exceptions = [];
const failedImages = [];
const check = (name, passed, detail) => checks.push({ name, passed, detail });
const browser = await puppeteer.launch({ headless: true });
try {
  const page = await browser.newPage();
  page.on("pageerror", (error) => exceptions.push(error.message));
  page.on("response", (response) => {
    if (response.request().resourceType() === "image" && response.status() >= 400) failedImages.push(response.url());
  });
  await page.setRequestInterception(true);
  page.on("request", (request) => {
    const url = new URL(request.url());
    if (url.pathname === "/api/contact") return void request.abort();
    if (url.pathname === "/api/analytics") return void request.respond({ status: 204 });
    void request.continue();
  });
  for (const width of [360, 390, 768, 1024, 1440, 1920]) {
    await page.setViewport({ width, height: width < 768 ? 844 : 926, deviceScaleFactor: 1 });
    for (const route of ["/", "/work", "/work/fresh-stop"]) {
      const response = await page.goto(`${base}${route}`, { waitUntil: "networkidle0" });
      await page.evaluate(async () => {
        await document.fonts.ready;
        for (let y = 0; y < document.documentElement.scrollHeight; y += innerHeight * 0.8) {
          scrollTo({ top: y, behavior: "instant" });
          await new Promise((resolve) => setTimeout(resolve, 35));
        }
        await Promise.race([Promise.all([...document.images].map((image) => image.decode().catch(() => {}))), new Promise((resolve) => setTimeout(resolve, 1500))]);
        scrollTo({ top: 0, behavior: "instant" });
      });
      // Cold image optimisation can outlast the decode grace period. Wait for
      // images specifically, independently of unrelated background requests.
      await page.waitForFunction(() => [...document.images]
        .filter((image) => image.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true }))
        .every((image) => image.complete), { timeout: 15_000 });
      const state = await page.evaluate(() => ({
        overflow: document.documentElement.scrollWidth - innerWidth,
        h1: document.querySelectorAll("h1").length,
        title: document.title,
        canonical: document.querySelector("link[rel='canonical']")?.href,
        description: document.querySelector("meta[name='description']")?.content,
        brokenImages: [...document.images].filter((image) => image.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true }) && (!image.complete || !image.naturalWidth)).map((image) => image.src),
        freshStopLinks: document.querySelectorAll('a[href="/work/fresh-stop"]').length,
      }));
      check(`${route} @${width}`, [200, 304].includes(response.status()) && state.overflow <= 1 && state.h1 === 1 && state.description && state.canonical === `https://www.abwebstudio.com.au${route === "/" ? "/" : route}` && !state.brokenImages.length && (route === "/work/fresh-stop" || state.freshStopLinks > 0), state);
      if ([390, 1440].includes(width)) {
        await new Promise((resolve) => setTimeout(resolve, 800));
        await page.addScriptTag({ content: axe });
        const violations = await page.evaluate(async () => (await window.axe.run(document, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"] } })).violations.map(({ id, nodes }) => ({ id, targets: nodes.map((node) => node.target) })));
        check(`Accessibility ${route} @${width}`, violations.length === 0, violations);
        await page.screenshot({ path: path.join(output, `${width}-${route === "/" ? "home" : route.slice(1).replaceAll("/", "-")}.png`) });
      }
      if (route === "/") {
        await page.focus(".slider-tabs button:last-child");
        await page.keyboard.press("Enter");
        await page.waitForFunction(() => document.querySelector(".showcase-caption strong")?.textContent === "Fresh Stop");
        await page.waitForFunction(() => document.querySelector('.showcase-slide.is-active img')?.complete && document.querySelector('.showcase-slide.is-active img')?.naturalWidth > 0);
        const showcase = await page.evaluate(() => ({ slides: document.querySelectorAll(".slider-tabs button").length, active: document.querySelector(".showcase-slide.is-active")?.getAttribute("href"), count: document.querySelector(".showcase-topline")?.textContent, ledger: document.querySelector(".stack-table")?.textContent }));
        check(`Fresh Stop showcase and stack @${width}`, showcase.slides === 16 && showcase.active === "/work/fresh-stop" && showcase.count.includes("16 / 16") && /Prisma/.test(showcase.ledger) && /1 of 16/.test(showcase.ledger), showcase);
        if ([390, 1440].includes(width)) {
          await page.$eval(".project-showcase", (element) => element.scrollIntoView({ block: "start", behavior: "instant" }));
          await new Promise((resolve) => setTimeout(resolve, 800));
          await page.screenshot({ path: path.join(output, `${width}-fresh-stop-showcase.png`) });
        }
      }
      if (route === "/work/fresh-stop") {
        const links = await page.$$eval('a[href="https://www.freshstop.com.au/"]', (elements) => elements.map((link) => ({ target: link.target, rel: link.rel, text: link.textContent })));
        check(`Fresh Stop safe external links @${width}`, links.length > 0 && links.every((link) => link.target === "_blank" && /noopener/.test(link.rel) && /noreferrer/.test(link.rel)), links);
      }
    }
  }
  const image = await page.evaluate(async () => {
    const response = await fetch("/site/ab-digital-premium/assets/ab-portfolio-fresh-stop.jpg");
    const bitmap = await createImageBitmap(await response.blob());
    const result = { status: response.status, width: bitmap.width, height: bitmap.height };
    bitmap.close();
    return result;
  });
  check("Authentic JPEG loads at 1348 x 926", image.status === 200 && image.width === 1348 && image.height === 926, image);
  const sitemap = await (await fetch(`${base}/sitemap.xml`)).text();
  check("Sitemap includes Fresh Stop case study and 16 project routes", sitemap.includes("https://www.abwebstudio.com.au/work/fresh-stop</loc>") && (sitemap.match(/<loc>https:\/\/www\.abwebstudio\.com\.au\/work\//g) || []).length === 16);
  const llms = await (await fetch(`${base}/llms.txt`)).text();
  check("LLMs summary uses published Fresh Stop domain and 16 projects", llms.includes("https://www.freshstop.com.au/") && llms.includes("16 digital projects") && !llms.includes("fresh-stop.vercel.app"));
  check("No application exceptions", exceptions.length === 0, exceptions);
  check("No failed image requests", failedImages.length === 0, failedImages);
} finally {
  await browser.close();
  await writeFile(path.join(output, "report.json"), JSON.stringify({ checkedAt: new Date().toISOString(), checks, exceptions, failedImages }, null, 2));
}
const failures = checks.filter((item) => !item.passed);
console.log(JSON.stringify({ checks: checks.length, passed: checks.length - failures.length, failures }, null, 2));
if (failures.length) process.exitCode = 1;
