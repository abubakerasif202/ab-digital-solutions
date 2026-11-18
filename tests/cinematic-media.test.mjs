import assert from "node:assert/strict";
import test from "node:test";
import { canAutoplayCinematicMedia, cinematicMediaVariant } from "../app/components/cinematic/media-policy.ts";

test("cinematic autoplay respects reduced motion, data saving and slow connections", () => {
  assert.equal(canAutoplayCinematicMedia({ reducedMotion: false }), true);
  assert.equal(canAutoplayCinematicMedia({ reducedMotion: true }), false);
  assert.equal(canAutoplayCinematicMedia({ reducedMotion: false, saveData: true }), false);
  for (const effectiveType of ["slow-2g", "2g", "3g"]) {
    assert.equal(canAutoplayCinematicMedia({ reducedMotion: false, effectiveType }), false);
  }
  assert.equal(canAutoplayCinematicMedia({ reducedMotion: false, effectiveType: "4g" }), true);
});

test("cinematic source selection uses exactly one mobile or desktop variant", () => {
  assert.equal(cinematicMediaVariant(320), "mobile");
  assert.equal(cinematicMediaVariant(720), "mobile");
  assert.equal(cinematicMediaVariant(721), "desktop");
  assert.equal(cinematicMediaVariant(1440), "desktop");
});

test("cinematic derivatives are local, versioned and within the delivery budget", async () => {
  const { stat } = await import("node:fs/promises");
  for (const variant of ["desktop", "mobile"]) {
    for (const extension of ["mp4", "webm"]) {
      const asset = await stat(new URL(`../public/cinematic/sydney-night-v1-${variant}.${extension}`, import.meta.url));
      assert.ok(asset.size > 10000 && asset.size < 1200000);
    }
  }
  for (const name of ["poster", "mobile-poster"]) {
    const asset = await stat(new URL(`../public/cinematic/sydney-night-v1-${name}.webp`, import.meta.url));
    assert.ok(asset.size > 1000 && asset.size < 60000);
  }
});

// Execute the actual TSX component with controlled hooks and browser events. The
// harness intentionally leaves play promises pending, as a buffering browser can.
async function mountCinematicMedia() {
  const { readFile } = await import("node:fs/promises");
  const { Script, createContext } = await import("node:vm");
  const { default: ts } = await import("typescript");
  const source = await readFile(new URL("../app/components/cinematic/CinematicMedia.tsx", import.meta.url), "utf8");
  const javascript = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const state = [], refs = [], effects = [], pending = [];
  let stateCursor = 0, refCursor = 0, mounted = false, observer, idle;
  const motion = Object.assign(new EventTarget(), { matches: false });
  const connection = Object.assign(new EventTarget(), { saveData: false, effectiveType: "4g" });
  const document = Object.assign(new EventTarget(), { hidden: false });
  const video = Object.assign(new EventTarget(), {
    paused: true, src: "", poster: "", plays: 0,
    canPlayType: () => "probably",
    play() {
      this.plays += 1;
      this.paused = false;
      return new Promise((resolve, reject) => pending.push({ resolve, reject }));
    },
    pause() { this.paused = true; },
    load() {},
    removeAttribute(name) { if (name === "src") this.src = ""; },
  });
  const browser = Object.assign(new EventTarget(), {
    innerWidth: 1440,
    matchMedia: () => motion,
    requestIdleCallback(callback) { idle = callback; return 1; },
    cancelIdleCallback() { idle = undefined; },
  });
  const componentModule = { exports: {} };
  const jsx = (type, props) => ({ type, props });
  const sandbox = createContext({
    exports: componentModule.exports,
    require(name) {
      if (name === "react/jsx-runtime") return { jsx, jsxs: jsx };
      if (name === "./media-policy") return { canAutoplayCinematicMedia, cinematicMediaVariant };
      if (name === "react") return {
        useState(initial) {
          const index = stateCursor++;
          if (!(index in state)) state[index] = initial;
          return [state[index], value => { state[index] = value; }];
        },
        useRef(initial) { const index = refCursor++; return refs[index] ??= { current: initial }; },
        useEffect(effect) { if (!mounted) effects.push(effect); },
      };
      throw new Error(`Unexpected dependency: ${name}`);
    },
    window: browser,
    navigator: { connection }, document,
    IntersectionObserver: class {
      constructor(callback) { observer = callback; }
      observe() {}
      disconnect() {}
    },
  });
  new Script(javascript, { filename: "CinematicMedia.cjs" }).runInContext(sandbox);
  const nodes = tree => !tree || typeof tree !== "object" ? [] : [tree, ...[tree.props?.children].flat(Infinity).flatMap(nodes)];
  const render = () => {
    stateCursor = refCursor = 0;
    return componentModule.exports.CinematicMedia({});
  };
  const tree = render();
  for (const node of nodes(tree)) if (node.props?.ref) node.props.ref.current = node.type === "video" ? video : {};
  const cleanup = effects.map(effect => effect());
  mounted = true;
  return {
    video, pending,
    beginPlaybackWindow() { browser.dispatchEvent(new Event("load")); idle?.(); },
    intersect: visible => observer([{ isIntersecting: visible }]),
    visibility(hidden) { document.hidden = hidden; document.dispatchEvent(new Event("visibilitychange")); },
    preference(reduced) { motion.matches = reduced; motion.dispatchEvent(new Event("change")); },
    click: () => nodes(render()).find(node => node.type === "button").props.onClick(),
    mediaEvent(name) { nodes(render()).find(node => node.type === "video").props[name]?.(); },
    playing: () => render().props["data-playing"],
    unmount: () => cleanup.forEach(dispose => dispose?.()),
  };
}
const flushPlay = async () => { await Promise.resolve(); await Promise.resolve(); };
const abort = () => new DOMException("Playback interrupted by pause", "AbortError");

