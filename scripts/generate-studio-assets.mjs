// Original low-poly AB sculpture. Geometry follows the repository's canonical
// public/brand/ab-monogram.svg; no external models, textures or fonts.
import * as THREE from "three";
import { GLTFExporter } from "three/addons/exporters/GLTFExporter.js";
import { mkdir, writeFile } from "node:fs/promises";

// GLTFExporter uses the browser FileReader API, implemented here for Node blobs.
globalThis.FileReader = class {
  readAsArrayBuffer(blob) { blob.arrayBuffer().then((result) => { this.result = result; this.onloadend?.(); }); }
};
const a = new THREE.Shape();
a.moveTo(4,52); a.lineTo(19,12); a.lineTo(27,12); a.lineTo(42,52); a.lineTo(33,52); a.lineTo(30,43); a.lineTo(15,43); a.lineTo(12,52); a.closePath();
const ah = new THREE.Path(); ah.moveTo(18,35); ah.lineTo(27,35); ah.lineTo(22.5,22); ah.closePath(); a.holes.push(ah);
const b = new THREE.Shape(); b.moveTo(44,12); b.lineTo(58,12); b.bezierCurveTo(67,12,72,16,72,23); b.bezierCurveTo(72,27,70,30,67,32); b.bezierCurveTo(71,34,73,37,73,41); b.bezierCurveTo(73,48,68,52,58,52); b.lineTo(44,52); b.closePath();
const bh = new THREE.Path(); bh.moveTo(52,20); bh.lineTo(52,29); bh.lineTo(58,29); bh.bezierCurveTo(62,29,64,27,64,24); bh.bezierCurveTo(64,21,62,20,58,20); bh.closePath(); b.holes.push(bh);
const bh2 = new THREE.Path(); bh2.moveTo(52,37); bh2.lineTo(52,44); bh2.lineTo(58,44); bh2.bezierCurveTo(63,44,65,43,65,40); bh2.bezierCurveTo(65,37,63,37,58,37); bh2.closePath(); b.holes.push(bh2);
const slash = new THREE.Shape(); slash.moveTo(34,54); slash.lineTo(47,10); slash.lineTo(51,10); slash.lineTo(38,54); slash.closePath();
const sculpture = new THREE.Group(); sculpture.name = "AB-original-monogram";
for (const [shape, color] of [[a, "#d1a64c"], [b, "#d1a64c"], [slash, "#80182c"]]) {
  const geometry = new THREE.ExtrudeGeometry(shape, { depth: 4, bevelEnabled: true, bevelSize: 0.45, bevelThickness: 0.45, bevelSegments: 1, curveSegments: 6 });
  geometry.translate(-38.5,-32,-2); geometry.scale(0.045,-0.045,0.045);
  const mesh = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({ color, metalness: 0.78, roughness: 0.24 }));
  sculpture.add(mesh);
}
const screensOnly = process.argv.includes("--screens");
await mkdir("public/studio", { recursive: true });
if (!screensOnly) {
  const glb = await new GLTFExporter().parseAsync(sculpture, { binary: true });
  await writeFile("public/studio/ab-monogram.glb", Buffer.from(glb));
  console.log(`Original monogram: ${glb.byteLength} bytes`);
}

// GPU-sized derivatives of every canonical project screenshot, cropped to the gallery frame's 3.4 x 2.33 aspect.
// The detail frame is at most 1536px and never larger than the source. --screens skips the GLB.
// Resolve the same extensionless TS imports used by the repository's tests.
const { register } = await import("node:module");
register("../tests/ts-hooks.mjs", import.meta.url);
const { projects } = await import("../app/project-data.ts");
const { default: sharp } = await import("sharp");
await mkdir("public/studio/screens", { recursive: true });

async function writeCover(sourcePath, width, height, dest) {
  const meta = await sharp(sourcePath).metadata();
  const aspect = width / height;
  let targetWidth = Math.min(width, meta.width ?? width);
  let targetHeight = Math.max(1, Math.round(targetWidth / aspect));
  if ((meta.height ?? targetHeight) < targetHeight) {
    targetHeight = meta.height ?? targetHeight;
    targetWidth = Math.max(1, Math.min(targetWidth, Math.round(targetHeight * aspect)));
  }
  await sharp(sourcePath).resize({ width: targetWidth, height: targetHeight, fit: "cover", position: "top", withoutEnlargement: true }).webp({ quality: 74 }).toFile(dest);
  const written = await sharp(dest).metadata();
  console.log(`${dest}: ${written.width}x${written.height} from ${meta.width}x${meta.height}`);
}

for (const project of projects) {
  const source = `public${project.image}`;
  if (!screensOnly) await writeCover(source, 512, 351, `public/studio/screens/${project.slug}.webp`);
  await writeCover(source, 1536, 1053, `public/studio/screens/${project.slug}@2x.webp`);
}
console.log(`Created detail textures for ${projects.length} portfolio screens.`);
