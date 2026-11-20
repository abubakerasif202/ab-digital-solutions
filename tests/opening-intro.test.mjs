import assert from "node:assert/strict";
import { readdir, readFile, stat } from "node:fs/promises";
import test from "node:test";
import { openingIntroGateScript } from "../app/components/opening-intro/opening-intro-gate.ts";
import { startOpeningIntro, SKIP_LABEL } from "../app/components/opening-intro/opening-intro.ts";
import { OPENING_INTRO_ATTRIBUTE as ATTR, OPENING_INTRO_LIVE_ATTRIBUTE as LIVE, OPENING_INTRO_SEEN_KEY as KEY, openingIntroTiming as timing } from "../app/components/opening-intro/opening-intro-config.ts";

const read = (path) => readFile(new URL(path, import.meta.url), "utf8");

// ---------- inline gate ----------
function runGate({ pathname = "/", hash = "", ua = "Mozilla/5.0 (Linux; Android 14) Chrome/136 Mobile Safari/537.36", webdriver = false, navType = "navigate", reduced = false, connection, visibility = "visible", seen = false, storageThrows = false } = {}) {
  const attrs = new Map();
  const store = new Map(seen ? [[KEY, "1"]] : []);
  const timers = [];
  const documentElement = {
    setAttribute: (k, v) => attrs.set(k, v), getAttribute: (k) => (attrs.has(k) ? attrs.get(k) : null),
    hasAttribute: (k) => attrs.has(k), removeAttribute: (k) => attrs.delete(k),
  };
  const sessionStorage = storageThrows ? { getItem() { throw new Error("denied"); }, setItem() { throw new Error("denied"); } } : { getItem: (k) => store.get(k) ?? null, setItem: (k, v) => store.set(k, v) };
  const performance = { getEntriesByType: () => [{ type: navType }] };
  const window = { matchMedia: (q) => ({ matches: reduced && q.includes("reduced-motion") }), sessionStorage, performance };
  const navigator = { userAgent: ua, webdriver, connection };
  new Function("document", "window", "navigator", "location", "performance", "setTimeout", openingIntroGateScript)(
    { documentElement, visibilityState: visibility }, window, navigator, { pathname, hash }, performance, (fn, ms) => timers.push({ fn, ms }),
  );
  return { attrs, store, timers, enabled: attrs.get(ATTR) === "on" };
}

test("gate enables the intro on the homepage's first visit and sets the session flag", () => {
  const result = runGate();
  assert.equal(result.enabled, true);
  assert.equal(result.store.get(KEY), "1");
  assert.equal(result.timers[0].ms, timing.watchdogMs);
});

test("gate never enables the intro on other routes or hash links", () => {
  for (const pathname of ["/work", "/work/hf-removals-adelaide", "/studio", "/about", "/services", "/contact", "/privacy"]) {
    const result = runGate({ pathname });
    assert.equal(result.enabled, false, pathname);
    assert.equal(result.store.has(KEY), false, `${pathname} must not burn the flag`);
  }
  assert.equal(runGate({ hash: "#contact" }).enabled, false);
});

test("the session flag suppresses a second visit", () => {
  assert.equal(runGate({ seen: true }).enabled, false);
});

test("reduced motion, back/forward, bots and automation never see the intro", () => {
  assert.equal(runGate({ reduced: true }).enabled, false);
  assert.equal(runGate({ navType: "back_forward" }).enabled, false);
  assert.equal(runGate({ webdriver: true }).enabled, false, "webdriver (Playwright, Puppeteer, Lighthouse)");
  for (const ua of ["Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)", "Mozilla/5.0 HeadlessChrome/136", "Mozilla/5.0 Chrome-Lighthouse", "Mozilla/5.0 (compatible; bingbot/2.0)", "Mozilla/5.0 AdsBot-Google"]) {
    assert.equal(runGate({ ua }).enabled, false, ua);
  }
  assert.equal(runGate({ ua: "Mozilla/5.0 (Linux; Android 10; Cubot X50) Chrome/136 Mobile Safari/537.36" }).enabled, true, "a phone brand containing 'bot' is a real visitor");
  assert.equal(runGate({ visibility: "hidden" }).enabled, false);
});

test("data-saver and slow connections skip the film, and storage failures fail safe", () => {
  assert.equal(runGate({ connection: { saveData: true } }).enabled, false);
  assert.equal(runGate({ connection: { effectiveType: "3g" } }).enabled, false);
  assert.equal(runGate({ connection: { effectiveType: "slow-2g" } }).enabled, false);
  assert.equal(runGate({ connection: { effectiveType: "4g", downlink: 1.2 } }).enabled, false);
  assert.equal(runGate({ connection: { effectiveType: "4g", downlink: 10 } }).enabled, true);
  assert.equal(runGate({ storageThrows: true }).enabled, false);
});

