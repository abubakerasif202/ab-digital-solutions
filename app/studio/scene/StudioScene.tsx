"use client";

import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState, type ReactNode, type RefObject } from "react";
import { Canvas, useFrame, useLoader, useThree } from "@react-three/fiber";
import { OrbitControls, useTexture } from "@react-three/drei";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import * as THREE from "three";
import { createStudioEnvironment, StudioEnvironmentLoader } from "./environment";
import { MaterialLibrary } from "./Materials";
import { cameraFov, cameraProgress, cameraFieldOfView, facadeWaypoint, panelFrameOffset } from "./camera-motion";
import { Architecture } from "./Architecture";
import { environmentUrl, monogramUrl, screenTextureUrl } from "../studio-assets";
import { Consultation, Gallery, galleryWindowStart, HotspotPortalContext, HotspotsHiddenContext, Reception, Services } from "./Spaces";
import { useStudioModel } from "./load-model";
import { Facade, Ground } from "./Facade";
import { useSceneClock } from "../world/SceneClock";
import { SceneClock } from "../world/SceneClock";
import { nextWarmupPhase, warmupPhases, prepareWarmupStage, yieldToBrowser, type StudioPhase } from "./warmup";
import { compileStageShaders } from "./shader-warmup";
import { Landmarks, skyFog } from "../world/Landmarks";
import { mobileWildlifeShots, wildlifeShots } from "../world/sim/wildlife";
import { Receptionist } from "../world/characters/Receptionist";
import { StudioStaff } from "../world/characters/StudioStaff";
import { worldState } from "../world/worldState";
import { ARRIVAL_SECONDS, GREET_AT, SUMMON_KANGAROO_AT, arrivalPose } from "../world/sim/arrival";
import { canvasPixelRatio, pickTier, readRuntimeCapabilities, stepDownTier } from "../world/sim/quality";
import type { Area, StudioState } from "../studio-state";
import type { StudioProject } from "../studio-data";

const loadWildlife = () => import("../world/wildlife/Wildlife");
const loadExterior = () => import("../world/Exterior");
const loadTraffic = () => import("../world/Traffic");
const loadPedestrians = () => import("../world/Pedestrians");

const Wildlife = lazy(() => loadWildlife().then((module) => ({ default: module.Wildlife })));
const Exterior = lazy(() => loadExterior().then((module) => ({ default: module.Exterior })));
const Traffic = lazy(() => loadTraffic().then((module) => ({ default: module.Traffic })));
const Pedestrians = lazy(() => loadPedestrians().then((module) => ({ default: module.Pedestrians })));

// Triggered once the visitor actually enters the 3D studio (never merely by preloading this JS chunk).
function preloadCoreStudioAssets() {
  useStudioModel.preload(monogramUrl);
  useLoader.preload(StudioEnvironmentLoader, environmentUrl);
}

const shots: Record<Area, { position: [number,number,number]; target: [number,number,number] }> = {
  reception: { position: [-1.4,1.85,6.8], target: [-5.8,1.35,2.9] },
  gallery: { position: [-1,2.3,1], target: [-5,1.8,-5] },
  // Frontal view of all four pedestals (x 2.2 to 8.8), clear of the lounge chairs behind the camera.
  services: { position: [5.5,2.3,1.9], target: [5.5,1.35,-4.4] },
  // Pulled back and raised so the table, chairs and the harbour view read together.
  consultation: { position: [1.6,2.5,8.4], target: [5.6,1.1,4.3] },
};

const mobileShots: typeof shots = {
  reception: { position: [-.5,1.8,8.2], target: [-5,1.9,3] },
  gallery: { position: [-5,1.75,1], target: [-5,1.8,-5] },
  services: { position: [5.5,2.6,2.35], target: [5.5,1.5,-4.25] },
  consultation: { position: [2.5,1.8,7.5], target: [5.6,1.5,4.3] },
};

