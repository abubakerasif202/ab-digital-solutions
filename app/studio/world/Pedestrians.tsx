"use client";

import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { useSceneClock } from "./SceneClock";
import { worldState } from "./worldState";
import { createPedestrians, groundHeight } from "./sim/pedestrians";

const SEED = 20260;
const HIP = 0.9;
const SHOULDER = 1.47;

function limb(radius: number, length: number) {
  const geometry = new THREE.CapsuleGeometry(radius, length, 3, 6);
  geometry.translate(0, -(length / 2 + radius), 0); // pivot at the joint
  return geometry;
}

/**
 * Pedestrians as four InstancedMeshes (heads, torsos, arms, legs). The simulation and every matrix
 * update run inside one scheduler tick; React never re-renders. Figures face local +x.
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
    const torso = new THREE.CylinderGeometry(0.17, 0.15, 0.62, 10);
    torso.scale(0.75, 1, 1.45);
    torso.translate(0, 1.19, 0);
    const head = new THREE.SphereGeometry(0.11, 10, 8);
    head.translate(0.01, 1.64, 0);
    const material = new THREE.MeshStandardMaterial({ roughness: 0.85, metalness: 0 });
    const make = (geometry: THREE.BufferGeometry, count: number) => {
      const mesh = new THREE.InstancedMesh(geometry, material, count);
      mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
      return mesh;
    };
    const heads = make(head, n);
    const torsos = make(torso, n);
    const arms = make(limb(0.05, 0.5), n * 2);
    const legs = make(limb(0.075, 0.72), n * 2);
    const color = new THREE.Color();
    sim.people.forEach((p, i) => {
      heads.setColorAt(i, color.set(p.skin));
      torsos.setColorAt(i, color.set(p.shirt));
      arms.setColorAt(i * 2, color.set(p.shirt)); arms.setColorAt(i * 2 + 1, color.set(p.shirt));
      legs.setColorAt(i * 2, color.set(p.trousers)); legs.setColorAt(i * 2 + 1, color.set(p.trousers));
    });
    const meshes = [heads, torsos, arms, legs];
    parent.add(...meshes);

    const root = new THREE.Matrix4();
    const part = new THREE.Matrix4();
    const position = new THREE.Vector3();
    const scale = new THREE.Vector3();
    const quaternion = new THREE.Quaternion();
    const up = new THREE.Vector3(0, 1, 0);
    const frustum = new THREE.Frustum();
    const projectionView = new THREE.Matrix4();
    const previousView = new THREE.Matrix4();
    const sphere = new THREE.Sphere();
    const place = (mesh: THREE.InstancedMesh, index: number, y: number, z: number, swing: number) => {
      part.makeRotationZ(swing);
      part.setPosition(0, y, z);
      mesh.setMatrixAt(index, part.premultiply(root));
    };
    const write = () => {
      camera.updateMatrixWorld();
      projectionView.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
      previousView.copy(projectionView);
      frustum.setFromProjectionMatrix(projectionView);
      let count = 0;
      for (const p of sim.people) {
        if (!p.active) continue;
        sphere.center.set(p.x, groundHeight(p.z) + .9 * p.scale, p.z);
        sphere.radius = 1.1 * p.scale;
        if (!frustum.intersectsSphere(sphere)) continue;
        const i = count++;
        heads.setColorAt(i, color.set(p.skin));
        torsos.setColorAt(i, color.set(p.shirt));
        arms.setColorAt(i * 2, color.set(p.shirt)); arms.setColorAt(i * 2 + 1, color.set(p.shirt));
        legs.setColorAt(i * 2, color.set(p.trousers)); legs.setColorAt(i * 2 + 1, color.set(p.trousers));
        const swing = Math.sin(p.gait) * 0.62 * p.motion;
        const bob = Math.abs(Math.cos(p.gait)) * 0.02 * p.motion;
        root.compose(position.set(p.x, groundHeight(p.z) + bob, p.z), quaternion.setFromAxisAngle(up, p.heading), scale.setScalar(p.scale));
        place(heads, i, 0, 0, 0);
        place(torsos, i, 0, 0, 0);
        place(legs, i * 2, HIP, 0.1, swing);
        place(legs, i * 2 + 1, HIP, -0.1, -swing);
        place(arms, i * 2, SHOULDER, 0.245, -swing * 0.9);
        place(arms, i * 2 + 1, SHOULDER, -0.245, swing * 0.9);
      }
      for (const mesh of meshes) {
        mesh.count = count * (mesh === arms || mesh === legs ? 2 : 1);
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
      for (const mesh of meshes) mesh.dispose();
    };
  }, [scheduler, quality.pedestrians, invalidate, camera]);

  return <group ref={holder} />;
}