test("the gate's watchdog removes the attribute unless the controller took over", () => {
  const stuck = runGate();
  stuck.timers[0].fn();
  assert.equal(stuck.attrs.has(ATTR), false, "never stuck behind the shade");
  const live = runGate();
  live.attrs.set(LIVE, "");
  live.timers[0].fn();
  assert.equal(live.attrs.get(ATTR), "on", "a live controller owns the lifecycle");
});

// ---------- controller ----------
class El {
  constructor(tag, doc) { this.tagName = tag.toUpperCase(); this.doc = doc; this.attrs = new Map(); this.children = []; this.parent = null; this.listeners = new Map(); this.className = ""; this.id = ""; this.textContent = ""; this.muted = false; }
  setAttribute(k, v) { this.attrs.set(k, String(v)); }
  getAttribute(k) { return this.attrs.has(k) ? this.attrs.get(k) : null; }
  hasAttribute(k) { return this.attrs.has(k); }
  removeAttribute(k) { this.attrs.delete(k); }
  append(...nodes) { nodes.forEach((node) => { node.parent = this; this.children.push(node); }); }
  remove() { if (!this.parent) return; this.parent.children = this.parent.children.filter((c) => c !== this); this.parent = null; }
  addEventListener(type, fn) { this.listeners.set(type, [...(this.listeners.get(type) ?? []), fn]); }
  removeEventListener(type, fn) { this.listeners.set(type, (this.listeners.get(type) ?? []).filter((f) => f !== fn)); }
  emit(type, event = {}) { [...(this.listeners.get(type) ?? [])].forEach((fn) => fn(event)); }
  focus() { this.doc.activeElement = this; }
  pause() { this.paused = true; }
}
function setup({ reduced = false, compact = false, play = () => Promise.resolve(), withButton = true } = {}) {
  const doc = { listeners: new Map() };
  doc.documentElement = new El("html", doc);
  doc.body = new El("body", doc);
  doc.activeElement = doc.body;
  doc.createElement = (tag) => { const el = new El(tag, doc); if (tag === "video") el.play = play; return el; };
  const walk = (el, fn) => { fn(el); el.children.forEach((c) => walk(c, fn)); };
  doc.getElementById = (id) => { let found = null; walk(doc.body, (el) => { if (el.id === id) found = el; }); return found; };
  doc.contains = (el) => { let found = false; walk(doc.body, (n) => { if (n === el) found = true; }); return found; };
  doc.addEventListener = (type, fn) => doc.listeners.set(type, [...(doc.listeners.get(type) ?? []), fn]);
  doc.removeEventListener = (type, fn) => doc.listeners.set(type, (doc.listeners.get(type) ?? []).filter((f) => f !== fn));
  doc.press = (key) => [...(doc.listeners.get("keydown") ?? [])].forEach((fn) => fn({ key }));
  const main = doc.createElement("main"); main.id = "main-content";
  const header = doc.createElement("header");
  const trigger = withButton ? doc.createElement("button") : null;
  doc.body.append(header, main, ...(trigger ? [trigger] : []));
  doc.documentElement.setAttribute(ATTR, "on");
  if (trigger) trigger.focus();
  const win = { matchMedia: (q) => ({ matches: (reduced && q.includes("reduced-motion")) || (compact && q.includes("max-width")) }) };
  let now = 0; let queue = [];
  const timers = {
    setTimeout: (fn, ms) => { const t = { fn, at: now + ms, live: true }; queue.push(t); return t; },
    clearTimeout: (t) => { if (t) t.live = false; },
  };
  const advance = (ms) => { const end = now + ms; for (;;) { const due = queue.filter((t) => t.live && t.at <= end).sort((a, b) => a.at - b.at)[0]; if (!due) break; due.live = false; now = due.at; due.fn(); } now = end; };
  const stop = startOpeningIntro({ window: win, document: doc, timers });
  const overlay = doc.getElementById("opening-intro");
  const video = overlay?.children.find((c) => c.tagName === "VIDEO");
  const skip = overlay?.children.find((c) => c.tagName === "BUTTON");
  return { doc, win, main, header, trigger, overlay, video, skip, advance, stop };
}
const attrOn = (t) => t.doc.documentElement.getAttribute(ATTR);