const entranceShot = { position: [-.5, 2.3, 16.8] as [number,number,number], target: [-.5, 2.4, 9] as [number,number,number] };
const mobileEntranceShot = { position: [-.5, 2.1, 18] as [number,number,number], target: [-.5, 2.2, 9] as [number,number,number] };
const welcomeShot = { position: [-1.4, 1.62, 6.6] as [number,number,number], target: [-5.8, 1.85, 2.9] as [number,number,number] };
const mapShot = { position: [8, 18, 23] as [number,number,number], target: [0, 1.1, 0] as [number,number,number] };
const portraitMapShot = { position: [3, 34, 18] as [number,number,number], target: [0, 1.1, 0] as [number,number,number] };
const overviewShot = { position: [10.5, 8.2, 14.5] as [number,number,number], target: [0, 1.4, 1] as [number,number,number] };

// Three's scene is an imperative GPU resource, not React state.
function attachEnvironment(scene: THREE.Scene, texture: THREE.Texture) {
  const previous = scene.environment;
  scene.environment = texture;
  scene.environmentIntensity = .6;
  return () => { scene.environment = previous; };
}

function Lighting({ onReady }: { onReady: () => void }) {
  const { gl, scene, invalidate } = useThree();
  const buffer = useLoader(StudioEnvironmentLoader, environmentUrl);
  const texture = useMemo(() => {
    if (!(buffer instanceof ArrayBuffer)) throw new Error("Invalid Studio environment response");
    return createStudioEnvironment(buffer);
  }, [buffer]);
  useEffect(() => {
    const detach = attachEnvironment(scene, texture);
    onReady();
    invalidate();
    return () => { detach(); texture.dispose(); };
  }, [gl, scene, texture, invalidate, onReady]);
  return <>
    <ambientLight intensity={.34} color="#7e8cb0" />
    <directionalLight position={[3,12,8]} intensity={1.7} color="#ffe0a6" />
    <directionalLight position={[-8,8,-12]} intensity={.85} color="#7695c4" />
    <pointLight position={[-5,4,3]} intensity={24} distance={10} color="#ffd08a" />
    <pointLight position={[5,4,-4]} intensity={20} distance={10} color="#ffc67b" />
    <pointLight position={[5.4,3.4,-6.8]} intensity={12} distance={9.5} color="#c8173a" />
    <pointLight position={[5.6,3.5,4.3]} intensity={20} distance={9} color="#ffdca5" />
  </>;
}

function setLens(camera: THREE.Camera, fov: number) {
  if (camera instanceof THREE.PerspectiveCamera) { camera.fov = fov; camera.updateProjectionMatrix(); }
}

function applyCameraLens(camera: THREE.PerspectiveCamera, fov: number, width: number, height: number, x: number, y: number) {
  const lensChanged = camera.fov !== fov;
  camera.fov = fov;
  const view = camera.view;
  if ((x || y) && (!view?.enabled || view.offsetX !== x * width || view.offsetY !== y * height || view.fullWidth !== width || view.fullHeight !== height)) {
    camera.setViewOffset(width, height, x * width, y * height, width, height);
  } else if (!x && !y && view?.enabled) camera.clearViewOffset();
  else if (lensChanged) camera.updateProjectionMatrix();
}

