import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import { stripTypeScriptTypes } from "node:module";
import * as THREE from "three";

// The rig is imperative Three code with no JSX, although its public module uses .tsx.
// Resolve its imports before loading the stripped module so Node can exercise the actual rig.
const sourceUrl = new URL("../app/studio/world/characters/humanoid.tsx", import.meta.url);
const source = (await readFile(sourceUrl, "utf8")).replace(/from "([^"]+)"/g, (_, specifier) => {
  const resolved = specifier.startsWith(".") ? new URL(`${specifier}.ts`, sourceUrl).href : import.meta.resolve(specifier);
  return `from "${resolved}"`;
});
const { CAST, createHumanoidKit, createHumanoid, createPose, poseSeatedTyping, poseWalk } = await import(`data:text/javascript;base64,${Buffer.from(stripTypeScriptTypes(source)).toString("base64")}`);

test("each character renders one skinned mesh with rigid normalized weights", () => {
  const kit = createHumanoidKit();
  for (const appearance of Object.values(CAST)) {
    const rig = createHumanoid(kit, appearance);
    const meshes = [];
    rig.root.traverse(object => { if (object.isMesh) meshes.push(object); });
    assert.equal(meshes.length, 1);
    const figure = meshes[0];
    assert.ok(figure.isSkinnedMesh);
    assert.ok(figure.material.vertexColors);
    assert.equal(figure.geometry.groups.length, 0, "one material draw, not one group per part");
    const weights = figure.geometry.getAttribute("skinWeight");
    const indices = figure.geometry.getAttribute("skinIndex");
    for (let vertex = 0; vertex < weights.count; vertex++) {
      assert.deepEqual([weights.getX(vertex), weights.getY(vertex), weights.getZ(vertex), weights.getW(vertex)], [1, 0, 0, 0]);
      assert.ok(indices.getX(vertex) < figure.skeleton.bones.length);
    }

    // Compare the batched hip surface against the original rigid part's transform, including
    // non-unit character height, root movement, seated posture and walking joint rotations.
    const hipPart = figure.skeleton.bones[indices.getX(0)];
    const original = kit.geo.sphere.toNonIndexed();
    for (const pose of [createPose(), poseSeatedTyping(createPose(), 2, 1, { y: .7, z: .4 }), poseWalk(createPose(), 1.2, 1)]) {
      pose.rootX = 3; pose.rootZ = -2; pose.rootYaw = .7;
      rig.apply(pose);
      rig.root.updateMatrixWorld(true);
      figure.skeleton.update();
      for (const vertex of [0, 18, 120]) {
        const expected = new THREE.Vector3().fromBufferAttribute(original.getAttribute("position"), vertex).applyMatrix4(hipPart.matrixWorld);
        const actual = new THREE.Vector3().fromBufferAttribute(figure.geometry.getAttribute("position"), vertex);
        figure.applyBoneTransform(vertex, actual);
        figure.localToWorld(actual);
        assert.ok(actual.distanceTo(expected) < 1e-5, "rigid skinning preserves the original part's position");
      }
    }
    original.dispose();
  }
  kit.dispose();
});

test("the shared kit disposes batched geometry and skeleton textures", () => {
  const kit = createHumanoidKit();
  const rig = createHumanoid(kit, CAST.receptionist);
  const figure = rig.root.children.find(object => object.isSkinnedMesh);
  let geometryDisposed = false, textureDisposed = false;
  figure.geometry.addEventListener("dispose", () => { geometryDisposed = true; });
  figure.skeleton.computeBoneTexture();
  figure.skeleton.boneTexture.addEventListener("dispose", () => { textureDisposed = true; });
  kit.dispose();
  assert.ok(geometryDisposed);
  assert.ok(textureDisposed);
});

test("batched eyes still close when the facial rig blinks", () => {
  const kit = createHumanoidKit();
  const rig = createHumanoid(kit, CAST.receptionist);
  const figure = rig.root.children.find(object => object.isSkinnedMesh);
  const eyesIndex = figure.skeleton.bones.findIndex(bone => Math.abs(bone.position.z - .086) < 1e-8);
  assert.ok(eyesIndex >= 0);
  const height = blink => {
    const pose = createPose(); pose.blink = blink;
    rig.apply(pose); rig.root.updateMatrixWorld(true); figure.skeleton.update();
    let min = Infinity, max = -Infinity;
    const positions = figure.geometry.getAttribute("position"), indices = figure.geometry.getAttribute("skinIndex");
    for (let vertex = 0; vertex < positions.count; vertex++) {
      if (indices.getX(vertex) !== eyesIndex) continue;
      const point = new THREE.Vector3().fromBufferAttribute(positions, vertex);
      figure.applyBoneTransform(vertex, point); figure.localToWorld(point);
      min = Math.min(min, point.y); max = Math.max(max, point.y);
    }
    return max - min;
  };
  const open = height(0), closed = height(1);
  assert.ok(open > .01);
  assert.ok(Math.abs(closed / open - .08) < 1e-5);
  kit.dispose();
});
