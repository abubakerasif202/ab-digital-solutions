"use client";

import { useEffect, useId, useMemo, useRef } from "react";
import * as THREE from "three";
import { Block } from "../../scene/Architecture";
import { useSceneClock } from "../SceneClock";
import { worldState } from "../worldState";
import { createStaff, STATIONS } from "../sim/staff-behavior";
import { CAST, createHumanoid, createHumanoidKit } from "./humanoid";

const CHARCOAL = "#22272a", BRASS = "#bca06b", RUBY = "#792c40", CREAM = "#e8dcc4";

export type ScreenKind = "dashboard" | "design" | "code";
const hash = (n: number) => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };

function drawScreen(ctx: CanvasRenderingContext2D, kind: ScreenKind, frame: number, seed: number) {
  const W = 256, H = 160;
  ctx.fillStyle = "#12181c"; ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = RUBY; ctx.fillRect(0, 0, W, 16);
  ctx.fillStyle = BRASS; ctx.fillRect(8, 6, 26, 4); ctx.fillStyle = "#e8dcc4aa"; ctx.fillRect(W - 60, 6, 48, 4);
  if (kind === "dashboard") {
    ctx.fillStyle = "#1c2429"; ctx.fillRect(0, 16, 36, H - 16);
    for (let i = 0; i < 5; i++) { ctx.fillStyle = i === frame % 5 ? BRASS : "#5b666b"; ctx.fillRect(8, 28 + i * 18, 20, 5); }
    for (let i = 0; i < 3; i++) {
      ctx.fillStyle = "#222c32"; ctx.fillRect(46 + i * 68, 26, 60, 34);
      ctx.fillStyle = i === 0 ? RUBY : BRASS; ctx.fillRect(52 + i * 68, 32, 18 + hash(seed + i + frame * 0.2) * 30, 6);
      ctx.fillStyle = CREAM; ctx.fillRect(52 + i * 68, 46, 30, 5);
    }
    for (let i = 0; i < 12; i++) {
      const h = 14 + hash(seed + i * 3.1 + Math.floor(frame / 2)) * 40;
      ctx.fillStyle = i % 4 === frame % 4 ? BRASS : "#8a7a58"; ctx.fillRect(48 + i * 16, 148 - h, 10, h);
    }
    ctx.fillStyle = "#e8dcc455"; ctx.fillRect(46, 148, 196, 1);
  } else if (kind === "design") {
    ctx.fillStyle = "#1c2429"; ctx.fillRect(0, 16, 30, H - 16); ctx.fillRect(W - 44, 16, 44, H - 16);
    ctx.fillStyle = CREAM; ctx.fillRect(40, 28, 164, 118);
    ctx.fillStyle = RUBY; ctx.fillRect(50, 38, 70, 46); ctx.fillStyle = CHARCOAL; ctx.fillRect(128, 38, 66, 20);
    ctx.fillStyle = BRASS; ctx.fillRect(128, 64, 66, 6); ctx.fillStyle = "#b9ad93"; ctx.fillRect(50, 96, 144, 5); ctx.fillRect(50, 108, 110, 5); ctx.fillRect(50, 120, 126, 5);
    const sel = frame % 3, boxes = [[50, 38, 70, 46], [128, 38, 66, 20], [50, 96, 144, 29]];
    ctx.strokeStyle = "#7fc7ff"; ctx.lineWidth = 1.5; ctx.strokeRect(boxes[sel][0] - 2, boxes[sel][1] - 2, boxes[sel][2] + 4, boxes[sel][3] + 4);
    for (let i = 0; i < 6; i++) { ctx.fillStyle = [RUBY, BRASS, CREAM, CHARCOAL, "#5b666b", "#3b1c25"][i]; ctx.fillRect(W - 38, 26 + i * 16, 30, 10); }
    for (let i = 0; i < 4; i++) { ctx.fillStyle = "#5b666b"; ctx.fillRect(6, 26 + i * 18, 18, 10); }
  } else {
    const palette = [BRASS, "#d9a5b0", "#9fc7b6", CREAM, "#8aa4d6"];
    const active = frame % 14;
    for (let line = 0; line < 14; line++) {
      if (line === active) { ctx.fillStyle = "#26323a"; ctx.fillRect(0, 22 + line * 9.4, W, 9); }
      ctx.fillStyle = "#5b666b"; ctx.fillRect(6, 24 + line * 9.4, 10, 4);
      let x = 24 + Math.floor(hash(seed + line) * 3) * 10;
      for (let seg = 0; seg < 4; seg++) {
        const w = 10 + hash(seed * 3 + line * 7 + seg) * 40;
        ctx.fillStyle = palette[Math.floor(hash(seed + line * 5 + seg * 11) * palette.length)]; ctx.fillRect(x, 24 + line * 9.4, w, 4); x += w + 6;
        if (x > W - 40) break;
      }
    }
    if (frame % 2 === 0) { ctx.fillStyle = CREAM; ctx.fillRect(24 + 70, 23 + active * 9.4, 2, 6); }
  }
}