function CameraRig({ state, mapOpen, visible, onManual, onArrive, onGreet }: { state: StudioState; mapOpen: boolean; visible: boolean; onManual: () => void; onArrive: () => void; onGreet: () => void }) {
  const controls = useRef<OrbitControlsImpl>(null);
  const { invalidate, camera, size, gl } = useThree();
  const mobile = size.width < 700 || matchMedia("(max-width: 999px) and (max-height: 500px) and (orientation: landscape)").matches;
  const portrait = matchMedia("(orientation: portrait)").matches;
  const baseFov = cameraFieldOfView(mobile, portrait);
  const moving = useRef(true);
  const targetPosition = useRef(new THREE.Vector3());
  const targetLook = useRef(new THREE.Vector3());
  const startPosition = useRef(new THREE.Vector3());
  const doorway = useRef<THREE.Vector3 | null>(null);
  const startLook = useRef(new THREE.Vector3());
  const started = useRef(0);
  const arrivalStart = useRef(0);
  const arrivalFlags = useRef({ summoned: false, greeted: false, done: false });
  const startFov = useRef(baseFov);
  const targetFov = useRef(baseFov);
  const startLens = useRef(new THREE.Vector2());
  const targetLens = useRef(new THREE.Vector2());
  const arriving = state.mode === "arrival";
  // Orbit limits suit hands-on exploration only: cinematic moves must not be clamped toward their far targets.
  const limit = (free: boolean) => {
    const c = controls.current;
    if (!c) return;
    c.minDistance = free ? 0 : state.animal ? 1.2 : mobile ? 2.5 : 5;
    c.maxDistance = free ? 1e4 : 48;
    c.minPolarAngle = free ? 0 : .3;
    c.maxPolarAngle = free ? Math.PI : mobile ? 1.8 : Math.PI / 2.08;
  };
  useEffect(() => {
    if (state.mode === "arrival") {
      arrivalStart.current = performance.now();
      arrivalFlags.current = { summoned: false, greeted: false, done: false };
      invalidate();
      return;
    }
    // Show the whole cutaway for orientation. Room and street shots take over on selection.
    const overview = (state.mode === "loading" && !state.resume) || (state.overview && !state.panel && !state.tour && !state.outside && state.mode !== "intro");
    const mapping = mapOpen && overview;
    const narrowMap = size.width < size.height;
    let shot = mobile ? mobileShots[state.area] : overview ? overviewShot : shots[state.area];
    if (mapping) shot = narrowMap ? portraitMapShot : mapShot;
    if (state.mode === "loading" && !state.resume) { const first = arrivalPose(0, mobile && portrait, baseFov); shot = { position: first.position, target: first.target }; }
    else if (state.mode === "intro") shot = mobile ? mobileShots.reception : welcomeShot;
    else if (state.outside) shot = mobile ? mobileEntranceShot : entranceShot;
    if (state.animal && state.mode !== "loading" && state.mode !== "intro") shot = (mobile ? mobileWildlifeShots : wildlifeShots)[state.animal];
    if (camera instanceof THREE.PerspectiveCamera) {
      startFov.current = camera.fov;
      targetFov.current = mapping ? (narrowMap ? 82 : 48)
        : cameraFieldOfView(mobile, portrait, state.mode === "explore" && state.area === "services" && state.panel && !state.outside && !state.animal);
      const view = camera.view;
      startLens.current.set(view?.enabled ? view.offsetX / view.fullWidth : 0, view?.enabled ? view.offsetY / view.fullHeight : 0);
      // Frame the room beside the desktop panel. On mobile the details sit below the scene, so no offset is needed.
      targetLens.current.set(panelFrameOffset(size.width, state.panel, matchMedia("(max-width: 899px), (max-height: 500px) and (orientation: landscape)").matches), 0);
    }
    targetPosition.current.set(...shot.position);
    targetLook.current.set(...shot.target);
    startPosition.current.copy(camera.position);
    const waypoint = facadeWaypoint(camera.position.toArray(), shot.position);
    doorway.current = waypoint ? new THREE.Vector3(...waypoint) : null;
    startLook.current.copy(controls.current?.target ?? new THREE.Vector3());
    started.current = performance.now();
    moving.current = true;
    invalidate();
  }, [state.area, state.animal, state.shot, state.mode, state.panel, state.tour, state.outside, state.overview, state.resume, mapOpen, size.width, size.height, mobile, portrait, baseFov, visible, camera, invalidate]);
  useFrame(() => {
    const visitor = worldState.visitor;
    visitor.x = camera.position.x; visitor.y = camera.position.y; visitor.z = camera.position.z;
    visitor.inReception = camera.position.x > -8.5 && camera.position.x < -1.2 && camera.position.z > .9 && camera.position.z < 9;
    if (!visible || !controls.current) return;
    // Development-only hook so QA can frame any character or prop exactly; stripped from production builds.
    if (process.env.NODE_ENV !== "production") {
      const shot = (window as unknown as { __abStudioShot?: { position: [number, number, number]; target: [number, number, number]; fov?: number } }).__abStudioShot;
      if (shot) {
        limit(true);
        camera.position.set(...shot.position);
        controls.current.target.set(...shot.target);
        if (shot.fov) setLens(camera, shot.fov);
        controls.current.update();
        invalidate();
        return;
      }
    }
    if (arriving || state.mode === "loading") limit(true);
    if (arriving) {
      let seconds = (performance.now() - arrivalStart.current) / 1000;
      // Development-only hook so QA can freeze the film at an exact second; stripped from production builds.
      if (process.env.NODE_ENV !== "production") {
        const frozen = (window as unknown as { __abArrivalSeconds?: number }).__abArrivalSeconds;
        if (typeof frozen === "number") seconds = frozen;
      }
      const flags = arrivalFlags.current;
      if (!flags.summoned && seconds >= SUMMON_KANGAROO_AT) { flags.summoned = true; worldState.kangaroo.summon = true; }
      if (!flags.greeted && seconds >= GREET_AT) { flags.greeted = true; onGreet(); }
      const pose = arrivalPose(seconds, mobile && portrait, baseFov);
      camera.position.set(...pose.position);
      controls.current.target.set(...pose.target);
      if (camera instanceof THREE.PerspectiveCamera && Math.abs(camera.fov - pose.fov) > .01) setLens(camera, pose.fov);
      controls.current.update();
      if (seconds >= ARRIVAL_SECONDS && !flags.done) { flags.done = true; onArrive(); }
      invalidate();
      return;
    }
    if (state.manual || !moving.current) return;
    limit(true);
    // Wall-clock progress keeps a cinematic move bounded on slower GPUs too.
    const progress = Math.min(1, (performance.now() - started.current) / (doorway.current ? 2150 : 1700));
    const eased = cameraProgress(progress);
    const door = doorway.current;
    if (!door) camera.position.lerpVectors(startPosition.current, targetPosition.current, eased);
    else if (progress < .5) camera.position.lerpVectors(startPosition.current, door, cameraProgress(progress * 2));
    else camera.position.lerpVectors(door, targetPosition.current, cameraProgress(progress * 2 - 1));
    controls.current.target.lerpVectors(startLook.current, targetLook.current, eased);
    if (camera instanceof THREE.PerspectiveCamera) {
      const x = THREE.MathUtils.lerp(startLens.current.x, targetLens.current.x, eased);
      const y = THREE.MathUtils.lerp(startLens.current.y, targetLens.current.y, eased);
      const fov = cameraFov(startFov.current, targetFov.current, progress);
      applyCameraLens(camera, fov, size.width, size.height, x, y);
    }
    controls.current.update();
    moving.current = progress < 1;
    if (moving.current) invalidate(); else limit(false);
  });
  return <OrbitControls ref={controls} domElement={gl.domElement} makeDefault enableDamping={!arriving && state.manual} dampingFactor={0.085} enablePan={false} enableZoom rotateSpeed={.55} zoomSpeed={.7} enabled={visible && !arriving} onStart={onManual} />;
}

