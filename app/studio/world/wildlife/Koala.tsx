"use client";

import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { animalRequests } from "../wildlife-bus";
import { worldState } from "../worldState";
import { koalaPose, wildlifePlacement, type KoalaPose } from "../sim/wildlife";
import { HitTarget, makeBuilder, useAnimalTick, useReducedMotion } from "./shared";

const { x: KX, z: KZ, perchY: KY } = wildlifePlacement.koala;
const FACING = 0.2; // turned slightly toward the studio entrance
const AT = { x: KX, y: KY, z: KZ + 0.3 };
const FOOTPATH_Y = 0.12;

/** A koala sitting in the fork of the eucalyptus: rounded fluffy ears, broad nose, believable proportions. */
function createKoalaRig() {
  const b = makeBuilder();
  const fur = b.standard("#8a8b90", 0.97), light = b.standard("#d3d0c8", 1), cream = b.standard("#e6e0d2", 1);
  const dark = b.standard("#232224", 0.55), eye = b.standard("#0e0c0d", 0.2);
  const root = new THREE.Group();
  root.position.set(KX, KY, KZ + 0.3);
  root.rotation.y = FACING;
  const body = b.group(root, 0, 0.26, 0, "YXZ");
  b.blob(body, fur, [0.17, 0.215, 0.15], [0, 0, 0]);
  b.blob(body, cream, [0.115, 0.15, 0.085], [0, -0.015, 0.105]);
  // Haunches rest on the branch; short hind feet tuck in front of them.
  ([-1, 1] as const).forEach((m) => {
    b.blob(body, fur, [0.095, 0.085, 0.125], [m * 0.115, -0.2, 0.06]);
    b.blob(body, dark, [0.04, 0.03, 0.055], [m * 0.14, -0.27, 0.19]);
  });
  const head = b.group(body, 0, 0.2, 0.03, "YXZ");
  b.blob(head, fur, [0.15, 0.13, 0.135], [0, 0.1, 0.03]);
  b.blob(head, light, [0.085, 0.07, 0.06], [0, 0.04, 0.14]); // pale muzzle
  b.blob(head, dark, [0.052, 0.075, 0.045], [0, 0.085, 0.185]); // broad, leathery nose
  b.blob(head, light, [0.1, 0.045, 0.03], [0, -0.005, 0.12]);
  const lids = ([-1, 1] as const).map((m) => {
    b.blob(head, eye, [0.017, 0.017, 0.012], [m * 0.068, 0.125, 0.15]);
    return b.blob(head, fur, [0.026, 0.026, 0.014], [m * 0.068, 0.125, 0.158]);
  });
  // Large round ears with fluffy pale linings and rim tufts.
  const ears = ([-1, 1] as const).map((m) => {
    const ear = b.group(head, m * 0.125, 0.205, 0.0, "XYZ");
    b.blob(ear, fur, [0.105, 0.105, 0.045], [0, 0, 0]);
    b.blob(ear, light, [0.08, 0.08, 0.04], [0, -0.005, 0.03]);
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      b.blob(ear, cream, [0.03, 0.03, 0.02], [Math.cos(a) * 0.095, Math.sin(a) * 0.095, 0.012]);
    }
    return ear;
  });
  const arms = ([-1, 1] as const).map((m) => {
    const shoulder = b.group(body, m * 0.165, 0.1, 0.05);
    b.blob(shoulder, fur, [0.05, 0.11, 0.05], [0, -0.08, 0.01]);
    const elbow = b.group(shoulder, 0, -0.17, 0);
    b.blob(elbow, fur, [0.042, 0.09, 0.042], [0, -0.07, 0.01]);
    b.blob(elbow, dark, [0.04, 0.034, 0.045], [0, -0.16, 0.02]);
    return { shoulder, elbow };
  });
  const update = (pose: KoalaPose, time: number) => {
    body.scale.set(1 + pose.breath * 0.012, 1 + pose.breath * 0.028, 1 + pose.breath * 0.02);
    body.rotation.x = -pose.bodyLean;
    head.rotation.set(pose.headPitch, pose.headYaw, pose.headRoll);
    lids.forEach((lid) => { lid.scale.y = 0.026 * (1 - pose.eyeOpen) + 0.0008; lid.visible = pose.eyeOpen < 0.97; });
    ears.forEach((ear, i) => { ear.rotation.z = (i === 0 ? 1 : -1) * pose.earTwitch * 0.25; });
    // Resting arms fold over the belly; the right arm lifts and waves when the koala is awake.
    arms.forEach((arm, i) => {
      const waving = i === 1 ? pose.armWave : 0;
      arm.shoulder.rotation.x = -(0.5 + waving * 1.9);
      arm.elbow.rotation.x = -(1.15 - waving * 0.55 + waving * Math.sin(time * 11) * 0.35);
      arm.shoulder.rotation.z = (i === 0 ? -1 : 1) * (0.05 + waving * 0.25);
    });
  };
  const dispose = () => { b.sphere.dispose(); b.cylinder.dispose(); [fur, light, cream, dark, eye].forEach((m) => m.dispose()); };
  return { root, update, dispose };
}

