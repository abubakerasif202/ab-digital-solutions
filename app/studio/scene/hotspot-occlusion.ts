import { Mesh, SkinnedMesh, type Object3D } from "three";

/** Only visible solid set pieces hide wayfinding labels. Cast can walk past without flickering them. */
export function collectHotspotOccluders(root: Object3D, results: Object3D[]) {
  results.length = 0;
  root.traverseVisible((object) => {
    if (!(object instanceof Mesh) || object instanceof SkinnedMesh || object.userData.studioOcclusion === false) return;
    const materials = Array.isArray(object.material) ? object.material : [object.material];
    if (materials.some((material) => material.visible && (!material.transparent || material.opacity >= .9))) results.push(object);
  });
}
