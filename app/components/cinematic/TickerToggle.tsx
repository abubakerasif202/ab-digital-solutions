"use client";

import { useState } from "react";
import { Pause, Play } from "lucide-react";

export function TickerToggle() {
  const [paused, setPaused] = useState(false);
  const Icon = paused ? Play : Pause;

  return (
    <button
      type="button"
      className="ruby-service-ticker-control"
      aria-label="Pause ticker"
      aria-controls="services-ticker-track"
      aria-pressed={paused}
      onClick={() => setPaused((current) => !current)}
    >
      <Icon size={17} aria-hidden="true" />
    </button>
  );
}
