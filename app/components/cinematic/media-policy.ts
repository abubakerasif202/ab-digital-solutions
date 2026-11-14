export interface CinematicMediaPreferences {
  reducedMotion: boolean;
  saveData?: boolean;
  effectiveType?: string;
}

export function canAutoplayCinematicMedia(preferences: CinematicMediaPreferences): boolean {
  return !preferences.reducedMotion && !preferences.saveData &&
    !["slow-2g", "2g", "3g"].includes(preferences.effectiveType ?? "");
}

export function cinematicMediaVariant(width: number): "mobile" | "desktop" {
  return width <= 720 ? "mobile" : "desktop";
}
