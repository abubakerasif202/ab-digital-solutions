import { createServer } from "node:http";
import { readFile, writeFile } from "node:fs/promises";
import { chromium } from "@playwright/test";
import { createHash } from "node:crypto";

const routes = {
  "/three.js": "node_modules/three/build/three.module.js",
  "/three.core.js": "node_modules/three/build/three.core.js",
  "/room.js": "node_modules/three/examples/jsm/environments/RoomEnvironment.js",
};
const server = createServer(async (request, response) => {
  if (request.url === "/") {
    response.setHeader("Content-Type", "text/html");
    response.end('<script type="importmap">{"imports":{"three":"/three.js"}}</script>');
  } else if (routes[request.url]) {
    response.setHeader("Content-Type", "application/javascript");
    response.end(await readFile(routes[request.url]));
  } else { response.writeHead(404).end(); }
});
await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || "C:/Program Files/Google/Chrome/Application/chrome.exe", headless: true });
try {
  const page = await browser.newPage();
  await page.goto(`http://127.0.0.1:${server.address().port}`);
  const baked = await page.evaluate(async () => {
    const THREE = await import("/three.js");
    const { RoomEnvironment } = await import("/room.js");
    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "low-power", alpha: false });
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    const generator = new THREE.PMREMGenerator(renderer);
    const room = new RoomEnvironment();
    const target = generator.fromScene(room, .04, .1, 100, { size: 128 });
    const { width, height } = target;
    const data = new Uint16Array(width * height * 4);
    renderer.readRenderTargetPixels(target, 0, 0, width, height, data);
    const bytes = new Uint8Array(data.buffer);
    let binary = "";
    for (let i = 0; i < bytes.length; i += 8192) binary += String.fromCharCode(...bytes.subarray(i, i + 8192));
    const metadata = { three: THREE.REVISION, width, height, mapping: target.texture.mapping, type: target.texture.type, format: target.texture.format, colorSpace: target.texture.colorSpace, minFilter: target.texture.minFilter, magFilter: target.texture.magFilter, flipY: target.texture.flipY, generateMipmaps: target.texture.generateMipmaps };
    // Compare GPU-rendered metallic surfaces, not only metadata or a screenshot.
    const restored = new THREE.DataTexture(data, width, height, THREE.RGBAFormat, THREE.HalfFloatType);
    restored.mapping = THREE.CubeUVReflectionMapping; restored.colorSpace = THREE.LinearSRGBColorSpace;
    restored.minFilter = restored.magFilter = THREE.LinearFilter; restored.flipY = false; restored.generateMipmaps = false; restored.needsUpdate = true;
    const sampleScene = new THREE.Scene(); sampleScene.environmentIntensity = .6;
    const camera = new THREE.PerspectiveCamera(40, 3, .1, 100); camera.position.z = 5;
    for (const [index, roughness] of [.05, .3, .8].entries()) {
      const mesh = new THREE.Mesh(new THREE.SphereGeometry(.7, 32, 24), new THREE.MeshStandardMaterial({ color: "#bca06b", metalness: .85, roughness }));
      mesh.position.x = (index - 1) * 1.6; sampleScene.add(mesh);
    }
    const comparison = new THREE.WebGLRenderTarget(192, 64);
    const before = new Uint8Array(192 * 64 * 4), after = new Uint8Array(before.length);
    renderer.setRenderTarget(comparison); sampleScene.environment = target.texture;
    renderer.render(sampleScene, camera); renderer.readRenderTargetPixels(comparison, 0, 0, 192, 64, before);
    sampleScene.environment = restored;
    renderer.render(sampleScene, camera); renderer.readRenderTargetPixels(comparison, 0, 0, 192, 64, after);
    let maxDifference = 0, changedChannels = 0;
    for (let i = 0; i < before.length; i++) { const delta = Math.abs(before[i] - after[i]); maxDifference = Math.max(maxDifference, delta); if (delta) changedChannels++; }
    metadata.visualEquivalence = { comparedChannels: before.length, maxDifference, changedChannels, surfaces: "brass spheres at roughness .05/.3/.8" };
    if (maxDifference > 1) throw new Error(`Baked environment changes reflections by ${maxDifference}`);
    sampleScene.traverse((object) => { if (object.isMesh) { object.geometry.dispose(); object.material.dispose(); } });
    renderer.setRenderTarget(null); comparison.dispose(); restored.dispose();
    target.dispose(); generator.dispose(); room.dispose(); renderer.dispose();
    return { metadata, base64: btoa(binary) };
  });
  const header = Buffer.alloc(16);
  header.write("ABENV001"); header.writeUInt32LE(baked.metadata.width, 8); header.writeUInt32LE(baked.metadata.height, 12);
  const bytes = Buffer.concat([header, Buffer.from(baked.base64, "base64")]);
  const path = "public/studio/room-environment.bin";
  await writeFile(path, bytes);
  await writeFile("docs/studio-environment.json", JSON.stringify({ ...baked.metadata, source: "Three RoomEnvironment; PMREM.fromScene(room, .04, .1, 100, {size:128})", path, bytes: bytes.length, sha256: createHash("sha256").update(bytes).digest("hex"), browser: browser.version() }, null, 2));
  console.log(JSON.stringify(baked.metadata), bytes.length);
} finally {
  await browser.close();
  await new Promise((resolve) => server.close(resolve));
}
