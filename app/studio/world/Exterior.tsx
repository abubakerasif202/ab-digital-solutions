"use client";

import { useEffect, useRef } from "react";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { useSceneClock } from "./SceneClock";
import { layout } from "./world-layout";
import { mulberry32 } from "./sim/rng";
import { signalAt } from "./sim/signals";
import { SIDE_STREET } from "./sim/traffic";

type V3 = [number, number, number];
const HALF = 100; // road and footpaths run well past the 120 m street so the ends never show
const LANE_GAP: [number, number] = [SIDE_STREET.x - 4, SIDE_STREET.x + 4]; // side street through the far buildings
const ZEBRA: [number, number] = [layout.crossing.x - layout.crossing.width / 2, layout.crossing.x + layout.crossing.width / 2];
const NEAR_KERB = layout.footpath.z1;
const FAR_KERB = layout.farFootpath.z0;
const FP_Y = layout.footpath.y;
const BRASS = "#bca06b";
const CHARCOAL = "#22272a";
const LINE_Y = 0.014;

// Collects coloured primitives per material key and merges each key into one draw call.
function createMesher() {
  const buckets = new Map<string, THREE.BufferGeometry[]>();
  const tint = new THREE.Color();
  const push = (key: string, source: THREE.BufferGeometry, hex: string) => {
    const g = source.index ? source.toNonIndexed() : source;
    if (g !== source) source.dispose();
    g.deleteAttribute("uv");
    const count = g.getAttribute("position").count;
    tint.set(hex);
    const colors = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) { colors[i * 3] = tint.r; colors[i * 3 + 1] = tint.g; colors[i * 3 + 2] = tint.b; }
    g.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    const list = buckets.get(key);
    if (list) list.push(g); else buckets.set(key, [g]);
  };
  return {
    box(key: string, size: V3, pos: V3, hex: string, rot: V3 = [0, 0, 0]) {
      const g = new THREE.BoxGeometry(...size);
      if (rot[0]) g.rotateX(rot[0]);
      if (rot[1]) g.rotateY(rot[1]);
      if (rot[2]) g.rotateZ(rot[2]);
      g.translate(...pos);
      push(key, g, hex);
    },
    cyl(key: string, rTop: number, rBottom: number, height: number, pos: V3, hex: string, segments = 8, rotZ = 0) {
      const g = new THREE.CylinderGeometry(rTop, rBottom, height, segments);
      if (rotZ) g.rotateZ(rotZ);
      g.translate(...pos);
      push(key, g, hex);
    },
    // Horizontal quad (road paint, paving joints) facing up.
    flat(key: string, x0: number, x1: number, z0: number, z1: number, y: number, hex: string) {
      const g = new THREE.PlaneGeometry(x1 - x0, z1 - z0);
      g.rotateX(-Math.PI / 2);
      g.translate((x0 + x1) / 2, y, (z0 + z1) / 2);
      push(key, g, hex);
    },
    disc(key: string, radius: number, pos: V3, hex: string, rotY: number) {
      const g = new THREE.CircleGeometry(radius, 14);
      g.rotateY(rotY);
      g.translate(...pos);
      push(key, g, hex);
    },
    build(key: string) {
      const list = buckets.get(key);
      return list ? mergeGeometries(list) : null;
    },
    dispose() { buckets.forEach((list) => list.forEach((g) => g.dispose())); buckets.clear(); },
  };
}
type Mesher = ReturnType<typeof createMesher>;

