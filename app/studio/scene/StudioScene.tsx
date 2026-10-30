"use client";

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, useGLTF, useTexture } from "@react-three/drei";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import * as THREE from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { MaterialLibrary } from "./Materials";
import { cameraProgress } from "./camera-motion";
import { Architecture } from "./Architecture";
import { Consultation, Gallery, HotspotPortalContext, Ready, Reception, Services } from "./Spaces";
import { Facade, Ground } from "./Facade";
import { SceneClock } from "../world/SceneClock";
import { Exterior } from "../world/Exterior";
import { Landmarks, skyFog } from "../world/Landmarks";
import { Traffic } from "../world/Traffic";
import { Pedestrians } from "../world/Pedestrians";
import { Kangaroo } from "../world/Kangaroo";
import { Receptionist } from "../world/characters/Receptionist";
import { StudioStaff } from "../world/characters/StudioStaff";
import { worldState } from "../world/worldState";
import { ARRIVAL_SECONDS, GREET_AT, SUMMON_KANGAROO_AT, arrivalPose } from "../world/sim/arrival";
import { pickTier, tierConfig, type Tier } from "../world/sim/quality";
import type { Area, StudioState } from "../studio-state";
import type { StudioProject } from "../studio-data";

// This module is imported only after Enter; preload the small essential model.
useGLTF.preload("/studio/ab-monogram.glb", false, false);

const shots: Record<Area, { position: [number,number,number]; target: [number,number,number] }> = {
  reception: { position: [-1.4,1.85,6.8], target: [-5.8,1.35,2.9] },
  gallery: { position: [-1,2.3,1], target: [-5,1.8,-5] },
  services: { position: [9.5,2.3,-.8], target: [5.5,1.5,-4] },
  consultation: { position: [2,2.2,7], target: [5.6,1.2,4.3] },
};

const mobileShots: typeof shots = {
  reception: { position: [-.5,1.8,8.2], target: [-5,1.9,3] },
  gallery: { position: [-5,1.75,1], target: [-5,1.8,-5] },
  services: { position: [5.5,1.75,1.8], target: [5.5,1.5,-4] },
  consultation: { position: [2.5,1.8,7.5], target: [5.6,1.5,4.3] },
};

const entranceShot = { position: [-.5, 2.3, 16.8] as [number,number,number], target: [-.5, 2.4, 9] as [number,number,number] };
const mobileEntranceShot = { position: [-.5, 2.1, 18] as [number,number,number], target: [-.5, 2.2, 9] as [number,number,number] };
const welcomeShot = { position: [-1.4, 1.62, 6.6] as [number,number,number], target: [-5.8, 1.4, 2.9] as [number,number,number] };

// Three's scene is an imperative GPU resource, not React state.
function attachEnvironment(scene: THREE.Scene, texture: THREE.Texture) {
  const previous = scene.environment;
  scene.environment = texture;
  scene.environmentIntensity = .45;
  return () => { scene.environment = previous; };
}

function Lighting() {
  const { gl, scene, invalidate } = useThree();
  useEffect(() => {
    const generator = new THREE.PMREMGenerator(gl);
    const room = new RoomEnvironment();
    const environment = generator.fromScene(room, .04, .1, 100, { size: 128 });
    const detach = attachEnvironment(scene, environment.texture);
    invalidate();
    return () => { detach(); environment.dispose(); generator.dispose(); room.dispose(); };
  }, [gl, scene, invalidate]);
  return <>
    <ambientLight intensity={.3} color="#e4d9cd" />
    <directionalLight position={[3,12,8]} intensity={1.8} color="#ffe2ae" />
    <directionalLight position={[-8,8,-6]} intensity={.65} color="#c4c7d6" />
    <pointLight position={[-5,4,3]} intensity={24} distance={9} color="#ffd28a" />
    <pointLight position={[5,4,-4]} intensity={22} distance={10} color="#ffc67b" />
    <pointLight position={[5.6,3.5,4.3]} intensity={20} distance={8} color="#ffdca5" />
  </>;
}

function setLens(camera: THREE.Camera, fov: number) {
  if (camera instanceof THREE.PerspectiveCamera) { camera.fov = fov; camera.updateProjectionMatrix(); }
}

