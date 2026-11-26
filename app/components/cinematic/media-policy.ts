export interface CinematicMediaPreferences {
  reducedMotion: boolean;
  saveData?: boolean;
  effectiveType?: string;
  lowBattery?: boolean;
  constrainedDevice?: boolean;
}

export function canAutoplayCinematicMedia(preferences: CinematicMediaPreferences): boolean {
  return (
    !preferences.reducedMotion &&
    !preferences.saveData &&
    !preferences.lowBattery &&
    !preferences.constrainedDevice &&
    !["slow-2g", "2g", "3g"].includes(preferences.effectiveType ?? "")
  );
}

export function cinematicMediaVariant(width: number): "mobile" | "desktop" {
  return width <= 720 ? "mobile" : "desktop";
}

export function cinematicMediaPoster(width: number, base = "/cinematic/sydney-ruby-v3"): string {
  return cinematicMediaVariant(width) === "mobile" ? `${base}-mobile-poster.webp` : `${base}-poster.webp`;
}

export function shouldDeferAmbientMedia(preferences: CinematicMediaPreferences): boolean {
  return !canAutoplayCinematicMedia(preferences);
}