test("the overlay carries the required video attributes, WebM before MP4, and an accessible Skip button", () => {
  const t = setup();
  assert.ok(t.overlay);
  for (const [name, value] of [["muted", ""], ["playsinline", ""], ["autoplay", ""], ["preload", "auto"], ["poster", "/intro/ab-intro-poster.webp"], ["aria-hidden", "true"]]) assert.equal(t.video.getAttribute(name), value, name);
  assert.equal(t.video.hasAttribute("controls"), false);
  assert.deepEqual(t.video.children.map((s) => s.getAttribute("src")), ["/intro/ab-intro-1280.webm", "/intro/ab-intro-1280.mp4"]);
  assert.deepEqual(t.video.children.map((s) => s.getAttribute("type")), ["video/webm", "video/mp4"]);
  assert.equal(t.skip.textContent, SKIP_LABEL);
  assert.equal(t.skip.getAttribute("type"), "button");
  assert.equal(t.doc.activeElement, t.skip, "focus moves to Skip");
  assert.equal(t.header.hasAttribute("inert") && t.main.hasAttribute("inert"), true, "page is inert behind the overlay");
});

test("phones get the 640 px crop and desktops the 1280 file", () => {
  const phone = setup({ compact: true });
  assert.deepEqual(phone.video.children.map((s) => s.getAttribute("src")), ["/intro/ab-intro-mobile.webm", "/intro/ab-intro-mobile.mp4"]);
});

test("Skip fades the overlay, removes it, releases scroll lock and inert, and returns focus", () => {
  const t = setup();
  t.skip.emit("click");
  assert.equal(attrOn(t), "leaving");
  assert.equal(t.overlay.hasAttribute("data-leaving"), true);
  assert.ok(t.doc.getElementById("opening-intro"), "still present while fading");
  t.advance(timing.fadeMs + 60);
  assert.equal(t.doc.getElementById("opening-intro"), null, "removed from the DOM");
  assert.equal(t.doc.documentElement.hasAttribute(ATTR), false, "scroll lock released");
  assert.equal(t.doc.documentElement.hasAttribute(LIVE), false);
  assert.equal(t.main.hasAttribute("inert") || t.header.hasAttribute("inert"), false);
  assert.equal(t.doc.activeElement, t.trigger, "focus returns to where it was");
  assert.equal((t.doc.listeners.get("keydown") ?? []).length, 0, "no listeners leak");
});

test("Escape dismisses, and focus falls back to the main landmark when nothing was focused", () => {
  const t = setup({ withButton: false });
  t.doc.press("Enter");
  assert.equal(t.doc.getElementById("opening-intro") !== null, true, "other keys do nothing");
  t.doc.press("Escape");
  t.advance(timing.fadeMs + 60);
  assert.equal(t.doc.getElementById("opening-intro"), null);
  assert.equal(t.doc.activeElement, t.main);
  assert.equal(t.main.getAttribute("tabindex"), "-1");
  t.main.emit("blur");
  assert.equal(t.main.hasAttribute("tabindex"), false, "temporary tabindex is cleaned up");
});

test("the film ending fades the intro out on its own", () => {
  const t = setup();
  t.video.emit("playing");
  t.advance(4750);
  assert.equal(attrOn(t), "on", "still playing");
  t.video.emit("ended");
  t.advance(timing.fadeMs + 60);
  assert.equal(t.doc.getElementById("opening-intro"), null);
});

test("reduced motion does not play: no overlay is created and the page is released at once", () => {
  const t = setup({ reduced: true });
  assert.equal(t.overlay, null);
  assert.equal(t.doc.documentElement.hasAttribute(ATTR), false);
  assert.equal(t.doc.body.children.some((c) => c.hasAttribute("inert")), false);
});

