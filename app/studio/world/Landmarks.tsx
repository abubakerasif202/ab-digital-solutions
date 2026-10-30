"use client";

import { useEffect, useRef } from "react";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { useSceneClock } from "./SceneClock";
import { layout } from "./world-layout";
import { mulberry32 } from "./sim/rng";

/** Warm haze colour for `scene.fog` and the horizon. Landmarks bake their own haze and ignore fog. */
export const skyFog = "#cdbd9f";
/** Camera `far` must be at least this for the dome and the farthest backdrop to render. */
export const landmarkFarClip = 420;

const SKY_RADIUS = 340;
const RIDGE_RADIUS = 312;
const OPERA_AT: [number, number, number] = [-35, 0, -150]; // leave both landmark silhouettes inside the portrait opening
const HAZE = new THREE.Color(skyFog);
const haze = (hex: string, amount: number) => new THREE.Color(hex).lerp(HAZE, amount);
const smooth = (a: number, b: number, x: number) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

// Stylised backdrop only: nothing here claims to be the studio's real location.
type Bag = ReturnType<typeof createBag>;
function createBag() {
  const list: THREE.BufferGeometry[] = [];
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
        const colors = new Float32Array(count * 3);
        for (let i = 0; i < count; i++) { colors[i * 3] = color.r; colors[i * 3 + 1] = color.g; colors[i * 3 + 2] = color.b; }
        g.setAttribute("color", new THREE.BufferAttribute(colors, 3));
      }
      list.push(g);
    },
    box(size: [number, number, number], pos: [number, number, number], color: THREE.Color, rotZ = 0) {
      const g = new THREE.BoxGeometry(...size);
      if (rotZ) g.rotateZ(rotZ);
      g.translate(...pos);
      this.add(g, color);
    },
    build() { return list.length ? mergeGeometries(list) : null; },
    dispose() { list.forEach((g) => g.dispose()); list.length = 0; },
  };
}

function buildSky() {
  const geometry = new THREE.SphereGeometry(SKY_RADIUS, 48, 40);
  const stops: Array<[number, THREE.Color]> = [
    [-1, new THREE.Color(skyFog)], [-0.05, new THREE.Color("#d3c3a2")], [0, new THREE.Color("#f0d4a4")], [0.08, new THREE.Color("#e9cfae")],
    [0.22, new THREE.Color("#b8cbd6")], [0.5, new THREE.Color("#86abc9")], [1, new THREE.Color("#4f7fae")],
  ];
  const glow = new THREE.Color("#ffb36b");
  const sun = new THREE.Vector3(0.28, 0.1, 0.96).normalize();
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
    color.lerp(glow, Math.pow(Math.max(0, dir.dot(sun)), 6) * 0.3 * (1 - smooth(0, 0.45, dir.y)));
    colors.set([color.r, color.g, color.b], i * 3);
  }
  geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  const material = new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide, fog: false, depthWrite: false, toneMapped: false });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.renderOrder = -1000;
  mesh.frustumCulled = false;
  return { mesh, geometry, material };
}

// Calm harbour: a hazed teal gradient with soft glints driven by a cheap per-vertex colour update.
function buildWater(detail: number) {
  const nx = detail >= 2 ? 72 : 48, nz = detail >= 2 ? 36 : 24;
  const geometry = new THREE.PlaneGeometry(660, 290, nx, nz);
  geometry.rotateX(-Math.PI / 2);
  geometry.translate(0, layout.harbour.waterY, layout.harbour.waterZ - 145);
  const position = geometry.getAttribute("position");
  const base = new Float32Array(position.count * 3);
  const phase = new Float32Array(position.count);
  const depth = new Float32Array(position.count);
  const rng = mulberry32(2024);
  const near = new THREE.Color("#1f4f58"), far = new THREE.Color("#c9b98f"), color = new THREE.Color();
  for (let i = 0; i < position.count; i++) {
    let x = position.getX(i), z = position.getZ(i);
    const r = Math.hypot(x, z);
    if (r > RIDGE_RADIUS) { x *= RIDGE_RADIUS / r; z *= RIDGE_RADIUS / r; position.setXYZ(i, x, position.getY(i), z); }
    const d = Math.hypot(x, z - 30);
    const t = Math.pow(Math.min(1, d / 300), 1.3);
    color.copy(near).lerp(far, t);
    base.set([color.r, color.g, color.b], i * 3);
    phase[i] = rng() * 6.28;
    depth[i] = smooth(60, 200, d);
  }
  geometry.setAttribute("color", new THREE.BufferAttribute(base.slice(), 3));
  const material = new THREE.MeshBasicMaterial({ vertexColors: true, fog: false, toneMapped: false });
  const mesh = new THREE.Mesh(geometry, material);
  const colorAttr = geometry.getAttribute("color") as THREE.BufferAttribute;
  const update = (time: number) => {
    const out = colorAttr.array as Float32Array;
    for (let i = 0; i < position.count; i++) {
      const glint = Math.pow(Math.max(0, Math.sin(time * 1.6 + phase[i])), 12) * 0.34 * depth[i];
      out[i * 3] = base[i * 3] + glint; out[i * 3 + 1] = base[i * 3 + 1] + glint * 0.93; out[i * 3 + 2] = base[i * 3 + 2] + glint * 0.7;
    }
    colorAttr.needsUpdate = true;
  };
  return { mesh, geometry, material, update };
}

