/** Shared constants for the once-per-session opening intro (homepage only). */
export const OPENING_INTRO_SEEN_KEY = "ab-opening-intro-seen";

/** Attribute on <html>: "on" shows the shade and locks scroll, "leaving" fades it out. Absent means no intro. */
export const OPENING_INTRO_ATTRIBUTE = "data-opening-intro";
/** Set once the controller has taken over, so the gate's watchdog stands down. */
export const OPENING_INTRO_LIVE_ATTRIBUTE = "data-opening-intro-live";

export const openingIntroTiming = {
  /** Skip silently if the video has not started playing this long after the controller begins. */
  startMs: 800,
  /** Never keep the visitor behind the intro longer than this. The film itself runs 4.75 s. */
  maxMs: 6000,
  /** Opacity-only fade of the overlay. Must match --opening-intro-fade in opening-intro.css. */
  fadeMs: 500,
  /** Playback that stalls (waiting for data) this long ends the intro. */
  stallMs: 1500,
  /**
   * The gate gives up if the controller has not taken over by now (slow hydration, script failure), so a slow
   * phone never sits on the black shade for long. Keep it above the controller's own start-up on typical devices.
   */
  watchdogMs: 2500,
} as const;

export const openingIntroAssets = {
  poster: "/intro/ab-intro-poster.webp",
  mobile: { webm: "/intro/ab-intro-mobile.webm", mp4: "/intro/ab-intro-mobile.mp4" },
  desktop: { webm: "/intro/ab-intro-1280.webm", mp4: "/intro/ab-intro-1280.mp4" },
  /** Phones and small tablets get the tighter 640 px crop. */
  mobileQuery: "(max-width: 767px)",
} as const;