/** Canvas-backed screen drawn at low rate by the caller (one tiny texture upload per repaint). */
export function createScreen(kind: ScreenKind, seed: number) {
  const canvas = document.createElement("canvas");
  canvas.width = 256; canvas.height = 160;
  const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  let frame = 0;
  drawScreen(ctx, kind, frame, seed);
  return {
    texture,
    repaint() { frame++; drawScreen(ctx, kind, frame, seed); texture.needsUpdate = true; },
    dispose() { texture.dispose(); },
  };
}
export type Screen = ReturnType<typeof createScreen>;

/** Desk monitor facing local +z. */
export function Monitor({ texture, position, rotationY = 0, width = 0.6 }: { texture: THREE.Texture; position: [number, number, number]; rotationY?: number; width?: number }) {
  const h = width * 0.58;
  return <group position={position} rotation={[0, rotationY, 0]}>
    <Block position={[0, 0.006, 0]} size={[0.22, 0.012, 0.16]} color={CHARCOAL} />
    <Block position={[0, 0.08, -0.02]} size={[0.035, 0.16, 0.025]} color={BRASS} metalness={0.7} />
    <Block position={[0, 0.14 + h / 2, 0]} size={[width, h, 0.028]} color="#14181a" />
    <mesh position={[0, 0.14 + h / 2, 0.0155]}><planeGeometry args={[width - 0.03, h - 0.03]} /><meshBasicMaterial map={texture} toneMapped={false} /></mesh>
  </group>;
}

export function OfficeChair({ color = CHARCOAL, position = [0, 0, 0], rotationY = 0 }: { color?: string; position?: [number, number, number]; rotationY?: number }) {
  return <group position={position} rotation={[0, rotationY, 0]}>
    <Block position={[0, 0.465, -0.03]} size={[0.5, 0.07, 0.48]} color={color} roughness={0.85} />
    <Block position={[0, 0.8, -0.29]} size={[0.46, 0.46, 0.06]} color={color} roughness={0.85} />
    <mesh position={[0, 0.24, -0.03]}><cylinderGeometry args={[0.03, 0.03, 0.44, 8]} /><meshStandardMaterial color={BRASS} metalness={0.8} roughness={0.35} /></mesh>
    <mesh position={[0, 0.035, -0.03]}><cylinderGeometry args={[0.27, 0.27, 0.04, 16]} /><meshStandardMaterial color="#14181a" roughness={0.6} /></mesh>
  </group>;
}

export function Keyboard({ position, color = "#2c3338" }: { position: [number, number, number]; color?: string }) {
  return <group position={position}>
    <Block position={[0, 0, 0]} size={[0.42, 0.016, 0.14]} color={color} roughness={0.6} />
    <Block position={[0, 0.0095, 0]} size={[0.38, 0.003, 0.11]} color="#4a5258" roughness={0.7} />
  </group>;
}