test("visible cinematic media stays poster-only before the deferred playback window", async () => {
  const media = await mountCinematicMedia();
  media.intersect(true);
  assert.equal(media.video.src, "");
  assert.equal(media.video.plays, 0);
  media.beginPlaybackWindow();
  assert.match(media.video.src, /desktop-lite\.webm$/);
  assert.equal(media.video.plays, 1);
  media.unmount();
});

test("pending playback interrupted offscreen or in a hidden tab resumes automatically", async () => {
  for (const interruption of ["offscreen", "hidden"]) {
    const media = await mountCinematicMedia();
    media.beginPlaybackWindow();
    media.intersect(true);
    assert.equal(media.video.plays, 1);
    if (interruption === "offscreen") media.intersect(false);
    else media.visibility(true);
    media.pending[0].reject(abort());
    await flushPlay();
    if (interruption === "offscreen") media.intersect(true);
    else media.visibility(false);
    assert.equal(media.video.plays, 2, `${interruption} interruption must not permanently block playback`);
    media.unmount();
  }
});

test("stale play rejection after source detachment cannot block a newer attempt", async () => {
  const media = await mountCinematicMedia();
  media.beginPlaybackWindow();
  media.intersect(true);
  media.preference(true);
  assert.equal(media.video.src, "");
  media.preference(false);
  assert.equal(media.video.plays, 2);
  media.pending[0].reject(abort());
  await flushPlay();
  media.intersect(false);
  media.intersect(true);
  assert.equal(media.video.plays, 3);
  media.unmount();
  media.pending[1].reject(abort());
  await flushPlay();
  assert.equal(media.video.src, "");
});

test("real autoplay denial leaves the still frame rather than retrying on visibility", async () => {
  const media = await mountCinematicMedia();
  media.beginPlaybackWindow();
  media.intersect(true);
  media.video.paused = true;
  media.pending[0].reject(new DOMException("Autoplay denied", "NotAllowedError"));
  await flushPlay();
  media.intersect(false);
  media.intersect(true);
  assert.equal(media.video.plays, 1);
  media.unmount();
});

test("poster stays visible during pending play until a frame is actually playing", async () => {
  const media = await mountCinematicMedia();
  media.beginPlaybackWindow();
  media.intersect(true);
  media.mediaEvent("onPlay");
  assert.equal(media.playing(), false);
  media.mediaEvent("onPlaying");
  assert.equal(media.playing(), true);
  media.mediaEvent("onPause");
  assert.equal(media.playing(), false);
  media.unmount();
});

test("preference detachment clears the displayed playing state without a queued pause event", async () => {
  const media = await mountCinematicMedia();
  media.beginPlaybackWindow();
  media.intersect(true);
  media.mediaEvent("onPlaying");
  assert.equal(media.playing(), true);
  media.preference(true);
  assert.equal(media.video.src, "");
  assert.equal(media.playing(), false);
  media.unmount();
});
