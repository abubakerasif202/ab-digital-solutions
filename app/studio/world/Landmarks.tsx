"use client";

import { useEffect, useRef } from "react";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { useSceneClock } from "./SceneClock";
import { layout } from "./world-layout";
import { mulberry32 } from "./sim/rng";

/** Nocturnal Sydney harbour haze colour for `scene.fog` and the horizon. Landmarks bake their own haze and ignore fog. */
export const skyFog = "#0b0e16";
/** Camera `far` must be at least this for the dome and the farthest backdrop to render. */
export const landmarkFarClip = 420;

const SKY_RADIUS = 340;
const RIDGE_RADIUS = 312;
const OPERA_AT: [number, number, number] = [-35, 0, -150]; // leave both landmark silhouettes inside the portrait opening
const HAZE = new THREE.Color(skyFog);
const haze = (hex: string, amount: number) => new THREE.Color(hex).lerp(HAZE, amount);
const smooth = (a: number, b: number, x: number) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

// Precomputed unit-box (36 non-indexed vertices: 6 faces x 2 triangles x 3 vertices) so
// landmark blocks append straight into flat arrays without creating temporary BoxGeometries.
const UNIT_BOX = (() => {
  const g = new THREE.BoxGeometry(1, 1, 1);
  const nonIndexed = g.toNonIndexed();
  g.dispose();
  const pos = Float32Array.from(nonIndexed.getAttribute("position").array as Float32Array);
  const norm = Float32Array.from(nonIndexed.getAttribute("normal").array as Float32Array);
  nonIndexed.dispose();
  return { pos, norm };
})();

// Stylised backdrop only: nothing here claims to be the studio's real location.
type Bag = ReturnType<typeof createBag>;
function createBag() {
  const list: THREE.BufferGeometry[] = [];
  const positions: number[] = [];
  const normals: number[] = [];
  const colors: number[] = [];
  const origin = new THREE.Vector3();
  let scale = 1;
  return {
    /** Everything added afterwards is shifted by this world offset (lets a landmark be modelled locally). */
    setOrigin(x: number, y: number, z: number, uniformScale = 1) { origin.set(x, y, z); scale = uniformScale; },
    add(source: THREE.BufferGeometry, color: THREE.Color | null) {
      const g = source.index ? source.toNonIndexed() : source;
      if (g !== source) source.dispose();
      g.deleteAttribute("uv");
      g.scale(scale, scale, scale).translate(origin.x, origin.y, origin.z);
      if (color) {
        const count = g.getAttribute("position").count;
        const c = new Float32Array(count * 3);
        const r = color.r, gr = color.g, b = color.b;
        for (let i = 0; i < count; i++) {
          const idx = i * 3;
          c[idx] = r; c[idx + 1] = gr; c[idx + 2] = b;
        }
        g.setAttribute("color", new THREE.BufferAttribute(c, 3));
      }
      list.push(g);
    },
    box(size: [number, number, number], pos: [number, number, number], color: THREE.Color, rotZ = 0) {
      const sx = size[0] * scale, sy = size[1] * scale, sz = size[2] * scale;
      const px = pos[0] * scale + origin.x, py = pos[1] * scale + origin.y, pz = pos[2] * scale + origin.z;
      const cos = rotZ ? Math.cos(rotZ) : 1;
      const sin = rotZ ? Math.sin(rotZ) : 0;
      const r = color.r, g = color.g, b = color.b;
      const { pos: bp, norm: bn } = UNIT_BOX;
      for (let i = 0; i < bp.length; i += 3) {
        const lx = bp[i] * sx, ly = bp[i + 1] * sy, lz = bp[i + 2] * sz;
        const nx = bn[i], ny = bn[i + 1], nz = bn[i + 2];
        if (rotZ) {
          positions.push(lx * cos - ly * sin + px, lx * sin + ly * cos + py, lz + pz);
          normals.push(nx * cos - ny * sin, nx * sin + ny * cos, nz);
        } else {
          positions.push(lx + px, ly + py, lz + pz);
          normals.push(nx, ny, nz);
        }
        colors.push(r, g, b);
      }
    },
    build() {
      if (positions.length) {
        const batched = new THREE.BufferGeometry();
        batched.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
        batched.setAttribute("normal", new THREE.Float32BufferAttribute(normals, 3));
        batched.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
        list.push(batched);
      }
      return list.length ? mergeGeometries(list) : null;
    },
    dispose() {
      list.forEach((g) => g.dispose());
      list.length = 0;
      positions.length = 0;
      normals.length = 0;
      colors.length = 0;
    },
  };
}

