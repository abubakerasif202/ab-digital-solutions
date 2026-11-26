"use client";

import { useState, useSyncExternalStore } from "react";
import { Pause, Play } from "lucide-react";

const noSubscription = () => () => {};
const hydrated = () => true;
const serverRendered = () => false;

type DataSavingConnection = EventTarget & { saveData?: boolean };
const connection = () => (navigator as Navigator & { connection?: DataSavingConnection }).connection;
const hasSaveData = () => Boolean(connection()?.saveData);
function subscribeToSaveData(notify: () => void) {
  const network = connection();
  network?.addEventListener?.("change", notify);
  return () => network?.removeEventListener?.("change", notify);
}

/**
 * The ticker only animates once this control is interactive (`data-ready`), so
 * moving content is never shown without a working pause (WCAG 2.2.2).
 */
interface TickerToggleProps {
  className?: string;
  label?: string;
  controls?: string;
}

export function TickerToggle({
  className = "ruby-service-ticker-control",
  label = "Pause ticker",
  controls = "services-ticker-track",
}: TickerToggleProps = {}) {
  // False in the server HTML and during hydration; true once React handles events.
  const ready = useSyncExternalStore(noSubscription, hydrated, serverRendered);
  const saveData = useSyncExternalStore(subscribeToSaveData, hasSaveData, serverRendered);
  const [paused, setPaused] = useState(false);
  const Icon = paused ? Play : Pause;

  return (
    <button
      type="button"
      className={className}
      aria-label={label}
      aria-controls={controls}
      aria-pressed={paused}
      disabled={!ready}
      data-ready={ready || undefined}
      data-save-data={saveData || undefined}
      onClick={() => setPaused((current) => !current)}
    >
      <Icon size={17} aria-hidden="true" />
    </button>
  );
}