/** Eucalyptus: pale smooth trunk with a fork, drooping grey-green foliage, in a brass-edged planter. */
function createTreeRig() {
  const b = makeBuilder();
  const bark = b.standard("#d8d1bf", 0.88), bark2 = b.standard("#b9ae96", 0.92), stone = b.standard("#2e302f", 0.7), brass = b.standard("#c9ac73", 0.35, 0.85), soil = b.standard("#3a2d23", 1);
  const leaf = new THREE.MeshStandardMaterial({ color: "#ffffff", roughness: 0.85, side: THREE.DoubleSide });
  const root = new THREE.Group();
  root.position.set(KX, FOOTPATH_Y, KZ);
  // Planter: low stone bed, brass coping, soil top.
  const bed = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.26, 1.2), stone); bed.position.set(0, 0.13, 0); root.add(bed);
  const coping = new THREE.Mesh(new THREE.BoxGeometry(1.68, 0.035, 1.28), brass); coping.position.set(0, 0.275, 0); root.add(coping);
  const dirt = new THREE.Mesh(new THREE.BoxGeometry(1.46, 0.02, 1.06), soil); dirt.position.set(0, 0.292, 0); root.add(dirt);
  // Trunk in two slightly bent segments, then the fork the koala sits in.
  b.tube(root, bark, 0.17, 2.3, [0, 1.45, 0], [0, 0, -0.04]);
  b.tube(root, bark, 0.12, 2.2, [-0.07, 3.55, 0], [0, 0, 0.1]);
  b.tube(root, bark2, 0.075, 1.8, [0.45, 3.7, 0.05], [0, 0, -0.52]);
  b.tube(root, bark, 0.075, 0.5, [0, KY - FOOTPATH_Y - 0.1, 0.17], [Math.PI / 2 - 0.1, 0, 0]); // the branch the koala sits on
  // Foliage: instanced drooping leaf clusters in varied grey-greens (one draw call).
  const count = 40;
  const leaves = new THREE.InstancedMesh(b.sphere, leaf, count);
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), p = new THREE.Vector3(), s = new THREE.Vector3(), c = new THREE.Color();
  const palette = ["#6f8d79", "#5d7b68", "#7e9988", "#4f6d5b", "#8aa392"];
  for (let i = 0; i < count; i++) {
    const t = i / count, angle = i * 2.399963;
    const radius = 0.45 + (i % 5) * 0.27, height = 3.15 + ((i * 7) % 9) * 0.22;
    p.set(Math.cos(angle) * radius + 0.1, height, Math.sin(angle) * radius * 0.75);
    e.set(0.5 * Math.sin(i * 2.1), angle, 0.55 * Math.cos(i * 1.7)); q.setFromEuler(e);
    s.set(0.42 + (i % 3) * 0.09, 0.06, 0.16 + (i % 4) * 0.03);
    m.compose(p, q, s); leaves.setMatrixAt(i, m);
    leaves.setColorAt(i, c.set(palette[(i + Math.floor(t * 3)) % palette.length]));
  }
  leaves.instanceMatrix.needsUpdate = true;
  if (leaves.instanceColor) leaves.instanceColor.needsUpdate = true;
  root.add(leaves);
  const dispose = () => { b.sphere.dispose(); b.cylinder.dispose(); bed.geometry.dispose(); coping.geometry.dispose(); dirt.geometry.dispose(); leaves.dispose(); [bark, bark2, stone, brass, soil, leaf].forEach((mat) => mat.dispose()); };
  return { root, dispose };
}

export function KoalaFeature() {
  const koala = useMemo(() => createKoalaRig(), []);
  const tree = useMemo(() => createTreeRig(), []);
  const reduced = useReducedMotion();
  const reducedRef = useRef(reduced);
  const awake = useRef(-1);
  const seen = useRef(0);
  useEffect(() => { reducedRef.current = reduced; });

  useEffect(() => {
    seen.current = animalRequests.koala.n;
    koala.update(koalaPose(0.5, -1, 0, false), 0.5);
    return () => { koala.dispose(); tree.dispose(); };
  }, [koala, tree]);

  useAnimalTick("koala", AT, (dt, time) => {
    const request = animalRequests.koala;
    if (request.n !== seen.current) { seen.current = request.n; awake.current = 0; }
    if (awake.current >= 0) { awake.current += dt; if (awake.current >= 5.4) awake.current = -1; }
    const visitor = worldState.visitor;
    const toVisitor = Math.atan2(visitor.x - KX, visitor.z - (KZ + 0.3)) - FACING;
    koala.update(koalaPose(time, awake.current, Math.atan2(Math.sin(toVisitor), Math.cos(toVisitor)), reducedRef.current), time);
  });

  return <>
    <primitive object={tree.root} />
    <primitive object={koala.root} />
    <HitTarget animal="koala" position={[AT.x, AT.y + 0.2, AT.z]} radius={0.6} />
  </>;
}