function buildSky(detail: number) {
  const geometry = new THREE.SphereGeometry(SKY_RADIUS, detail === 0 ? 24 : 48, detail === 0 ? 18 : 40);
  const stops: Array<[number, THREE.Color]> = [
    [-1, new THREE.Color(skyFog)],
    [-0.04, new THREE.Color("#141522")],
    [0, new THREE.Color("#2a1921")],
    [0.08, new THREE.Color("#1d1724")],
    [0.24, new THREE.Color("#101421")],
    [0.55, new THREE.Color("#090b13")],
    [1, new THREE.Color("#05060a")],
  ];
  const horizonGlow = new THREE.Color("#c9814b");
  const rubyWash = new THREE.Color("#8a152c");
  const sun = new THREE.Vector3(0.28, 0.08, -0.96).normalize();
  const position = geometry.getAttribute("position");
  const colors = new Float32Array(position.count * 3);
  const dir = new THREE.Vector3();
  const color = new THREE.Color();
  for (let i = 0; i < position.count; i++) {
    dir.fromBufferAttribute(position, i).normalize();
    let k = 1;
    while (k < stops.length - 1 && dir.y > stops[k][0]) k++;
    const [t0, c0] = stops[k - 1], [t1, c1] = stops[k];
    color.copy(c0).lerp(c1, smooth(t0, t1, dir.y));
    const horizonBand = 1 - smooth(0, 0.32, Math.abs(dir.y));
    color.lerp(horizonGlow, Math.pow(Math.max(0, dir.dot(sun)), 5) * 0.24 * horizonBand);
    color.lerp(rubyWash, Math.pow(Math.max(0, -dir.z), 3) * 0.14 * horizonBand);
    const idx = i * 3;
    colors[idx] = color.r; colors[idx + 1] = color.g; colors[idx + 2] = color.b;
  }
  geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  const material = new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide, fog: false, depthWrite: false, toneMapped: false });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.renderOrder = -1000;
  mesh.frustumCulled = false;
  return { mesh, geometry, material };
}