function DesignerStation({ screen }: { screen: Screen }) {
  const s = STATIONS.designer;
  return <group position={[s.x, s.floor, s.z]} rotation={[0, s.yaw, 0]}>
    <OfficeChair color={RUBY} />
    <Block position={[0, 0.68, 0.6]} size={[1.5, 0.04, 0.8]} color="#2a3034" metalness={0.2} roughness={0.45} />
    <Block position={[0, 0.68, 0.995]} size={[1.5, 0.045, 0.012]} color={BRASS} metalness={0.8} roughness={0.3} />
    {[-0.7, 0.7].flatMap((x) => [0.28, 0.92].map((z) => <Block key={`${x}${z}`} position={[x, 0.33, z]} size={[0.04, 0.66, 0.04]} color={BRASS} metalness={0.8} roughness={0.35} />))}
    <Keyboard position={[0, 0.71, 0.42]} />
    <Block position={[0.3, 0.712, 0.44]} size={[0.06, 0.024, 0.1]} color="#3a4147" />
    <Block position={[0.52, 0.705, 0.75]} size={[0.26, 0.012, 0.18]} color="#cfc6b2" roughness={0.6} />
    <mesh position={[-0.55, 0.75, 0.7]}><cylinderGeometry args={[0.04, 0.035, 0.1, 12]} /><meshStandardMaterial color={CREAM} roughness={0.5} /></mesh>
    <Monitor texture={screen.texture} position={[0, 0.7, 0.88]} rotationY={Math.PI} width={0.62} />
  </group>;
}

function ReviewDisplay({ screen }: { screen: Screen }) {
  const d = STATIONS.display;
  return <group position={[d.x, d.floor, d.z]} rotation={[0, d.normalYaw, 0]}>
    <mesh position={[0, 0.02, 0]}><cylinderGeometry args={[0.32, 0.34, 0.04, 20]} /><meshStandardMaterial color={CHARCOAL} roughness={0.5} metalness={0.3} /></mesh>
    <Block position={[0, 0.6, -0.04]} size={[0.07, 1.1, 0.05]} color={BRASS} metalness={0.8} roughness={0.35} />
    <Block position={[0, 1.25, 0]} size={[1.0, 0.62, 0.05]} color="#14181a" />
    <mesh position={[0, 1.25, 0.0265]}><planeGeometry args={[0.95, 0.57]} /><meshBasicMaterial map={screen.texture} toneMapped={false} /></mesh>
  </group>;
}

/** Designer (seated), developer (standing) and a walking team member. Animated only from the scene clock. */
export function StudioStaff() {
  const { scheduler, quality } = useSceneClock();
  const id = useId();
  const sim = useMemo(() => createStaff(20260427), []);
  const kit = useMemo(() => createHumanoidKit(), []);
  const rigs = useMemo(() => {
    const r = { designer: createHumanoid(kit, CAST.designer), developer: createHumanoid(kit, CAST.developer), walker: createHumanoid(kit, CAST.walker) };
    r.designer.apply(sim.designer); r.developer.apply(sim.developer); r.walker.apply(sim.walker);
    return r;
  }, [kit, sim]);
  const screens = useMemo(() => ({ design: createScreen("design", 3), code: createScreen("code", 7) }), []);
  const walking = useRef(quality.walkingStaff);
  useEffect(() => { walking.current = quality.walkingStaff; }, [quality.walkingStaff]);

  useEffect(() => {
    const offSim = scheduler.add(`staff-${id}`, (dt) => {
      sim.step(dt, { walking: walking.current, visitor: worldState.visitor });
      rigs.designer.apply(sim.designer); rigs.developer.apply(sim.developer); rigs.walker.apply(sim.walker);
    });
    const offScreens = scheduler.add(`staff-screens-${id}`, () => { screens.design.repaint(); screens.code.repaint(); }, 0.9);
    return () => { offSim(); offScreens(); };
  }, [scheduler, id, sim, rigs, screens]);
  useEffect(() => () => { kit.dispose(); screens.design.dispose(); screens.code.dispose(); }, [kit, screens]);

  return <group>
    <DesignerStation screen={screens.design} />
    <ReviewDisplay screen={screens.code} />
    <primitive object={rigs.designer.root} />
    <primitive object={rigs.developer.root} />
    <primitive object={rigs.walker.root} />
  </group>;
}
