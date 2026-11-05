import { chromium } from '@playwright/test';
import sharp from 'sharp';
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 1 });
const base = 'public/site/ab-digital-premium/assets/ab-portfolio-wild-pest-solutions';
async function capture(name) {
  await page.evaluate(async () => { await document.fonts.ready; for (const img of document.images) { img.loading = 'eager'; } });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: `qa/wild-pest-solutions/${name}.png`, animations: 'disabled' });
  await sharp(`qa/wild-pest-solutions/${name}.png`).webp({ quality: 90 }).toFile(`${base}-${name}.webp`);
}
await page.goto('https://wildpestsolutions.com.au/', { waitUntil: 'networkidle' });
await capture('desktop');
console.log(await page.locator('body').evaluate(el => ({ fonts: getComputedStyle(el).fontFamily, background: getComputedStyle(el).backgroundColor })));
await page.getByRole('heading', { name: 'Eight invasive species. One responsible approach.' }).scrollIntoViewIfNeeded();
await page.getByRole('heading', { name: 'Eight invasive species. One responsible approach.' }).evaluate(el => window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 120, behavior: 'instant' }));
await capture('services');
await page.goto('https://wildpestsolutions.com.au/contact', { waitUntil: 'networkidle' });
await page.getByRole('heading', { name: 'Tell us about your property' }).scrollIntoViewIfNeeded();
await page.getByRole('heading', { name: 'Tell us about your property' }).evaluate(el => window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 140, behavior: 'instant' }));
await capture('contact');
await page.setViewportSize({ width: 390, height: 844 });
await page.goto('https://wildpestsolutions.com.au/', { waitUntil: 'networkidle' });
await capture('mobile');
await browser.close();
