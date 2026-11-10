"use client";

import { useEffect, useMemo, useRef } from "react";
import { createKangarooRig } from "../Kangaroo";
import { createResidentKangaroo, ROO_REACTIONS, type RooReaction } from "../sim/resident-kangaroo";
import { wildlifePlacement } from "../sim/wildlife";
import { animalRequests } from "../wildlife-bus";
import { worldState } from "../worldState";
import { HitTarget, useAnimalTick, useReducedMotion } from "./shared";

export const KANGAROO_SCALE = 1.18;
const AT = { x: wildlifePlacement.kangaroo.x, y: 1, z: wildlifePlacement.kangaroo.z };

/** The studio's resident greeter: ear twitches, glances, short safe hops, and friendly reactions on request. */
export function ResidentKangaroo() {
  const sim = useMemo(() => createResidentKangaroo(), []);
  const rig = useMemo(() => createKangarooRig(), []);
  const reduced = useReducedMotion();
  const seen = useRef(0);
  const reducedRef = useRef(reduced);
  useEffect(() => { reducedRef.current = reduced; });

  useEffect(() => {
    rig.root.scale.setScalar(KANGAROO_SCALE);
    rig.apply(sim.step(1 / 60, { visitor: worldState.visitor, reduced: reducedRef.current }), true);
    seen.current = animalRequests.kangaroo.n;
    return () => rig.dispose();
  }, [rig, sim]);

  useAnimalTick("resident-kangaroo", AT, (dt) => {
    const request = animalRequests.kangaroo;
    if (request.n !== seen.current) { seen.current = request.n; sim.react(ROO_REACTIONS.find((kind): kind is RooReaction => kind === request.kind)); }
    // The arrival film calls for the kangaroo as the camera reaches the street: greet with a hop and a wave.
    if (worldState.kangaroo.summon) { worldState.kangaroo.summon = false; sim.greet(); }
    rig.apply(sim.step(dt, { visitor: worldState.visitor, reduced: reducedRef.current }), true);
  });

  return <>
    <primitive object={rig.root} />
    <primitive object={rig.shadow} />
    <HitTarget animal="kangaroo" position={[AT.x, 0.12 + 0.95, AT.z]} radius={0.95} />
  </>;
}