function GoldDust({ animate }: { animate: boolean }) {
  const ref = useRef<THREE.Points>(null);
  const { scheduler } = useSceneClock();
  const positions = useMemo(() => Float32Array.from({ length: 192 }, (_, i) => Math.sin(i * 127.1 + 19) * (i % 3 === 1 ? 2 : 10) + (i % 3 === 1 ? 3 : 0)), []);
  useEffect(() => {
    if (!animate) return;
    return scheduler.add("gold-dust", (dt) => {
      if (ref.current) ref.current.rotation.y += Math.min(dt, 0.05) * 0.03;
    });
  }, [animate, scheduler]);
  return <points ref={ref}><bufferGeometry><bufferAttribute attach="attributes-position" args={[positions,3]} /></bufferGeometry><pointsMaterial color="#e5c67e" size={.036} transparent opacity={.52} depthWrite={false} /></points>;
}

// Each committed stage renders before yielding construction of the next system.
// Arrival starts only after every system visible in the film is ready.
type WarmupCallbacks = { environmentReady: boolean; onFailure: () => void };
function StudioWarmup({ phase, onPhase, onReady, environmentReady, onFailure, group }: { phase: StudioPhase; onPhase: (phase: StudioPhase) => void; onReady: () => void; group: RefObject<THREE.Group | null> } & WarmupCallbacks) {
  const { gl, camera, scene, invalidate } = useThree();
  useEffect(() => {
    const root = group.current;
    if (phase === "done" || !environmentReady || !root) return;
    let cancelCompilation = () => {};
    return prepareWarmupStage({
      compile: () => {
        const compilation = compileStageShaders(gl, root, camera, scene);
        cancelCompilation = compilation.cancel;
        return compilation.ready;
      },
      cancelCompile: () => cancelCompilation(),
      reveal: () => { root.visible = true; invalidate(); },
      onFailure,
      advance: () => {
        const next = nextWarmupPhase(phase);
        onPhase(next);
        if (next === "done") {
          invalidate();
          onReady();
        }
      },
      yieldTask: () => {
        const scheduler = (globalThis as typeof globalThis & { scheduler?: { yield: () => Promise<void> } }).scheduler;
        return yieldToBrowser(scheduler);
      },
    });
  }, [phase, environmentReady, group, gl, camera, scene, invalidate, onPhase, onReady, onFailure]);
  return null;
}
// The marker commits only when this stage's lazy modules and textures resolve.
// Earlier stages stay mounted while a later boundary is suspended.
function WarmupStage({ name, phase, onPhase, onReady, children, ...preparation }: { name: StudioPhase; phase: StudioPhase; onPhase: (phase: StudioPhase) => void; onReady: () => void; children: ReactNode } & WarmupCallbacks) {
  const group = useRef<THREE.Group>(null);
  if (warmupPhases.indexOf(phase) < warmupPhases.indexOf(name)) return null;
  return <Suspense fallback={null}>
    {/* Hidden before the first draw; shader compilation traverses hidden materials. */}
    <group ref={group} visible={false}>
      {children}
      {phase === name && <StudioWarmup group={group} phase={phase} onPhase={onPhase} onReady={onReady} {...preparation} />}
    </group>
  </Suspense>;
}

