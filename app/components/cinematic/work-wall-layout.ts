export const WALL_COLUMN_COUNT = 3;

/** Deals items into columns round-robin, so each column mixes industries. */
export function wallColumns<T>(source: readonly T[], count: number = WALL_COLUMN_COUNT): T[][] {
  return Array.from({ length: count }, (_, column) => source.filter((_, index) => index % count === column));
}
