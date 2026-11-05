// Local browser QA for the Studio wildlife, sound and "Meet the locals" experience.
// Run against a production server: QA_BASE_URL=http://127.0.0.1:3110 node scripts/studio-wildlife-qa.mjs
// Writes screenshots, a short interaction video and report.json to QA_OUT (default qa/studio-wildlife).
import { chromium } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";

const base = process.env.QA_BASE_URL || "http://127.0.0.1:3110";
if (!["localhost", "127.0.0.1"].includes(new URL(base).hostname)) throw new Error("Local QA only.");
const out = process.env.QA_OUT || "qa/studio-wildlife";
await mkdir(out, { recursive: true });
const browser = await chromium.launch({ args: ["--no-sandbox", "--enable-unsafe-swiftshader", "--use-angle=swiftshader"] });
const report = [];
const check = (name, ok, detail = "") => { report.push({ name, ok: !!ok, detail: String(detail) }); console.log(ok ? "ok  " : "FAIL", name, detail); };
const animals = [["Kangaroo", "Say g’day"], ["Koala", "Wake the koala"], ["Sulphur-crested cockatoo", "Greet the cockatoo"]];

// Counts oscillators and records the AudioContext state so "silent until allowed" can be proven.
const instrument = () => {
  window.__audio = { contexts: 0, oscillators: 0, ctx: null };
  const Original = window.AudioContext;
  window.AudioContext = class extends Original {
    constructor(...args) { super(...args); window.__audio.contexts++; window.__audio.ctx = this; }
    createOscillator() { window.__audio.oscillators++; return super.createOscillator(); }
  };
};

const runs = [
  { tag: "desktop", viewport: { width: 1440, height: 900 }, video: true },
  { tag: "portrait", viewport: { width: 390, height: 844 }, hasTouch: true },
  { tag: "landscape", viewport: { width: 844, height: 390 }, hasTouch: true },
];
const only = process.env.QA_RUNS?.split(",");

