// Tiny mutable bridge between ambient systems that must react to each other. Plain data, no React:
// systems read/write it from scheduler ticks so nothing re-renders.
export const worldState = {
  // The kangaroo claims a patch of footpath; pedestrians wait outside it while `active`.
  kangaroo: { active: false, x: 0, z: 11.5, r: 1.7, summon: false },
  // Written by the camera rig so characters can notice the visitor. Metres, world space.
  visitor: { x: 0, y: 1.7, z: 20, inReception: false },
  // Pedestrian signal: true while the walk light is on (traffic holds at the stop lines).
  walk: false,
};
export type WorldState = typeof worldState;
