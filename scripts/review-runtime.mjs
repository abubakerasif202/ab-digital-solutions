// Runtime review of the rebuilt site in headless Chrome: motion timing, the 3D
// stage, keyboard, touch, reduced motion and the enquiry journey. Prints JSON
// findings and saves recordings to QA_OUTPUT_DIR. Needs a server on port 3100.
import { mkdir } from "node:fs/promises";
import puppeteer from "puppeteer";
import sharp from "sharp";

const base = process.env.QA_BASE_URL ?? "http://localhost:3100";
const out = process.env.QA_OUTPUT_DIR ?? "qa/review";
await mkdir(out, { recursive: true });
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const browser = await puppeteer.launch({ executablePath: process.env.CHROMIUM_PATH, headless: true, args: ["--no-sandbox", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] });
const findings = {};
const instrument = async (page) => {
  await page.evaluateOnNewDocument(() => {
    window.__draws = 0; window.__cls = 0;
    for (const proto of [window.WebGLRenderingContext?.prototype, window.WebGL2RenderingContext?.prototype]) {
      if (!proto) continue;
      for (const name of ["drawArrays", "drawElements"]) { const original = proto[name]; proto[name] = function (...args) { window.__draws += 1; return original.apply(this, args); }; }
    }
    new PerformanceObserver((list) => { for (const entry of list.getEntries()) if (!entry.hadRecentInput) window.__cls += entry.value; }).observe({ type: "layout-shift", buffered: true });
  });
};
const drawsPerSecond = async (page, ms = 1500) => { const a = await page.evaluate(() => window.__draws); await sleep(ms); const b = await page.evaluate(() => window.__draws); return Math.round(((b - a) / ms) * 1000); };
const stageShot = async (page) => { const box = await (await page.$(".stage")).boundingBox(); return page.screenshot({ type: "png", clip: { x: box.x, y: box.y, width: box.width, height: box.height * 0.72 } }); };
const diff = async (a, b) => { const [x, y] = await Promise.all([a, b].map((buffer) => sharp(buffer).resize(320, 200, { fit: "fill" }).greyscale().raw().toBuffer())); let sum = 0; for (let i = 0; i < x.length; i += 1) sum += Math.abs(x[i] - y[i]); return +(sum / x.length / 2.55).toFixed(2); };

// ---------- Desktop: hero timing, stage, interactions ----------
{
  const page = await browser.newPage(); await instrument(page);
  const errors = []; page.on("pageerror", (e) => errors.push(e.message));
  await page.setViewport({ width: 1440, height: 900 });
  const recorder = await page.screencast({ path: `${out}/desktop.webm` });
  await page.goto(base, { waitUntil: "domcontentloaded" });
  const early = [];
  for (const at of [150, 400, 700]) { await sleep(at - (early.at(-1)?.at ?? 0)); early.push({ at, ...(await page.evaluate(() => { const s = (q) => +getComputedStyle(document.querySelector(q)).opacity; return { h1: +s(".hero h1").toFixed(2), cta: +s(".hero .actions").toFixed(2), sinceNav: Math.round(performance.now()) }; })) }); }
  const poster = await stageShot(page);
  await page.waitForSelector('.stage[data-live="true"]', { timeout: 60000 });
  const liveAt = await page.evaluate(() => Math.round(performance.now()));
  await sleep(1000); const firstLive = await stageShot(page);
  await sleep(4000); const settled = await stageShot(page);
  await sleep(1500); const later = await stageShot(page);
  findings.hero = { early, liveAfterMs: liveAt, posterVsFirstLive: await diff(poster, firstLive), firstLiveVsSettled: await diff(firstLive, settled), settledVsLater_codeTyping: await diff(settled, later), clsThroughLive: +(await page.evaluate(() => window.__cls)).toFixed(4) };
  const label = () => page.$eval(".stage-screen", (node) => node.textContent);
  const before = await label();
  await page.click(".stage-controls button:nth-child(1)"); await sleep(1600); const afterButton = await label();
  const box = await (await page.$(".stage")).boundingBox();
  await page.mouse.click(box.x + box.width * 0.33, box.y + box.height * 0.42); await sleep(1600); const afterCanvasClick = await label();
  const lampBefore = await page.$eval(".stage-controls button:nth-child(2)", (n) => n.getAttribute("aria-pressed")); const litShot = await stageShot(page);
  await page.click(".stage-controls button:nth-child(2)"); await sleep(900); const lampAfter = await page.$eval(".stage-controls button:nth-child(2)", (n) => n.getAttribute("aria-pressed")); const darkShot = await stageShot(page);
  await page.click(".stage-controls button:nth-child(2)"); await sleep(600); const hueA = await stageShot(page);
  await page.click(".stage-controls button:nth-child(3)"); await sleep(900); const hueB = await stageShot(page);
  await page.screenshot({ path: `${out}/stage-close.png`, clip: { x: box.x, y: box.y, width: box.width, height: box.height } });
  findings.interactions = { before, afterButton, afterCanvasClick, lamp: `${lampBefore} -> ${lampAfter}`, lampVisualChange: await diff(litShot, darkShot), lightsVisualChange: await diff(hueA, hueB) };
  const inView = await drawsPerSecond(page);
  // Slow scroll through the page for the recording.
  await page.evaluate(async () => { const end = document.body.scrollHeight - innerHeight; for (let y = 0; y < end; y += 28) { scrollTo({ top: y, behavior: "instant" }); await new Promise((r) => setTimeout(r, 16)); } });
  const offScreen = await drawsPerSecond(page);
  await recorder.stop();
  await page.evaluate(() => scrollTo({ top: 0, behavior: "instant" })); await sleep(600);
  const back = await drawsPerSecond(page);
  const other = await browser.newPage(); await other.bringToFront(); await sleep(400);
  const visibility = await page.evaluate(() => document.visibilityState); const hiddenNative = await drawsPerSecond(page);
  await other.close(); await page.bringToFront();
  await page.evaluate(() => { Object.defineProperty(document, "visibilityState", { configurable: true, get: () => "hidden" }); document.dispatchEvent(new Event("visibilitychange")); }); await sleep(300);
  const hiddenSimulated = await drawsPerSecond(page);
  findings.rendering = { drawCallsPerSecond: { inView, offScreen, backInView: back, otherTabFocused: hiddenNative, visibilityStateWithOtherTab: visibility, hiddenSimulated }, hiddenReveals: await page.evaluate(() => [...document.querySelectorAll("[data-reveal]")].filter((n) => getComputedStyle(n).opacity === "0").length), totalCls: +(await page.evaluate(() => window.__cls)).toFixed(4), errors };
  await page.close();
}

