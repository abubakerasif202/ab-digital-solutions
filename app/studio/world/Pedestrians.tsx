"use client";

import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { useSceneClock } from "./SceneClock";
import { worldState } from "./worldState";
import { createPedestrians, groundHeight } from "./sim/pedestrians";
import { createShadowGeometry, createShadowMaterial } from "./contact-shadow";

const SEED = 20260;
const HIP = 0.9;
const SHOULDER = 1.47;
const THIGH = 0.42; // hip to knee, and knee to ankle
const ARM = 0.6;
const HAIR = ["#1b1514", "#2a1a17", "#3b2a20", "#5a3b26", "#77593a", "#8c8a86", "#c9a66b", "#150f0e"] as const;
const SHOES = ["#14181a", "#2a2320", "#e5dcc8", "#4a3a2c"] as const;

/** Capsule hanging from its joint: the pivot is the top of the upper cap. */
function limb(radius: number, length: number) {
  const geometry = new THREE.CapsuleGeometry(radius, length - radius * 2, 4, 8);
  geometry.translate(0, -length / 2, 0);
  return geometry;
}

/**
 * Pedestrians as instanced body parts: head, hair, torso, arms, hands, two-segment legs, shoes and a
 * contact shadow. The simulation and every matrix update run inside one scheduler tick; React never
 * re-renders. Figures face local +x.
 */
