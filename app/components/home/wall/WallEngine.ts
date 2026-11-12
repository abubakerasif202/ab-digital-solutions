import type {
  Group,
  PerspectiveCamera,
  ShaderMaterial,
  Texture,
  WebGLRenderer,
} from "three";
import { buildEdgeCanvas } from "./edge-map";
import { wallFragmentShader, wallVertexShader } from "./wall-shader";

export type WallProject = {
  slug: string;
  name: string;
  image: string;
  sector: string;
  stack: readonly string[];
};

export type WallOptions = {
  canvas: HTMLCanvasElement;
  projects: readonly WallProject[];
  reducedMotion: boolean;
  mobile: boolean;
  signal?: AbortSignal;
  /** Lens centre and the wall's top-left corner in CSS pixels, for the DOM inspector readout. */
  onLens: (x: number, y: number, active: boolean, cornerX: number, cornerY: number, radiusPx: number) => void;
  onReady: () => void;
  onLost: () => void;
};

export type WallEngine = {
  setFocus: (index: number) => void;
  /** blend: 0 = hero composition, 1 = work-list composition. */
  setScroll: (blend: number) => void;
  setPointer: (clientX: number, clientY: number, active: boolean) => void;
  pulse: () => void;
  setVisible: (visible: boolean) => void;
  setMotion: (reduced: boolean, paused: boolean) => void;
  dispose: () => void;
};

type Tex = { color: Texture; edge: Texture };
type Spring = { x: number; v: number };

const IMAGE_ASPECT = 926 / 1348; // authentic portfolio captures are 1348 x 926
const WALL_W = 6;
const WALL_H = WALL_W * IMAGE_ASPECT;
const TRANSITION_SECONDS = 1.3;
const MAX_CACHED = 5;

type Placement = { w: number; x: number; y: number; rotX: number; rotY: number; rotZ: number; dim: number };

// Hero and work-list compositions for landscape and portrait viewports.
const PLACEMENTS = {
  landscape: {
    hero: { w: 0.5, x: 0.245, y: -0.03, rotX: 0.09, rotY: -0.34, rotZ: -0.02, dim: 1 },
    work: { w: 0.4, x: 0.255, y: 0.0, rotX: 0.06, rotY: -0.32, rotZ: 0.0, dim: 0.62 },
  },
  portrait: {
    hero: { w: 0.94, x: 0.0, y: -0.335, rotX: 0.2, rotY: -0.2, rotZ: -0.025, dim: 0.9 },
    work: { w: 1.1, x: 0.0, y: 0.04, rotX: 0.1, rotY: -0.3, rotZ: 0.0, dim: 0.55 },
  },
} as const satisfies Record<string, Record<string, Placement>>;

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function step(spring: Spring, target: number, dt: number, stiffness = 120, damping = 20): void {
  spring.v += ((target - spring.x) * stiffness - spring.v * damping) * dt;
  spring.x += spring.v * dt;
}

function loadImage(src: string, signal: AbortSignal): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    const cleanup = (): void => {
      image.onload = null;
      image.onerror = null;
      signal.removeEventListener("abort", abort);
    };
    const abort = (): void => {
      cleanup();
      image.removeAttribute("src");
      reject(new DOMException("Wall loading cancelled", "AbortError"));
    };
    if (signal.aborted) { abort(); return; }
    image.decoding = "async";
    image.onload = () => { cleanup(); resolve(image); };
    image.onerror = () => { cleanup(); reject(new Error(`wall: could not load ${src}`)); };
    signal.addEventListener("abort", abort, { once: true });
    image.src = src;
  });
}