function buildGround(m: Mesher) {
  const footpath = "#bbb09b", joint = "#a09580", asphalt = "#47494c", kerb = "#cfc8b8", tactile = "#c8a43a";
  m.box("solid", [2 * HALF * 2, 0.2, 149], [0, -0.13, 34.5], "#7a7566"); // quay and verge, from the harbour wall to the far buildings
  m.box("solid", [2 * HALF, FP_Y, NEAR_KERB - layout.footpath.z0], [0, FP_Y / 2, (layout.footpath.z0 + NEAR_KERB) / 2], footpath);
  m.box("solid", [2 * HALF, 0.02, layout.road.z1 - layout.road.z0], [0, 0, layout.road.centerZ], asphalt);
  // Far footpath and kerb stop at the side street, which carries asphalt through the gap.
  const farDepth = layout.farFootpath.z1 - FAR_KERB;
  for (const [x0, x1] of [[-HALF, LANE_GAP[0]], [LANE_GAP[1], HALF]]) {
    m.box("solid", [x1 - x0, FP_Y, farDepth], [(x0 + x1) / 2, FP_Y / 2, FAR_KERB + farDepth / 2], footpath);
    m.box("solid", [x1 - x0, 0.17, 0.22], [(x0 + x1) / 2, 0.085, FAR_KERB + 0.11], kerb);
  }
  m.box("solid", [LANE_GAP[1] - LANE_GAP[0], 0.02, 20], [SIDE_STREET.x, 0, FAR_KERB + 9], asphalt);
  m.box("solid", [2 * HALF, 0.17, 0.22], [0, 0.085, NEAR_KERB - 0.11], kerb);
  // Paving joints: cross joints every 1.2 m and two long ones per footpath.
  for (let x = -HALF; x < HALF; x += 1.2) {
    m.flat("joint", x, x + 0.025, layout.footpath.z0, NEAR_KERB - 0.22, FP_Y + 0.004, joint);
    if (x < LANE_GAP[0] - 0.1 || x > LANE_GAP[1]) m.flat("joint", x, x + 0.025, FAR_KERB + 0.22, layout.farFootpath.z1, FP_Y + 0.004, joint);
  }
  for (const z of [10.55, 11.35]) m.flat("joint", -HALF, HALF, z, z + 0.02, FP_Y + 0.004, joint);
  for (const z of [23.2, 24.0]) for (const [x0, x1] of [[-HALF, LANE_GAP[0]], [LANE_GAP[1], HALF]]) m.flat("joint", x0, x1, z, z + 0.02, FP_Y + 0.004, joint);
  // Tactile ground surface indicators at the kerb ramps.
  m.box("solid", [3.6, 0.012, 0.5], [layout.crossing.x, FP_Y + 0.004, NEAR_KERB - 0.5], tactile);
  m.box("solid", [3.6, 0.012, 0.5], [layout.crossing.x, FP_Y + 0.004, FAR_KERB + 0.5], tactile);
}

// Road paint: Australian layout with a continuous centre line near the zebra, dashed elsewhere.
function buildMarkings(m: Mesher) {
  const white = "#e9e6dc", wear = "#3d3f43";
  const z0 = layout.road.z0, z1 = layout.road.z1, mid = layout.road.centerZ;
  const solidFrom = ZEBRA[0] - 24, solidTo = ZEBRA[1] + 24;
  m.flat("mark", solidFrom, solidTo, mid - 0.07, mid + 0.07, LINE_Y, white);
  for (let x = -HALF; x < HALF; x += 9) {
    if (x + 3 > solidFrom && x < solidTo) continue;
    m.flat("mark", x, x + 3, mid - 0.07, mid + 0.07, LINE_Y, white);
  }
  const edge = (zA: number, zB: number, skip: Array<[number, number]>) => {
    let from = -HALF;
    for (const [a, b] of [...skip, [HALF, HALF] as [number, number]]) { if (a > from) m.flat("mark", from, a, zA, zB, LINE_Y, white); from = b; }
  };
  edge(z0 + 0.3, z0 + 0.42, [[ZEBRA[0] - 1.2, ZEBRA[1] + 1.2]]);
  edge(z1 - 0.42, z1 - 0.3, [[LANE_GAP[0], LANE_GAP[1]], [ZEBRA[0] - 1.2, ZEBRA[1] + 1.2]]);
  const plus = layout.stopLines.plusX, minus = layout.stopLines.minusX;
  m.flat("mark", plus - 0.2, plus + 0.2, z0 + 0.5, mid - 0.2, LINE_Y, white);
  m.flat("mark", minus - 0.2, minus + 0.2, mid + 0.2, z1 - 0.5, LINE_Y, white);
  // Zebra: bars long in x, stepped along z.
  for (let i = 0; i < 9; i++) m.flat("mark", ZEBRA[0], ZEBRA[1], z0 + 0.6 + i * 1.1 - 0.3, z0 + 0.6 + i * 1.1 + 0.3, LINE_Y, white);
  // Wheel-path wear, interrupted at the crossing.
  for (const lane of [layout.lanes.plusX, layout.lanes.minusX]) for (const off of [-0.85, 0.85]) {
    m.flat("mark", -HALF, ZEBRA[0] - 1.4, lane + off - 0.3, lane + off + 0.3, LINE_Y - 0.002, wear);
    m.flat("mark", ZEBRA[1] + 1.4, HALF, lane + off - 0.3, lane + off + 0.3, LINE_Y - 0.002, wear);
  }
}

