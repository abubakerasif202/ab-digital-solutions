import {
  OPENING_INTRO_ATTRIBUTE,
  OPENING_INTRO_LIVE_ATTRIBUTE,
  openingIntroAssets,
  openingIntroTiming,
} from "./opening-intro-config";

type Timers = { setTimeout: (callback: () => void, ms: number) => unknown; clearTimeout: (handle: unknown) => void };
export type OpeningIntroEnv = { window?: Window; document?: Document; timers?: Timers };

export const SKIP_LABEL = "Skip intro";

/**
 * Runs the opening intro after the inline gate has enabled it. Plain DOM, no React: it builds a full-screen
 * overlay (video + Skip button) above the server-rendered shade, and removes everything again however it ends.
 * Returns a function that ends the intro immediately.
 *
 * Every exit path (ended, Skip, Escape, error, stall, slow start, autoplay blocked, 6 s cap) goes through
 * finish(), which fades the overlay (opacity only), then removes it, restores scroll, inert siblings and focus.
 */
export function startOpeningIntro(env: OpeningIntroEnv = {}): () => void {
  const win = env.window ?? window;
  const doc = env.document ?? document;
  const timers: Timers = env.timers ?? {
    setTimeout: (callback, ms) => win.setTimeout(callback, ms),
    clearTimeout: (handle) => win.clearTimeout(handle as number),
  };
  const root = doc.documentElement;
  const releasePage = () => {
    root.removeAttribute(OPENING_INTRO_ATTRIBUTE);
    root.removeAttribute(OPENING_INTRO_LIVE_ATTRIBUTE);
  };

  // Reduced motion is an accessibility requirement, not an optimisation: never play, never cover the page.
  if (win.matchMedia("(prefers-reduced-motion: reduce)").matches) { releasePage(); return () => {}; }

  root.setAttribute(OPENING_INTRO_LIVE_ATTRIBUTE, "");
  const previousFocus = doc.activeElement;
  const compact = win.matchMedia(openingIntroAssets.mobileQuery).matches;
  const files = compact ? openingIntroAssets.mobile : openingIntroAssets.desktop;

  const overlay = doc.createElement("div");
  overlay.className = "opening-intro";
  overlay.id = "opening-intro";
  overlay.setAttribute("role", "presentation");

  // Decorative brand moment: the media is hidden from assistive technology, the Skip button is not.
  const video = doc.createElement("video");
  video.className = "opening-intro-video";
  video.setAttribute("aria-hidden", "true");
  video.setAttribute("muted", "");
  video.muted = true;
  video.setAttribute("playsinline", "");
  video.setAttribute("autoplay", "");
  video.setAttribute("preload", "auto");
  video.setAttribute("poster", openingIntroAssets.poster);
  video.setAttribute("disablepictureinpicture", "");
  const sources = ([[files.webm, "video/webm"], [files.mp4, "video/mp4"]] as const).map(([src, type]) => {
    const source = doc.createElement("source");
    source.setAttribute("src", src);
    source.setAttribute("type", type);
    return source;
  });
  sources.forEach((source) => video.append(source));

  const skip = doc.createElement("button");
  skip.className = "opening-intro-skip";
  skip.setAttribute("type", "button");
  skip.textContent = SKIP_LABEL;
  overlay.append(video, skip);
  doc.body.append(overlay);

  // Everything behind the overlay is unreachable (keyboard and screen readers) for the intro's lifetime only.
  const inerted = Array.from(doc.body.children).filter((element) => element !== overlay && !element.hasAttribute("inert"));
  inerted.forEach((element) => element.setAttribute("inert", ""));
  skip.focus({ preventScroll: true });

  let started = false;
  let ended = false;
  let stallTimer: unknown;
  let removeTimer: unknown;

  const restoreFocus = () => {
    const prior = previousFocus as HTMLElement | null;
    const target = prior && prior !== doc.body && doc.contains(prior) ? prior : doc.getElementById("main-content");
    if (!target) return;
    if (!target.hasAttribute("tabindex") && !/^(A|BUTTON|INPUT|SELECT|TEXTAREA)$/.test(target.tagName)) {
      target.setAttribute("tabindex", "-1");
      target.addEventListener("blur", () => target.removeAttribute("tabindex"), { once: true });
    }
    target.focus({ preventScroll: true });
  };
  const teardown = () => {
    timers.clearTimeout(removeTimer);
    doc.removeEventListener("keydown", onKey);
    skip.removeEventListener("click", onSkip);
    video.pause?.();
    overlay.remove();
    inerted.forEach((element) => element.removeAttribute("inert"));
    releasePage();
    restoreFocus();
  };
  function finish(immediate = false) {
    if (ended) return;
    ended = true;
    [startTimer, stallTimer, capTimer].forEach((timer) => timers.clearTimeout(timer));
    if (immediate) { teardown(); return; }
    // Opacity-only fade (see opening-intro.css), then remove from the DOM.
    root.setAttribute(OPENING_INTRO_ATTRIBUTE, "leaving");
    overlay.setAttribute("data-leaving", "");
    removeTimer = timers.setTimeout(teardown, openingIntroTiming.fadeMs + 50);
  }
  function onKey(event: KeyboardEvent) { if (event.key === "Escape") finish(); }
  function onSkip() { finish(); }
  doc.addEventListener("keydown", onKey);
  skip.addEventListener("click", onSkip);

  const onPlaying = () => {
    started = true;
    timers.clearTimeout(startTimer);
    timers.clearTimeout(stallTimer);
  };
  const onStall = () => {
    if (!started || ended) return;
    timers.clearTimeout(stallTimer);
    stallTimer = timers.setTimeout(() => finish(), openingIntroTiming.stallMs);
  };
  video.addEventListener("playing", onPlaying);
  video.addEventListener("waiting", onStall);
  video.addEventListener("stalled", onStall);
  video.addEventListener("ended", () => finish());
  video.addEventListener("error", () => finish());
  sources[sources.length - 1]?.addEventListener("error", () => finish());

  // Armed last, once every handler that can use them exists (handlers only read them when they fire).
  const startTimer = timers.setTimeout(() => { if (!started) finish(); }, openingIntroTiming.startMs);
  const capTimer = timers.setTimeout(() => finish(), openingIntroTiming.maxMs);
  // Autoplay refused (or play() unsupported): skip silently instead of leaving a frozen poster.
  try { void video.play?.()?.catch(() => finish()); } catch { finish(); }

  return () => finish(true);
}
