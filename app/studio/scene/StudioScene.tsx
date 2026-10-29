"use client";

import { Suspense, useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, useGLTF, useTexture } from "@react-three/drei";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import * as THREE from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { MaterialLibrary } from "./Materials";
import { cameraProgress } from "./camera-motion";
import { Architecture } from "./Architecture";
import { Consultation, Gallery, HotspotPortalContext, Ready, Reception, Services } from "./Spaces";
import type { Area, StudioState } from "../studio-state";
import type { StudioProject } from "../studio-data";

// This module is imported only after Enter; preload the small essential model.
useGLTF.preload("/studio/ab-monogram.glb", false, false);

const shots: Record<Area, { position: [number,number,number]; target: [number,number,number] }> = {
  reception: { position: [1,3.5,11.8], target: [-4,1.4,3] },
  gallery: { position: [-1,3.6,5.8], target: [-5,1.5,-4.5] },
  services: { position: [12,3.6,4.8], target: [5.5,1.2,-4] },
  consultation: { position: [11,3.5,12.8], target: [5.5,1,4] },
};

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

function CameraRig({ state, visible, onManual }: { state: StudioState; visible: boolean; onManual: () => void }) {
  const controls = useRef<OrbitControlsImpl>(null);
  const { invalidate, camera, size, gl } = useThree();
  const moving = useRef(true);
  const targetPosition = useRef(new THREE.Vector3());
  const targetLook = useRef(new THREE.Vector3());
  const startPosition = useRef(new THREE.Vector3());
  const startLook = useRef(new THREE.Vector3());
  const started = useRef(0);
  const startLens = useRef(new THREE.Vector2());
  const targetLens = useRef(new THREE.Vector2());
  useEffect(() => {
    const overview = state.mode === "intro" || state.mode === "loading" || (!state.panel && !state.tour);
    const shot = overview ? { position: [19,15,24] as [number,number,number], target: [0,.2,0] as [number,number,number] } : shots[state.area];
    if (camera instanceof THREE.PerspectiveCamera) {
      const view = camera.view;
      startLens.current.set(view?.enabled ? view.offsetX / view.fullWidth : 0, view?.enabled ? view.offsetY / view.fullHeight : 0);
      // Frame the room above the mobile sheet or beside desktop copy.
      targetLens.current.set(state.panel && size.width >= 700 ? .13 : 0, state.panel && size.width < 700 ? .16 : 0);
    }
    targetPosition.current.set(...shot.position);
    // A narrower viewport uses a wider establishing view, retaining all rooms.
    if (size.width < 700) targetPosition.current.multiplyScalar(overview ? 1.38 : 1.2);
    targetLook.current.set(...shot.target);
    startPosition.current.copy(camera.position);
    startLook.current.copy(controls.current?.target ?? new THREE.Vector3());
    started.current = performance.now();
    moving.current = true;
    invalidate();
  }, [state.area, state.shot, state.mode, state.panel, state.tour, size.width, size.height, visible, camera, invalidate]);
  useFrame(() => {
    if (!visible || state.manual || !moving.current || !controls.current) return;
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
    }
    controls.current.update();
    moving.current = progress < 1;
    if (moving.current) invalidate();
  });
  return <OrbitControls ref={controls} domElement={gl.domElement} makeDefault enableDamping={false} enablePan={false} enableZoom minDistance={5} maxDistance={48} minPolarAngle={.3} maxPolarAngle={Math.PI/2.08} rotateSpeed={.55} zoomSpeed={.7} enabled={visible} onStart={onManual} />;
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

export default function StudioScene({ state, projects, visible, onReady, onFailure, onSelect, onProject, onService, onManual }: {
  state: StudioState; projects: StudioProject[]; visible: boolean;
  onReady: () => void; onFailure: () => void; onSelect: (area: Area) => void; onProject: (index: number) => void; onService: (index: number) => void; onManual: () => void;
}) {
  const animate = visible && state.mode === "intro";
  const portal = useRef<HTMLDivElement>(null);
  return <div className="ab-spatial-canvas" style={{ position: "absolute", inset: 0, zIndex: 0 }}>
    <style>{`.ab-spatial-hotspot{display:flex;align-items:center;gap:8px;white-space:nowrap;min-height:44px;padding:6px 13px 6px 7px;border:1px solid #c4a56f88;background:#101619e8;color:#f1e2c2;font:11px var(--font-sans),sans-serif;cursor:pointer;box-shadow:0 4px 16px #0005}.ab-spatial-hotspot span{display:grid;place-items:center;width:25px;height:25px;border:1px solid #d4b67888;border-radius:50%;color:#e9cc96;font-size:17px}.ab-spatial-hotspot:hover{background:#3a3020;border-color:#efd49c}.ab-spatial-canvas canvas{touch-action:pan-y!important}`}</style>
    <div ref={portal} style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 1 }} />
    <Canvas frameloop={visible ? "demand" : "never"} dpr={[1, typeof window !== "undefined" && window.innerWidth < 768 ? 1 : 1.5]} camera={{ position: [24,19,30], fov: 42, near: .1, far: 120 }} gl={{ antialias: typeof window !== "undefined" && window.innerWidth >= 768, powerPreference: "low-power", alpha: false }} fallback={<p>3D unavailable. Explore the studio using the space buttons below.</p>} onCreated={({ gl, scene }) => {
      gl.toneMapping = THREE.ACESFilmicToneMapping; gl.toneMappingExposure = 1.05;
      scene.background = new THREE.Color("#10171c");
    }}>
      <ContextGuard onFailure={onFailure} />
      <Lighting />
      <CameraRig state={state} visible={visible} onManual={onManual} />
      <HotspotPortalContext.Provider value={portal}>
      <Suspense fallback={null}><MaterialLibrary>
        <Architecture />
        <Reception animate={animate} onSelect={onSelect} />
        <Gallery projects={projects} onSelect={onSelect} onProject={onProject} />
        <Services onSelect={onSelect} onService={onService} />
        <Consultation onSelect={onSelect} />
        <GoldDust animate={animate} />
        <Ready onReady={onReady} />
      </MaterialLibrary></Suspense>
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
