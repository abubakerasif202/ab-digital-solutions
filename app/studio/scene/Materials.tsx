import { createContext, useContext, useEffect, useMemo, type ReactNode } from "react";
import * as THREE from "three";
import { createBlockResources } from "./block-resources";

// Original deterministic material maps. Shared by every surface, no downloads.
function seeded(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

function createMaps() {
  const size = 512;
  const rand = seeded(0xab5d);

  // Nero Portoro-style marble: smoky ground, a dominant gilt vein family and fine ivory crazing.
  const marble = document.createElement("canvas");
  marble.width = marble.height = size;
  const ctx = marble.getContext("2d")!;
  ctx.fillStyle = "#29231f"; ctx.fillRect(0, 0, size, size);
  for (let cloud = 0; cloud < 26; cloud++) {
    const x = rand() * size, y = rand() * size, r = 60 + rand() * 140;
    const glow = ctx.createRadialGradient(x, y, 0, x, y, r);
    glow.addColorStop(0, cloud % 3 === 0 ? "#3a302a2e" : "#1a161424");
    glow.addColorStop(1, "#00000000");
    ctx.fillStyle = glow; ctx.fillRect(0, 0, size, size);
  }
  const drawVein = (offset: number, width: number, color: string, wobble: number, slope: number) => {
    ctx.beginPath(); ctx.lineWidth = width; ctx.strokeStyle = color;
    for (let x = -8; x <= size + 8; x += 3) {
      const y = offset + x * slope + Math.sin(x * .011 + offset) * 34 + Math.sin(x * .07 + offset * 2.3) * wobble;
      if (x === -8) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
  };
  for (let vein = 0; vein < 9; vein++) drawVein(vein * 64 - 150 + rand() * 30, 1.6 + rand() * 1.4, "#c9a45c66", 4, .56);
  for (let vein = 0; vein < 9; vein++) drawVein(vein * 64 - 148 + rand() * 30, .6, "#f2dcb047", 2, .56);
  for (let vein = 0; vein < 40; vein++) drawVein(rand() * size * 1.6 - size * .5, .35, "#efe2cc26", 7, -.3 + rand() * .2);
  const map = new THREE.CanvasTexture(marble);
  map.colorSpace = THREE.SRGBColorSpace;
  map.anisotropy = 4;

  // Brushed-metal roughness: horizontal grain with slow banding, tiled so brass reads as worked, not plastic.
  const brush = document.createElement("canvas"); brush.width = brush.height = 256;
  const brushCtx = brush.getContext("2d")!;
  for (let y = 0; y < 256; y++) {
    const shade = Math.round(104 + Math.sin(y * 91.7) * 18 + Math.sin(y * .09) * 10 + (rand() - .5) * 14);
    brushCtx.fillStyle = `rgb(${shade},${shade},${shade})`;
    brushCtx.fillRect(0, y, 256, 1);
  }
  const roughness = new THREE.CanvasTexture(brush);
  roughness.wrapS = roughness.wrapT = THREE.RepeatWrapping;
  roughness.repeat.set(2, 6);
  return { map, roughness };
}
const Maps = createContext<ReturnType<typeof createMaps> | null>(null);
const Blocks = createContext<ReturnType<typeof createBlockResources> | null>(null);

export function useBlockResources(color: string, metalness: number, roughness: number) {
  const resources = useContext(Blocks);
  if (!resources) throw new Error("Blocks need MaterialLibrary");
  return resources.get(color, metalness, roughness);
}
export function MaterialLibrary({ children }: { children: ReactNode }) {
  const maps = useMemo(() => createMaps(), []);
  const blocks = useMemo(() => createBlockResources(), []);
  useEffect(() => () => {
    maps.map.dispose(); maps.roughness.dispose();
    blocks.dispose();
  }, [maps, blocks]);
  return <Maps.Provider value={maps}><Blocks.Provider value={blocks}>{children}</Blocks.Provider></Maps.Provider>;
}

/** Honed-then-waxed stone: a thin clearcoat gives the polished reflection, the base stays slightly soft. */
export function MarbleMaterial() {
  const maps = useContext(Maps);
  return <meshPhysicalMaterial map={maps?.map} color="#e6d8c6" roughness={.34} metalness={.04} clearcoat={.6} clearcoatRoughness={.14} emissive="#24100a" emissiveIntensity={.16} />;
}

/** Brushed brass: fully metallic, warm 18k-leaning base colour, grain in the roughness channel only. */
export function BrassMaterial() {
  const maps = useContext(Maps);
  return <meshStandardMaterial color="#cba45e" metalness={.96} roughness={.42} roughnessMap={maps?.roughness} emissive="#3a2208" emissiveIntensity={.12} />;
}

/**
 * Ruby cut velvet. `sheen` models the pile's grazing-angle highlight, so silhouettes glow lighter
 * than the faces turned to the viewer, which is the cue that separates velvet from painted plastic.
 */
export function VelvetMaterial({ color }: { color: string }) {
  return <meshPhysicalMaterial color={color} roughness={.9} metalness={0} sheen={1} sheenColor="#e0536f" sheenRoughness={.42} emissive="#2c0710" emissiveIntensity={.22} />;
}

/** Deep ruby lacquer for wall niches and inlays: saturated base under a glassy clearcoat. */
export function RubyLacquerMaterial({ color = "#4a0f1e" }: { color?: string }) {
  return <meshPhysicalMaterial color={color} roughness={.55} metalness={0} clearcoat={1} clearcoatRoughness={.08} emissive="#1e040a" emissiveIntensity={.3} />;
}
