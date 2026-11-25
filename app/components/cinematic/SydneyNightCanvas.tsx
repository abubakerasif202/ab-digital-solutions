"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { studioRadiance } from "../studio-radiance";
import type { QualityTier } from "../../lib/device-quality";
import type { SydneyNightView } from "./SydneyNightStage";

export interface SydneyNightCanvasProps {
  className?: string;
  tier: Exclude<QualityTier, "fallback">;
  effectiveDpr: number;
  particleMultiplier: number;
  targetFps: 0 | 24 | 30 | 60;
  reducedMotion: boolean;
  interactive?: boolean;
  activeView?: SydneyNightView;
  onDowngrade?: () => void;
  onContextLost?: () => void;
}

const VIEW_POSES: Record<SydneyNightView, { pos: [number, number, number]; target: [number, number, number] }> = {
  overview: { pos: [0.35, 1.45, 6.2], target: [0, 0.38, -0.3] },
  monogram: { pos: [-0.28, 0.88, 4.1], target: [0, 0.62, 0] },
  harbour: { pos: [1.9, 1.8, 5.9], target: [-0.4, 0.3, -4.5] },
};

function seededUnit(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

const WATER_Y = -0.52;
const TOWER_BASE_Y = -0.55;

interface SkylineTower {
  x: number;
  z: number;
  w: number;
  h: number;
  far: boolean;
}

/** Two depth layers of CBD blocks behind the bridge: pale hazy far row, darker near row. */
const SKYLINE_TOWERS: readonly SkylineTower[] = [
  ...(
    [
      [-16, 5.5, 3],
      [-12.5, 7.4, 2.4],
      [-9, 4.6, 2],
      [-5.4, 6.2, 2.6],
      [-1.2, 5, 2.2],
      [3.4, 6.6, 2.8],
      [11.5, 5.8, 2.6],
      [15.5, 5, 3],
    ] as const
  ).map(([x, h, w]) => ({ x, z: -29, w, h, far: true })),
  ...(
    [
      [-14, 3.4, 2.6],
      [-10.4, 4.2, 2],
      [-7, 3, 2.2],
      [0.2, 3.3, 2],
      [9.8, 3.6, 2.4],
      [13.4, 4.3, 2.2],
    ] as const
  ).map(([x, h, w]) => ({ x, z: -24, w, h, far: false })),
];

const WATER_VERTEX = /* glsl */ `
  varying vec3 vWorld;
  void main() {
    vec4 w = modelMatrix * vec4(position, 1.0);
    vWorld = w.xyz;
    gl_Position = projectionMatrix * viewMatrix * w;
  }
`;

/**
 * Harbour water: each skyline emitter (x, z, top height, half-width) is mirrored through the
 * camera ray onto the water plane, so streaks stay anchored beneath the lit structure they reflect
 * and stretch toward the viewer with ripple breakup. Loop bound is a compile-time constant.
 */
const WATER_FRAGMENT = /* glsl */ `
  uniform float uTime;
  uniform vec3 uBg;
  uniform vec3 uGold;
  uniform vec3 uRuby;
  uniform vec4 uEm[EM_COUNT];
  uniform vec4 uCol[EM_COUNT];
  varying vec3 vWorld;

  void main() {
    vec3 P = vWorld;
    vec3 toCam = cameraPosition - P;
    float dist = length(toCam);
    float vy = clamp(toCam.y / dist, 0.0, 1.0);
    float fres = 0.22 + 0.78 * pow(1.0 - vy, 3.0);
    float far = 1.0 - smoothstep(-27.0, 2.0, P.z);
    float rip = 0.6 * sin(P.z * 7.0 + uTime * 0.9 + sin(P.x * 1.3) * 2.0)
              + 0.4 * sin(P.z * 17.0 - uTime * 1.4 + P.x * 2.3);
    float glint = 0.5 + 0.5 * sin(P.z * 46.0 + rip * 3.0 + P.x * 5.0 + uTime * 0.6);

    vec3 warm = mix(uRuby, uGold, smoothstep(-10.0, 6.0, P.x));
    vec3 hz = uBg + warm * 0.22;
    vec3 col = mix(vec3(0.010, 0.014, 0.022), vec3(0.030, 0.040, 0.060), far);
    col = mix(col, hz * (0.7 + 0.3 * fres), pow(far, 3.0));

    float dPz = cameraPosition.z - P.z;
    vec3 acc = vec3(0.0);
    if (dPz > 0.08) {
      float camH = cameraPosition.y - P.y;
      for (int i = 0; i < EM_COUNT; i++) {
        vec4 e = uEm[i];
        float k = (cameraPosition.z - e.y) / dPz;
        if (k > 1.0) {
          float m = camH * (k - 1.0) / max(e.z - P.y, 0.05);
          if (m < 1.7) {
            float xr = cameraPosition.x + (P.x - cameraPosition.x) * k;
            float wdt = (e.w * (1.0 + 0.7 * m) + 0.015) * sqrt(k);
            float dx = (xr - e.x) + rip * (0.03 + 0.05 * m);
            // The Gaussian is negligible outside three widths; skip that work.
            if (abs(dx) < 3.0 * wdt) {
              float profile = (0.35 + 0.65 * smoothstep(0.0, 1.0, m)) * (1.0 - smoothstep(1.0, 1.7, m));
              float s = exp(-(dx * dx) / (wdt * wdt));
              acc += uCol[i].rgb * (uCol[i].a * s * profile * mix(0.5, 1.0, glint));
            }
          }
        }
      }
    }
    col += acc * fres * exp(-dist * 0.018);

    gl_FragColor = vec4(col, 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

const BACKDROP_FRAGMENT = /* glsl */ `
  uniform vec3 uBg;
  uniform vec3 uGold;
  uniform vec3 uRuby;
  varying vec3 vWorld;
  void main() {
    float y = max(vWorld.y - ${WATER_Y.toFixed(2)}, 0.0);
    vec3 warm = mix(uRuby, uGold, smoothstep(-10.0, 6.0, vWorld.x));
    vec3 c = uBg + warm * (0.22 * exp(-y * 0.34) + 0.02 * exp(-y * 0.07));
    gl_FragColor = vec4(c, 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

/**
 * Selective Sydney-night architectural & AB monogram 3D stage.
 * Uses pure Three.js with instanced architectural geometry (<= 14 draw calls),
 * deterministic studio radiance reflections, IntersectionObserver + visibilitychange
 * pausing, runtime FPS downgrade, and full GPU disposal.
 */
export function SydneyNightCanvas({
  className = "",
  tier,
  effectiveDpr,
  particleMultiplier,
  targetFps,
  reducedMotion,
  interactive = true,
  activeView = "overview",
  onDowngrade,
  onContextLost,
}: SydneyNightCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<SydneyNightView>(activeView);
  const wakeRef = useRef<() => void>(() => {});
  const targetPoseRef = useRef(VIEW_POSES[activeView]);

  useEffect(() => {
    viewRef.current = activeView;
    targetPoseRef.current = VIEW_POSES[activeView];
    wakeRef.current();
  }, [activeView]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = Math.max(1, container.clientWidth);
    const height = Math.max(1, container.clientHeight);

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: tier !== "low",
        alpha: false,
        powerPreference: tier === "high" ? "high-performance" : "low-power",
      });
    } catch {
      onContextLost?.();
      return;
    }

    const dpr = Math.min(effectiveDpr, tier === "low" ? 1 : tier === "medium" ? 1.25 : 1.5);
    renderer.setPixelRatio(dpr);
    renderer.setSize(width, height);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.domElement.setAttribute("aria-hidden", "true");
    renderer.domElement.tabIndex = -1;
    renderer.domElement.style.display = "block";
    renderer.domElement.style.width = "100%";
    renderer.domElement.style.height = "100%";
    renderer.domElement.style.touchAction = "pan-y";
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const bgHex = 0x070708;
    scene.background = new THREE.Color(bgHex);
    scene.fog = new THREE.FogExp2(bgHex, 0.042);

    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 120);
    const initialPose = VIEW_POSES[viewRef.current];
    camera.position.set(...initialPose.pos);

    const disposables: Array<{ dispose: () => void }> = [];
    const track = <T extends { dispose: () => void }>(item: T) => {
      disposables.push(item);
      return item;
    };

    // Deterministic studio radiance environment (no external HDR download).
    const radianceW = tier === "low" ? 64 : 128;
    const radianceH = tier === "low" ? 32 : 64;
    const radianceData = studioRadiance(radianceW, radianceH);
    const radianceTex = track(new THREE.DataTexture(radianceData, radianceW, radianceH, THREE.RGBAFormat));
    radianceTex.mapping = THREE.EquirectangularReflectionMapping;
    radianceTex.colorSpace = THREE.SRGBColorSpace;
    radianceTex.needsUpdate = true;

    const pmrem = new THREE.PMREMGenerator(renderer);
    const envTarget = track(pmrem.fromEquirectangular(radianceTex));
    scene.environment = envTarget.texture;
    scene.environmentIntensity = 0.85;
    pmrem.dispose();

    // Nocturnal Sydney lighting rig: carbon shadow, gilt key, cool harbour rim, vivid ruby accent.
    const ambient = new THREE.AmbientLight(0x6d7d9e, 0.42);
    const giltKey = new THREE.DirectionalLight(0xffdca2, 1.85);
    giltKey.position.set(4.5, 6.5, 5.2);
    const harbourRim = new THREE.DirectionalLight(0x5b7aa8, 0.9);
    harbourRim.position.set(-5.5, 4.0, -7.5);
    const rubyAccent = new THREE.PointLight(0xc8173a, 7.5, 11, 1.6);
    rubyAccent.position.set(-1.85, 0.95, 1.4);
    const goldFill = new THREE.PointLight(0xc9a45c, 4.5, 9, 1.5);
    goldFill.position.set(1.9, 1.5, 2.2);
    scene.add(ambient, giltKey, harbourRim, rubyAccent, goldFill);

    // Shared luxury materials.
    const obsidianMat = track(new THREE.MeshStandardMaterial({ color: 0x0b0b0d, metalness: 0.38, roughness: 0.28 }));
    const goldMat = track(new THREE.MeshStandardMaterial({ color: 0xc9a45c, metalness: 0.9, roughness: 0.22 }));
    const glassMat = track(
      new THREE.MeshStandardMaterial({
        color: 0x16212b,
        metalness: 0.25,
        roughness: 0.12,
        transparent: true,
        opacity: 0.32,
        depthWrite: false,
      }),
    );

    const stageGroup = new THREE.Group();
    scene.add(stageGroup);

    // 2. Plinth base
    const baseGeo = track(new THREE.BoxGeometry(4.2, 0.28, 2.5));
    const baseMesh = new THREE.Mesh(baseGeo, obsidianMat);
    baseMesh.position.set(0, -0.36, 0);
    stageGroup.add(baseMesh);

    // 3. Monogram group (gold architectural elements batched in one InstancedMesh)
    const monogramGroup = new THREE.Group();
    monogramGroup.position.set(0, 0.64, 0.12);
    stageGroup.add(monogramGroup);

    const haloGeo = track(new THREE.RingGeometry(1.16, 1.2, 64));
    const haloMesh = new THREE.Mesh(haloGeo, goldMat);
    haloMesh.position.set(0, 0.04, -0.24);
    monogramGroup.add(haloMesh); // 4

    const rubyArcGeo = track(new THREE.RingGeometry(1.04, 1.07, 48, 1, -0.45, Math.PI + 0.9));
    const rubyArcMat = track(new THREE.MeshBasicMaterial({ color: 0xc8173a, side: THREE.DoubleSide, toneMapped: false }));
    const rubyArcMesh = new THREE.Mesh(rubyArcGeo, rubyArcMat);
    rubyArcMesh.position.set(0, 0.04, -0.26);
    monogramGroup.add(rubyArcMesh); // 5

    const glassGeo = track(new THREE.BoxGeometry(2.55, 1.82, 0.04));
    const glassMesh = new THREE.Mesh(glassGeo, glassMat);
    glassMesh.position.set(0, 0.02, -0.18);
    monogramGroup.add(glassMesh); // 6

    const unitBoxGeo = track(new THREE.BoxGeometry(1, 1, 1));
    const goldBars: Array<{ pos: [number, number, number]; size: [number, number, number]; rotZ?: number }> = [
      // Frame pillars, lintel, and plinth trim
      { pos: [-1.29, 0.02, -0.18], size: [0.055, 1.9, 0.09] },
      { pos: [1.29, 0.02, -0.18], size: [0.055, 1.9, 0.09] },
      { pos: [0, 0.96, -0.18], size: [2.65, 0.055, 0.1] },
      { pos: [0, -0.85, -0.12], size: [4.26, 0.028, 2.56] },
      // Letter 'A'
      { pos: [-0.58, 0.04, 0.04], size: [0.09, 0.96, 0.12], rotZ: -0.26 },
      { pos: [-0.24, 0.04, 0.04], size: [0.09, 0.96, 0.12], rotZ: 0.26 },
      { pos: [-0.41, -0.12, 0.05], size: [0.36, 0.075, 0.1] },
      // Letter 'B'
      { pos: [0.16, 0.04, 0.04], size: [0.095, 0.94, 0.12] },
      { pos: [0.38, 0.46, 0.04], size: [0.42, 0.08, 0.12] },
      { pos: [0.37, 0.05, 0.04], size: [0.39, 0.075, 0.12] },
      { pos: [0.39, -0.39, 0.04], size: [0.44, 0.08, 0.12] },
      { pos: [0.56, 0.255, 0.04], size: [0.085, 0.42, 0.12] },
      { pos: [0.58, -0.17, 0.04], size: [0.085, 0.46, 0.12] },
    ];
    const goldInstanced = track(new THREE.InstancedMesh(unitBoxGeo, goldMat, goldBars.length));
    const dummy = new THREE.Object3D();
    goldBars.forEach((bar, index) => {
      dummy.position.set(...bar.pos);
      dummy.scale.set(...bar.size);
      dummy.rotation.set(0, 0, bar.rotZ ?? 0);
      dummy.updateMatrix();
      goldInstanced.setMatrixAt(index, dummy.matrix);
    });
    goldInstanced.instanceMatrix.needsUpdate = true;
    monogramGroup.add(goldInstanced); // 7

    // Ruby glow accents batched in one InstancedMesh (plinth line + monogram core + bridge beacons)
    const horizonGroup = new THREE.Group();
    horizonGroup.position.set(0, -0.5, -14);
    stageGroup.add(horizonGroup);

    // (Ruby plinth line, monogram core and bridge beacons now live in the shared emissive-lights batch below.)

    // 9. Distant Sydney Harbour Bridge silhouette batched in one InstancedMesh
    // Fog off + darker tone so the bridge reads as a crisp silhouette against the city-glow backdrop.
    const skylineMat = track(
      new THREE.MeshStandardMaterial({ color: 0x0a0d13, metalness: 0.25, roughness: 0.65, fog: false }),
    );
    const archSegments = tier === "low" ? 10 : 16;
    const span = 8.4;
    const bridgeParts: Array<{ pos: [number, number, number]; size: [number, number, number]; rotZ?: number }> = [
      { pos: [1.6, 1.35, -3.5], size: [11.5, 0.16, 0.55] },
      { pos: [-2.8, 1.4, -3.5], size: [0.45, 2.75, 0.52] },
      { pos: [6.0, 1.4, -3.5], size: [0.45, 2.75, 0.52] },
    ];
    for (let i = 0; i < archSegments; i++) {
      const t0 = i / archSegments;
      const t1 = (i + 1) / archSegments;
      const x0 = -span / 2 + t0 * span;
      const x1 = -span / 2 + t1 * span;
      const y0 = 1.35 + 1.55 * (1 - (x0 / (span / 2)) ** 2);
      const y1 = 1.35 + 1.55 * (1 - (x1 / (span / 2)) ** 2);
      const len = Math.hypot(x1 - x0, y1 - y0);
      bridgeParts.push({
        pos: [1.6 + (x0 + x1) / 2, (y0 + y1) / 2, -3.5],
        size: [len * 1.04, 0.11, 0.22],
        rotZ: Math.atan2(y1 - y0, x1 - x0),
      });
    }
    const bridgeInstanced = track(new THREE.InstancedMesh(unitBoxGeo, skylineMat, bridgeParts.length));
    bridgeParts.forEach((part, index) => {
      dummy.position.set(...part.pos);
      dummy.scale.set(...part.size);
      dummy.rotation.set(0, 0, part.rotZ ?? 0);
      dummy.updateMatrix();
      bridgeInstanced.setMatrixAt(index, dummy.matrix);
    });
    bridgeInstanced.instanceMatrix.needsUpdate = true;
    horizonGroup.add(bridgeInstanced); // 9

    // 10. Opera-inspired luminous sail silhouettes batched in one InstancedMesh
    const sailMat = track(
      new THREE.MeshStandardMaterial({ color: 0xd9cbb2, metalness: 0.12, roughness: 0.45, emissive: 0x2a1f12 }),
    );
    const sailGeo = track(
      new THREE.SphereGeometry(1, tier === "low" ? 8 : 14, tier === "low" ? 6 : 10, 0, Math.PI * 0.42, 0, Math.PI * 0.56),
    );
    const sails: Array<[number, number, number, number]> = [
      [-4.8, 0.0, 1.4, 0.25],
      [-3.85, -0.25, 1.18, 0.15],
      [-3.05, -0.45, 0.96, 0.08],
    ];
    const sailInstanced = track(new THREE.InstancedMesh(sailGeo, sailMat, sails.length));
    sails.forEach(([sx, sz, sScale, sRot], index) => {
      dummy.position.set(sx, 0.15, -1.8 + sz);
      dummy.scale.setScalar(sScale);
      dummy.rotation.set(0, sRot, 0);
      dummy.updateMatrix();
      sailInstanced.setMatrixAt(index, dummy.matrix);
    });
    sailInstanced.instanceMatrix.needsUpdate = true;
    horizonGroup.add(sailInstanced); // 11

    // 12-14. Layered CBD towers, one emissive-lights batch, and a city-glow backdrop.
    const lightRng = seededUnit(8841);
    const towerMat = track(new THREE.MeshBasicMaterial({ color: 0xffffff, fog: false }));
    const SYD_X = 7.8;
    const SYD_Z = -27.5;
    const towerCount = SKYLINE_TOWERS.length + 3;
    const towerInstanced = track(new THREE.InstancedMesh(unitBoxGeo, towerMat, towerCount));
    const tmpColor = new THREE.Color();
    const setTower = (index: number, x: number, y: number, z: number, sx: number, sy: number, sz: number, hex: number) => {
      dummy.position.set(x, y, z);
      dummy.scale.set(sx, sy, sz);
      dummy.rotation.set(0, 0, 0);
      dummy.updateMatrix();
      towerInstanced.setMatrixAt(index, dummy.matrix);
      towerInstanced.setColorAt(index, tmpColor.setHex(hex));
    };
    SKYLINE_TOWERS.forEach((t, i) => {
      setTower(i, t.x, TOWER_BASE_Y + t.h / 2, t.z, t.w, t.h, t.w * 0.8, t.far ? 0x121824 : 0x090c12);
    });
    // Sydney Tower: shaft, turret, antenna.
    const sydBase = SKYLINE_TOWERS.length;
    setTower(sydBase, SYD_X, TOWER_BASE_Y + 4, SYD_Z, 0.16, 8, 0.16, 0x10151f);
    setTower(sydBase + 1, SYD_X, TOWER_BASE_Y + 6.3, SYD_Z, 0.62, 0.5, 0.62, 0x10151f);
    setTower(sydBase + 2, SYD_X, TOWER_BASE_Y + 8.05, SYD_Z, 0.035, 1.2, 0.035, 0x10151f);
    towerInstanced.instanceMatrix.needsUpdate = true;
    if (towerInstanced.instanceColor) towerInstanced.instanceColor.needsUpdate = true;
    stageGroup.add(towerInstanced); // 12

    interface GlowItem {
      pos: [number, number, number];
      size: [number, number, number];
      hex: number;
      gain: number;
    }
    const RUBY = 0xc8173a;
    const GILT = 0xffe0a3;
    const GOLD = 0xe2c58a;
    const glowItems: GlowItem[] = [
      // Plinth ruby line, monogram core, bridge pylon beacons (previous accents, beacons made hotter).
      { pos: [0, -0.21, 1.28], size: [3.5, 0.016, 0.03], hex: RUBY, gain: 1 },
      { pos: [-0.04, 0.68, 0.1], size: [0.03, 0.72, 0.03], hex: RUBY, gain: 1 },
      { pos: [-2.8, 2.36, -17.5], size: [0.13, 0.13, 0.13], hex: RUBY, gain: 1.4 },
      { pos: [6.0, 2.36, -17.5], size: [0.13, 0.13, 0.13], hex: RUBY, gain: 1.4 },
      // Gilt deck strip (formerly its own mesh) plus individual deck lamps.
      { pos: [1.6, 0.94, -17.22], size: [11.2, 0.025, 0.04], hex: GILT, gain: 0.8 },
    ];
    const DECK_LAMPS = 22;
    const deckX = (i: number) => -3.8 + (i * 10.8) / (DECK_LAMPS - 1);
    for (let i = 0; i < DECK_LAMPS; i++) {
      glowItems.push({ pos: [deckX(i), 0.99, -17.2], size: [0.06, 0.06, 0.04], hex: GILT, gain: 1.1 });
    }
    sails.forEach(([sx, sz, sScale]) => {
      glowItems.push({ pos: [sx, -0.46, -15.6 + sz], size: [sScale * 0.85, 0.03, 0.04], hex: GOLD, gain: 0.9 });
    });
    const windowBudget = tier === "high" ? 110 : tier === "medium" ? 80 : 48;
    const perTower = Math.max(3, Math.floor(windowBudget / SKYLINE_TOWERS.length));
    for (const t of SKYLINE_TOWERS) {
      for (let n = 0; n < perTower; n++) {
        const r = lightRng();
        glowItems.push({
          pos: [
            t.x + (lightRng() - 0.5) * t.w * 0.82,
            TOWER_BASE_Y + 0.35 + lightRng() * Math.max(0.4, t.h - 0.55),
            t.z + t.w * 0.4 + 0.03,
          ],
          size: [0.07 + lightRng() * 0.08, 0.05, 0.02],
          hex: r < 0.16 ? RUBY : r < 0.32 ? GILT : GOLD,
          gain: t.far ? 0.55 : 0.85,
        });
      }
    }
    glowItems.push(
      { pos: [SYD_X, TOWER_BASE_Y + 6.3, SYD_Z + 0.33], size: [0.5, 0.06, 0.02], hex: GILT, gain: 1 },
      { pos: [SYD_X, TOWER_BASE_Y + 8.7, SYD_Z], size: [0.05, 0.05, 0.05], hex: RUBY, gain: 1.4 },
    );

    const glowMat = track(new THREE.MeshBasicMaterial({ color: 0xffffff, toneMapped: false, fog: false }));
    const glowInstanced = track(new THREE.InstancedMesh(unitBoxGeo, glowMat, glowItems.length));
    glowItems.forEach((item, index) => {
      dummy.position.set(...item.pos);
      dummy.scale.set(...item.size);
      dummy.rotation.set(0, 0, 0);
      dummy.updateMatrix();
      glowInstanced.setMatrixAt(index, dummy.matrix);
      glowInstanced.setColorAt(index, tmpColor.setHex(item.hex).multiplyScalar(item.gain));
    });
    glowInstanced.instanceMatrix.needsUpdate = true;
    if (glowInstanced.instanceColor) glowInstanced.instanceColor.needsUpdate = true;
    stageGroup.add(glowInstanced); // 13

    // Water emitters anchored to real skyline positions (x, z, top height, half-width, colour, strength).
    interface Emitter {
      x: number;
      z: number;
      top: number;
      hw: number;
      hex: number;
      power: number;
    }
    const emitters: Emitter[] = [
      { x: 0, z: 0.12, top: 1.75, hw: 0.55, hex: GOLD, power: 0.9 },
      { x: 0, z: 1.28, top: -0.18, hw: 1.4, hex: RUBY, power: 1.0 },
      { x: 0, z: -0.1, top: 2.0, hw: 1.1, hex: RUBY, power: 0.4 },
      { x: -2.8, z: -17.5, top: 1.9, hw: 0.09, hex: RUBY, power: 1.3 },
      { x: 6.0, z: -17.5, top: 1.9, hw: 0.09, hex: RUBY, power: 1.3 },
    ];
    for (let i = 1; i < DECK_LAMPS; i += 3) {
      emitters.push({ x: deckX(i), z: -17.2, top: 0.99, hw: 0.07, hex: GILT, power: 0.85 });
    }
    sails.forEach(([sx, sz, sScale]) => {
      emitters.push({ x: sx, z: -15.6 + sz, top: -0.35 + sScale * 0.8, hw: 0.3, hex: GOLD, power: 0.5 });
    });
    emitters.push({ x: SYD_X, z: SYD_Z, top: WATER_Y + 1.6, hw: 0.12, hex: GOLD, power: 0.55 });
    const skylineStart = emitters.length;
    SKYLINE_TOWERS.forEach((t, i) => {
      emitters.push({
        x: t.x,
        z: t.z,
        top: WATER_Y + 0.9 + t.h * 0.12,
        hw: t.w * 0.3,
        hex: i % 5 === 2 ? RUBY : GOLD,
        power: t.far ? 0.45 : 0.65,
      });
    });
    // The towers are authored far-to-near. Keep the nearer skyline when constrained.
    const reflectionEmitters = tier === "low"
      ? [...emitters.slice(0, skylineStart), ...emitters.slice(skylineStart).reverse()].slice(0, 20)
      : emitters.slice(0, 32);
    const emPos: THREE.Vector4[] = [];
    const emCol: THREE.Vector4[] = [];
    for (const e of reflectionEmitters) {
      tmpColor.setHex(e.hex);
      emPos.push(new THREE.Vector4(e.x, e.z, e.top, e.hw));
      emCol.push(new THREE.Vector4(tmpColor.r, tmpColor.g, tmpColor.b, e.power));
    }

    const horizonGold = new THREE.Color(GOLD);
    const horizonRuby = new THREE.Color(RUBY);
    const bgColor = new THREE.Color(bgHex);

    // 1. Harbour water: one shared shader material, 4-vertex plane (reflection is per-pixel).
    const waterGeo = track(new THREE.PlaneGeometry(56, 46, 1, 1));
    waterGeo.rotateX(-Math.PI / 2);
    const waterMat = track(
      new THREE.ShaderMaterial({
        defines: { EM_COUNT: reflectionEmitters.length },
        uniforms: {
          uTime: { value: 0 },
          uBg: { value: bgColor },
          uGold: { value: horizonGold },
          uRuby: { value: horizonRuby },
          uEm: { value: emPos },
          uCol: { value: emCol },
        },
        vertexShader: WATER_VERTEX,
        fragmentShader: WATER_FRAGMENT,
      }),
    );
    const waterMesh = new THREE.Mesh(waterGeo, waterMat);
    waterMesh.position.set(0, WATER_Y, -9);
    stageGroup.add(waterMesh);

    // 14. City-glow backdrop behind the skyline (matches water horizon colour).
    const backdropGeo = track(new THREE.PlaneGeometry(110, 14, 1, 1));
    const backdropMat = track(
      new THREE.ShaderMaterial({
        uniforms: { uBg: { value: bgColor }, uGold: { value: horizonGold }, uRuby: { value: horizonRuby } },
        vertexShader: WATER_VERTEX,
        fragmentShader: BACKDROP_FRAGMENT,
        fog: false,
      }),
    );
    const backdropMesh = new THREE.Mesh(backdropGeo, backdropMat);
    backdropMesh.position.set(0, WATER_Y + 6.4, -31);
    stageGroup.add(backdropMesh); // 14

    // 15. Distant nocturnal harbour dust / gilt & ruby particles (deterministic PRNG, zero Math.random).
    const particleCount = Math.round(72 * Math.max(0.25, particleMultiplier));
    const particleGeo = track(new THREE.BufferGeometry());
    const particlePos = new Float32Array(particleCount * 3);
    const particleCol = new Float32Array(particleCount * 3);
    const rng = seededUnit(202611);
    const cGold = new THREE.Color(0xe2c58a);
    const cRuby = new THREE.Color(0xc8173a);
    const cTmp = new THREE.Color();
    for (let i = 0; i < particleCount; i++) {
      particlePos[i * 3] = (rng() - 0.5) * 9.5;
      particlePos[i * 3 + 1] = -0.1 + rng() * 3.1;
      particlePos[i * 3 + 2] = (rng() - 0.5) * 6.5 - 1.2;
      cTmp.copy(rng() < 0.22 ? cRuby : cGold);
      particleCol[i * 3] = cTmp.r;
      particleCol[i * 3 + 1] = cTmp.g;
      particleCol[i * 3 + 2] = cTmp.b;
    }
    particleGeo.setAttribute("position", new THREE.BufferAttribute(particlePos, 3));
    particleGeo.setAttribute("color", new THREE.BufferAttribute(particleCol, 3));
    const particleMat = track(
      new THREE.PointsMaterial({
        size: tier === "low" ? 0.04 : 0.032,
        vertexColors: true,
        transparent: true,
        opacity: 0.58,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    );
    const particles = new THREE.Points(particleGeo, particleMat);
    stageGroup.add(particles); // 12 draws in total, same as baseline (towers, lights batch and backdrop replace the ruby batch, deck strip and standard water)

    // Interactive camera & pointer state (exponential damping + auto-pause when offscreen / reduced motion).
    let disposed = false;
    let isVisible = true;
    let isRunning = false;
    let rafId = 0;
    let lastFrameMs = 0;
    let nextRenderMs = 0;
    let elapsed = 0;
    const frameInterval = targetFps > 0 ? 1000 / targetFps : 1000 / 30;

    let pointerX = 0;
    let pointerY = 0;
    let dragYaw = 0;
    let dragPitch = 0;
    let dragging = false;
    let lastPointerX = 0;
    let lastPointerY = 0;

    const currentPos = new THREE.Vector3(...initialPose.pos);
    const currentLook = new THREE.Vector3(...initialPose.target);
    const desiredPos = new THREE.Vector3();
    const desiredLook = new THREE.Vector3();

    // Runtime FPS degradation guard (two slow windows -> trigger downgrade).
    let slowWindows = 0;
    const frameTimes: number[] = [];

    const renderOnce = () => {
      if (disposed) return;
      camera.lookAt(currentLook);
      renderer.render(scene, camera);
    };

    const stopLoop = () => {
      if (rafId) cancelAnimationFrame(rafId);
      rafId = 0;
      isRunning = false;
      lastFrameMs = 0;
      nextRenderMs = 0;
    };

    const startLoop = () => {
      if (disposed || isRunning || !isVisible || document.hidden) return;
      isRunning = true;
      nextRenderMs = 0;
      lastFrameMs = 0;
      rafId = requestAnimationFrame(tick);
    };

    wakeRef.current = () => {
      if (reducedMotion) {
        const pose = targetPoseRef.current;
        currentPos.set(...pose.pos);
        currentLook.set(...pose.target);
        camera.position.copy(currentPos);
        renderOnce();
        return;
      }
      startLoop();
    };

    const tick = (now: number) => {
      if (disposed || !isVisible || document.hidden) {
        stopLoop();
        return;
      }
      rafId = requestAnimationFrame(tick);

      if (!nextRenderMs) nextRenderMs = now;
      if (now < nextRenderMs) return;
      while (nextRenderMs <= now) nextRenderMs += frameInterval;

      const rawDt = lastFrameMs ? now - lastFrameMs : 16;
      lastFrameMs = now;

      if (onDowngrade && rawDt > 0 && rawDt < 500) {
        frameTimes.push(rawDt);
        if (frameTimes.length >= 24) {
          const sorted = [...frameTimes].sort((a, b) => a - b);
          const median = sorted[Math.floor(sorted.length / 2)];
          frameTimes.length = 0;
          if (median > 42) {
            slowWindows += 1;
            if (slowWindows >= 2) {
              slowWindows = 0;
              onDowngrade();
            }
          } else {
            slowWindows = 0;
          }
        }
      }

      const dt = Math.min(0.05, Math.max(0.001, rawDt / 1000));
      const damp = 1 - Math.exp(-5.2 * dt);

      if (!reducedMotion) {
        elapsed += dt;
        monogramGroup.rotation.y = Math.sin(elapsed * 0.65) * 0.14 + dragYaw * 0.35;
        monogramGroup.position.y = 0.64 + Math.sin(elapsed * 1.05) * 0.032;
        haloMesh.rotation.z = elapsed * 0.08;
        rubyArcMesh.rotation.z = -elapsed * 0.12;
        particles.rotation.y = elapsed * 0.025;
        waterMat.uniforms.uTime.value = elapsed;
      }

      const pose = targetPoseRef.current;
      desiredPos.set(
        pose.pos[0] + pointerX * 0.45 + dragYaw * 1.15,
        pose.pos[1] - pointerY * 0.24 + dragPitch * 0.65,
        pose.pos[2],
      );
      desiredLook.set(pose.target[0] + pointerX * 0.12, pose.target[1] - pointerY * 0.08, pose.target[2]);

      currentPos.lerp(desiredPos, damp);
      currentLook.lerp(desiredLook, damp);
      camera.position.copy(currentPos);
      renderOnce();

      const settled =
        reducedMotion &&
        currentPos.distanceToSquared(desiredPos) < 1e-5 &&
        currentLook.distanceToSquared(desiredLook) < 1e-5;
      if (settled) stopLoop();
    };

    const onPointerMove = (event: PointerEvent) => {
      if (!interactive) return;
      const rect = container.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;
      pointerX = THREE.MathUtils.clamp(((event.clientX - rect.left) / rect.width) * 2 - 1, -1, 1);
      pointerY = THREE.MathUtils.clamp(((event.clientY - rect.top) / rect.height) * 2 - 1, -1, 1);
      if (dragging) {
        const dx = (event.clientX - lastPointerX) / rect.width;
        const dy = (event.clientY - lastPointerY) / rect.height;
        dragYaw = THREE.MathUtils.clamp(dragYaw + dx * 1.8, -0.75, 0.75);
        dragPitch = THREE.MathUtils.clamp(dragPitch + dy * 1.2, -0.32, 0.38);
        lastPointerX = event.clientX;
        lastPointerY = event.clientY;
      }
      if (!reducedMotion) startLoop();
    };

    const onPointerDown = (event: PointerEvent) => {
      if (!interactive || event.button !== 0) return;
      dragging = true;
      lastPointerX = event.clientX;
      lastPointerY = event.clientY;
    };

    const onPointerUp = () => {
      dragging = false;
    };

    const onPointerLeave = () => {
      dragging = false;
      pointerX = 0;
      pointerY = 0;
    };

    if (interactive) {
      container.addEventListener("pointermove", onPointerMove, { passive: true });
      container.addEventListener("pointerdown", onPointerDown, { passive: true });
      window.addEventListener("pointerup", onPointerUp, { passive: true });
      container.addEventListener("pointerleave", onPointerLeave, { passive: true });
    }

    const intersectionObserver = new IntersectionObserver(
      ([entry]) => {
        isVisible = Boolean(entry?.isIntersecting) && document.visibilityState === "visible";
        if (isVisible) {
          if (reducedMotion) renderOnce();
          else startLoop();
        } else {
          stopLoop();
        }
      },
      { threshold: 0.02 },
    );
    intersectionObserver.observe(container);

    const onVisibilityChange = () => {
      const bounds = container.getBoundingClientRect();
      isVisible =
        !document.hidden &&
        bounds.bottom > 0 &&
        bounds.top < window.innerHeight &&
        bounds.right > 0 &&
        bounds.left < window.innerWidth;
      if (isVisible) {
        if (reducedMotion) renderOnce();
        else startLoop();
      } else {
        stopLoop();
      }
    };
    document.addEventListener("visibilitychange", onVisibilityChange);

    let renderedW = width;
    let renderedH = height;
    const resizeObserver = new ResizeObserver(() => {
      const nextW = Math.max(1, container.clientWidth);
      const nextH = Math.max(1, container.clientHeight);
      if (nextW === renderedW && nextH === renderedH) return;
      renderedW = nextW;
      renderedH = nextH;
      camera.aspect = nextW / nextH;
      camera.updateProjectionMatrix();
      renderer.setSize(nextW, nextH);
      if (isVisible || reducedMotion) renderOnce();
    });
    resizeObserver.observe(container);

    const handleContextLost = (event: Event) => {
      event.preventDefault();
      stopLoop();
      onContextLost?.();
    };
    renderer.domElement.addEventListener("webglcontextlost", handleContextLost);

    renderOnce();
    if (!reducedMotion) startLoop();

    return () => {
      disposed = true;
      stopLoop();
      intersectionObserver.disconnect();
      resizeObserver.disconnect();
      document.removeEventListener("visibilitychange", onVisibilityChange);
      if (interactive) {
        container.removeEventListener("pointermove", onPointerMove);
        container.removeEventListener("pointerdown", onPointerDown);
        window.removeEventListener("pointerup", onPointerUp);
        container.removeEventListener("pointerleave", onPointerLeave);
      }
      renderer.domElement.removeEventListener("webglcontextlost", handleContextLost);

      for (const item of disposables) item.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
      if (renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
    };
  }, [tier, effectiveDpr, particleMultiplier, targetFps, reducedMotion, interactive, onDowngrade, onContextLost]);

  return (
    <div
      ref={containerRef}
      className={`sydney-night-canvas ${className}`.trim()}
      aria-hidden="true"
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        overflow: "hidden",
      }}
    />
  );
}
