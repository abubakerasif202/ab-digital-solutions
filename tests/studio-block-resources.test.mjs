import assert from "node:assert/strict";
import test from "node:test";
import * as THREE from "three";
import { createBlockResources } from "../app/studio/scene/block-resources.ts";

test("blocks share geometry and matching materials but keep distinct surface settings", () => {
  const resources = createBlockResources();
  const first = resources.get("#202427", .15, .5);
  const second = resources.get("#202427", .15, .5);
  assert.equal(first.geometry, second.geometry);
  assert.equal(first.material, second.material);
  assert.notEqual(first.material, resources.get("#202427", .15, .8).material);
  resources.dispose();
});

test("effect cleanup replay retains ownership of resources reused by mounted meshes", () => {
  const resources = createBlockResources();
  const original = resources.get("#202427", .15, .5);
  let materialDisposals = 0, geometryDisposals = 0;
  original.material.addEventListener("dispose", () => materialDisposals++);
  original.geometry.addEventListener("dispose", () => geometryDisposals++);
  resources.dispose(); // StrictMode effect cleanup; meshes still reference these objects.
  const replayed = resources.get("#202427", .15, .5);
  assert.equal(replayed.material, original.material);
  assert.equal(replayed.geometry, original.geometry);
  const later = resources.get("#bca06b", .8, .5);
  let laterDisposals = 0;
  later.material.addEventListener("dispose", () => laterDisposals++);
  resources.dispose(); // Final unmount must still own every material.
  assert.equal(materialDisposals, 2);
  assert.equal(geometryDisposals, 2);
  assert.equal(laterDisposals, 1);
});

test("unit geometry scaling preserves original Block vertices and surface properties", () => {
  const resources = createBlockResources();
  const size = [2.35, 3.1, .045];
  const original = new THREE.BoxGeometry(...size);
  const { geometry, material } = resources.get("#bca06b", .85, .22);
  const positions = geometry.getAttribute("position");
  const expected = original.getAttribute("position");
  for (let i = 0; i < positions.count; i++) {
    for (let axis = 0; axis < 3; axis++) {
      assert.ok(Math.abs(positions.array[i * 3 + axis] * size[axis] - expected.array[i * 3 + axis]) < 1e-6);
    }
  }
  assert.equal(material.color.getHexString(), "bca06b");
  assert.equal(material.metalness, .85);
  assert.equal(material.roughness, .22);
  original.dispose(); resources.dispose();
});
