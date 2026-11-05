"use client";

import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { animalRequests } from "../wildlife-bus";
import { cockatooPose, wildlifePlacement, type CockatooPose } from "../sim/wildlife";
import { HitTarget, makeBuilder, useAnimalTick, useReducedMotion } from "./shared";

const { x: CX, z: CZ, perchY: CY } = wildlifePlacement.cockatoo;
const FOOTPATH_Y = 0.12;
const REST_HEADING = -0.45; // turned toward the entrance door
const SCALE = 1.3;
const AT = { x: CX, y: CY + 0.2, z: CZ };
const FEATHERS = 5;

/** White sulphur-crested cockatoo: yellow crest, dark hooked bill, yellow under-wings, grey feet. */
function createCockatooRig() {
  const b = makeBuilder();
  const white = b.standard("#f6f4ee", 0.85), yellow = b.standard("#f1cf2e", 0.8), cheek = b.standard("#f1e3a0", 0.85);
  const bill = b.standard("#34353a", 0.4), eye = b.standard("#0d0b0b", 0.2), ring = b.standard("#e6e1d4", 0.8), foot = b.standard("#5d5d62", 0.7);
  const root = new THREE.Group();
  root.scale.setScalar(SCALE);
  const body = b.group(root, 0, 0.12, 0, "XYZ");
  b.blob(body, white, [0.078, 0.115, 0.074], [0, 0.02, 0]);
  b.blob(body, white, [0.062, 0.07, 0.05], [0, 0.0, 0.035]);
  const tail = b.group(body, 0, -0.05, -0.05);
  tail.rotation.x = 0.55;
  b.blob(tail, white, [0.034, 0.012, 0.12], [0, 0, -0.1]);
  b.blob(tail, yellow, [0.028, 0.008, 0.1], [0, -0.012, -0.1]);
  const head = b.group(body, 0, 0.145, 0.025, "YXZ");
  b.blob(head, white, [0.056, 0.056, 0.056], [0, 0.03, 0]);
  b.blob(head, cheek, [0.026, 0.02, 0.02], [0.044, 0.02, 0.025]);
  b.blob(head, cheek, [0.026, 0.02, 0.02], [-0.044, 0.02, 0.025]);
  b.blob(head, bill, [0.024, 0.032, 0.03], [0, 0.0, 0.058]); // upper bill
  b.blob(head, bill, [0.012, 0.026, 0.018], [0, -0.03, 0.074]); // hooked tip
  b.blob(head, bill, [0.019, 0.016, 0.022], [0, -0.018, 0.052]);
  ([-1, 1] as const).forEach((m) => {
    b.blob(head, ring, [0.017, 0.017, 0.012], [m * 0.045, 0.04, 0.028]);
    b.blob(head, eye, [0.011, 0.012, 0.01], [m * 0.047, 0.04, 0.034]);
  });
  // Crest: a fan of curved yellow feathers that lie back and lift when the bird is excited.
  const crest = b.group(head, 0, 0.074, -0.012, "XYZ");
  const feathers = Array.from({ length: FEATHERS }, (_, i) => {
    const spread = (i - (FEATHERS - 1) / 2) * 0.28;
    const pivot = b.group(crest, spread * 0.03, 0, -i * 0.002, "XYZ");
    pivot.rotation.z = spread;
    const length = 0.05 + (i === 2 ? 0.02 : i % 2 ? 0.0 : 0.008);
    b.blob(pivot, yellow, [0.0085, length, 0.013], [0, length, 0]);
    return pivot;
  });
  const wings = ([-1, 1] as const).map((m) => {
    const wing = b.group(body, m * 0.07, 0.07, -0.01, "XYZ");
    b.blob(wing, white, [0.016, 0.09, 0.05], [m * 0.01, -0.07, -0.02]);
    b.blob(wing, yellow, [0.011, 0.07, 0.036], [m * 0.002, -0.07, -0.016]);
    return { wing, side: m };
  });
  ([-1, 1] as const).forEach((m) => {
    const leg = b.group(root, m * 0.028, 0.02, 0.005);
    b.blob(leg, foot, [0.01, 0.025, 0.01], [0, 0.0, 0]);
    b.blob(leg, foot, [0.014, 0.008, 0.03], [0, -0.012, 0.02]);
  });
  const update = (pose: CockatooPose) => {
    root.position.set(CX + pose.dx, CY + pose.dy, CZ + pose.dz);
    root.rotation.y = pose.flying ? pose.heading : REST_HEADING;
    body.rotation.x = pose.bodyPitch;
    body.position.y = 0.12 + pose.bob;
    head.rotation.set(pose.headPitch, pose.headYaw, pose.headRoll);
    const lift = THREE.MathUtils.lerp(-1.3, -0.12, pose.crest);
    feathers.forEach((feather, i) => { feather.rotation.x = lift + (i % 2 ? 0.05 : -0.03); });
    wings.forEach(({ wing, side }) => {
      wing.rotation.z = side * (0.06 + pose.wingSpread * (1.15 + pose.wingFlap * 0.35));
      wing.rotation.x = pose.wingSpread * 0.15;
    });
  };
  const dispose = () => { b.sphere.dispose(); b.cylinder.dispose(); [white, yellow, cheek, bill, eye, ring, foot].forEach((mat) => mat.dispose()); };
  return { root, update, dispose };
}

