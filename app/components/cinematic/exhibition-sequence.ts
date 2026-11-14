export interface ExhibitionSequence {
  sequence: number[];
  cursor: number;
  previous: number | null;
}

/** One complete registry pass, shuffled without repetition at its boundary. */
export function createExhibitionBag(count: number, random: () => number, previous = -1): number[] {
  const bag = Array.from({ length: count }, (_, index) => index);
  for (let index = bag.length - 1; index > 0; index--) {
    const swap = Math.min(index, Math.floor(random() * (index + 1)));
    [bag[index], bag[swap]] = [bag[swap], bag[index]];
  }
  if (bag.length > 1 && bag[0] === previous) [bag[0], bag[1]] = [bag[1], bag[0]];
  return bag;
}

export function stepExhibition(state: ExhibitionSequence, direction: 1 | -1, count: number, random: () => number): ExhibitionSequence {
  if (direction === -1 && state.cursor === 0) return state;
  const previous = state.sequence[state.cursor];
  let sequence = state.sequence;
  let cursor = state.cursor + direction;
  // Keep the preview rail accurate across bag boundaries, not just the next frame.
  if (sequence.length - cursor <= 6) sequence = [...sequence, ...createExhibitionBag(count, random, sequence.at(-1))];
  if (sequence.length > count * 3) { sequence = sequence.slice(count); cursor -= count; }
  return { sequence, cursor, previous };
}

/** The projects queued after the featured one, in the order they will appear. */
export function upcomingExhibition(state: ExhibitionSequence, amount: number): number[] {
  if (state.sequence.length === 0) return [];
  return Array.from({ length: amount }, (_, offset) => state.sequence[(state.cursor + offset + 1) % state.sequence.length]);
}

/** The sequence plus a monotonic change counter that drives the stage composition. */
export interface ExhibitionShow {
  timeline: ExhibitionSequence;
  step: number;
}

export function advanceExhibition(show: ExhibitionShow, direction: 1 | -1, count: number, random: () => number): ExhibitionShow {
  const timeline = stepExhibition(show.timeline, direction, count, random);
  // A no-op (previous at the start of history) must not rearrange the stage.
  return timeline === show.timeline ? show : { timeline, step: show.step + 1 };
}

/** Feature a queued project directly; the outgoing image is the one actually on screen. */
export function jumpExhibition(show: ExhibitionShow, offset: number, count: number, random: () => number): ExhibitionShow {
  if (offset < 1) return show;
  let timeline = show.timeline;
  for (let index = 0; index < offset; index++) timeline = stepExhibition(timeline, 1, count, random);
  return { timeline: { ...timeline, previous: show.timeline.sequence[show.timeline.cursor] }, step: show.step + 1 };
}

export const exhibitionCompositions = ["a", "b", "c"] as const;
export type ExhibitionComposition = (typeof exhibitionCompositions)[number];

/** Fixed arrangements in a fixed order: consecutive steps always differ, nothing is random. */
export function exhibitionComposition(step: number): ExhibitionComposition {
  const total = exhibitionCompositions.length;
  return exhibitionCompositions[((Math.trunc(step) % total) + total) % total];
}

export interface ExhibitionInteraction {
  /** The pointer is somewhere within the exhibition (not, by itself, a reason to pause). */
  pointerInside: boolean;
  /** The pointer rests on a link, frame, ribbon or control. */
  pointerOverInteractive: boolean;
  focusInside: boolean;
  /** The focused element matches :focus-visible, i.e. focus arrived by keyboard. */
  focusVisible: boolean;
}

export function exhibitionInteractionPauses(state: ExhibitionInteraction): boolean {
  return state.pointerOverInteractive || (state.focusInside && state.focusVisible);
}

const swipeThreshold = 44;

/** 1 = next (swipe left), -1 = previous (swipe right), 0 = not a horizontal swipe. */
export function exhibitionSwipeDirection(deltaX: number, deltaY: number): 1 | -1 | 0 {
  if (Math.abs(deltaX) < swipeThreshold || Math.abs(deltaX) < Math.abs(deltaY) * 1.5) return 0;
  return deltaX < 0 ? 1 : -1;
}

export interface ExhibitionRunState extends ExhibitionInteraction {
  paused: boolean;
  visible: boolean;
  hidden: boolean;
  reduced: boolean;
  saveData: boolean;
}

export function exhibitionCanRun(state: ExhibitionRunState): boolean {
  return state.visible && !state.paused && !state.hidden && !state.reduced && !state.saveData && !exhibitionInteractionPauses(state);
}