try {
  for (const run of runs.filter((r) => !only || only.includes(r.tag))) {
    const { tag } = run;
    const context = await browser.newContext({ viewport: run.viewport, hasTouch: run.hasTouch, deviceScaleFactor: 1, ...(run.video ? { recordVideo: { dir: `${out}/video`, size: { width: 1280, height: 640 } } } : {}) });
    const page = await context.newPage();
    page.setDefaultTimeout(120000);
    const problems = [];
    page.on("pageerror", (error) => problems.push(`pageerror: ${error.message}`));
    page.on("console", (message) => { if (message.type() === "error") problems.push(`console error: ${message.text().slice(0, 200)}`); });
    await page.addInitScript(instrument);
    await page.route("**/api/analytics", (route) => route.fulfill({ status: 204 }));
    await page.route("**/_vercel/**", (route) => route.fulfill({ status: 200, body: "" }));
    const stage = page.locator("section[aria-label='Interactive virtual studio'] [data-mode]");
    const shot = (label, locator = stage) => locator.screenshot({ path: `${out}/${tag}-${label}.png`, timeout: 120000 }).catch((error) => check(`${tag} screenshot ${label}`, false, error.message.split("\n")[0]));
    const settle = (ms = 3500) => page.waitForTimeout(ms);

    await page.goto(`${base}/studio`, { waitUntil: "networkidle" });
    // --- sound defaults ---
    const soundToggle = page.getByRole("button", { name: /^Sound (on|off)$/ });
    check(`${tag} sound toggle visible and ON by default`, (await soundToggle.isVisible()) && /Sound on/.test(await soundToggle.innerText()) && (await soundToggle.getAttribute("aria-pressed")) === "true");
    check(`${tag} volume control visible`, await page.getByLabel("Volume").isVisible());
    check(`${tag} no oscillator before any cue`, (await page.evaluate(() => window.__audio.oscillators)) === 0);
    const idleState = await page.evaluate(() => window.__audio.ctx?.state);
    const note = await page.getByRole("group", { name: "Sound" }).getByRole("status").innerText();
    check(`${tag} does not claim audio while the browser blocks it`, idleState === "running" ? /playing/i.test(note) : /waiting|click|key/i.test(note), `${idleState} / ${note}`);

    // --- locals work before 3D (still view) ---
    await page.getByRole("button", { name: "Meet the locals" }).click();
    for (const [name, action] of animals) {
      await page.getByRole("group", { name: "Choose an animal" }).getByRole("button", { name }).click();
      check(`${tag} still view card for ${name}`, (await page.locator("#studio-locals h3").innerText()) === name && await page.getByRole("button", { name: action }).isVisible());
    }
    await page.getByRole("group", { name: "Choose an animal" }).getByRole("button", { name: "Kangaroo" }).click();
    await page.getByRole("button", { name: "Say g’day" }).click();
    check(`${tag} still view caption appears`, /“.+”/.test(await page.locator("#studio-locals").innerText()));
    await shot("00-still-locals", page.locator("section[aria-label='Interactive virtual studio']"));

    // --- enter the 3D studio: this click is the eligible gesture ---
    await page.getByRole("button", { name: "Enter the Studio", exact: true }).click();
    await page.waitForFunction(() => ["arrival", "intro", "explore", "failed"].includes(document.querySelector("[data-mode]")?.dataset.mode), null, { timeout: 90000 });
    check(`${tag} 3D loaded`, (await stage.getAttribute("data-mode")) !== "failed", await stage.getAttribute("data-mode"));
    check(`${tag} audio unlocked by the click`, (await page.evaluate(() => window.__audio.ctx?.state)) === "running");
    await page.getByRole("button", { name: "Skip intro", exact: true }).click().catch(() => {});
    await settle(2500);
    await page.getByRole("button", { name: /Back to entrance/ }).click().catch(async () => { await page.getByRole("button", { name: "View options" }).click(); await page.getByRole("button", { name: /Back to entrance/ }).click(); });
    await settle(4500);
    await shot("01-entrance");

    // --- each animal: camera frames it, interaction reacts, captions appear ---
    for (const [name, action] of animals) {
      const key = name.split(" ").pop().toLowerCase();
      if (!(await page.locator("#studio-locals").isVisible())) await page.getByRole("button", { name: "Meet the locals" }).click();
      await page.getByRole("group", { name: "Choose an animal" }).getByRole("button", { name }).click();
      await settle(4500);
      await shot(`02-${key}-framed`);
      const before = await page.evaluate(() => window.__audio.oscillators);
      await page.getByRole("button", { name: action }).click();
      // Repeat taps straight after a reaction must stay silent (the reaction cooldown is 1.8 s).
      const mid = await page.evaluate(() => window.__audio.oscillators);
      await page.getByRole("button", { name: action }).click({ clickCount: 3, delay: 20 }).catch(() => {});
      check(`${tag} ${name} repeat taps stay silent`, (await page.evaluate(() => window.__audio.oscillators)) === mid);
      await settle(900);
      await shot(`03-${key}-reaction`);
      const after = await page.evaluate(() => window.__audio.oscillators);
      check(`${tag} ${name} reaction makes sound once`, after > before, `${before}->${after}`);
      check(`${tag} ${name} caption/bubble shown`, (await page.locator("[class*='bubble'], #studio-locals [class*='localsCaption']").first().innerText()).length > 3);
      await settle(2200);
    }

    // --- 3D click on the framed animal reaches the same handler ---
    await page.getByRole("group", { name: "Choose an animal" }).getByRole("button", { name: "Kangaroo" }).click();
    await settle(4500);
    const box = await page.locator("canvas").first().boundingBox();
    if (box) {
      await page.locator("[class*='bubble'] button").click().catch(() => {});
      await settle(2000);
      await page.mouse.click(box.x + box.width / 2 - (run.viewport.width < 700 ? 0 : box.width * 0.13 * 0), box.y + box.height / 2 + 6);
      await settle(900);
      check(`${tag} clicking the kangaroo in 3D shows its caption`, await page.locator("[class*='bubble']").count() > 0);
    }

    // --- mute, volume, persistence ---
    await soundToggle.click();
    check(`${tag} mute works and is remembered`, /Sound off/.test(await soundToggle.innerText()) && JSON.parse(await page.evaluate(() => localStorage.getItem("ab-studio-sound-v1"))).enabled === false);
    const muteBase = await page.evaluate(() => window.__audio.oscillators);
    await page.getByRole("button", { name: "Greet the cockatoo" }).click().catch(() => {});
    await page.getByRole("group", { name: "Choose an animal" }).getByRole("button", { name: "Sulphur-crested cockatoo" }).click();
    await page.getByRole("button", { name: "Greet the cockatoo" }).click();
    await settle(600);
    check(`${tag} muted means silent`, (await page.evaluate(() => window.__audio.oscillators)) === muteBase);
    await page.reload({ waitUntil: "networkidle" });
    check(`${tag} mute remembered after reload`, /Sound off/.test(await page.getByRole("button", { name: /^Sound (on|off)$/ }).innerText()));
    await page.evaluate(() => localStorage.removeItem("ab-studio-sound-v1"));

    // --- background tab: sound pauses ---
    await page.reload({ waitUntil: "networkidle" });
    await page.getByRole("button", { name: "Enter the Studio", exact: true }).click();
    await page.waitForFunction(() => window.__audio.ctx?.state === "running");
    await page.evaluate(() => { Object.defineProperty(document, "hidden", { configurable: true, get: () => true }); document.dispatchEvent(new Event("visibilitychange")); });
    await settle(400);
    check(`${tag} audio suspends when the page is hidden`, (await page.evaluate(() => window.__audio.ctx.state)) === "suspended");
    await page.evaluate(() => { Object.defineProperty(document, "hidden", { configurable: true, get: () => false }); document.dispatchEvent(new Event("visibilitychange")); });
    await settle(400);
    check(`${tag} audio resumes when visible again`, (await page.evaluate(() => window.__audio.ctx.state)) === "running");

    // --- existing journeys still work ---
    await page.getByRole("button", { name: "Skip intro", exact: true }).click().catch(() => {});
    for (const room of ["Portfolio gallery", "Services atelier", "Consultation lounge", "Reception"])
      { await page.getByRole("navigation", { name: "Studio rooms" }).getByRole("button", { name: new RegExp(room) }).click(); check(`${tag} room ${room} opens`, await page.locator("#studio-panel-heading").isVisible()); }
    check(`${tag} contact link present`, await page.locator("a[href='/contact']").first().isVisible());
    await page.getByRole("button", { name: /Guided tour/ }).click();
    check(`${tag} guided tour starts`, await page.getByRole("button", { name: "Pause tour" }).isVisible());
    await shot("04-final");

    // --- keyboard: the locals toggle and cards are reachable with visible focus ---
    await page.keyboard.press("Escape");
    await page.getByRole("button", { name: "Meet the locals" }).focus();
    const outline = await page.evaluate(() => getComputedStyle(document.activeElement).outlineStyle);
    check(`${tag} visible focus on Meet the locals`, outline !== "none", outline);
    check(`${tag} no horizontal overflow`, await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1));
    check(`${tag} no console/page errors`, problems.length === 0, problems.slice(0, 4).join(" | "));
    await context.close();
  }

  // reduced motion: the still view carries the full wildlife experience
  const reduced = await browser.newContext({ viewport: { width: 1280, height: 800 }, reducedMotion: "reduce" });
  const page = await reduced.newPage();
  await page.addInitScript(instrument);
  await page.goto(`${base}/studio`, { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "Meet the locals" }).click();
  await page.getByRole("group", { name: "Choose an animal" }).getByRole("button", { name: "Sulphur-crested cockatoo" }).click();
  await page.getByRole("button", { name: "Greet the cockatoo" }).click();
  check("reduced-motion: still view shows locals with a caption", /“.+”/.test(await page.locator("#studio-locals").innerText()));
  check("reduced-motion: no 3D canvas", (await page.locator("canvas").count()) === 0);
  await page.screenshot({ path: `${out}/reduced-motion-still.png`, fullPage: false });
  await reduced.close();
} finally {
  await browser.close();
  await writeFile(`${out}/report.json`, JSON.stringify(report, null, 2));
  console.log(`${report.filter((r) => r.ok).length}/${report.length} checks passed`);
}