function buildStars(detail: number) {
  const count = detail >= 2 ? 220 : detail === 1 ? 140 : 80;
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const rng = mulberry32(1932);
  const warm = new THREE.Color("#f3e0b8");
  const cool = new THREE.Color("#b7cae6");
  const c = new THREE.Color();
  for (let i = 0; i < count; i++) {
    const theta = rng() * Math.PI * 2;
    const phi = Math.acos(0.14 + rng() * 0.84);
    const r = SKY_RADIUS - 6;
    positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = r * Math.cos(phi);
    positions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
    c.copy(cool).lerp(warm, rng()).multiplyScalar(0.35 + rng() * 0.55);
    colors.set([c.r, c.g, c.b], i * 3);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  const material = new THREE.PointsMaterial({ size: 1.5, sizeAttenuation: true, vertexColors: true, transparent: true, opacity: 0.78, fog: false, depthWrite: false, toneMapped: false });
  const points = new THREE.Points(geometry, material);
  points.renderOrder = -999;
  points.frustumCulled = false;
  return { mesh: points, geometry, material };
}

// Calm nocturnal harbour: obsidian-navy water with shimmering gold & ruby reflection paths.
function buildWater(detail: number) {
  const nx = detail >= 2 ? 72 : detail === 1 ? 48 : 24, nz = detail >= 2 ? 36 : detail === 1 ? 24 : 12;
  const geometry = new THREE.PlaneGeometry(660, 290, nx, nz);
  geometry.rotateX(-Math.PI / 2);
  geometry.translate(0, layout.harbour.waterY, layout.harbour.waterZ - 145);
  const position = geometry.getAttribute("position");
  const base = new Float32Array(position.count * 3);
  const phase = new Float32Array(position.count);
  const depth = new Float32Array(position.count);
  const rubyMask = new Float32Array(position.count);
  const rng = mulberry32(2024);
  const near = new THREE.Color("#070c15"), far = new THREE.Color("#141926"), color = new THREE.Color();
  for (let i = 0; i < position.count; i++) {
    let x = position.getX(i), z = position.getZ(i);
    const r = Math.hypot(x, z);
    if (r > RIDGE_RADIUS) { x *= RIDGE_RADIUS / r; z *= RIDGE_RADIUS / r; position.setXYZ(i, x, position.getY(i), z); }
    const d = Math.hypot(x, z - 30);
    const t = Math.pow(Math.min(1, d / 300), 1.3);
    color.copy(near).lerp(far, t);
    const idx = i * 3;
    base[idx] = color.r; base[idx + 1] = color.g; base[idx + 2] = color.b;
    phase[i] = rng() * 6.28;
    depth[i] = smooth(45, 195, d);
    // Subtle ruby shimmer band under the bridge/city reflection corridor.
    rubyMask[i] = Math.exp(-(((x - 32) / 54) ** 2)) * 0.7 + Math.exp(-(((x + 28) / 48) ** 2)) * 0.35;
  }
  geometry.setAttribute("color", new THREE.BufferAttribute(base.slice(), 3));
  const material = new THREE.MeshBasicMaterial({ vertexColors: true, fog: false, toneMapped: false });
  const mesh = new THREE.Mesh(geometry, material);
  const colorAttr = geometry.getAttribute("color") as THREE.BufferAttribute;
  const update = (time: number) => {
    const out = colorAttr.array as Float32Array;
    for (let i = 0; i < position.count; i++) {
      const wave = Math.pow(Math.max(0, Math.sin(time * 1.45 + phase[i])), 10) * 0.32 * depth[i];
      const ruby = rubyMask[i];
      out[i * 3] = base[i * 3] + wave * (0.88 + ruby * 0.28);
      out[i * 3 + 1] = base[i * 3 + 1] + wave * (0.68 - ruby * 0.38);
      out[i * 3 + 2] = base[i * 3 + 2] + wave * (0.34 + ruby * 0.08);
    }
    colorAttr.needsUpdate = true;
  };
  return { mesh, geometry, material, update };
}

// Opera-house-like shells: warmly uplit champagne sandstone against the night harbour.
function addShell(bag: Bag, detail: number, x: number, z: number, height: number, yaw: number, baseY: number) {
  const theta = 1.3, spread = 0.78;
  const radius = height / (1 - Math.cos(theta));
  const wSeg = detail === 0 ? 6 : detail === 1 ? 14 : 24, hSeg = detail === 0 ? 5 : detail === 1 ? 8 : 14;
  const g = new THREE.SphereGeometry(radius, wSeg, hSeg, Math.PI / 2 - spread / 2, spread, 0, theta);
  const colors = new Float32Array(g.getAttribute("position").count * 3);
  const top = haze("#f0e1c6", 0.16), bottom = haze("#98866c", 0.24), c = new THREE.Color();
  for (let iy = 0, i = 0; iy <= hSeg; iy++) for (let ix = 0; ix <= wSeg; ix++, i++) {
    c.copy(top).lerp(bottom, iy / hSeg);
    if (detail > 0 && ix % 2 === 1) c.multiplyScalar(0.92); // gore ribs
    colors.set([c.r, c.g, c.b], i * 3);
  }
  g.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  g.translate(0, -radius * Math.cos(theta), -radius * Math.sin(theta) * 0.5);
  g.rotateY(yaw);
  g.translate(x, baseY, z);
  bag.add(g, null);
}

function buildOpera(bag: Bag, glow: Bag, detail: number) {
  const sandstone = haze("#6b6052", 0.26), foyerGlow = new THREE.Color("#ebc278");
  const podiumTop = 6;
  bag.box([122, podiumTop, 108], [-5, podiumTop / 2 - 0.2, -18], sandstone);
  for (let s = 0; s < 3; s++) bag.box([90 - s * 8, 1.2, 12], [-10, 1.2 * s + 0.6, 40 - s * 5], haze("#5d5347", 0.28)); // broad steps
  const shells: Array<[number, number, number, number]> = [
    [-46, 0, 54, 0.05], [-27, -8, 47, -0.04], [-9, -16, 39, 0.06], [8, -24, 30, -0.05], // concert hall
    [-36, -40, 44, 0.03], [-17, -48, 37, -0.05], [1, -56, 29, 0.05], // opera theatre, behind
    [34, 8, 15, 0.1], [44, 14, 11, -0.08], // restaurant shells
  ];
  const count = detail === 0 ? 7 : shells.length;
  const used = detail === 0 ? [0, 1, 2, 3, 4, 5, 7] : shells.map((_, i) => i);
  for (const i of used.slice(0, count)) { const [x, z, h, yaw] = shells[i]; addShell(bag, detail, x, z, h, yaw, podiumTop); }
  if (detail > 0) {
    // Warm uplit glazed foyers under the shells.
    glow.box([44, 8, 0.6], [-30, podiumTop + 4, 28], foyerGlow);
    glow.box([30, 6, 0.6], [26, podiumTop + 3, 20], foyerGlow);
  }
}

function member(bag: Bag, p0: [number, number], p1: [number, number], z: number, thick: number, color: THREE.Color) {
  const len = Math.hypot(p1[0] - p0[0], p1[1] - p0[1]);
  bag.box([len, thick, thick], [(p0[0] + p1[0]) / 2, (p0[1] + p1[1]) / 2, z], color, Math.atan2(p1[1] - p0[1], p1[0] - p0[0]));
}

// Steel through-arch bridge: dark steel silhouette with gilt deck lights and ruby pylon beacons.
function buildBridge(bag: Bag, glow: Bag, detail: number, cx: number, cz: number) {
  const steel = haze("#2c3442", 0.32), deckColor = haze("#222731", 0.34), granite = haze("#5e574d", 0.34);
  const deckGlow = new THREE.Color("#e8c37a"), rubyBeacon = new THREE.Color("#d91e3e");
  const span = 100, deckY = 19, ribZ = 4.5;
  const lower = (x: number) => 7 + 33 * (1 - (x / (span / 2)) ** 2);
  const depth = (x: number) => 4 + 9 * (x / (span / 2)) ** 2;
  const panels = detail === 0 ? 14 : 24;
  const px = (x: number) => x + cx;
  bag.box([span + 24, 1.8, 9.5], [cx, deckY, cz], deckColor);
  bag.box([span + 24, 0.2, 8.4], [cx, deckY + 0.95, cz], haze("#1b1f27", 0.35));
  // Subtle golden roadway ribbon along the bridge span.
  glow.box([span + 18, 0.25, 0.35], [cx, deckY + 1.05, cz + ribZ + 0.2], deckGlow);
  for (const side of [-1, 1]) {
    const z = cz + side * ribZ;
    let prev: { x: number; lo: number; up: number } | null = null;
    for (let i = 0; i <= panels; i++) {
      const x = -span / 2 + (span * i) / panels;
      const lo = lower(x), up = lo + depth(x);
      if (prev) {
        member(bag, [px(prev.x), prev.lo], [px(x), lo], z, 1.3, steel);
        member(bag, [px(prev.x), prev.up], [px(x), up], z, 1.6, steel);
        if (detail >= 2) member(bag, [px(prev.x), i % 2 ? prev.lo : prev.up], [px(x), i % 2 ? up : lo], z, 0.5, steel);
      }
      if (detail >= 1 && i > 0 && i < panels) {
        // Hangers below the arch, or posts when the deck sits inside the truss.
        if (lo > deckY + 0.5) bag.box([0.45, lo - deckY, 0.45], [px(x), (lo + deckY) / 2, z], steel);
        else if (up < deckY - 0.5) bag.box([0.6, deckY - up, 0.6], [px(x), (up + deckY) / 2, z], steel);
        if (detail >= 2) bag.box([0.5, up - lo, 0.5], [px(x), (up + lo) / 2, z], steel);
      }
      prev = { x, lo, up };
    }
  }
  if (detail >= 1) for (let i = 2; i < panels - 1; i += detail >= 2 ? 1 : 3) {
    const x = -span / 2 + (span * i) / panels;
    bag.box([0.6, 0.6, ribZ * 2], [px(x), lower(x) + depth(x), cz], steel); // top lateral bracing
  }
  for (const end of [-1, 1]) for (const side of [-1, 1]) {
    const pylon = new THREE.CylinderGeometry(3.4, 4.8, 40, 4);
    pylon.rotateY(Math.PI / 4);
    pylon.translate(cx + end * (span / 2 + 2), 18.5, cz + side * 6.5);
    bag.add(pylon, granite);
    bag.box([5.4, 1.6, 5.4], [cx + end * (span / 2 + 2), 39, cz + side * 6.5], haze("#4f4940", 0.35));
    // Ruby aviation beacons at pylon summits.
    glow.box([1.1, 1.1, 1.1], [cx + end * (span / 2 + 2), 40.4, cz + side * 6.5], rubyBeacon);
  }
  if (detail >= 2) for (const x of [-58, -40, 40, 58]) bag.box([2.6, deckY + 3, 3], [px(x), (deckY - 3) / 2, cz], granite); // approach piers
}

function buildSkyline(bag: Bag, detail: number) {
  const rng = mulberry32(55);
  const tones = ["#141925", "#181e2c", "#1c2231", "#111621", "#202534"];
  const goldLight = new THREE.Color("#e8c37a");
  const amberLight = new THREE.Color("#c9a45c");
  const rubyLight = new THREE.Color("#d91e3e");
  const cluster = (x0: number, x1: number, z: number, hMin: number, hMax: number, step: number, amount: number) => {
    for (let x = x0; x < x1; x += step * (0.8 + rng() * 0.6)) {
      const w = step * (0.9 + rng() * 0.9), h = hMin + rng() * (hMax - hMin);
      const bz = z - rng() * 14;
      bag.box([w, h, 14 + rng() * 10], [x, h / 2 - 2, bz], haze(tones[Math.floor(rng() * tones.length)], amount));
      if (h > 26) {
        const crown = rng() < 0.35 ? rubyLight : goldLight;
        bag.box([w * 0.52, 0.9, 1.4], [x, h - 2.6, bz + 7.2], crown);
      }
      const bands = detail >= 1 ? 3 : 1;
      for (let b = 0; b < bands; b++) {
        if (rng() < 0.7) {
          const wy = h * (0.28 + b * 0.22);
          bag.box([w * 0.6, 0.95, 0.6], [x, wy, bz + 7.3], rng() < 0.6 ? goldLight : amberLight);
        }
      }
    }
  };
  cluster(40, 165, -275, 22, 74, 7, 0.42);
  cluster(-210, -95, -262, 12, 34, 9, 0.48);
  if (detail >= 1) cluster(165, 240, -245, 14, 40, 9, 0.46);
  // A slim observation tower among the distant blocks with golden/ruby crown rings.
  const mast = new THREE.CylinderGeometry(0.9, 1.6, 100, 8);
  mast.translate(112, 48, -272);
  bag.add(mast, haze("#262b38", 0.4));
  const pod = new THREE.CylinderGeometry(4.5, 3.2, 6, 10);
  pod.translate(112, 78, -272);
  bag.add(pod, goldLight);
  bag.box([2.2, 1.6, 2.2], [112, 98.5, -272], rubyLight);
}

function buildRidge(detail: number) {
  const steps = detail === 0 ? 64 : 120, a0 = -1.75, a1 = 1.75;
  const positions: number[] = [], colors: number[] = [], index: number[] = [];
  const top = haze("#121722", 0.38), bottom = haze("#0d1018", 0.6);
  for (let i = 0; i <= steps; i++) {
    const a = a0 + ((a1 - a0) * i) / steps;
    const taper = smooth(0, 0.12, i / steps) * smooth(0, 0.12, 1 - i / steps);
    const h = (6 + 3.2 * Math.sin(a * 7 + 1) + 2.2 * Math.sin(a * 17) + 1.2 * Math.sin(a * 41 + 2)) * taper + 0.4;
    const x = RIDGE_RADIUS * Math.sin(a), z = -RIDGE_RADIUS * Math.cos(a);
    positions.push(x, layout.harbour.waterY + h, z, x, layout.harbour.waterY - 1.5, z);
    colors.push(top.r, top.g, top.b, bottom.r, bottom.g, bottom.b);
    if (i < steps) index.push(i * 2, i * 2 + 1, i * 2 + 2, i * 2 + 1, i * 2 + 3, i * 2 + 2);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
  geometry.setIndex(index);
  const material = new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.DoubleSide, fog: false, toneMapped: false });
  return { mesh: new THREE.Mesh(geometry, material), geometry, material };
}

