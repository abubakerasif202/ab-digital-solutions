// Renders the live hero scene in headless Chrome and saves it as the static
// poster used before WebGL starts, on small screens and for reduced motion.
// Usage: build, run `npm run start -- --port 3100`, then `node scripts/capture-hero-poster.mjs`.
import puppeteer from "puppeteer";
import sharp from "sharp";

const baseUrl = process.env.QA_BASE_URL ?? "http://localhost:3100";
const browser = await puppeteer.launch({
  executablePath: process.env.CHROMIUM_PATH,
  headless: true,
  args: ["--no-sandbox", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"],
});
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 1000, deviceScaleFactor: 2 });
await page.goto(baseUrl, { waitUntil: "domcontentloaded" });
await page.waitForSelector('.stage[data-live="true"]', { timeout: 60_000 });
await new Promise((resolve) => setTimeout(resolve, 9000));
await page.addStyleTag({ content: ".stage-ui, .stage-hint, .stage-poster { visibility: hidden !important; } .stage::after { display: none !important; }" });
const stage = await page.$(".stage");
const png = await stage.screenshot({ type: "png" });
await sharp(png).resize({ width: 1600 }).webp({ quality: 82 }).toFile("public/hero/night-desk-poster.webp");
await browser.close();
console.log("Saved public/hero/night-desk-poster.webp");
