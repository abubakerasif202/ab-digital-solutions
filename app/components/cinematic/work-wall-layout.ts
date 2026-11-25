export const WALL_COLUMN_COUNT = 3;

/** Deals items into columns round-robin, so each column mixes industries. */
export function wallColumns<T>(source: readonly T[], count: number = WALL_COLUMN_COUNT): T[][] {
  const safeCount = Math.max(1, Math.floor(count));
  return Array.from({ length: safeCount }, (_, column) => source.filter((_, index) => index % safeCount === column));
}

/** Adaptive column density for narrow mobile viewports vs tablet/desktop. */
export function wallColumnCountForWidth(width: number): number {
  if (width <= 520) return 2;
  return WALL_COLUMN_COUNT;
}

/** Continuous wall drift yields to reduced-motion, Save-Data, and low-battery preferences. */
export function canAnimateWorkWall(preferences: {
  reducedMotion: boolean;
  saveData?: boolean;
  lowBattery?: boolean;
}): boolean {
  return !preferences.reducedMotion && !preferences.saveData && !preferences.lowBattery;
}
