"use client";

import { useEffect } from "react";
import { OPENING_INTRO_ATTRIBUTE } from "./opening-intro-config";

/**
 * Starts the opening intro only when the inline gate has enabled it. The controller (and its video logic) is
 * a separate chunk fetched on demand, so first-load JavaScript carries just this stub, and the overlay is built
 * outside React so it can never cause a hydration mismatch.
 */
export function OpeningIntro() {
  useEffect(() => {
    if (document.documentElement.getAttribute(OPENING_INTRO_ATTRIBUTE) !== "on") return;
    let cancelled = false;
    let stop: (() => void) | undefined;
    void import("./opening-intro").then((controller) => {
      if (!cancelled) stop = controller.startOpeningIntro();
    });
    return () => { cancelled = true; stop?.(); };
  }, []);
  return null;
}