/** Brass shopfront railing the cockatoo perches on: clear of the door, the glazing and the pedestrian lane. */
function createRailingRig() {
  const b = makeBuilder();
  const brass = b.standard("#c9ac73", 0.35, 0.85), dark = b.standard("#1b1d1f", 0.5, 0.3);
  const root = new THREE.Group();
  root.position.set(CX, FOOTPATH_Y, CZ);
  const top = CY - FOOTPATH_Y - 0.03;
  const half = 1.2;
  ([-half, half] as const).forEach((x) => {
    b.tube(root, brass, 0.032, top, [x, top / 2, 0]);
    b.blob(root, dark, [0.09, 0.02, 0.09], [x, 0.02, 0]);
    b.blob(root, brass, [0.045, 0.045, 0.045], [x, top + 0.01, 0]);
  });
  b.tube(root, brass, 0.03, half * 2, [0, top, 0], [0, 0, Math.PI / 2]);
  b.tube(root, brass, 0.02, half * 2, [0, top * 0.5, 0], [0, 0, Math.PI / 2]);
  const dispose = () => { b.sphere.dispose(); b.cylinder.dispose(); brass.dispose(); dark.dispose(); };
  return { root, dispose };
}

export function CockatooFeature() {
  const bird = useMemo(() => createCockatooRig(), []);
  const rail = useMemo(() => createRailingRig(), []);
  const reduced = useReducedMotion();
  const reducedRef = useRef(reduced);
  const reactAt = useRef(-1);
  const seen = useRef(0);
  useEffect(() => { reducedRef.current = reduced; });

  useEffect(() => {
    seen.current = animalRequests.cockatoo.n;
    bird.update(cockatooPose(0, -1, false));
    return () => { bird.dispose(); rail.dispose(); };
  }, [bird, rail]);

  useAnimalTick("cockatoo", AT, (_dt, time) => {
    const request = animalRequests.cockatoo;
    if (request.n !== seen.current) { seen.current = request.n; reactAt.current = time; }
    let reactFor = reactAt.current >= 0 ? time - reactAt.current : -1;
    if (reactFor > 3.4) { reactAt.current = -1; reactFor = -1; }
    bird.update(cockatooPose(time, reactFor, reducedRef.current));
  });

  return <>
    <primitive object={rail.root} />
    <primitive object={bird.root} />
    <HitTarget animal="cockatoo" position={[AT.x, AT.y, AT.z]} radius={0.5} />
  </>;
}
