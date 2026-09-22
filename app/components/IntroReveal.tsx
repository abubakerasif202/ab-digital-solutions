"use client";

import { useEffect, useState, useSyncExternalStore } from "react";

const INTRO_SEEN_KEY = "ab-intro-seen";
const INTRO_DURATION_MS = 1650;

function subscribeNoop() {
  return () => {};
}

function shouldPlayIntro() {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return false;
  try {
    return window.sessionStorage.getItem(INTRO_SEEN_KEY) !== "1";
  } catch {
    // Storage unavailable (private mode etc.) — let the intro play anyway.
    return true;
  }
}

function serverSnapshot() {
  return false;
}

/**
 * Cinematic brand reveal shown once per session on the homepage. The whole
 * sequence is CSS-driven (~1.4s); this component only decides whether to
 * mount it and removes it afterwards. Skipped entirely for reduced motion.
 */
export function IntroReveal() {
  const [dismissed, setDismissed] = useState(false);
  const shouldPlay = useSyncExternalStore(subscribeNoop, shouldPlayIntro, serverSnapshot);

  useEffect(() => {
    if (!shouldPlay) return;
    try {
      window.sessionStorage.setItem(INTRO_SEEN_KEY, "1");
    } catch {
      // Storage unavailable — the intro simply plays again next load.
    }
    const timer = window.setTimeout(() => setDismissed(true), INTRO_DURATION_MS);
    return () => window.clearTimeout(timer);
  }, [shouldPlay]);

  if (!shouldPlay || dismissed) return null;

  return (
    <div className="intro-reveal" aria-hidden="true">
      <div className="intro-reveal-inner">
        <span className="intro-monogram">AB</span>
        <span className="intro-line" />
        <p className="intro-word">AB Web Studio</p>
      </div>
    </div>
  );
}
