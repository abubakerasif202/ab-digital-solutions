"use client";

import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { BODY, clamp, jointEuler } from "../sim/humanoid-pose";
import type { Pose } from "../sim/humanoid-pose";
import { createShadowGeometry, createShadowMaterial } from "../contact-shadow";

export * from "../sim/humanoid-pose";

export type HairStyle = "bun" | "ponytail" | "short" | "long";
export type Appearance = {
  skin: string; hair: string; hairStyle: HairStyle; top: string; sleeve: string; forearm: string; trousers: string; shoes: string;
  lips: string; blouse?: string; height: number; build?: number;
};
// Studio palette: ruby #792c40, charcoal #22272a, brass #bca06b, warm marble and cream.
export const CAST = {
  receptionist: { skin: "#e6b999", hair: "#2a1a17", hairStyle: "bun", top: "#792c40", sleeve: "#792c40", forearm: "#792c40", trousers: "#22272a", shoes: "#14181a", lips: "#8a3340", blouse: "#eadfc8", height: 1 },
  designer: { skin: "#c58f68", hair: "#1b1514", hairStyle: "short", top: "#2d3438", sleeve: "#2d3438", forearm: "#2d3438", trousers: "#3a3f43", shoes: "#e5dcc8", lips: "#8f5448", height: 1.03 },
  developer: { skin: "#f0cfae", hair: "#5a3b26", hairStyle: "short", top: "#a88a55", sleeve: "#a88a55", forearm: "#f0cfae", trousers: "#22272a", shoes: "#14181a", lips: "#9a5b50", height: 1.06, build: 1.06 },
  walker: { skin: "#8d5a3b", hair: "#150f0e", hairStyle: "ponytail", top: "#22272a", sleeve: "#22272a", forearm: "#22272a", trousers: "#1a1e20", shoes: "#bca06b", lips: "#7a3a36", blouse: "#bca06b", height: 0.98 },
} satisfies Record<string, Appearance>;

// Facial anchors in head-bone space (metres). The skull is an ellipsoid of radii 0.092 x 0.115 x 0.1
// centred on BODY.headCenterY; every feature below sits on that surface, so nothing floats or sinks.
// The blink test locates the eyes by FACE.eyeZ, so no other bone may share that depth.
const FACE = { eyeX: 0.034, eyeY: 0.012, eyeZ: 0.086, browY: 0.037, browZ: 0.0885, browLift: 0.009, noseY: -0.014, mouthY: -0.05, mouthZ: 0.088 } as const;
/** Scalp cap per style: polar extent from the crown and backward tilt. Both give a hairline 50 degrees from the crown. */
const SCALP = { short: { tilt: -0.5 }, long: { tilt: -0.62 } } as const;

type Kit = {
  mat: (color: string, roughness?: number, metalness?: number) => THREE.MeshStandardMaterial;
  geo: Record<"capsule" | "sphere" | "head" | "box" | "torso" | "foot" | "mouth" | "eyes" | "eyeShine" | "brows" | "hairCap" | "hairCapShort" | "shadow", THREE.BufferGeometry>;
  shadowMaterial: THREE.MeshBasicMaterial;
  track: (resource: { dispose: () => void }) => void;
  dispose: () => void;
};