// Opera-house-like white shells: spherical lunes (partial spheres) with apexes leaning back.
function addShell(bag: Bag, detail: number, x: number, z: number, height: number, yaw: number, baseY: number) {
  const theta = 1.3, spread = 0.78;
  const radius = height / (1 - Math.cos(theta));
  const wSeg = detail === 0 ? 6 : detail === 1 ? 14 : 24, hSeg = detail === 0 ? 5 : detail === 1 ? 8 : 14;
  const g = new THREE.SphereGeometry(radius, wSeg, hSeg, Math.PI / 2 - spread / 2, spread, 0, theta);
  const colors = new Float32Array(g.getAttribute("position").count * 3);
  const top = haze("#fbf6ea", 0.22), bottom = haze("#e7d9bf", 0.26), c = new THREE.Color();
  for (let iy = 0, i = 0; iy <= hSeg; iy++) for (let ix = 0; ix <= wSeg; ix++, i++) {
    c.copy(top).lerp(bottom, iy / hSeg);
    if (detail > 0 && ix % 2 === 1) c.multiplyScalar(0.94); // gore ribs
    colors.set([c.r, c.g, c.b], i * 3);
  }
  g.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  g.translate(0, -radius * Math.cos(theta), -radius * Math.sin(theta) * 0.5);
  g.rotateY(yaw);
  g.translate(x, baseY, z);
  bag.add(g, null);
}

function buildOpera(bag: Bag, detail: number) {
  const sandstone = haze("#d8c9ab", 0.28), glass = haze("#3c5460", 0.3);
  const podiumTop = 6;
  bag.box([122, podiumTop, 108], [-5, podiumTop / 2 - 0.2, -18], sandstone);
  for (let s = 0; s < 3; s++) bag.box([90 - s * 8, 1.2, 12], [-10, 1.2 * s + 0.6, 40 - s * 5], haze("#cdbd9e", 0.3)); // broad steps
  const shells: Array<[number, number, number, number]> = [
    [-46, 0, 54, 0.05], [-27, -8, 47, -0.04], [-9, -16, 39, 0.06], [8, -24, 30, -0.05], // concert hall
    [-36, -40, 44, 0.03], [-17, -48, 37, -0.05], [1, -56, 29, 0.05], // opera theatre, behind
    [34, 8, 15, 0.1], [44, 14, 11, -0.08], // restaurant shells
  ];
  const count = detail === 0 ? 7 : shells.length;
  const used = detail === 0 ? [0, 1, 2, 3, 4, 5, 7] : shells.map((_, i) => i);
  for (const i of used.slice(0, count)) { const [x, z, h, yaw] = shells[i]; addShell(bag, detail, x, z, h, yaw, podiumTop); }
  if (detail > 0) {
    // Glazed end walls under the shells.
    bag.box([44, 8, 0.6], [-30, podiumTop + 4, 28], glass);
    bag.box([30, 6, 0.6], [26, podiumTop + 3, 20], glass);
  }
}

function member(bag: Bag, p0: [number, number], p1: [number, number], z: number, thick: number, color: THREE.Color) {
  const len = Math.hypot(p1[0] - p0[0], p1[1] - p0[1]);
  bag.box([len, thick, thick], [(p0[0] + p1[0]) / 2, (p0[1] + p1[1]) / 2, z], color, Math.atan2(p1[1] - p0[1], p1[0] - p0[0]));
}

