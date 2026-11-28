const FRAMES = 3;

/** Keep the selected project centre stage, including at the ends of the catalogue. */
export function galleryDisplaySlots(selected: number, total: number): readonly [number | null, number | null, number | null] {
  if (total === 0) return [null, null, null];
  const first = Math.min(Math.max(selected - 1, 0), Math.max(total - FRAMES, 0));
  const neighbours: number[] = [];
  for (let index = first; index < Math.min(first + FRAMES, total); index++) {
    if (index !== selected) neighbours.push(index);
  }
  return [neighbours[0] ?? null, selected, neighbours[1] ?? null];
}