/** One kit is shared by every figure a component renders: unit geometries plus a colour-keyed material cache. */
export function createHumanoidKit(): Kit {
  const materials = new Map<string, THREE.MeshStandardMaterial>();
  const resources: Array<{ dispose: () => void }> = [];
  const torsoProfile: [number, number][] = [[0, -0.075], [0.11, -0.07], [0.122, -0.02], [0.118, 0.05], [0.13, 0.13], [0.15, 0.24], [0.165, 0.33], [0.158, 0.395], [0.12, 0.435], [0.05, 0.462], [0, 0.47]];
  const pair = (make: (side: 1 | -1) => THREE.BufferGeometry) => {
    const parts = [make(-1), make(1)], merged = mergeGeometries(parts)!;
    parts.forEach((part) => part.dispose());
    return merged;
  };
  const geo = {
    capsule: new THREE.CapsuleGeometry(0.5, 1, 6, 14),
    sphere: new THREE.SphereGeometry(1, 16, 12),
    head: new THREE.SphereGeometry(1, 28, 20),
    box: new THREE.BoxGeometry(1, 1, 1),
    torso: new THREE.LatheGeometry(torsoProfile.map(([r, y]) => new THREE.Vector2(r, y)), 28),
    foot: new THREE.CapsuleGeometry(0.5, 1, 4, 10).rotateX(Math.PI / 2),
    mouth: new THREE.TorusGeometry(1, 0.18, 6, 16, Math.PI).rotateZ(Math.PI),
    eyes: pair((side) => new THREE.SphereGeometry(1, 12, 8).scale(0.0105, 0.014, 0.008).translate(side * FACE.eyeX, 0, 0)),
    // Catchlights sit up and to the character's left of each pupil and blink with the eyes.
    eyeShine: pair((side) => new THREE.SphereGeometry(1, 6, 4).scale(0.0032, 0.0032, 0.002).translate(side * FACE.eyeX + 0.0035, 0.0052, 0.0072)),
    brows: pair((side) => new THREE.BoxGeometry(0.03, 0.0052, 0.006).rotateZ(side * -0.13).translate(side * (FACE.eyeX + 0.002), 0, 0)),
    hairCap: new THREE.SphereGeometry(1, 28, 12, 0, Math.PI * 2, 0, 1.5),
    hairCapShort: new THREE.SphereGeometry(1, 28, 12, 0, Math.PI * 2, 0, 1.38),
    shadow: createShadowGeometry(),
  };
  const shadowMaterial = createShadowMaterial();
  return {
    geo,
    shadowMaterial,
    track(resource) { resources.push(resource); },
    mat(color, roughness = 0.8, metalness = 0.02) {
      const key = `${color}|${roughness}|${metalness}`;
      let m = materials.get(key);
      if (!m) { m = new THREE.MeshStandardMaterial({ color, roughness, metalness }); materials.set(key, m); }
      return m;
    },
    dispose() {
      for (const resource of resources) resource.dispose();
      resources.length = 0;
      for (const g of Object.values(geo)) g.dispose();
      for (const m of materials.values()) m.dispose();
      materials.clear();
      shadowMaterial.dispose();
    },
  };
}

export type HumanoidRig = {
  root: THREE.Group;
  /** Contact shadow on the floor under the figure. A sibling of `root`, so the figure stays one skinned mesh. */
  shadow: THREE.Mesh;
  apply: (pose: Pose) => void;
};
export type HumanoidOptions = { /** Shadow radius in metres before height scaling. Seated figures use a wider one to clear the chair base. */ shadowRadius?: number };

