"use client";

import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { useSceneClock } from "./SceneClock";
import { worldState } from "./worldState";
import { createTraffic, VEHICLE_SPECS, type VehicleKind } from "./sim/traffic";
import { signalAt } from "./sim/signals";
import { layout } from "./world-layout";

const SEED = 4107;
type Group = "sedan" | "van" | "bus";
const groupOf = (kind: VehicleKind): Group => (kind === "taxi" ? "sedan" : kind);
const GLASS: [number, number, number] = [0.05, 0.07, 0.09];
const BODY: [number, number, number] = [1, 1, 1];
const HEAD: [number, number, number] = [1, 0.93, 0.74];
const TAIL: [number, number, number] = [0.8, 0.12, 0.1];
const WHEELS = { sedan: { r: 0.32, x: 1.38 }, van: { r: 0.38, x: 1.75 }, bus: { r: 0.5, x: 3.5 } } as const;

function paint(geometry: THREE.BufferGeometry, rgb: [number, number, number]) {
  const g = geometry.index ? geometry.toNonIndexed() : geometry;
  const count = g.getAttribute("position").count;
  const colors = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) colors.set(rgb, i * 3);
  g.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  g.deleteAttribute("uv");
  return g;
}
function box(w: number, h: number, d: number, x: number, y: number, z: number, rgb: [number, number, number]) {
  const g = new THREE.BoxGeometry(w, h, d);
  g.translate(x, y, z);
  return paint(g, rgb);
}
// Side profile (x along the car, y up) extruded across the width, with a soft bevel for the rounded look.
function profile(points: Array<[number, number]>, depth: number, rgb: [number, number, number], radius = 0.14) {
  const shape = new THREE.Shape();
  const n = points.length;
  for (let i = 0; i < n; i++) {
    const [px, py] = points[i];
    const [ax, ay] = points[(i + n - 1) % n];
    const [bx, by] = points[(i + 1) % n];
    const la = Math.hypot(ax - px, ay - py), lb = Math.hypot(bx - px, by - py);
    const r = Math.min(radius, la / 2.2, lb / 2.2);
    const sx = px + ((ax - px) / la) * r, sy = py + ((ay - py) / la) * r;
    const ex = px + ((bx - px) / lb) * r, ey = py + ((by - py) / lb) * r;
    if (i === 0) shape.moveTo(sx, sy); else shape.lineTo(sx, sy);
    shape.quadraticCurveTo(px, py, ex, ey);
  }
  shape.closePath();
  const bevel = 0.03;
  const g = new THREE.ExtrudeGeometry(shape, { depth: depth - bevel * 2, bevelEnabled: true, bevelThickness: bevel, bevelSize: bevel, bevelSegments: 2, curveSegments: 4 });
  g.translate(0, 0, -(depth - bevel * 2) / 2);
  return paint(g, rgb);
}
const rect = (x0: number, y0: number, x1: number, y1: number): Array<[number, number]> => [[x0, y0], [x1, y0], [x1, y1], [x0, y1]];