function CameraRig({ state, visible, onManual, onArrive, onGreet }: { state: StudioState; visible: boolean; onManual: () => void; onArrive: () => void; onGreet: () => void }) {
  const controls = useRef<OrbitControlsImpl>(null);
  const { invalidate, camera, size, gl } = useThree();
  const mobile = size.width < 700 || (size.height < 500 && size.width < 1000);
  const portrait = mobile && size.height > size.width;
  const baseFov = mobile ? (portrait ? 80 : 52) : 42;
  const moving = useRef(true);
  const targetPosition = useRef(new THREE.Vector3());
  const targetLook = useRef(new THREE.Vector3());
  const startPosition = useRef(new THREE.Vector3());
  const startLook = useRef(new THREE.Vector3());
  const started = useRef(0);
  const arrivalStart = useRef(0);
  const arrivalFlags = useRef({ summoned: false, greeted: false, done: false });
  const startLens = useRef(new THREE.Vector2());
  const targetLens = useRef(new THREE.Vector2());
  const arriving = state.mode === "arrival";
  // Orbit limits suit hands-on exploration only: cinematic moves must not be clamped toward their far targets.
  const limit = (free: boolean) => {
    const c = controls.current;
    if (!c) return;
    c.minDistance = free ? 0 : mobile ? 2.5 : 5;
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
    const overview = state.mode === "loading" || (!state.panel && !state.tour && !state.outside && state.mode !== "intro");
    let shot = mobile ? mobileShots[state.area] : overview ? { position: [19,15,24] as [number,number,number], target: [0,.2,0] as [number,number,number] } : shots[state.area];
    if (state.mode === "loading") { const first = arrivalPose(0, portrait, baseFov); shot = { position: first.position, target: first.target }; }
    else if (state.mode === "intro") shot = mobile ? mobileShots.reception : welcomeShot;
    else if (state.outside) shot = mobile ? mobileEntranceShot : entranceShot;
    if (camera instanceof THREE.PerspectiveCamera) {
      const view = camera.view;
      startLens.current.set(view?.enabled ? view.offsetX / view.fullWidth : 0, view?.enabled ? view.offsetY / view.fullHeight : 0);
      // Frame the room above the mobile sheet or beside desktop copy.
      targetLens.current.set(state.panel && size.width >= 700 ? .13 : 0, state.panel && size.width < 700 ? .16 : 0);
    }
    targetPosition.current.set(...shot.position);
    targetLook.current.set(...shot.target);
    startPosition.current.copy(camera.position);
    startLook.current.copy(controls.current?.target ?? new THREE.Vector3());
    started.current = performance.now();
    moving.current = true;
    invalidate();
  }, [state.area, state.shot, state.mode, state.panel, state.tour, state.outside, size.width, size.height, mobile, portrait, baseFov, visible, camera, invalidate]);
  useFrame(() => {
    const visitor = worldState.visitor;
    visitor.x = camera.position.x; visitor.y = camera.position.y; visitor.z = camera.position.z;
    visitor.inReception = camera.position.x > -8.5 && camera.position.x < -1.2 && camera.position.z > .9 && camera.position.z < 9;
    if (!visible || !controls.current) return;
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
      const pose = arrivalPose(seconds, portrait, baseFov);
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
    const progress = Math.min(1, (performance.now() - started.current) / 1700);
    const eased = cameraProgress(progress);
    camera.position.lerpVectors(startPosition.current, targetPosition.current, eased);
    controls.current.target.lerpVectors(startLook.current, targetLook.current, eased);
    if (camera instanceof THREE.PerspectiveCamera) {
      const x = THREE.MathUtils.lerp(startLens.current.x, targetLens.current.x, eased);
      const y = THREE.MathUtils.lerp(startLens.current.y, targetLens.current.y, eased);
      if (x || y) camera.setViewOffset(size.width, size.height, x * size.width, y * size.height, size.width, size.height);
      else camera.clearViewOffset();
      if (Math.abs(camera.fov - baseFov) > .01) setLens(camera, THREE.MathUtils.lerp(camera.fov, baseFov, Math.min(1, eased + .05)));
    }
    controls.current.update();
    moving.current = progress < 1;
    if (moving.current) invalidate(); else limit(false);
  });
  return <OrbitControls ref={controls} domElement={gl.domElement} makeDefault enableDamping={false} enablePan={false} enableZoom rotateSpeed={.55} zoomSpeed={.7} enabled={visible && !arriving} onStart={onManual} />;
}

function GoldDust({ animate }: { animate: boolean }) {
  const ref = useRef<THREE.Points>(null);
  const { invalidate } = useThree();
  const positions = useMemo(() => Float32Array.from({ length: 192 }, (_, i) => Math.sin(i * 127.1 + 19) * (i % 3 === 1 ? 2 : 10) + (i % 3 === 1 ? 3 : 0)), []);
  useFrame((_, delta) => {
    if (!animate || !ref.current) return;
    ref.current.rotation.y += Math.min(delta,.05) * .025;
    invalidate();
  });
  return <points ref={ref}><bufferGeometry><bufferAttribute attach="attributes-position" args={[positions,3]} /></bufferGeometry><pointsMaterial color="#e8c47d" size={.035} transparent opacity={.55} depthWrite={false} /></points>;
}

