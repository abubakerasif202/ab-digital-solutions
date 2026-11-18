import assert from "node:assert/strict";
import test from "node:test";
import * as THREE from "three";
import { collectHotspotOccluders } from "../app/studio/scene/hotspot-occlusion.ts";

test("hotspot occlusion retains solid visible set pieces, not skinned cast or glass", () => {
  const scene = new THREE.Scene();
  const solid = new THREE.Mesh();
  const glass = new THREE.Mesh(undefined, new THREE.MeshBasicMaterial({ transparent: true, opacity: .12 }));
  const cast = new THREE.SkinnedMesh();
  const hidden = new THREE.Group();
  hidden.visible = false;
  hidden.add(new THREE.Mesh());
  scene.add(solid, glass, cast, hidden, new THREE.Points());
  const result = [glass];
  collectHotspotOccluders(scene, result);
  assert.deepEqual(result, [solid]);
  solid.visible = false;
  collectHotspotOccluders(scene, result);
  assert.deepEqual(result, []);
});