type Building = { x0: number; x1: number; h: number; wall: string; accent: string; trim: string };
const BUILDINGS: Building[] = [
  { x0: -HALF, x1: -48, h: 14, wall: "#8d5b46", accent: "#792c40", trim: "#6e4636" },
  { x0: -40, x1: -28, h: 19, wall: "#cdbb98", accent: "#2e5c6e", trim: "#a8966f" },
  { x0: -28, x1: -18, h: 11, wall: "#8e9a86", accent: "#bca06b", trim: "#6f7a68" },
  { x0: -18, x1: -6, h: 16, wall: "#bda889", accent: "#792c40", trim: "#8f7d62" },
  { x0: -6, x1: 8, h: 22, wall: "#51463f", accent: "#bca06b", trim: "#2f2925" },
  { x0: 8, x1: 22, h: 13, wall: "#a8654b", accent: "#22272a", trim: "#7d4836" },
  { x0: 22, x1: 38, h: 18, wall: "#9aa5a8", accent: "#792c40", trim: "#6f7b7e" },
  { x0: 38, x1: HALF, h: 12, wall: "#d6c7a4", accent: "#2e5c6e", trim: "#a99a78" },
];

function buildFacades(m: Mesher) {
  const rng = mulberry32(7731);
  const z = FAR_KERB + (layout.farFootpath.z1 - FAR_KERB); // building line, z = 25
  for (const b of BUILDINGS) {
    const w = b.x1 - b.x0, cx = (b.x0 + b.x1) / 2;
    // Wide end blocks keep their shopfront and windows next to the visible part of the street.
    const span = Math.min(w, 22);
    const ax = b.x0 === -HALF ? b.x1 - span / 2 : b.x1 === HALF ? b.x0 + span / 2 : cx;
    m.box("solid", [w, b.h, 16], [cx, b.h / 2, z + 8], b.wall);
    m.box("solid", [w + 0.1, 0.7, 0.3], [cx, 0.35, z - 0.15], b.trim); // plinth
    m.box("solid", [w + 0.3, 0.45, 0.9], [cx, b.h - 0.1, z + 0.1], b.trim); // cornice
    for (const side of [b.x0 + 0.25, b.x1 - 0.25]) m.box("solid", [0.5, b.h, 0.3], [side, b.h / 2, z - 0.15], b.trim); // piers
    // Shopfront: fascia, glazing (some panes glowing) and a striped awning.
    const shopW = span - 1.4;
    const shopX = ax;
    m.box("solid", [shopW + 0.6, 0.7, 0.2], [shopX, 3.55, z - 0.1], b.accent);
    const panes = Math.max(2, Math.floor(shopW / 2.3));
    const paneW = shopW / panes - 0.14;
    for (let i = 0; i < panes; i++) {
      const px = shopX - shopW / 2 + (i + 0.5) * (shopW / panes);
      const lit = rng() < 0.62;
      m.box(lit ? "lit" : "glass", [paneW, 2.2, 0.04], [px, 1.55, z - 0.02], lit ? (rng() < 0.5 ? "#e2c288" : "#d9b274") : "#34464f");
    }
    m.box("solid", [shopW + 0.4, 0.14, 0.12], [shopX, 0.55, z - 0.06], CHARCOAL);
    const strips = Math.max(4, Math.round(shopW / 0.55));
    const stripW = (shopW + 0.4) / strips;
    for (let i = 0; i < strips; i++) {
      const sx = shopX - (shopW + 0.4) / 2 + (i + 0.5) * stripW;
      const hex = i % 2 ? "#eadfc6" : b.accent;
      m.box("solid", [stripW, 0.07, 1.7], [sx, 2.95, z - 0.85], hex, [-0.18, 0, 0]);
      m.box("solid", [stripW, 0.2, 0.04], [sx, 2.72, z - 1.69], hex);
    }
    // Upper floors.
    const floors = Math.max(1, Math.floor((b.h - 4.3) / 3.2));
    const cols = Math.max(2, Math.floor(span / 2.7));
    for (let f = 0; f < floors; f++) {
      const y = 4.6 + f * 3.2;
      for (let c = 0; c < cols; c++) {
        const wx = ax - ((cols - 1) * 2.7) / 2 + c * 2.7;
        const lit = rng() < 0.3;
        m.box(lit ? "lit" : "glass", [1.15, 1.8, 0.05], [wx, y + 1.1, z - 0.03], lit ? "#e7c689" : (rng() < 0.5 ? "#3a4d57" : "#2b3b44"));
        m.box("solid", [1.4, 0.1, 0.22], [wx, y + 0.12, z - 0.1], b.trim); // sill
      }
    }
  }
}

