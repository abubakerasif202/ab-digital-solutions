/** Shared timing and asset constants for the opening brand film. */
export const INTRO_SEEN_KEY = "ab-brand-intro-seen";
export const INTRO_VIDEO_SRC = "/video/ab-web-studio-intro.mp4";
export const INTRO_POSTER_SRC = "/video/ab-web-studio-intro-poster.webp";

export const introTiming = {
  /** Video time (s) at which the homepage starts to surface. The source clip
   *  turns bright at ~7.5s, so the exit begins on the completed dark logo. */
  exitAt: 7.2,
  /** Overlay cross-fade length; the overlay leaves the DOM right after. */
  exitMs: 760,
  /** Hero + navbar entrances finish inside this window, then the html flag is cleared. */
  settleMs: 2200,
  /** No `playing` event by now: show the poster instead of waiting on the network. */
  startTimeoutMs: 4500,
  /** Hold on the poster when the video cannot play. */
  posterHoldMs: 1100,
  /** Absolute upper bound for the whole intro. */
  maxMs: 12000,
  /** Gate watchdog: if React never claims the overlay, release the page. */
  watchdogMs: 6000,
} as const;
