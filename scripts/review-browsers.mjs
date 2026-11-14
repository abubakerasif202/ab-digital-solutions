// Cross-browser smoke review in Playwright Firefox and WebKit. Needs a server on port 3100.
import { firefox, webkit } from "playwright";

const base = process.env.QA_BASE_URL ?? "http://localhost:3100";
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const results = {};
for (const [name, type] of [["firefox", firefox], ["webkit", webkit]]) {
  const r = { errors: [] };
  try {
    const browser = await type.launch();
    for (const [label, viewport] of [["desktop", { width: 1280, height: 800 }], ["mobile", { width: 390, height: 844 }]]) {
      // WebKit applies the CSP upgrade-insecure-requests directive to http://localhost, which blocks every local asset.
      const page = await browser.newPage({ viewport, bypassCSP: true });
      // Local review only: strip the HTTPS-upgrade headers from responses so WebKit will load http://localhost assets.
      await page.route("**/*", async (route) => {
        try {
          const response = await route.fetch();
          const headers = { ...response.headers() };
          delete headers["content-security-policy"]; delete headers["strict-transport-security"];
          await route.fulfill({ response, headers });
        } catch { await route.continue().catch(() => {}); }
      });
      page.on("pageerror", (error) => r.errors.push(`${label}: ${error.message}`));
      await page.goto(base, { waitUntil: "domcontentloaded" }); await sleep(2500);
      const d = {}; r[label] = d; let step = "load";
      try {
      d.h1Opacity = await page.$eval(".hero h1", (n) => getComputedStyle(n).opacity);
      d.stage = await page.$eval(".stage", (n) => `live=${n.dataset.live} canvas=${n.querySelectorAll("canvas").length}`);
      d.supports = await page.evaluate(() => ({ scrollTimeline: CSS.supports("animation-timeline: scroll()"), detailsContent: CSS.supports("selector(::details-content)"), interpolateSize: CSS.supports("interpolate-size: allow-keywords") }));
      step = "scroll"; await page.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += innerHeight * 0.7) { scrollTo({ top: y, behavior: "instant" }); await new Promise((r) => setTimeout(r, 160)); } });
      await sleep(1200);
      d.hiddenReveals = await page.evaluate(() => [...document.querySelectorAll("[data-reveal]")].filter((n) => getComputedStyle(n).opacity === "0").length);
      d.clippedFrames = await page.evaluate(() => [...document.querySelectorAll("[data-reveal] .frame")].filter((n) => /100%/.test(getComputedStyle(n).clipPath)).length);
      d.overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
      d.progressBar = await page.$eval(".scroll-progress", (n) => getComputedStyle(n).transform);
      step = "faq"; await page.$eval(".faq summary", (n) => n.scrollIntoView({ block: "center", behavior: "instant" })); await sleep(300); await page.click(".faq summary"); await sleep(800);
      d.faq = await page.evaluate(() => { const details = document.querySelector(".faq details"); const p = details.querySelector("p"); return `open=${details.open} answerHeight=${Math.round(p.getBoundingClientRect().height)} opacity=${getComputedStyle(p).opacity}`; });
      if (label === "mobile") { await page.evaluate(() => scrollTo({ top: 0, behavior: "instant" })); step = "menu"; await sleep(400); await page.click(".menu-button"); await sleep(700); d.menu = await page.$eval("#site-nav", (n) => `open=${n.dataset.open} visibility=${getComputedStyle(n).visibility}`); step = "menu-link"; await page.click('#site-nav a[href="/work"]'); await page.waitForURL("**/work", { timeout: 15000 }); d.navigated = await page.title(); }
      else { await page.goto(`${base}/contact`, { waitUntil: "domcontentloaded" }); await sleep(1200); await page.click(".contact-form button[type=submit]"); await sleep(500); d.formInvalid = await page.evaluate(() => document.querySelectorAll('.contact-form [aria-invalid="true"]').length); }
      await page.screenshot({ path: `${process.env.QA_OUTPUT_DIR ?? "/tmp"}/${name}-${label}.png` });
      } catch (error) { d.failedAt = `${step}: ${String(error.message).split("\n")[0]}`; }
      await page.close();
    }
    await browser.close();
  } catch (error) { r.failed = String(error.message).split("\n")[0]; }
  results[name] = r; console.error(name, JSON.stringify(r));
}
console.log(JSON.stringify(results, null, 1));