function lampPost(m: Mesher, x: number, z: number, dir: 1 | -1) {
  m.cyl("solid", 0.11, 0.16, 0.3, [x, FP_Y + 0.15, z], BRASS, 10);
  m.cyl("solid", 0.06, 0.09, 7.2, [x, FP_Y + 3.6, z], "#2b3033", 8);
  m.box("solid", [0.08, 0.08, 2.4], [x, FP_Y + 7.15, z + dir * 1.15], "#2b3033");
  m.box("solid", [0.34, 0.12, 0.8], [x, FP_Y + 7.15, z + dir * 2.3], "#2b3033");
  m.box("lit", [0.26, 0.03, 0.62], [x, FP_Y + 7.07, z + dir * 2.3], "#ffe2a8");
}

function buildFurniture(m: Mesher) {
  for (const x of [-52, -34, -16, 14, 32, 50]) lampPost(m, x, NEAR_KERB - 0.12, 1);
  for (const x of [-60, -26, -8, 12, 30, 58]) lampPost(m, x, FAR_KERB + 0.12, -1);
  // Bins and bollards.
  for (const [x, z] of [[-8, NEAR_KERB - 0.2], [13, NEAR_KERB - 0.2], [-6, FAR_KERB + 0.4], [17, FAR_KERB + 0.4]] as Array<[number, number]>) {
    m.cyl("solid", 0.23, 0.2, 0.85, [x, FP_Y + 0.425, z], CHARCOAL, 10);
    m.cyl("solid", 0.25, 0.25, 0.06, [x, FP_Y + 0.88, z], BRASS, 10);
    m.cyl("solid", 0.235, 0.235, 0.05, [x, FP_Y + 0.6, z], BRASS, 10);
  }
  for (const [x, z] of [[1.2, NEAR_KERB - 0.12], [10.8, NEAR_KERB - 0.12], [1.2, FAR_KERB + 0.12], [10.8, FAR_KERB + 0.12], [LANE_GAP[0] - 0.5, FAR_KERB + 0.15], [LANE_GAP[1] + 0.5, FAR_KERB + 0.15]] as Array<[number, number]>) {
    m.cyl("solid", 0.07, 0.07, 0.9, [x, FP_Y + 0.45, z], "#2f3438", 8);
    m.cyl("solid", 0.075, 0.075, 0.08, [x, FP_Y + 0.9, z], BRASS, 8);
  }
  // Bus shelter on the far footpath, kerb side, with its own sign pole.
  const sx = -19.5, sz = FAR_KERB + 0.95;
  m.box("solid", [3.7, 0.08, 1.3], [sx, FP_Y + 2.55, sz], CHARCOAL);
  m.box("solid", [3.7, 0.035, 1.34], [sx, FP_Y + 2.61, sz], BRASS);
  for (const dx of [-1.75, 1.75]) for (const dz of [-0.55, 0.55]) m.cyl("solid", 0.04, 0.04, 2.5, [sx + dx, FP_Y + 1.25, sz + dz], CHARCOAL, 6);
  m.box("clear", [3.4, 1.9, 0.02], [sx, FP_Y + 1.5, sz + 0.55], "#9fc0c4");
  m.box("clear", [0.02, 1.9, 1.0], [sx - 1.72, FP_Y + 1.5, sz], "#9fc0c4");
  m.box("solid", [2, 0.06, 0.42], [sx, FP_Y + 0.5, sz + 0.2], "#8a6a45");
  for (const dx of [-0.8, 0.8]) m.box("solid", [0.05, 0.5, 0.38], [sx + dx, FP_Y + 0.25, sz + 0.2], CHARCOAL);
  m.cyl("solid", 0.04, 0.04, 3.2, [sx + 2.7, FP_Y + 1.6, FAR_KERB + 0.4], CHARCOAL, 6);
  m.cyl("solid", 0.28, 0.28, 0.04, [sx + 2.7, FP_Y + 3.1, FAR_KERB + 0.4], "#792c40", 20, Math.PI / 2);
  m.box("solid", [0.05, 0.1, 0.4], [sx + 2.7, FP_Y + 3.1, FAR_KERB + 0.4], BRASS);
}

