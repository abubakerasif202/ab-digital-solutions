import puppeteer from "puppeteer";
import { mkdir } from "node:fs/promises";
import path from "node:path";

// Local visual QA for the Gilt & Ruby layer: full-page and hero captures at
// phone, tablet and desktop widths, in normal and reduced-motion modes.
const base = process.env.QA_BASE_URL || "http://127.0.0.1:3100";
if (!["127.0.0.1", "localhost"].includes(new URL(base).hostname)) throw new Error("QA requires localhost.");
const out = path.resolve(process.env.QA_OUT || "test-results/gilt-ruby");
await mkdir(out, { recursive: true });
const routes = (process.env.QA_ROUTES || "home").split(",").map((r) => (r === "home" ? "/" : r.startsWith("/") ? r : `/${r}`));
const widths = (process.env.QA_WIDTHS || "375,768,1440").split(",").map(Number);
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const browser = await puppeteer.launch({ headless: true });
const errors = [];
for (const reduced of [false, true]) {
  for (const width of widths) {
    const page = await browser.newPage();
    page.on("pageerror", (error) => errors.push(`${width}: ${error.message}`));
    page.on("console", (message) => { if (message.type() === "error") errors.push(`${width}: ${message.text()}`); });
    await page.setRequestInterception(true);
    page.on("request", (request) => {
      const { pathname } = new URL(request.url());
      if (pathname.startsWith("/_vercel/") || pathname === "/api/analytics") request.respond({ status: 204 });
      else request.continue();
    });
    await page.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: reduced ? "reduce" : "no-preference" }]);
    await page.setViewport({ width, height: width < 500 ? 812 : 900, deviceScaleFactor: 1 });
    for (const route of routes) {
      await page.goto(`${base}${route}`, { waitUntil: "networkidle0" });
      await page.evaluate(() => document.fonts.ready);
      await wait(reduced ? 300 : 2800);
      const slug = (route === "/" ? "home" : route.replace(/\W+/g, "-").replace(/^-|-$/g, "")) + `-${width}${reduced ? "-rm" : ""}`;
      await page.screenshot({ path: path.join(out, `${slug}-fold.png`) });
      // Scroll through once so view-timeline reveals settle, then capture the whole page.
      await page.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += 500) { scrollTo(0, y); await new Promise((r) => setTimeout(r, 60)); } scrollTo(0, 0); });
      await wait(700);
      // Capture the settled state: render every deferred section and resolve reveals.
      await page.addStyleTag({ content: "* { content-visibility: visible !important; } [data-reveal], [data-reveal-state], .reveal { opacity: 1 !important; transform: none !important; translate: none !important; filter: none !important; clip-path: none !important; animation: none !important; }" });
      await wait(400);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      if (overflow > 0) errors.push(`${route} @${width}: horizontal overflow ${overflow}px`);
      await page.screenshot({ path: path.join(out, `${slug}-full.png`), fullPage: true });
    }
    await page.close();
  }
}
await browser.close();
console.log(errors.length ? `Issues:\n${[...new Set(errors)].join("\n")}` : "No console errors or overflow.");