// ---------- Keyboard ----------
{
  const page = await browser.newPage(); await page.setViewport({ width: 1280, height: 800 });
  await page.goto(base, { waitUntil: "domcontentloaded" }); await sleep(6000);
  const order = [];
  for (let i = 0; i < 12; i += 1) { await page.keyboard.press("Tab"); order.push(await page.evaluate(() => { const el = document.activeElement; const style = getComputedStyle(el); return `${el.tagName.toLowerCase()}:${(el.textContent || el.getAttribute("aria-label") || "").trim().slice(0, 28)}|outline=${style.outlineStyle === "none" ? "NONE" : style.outlineWidth}`; })); }
  await page.goto(`${base}/contact`, { waitUntil: "domcontentloaded" }); await sleep(800);
  await page.focus(".faq summary").catch(() => {});
  await page.goto(base, { waitUntil: "domcontentloaded" }); await sleep(800);
  await page.focus(".faq summary"); await page.keyboard.press("Enter"); await sleep(700);
  findings.keyboard = { tabOrder: order, faqOpensWithEnter: await page.evaluate(() => document.querySelector(".faq details").open) };
  await page.close();
}

// ---------- Mobile touch ----------
{
  const page = await browser.newPage(); await instrument(page);
  await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
  const recorder = await page.screencast({ path: `${out}/mobile.webm` });
  await page.goto(base, { waitUntil: "domcontentloaded" }); await sleep(2500);
  const m = { offered: Boolean(await page.$(".stage-controls button")), liveBeforeTap: await page.$eval(".stage", (n) => n.dataset.live), drawsBeforeTap: await page.evaluate(() => window.__draws) };
  await page.tap(".menu-button"); await sleep(700);
  m.menuOpen = await page.$eval("#site-nav", (n) => n.dataset.open + "/" + getComputedStyle(n).visibility); m.bodyLocked = await page.evaluate(() => document.body.style.overflow);
  const trap = []; for (let i = 0; i < 8; i += 1) { await page.keyboard.press("Tab"); trap.push(await page.evaluate(() => Boolean(document.activeElement.closest("#site-nav, .menu-button")))); }
  m.focusStaysInMenu = trap.every(Boolean);
  await page.keyboard.press("Escape"); await sleep(500);
  m.afterEscape = await page.$eval("#site-nav", (n) => n.dataset.open) + "/focus:" + await page.evaluate(() => document.activeElement.className) + "/overflow:" + await page.evaluate(() => document.body.style.overflow || "restored");
  await page.tap(".menu-button"); await sleep(600); await page.tap('#site-nav a[href="/services"]'); await page.waitForFunction(() => location.pathname === "/services", { timeout: 15000 }); await sleep(900);
  m.afterNavTap = await page.evaluate(() => location.pathname + " menu=" + document.querySelector("#site-nav").dataset.open + " h1=" + document.querySelector("h1").textContent.slice(0, 30));
  await page.goto(base, { waitUntil: "domcontentloaded" }); await sleep(1500);
  await page.tap(".stage-controls button"); await page.waitForSelector('.stage[data-live="true"]', { timeout: 60000 }); await sleep(1500);
  const labelBefore = await page.$eval(".stage-screen", (n) => n.textContent); await page.tap(".stage-controls button:nth-child(1)"); await sleep(1200);
  m.optIn3d = { live: true, nextProjectTap: `${labelBefore} -> ${await page.$eval(".stage-screen", (n) => n.textContent)}` };
  await page.evaluate(async () => { const end = Math.min(document.body.scrollHeight - innerHeight, 5200); for (let y = 0; y < end; y += 30) { scrollTo({ top: y, behavior: "instant" }); await new Promise((r) => setTimeout(r, 16)); } });
  await page.evaluate(() => document.querySelector(".callout").scrollIntoView({ block: "center", behavior: "instant" })); await sleep(300); await page.tap(".callout h3"); await sleep(300);
  m.spotlightAfterTap = await page.$eval(".callout", (n) => n.style.getPropertyValue("--mx") || "not set");
  m.overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
  m.smallTargets = await page.evaluate(() => [...document.querySelectorAll("a, button, summary, input, textarea")].filter((el) => { const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0 && r.height < 40 && !el.closest(".prose, .legal-body, p") && getComputedStyle(el).position !== "absolute"; }).map((el) => `${el.tagName}:${(el.textContent || "").trim().slice(0, 20)}:${Math.round(el.getBoundingClientRect().height)}`).slice(0, 12));
  await recorder.stop(); findings.mobile = m; await page.close();
}