const LAMP_ON = { red: "#ff3a2e", amber: "#ffb21e", green: "#35e07a" };
const LAMP_OFF = { red: "#3b1a1a", amber: "#3b3016", green: "#15301f" };
const LAMPS = ["vRed", "vAmber", "vGreen", "pRed", "pGreen"] as const;
type Lamp = (typeof LAMPS)[number];

// Traffic and pedestrian signal heads; the five lamp groups are re-coloured each tick.
function buildSignals(m: Mesher) {
  const vehicleHead = (x: number, z: number, facing: 1 | -1) => {
    m.cyl("solid", 0.05, 0.06, 3.7, [x, FP_Y + 1.85, z], "#2b3033", 8);
    m.box("solid", [0.3, 1.0, 0.34], [x, FP_Y + 3.2, z], "#171b1d");
    const lx = x + facing * 0.155;
    const rot = facing * (Math.PI / 2);
    m.disc("vRed", 0.11, [lx, FP_Y + 3.5, z], LAMP_OFF.red, rot);
    m.disc("vAmber", 0.11, [lx, FP_Y + 3.2, z], LAMP_OFF.amber, rot);
    m.disc("vGreen", 0.11, [lx, FP_Y + 2.9, z], LAMP_OFF.green, rot);
  };
  const pedHead = (x: number, z: number, facing: 1 | -1) => {
    m.cyl("solid", 0.05, 0.06, 3.0, [x, FP_Y + 1.5, z], "#2b3033", 8);
    m.box("solid", [0.38, 0.68, 0.24], [x, FP_Y + 2.45, z], "#171b1d");
    const lz = z + facing * 0.125;
    const rot = facing > 0 ? 0 : Math.PI;
    m.disc("pRed", 0.1, [x, FP_Y + 2.62, lz], LAMP_OFF.red, rot);
    m.disc("pGreen", 0.1, [x, FP_Y + 2.3, lz], LAMP_OFF.green, rot);
    m.box("solid", [0.08, 0.14, 0.08], [x, FP_Y + 1.15, z], "#c8a43a"); // push button
  };
  vehicleHead(layout.stopLines.plusX - 0.5, NEAR_KERB - 0.1, -1);
  vehicleHead(layout.stopLines.minusX + 0.5, FAR_KERB + 0.1, 1);
  for (const x of [ZEBRA[0] - 0.4, ZEBRA[1] + 0.4]) { pedHead(x, NEAR_KERB - 0.1, 1); pedHead(x, FAR_KERB + 0.1, -1); }
}

const TREE_X = [-10, 36, -30, 48, -4, 58, -56, 28, -34, 42, 53, 22];

function buildTrees(m: Mesher, parent: THREE.Group, count: number, disposables: Array<{ dispose: () => void }>) {
  const xs = TREE_X.slice(0, count);
  const baseY = FP_Y + 0.43;
  const z = FAR_KERB + 0.7;
  for (const x of xs) {
    m.box("solid", [1.1, 0.43, 1.1], [x, FP_Y + 0.215, z], CHARCOAL);
    m.box("solid", [1.18, 0.05, 1.18], [x, FP_Y + 0.44, z], BRASS);
    m.box("solid", [0.94, 0.02, 0.94], [x, FP_Y + 0.43, z], "#2a2119");
  }
  if (!xs.length) return;
  const trunk = new THREE.CylinderGeometry(0.1, 0.17, 2.9, 7);
  trunk.translate(0, 1.45, 0);
  const blobs: THREE.BufferGeometry[] = [];
  for (const [bx, by, bz, r] of [[0, 3.9, 0, 1.55], [0.95, 3.5, 0.4, 1.05], [-0.85, 3.6, 0.55, 1.1], [0.3, 4.55, -0.7, 0.95], [-0.5, 4.5, 0.3, 0.95]]) {
    const g = new THREE.IcosahedronGeometry(r, 1);
    g.translate(bx, by, bz);
    blobs.push(g);
  }
  const canopy = mergeGeometries(blobs)!;
  canopy.computeVertexNormals();
  blobs.forEach((g) => g.dispose());
  const trunkMaterial = new THREE.MeshStandardMaterial({ color: "#4b3a2b", roughness: 0.95 });
  const canopyMaterial = new THREE.MeshStandardMaterial({ color: "#ffffff", roughness: 0.9, flatShading: true });
  const trunks = new THREE.InstancedMesh(trunk, trunkMaterial, xs.length);
  const crowns = new THREE.InstancedMesh(canopy, canopyMaterial, xs.length);
  const rng = mulberry32(991);
  const greens = ["#5f7a46", "#6d8a4f", "#4f6b3e", "#76904f"];
  const matrix = new THREE.Matrix4();
  const color = new THREE.Color();
  xs.forEach((x, i) => {
    const s = 0.9 + rng() * 0.3;
    matrix.compose(new THREE.Vector3(x, baseY, z), new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), rng() * 6.28), new THREE.Vector3(s, s, s));
    crowns.setMatrixAt(i, matrix);
    matrix.makeTranslation(x, baseY, z);
    trunks.setMatrixAt(i, matrix);
    crowns.setColorAt(i, color.set(greens[Math.floor(rng() * greens.length)]));
  });
  parent.add(trunks, crowns);
  disposables.push(trunk, canopy, trunkMaterial, canopyMaterial, trunks, crowns);
}