// Steel through-arch bridge: twin ribs, a deck, hangers, and four stone pylons.
function buildBridge(bag: Bag, detail: number, cx: number, cz: number) {
  const steel = haze("#6f7780", 0.42), deckColor = haze("#575b62", 0.42), granite = haze("#a99c85", 0.4);
  const span = 100, deckY = 19, ribZ = 4.5;
  const lower = (x: number) => 7 + 33 * (1 - (x / (span / 2)) ** 2);
  const depth = (x: number) => 4 + 9 * (x / (span / 2)) ** 2;
  const panels = detail === 0 ? 14 : 24;
  const px = (x: number) => x + cx;
  bag.box([span + 24, 1.8, 9.5], [cx, deckY, cz], deckColor);
  bag.box([span + 24, 0.2, 8.4], [cx, deckY + 0.95, cz], haze("#4a4d52", 0.4));
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
    bag.box([5.4, 1.6, 5.4], [cx + end * (span / 2 + 2), 39, cz + side * 6.5], haze("#8f826b", 0.4));
  }
  if (detail >= 2) for (const x of [-58, -40, 40, 58]) bag.box([2.6, deckY + 3, 3], [px(x), (deckY - 3) / 2, cz], granite); // approach piers
}

function buildSkyline(bag: Bag, detail: number) {
  const rng = mulberry32(55);
  const tones = ["#8f9aa6", "#9aa3ac", "#a5a8a8", "#868f9b", "#a9a9a1"];
  const cluster = (x0: number, x1: number, z: number, hMin: number, hMax: number, step: number, amount: number) => {
    for (let x = x0; x < x1; x += step * (0.8 + rng() * 0.6)) {
      const w = step * (0.9 + rng() * 0.9), h = hMin + rng() * (hMax - hMin);
      bag.box([w, h, 14 + rng() * 10], [x, h / 2 - 2, z - rng() * 14], haze(tones[Math.floor(rng() * tones.length)], amount));
    }
  };
  cluster(40, 165, -275, 22, 74, 7, 0.55);
  cluster(-210, -95, -262, 12, 34, 9, 0.62);
  if (detail >= 1) cluster(165, 240, -245, 14, 40, 9, 0.6);
  // A slim observation tower among the distant blocks.
  const mast = new THREE.CylinderGeometry(0.9, 1.6, 100, 8);
  mast.translate(112, 48, -272);
  bag.add(mast, haze("#a79f8c", 0.5));
  const pod = new THREE.CylinderGeometry(4.5, 3.2, 6, 10);
  pod.translate(112, 78, -272);
  bag.add(pod, haze("#b9a77c", 0.5));
}

function buildRidge() {
  const steps = 120, a0 = -1.75, a1 = 1.75;
  const positions: number[] = [], colors: number[] = [], index: number[] = [];
  const top = haze("#8a9486", 0.55), bottom = haze("#a9a894", 0.7);
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
 * Stylised harbour backdrop: sky dome, calm water, white-shell opera building, steel arch bridge,
 * distant towers and a hazy far shore. Everything is `fog: false` with haze baked into the colours,
 * so a short `scene.fog` cannot erase it. Requires `camera.far >= landmarkFarClip` (420).
 * Draw calls: sky, water, ridge, lit landmarks, flat skyline = 5.
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
    const track = <T extends { geometry: THREE.BufferGeometry; material: THREE.Material; mesh: THREE.Mesh }>(part: T) => {
      parent.add(part.mesh);
      disposables.push(part.geometry, part.material);
      return part;
    };
    track(buildSky());
    track(buildRidge());
    const water = track(buildWater(detail));

    const lit = createBag();
    lit.setOrigin(...OPERA_AT, .68);
    buildOpera(lit, detail);
    lit.setOrigin(48, 0, -175, 1.2);
    buildBridge(lit, detail, 0, 0);
    lit.setOrigin(0, 0, 0);
    lit.box([800, 2.3, 1.2], [0, -1.17, layout.harbour.waterZ - 0.4], haze("#8b8574", 0.2)); // sea wall under the quay edge
    const flat = createBag();
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