// ---------- Reduced motion ----------
{
  const page = await browser.newPage(); await instrument(page);
  await page.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "reduce" }]); await page.setViewport({ width: 1440, height: 900 });
  await page.goto(base, { waitUntil: "domcontentloaded" }); await sleep(120);
  const h1Early = await page.$eval(".hero h1", (n) => getComputedStyle(n).opacity); await sleep(5000);
  findings.reducedMotion = { motionFlag: await page.evaluate(() => document.documentElement.dataset.motion ?? "absent"), h1OpacityAt120ms: h1Early, canvasCount: await page.evaluate(() => document.querySelectorAll("canvas").length), draws: await page.evaluate(() => window.__draws), stageControls: await page.evaluate(() => document.querySelectorAll(".stage-controls button").length), hiddenContent: await page.evaluate(() => [...document.querySelectorAll("main *")].filter((n) => n.children.length === 0 && n.textContent.trim() && getComputedStyle(n).opacity === "0").length), ledger: await page.evaluate(() => [...document.querySelectorAll(".ledger dd")].map((n) => n.textContent)) };
  await page.click(".faq summary"); await sleep(200); findings.reducedMotion.faqAnswerVisible = await page.evaluate(() => { const p = document.querySelector(".faq details p"); return p.getBoundingClientRect().height > 10; });
  await page.close();
}

// ---------- Enquiry journey ----------
{
  const run = async (mode) => {
    const page = await browser.newPage(); await page.setViewport({ width: 1280, height: 900 });
    let posted = null;
    if (mode !== "real") { await page.setRequestInterception(true); page.on("request", (request) => { if (request.url().endsWith("/api/contact") && request.method() === "POST") { posted = request.postData(); request.respond(mode === "ok" ? { status: 200, contentType: "application/json", body: JSON.stringify({ ok: true }) } : { status: 500, contentType: "application/json", body: JSON.stringify({ ok: false, error: "Delivery failed" }) }); } else request.continue(); }); }
    await page.goto(`${base}/contact`, { waitUntil: "domcontentloaded" }); await sleep(1500);
    const result = {};
    if (mode === "ok") { await page.click(".contact-form button[type=submit]"); await sleep(500); result.emptySubmit = await page.evaluate(() => ({ invalid: document.querySelectorAll('.contact-form [aria-invalid="true"]').length, focus: document.activeElement.name || document.activeElement.id, errors: [...document.querySelectorAll(".field-error")].map((n) => n.textContent).slice(0, 4) })); }
    for (const handle of await page.$$(".contact-form input:not([type=radio]):not([type=checkbox]):not([type=hidden]), .contact-form textarea")) {
      const info = await handle.evaluate((n) => ({ type: n.type, tag: n.tagName, hidden: n.tabIndex === -1 || n.getBoundingClientRect().height === 0 }));
      if (info.hidden) continue;
      await handle.type(info.tag === "TEXTAREA" ? "We need a new website for our Sydney trade business with online quotes." : info.type === "email" ? "review@example.com" : info.type === "tel" ? "0400 000 000" : "Review Test", { delay: 5 });
    }
    await sleep(3500);
    await page.click(".contact-form button[type=submit]"); await sleep(mode === "real" ? 5000 : 1500);
    result.status = await page.evaluate(() => { const n = document.querySelector(".form-status"); return { className: n?.className, text: n?.textContent.slice(0, 140) }; });
    result.posted = posted ? Object.keys(JSON.parse(posted)) : null;
    await page.close(); return result;
  };
  findings.enquiry = { mockedSuccess: await run("ok"), mockedFailure: await run("fail"), realApiNoKey: await run("real") };
}
await browser.close();
console.log(JSON.stringify(findings, null, 1));