/**
 * Stylised nocturnal Sydney harbour backdrop: night sky dome, seeded stars, calm water with
 * gold/ruby reflections, uplit opera shells, steel arch bridge with beacons, skyline lights and far shore.
 * Everything is `fog: false` with haze baked into the colours, so `scene.fog` cannot erase it.
 * Requires `camera.far >= landmarkFarClip` (420). Draw calls: sky, stars, ridge, water, lit landmarks, flat skyline/beacons = 6.
 */
export function Landmarks() {
  const { scheduler, quality } = useSceneClock();
  const invalidate = useThree((state) => state.invalidate);
  const holder = useRef<THREE.Group>(null);

  useEffect(() => {
    const parent = holder.current;
    if (!parent) return;
    const detail = quality.landmarkDetail;
    const disposables: Array<{ dispose: () => void }> = [];
    const track = <T extends { geometry: THREE.BufferGeometry; material: THREE.Material; mesh: THREE.Object3D }>(part: T) => {
      parent.add(part.mesh);
      disposables.push(part.geometry, part.material);
      return part;
    };
    track(buildSky(detail));
    track(buildStars(detail));
    track(buildRidge(detail));
    const water = track(buildWater(detail));

    const lit = createBag();
    const flat = createBag();
    lit.setOrigin(...OPERA_AT, .68);
    flat.setOrigin(...OPERA_AT, .68);
    buildOpera(lit, flat, detail);
    lit.setOrigin(48, 0, -175, 1.2);
    flat.setOrigin(48, 0, -175, 1.2);
    buildBridge(lit, flat, detail, 0, 0);
    lit.setOrigin(0, 0, 0);
    flat.setOrigin(0, 0, 0);
    lit.box([800, 2.3, 1.2], [0, -1.17, layout.harbour.waterZ - 0.4], haze("#181a20", 0.25)); // sea wall under the quay edge
    buildSkyline(flat, detail);
    const litGeometry = lit.build(), flatGeometry = flat.build();
    if (litGeometry) {
      const material = new THREE.MeshLambertMaterial({ vertexColors: true, side: THREE.DoubleSide, fog: false });
      parent.add(new THREE.Mesh(litGeometry, material));
      disposables.push(litGeometry, material);
    }
    if (flatGeometry) {
      const material = new THREE.MeshBasicMaterial({ vertexColors: true, fog: false, toneMapped: false });
      parent.add(new THREE.Mesh(flatGeometry, material));
      disposables.push(flatGeometry, material);
    }
    lit.dispose(); flat.dispose();
    water.update(scheduler.time);
    invalidate();
    const stop = detail > 0 ? scheduler.add("landmarks-water", (_dt, time) => water.update(time), 0.15) : () => {};
    return () => {
      stop();
      parent.clear();
      for (const item of disposables) item.dispose();
    };
  }, [scheduler, quality.landmarkDetail, invalidate]);

  return <group ref={holder} />;
}
