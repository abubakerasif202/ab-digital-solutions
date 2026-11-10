// Contact shadows for every living thing in the studio. The scene has no shadow-casting lights (they
// would cost a depth pass per light on phones), so figures used to float. A soft disc under each one
// grounds it for a single extra draw call and no texture.
import * as THREE from "three";

/** Unit disc in the XZ plane whose vertex alpha fades from the centre to a clear rim. */
export function createShadowGeometry(segments = 28) {
  const rings: Array<[number, number]> = [[0.45, 0.34], [0.78, 0.13], [1, 0]]; // [radius, alpha]
  const positions: number[] = [0, 0, 0], colors: number[] = [0, 0, 0, 0.4], index: number[] = [];
  for (const [radius, alpha] of rings) for (let i = 0; i < segments; i++) {
    const angle = (i / segments) * Math.PI * 2;
    positions.push(Math.cos(angle) * radius, 0, Math.sin(angle) * radius);
    colors.push(0, 0, 0, alpha);
  }
  for (let i = 0; i < segments; i++) {
    const next = (i + 1) % segments;
    index.push(0, 1 + next, 1 + i);
    for (let ring = 0; ring < rings.length - 1; ring++) {
      const a = 1 + ring * segments, b = a + segments;
      index.push(a + i, a + next, b + i, a + next, b + next, b + i);
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 4));
  geometry.setIndex(index);
  return geometry;
}

/** Vertex alpha drives the falloff. It never writes depth, so it cannot hide feet or chair bases. */
export function createShadowMaterial() {
  return new THREE.MeshBasicMaterial({ color: "#000000", vertexColors: true, transparent: true, depthWrite: false, toneMapped: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
}
