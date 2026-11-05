// Local browser QA for the Studio controls, mobile layout, still/3D switching and enquiry paths.
// Run against a production server: QA_BASE_URL=http://127.0.0.1:3100 node scripts/studio-v5-qa.mjs
import { chromium } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";

const base = process.env.QA_BASE_URL || "http://127.0.0.1:3100";
if (!["localhost", "127.0.0.1"].includes(new URL(base).hostname)) throw new Error("Local QA only.");
const out = process.env.QA_OUT || "qa/studio-v5";
await mkdir(out, { recursive: true });
const browser = await chromium.launch({ args: ["--no-sandbox", "--enable-unsafe-swiftshader", "--use-angle=swiftshader"] });
const report = [];
const check = (name, ok, detail = "") => { report.push({ name, ok: !!ok, detail: String(detail) }); if (!ok) console.log("FAIL", name, detail); };
const rooms = [["Reception", "reception"], ["Portfolio gallery", "gallery"], ["Services atelier", "services"], ["Consultation lounge", "consultation"]];

try {
  const widths = (process.env.QA_WIDTHS || "360,390,430,1440").split(",").map(Number);
  for (const [width, height] of [[360, 780], [390, 844], [430, 932], [1440, 1000]].filter(([w]) => widths.includes(w))) {
    const tag = `${width}`;
    const context = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 1, hasTouch: width < 700 });
    const page = await context.newPage();
    page.setDefaultTimeout(120000); // software WebGL can stall the main thread at desktop sizes
    const messages = [];
    page.on("pageerror", (error) => messages.push(`pageerror: ${error.message}`));
    page.on("console", (message) => { if (["error", "warning"].includes(message.type())) messages.push(`${message.type()}: ${message.text().slice(0, 240)}`); });
    await page.route("**/api/analytics", (route) => route.fulfill({ status: 204 }));
    await page.route("**/_vercel/**", (route) => route.fulfill({ status: 200, body: "" }));
    // Software WebGL can take long to paint a frame at desktop sizes, so screenshots get a generous timeout and never abort the run.
    const shot = (label) => page.screenshot({ path: `${out}/${tag}-${label}.png`, timeout: 120000 }).catch((error) => check(`${tag} screenshot ${label}`, false, error.message.split("\n")[0]));
    const overflow = async (label) => check(`${tag} no horizontal overflow (${label})`, await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1), await page.evaluate(() => document.documentElement.scrollWidth));
    const mode = () => page.locator("section[aria-label='Interactive virtual studio'] [data-mode]").getAttribute("data-mode");
    const roomButton = (label) => page.getByRole("navigation", { name: "Studio rooms" }).getByRole("button", { name: new RegExp(label) });
    const openOptions = async () => { const toggle = page.getByRole("button", { name: "View options" }); if ((await toggle.getAttribute("aria-expanded")) !== "true") await toggle.click(); };
    const panelHeading = () => page.locator("#studio-panel-heading");

    await page.goto(`${base}/studio`, { waitUntil: "networkidle" });
    check(`${tag} Studio link in header is current`, await page.locator("#primary-navigation a[href='/studio'][aria-current='page']").count() === 1);
    await overflow("load");
    await shot("00-entry");
    await page.getByRole("button", { name: "Enter the Studio", exact: true }).click();
    await page.waitForFunction(() => ["arrival", "intro", "explore", "failed"].includes(document.querySelector("[data-mode]")?.dataset.mode), null, { timeout: 90000 });
    check(`${tag} 3D activated`, (await mode()) !== "failed", await mode());
    await page.getByRole("button", { name: "Skip intro", exact: true }).click().catch(() => {});
    await page.waitForTimeout(2500);
    await shot("01-overview");

    // Rooms and their panels.
    for (const [label, key] of rooms) {
      await roomButton(label).click();
      await page.waitForTimeout(2300);
      const panel = page.locator("aside[aria-labelledby='studio-panel-heading']");
      check(`${tag} ${key} panel opens`, await panel.isVisible());
      check(`${tag} ${key} heading focused`, await page.evaluate(() => document.activeElement?.id === "studio-panel-heading"));
      if (width < 700) {
        const flow = await panel.evaluate((node) => ({ position: getComputedStyle(node).position, scrolls: node.scrollHeight > node.clientHeight + 1 && getComputedStyle(node).overflowY !== "visible" }));
        check(`${tag} ${key} mobile panel is in page flow, no nested scroll`, flow.position === "static" && !flow.scrolls, JSON.stringify(flow));
      }
      await overflow(key);
      await shot(`02-${key}`);
    }

    // Gallery: next/previous, thumbnail, selector all stay in sync.
    await roomButton("Portfolio gallery").click();
    await page.waitForTimeout(1500);
    const counter = page.locator("p[role='status']").filter({ hasText: /^Project \d+ of \d+/ });
    const total = Number((await counter.textContent()).match(/of (\d+)/)[1]);
    check(`${tag} project count derives from data (18)`, total === 18, total);
    await page.getByRole("button", { name: "Next project" }).click();
    check(`${tag} next project advances`, /^Project 2 of/.test(await counter.textContent()), await counter.textContent());
    await page.getByRole("button", { name: "Pept Up Labs" }).click();
    check(`${tag} thumbnail selects Pept Up Labs`, /Pept Up Labs/.test(await counter.textContent()) && (await page.locator("#studio-project").inputValue()) === "17");
    check(`${tag} case study link matches`, (await page.getByRole("link", { name: "View case study" }).getAttribute("href")) === "/work/pept-up-labs");
    await page.getByRole("button", { name: "Next project" }).click();
    check(`${tag} next wraps to first`, /^Project 1 of/.test(await counter.textContent()));
    await page.locator("#studio-project").selectOption({ label: "Wild Pest Solutions" });
    check(`${tag} selector selects Wild Pest Solutions`, /Wild Pest Solutions/.test(await counter.textContent()));
    await page.waitForTimeout(1200);
    await shot("03-gallery-wild-pest");

    // Services chips + prefill link.
    await roomButton("Services atelier").click();
    await page.getByRole("button", { name: "E-commerce Website Development" }).click();
    check(`${tag} service enquiry link carries validated service`, (await page.getByRole("link", { name: "Enquire about this" }).getAttribute("href")) === "/contact?service=E-commerce%20solutions");
    check(`${tag} custom systems service listed`, await page.getByRole("button", { name: "Custom business systems" }).count() === 1);

    // Consultation contact options.
    await roomButton("Consultation lounge").click();
    check(`${tag} consultation has call and WhatsApp`, await page.locator("aside a[href^='tel:']").count() === 1 && await page.locator("aside a[href^='https://wa.me/']").count() === 1);
    check(`${tag} consultation primary CTA`, (await page.locator("aside").getByRole("link", { name: "Start a project" }).getAttribute("href")) === "/contact");
    await page.waitForTimeout(1500);

    // Still view keeps the room and the project; 3D view returns to the same state.
    await openOptions();
    await page.getByRole("button", { name: "Still view", exact: true }).click();
    await page.waitForTimeout(500);
    check(`${tag} still view keeps the room panel`, await panelHeading().textContent() === "Tell us what you’re building." && (await mode()) === "static");
    await shot("04-still-consultation");
    await roomButton("Portfolio gallery").click();
    check(`${tag} still view keeps selected project`, /Wild Pest Solutions/.test(await counter.textContent()));
    await openOptions();
    await page.getByRole("button", { name: "3D view", exact: true }).click();
    await page.waitForFunction(() => document.querySelector("[data-mode]")?.dataset.mode === "explore", null, { timeout: 90000 });
    check(`${tag} 3D view resumes in the same room and project`, /Wild Pest Solutions/.test(await counter.textContent()) && (await panelHeading().textContent()) === "Work with purpose.");
    await page.waitForTimeout(2200);
    await shot("05-3d-resumed");

    // Escape closes details first; tour start / pause / resume / stop / interruption.
    await page.keyboard.press("Escape");
    check(`${tag} Escape closes the panel`, await page.locator("aside[aria-labelledby='studio-panel-heading']").count() === 0);
    const tourStatus = page.locator("[role=group][aria-label='Guided tour'] [role=status]");
    await page.getByRole("button", { name: "Guided tour", exact: true }).click();
    check(`${tag} tour status shown`, /Tour · Reception · 1 of 4/.test(await tourStatus.textContent()));
    await page.keyboard.press("Escape");
    check(`${tag} Escape pauses the tour`, /paused/.test(await tourStatus.textContent()));
    await page.getByRole("button", { name: "Resume tour" }).click();
    await page.getByRole("button", { name: "Pause tour" }).click();
    await page.getByRole("button", { name: "Stop tour" }).click();
    check(`${tag} Stop tour returns to Guided tour`, await page.getByRole("button", { name: "Guided tour", exact: true }).count() === 1);
    await page.getByRole("button", { name: "Guided tour", exact: true }).click();
    await roomButton("Services atelier").click();
    check(`${tag} manual room choice interrupts the tour`, await page.getByRole("button", { name: "Guided tour", exact: true }).count() === 1);
    await page.waitForTimeout(1500);

    // Reset and entrance are different actions.
    await openOptions();
    await page.getByRole("button", { name: /^Reset view/ }).click();
    check(`${tag} reset keeps the room`, await panelHeading().textContent() === "What we can build for you.");
    await page.waitForTimeout(2000);
    await openOptions();
    await page.getByRole("button", { name: /^Back to entrance/ }).click();
    await page.waitForTimeout(2300);
    check(`${tag} entrance closes the panel`, await page.locator("aside[aria-labelledby='studio-panel-heading']").count() === 0 && await page.getByText("Sydney / Studio entrance").count() === 1);
    await shot("06-entrance");

    // Mobile: the sticky CTA never overlaps the studio and stays inside the safe area elsewhere.
    if (width < 700) {
      await page.evaluate(() => document.querySelector("#studio-content")?.scrollIntoView({ block: "start" }));
      await page.waitForTimeout(500);
      const cta = page.locator(".mobile-project-cta");
      if (await cta.count()) {
        const box = await cta.boundingBox();
        check(`${tag} sticky CTA sits inside the safe area`, box && box.y + box.height <= height, JSON.stringify(box));
      }
      await shot("07-directory");
      await page.evaluate(() => document.querySelector("section[aria-label='Interactive virtual studio']")?.scrollIntoView({ block: "start" }));
      await page.waitForTimeout(600);
      check(`${tag} sticky CTA hidden over the studio`, await page.locator(".mobile-project-cta").count() === 0);
    }
    const hard = messages.filter((m) => m.startsWith("error") || m.startsWith("pageerror"));
    check(`${tag} console free of errors`, hard.length === 0, hard.join(" | "));
    report.push({ name: `${tag} console messages`, ok: true, detail: [...new Set(messages)].join(" | ") });
    await context.close();
  }

  // Contact prefill.
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();
  await page.route("**/_vercel/**", (route) => route.fulfill({ status: 200, body: "" }));
  for (const [query, expected] of [["service=E-commerce%20solutions", ["E-commerce solutions"]], ["service=Not%20a%20service", ["Website design & development"]], ["", ["Website design & development"]]]) {
    await page.goto(`${base}/contact${query ? `?${query}` : ""}`, { waitUntil: "networkidle" });
    const checkedValues = await page.locator("input[name=service]:checked").evaluateAll((nodes) => nodes.map((node) => node.value));
    check(`contact prefill "${query}"`, JSON.stringify(checkedValues) === JSON.stringify(expected), JSON.stringify(checkedValues));
  }
  await context.close();
} finally {
  await browser.close();
  await writeFile(`${out}/report.json`, JSON.stringify(report, null, 2));
  const failed = report.filter((entry) => !entry.ok);
  console.log(`${report.length - failed.length}/${report.length} checks passed`);
  process.exitCode = failed.length ? 1 : 0;
}