function GalleryTextureWarmup({ image }: { image: string }) {
  // Match DisplayImage's singleton loader key, including retry/cache clearing.
  useTexture(image);
  return null;
}

function galleryWarmupImages(projects: StudioProject[], selected: number) {
  const start = galleryWindowStart(selected, projects.length);
  return projects.slice(start, start + 3).map((project) => screenTextureUrl(project.slug, false));
}

function GalleryWarmup({ projects, selected }: { projects: StudioProject[]; selected: number }) {
  // ProjectDisplay keeps a local Suspense boundary for later image changes.
  // Gate the initial three cached textures here so that boundary cannot allow
  // the arrival film to begin with empty gallery screens.
  return galleryWarmupImages(projects, selected).map((image) => <GalleryTextureWarmup key={image} image={image} />);
}

export default function StudioScene({ state, mapOpen, projects, selectedProject, visible, onReady, onFailure, onSelect, onProject, onService, onManual, onArrive }: {
  state: StudioState; mapOpen: boolean; projects: StudioProject[]; selectedProject: number; visible: boolean;
  onReady: () => void; onFailure: () => void; onSelect: (area: Area) => void; onProject: (index: number) => void; onService: (index: number) => void; onManual: () => void; onArrive: () => void;
}) {
  const mobile = window.innerWidth < 700 || matchMedia("(max-width: 999px) and (max-height: 500px) and (orientation: landscape)").matches;
  const animate = !matchMedia("(prefers-reduced-motion: reduce)").matches;
  const portal = useRef<HTMLDivElement>(null);
  const viewport = useRef<HTMLDivElement>(null);
  const [tier, setTier] = useState(() => pickTier(readRuntimeCapabilities()));
  const [greetedShot, setGreetedShot] = useState(-1);
  const [phase, setPhase] = useState<StudioPhase>("core");
  const [environmentReady, setEnvironmentReady] = useState(false);
  const onEnvironmentReady = useCallback(() => setEnvironmentReady(true), []);
  const preparation = { environmentReady, onFailure };
  useEffect(() => {
    // Fetch world modules in parallel while geometry and shaders still warm up in order.
    // If a request fails, its lazy boundary handles the error when the stage mounts.
    void Promise.allSettled([loadExterior(), loadTraffic(), loadPedestrians(), loadWildlife()]);
  }, []);
  useEffect(() => {
    if (phase !== "core") return;
    // Match the gallery's singleton loader keys so its initial requests share
    // the same cache entries and can overlap core model and shader preparation.
    for (const image of galleryWarmupImages(projects, selectedProject)) useTexture.preload(image);
  }, [phase, projects, selectedProject]);
  const [software, setSoftware] = useState(false);
  const [detailedMaterials, setDetailedMaterials] = useState<boolean | null>(() => (tier === "low" ? false : null));
  const [pixelRatio, setPixelRatio] = useState(1);
  useEffect(() => {
    preloadCoreStudioAssets();
  }, []);
  useEffect(() => {
    const element = viewport.current;
    if (!element) return;
    const measure = () => setPixelRatio(canvasPixelRatio({
      width: element.clientWidth, height: element.clientHeight, tier, software, deviceDpr: window.devicePixelRatio,
    }));
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    window.addEventListener("resize", measure);
    measure();
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [tier, software]);
  const crispScreens = state.area === "gallery" && !state.overview && !state.outside && state.mode !== "loading" && state.mode !== "arrival";
  const portrait = matchMedia("(orientation: portrait)").matches;
  const initialPose = arrivalPose(0, mobile && portrait, cameraFieldOfView(mobile, portrait));
  const greeting = state.mode === "intro" || (state.mode === "explore" && state.area === "reception" && !state.outside) || (state.mode === "arrival" && greetedShot === state.shot);
  const downgrade = useCallback(() => setTier(stepDownTier), [setTier]);
  return <div ref={viewport} className="ab-spatial-canvas" data-warmup={phase} style={{ position: "absolute", inset: 0, zIndex: 0 }}>
    <style>{`.ab-spatial-hotspot{display:flex;align-items:center;gap:8px;white-space:nowrap;min-height:44px;padding:6px 13px 6px 7px;border:1px solid #c4a56f88;background:#101619e8;color:#f1e2c2;font:var(--fs-label) var(--font-sans),sans-serif;cursor:pointer;box-shadow:0 4px 16px #0005}.ab-spatial-hotspot span{display:grid;place-items:center;width:25px;height:25px;border:1px solid #d4b67888;border-radius:50%;color:#e9cc96;font-size:17px}.ab-spatial-hotspot:hover{background:#3a3020;border-color:#efd49c}.ab-spatial-canvas canvas{touch-action:pan-y!important}`}</style>
    <div ref={portal} style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 1 }} />
    <Canvas frameloop={visible ? "demand" : "never"} dpr={pixelRatio} camera={{ position: initialPose.position, fov: initialPose.fov, near: .1, far: 560 }} gl={{ antialias: false, powerPreference: "low-power", alpha: false }} fallback={<p>3D unavailable. Explore the studio using the space buttons below.</p>} onCreated={({ gl, scene, size, setDpr }) => {
      // Software rasterizers can expose many CPU cores and large texture limits. Start them at
      // the bounded tier immediately instead of waiting for a prolonged frame-time probe.
      const context = gl.getContext();
      const debug = context.getExtension("WEBGL_debug_renderer_info");
      const renderer = debug ? String(context.getParameter(debug.UNMASKED_RENDERER_WEBGL)) : "";
      const softwareRenderer = software || /swiftshader|llvmpipe|software|microsoft basic render/i.test(renderer);
      const capabilities = { ...readRuntimeCapabilities(), softwareRenderer, maxTexture: gl.capabilities.maxTextureSize };
      const initialTier = pickTier(capabilities, tier);
      const initialDpr = canvasPixelRatio({ width: size.width, height: size.height, tier: initialTier, software: softwareRenderer, deviceDpr: window.devicePixelRatio });
      // Apply the backing-buffer budget immediately, including during warmup.
      setDpr(initialDpr);
      setPixelRatio(initialDpr);
      setSoftware(softwareRenderer);
      // Keep shader variants fixed after entry, even if the frame-time probe later lowers simulation quality.
      setDetailedMaterials(initialTier !== "low");
      setTier((current) => pickTier(capabilities, current));
      gl.domElement.setAttribute("aria-hidden", "true");
      gl.domElement.tabIndex = -1;
      gl.toneMapping = THREE.ACESFilmicToneMapping; gl.toneMappingExposure = 1.1;
      scene.background = new THREE.Color(skyFog);
      scene.fog = new THREE.Fog(skyFog, 52, 175);
    }}>
      <ContextGuard onFailure={onFailure} />
      <Suspense fallback={null}><Lighting onReady={onEnvironmentReady} /></Suspense>
      <CameraRig state={state} mapOpen={mapOpen} visible={visible} onManual={onManual} onArrive={onArrive} onGreet={() => setGreetedShot(state.shot)} />
      <HotspotPortalContext.Provider value={portal}>
      <HotspotsHiddenContext.Provider value={!!state.animal}>
      <SceneClock tier={tier} active={visible && animate && phase === "done"} onDowngrade={tier === "low" ? undefined : downgrade}>
      {detailedMaterials !== null && <MaterialLibrary detailed={detailedMaterials}>
        <WarmupStage name="core" phase={phase} onPhase={setPhase} onReady={onReady} {...preparation}>
          <Architecture />
          <Facade />
          <Ground />
          <GoldDust animate={animate && tier !== "low"} />
          <Landmarks />
        </WarmupStage>
        <WarmupStage name="interior" phase={phase} onPhase={setPhase} onReady={onReady} {...preparation}>
          {phase === "interior" && <GalleryWarmup projects={projects} selected={selectedProject} />}
          <Reception animate={animate} onSelect={onSelect} />
          <Gallery projects={projects} selected={selectedProject} crisp={crispScreens} onSelect={onSelect} onProject={onProject} />
          <Services onSelect={onSelect} onService={onService} />
          <Consultation onSelect={onSelect} />
          <Receptionist greeting={greeting} />
        </WarmupStage>
        <WarmupStage name="exterior" phase={phase} onPhase={setPhase} onReady={onReady} {...preparation}><Exterior /></WarmupStage>
        <WarmupStage name="traffic" phase={phase} onPhase={setPhase} onReady={onReady} {...preparation}><Traffic /></WarmupStage>
        <WarmupStage name="pedestrians" phase={phase} onPhase={setPhase} onReady={onReady} {...preparation}><Pedestrians /></WarmupStage>
        <WarmupStage name="wildlife" phase={phase} onPhase={setPhase} onReady={onReady} {...preparation}><Wildlife /></WarmupStage>
        <WarmupStage name="staff" phase={phase} onPhase={setPhase} onReady={onReady} {...preparation}><StudioStaff /></WarmupStage>
      </MaterialLibrary>}
      </SceneClock>
      </HotspotsHiddenContext.Provider>
      </HotspotPortalContext.Provider>
    </Canvas>
  </div>;
}

function ContextGuard({ onFailure }: { onFailure: () => void }) {
  const { gl } = useThree();
  useEffect(() => {
    const canvas = gl.domElement;
    const lost = (event: Event) => { event.preventDefault(); onFailure(); };
    const scroll = (event: WheelEvent) => event.stopImmediatePropagation();
    canvas.addEventListener("wheel", scroll, { capture: true, passive: true });
    canvas.addEventListener("webglcontextlost", lost);
    return () => { canvas.removeEventListener("webglcontextlost", lost); canvas.removeEventListener("wheel", scroll, true); };
  }, [gl, onFailure]);
  return null;
}

export function resetStudioResources(projects: StudioProject[]) {
  useLoader.clear(StudioEnvironmentLoader, environmentUrl);
  useStudioModel.clear(monogramUrl);
  for (const project of projects) {
    useTexture.clear(screenTextureUrl(project.slug, false));
    useTexture.clear(screenTextureUrl(project.slug, true));
  }
}
