// Tiny pub/sub between the 3D scene and the page: a click on an animal in 3D reaches the same handler
// as its keyboard-accessible button, so sound, captions and reactions have a single code path.
import type { AnimalId } from "./sim/wildlife";

type Listener = (id: AnimalId) => void;
const listeners = new Set<Listener>();
export function onAnimalPicked(listener: Listener) { listeners.add(listener); return () => { listeners.delete(listener); }; }
export function emitAnimalPicked(id: AnimalId) { for (const listener of listeners) listener(id); }

/** The page asks an animal to react by bumping its counter; the scene reads it from its scheduler tick. */
export type AnimalRequest = { n: number; kind?: string };
export const animalRequests: Record<AnimalId, AnimalRequest> = { kangaroo: { n: 0 }, koala: { n: 0 }, cockatoo: { n: 0 } };
export function requestReaction(id: AnimalId, kind?: string) { const r = animalRequests[id]; r.n += 1; r.kind = kind; }