function vehicleGeometries(group: Group) {
  if (group === "sedan") {
    const { length: L, width: W } = VEHICLE_SPECS.sedan;
    const body = mergeGeometries([
      profile(rect(-L / 2, 0.26, L / 2, 0.86), W - 0.06, BODY, 0.22),
      profile([[-1.25, 0.84], [1.05, 0.84], [0.5, 1.42], [-0.9, 1.42]], W - 0.28, GLASS, 0.1),
      box(1.45, 0.07, W - 0.3, -0.2, 1.455, 0, BODY),
    ])!;
    const lights = mergeGeometries([
      box(0.06, 0.12, 0.3, L / 2 + 0.01, 0.66, 0.62, HEAD), box(0.06, 0.12, 0.3, L / 2 + 0.01, 0.66, -0.62, HEAD),
      box(0.06, 0.1, 0.34, -L / 2 - 0.01, 0.7, 0.6, TAIL), box(0.06, 0.1, 0.34, -L / 2 - 0.01, 0.7, -0.6, TAIL),
    ])!;
    return { body, lights };
  }
  if (group === "van") {
    const { length: L, width: W } = VEHICLE_SPECS.van;
    const body = mergeGeometries([
      profile(rect(-L / 2, 0.3, L / 2, 1.0), W - 0.06, BODY, 0.24),
      profile(rect(-L / 2, 0.95, 1.45, 2.1), W - 0.06, BODY, 0.14),
      profile([[1.4, 1.0], [2.25, 1.0], [1.85, 1.78], [1.4, 1.78]], W - 0.3, GLASS, 0.06),
      box(0.8, 0.45, 0.02, 0.85, 1.55, W / 2 - 0.02, GLASS), box(0.8, 0.45, 0.02, 0.85, 1.55, -W / 2 + 0.02, GLASS),
    ])!;
    const lights = mergeGeometries([
      box(0.06, 0.14, 0.3, L / 2 + 0.01, 0.78, 0.7, HEAD), box(0.06, 0.14, 0.3, L / 2 + 0.01, 0.78, -0.7, HEAD),
      box(0.06, 0.2, 0.18, -L / 2 - 0.01, 0.95, 0.8, TAIL), box(0.06, 0.2, 0.18, -L / 2 - 0.01, 0.95, -0.8, TAIL),
    ])!;
    return { body, lights };
  }
  const { length: L, width: W } = VEHICLE_SPECS.bus;
  const body = mergeGeometries([
    profile(rect(-L / 2, 0.45, L / 2, 3.15), W - 0.06, BODY, 0.3),
    box(L - 1.2, 1.1, 0.02, -0.4, 2.15, W / 2 - 0.005, GLASS), box(L - 1.2, 1.1, 0.02, -0.4, 2.15, -W / 2 + 0.005, GLASS),
    box(0.02, 1.25, W - 0.3, L / 2 - 0.005, 2.15, 0, GLASS),
    box(L - 0.6, 0.12, W - 0.06, 0, 0.5, 0, [0.3, 0.3, 0.32]),
  ])!;
  const lights = mergeGeometries([
    box(0.06, 0.16, 0.36, L / 2 + 0.01, 0.8, 0.85, HEAD), box(0.06, 0.16, 0.36, L / 2 + 0.01, 0.8, -0.85, HEAD),
    box(0.06, 0.2, 0.2, -L / 2 - 0.01, 1.0, 0.95, TAIL), box(0.06, 0.2, 0.2, -L / 2 - 0.01, 1.0, -0.95, TAIL),
  ])!;
  return { body, lights };
}

/**
 * Cars as InstancedMeshes: one body mesh + one lights mesh per vehicle class (sedan/taxi, van, bus)
 * and one shared wheel mesh, so at most 7 draw calls. The simulation runs in a scheduler tick.
 * This component also owns `worldState.walk`, written from the shared signal each tick.
 */