test("failures remove the overlay: video error, no start within 800 ms, blocked autoplay, stall, 6 s cap", async () => {
  const gone = (t) => t.doc.getElementById("opening-intro") === null && !t.doc.documentElement.hasAttribute(ATTR);

  const errored = setup(); errored.video.emit("error"); errored.advance(timing.fadeMs + 60);
  assert.ok(gone(errored), "video error");

  const lastSource = setup(); lastSource.video.children.at(-1).emit("error"); lastSource.advance(timing.fadeMs + 60);
  assert.ok(gone(lastSource), "no playable source");

  const slow = setup(); slow.advance(timing.startMs - 1);
  assert.equal(attrOn(slow), "on", "not yet");
  slow.advance(timing.fadeMs + 70);
  assert.ok(gone(slow), "never started within 800 ms");

  const blocked = setup({ play: () => Promise.reject(new Error("NotAllowedError")) });
  await Promise.resolve(); await Promise.resolve();
  blocked.advance(timing.fadeMs + 60);
  assert.ok(gone(blocked), "autoplay refused");

  const throws = setup({ play: () => { throw new Error("no play"); } }); throws.advance(timing.fadeMs + 60);
  assert.ok(gone(throws), "play() throws");

  const stalled = setup(); stalled.video.emit("playing"); stalled.video.emit("waiting");
  stalled.advance(timing.stallMs + timing.fadeMs + 60);
  assert.ok(gone(stalled), "stalled mid-playback");

  const recovers = setup(); recovers.video.emit("playing"); recovers.video.emit("waiting"); recovers.advance(timing.stallMs - 100); recovers.video.emit("playing"); recovers.advance(1000);
  assert.equal(attrOn(recovers), "on", "a brief stall that recovers keeps playing");

  const hung = setup(); hung.video.emit("playing"); hung.advance(timing.maxMs + timing.fadeMs + 60);
  assert.ok(gone(hung), "6 s safety cap");
  assert.ok(timing.maxMs <= 6000 && timing.startMs <= 800);
});

test("stop() tears everything down immediately", () => {
  const t = setup();
  t.stop();
  assert.equal(t.doc.getElementById("opening-intro"), null);
  assert.equal(t.doc.documentElement.hasAttribute(ATTR), false);
  t.advance(10000); // late timers are inert
});

// ---------- wiring and performance guards ----------
test("only the homepage mounts the intro and nothing preloads the video", async () => {
  const importers = [];
  const walk = async (dir) => {
    for (const entry of await readdir(new URL(dir, import.meta.url), { withFileTypes: true })) {
      const path = `${dir}${entry.name}`;
      if (entry.isDirectory()) { if (!["opening-intro", "node_modules"].includes(entry.name)) await walk(`${path}/`); continue; }
      if (/\.(tsx?|css)$/.test(entry.name) && /opening-intro/.test(await read(path))) importers.push(path);
    }
  };
  await walk("../app/");
  assert.deepEqual(importers, ["../app/page.tsx"], "layout and every other route stay free of the intro");
  const [layout, page, loader, config] = await Promise.all([read("../app/layout.tsx"), read("../app/page.tsx"), read("../app/components/opening-intro/OpeningIntro.tsx"), read("../next.config.ts")]);
  assert.doesNotMatch(layout, /ab-intro|opening-intro|rel="preload"/);
  assert.match(page, /<OpeningIntroGate \/>[\s\S]*<AgencyHome[\s\S]*<OpeningIntro \/>/);
  assert.match(loader, /import\("\.\/opening-intro"\)/, "controller is a lazily loaded chunk");
  assert.doesNotMatch(loader, /from "\.\/opening-intro"/);
  assert.doesNotMatch(await read("../app/components/opening-intro/OpeningIntroGate.tsx"), /<video|<link/);
  assert.match(config, /"\/intro\/:path\*"/, "intro files are cacheable");
  assert.match(config, /script-src 'self' 'unsafe-inline'/, "CSP is unchanged: the inline gate relies on the existing allowance");
});

test("intro CSS animates opacity only, never crops the video and respects reduced motion", async () => {
  const css = await read("../app/components/opening-intro/opening-intro.css");
  const transitions = [...css.matchAll(/transition:\s*([^;]+);/g)].map((m) => m[1].trim().split(/\s+/)[0]);
  assert.ok(transitions.length >= 2);
  assert.ok(transitions.every((property) => property === "opacity"), `only opacity transitions, got ${transitions}`);
  assert.doesNotMatch(css, /@keyframes|animation:/);
  assert.match(css, /object-fit:\s*contain/);
  assert.match(css, /\.opening-intro-shade \{ display: none; \}/, "hidden unless the gate enables it");
  assert.match(css, /prefers-reduced-motion: reduce[\s\S]*display: none/);
  assert.match(css, new RegExp(`--opening-intro-fade: ${timing.fadeMs}ms`), "CSS fade matches the controller's timing");
});

test("the intro assets ship under public/intro with the expected names and sizes", async () => {
  const sizes = {};
  for (const name of ["ab-intro-1280.webm", "ab-intro-1280.mp4", "ab-intro-mobile.webm", "ab-intro-mobile.mp4", "ab-intro-poster.webp"]) sizes[name] = (await stat(new URL(`../public/intro/${name}`, import.meta.url))).size;
  assert.ok(sizes["ab-intro-poster.webp"] < 10_000, "poster stays tiny");
  assert.ok(sizes["ab-intro-mobile.webm"] < 700_000 && sizes["ab-intro-mobile.mp4"] < 700_000, "phones download the small files");
});