export async function createWallEngine(options: WallOptions): Promise<WallEngine> {
  const THREE = await import("three");
  const { canvas, projects, mobile } = options;
  if (options.signal?.aborted) throw new DOMException("Wall loading cancelled", "AbortError");
  let reducedMotion = options.reducedMotion;
  let paused = false;
  let contextLost = false;
  let readyReported = false;
  let warmIdle = 0;
  let warmTimer = 0;
  let secondWarmTimer = 0;
  let pulseTimer = 0;
  const loadingController = new AbortController();

  const renderer: WebGLRenderer = new THREE.WebGLRenderer({
    canvas,
    antialias: !mobile,
    alpha: false,
    powerPreference: "high-performance",
  });
  renderer.setClearColor(0x07080a, 1);
  let dpr = Math.min(window.devicePixelRatio || 1, mobile ? 1.5 : 1.75);
  renderer.setPixelRatio(dpr);

  const scene = new THREE.Scene();
  const camera: PerspectiveCamera = new THREE.PerspectiveCamera(32, 1, 0.1, 60);
  camera.position.set(0, 0, 9);
  const wall: Group = new THREE.Group();
  scene.add(wall);

  // ---- Geometry: one instanced plane, one attribute pair per tile.
  const cols = mobile ? 20 : 30;
  const rows = mobile ? 14 : 21;
  const count = cols * rows;
  const base = new THREE.PlaneGeometry(1, 1);
  const geometry = new THREE.InstancedBufferGeometry();
  geometry.index = base.index;
  geometry.setAttribute("position", base.getAttribute("position"));
  geometry.setAttribute("uv", base.getAttribute("uv"));
  const cells = new Float32Array(count * 2);
  const rands = new Float32Array(count);
  for (let r = 0; r < rows; r += 1) {
    for (let c = 0; c < cols; c += 1) {
      const i = r * cols + c;
      cells[i * 2] = c;
      cells[i * 2 + 1] = r;
      // Deterministic per-tile jitter so the wall looks the same on every visit.
      rands[i] = ((Math.sin(i * 12.9898) * 43758.5453) % 1 + 1) % 1;
    }
  }
  geometry.setAttribute("aCell", new THREE.InstancedBufferAttribute(cells, 2));
  geometry.setAttribute("aRand", new THREE.InstancedBufferAttribute(rands, 1));
  geometry.instanceCount = count;

  const placeholder = new THREE.DataTexture(new Uint8Array([7, 8, 10, 255]), 1, 1);
  placeholder.needsUpdate = true;

  const material: ShaderMaterial = new THREE.ShaderMaterial({
    vertexShader: wallVertexShader,
    fragmentShader: wallFragmentShader,
    side: THREE.DoubleSide,
    uniforms: {
      uColA: { value: placeholder },
      uEdgeA: { value: placeholder },
      uColB: { value: placeholder },
      uEdgeB: { value: placeholder },
      uGrid: { value: new THREE.Vector2(cols, rows) },
      uWall: { value: new THREE.Vector2(WALL_W, WALL_H) },
      uPointer: { value: new THREE.Vector3(0, 0, 0) },
      uLensR: { value: WALL_H * 0.27 },
      uTime: { value: 0 },
      uTrans: { value: 0 },
      uRipple: { value: new THREE.Vector3(0, 0, -1) },
      uBreath: { value: reducedMotion ? 0 : 1 },
      uFlipOn: { value: reducedMotion ? 0 : 1 },
      uDim: { value: 1 },
      uAccent: { value: new THREE.Color("#ff4d2e") },
      uSteel: { value: new THREE.Color("#8fb0d8") },
      uVoid: { value: new THREE.Color("#07080a") },
    },
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.frustumCulled = false;
  wall.add(mesh);

  const uniforms = material.uniforms;

  // ---- Textures: a small LRU, current and target are never evicted.
  const cache = new Map<number, Tex>();
  const loading = new Map<number, Promise<Tex | null>>();
  let current = 0;
  let target = -1;
  let desired = 0;

  function evict(): void {
    if (cache.size <= MAX_CACHED) return;
    for (const key of cache.keys()) {
      if (key === current || key === target || key === desired) continue;
      const tex = cache.get(key);
      tex?.color.dispose();
      tex?.edge.dispose();
      cache.delete(key);
      if (cache.size <= MAX_CACHED) return;
    }
  }

  function ensure(index: number): Promise<Tex | null> {
    if (disposed || index < 0 || index >= projects.length) return Promise.resolve(null);
    const hit = cache.get(index);
    if (hit) return Promise.resolve(hit);
    const pending = loading.get(index);
    if (pending) return pending;
    const job = (async (): Promise<Tex | null> => {
      try {
        const image = await loadImage(projects[index].image, loadingController.signal);
        if (disposed) return null;
        const color = new THREE.Texture(image);
        color.colorSpace = THREE.SRGBColorSpace;
        color.anisotropy = Math.min(4, renderer.capabilities.getMaxAnisotropy());
        color.needsUpdate = true;
        const edge = new THREE.CanvasTexture(buildEdgeCanvas(image, image.naturalWidth, image.naturalHeight));
        edge.colorSpace = THREE.NoColorSpace;
        edge.generateMipmaps = false;
        edge.minFilter = THREE.LinearFilter;
        edge.needsUpdate = true;
        const tex: Tex = { color, edge };
        cache.set(index, tex);
        evict();
        return tex;
      } catch {
        return null;
      } finally {
        loading.delete(index);
      }
    })();
    loading.set(index, job);
    return job;
  }

  // ---- Motion state.
  let disposed = false;
  let running = false;
  let visible = true;
  let rafId = 0;
  let last = 0;
  let clock = 0;
  let wake = 0; // keeps the loop alive for a moment in reduced-motion mode
  let transClock = -1;
  let rippleAge = -1;
  let blendTarget = 0;
  const blend: Spring = { x: 0, v: 0 };
  const parallaxX: Spring = { x: 0, v: 0 };
  const parallaxY: Spring = { x: 0, v: 0 };
  const lensX: Spring = { x: WALL_W * 0.12, v: 0 };
  const lensY: Spring = { x: 0, v: 0 };
  const strength: Spring = { x: 0, v: 0 };
  const radius: Spring = { x: WALL_H * 0.27, v: 0 };
  let pointerActive = false;
  let pointerLastAt = -10;
  let pointerNdcX = 0;
  let pointerNdcY = 0;
  let pressed = false;

  const raycaster = new THREE.Raycaster();
  const plane = new THREE.Plane();
  const hit = new THREE.Vector3();
  const normal = new THREE.Vector3();
  const lensWorld = new THREE.Vector3();
  const ndc = new THREE.Vector2();

  function beginTransition(index: number, tex: Tex): void {
    target = index;
    uniforms.uColB.value = tex.color;
    uniforms.uEdgeB.value = tex.edge;
    uniforms.uTrans.value = 0;
    transClock = 0;
    uniforms.uRipple.value.set(lensX.x, lensY.x, reducedMotion ? -1 : 0);
    rippleAge = reducedMotion ? -1 : 0;
    nudge();
  }

  function finishTransition(): void {
    const b = cache.get(target);
    if (b) {
      uniforms.uColA.value = b.color;
      uniforms.uEdgeA.value = b.edge;
    }
    current = target;
    target = -1;
    transClock = -1;
    uniforms.uTrans.value = 0;
    pump();
  }

  function pump(): void {
    if (disposed || transClock >= 0 || desired === current) return;
    const tex = cache.get(desired);
    if (tex) {
      beginTransition(desired, tex);
      return;
    }
    void ensure(desired).then((loaded) => {
      if (disposed || !loaded) return;
      pump();
    });
  }

  function nudge(): void {
    wake = 1.4;
    if (!running && visible && !disposed) start();
  }

  function placement(): Placement {
    const set = window.innerWidth / window.innerHeight < 0.95 ? PLACEMENTS.portrait : PLACEMENTS.landscape;
    const t = clamp(blend.x, 0, 1);
    const a: Placement = set.hero;
    const b: Placement = set.work;
    return {
      w: lerp(a.w, b.w, t), x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t),
      rotX: lerp(a.rotX, b.rotX, t), rotY: lerp(a.rotY, b.rotY, t), rotZ: lerp(a.rotZ, b.rotZ, t),
      dim: lerp(a.dim, b.dim, t),
    };
  }

  function layout(): void {
    const p = placement();
    const visibleHeight = 2 * camera.position.z * Math.tan((camera.fov * Math.PI) / 360);
    const visibleWidth = visibleHeight * camera.aspect;
    const scale = Math.min((p.w * visibleWidth) / WALL_W, (0.8 * visibleHeight) / WALL_H);
    wall.scale.setScalar(scale);
    wall.position.set(p.x * visibleWidth, p.y * visibleHeight, 0);
    wall.rotation.set(p.rotX - parallaxY.x * 0.07, p.rotY + parallaxX.x * 0.09, p.rotZ);
    uniforms.uDim.value = p.dim;
    wall.updateMatrixWorld(true);
  }

  function resize(): void {
    const width = Math.max(1, canvas.clientWidth);
    const height = Math.max(1, canvas.clientHeight);
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    nudge();
  }

  function frame(now: number): void {
    rafId = 0;
    if (!running || disposed || !canvas.isConnected) {
      running = false;
      return;
    }
    const dt = Math.min(0.05, Math.max(0.001, (now - last) / 1000));
    last = now;
    clock += dt;
    if (wake > 0) wake -= dt;

    // Layout springs.
    step(blend, blendTarget, dt, 70, 17);
    step(parallaxX, pointerActive && !reducedMotion && !paused ? pointerNdcX : 0, dt, 40, 10);
    step(parallaxY, pointerActive && !reducedMotion && !paused ? pointerNdcY : 0, dt, 40, 10);
    layout();

    // Lens: follow the pointer, or drift on its own when idle.
    const idle = !pointerActive && clock - pointerLastAt > 1.6;
    let goalX = lensX.x;
    let goalY = lensY.x;
    if (pointerActive) {
      raycaster.setFromCamera(ndc.set(pointerNdcX, pointerNdcY), camera);
      normal.set(0, 0, 1).applyQuaternion(wall.quaternion);
      plane.setFromNormalAndCoplanarPoint(normal, wall.position);
      if (raycaster.ray.intersectPlane(plane, hit)) {
        wall.worldToLocal(hit);
        goalX = clamp(hit.x, -WALL_W * 0.52, WALL_W * 0.52);
        goalY = clamp(hit.y, -WALL_H * 0.52, WALL_H * 0.52);
      }
    } else if (idle && !reducedMotion && !paused) {
      goalX = Math.sin(clock * 0.42) * WALL_W * 0.3;
      goalY = Math.sin(clock * 0.57 + 1.3) * WALL_H * 0.27;
    } else if (idle && reducedMotion) {
      goalX = WALL_W * 0.12;
      goalY = WALL_H * 0.04;
    }
    step(lensX, goalX, dt, 90, 17);
    step(lensY, goalY, dt, 90, 17);
    step(radius, WALL_H * 0.27 * (pressed ? 1.3 : 1), dt, 110, 16);
    step(strength, visible ? 1 : 0, dt, 30, 9);

    // Transition and ripple clocks.
    if (transClock >= 0) {
      transClock += dt;
      const progress = Math.min(1, transClock / (reducedMotion || paused ? 0.05 : TRANSITION_SECONDS));
      uniforms.uTrans.value = progress;
      if (progress >= 1) finishTransition();
    }
    if (rippleAge >= 0) {
      rippleAge += dt;
      uniforms.uRipple.value.z = rippleAge;
      if (rippleAge > 2.6) {
        rippleAge = -1;
        uniforms.uRipple.value.z = -1;
      }
    }

    uniforms.uTime.value = clock;
    uniforms.uPointer.value.set(lensX.x, lensY.x, clamp(strength.x, 0, 1));
    uniforms.uLensR.value = radius.x;

    // DOM readout follows the lens.
    lensWorld.set(lensX.x, lensY.x, 0.25);
    wall.localToWorld(lensWorld);
    lensWorld.project(camera);
    const lensScreenX = (lensWorld.x * 0.5 + 0.5) * canvas.clientWidth;
    const lensScreenY = (-lensWorld.y * 0.5 + 0.5) * canvas.clientHeight;
    lensWorld.set(lensX.x + radius.x, lensY.x, 0.25);
    wall.localToWorld(lensWorld);
    lensWorld.project(camera);
    const radiusPx = Math.hypot(
      (lensWorld.x * 0.5 + 0.5) * canvas.clientWidth - lensScreenX,
      (-lensWorld.y * 0.5 + 0.5) * canvas.clientHeight - lensScreenY,
    );
    lensWorld.set(-WALL_W / 2, WALL_H / 2, 0);
    wall.localToWorld(lensWorld);
    lensWorld.project(camera);
    options.onLens(
      lensScreenX,
      lensScreenY,
      strength.x > 0.5,
      (lensWorld.x * 0.5 + 0.5) * canvas.clientWidth,
      (-lensWorld.y * 0.5 + 0.5) * canvas.clientHeight,
      radiusPx,
    );

    renderer.render(scene, camera);
    if (!readyReported && !contextLost) {
      readyReported = true;
      options.onReady();
    }

    // Adaptive pixel ratio: shed resolution before dropping frames.
    if (clock > 2 && dt > 0.026 && dpr > 1.0) {
      dpr = Math.max(1, dpr - 0.25);
      renderer.setPixelRatio(dpr);
      resize();
    }

    const settled = (reducedMotion || paused) && wake <= 0 && transClock < 0 && rippleAge < 0;
    if (settled) {
      running = false;
      return;
    }
    rafId = requestAnimationFrame(frame);
  }

  function start(): void {
    if (running || disposed || contextLost || !visible || document.hidden || !canvas.isConnected) return;
    running = true;
    last = performance.now();
    rafId = requestAnimationFrame(frame);
  }

  function stop(): void {
    running = false;
    if (rafId) cancelAnimationFrame(rafId);
    rafId = 0;
  }

  const onVisibility = (): void => {
    if (document.hidden) stop();
    else if (visible) start();
  };
  const onLost = (event: Event): void => {
    event.preventDefault();
    contextLost = true;
    readyReported = false;
    stop();
    options.onLost();
  };
  const onRestored = (): void => {
    if (disposed) return;
    contextLost = false;
    resize();
    nudge();
  };
  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(canvas);
  document.addEventListener("visibilitychange", onVisibility);
  canvas.addEventListener("webglcontextlost", onLost);
  canvas.addEventListener("webglcontextrestored", onRestored);

  function dispose(): void {
    if (disposed) return;
    disposed = true;
    stop();
    loadingController.abort();
    if (warmIdle) window.cancelIdleCallback(warmIdle);
    window.clearTimeout(warmTimer);
    window.clearTimeout(secondWarmTimer);
    window.clearTimeout(pulseTimer);
    resizeObserver.disconnect();
    document.removeEventListener("visibilitychange", onVisibility);
    canvas.removeEventListener("webglcontextlost", onLost);
    canvas.removeEventListener("webglcontextrestored", onRestored);
    options.signal?.removeEventListener("abort", dispose);
    cache.forEach((tex) => { tex.color.dispose(); tex.edge.dispose(); });
    cache.clear();
    placeholder.dispose();
    base.dispose();
    geometry.dispose();
    material.dispose();
    renderer.dispose();
  }
  options.signal?.addEventListener("abort", dispose, { once: true });
  if (options.signal?.aborted) dispose();

  const inactive: WallEngine = {
    setFocus() {}, setScroll() {}, setPointer() {}, pulse() {}, setVisible() {}, setMotion() {}, dispose,
  };

  // First project must be on the GPU before the canvas is revealed.
  const first = await ensure(0);
  if (disposed) return inactive;
  if (!first) {
    options.onLost();
    dispose();
    return inactive;
  }
  uniforms.uColA.value = first.color;
  uniforms.uEdgeA.value = first.edge;
  uniforms.uColB.value = first.color;
  uniforms.uEdgeB.value = first.edge;
  resize();
  layout();
  start();

  // Warm the next two projects while the visitor reads the headline.
  const warm = (): void => {
    if (disposed) return;
    void ensure(1);
    secondWarmTimer = window.setTimeout(() => void ensure(2), 1200);
  };
  if (typeof window.requestIdleCallback === "function") warmIdle = window.requestIdleCallback(warm, { timeout: 2500 });
  else warmTimer = window.setTimeout(warm, 1500);

  return {
    setFocus(index: number): void {
      if (index < 0 || index >= projects.length) return;
      desired = index;
      pump();
    },
    setScroll(value: number): void {
      blendTarget = clamp(value, 0, 1);
      nudge();
    },
    setPointer(clientX: number, clientY: number, active: boolean): void {
      pointerActive = active;
      pressed = active && pressed;
      if (active) {
        pointerLastAt = clock;
        pointerNdcX = (clientX / Math.max(1, window.innerWidth)) * 2 - 1;
        pointerNdcY = -((clientY / Math.max(1, window.innerHeight)) * 2 - 1);
      }
      nudge();
    },
    pulse(): void {
      if (reducedMotion || paused || transClock >= 0) return;
      uniforms.uRipple.value.set(lensX.x, lensY.x, 0);
      rippleAge = 0;
      pressed = true;
      window.clearTimeout(pulseTimer);
      pulseTimer = window.setTimeout(() => {
        pressed = false;
      }, 220);
      nudge();
    },
    setVisible(value: boolean): void {
      visible = value;
      if (value && !document.hidden) start();
      else stop();
    },
    setMotion(reduced: boolean, pause: boolean): void {
      reducedMotion = reduced;
      paused = pause;
      uniforms.uBreath.value = reduced || pause ? 0 : 1;
      uniforms.uFlipOn.value = reduced || pause ? 0 : 1;
      if (reduced || pause) {
        rippleAge = -1;
        uniforms.uRipple.value.z = -1;
        pressed = false;
        window.clearTimeout(pulseTimer);
      }
      nudge();
    },
    dispose,
  };
}