export function createHumanoid(kit: Kit, a: Appearance, { shadowRadius = 0.36 }: HumanoidOptions = {}): HumanoidRig {
  const { geo } = kit;
  const build = a.build ?? 1;
  const skin = kit.mat(a.skin, 0.55), hair = kit.mat(a.hair, 0.55, 0.05), top = kit.mat(a.top, 0.82), sleeve = kit.mat(a.sleeve, 0.82), fore = kit.mat(a.forearm, a.forearm === a.skin ? 0.55 : 0.82);
  const trousers = kit.mat(a.trousers, 0.85), shoes = kit.mat(a.shoes, 0.5, 0.05), dark = kit.mat("#1b1412", 0.4), lips = kit.mat(a.lips, 0.45), shine = kit.mat("#fff8ea", 0.3);
  const bones: THREE.Bone[] = [];
  const parts: Array<{ bone: THREE.Bone; geometry: THREE.BufferGeometry; color: THREE.Color }> = [];
  const group = (parent: THREE.Object3D, x = 0, y = 0, z = 0, order: THREE.EulerOrder = "XYZ") => {
    const g = new THREE.Bone(); g.position.set(x, y, z); g.rotation.order = order; parent.add(g); bones.push(g); return g;
  };
  const mesh = (parent: THREE.Object3D, g: THREE.BufferGeometry, m: THREE.MeshStandardMaterial, scale: [number, number, number], pos: [number, number, number] = [0, 0, 0], rotation: [number, number, number] = [0, 0, 0]) => {
    const o = group(parent, ...pos); o.scale.set(...scale); o.rotation.set(...rotation);
    parts.push({ bone: o, geometry: g, color: m.color });
    return o;
  };
  // Capsule spanning joint to joint, overlapping each joint by its radius so bends stay closed.
  const limb = (parent: THREE.Object3D, m: THREE.MeshStandardMaterial, radius: number, length: number) =>
    mesh(parent, geo.capsule, m, [radius * 2, (length + 2 * radius) / 2, radius * 2], [0, -length / 2, 0]);

  const root = new THREE.Group();
  root.scale.setScalar(a.height);
  const hips = group(root, 0, BODY.hipY, 0, "YXZ");
  mesh(hips, geo.sphere, trousers, [0.15 * build, 0.105, 0.098], [0, 0, 0]);
  const spine = group(hips, 0, BODY.spineY, 0, "YXZ");
  mesh(spine, geo.torso, top, [1.28 * build, 1, 0.74]);
  // Shirt front: a shallow lens set into the chest reads as an open jacket, leaning back with the sternum.
  if (a.blouse) mesh(spine, geo.sphere, kit.mat(a.blouse, 0.7), [0.05 * build, 0.11, 0.034], [0, 0.33, 0.098], [-0.1, 0, 0]);
  const neck = group(spine, 0, BODY.neckY, 0, "YXZ");
  mesh(neck, geo.capsule, skin, [0.085, 0.07, 0.085], [0, 0.035, 0]);
  // Collar band closes the gap between the neck and the garment on every figure.
  mesh(spine, geo.sphere, a.blouse ? kit.mat(a.blouse, 0.7) : top, [0.062, 0.022, 0.058], [0, BODY.neckY + 0.012, 0.002]);
  const head = group(neck, 0, BODY.headY, 0, "YXZ");
  const cy = BODY.headCenterY;
  mesh(head, geo.head, skin, [0.092, 0.115, 0.1], [0, cy, 0]);
  mesh(head, geo.sphere, skin, [0.012, 0.015, 0.016], [0, cy + FACE.noseY, 0.097]); // nose
  for (const m of [1, -1]) mesh(head, geo.sphere, skin, [0.011, 0.021, 0.014], [m * 0.0905, cy - 0.004, -0.002]); // ears
  const eyes = mesh(head, geo.eyes, dark, [1, 1, 1], [0, cy + FACE.eyeY, FACE.eyeZ]);
  mesh(eyes, geo.eyeShine, shine, [1, 1, 1]);
  const brows = mesh(head, geo.brows, hair, [1, 1, 1], [0, cy + FACE.browY, FACE.browZ]);
  const mouth = mesh(head, geo.mouth, lips, [0.016, 0.01, 0.01], [0, cy + FACE.mouthY, FACE.mouthZ]);
  // Hair: a scalp cap tilted back to leave a clear forehead, a fringe that gives the hairline volume, then the style piece.
  const short = a.hairStyle === "short";
  mesh(head, short ? geo.hairCapShort : geo.hairCap, hair, [0.0985, 0.1225, 0.1065], [0, cy + 0.004, -0.006], [(short ? SCALP.short : SCALP.long).tilt, 0, 0]);
  if (short) mesh(head, geo.sphere, hair, [0.072, 0.03, 0.05], [0.006, cy + 0.099, 0.04], [0.3, 0, -0.08]); // brushed-up front
  else mesh(head, geo.sphere, hair, [0.078, 0.027, 0.042], [0.014, cy + 0.09, 0.052], [0.42, 0, -0.2]); // side-swept fringe
  if (a.hairStyle === "bun") mesh(head, geo.sphere, hair, [0.046, 0.042, 0.046], [0, cy + 0.1, -0.074]);
  if (a.hairStyle === "ponytail") {
    mesh(head, geo.sphere, hair, [0.03, 0.028, 0.03], [0, cy + 0.03, -0.108]); // tie
    mesh(head, geo.capsule, hair, [0.05, 0.2, 0.05], [0, cy - 0.03, -0.128], [-0.35, 0, 0]);
  }
  if (a.hairStyle === "long") mesh(head, geo.sphere, hair, [0.1, 0.16, 0.07], [0, cy - 0.06, -0.05]);

  const sides = {} as Record<"l" | "r", { shoulder: THREE.Bone; elbow: THREE.Bone; wrist: THREE.Bone; hip: THREE.Bone; knee: THREE.Bone; ankle: THREE.Bone }>;
  for (const s of ["l", "r"] as const) {
    const m = s === "l" ? 1 : -1;
    const shoulder = group(spine, m * BODY.shoulderX, BODY.shoulderY, 0);
    mesh(shoulder, geo.sphere, sleeve, [0.046, 0.045, 0.046]); // rounds the shoulder and keeps a raised arm attached
    limb(shoulder, sleeve, 0.043, BODY.upperArm);
    const elbow = group(shoulder, 0, -BODY.upperArm, 0);
    limb(elbow, fore, 0.036, BODY.foreArm);
    const wrist = group(elbow, 0, -BODY.foreArm, 0);
    mesh(wrist, geo.sphere, skin, [0.032, 0.05, 0.022], [0, -0.042, 0]);
    mesh(wrist, geo.sphere, skin, [0.011, 0.024, 0.012], [0, -0.03, 0.022], [0.5, 0, 0]); // thumb, forward of the palm
    const hip = group(hips, m * BODY.hipX, 0, 0);
    limb(hip, trousers, 0.074, BODY.thigh);
    const knee = group(hip, 0, -BODY.thigh, 0);
    limb(knee, trousers, 0.052, BODY.shin);
    const ankle = group(knee, 0, -BODY.shin, 0);
    mesh(ankle, geo.foot, shoes, [0.1, 0.075, 0.16], [0, -0.035, 0.04]);
    sides[s] = { shoulder, elbow, wrist, hip, knee, ankle };
  }

  // Rigid skinning batches the original articulated parts without changing their joint hierarchy.
  // Geometry lives in root-local bind space; one nonzero weight preserves each part exactly.
  root.updateMatrixWorld(true);
  const inverseRoot = root.matrixWorld.clone().invert();
  const transform = new THREE.Matrix4();
  const chunks = parts.map(({ bone, geometry, color }) => {
    const chunk = geometry.index ? geometry.toNonIndexed() : geometry.clone();
    transform.multiplyMatrices(inverseRoot, bone.matrixWorld);
    chunk.applyMatrix4(transform);
    chunk.deleteAttribute("uv");
    const count = chunk.getAttribute("position").count;
    const colors = new Float32Array(count * 3);
    const indices = new Uint16Array(count * 4);
    const weights = new Float32Array(count * 4);
    const boneIndex = bones.indexOf(bone);
    for (let i = 0; i < count; i++) {
      colors.set([color.r, color.g, color.b], i * 3);
      indices[i * 4] = boneIndex;
      weights[i * 4] = 1;
    }
    chunk.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    chunk.setAttribute("skinIndex", new THREE.Uint16BufferAttribute(indices, 4));
    chunk.setAttribute("skinWeight", new THREE.Float32BufferAttribute(weights, 4));
    return chunk;
  });
  const geometry = mergeGeometries(chunks)!;
  chunks.forEach(chunk => chunk.dispose());
  const material = kit.mat("#ffffff", 0.75, 0.02);
  material.vertexColors = true;
  const figure = new THREE.SkinnedMesh(geometry, material);
  const skeleton = new THREE.Skeleton(bones);
  root.add(figure);
  root.updateMatrixWorld(true);
  figure.bind(skeleton);
  // All supported poses fit inside this local envelope, including raised arms and seated legs.
  // Avoid per-frame vertex scans while retaining camera-frustum culling.
  figure.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 1, 0), 3);
  kit.track(geometry);
  kit.track(skeleton);

  const shadow = new THREE.Mesh(geo.shadow, kit.shadowMaterial);
  shadow.scale.setScalar(shadowRadius * a.height);
  shadow.renderOrder = 1;

  const apply = (p: Pose) => {
    root.position.set(p.rootX, p.rootLift, p.rootZ);
    root.rotation.y = p.rootYaw;
    // A few millimetres above the floor the figure stands on; polygon offset settles the rest.
    shadow.position.set(p.rootX, p.rootLift + 0.006, p.rootZ);
    hips.position.y = BODY.hipY + p.rootY;
    const set = (g: THREE.Object3D, e: [number, number, number]) => g.rotation.set(e[0], e[1], e[2]);
    set(hips, jointEuler.hips(p)); set(spine, jointEuler.spine(p)); set(neck, jointEuler.neck(p)); set(head, jointEuler.head(p));
    for (const s of ["l", "r"] as const) {
      const m = s === "l" ? 1 : -1, j = sides[s];
      set(j.shoulder, jointEuler.shoulder(p, s));
      j.elbow.rotation.x = -p[`${s}Elbow`];
      j.wrist.rotation.set(-p[`${s}WristPitch`], 0, m * p[`${s}WristYaw`]);
      set(j.hip, jointEuler.hip(p, s));
      j.knee.rotation.x = p[`${s}Knee`];
      j.ankle.rotation.x = p[`${s}Ankle`];
    }
    eyes.scale.y = 1 - 0.92 * clamp(p.blink, 0, 1);
    brows.position.y = cy + FACE.browY + FACE.browLift * clamp(p.brow, -1, 1);
    const smile = clamp(p.smile, 0, 1);
    mouth.scale.set(0.014 + 0.009 * smile, 0.0075 + 0.013 * smile, 0.01);
    mouth.position.y = cy + FACE.mouthY + 0.004 * smile;
  };
  return { root, shadow, apply };
}