function readCapabilities(): Tier {
  const nav = navigator as Navigator & { deviceMemory?: number; connection?: { saveData?: boolean } };
  return pickTier({ cores: nav.hardwareConcurrency, memoryGb: nav.deviceMemory, coarsePointer: matchMedia("(pointer: coarse)").matches, saveData: nav.connection?.saveData });
}

export default function StudioScene({ state, projects, visible, onReady, onFailure, onSelect, onProject, onService, onManual, onArrive }: {
  state: StudioState; projects: StudioProject[]; visible: boolean;
  onReady: () => void; onFailure: () => void; onSelect: (area: Area) => void; onProject: (index: number) => void; onService: (index: number) => void; onManual: () => void; onArrive: () => void;
}) {
  const mobile = typeof window !== "undefined" && (window.innerWidth < 768 || (window.innerWidth < 1000 && window.innerHeight < 500));
  const animate = false;
  const portal = useRef<HTMLDivElement>(null);
  const [tier, setTier] = useState<Tier>(readCapabilities);
  const [greetedShot, setGreetedShot] = useState(-1);
  const quality = tierConfig[tier];
  const initialPose = arrivalPose(0, mobile && window.innerHeight > window.innerWidth, mobile ? 80 : 42);
  const greeting = state.mode === "intro" || (state.mode === "explore" && state.area === "reception" && !state.outside) || (state.mode === "arrival" && greetedShot === state.shot);
  const downgrade = useCallback(() => setTier((current) => (current === "high" ? "medium" : "low")), []);
  return <div className="ab-spatial-canvas" style={{ position: "absolute", inset: 0, zIndex: 0 }}>
    <style>{`.ab-spatial-hotspot{display:flex;align-items:center;gap:8px;white-space:nowrap;min-height:44px;padding:6px 13px 6px 7px;border:1px solid #c4a56f88;background:#101619e8;color:#f1e2c2;font:11px var(--font-sans),sans-serif;cursor:pointer;box-shadow:0 4px 16px #0005}.ab-spatial-hotspot span{display:grid;place-items:center;width:25px;height:25px;border:1px solid #d4b67888;border-radius:50%;color:#e9cc96;font-size:17px}.ab-spatial-hotspot:hover{background:#3a3020;border-color:#efd49c}.ab-spatial-canvas canvas{touch-action:pan-y!important}`}</style>
    <div ref={portal} style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 1 }} />
    <Canvas frameloop={visible ? "demand" : "never"} dpr={[1, mobile ? 1 : quality.dpr]} camera={{ position: initialPose.position, fov: initialPose.fov, near: .1, far: 560 }} gl={{ antialias: !mobile && quality.antialias, powerPreference: "low-power", alpha: false }} fallback={<p>3D unavailable. Explore the studio using the space buttons below.</p>} onCreated={({ gl, scene }) => {
      // Software rasterizers can expose many CPU cores and large texture limits. Start them at
      // the bounded tier immediately instead of waiting for a prolonged frame-time probe.
      const context = gl.getContext();
      const debug = context.getExtension("WEBGL_debug_renderer_info");
      const renderer = debug ? String(context.getParameter(debug.UNMASKED_RENDERER_WEBGL)) : "";
      if (/swiftshader|llvmpipe|software|microsoft basic render/i.test(renderer)) setTier("low");
      gl.toneMapping = THREE.ACESFilmicToneMapping; gl.toneMappingExposure = 1.05;
      scene.background = new THREE.Color(skyFog);
      scene.fog = new THREE.Fog(skyFog, 110, 540);
    }}>
      <ContextGuard onFailure={onFailure} />
      <Lighting />
      <CameraRig state={state} visible={visible} onManual={onManual} onArrive={onArrive} onGreet={() => setGreetedShot(state.shot)} />
      <HotspotPortalContext.Provider value={portal}>
      <SceneClock tier={tier} active={visible} onDowngrade={downgrade}>
      <Suspense fallback={null}><MaterialLibrary>
        <Architecture />
        <Facade />
        <Ground />
        <Reception animate={animate} onSelect={onSelect} />
        <Gallery projects={projects} onSelect={onSelect} onProject={onProject} />
        <Services onSelect={onSelect} onService={onService} />
        <Consultation onSelect={onSelect} />
        <GoldDust animate={animate} />
        <Landmarks />
        <Exterior />
        <Traffic />
        <Pedestrians />
        <Kangaroo />
        <Receptionist greeting={greeting} />
        <StudioStaff />
        <Ready onReady={onReady} />
      </MaterialLibrary></Suspense>
      </SceneClock>
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
  useGLTF.clear("/studio/ab-monogram.glb");
  for (const project of projects.slice(0, 3)) useTexture.clear(`/studio/screens/${project.slug}.webp`);
}