export function Pedestrians() {
  const { scheduler, quality } = useSceneClock();
  const invalidate = useThree((state) => state.invalidate);
  const camera = useThree((state) => state.camera);
  const refresh = useRef<(() => void) | null>(null);
  useFrame(() => refresh.current?.());
  const holder = useRef<THREE.Group>(null);

  useEffect(() => {
    const parent = holder.current;
    if (!parent || quality.pedestrians <= 0) return;
    const sim = createPedestrians({ seed: SEED, count: quality.pedestrians });
    const n = sim.people.length;
    const torso = new THREE.CylinderGeometry(0.17, 0.15, 0.62, 12);
    torso.scale(0.75, 1, 1.45);
    torso.translate(0, 1.19, 0);
    const head = new THREE.SphereGeometry(0.11, 14, 10);
    head.translate(0.01, 1.64, 0);
    // Scalp cap tilted back so the face stays clear; +x is the direction of travel.
    const hair = new THREE.SphereGeometry(0.118, 14, 8, 0, Math.PI * 2, 0, 1.5);
    hair.rotateZ(0.6);
    hair.translate(0.004, 1.645, 0);
    const hand = new THREE.SphereGeometry(0.046, 8, 6);
    hand.scale(0.8, 1.15, 0.7);
    hand.translate(0, -ARM - 0.01, 0);
    const shoe = new THREE.SphereGeometry(1, 10, 6);
    shoe.scale(0.125, 0.05, 0.058);
    shoe.translate(0.045, -THIGH - 0.005, 0);
    const material = new THREE.MeshStandardMaterial({ roughness: 0.85, metalness: 0 });
    const shadowMaterial = createShadowMaterial();
    const make = (geometry: THREE.BufferGeometry, count: number, surface: THREE.Material = material) => {
      const mesh = new THREE.InstancedMesh(geometry, surface, count);
      mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
      return mesh;
    };
    const heads = make(head, n);
    const hairs = make(hair, n);
    const torsos = make(torso, n);
    const arms = make(limb(0.05, ARM), n * 2);
    const hands = make(hand, n * 2);
    const thighs = make(limb(0.078, THIGH + 0.03), n * 2);
    const shins = make(limb(0.06, THIGH + 0.02), n * 2);
    const shoes = make(shoe, n * 2);
    const shadows = make(createShadowGeometry(20), n, shadowMaterial);
    shadows.renderOrder = 1;
    const paired = new Set([arms, hands, thighs, shins, shoes]);
    const meshes = [heads, hairs, torsos, arms, hands, thighs, shins, shoes, shadows];
    parent.add(...meshes);

    const color = new THREE.Color();
    const root = new THREE.Matrix4();
    const upper = new THREE.Matrix4();
    const part = new THREE.Matrix4();
    const position = new THREE.Vector3();
    const scale = new THREE.Vector3();
    const quaternion = new THREE.Quaternion();
    const flat = new THREE.Quaternion();
    const up = new THREE.Vector3(0, 1, 0);
    const frustum = new THREE.Frustum();
    const projectionView = new THREE.Matrix4();
    const previousView = new THREE.Matrix4();
    const sphere = new THREE.Sphere();
    const pair = (mesh: THREE.InstancedMesh, index: number, hex: string) => { color.set(hex); mesh.setColorAt(index * 2, color); mesh.setColorAt(index * 2 + 1, color); };
    /** Joint matrix: root * translate(0, y, z) * rotateZ(swing). Positive swing carries the limb forward. */
    const joint = (target: THREE.Matrix4, base: THREE.Matrix4, y: number, z: number, swing: number) => {
      target.makeRotationZ(swing);
      target.setPosition(0, y, z);
      return target.premultiply(base);
    };
    const write = () => {
      camera.updateMatrixWorld();
      projectionView.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
      previousView.copy(projectionView);
      frustum.setFromProjectionMatrix(projectionView);
      let count = 0;
      for (const p of sim.people) {
        if (!p.active) continue;
        const ground = groundHeight(p.z);
        sphere.center.set(p.x, ground + .9 * p.scale, p.z);
        sphere.radius = 1.1 * p.scale;
        if (!frustum.intersectsSphere(sphere)) continue;
        const i = count++;
        heads.setColorAt(i, color.set(p.skin));
        hairs.setColorAt(i, color.set(HAIR[p.id % HAIR.length]));
        torsos.setColorAt(i, color.set(p.shirt));
        pair(arms, i, p.shirt); pair(hands, i, p.skin);
        pair(thighs, i, p.trousers); pair(shins, i, p.trousers);
        pair(shoes, i, SHOES[p.id % SHOES.length]);
        const swing = Math.sin(p.gait) * 0.5 * p.motion;
        const bob = Math.abs(Math.cos(p.gait)) * 0.02 * p.motion;
        root.compose(position.set(p.x, ground + bob, p.z), quaternion.setFromAxisAngle(up, p.heading), scale.setScalar(p.scale));
        heads.setMatrixAt(i, root); hairs.setMatrixAt(i, root); torsos.setMatrixAt(i, root);
        for (const side of [0, 1] as const) {
          const sign = side === 0 ? 1 : -1, slot = i * 2 + side;
          // The knee folds while the leg travels forward and straightens before the heel lands.
          const knee = (0.05 + 0.8 * Math.max(0, Math.cos(p.gait + side * Math.PI)) ** 1.4) * p.motion;
          joint(upper, root, HIP, sign * 0.1, sign * swing);
          thighs.setMatrixAt(slot, upper);
          joint(part, upper, -THIGH, 0, -knee);
          shins.setMatrixAt(slot, part); shoes.setMatrixAt(slot, part);
          joint(part, root, SHOULDER, sign * 0.245, -sign * swing * 0.9);
          arms.setMatrixAt(slot, part); hands.setMatrixAt(slot, part);
        }
        const radius = 0.42 * p.scale;
        shadows.setMatrixAt(i, part.compose(position.set(p.x, ground + 0.006, p.z), flat, scale.setScalar(radius)));
      }
      for (const mesh of meshes) {
        mesh.count = count * (paired.has(mesh) ? 2 : 1);
        mesh.visible = count > 0;
        mesh.instanceMatrix.needsUpdate = true;
        if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
        if (count) mesh.computeBoundingSphere();
      }
    };
    refresh.current = () => {
      camera.updateMatrixWorld();
      projectionView.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
      if (!projectionView.equals(previousView)) write();
    };
    write();
    invalidate();
    const stop = scheduler.add("pedestrians", (dt, time) => {
      sim.step(dt, time, worldState.kangaroo);
      write();
    });
    return () => {
      stop();
      refresh.current = null;
      parent.remove(...meshes);
      for (const mesh of meshes) mesh.geometry.dispose();
      material.dispose();
      shadowMaterial.dispose();
      for (const mesh of meshes) mesh.dispose();
    };
  }, [scheduler, quality.pedestrians, invalidate, camera]);

  return <group ref={holder} />;
}
