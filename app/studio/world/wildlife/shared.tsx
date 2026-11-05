"use client";

import { useEffect, useId, useRef, useState } from "react";
import * as THREE from "three";
import { useSceneClock } from "../SceneClock";
import { worldState } from "../worldState";
import { detailLevel } from "../sim/wildlife";
import { emitAnimalPicked } from "../wildlife-bus";
import type { AnimalId } from "../sim/wildlife";

type Vec = [number, number, number];

/** Reads the visitor's reduced-motion preference once and keeps it current. */
export function useReducedMotion() {
  const [reduced, setReduced] = useState(() => typeof matchMedia !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches);
  useEffect(() => {
    const query = matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(query.matches);
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);
  return reduced;
}

/**
 * Registers an animal's tick with the shared scheduler. Detail depends on distance to the visitor camera and
 * the quality tier: far animals freeze, mid-distance ones update at 5 Hz, near ones run in full. Everything
 * stops when the scene is hidden or resting because the scheduler itself stops.
 */
export function useAnimalTick(label: string, at: { x: number; y: number; z: number }, run: (dt: number, time: number, level: 1 | 2) => void) {
  const { scheduler, quality } = useSceneClock();
  const id = useId();
  const runRef = useRef(run);
  useEffect(() => { runRef.current = run; });
  useEffect(() => {
    let carry = 0;
    const visitor = worldState.visitor;
    const off = scheduler.add(`${label}-${id}`, (dt, time) => {
      const level = detailLevel(Math.hypot(visitor.x - at.x, visitor.y - at.y, visitor.z - at.z), quality.tier);
      if (level === 0) return;
      carry += dt;
      if (level === 1 && carry < 0.2) return;
      const step = carry; carry = 0;
      runRef.current(step, time, level);
    });
    return off;
  }, [scheduler, quality, id, label, at.x, at.y, at.z]);
}

/** Invisible, generously sized click target so the tiny animals are easy to tap. Buttons remain the primary way in. */
export function HitTarget({ animal, position, radius }: { animal: AnimalId; position: Vec; radius: number }) {
  useEffect(() => () => { document.body.style.cursor = ""; }, []);
  return <mesh position={position}
    onClick={(event) => { if (event.delta > 6) return; event.stopPropagation(); emitAnimalPicked(animal); }}
    onPointerOver={() => { document.body.style.cursor = "pointer"; }}
    onPointerOut={() => { document.body.style.cursor = ""; }}>
    <sphereGeometry args={[radius, 10, 8]} />
    <meshBasicMaterial visible={false} />
  </mesh>;
}

/** Small helpers shared by the procedural rigs: every blob reuses one unit-sphere geometry. */
export function makeBuilder() {
  const sphere = new THREE.SphereGeometry(1, 14, 10);
  const cylinder = new THREE.CylinderGeometry(1, 1, 1, 10);
  const group = (parent: THREE.Object3D, x = 0, y = 0, z = 0, order: THREE.EulerOrder = "XYZ") => {
    const g = new THREE.Group(); g.position.set(x, y, z); g.rotation.order = order; parent.add(g); return g;
  };
  const blob = (parent: THREE.Object3D, material: THREE.Material, s: Vec, p: Vec) => {
    const mesh = new THREE.Mesh(sphere, material); mesh.scale.set(...s); mesh.position.set(...p); parent.add(mesh); return mesh;
  };
  const tube = (parent: THREE.Object3D, material: THREE.Material, radius: number, length: number, p: Vec, rotation: Vec = [0, 0, 0]) => {
    const mesh = new THREE.Mesh(cylinder, material); mesh.scale.set(radius, length, radius); mesh.position.set(...p); mesh.rotation.set(...rotation); parent.add(mesh); return mesh;
  };
  const standard = (color: string, roughness = 0.9, metalness = 0) => new THREE.MeshStandardMaterial({ color, roughness, metalness });
  return { sphere, cylinder, group, blob, tube, standard };
}
