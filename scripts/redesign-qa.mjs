// Route and viewport sweep for the rebuilt site. Needs a production server:
//   npm run build && npm run start -- --port 3100
//   CHROMIUM_PATH=/usr/bin/google-chrome node scripts/redesign-qa.mjs
// Checks status, a single h1, horizontal overflow, broken images, console errors
// and failed requests, and saves a screenshot per route and width.
import { mkdir } from "node:fs/promises";
import puppeteer from "puppeteer";

const baseUrl = process.env.QA_BASE_URL ?? "http://localhost:3100";
const outputDir = process.env.QA_OUTPUT_DIR ?? "qa/redesign";
const widths = (process.env.QA_WIDTHS ?? "390,768,1280,1920").split(",").map(Number);
const routes = ["/", "/work", "/work/on-call-trailers", "/work/247-inventory-system", "/services", "/services/web-design-sydney", "/about", "/contact", "/privacy", "/studio", "/no-such-page"];
// The Vercel Speed Insights script only exists on Vercel.
const ignored = (text) => text.includes("/_vercel/") || text.includes("MIME type ('text/plain')");

await mkdir(outputDir, { recursive: true });
const browser = await puppeteer.launch({
  executablePath: process.env.CHROMIUM_PATH,
  headless: true,
  args: ["--no-sandbox", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"],
});
const failures = [];
for (const width of widths) {
  for (const route of routes) {
    const page = await browser.newPage();
    const problems = [];
    page.on("console", (message) => { if (message.type() === "error" && !ignored(message.text()) && !message.text().includes("404")) problems.push(`console: ${message.text()}`); });
    page.on("pageerror", (error) => problems.push(`pageerror: ${error.message}`));
    page.on("response", (response) => {
      const expected404 = route === "/no-such-page" && response.url().endsWith(route);
      if (response.status() >= 400 && !ignored(response.url()) && !expected404) problems.push(`${response.status()} ${response.url()}`);
    });
    await page.setViewport({ width, height: width < 800 ? 844 : 900, deviceScaleFactor: 1 });
    const response = await page.goto(baseUrl + route, { waitUntil: "domcontentloaded" });
    const expectedStatus = route === "/no-such-page" ? 404 : 200;
    if (response.status() !== expectedStatus && response.status() !== 304) problems.push(`status ${response.status()}`);
    // Scroll through the page so lazy images and reveals settle.
    await page.evaluate(async () => {
      for (let y = 0; y < document.body.scrollHeight; y += innerHeight * 0.8) { scrollTo({ top: y, behavior: "instant" }); await new Promise((r) => setTimeout(r, 150)); }
      scrollTo({ top: 0, behavior: "instant" });
    });
    await new Promise((resolve) => setTimeout(resolve, 1500));
    const report = await page.evaluate(() => ({
      overflow: document.documentElement.scrollWidth - innerWidth,
      h1: document.querySelectorAll("h1").length,
      brokenImages: [...document.images].filter((image) => image.complete && image.naturalWidth === 0).map((image) => image.currentSrc || image.src),
      hiddenReveals: [...document.querySelectorAll("[data-reveal]")].filter((node) => getComputedStyle(node).opacity === "0").length,
    }));
    if (report.overflow > 0) problems.push(`horizontal overflow ${report.overflow}px`);
    if (report.h1 !== 1) problems.push(`${report.h1} h1 elements`);
    if (report.brokenImages.length) problems.push(`broken images: ${report.brokenImages.join(", ")}`);
    if (report.hiddenReveals) problems.push(`${report.hiddenReveals} reveal elements still hidden after scrolling`);
    await page.screenshot({ path: `${outputDir}/${route === "/" ? "home" : route.slice(1).replaceAll("/", "_")}-${width}.jpg`, fullPage: true, type: "jpeg", quality: 60 });
    if (problems.length) failures.push({ route, width, problems });
    await page.close();
  }
}
await browser.close();
console.log(failures.length ? JSON.stringify(failures, null, 2) : `PASS: ${routes.length} routes x ${widths.length} widths`);
process.exit(failures.length ? 1 : 0);