export function Traffic() {
  const { scheduler, quality } = useSceneClock();
  const invalidate = useThree((state) => state.invalidate);
  const camera = useThree((state) => state.camera);
  const refresh = useRef<(() => void) | null>(null);
  useFrame(() => refresh.current?.());
  const holder = useRef<THREE.Group>(null);

  useEffect(() => {
    const parent = holder.current;
    if (!parent || quality.cars <= 0) return;
    const sim = createTraffic({ seed: SEED, count: quality.cars });
    const disposables: Array<{ dispose: () => void }> = [];
    const bodyMaterial = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.38, metalness: 0.45 });
    const lightMaterial = new THREE.MeshBasicMaterial({ vertexColors: true, toneMapped: false });
    const wheelMaterial = new THREE.MeshStandardMaterial({ color: "#14171a", roughness: 0.8, metalness: 0.1 });
    disposables.push(bodyMaterial, lightMaterial, wheelMaterial);

    const groups = new Map<Group, { vehicles: typeof sim.vehicles; body: THREE.InstancedMesh; lights: THREE.InstancedMesh }>();
    const meshes: THREE.InstancedMesh[] = [];
    const color = new THREE.Color();
    for (const g of ["sedan", "van", "bus"] as const) {
      const vehicles = sim.vehicles.filter((v) => groupOf(v.kind) === g);
      if (!vehicles.length) continue;
      const { body, lights } = vehicleGeometries(g);
      disposables.push(body, lights);
      const bodyMesh = new THREE.InstancedMesh(body, bodyMaterial, vehicles.length);
      const lightMesh = new THREE.InstancedMesh(lights, lightMaterial, vehicles.length);
      vehicles.forEach((v, i) => bodyMesh.setColorAt(i, color.set(v.color)));
      for (const mesh of [bodyMesh, lightMesh]) {
        mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
        meshes.push(mesh);
      }
      groups.set(g, { vehicles, body: bodyMesh, lights: lightMesh });
    }
    const wheelGeometry = new THREE.CylinderGeometry(1, 1, 0.26, 14);
    wheelGeometry.rotateX(Math.PI / 2);
    disposables.push(wheelGeometry);
    const wheels = new THREE.InstancedMesh(wheelGeometry, wheelMaterial, sim.vehicles.length * 4);
    wheels.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    meshes.push(wheels);
    parent.add(...meshes);

    const root = new THREE.Matrix4();
    const local = new THREE.Matrix4();
    const position = new THREE.Vector3();
    const unit = new THREE.Vector3(1, 1, 1);
    const quaternion = new THREE.Quaternion();
    const up = new THREE.Vector3(0, 1, 0);
    const frustum = new THREE.Frustum();
    const projectionView = new THREE.Matrix4();
    const previousView = new THREE.Matrix4();
    const sphere = new THREE.Sphere();
    const write = () => {
      camera.updateMatrixWorld();
      projectionView.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
      previousView.copy(projectionView);
      frustum.setFromProjectionMatrix(projectionView);
      let wheelCount = 0;
      groups.forEach((group) => {
        let count = 0;
        for (const v of group.vehicles) {
          if (!v.active) continue;
          sphere.center.set(v.x, layout.road.y + v.height / 2, v.z);
          sphere.radius = Math.hypot(v.length / 2 + .15, v.height / 2 + .15, v.width / 2 + .15);
          if (!frustum.intersectsSphere(sphere)) continue;
          root.compose(position.set(v.x, layout.road.y + 0.01, v.z), quaternion.setFromAxisAngle(up, v.heading), unit);
          group.body.setMatrixAt(count, root);
          group.lights.setMatrixAt(count, root);
          // Packing changes instance order, so colour must follow the vehicle rather than its ID.
          group.body.setColorAt(count, color.set(v.color));
          count++;
          const set = WHEELS[groupOf(v.kind)];
          for (let w = 0; w < 4; w++) {
            const sx = w < 2 ? set.x : -set.x;
            const sz = (w % 2 ? -1 : 1) * (v.width / 2 - 0.1);
            local.makeScale(set.r, set.r, 1).setPosition(sx, set.r, sz);
            wheels.setMatrixAt(wheelCount++, local.premultiply(root));
          }
        }
        for (const mesh of [group.body, group.lights]) {
          mesh.count = count;
          mesh.visible = count > 0;
          mesh.instanceMatrix.needsUpdate = true;
          if (count) mesh.computeBoundingSphere();
        }
        if (group.body.instanceColor) group.body.instanceColor.needsUpdate = true;
      });
      wheels.count = wheelCount;
      wheels.visible = wheelCount > 0;
      wheels.instanceMatrix.needsUpdate = true;
      if (wheelCount) wheels.computeBoundingSphere();
    };
    // Camera transitions and resize can render while the simulation is resting. Refresh only
    // visibility then; simulation time and traffic-signal state remain untouched.
    refresh.current = () => {
      camera.updateMatrixWorld();
      projectionView.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
      if (!projectionView.equals(previousView)) write();
    };
    write();
    invalidate();
    const stop = scheduler.add("traffic", (dt, time) => {
      sim.step(dt, time);
      worldState.walk = signalAt(time).walk;
      write();
    });
    return () => {
      stop();
      refresh.current = null;
      worldState.walk = false;
      parent.remove(...meshes);
      for (const mesh of meshes) mesh.dispose();
      for (const item of disposables) item.dispose();
    };
  }, [scheduler, quality.cars, invalidate, camera]);

  return <group ref={holder} />;
}
