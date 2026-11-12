import { chromium } from "@playwright/test";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

// Local-only visual, accessibility and metadata sweep. Contact delivery is blocked.
const base = process.env.QA_BASE_URL || "http://localhost:3100";
if (!["localhost", "127.0.0.1"].includes(new URL(base).hostname)) throw new Error("Local-only QA");
const output = path.resolve(process.env.QA_OUTPUT_DIR || "qa/inspector-takeover/final");
const widths = [320, 375, 768, 1440, 1920];
await mkdir(output, { recursive: true });
const sitemap = await (await fetch(`${base}/sitemap.xml`)).text();
const routes = [...new Set([...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => new URL(m[1]).pathname))];
if (!routes.includes("/contact") || !routes.includes("/")) throw new Error("Incomplete sitemap");
const axe = await readFile("node_modules/axe-core/axe.min.js", "utf8");
const report = { base, widths, routes, checks: [], errors: [], accessibility: [], screenshots: [] };
const browser = await chromium.launch({ headless: true, args: ["--enable-unsafe-swiftshader"] });
try {
  const context = await browser.newContext();
  await context.route("**/api/contact", (route) => route.abort());
  const page = await context.newPage();
  page.on("pageerror", (error) => report.errors.push({ route: page.url(), message: error.message }));
  const titles = new Map();
  for (const width of widths) {
    await page.setViewportSize({ width, height: width >= 1440 ? 1000 : 844 });
    for (const route of routes) {
      const response = await page.goto(`${base}${route}`, { waitUntil: "networkidle" });
      // Trigger lazy content and entrance enhancements before recording full-page evidence.
      await page.evaluate(async () => {
        for (let y = 0; y < document.documentElement.scrollHeight; y += innerHeight * 0.85) {
          scrollTo(0, y);
          await new Promise((resolve) => setTimeout(resolve, 30));
        }
      });
      await page.waitForTimeout(100);
      const result = await page.evaluate(() => ({
        overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
        h1: document.querySelectorAll("h1").length,
        main: document.querySelectorAll("main").length,
        title: document.title,
        description: document.querySelector('meta[name="description"]')?.content,
        canonical: document.querySelector('link[rel="canonical"]')?.href,
        broken: [...document.images].filter((i) => i.complete && i.currentSrc && !i.naturalWidth).map((i) => i.currentSrc),
        links: [...document.querySelectorAll('a[href^="/"]')].map((a) => a.getAttribute("href")),
      }));
      const failures = [];
      if (response.status() !== 200) failures.push(`HTTP ${response.status()}`);
      if (result.overflow > 1) failures.push(`overflow ${result.overflow}px`);
      if (result.h1 !== 1 || result.main !== 1) failures.push(`landmarks h1=${result.h1}, main=${result.main}`);
      if (!result.title || !result.description || !result.canonical) failures.push("missing metadata");
      if (result.broken.length) failures.push(`broken images: ${result.broken.join(", ")}`);
      if (width === widths[0]) titles.set(route, result.title);
      report.checks.push({ route, width, failures, ...result });
      if ((width === 375 || width === 1440) && ["/", "/work", "/services", "/about", "/contact", "/privacy", "/studio"].includes(route)) {
        await page.evaluate(() => scrollTo(0, 0));
        await page.waitForTimeout(250);
        const name = `${route.replaceAll("/", "-").replace(/^-/, "") || "home"}-${width}`;
        await page.screenshot({ path: path.join(output, `${name}.png`), fullPage: true });
        await page.screenshot({ path: path.join(output, `${name}-viewport.png`) });
        report.screenshots.push(`${name}.png`, `${name}-viewport.png`);
      }
      if ((width === 375 || width === 1440) && ["/", "/work", "/services", "/about", "/contact", "/work/jufaja-construction-jufaja-homes", "/services/web-design-sydney"].includes(route)) {
        await page.addScriptTag({ content: axe });
        const violations = await page.evaluate(async () => (await window.axe.run(document, {
          runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21aa", "best-practice"] },
        })).violations.map((v) => ({ id: v.id, impact: v.impact, nodes: v.nodes.map((n) => ({ target: n.target, summary: n.failureSummary })) })));
        report.accessibility.push({ route, width, violations });
      }
      console.log(`${width} ${route}: ${failures.length ? failures.join("; ") : "PASS"}`);
    }
  }
  const links = [...new Set(report.checks.flatMap((c) => c.links).map((href) => href.split(/[?#]/)[0]))];
  report.linkChecks = [];
  for (const href of links) {
    const response = await context.request.get(`${base}${href}`);
    report.linkChecks.push({ href, status: response.status() });
  }
  report.duplicateTitles = [...titles].filter(([route, title]) => [...titles].some(([other, value]) => route !== other && title === value));
} finally {
  await browser.close();
  await writeFile(path.join(output, "report.json"), JSON.stringify(report, null, 2));
}
const failed = report.checks.filter((c) => c.failures.length);
const a11y = report.accessibility.filter((c) => c.violations.length);
console.log(JSON.stringify({ checks: report.checks.length, failed: failed.length, pageErrors: report.errors.length, accessibilityRoutesWithViolations: a11y.length }));
if (failed.length || report.errors.length || a11y.length || report.linkChecks.some((c) => c.status >= 400) || report.duplicateTitles.length) process.exitCode = 1;
