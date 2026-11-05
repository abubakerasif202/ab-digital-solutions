"use client";

import { useEffect } from "react";
import { animalOrder, animals, BUBBLE_MS, type AnimalId } from "./world/sim/wildlife";
import type { SoundState } from "./audio/studio-audio";
import styles from "./studio.module.css";

export type Caption = { id: AnimalId; text: string; key: number };

function soundNote(sound: SoundState) {
  if (sound.status === "unsupported") return "Audio isn’t available in this browser.";
  if (!sound.enabled) return "Sound is off.";
  // Only claim audio once the browser has actually allowed it.
  return sound.status === "ready" ? "Sound is playing." : "Sound is on. Your browser is waiting for a click or key press to start it.";
}

/** Always-visible sound switch and volume. Everything in the studio works with sound off. */
export function SoundControls({ sound, onToggle, onVolume }: { sound: SoundState; onToggle: () => void; onVolume: (volume: number) => void }) {
  return <div className={styles.sound} role="group" aria-label="Sound">
    <button type="button" aria-pressed={sound.enabled} onClick={onToggle} disabled={sound.status === "unsupported"} className={styles.soundToggle}>
      <span aria-hidden="true" className={styles.soundDot} data-live={sound.enabled && sound.status === "ready"} />
      Sound {sound.enabled ? "on" : "off"}
    </button>
    <label className={styles.volume}>
      <span>Volume</span>
      <input type="range" min={0} max={1} step={0.05} value={sound.volume} disabled={!sound.enabled || sound.status === "unsupported"} aria-valuetext={`${Math.round(sound.volume * 100)} percent`} onChange={(event) => onVolume(Number(event.currentTarget.value))} />
    </label>
    <span className={styles.soundNote} role="status">{soundNote(sound)}</span>
  </div>;
}

/** "Meet the locals": choose an animal, see its name and personality, and greet it. Works without 3D. */
export function LocalsPanel({ open, selected, caption, bubbles, active, onPick, onInteract, onBubbles }: {
  open: boolean; selected: AnimalId; caption: Caption | null; bubbles: boolean; active: boolean;
  onPick: (id: AnimalId) => void; onInteract: (id: AnimalId) => void; onBubbles: (on: boolean) => void;
}) {
  const info = animals[selected];
  return <div id="studio-locals" className={styles.locals} role="group" aria-label="Meet the locals" hidden={!open}>
    <div className={styles.localsChoices} role="group" aria-label="Choose an animal">
      {animalOrder.map((id) => <button key={id} type="button" aria-pressed={selected === id} onClick={() => onPick(id)}>{animals[id].name}</button>)}
    </div>
    <div className={styles.localsCard}>
      <h3>{info.name}</h3>
      <p>{info.personality}</p>
      <div className={styles.localsActions}>
        <button type="button" className={styles.primary} onClick={() => onInteract(selected)}>{info.action}</button>
        <label className={styles.check}><input type="checkbox" checked={bubbles} onChange={(event) => onBubbles(event.currentTarget.checked)} /> Speech bubbles</label>
      </div>
      <p className={styles.localsCaption} role={bubbles && active ? undefined : "status"}>
        {caption && caption.id === selected ? <><strong>{animals[caption.id].name}:</strong> “{caption.text}”</> : <span className={styles.muted}>{active ? "Tap the animal in the studio, or use the button." : "Use the button to say hello."}</span>}
      </p>
    </div>
  </div>;
}

/** A small, dismissible speech bubble over the 3D view. It sits bottom-left, clear of the controls and the room panel. */
export function LocalBubble({ caption, onDismiss }: { caption: Caption | null; onDismiss: () => void }) {
  useEffect(() => {
    if (!caption) return;
    const timer = setTimeout(onDismiss, BUBBLE_MS);
    return () => clearTimeout(timer);
  }, [caption, onDismiss]);
  if (!caption) return null;
  return <div className={styles.bubble} role="status" key={caption.key}>
    <p><strong>{animals[caption.id].name}</strong> “{caption.text}”</p>
    <button type="button" onClick={onDismiss} aria-label="Dismiss speech bubble">×</button>
  </div>;
}
