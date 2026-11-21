import puppeteer from "puppeteer";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const outDir = path.join(root, "qa", "verification-nov-2026");
await mkdir(outDir, { recursive: true });

const base = process.env.QA_BASE_URL || "http://127.0.0.1:3100";
const viewports = [
  { name: "desktop-1440", width: 1440, height: 900, isMobile: false },
  { name: "tablet-768", width: 768, height: 1024, isMobile: true },
  { name: "mobile-390", width: 390, height: 844, isMobile: true },
  { name: "mobile-320", width: 320, height: 640, isMobile: true },
];

const routes = [
  { name: "home", path: "/" },
  { name: "work-index", path: "/work" },
  { name: "case-study-wild-pest", path: "/work/wild-pest-solutions" },
  { name: "services-index", path: "/services" },
  { name: "contact", path: "/contact" },
  { name: "about", path: "/about" },
];

const browser = await puppeteer.launch({
  headless: true,
  args: ["--no-sandbox", "--disable-setuid-sandbox"],
});

const report = {
  timestamp: new Date().toISOString(),
  results: [],
  failures: 0,
};

try {
  for (const vp of viewports) {
    for (const route of routes) {
      const page = await browser.newPage();
      await page.setRequestInterception(true);
      page.on("request", (req) => {
        const pathname = new URL(req.url()).pathname;
        if (pathname === "/_vercel/speed-insights/script.js") {
          req.respond({
            status: 200,
            contentType: "application/javascript",
            body: "/* Local mock for Vercel speed insights edge script */",
          });
        } else {
          req.continue();
        }
      });
      await page.setViewport({ width: vp.width, height: vp.height, isMobile: vp.isMobile });
      
      const errors = [];
      page.on("pageerror", (err) => errors.push(err.message));
      page.on("console", (msg) => {
        if (msg.type() === "error") errors.push(msg.text());
      });

      const url = `${base}${route.path}`;
      const response = await page.goto(url, { waitUntil: "networkidle2", timeout: 30000 });
      const status = response ? response.status() : 0;

      // Check horizontal overflow
      const overflow = await page.evaluate(() => {
        const docWidth = document.documentElement.scrollWidth;
        const bodyWidth = document.body.scrollWidth;
        const winWidth = window.innerWidth;
        const hasOverflow = docWidth > winWidth || bodyWidth > winWidth;
        return {
          hasOverflow,
          docWidth,
          bodyWidth,
          winWidth,
          overflowDiff: Math.max(docWidth, bodyWidth) - winWidth,
        };
      });

      // Take a screenshot of the initial viewport
      const screenshotFile = `${route.name}-${vp.name}.png`;
      await page.screenshot({ path: path.join(outDir, screenshotFile), fullPage: false });

      const passed = (status === 200 || status === 304) && errors.length === 0 && !overflow.hasOverflow;
      if (!passed) report.failures += 1;

      report.results.push({
        route: route.path,
        viewport: vp.name,
        status,
        hasOverflow: overflow.hasOverflow,
        overflowDiff: overflow.overflowDiff,
        errors,
        passed,
        screenshot: screenshotFile,
      });

      console.log(`[${passed ? "PASS" : "FAIL"}] ${route.path} @ ${vp.name}: HTTP ${status}, overflow: ${overflow.hasOverflow ? `YES (+${overflow.overflowDiff}px)` : "none"}, errors: ${errors.length}`);

      await page.close();
    }
  }

  // Also test mobile menu interaction
  const mobilePage = await browser.newPage();
  await mobilePage.setViewport({ width: 390, height: 844, isMobile: true });
  await mobilePage.goto(`${base}/`, { waitUntil: "networkidle2" });
  
  const menuToggle = await mobilePage.$(".menu-toggle");
  if (menuToggle) {
    await menuToggle.click();
    await new Promise((r) => setTimeout(r, 400));
    const isMenuOpen = await mobilePage.evaluate(() => {
      const nav = document.getElementById("primary-navigation");
      return nav ? nav.classList.contains("is-open") : false;
    });
    await mobilePage.screenshot({ path: path.join(outDir, "mobile-menu-open-390.png") });
    console.log(`[${isMenuOpen ? "PASS" : "FAIL"}] Mobile menu toggle interaction: is-open = ${isMenuOpen}`);
    report.results.push({
      route: "/ (mobile menu toggle)",
      viewport: "mobile-390",
      status: 200,
      hasOverflow: false,
      errors: [],
      passed: isMenuOpen,
      screenshot: "mobile-menu-open-390.png",
    });
    if (!isMenuOpen) report.failures += 1;
  } else {
    report.failures += 1;
    report.results.push({
      route: "/ (mobile menu toggle)",
      viewport: "mobile-390",
      status: 200,
      hasOverflow: false,
      errors: ["Element .menu-toggle not found in mobile viewport"],
      passed: false,
      screenshot: "missing-menu-toggle.png",
    });
    console.log("[FAIL] Mobile menu toggle interaction: .menu-toggle not found");
  }
  await mobilePage.close();

} finally {
  await browser.close();
  await writeFile(path.join(outDir, "report.json"), JSON.stringify(report, null, 2));
}

if (report.failures > 0) {
  console.error(`Browser verification completed with ${report.failures} failure(s).`);
  process.exit(1);
} else {
  console.log(`All ${report.results.length} browser layout and interaction checks PASSED!`);
}
