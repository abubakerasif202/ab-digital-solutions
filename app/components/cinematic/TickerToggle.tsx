"use client";

import { useState, useSyncExternalStore } from "react";
import { Pause, Play } from "lucide-react";

const noSubscription = () => () => {};
const hydrated = () => true;
const serverRendered = () => false;

/**
 * The ticker only animates once this control is interactive (`data-ready`), so
 * moving content is never shown without a working pause (WCAG 2.2.2).
 */
export function TickerToggle() {
  // False in the server HTML and during hydration; true once React handles events.
  const ready = useSyncExternalStore(noSubscription, hydrated, serverRendered);
  const [paused, setPaused] = useState(false);
  const Icon = paused ? Play : Pause;

  return (
    <button
      type="button"
      className="ruby-service-ticker-control"
      aria-label="Pause ticker"
      aria-controls="services-ticker-track"
      aria-pressed={paused}
      disabled={!ready}
      data-ready={ready || undefined}
      onClick={() => setPaused((current) => !current)}
    >
      <Icon size={17} aria-hidden="true" />
    </button>
  );
}
