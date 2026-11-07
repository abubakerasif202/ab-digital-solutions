import * as THREE from "three";

/** One library per scene, never a global cache shared with another canvas. */
export function createBlockResources() {
  const geometry = new THREE.BoxGeometry(1, 1, 1);
  const materials = new Map<string, THREE.MeshStandardMaterial>();
  return {
    get(color: string, metalness: number, roughness: number) {
      const key = `${color}:${metalness}:${roughness}`;
      let material = materials.get(key);
      if (!material) {
        material = new THREE.MeshStandardMaterial({ color, metalness, roughness });
        materials.set(key, material);
      }
      return { geometry, material };
    },
    dispose() {
      geometry.dispose();
      materials.forEach((material) => material.dispose());
      // Keep ownership during StrictMode effect replay. Live meshes reuse these
      // re-uploadable objects; the whole cache is collectible on actual unmount.
    },
  };
}