const MATERIALS: Record<string, () => THREE.Material> = {
  solid: () => new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.82, metalness: 0.04 }),
  joint: () => new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.9, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }),
  mark: () => new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.7, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4 }),
  glass: () => new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.14, metalness: 0.7 }),
  clear: () => new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.1, metalness: 0.2, transparent: true, opacity: 0.2, depthWrite: false }),
  lit: () => new THREE.MeshBasicMaterial({ vertexColors: true, toneMapped: false }),
};

/**
 * The street in front of the studio: road, paint, footpaths, far-side storefronts, lamps, signals,
 * trees and furniture. Everything static is merged per material (about a dozen draw calls); only the
 * five signal-lamp colours change, imperatively, in a 10 Hz scheduler tick.
 */
export function Exterior() {
  const { scheduler, quality } = useSceneClock();
  const invalidate = useThree((state) => state.invalidate);
  const holder = useRef<THREE.Group>(null);

  useEffect(() => {
    const parent = holder.current;
    if (!parent) return;
    const mesher = createMesher();
    const disposables: Array<{ dispose: () => void }> = [];
    buildGround(mesher);
    buildMarkings(mesher);
    buildFacades(mesher);
    buildFurniture(mesher);
    buildSignals(mesher);
    buildTrees(mesher, parent, quality.trees, disposables);
    const meshes: THREE.Object3D[] = [];
    const add = (key: string, material: THREE.Material, order = 0) => {
      const geometry = mesher.build(key);
      if (!geometry) { material.dispose(); return null; }
      const mesh = new THREE.Mesh(geometry, material);
      mesh.renderOrder = order;
      parent.add(mesh); meshes.push(mesh);
      disposables.push(geometry, material);
      return material;
    };
    for (const key of Object.keys(MATERIALS)) add(key, MATERIALS[key](), key === "clear" ? 2 : 0);
    const lamps = new Map<Lamp, THREE.MeshBasicMaterial>();
    for (const key of LAMPS) {
      const material = add(key, new THREE.MeshBasicMaterial({ color: "#ffffff", toneMapped: false }));
      if (material instanceof THREE.MeshBasicMaterial) { material.vertexColors = false; lamps.set(key, material); }
    }
    const paint = (time: number) => {
      const s = signalAt(time);
      const set = (lamp: Lamp, on: boolean, kind: "red" | "amber" | "green") => lamps.get(lamp)?.color.set(on ? LAMP_ON[kind] : LAMP_OFF[kind]);
      set("vRed", s.vehicle === "red", "red");
      set("vAmber", s.vehicle === "amber", "amber");
      set("vGreen", s.vehicle === "green", "green");
      set("pGreen", s.walk, "green");
      set("pRed", !s.walk && (!s.flashing || time % 1 < 0.5), "red");
    };
    paint(scheduler.time);
    invalidate();
    const stop = scheduler.add("exterior-signals", (_dt, time) => paint(time), 0.1);
    return () => {
      stop();
      parent.clear();
      mesher.dispose();
      for (const item of disposables) item.dispose();
    };
  }, [scheduler, quality.trees, invalidate]);

  return <group ref={holder} />;
}
