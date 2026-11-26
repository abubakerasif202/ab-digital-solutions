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

function createMaps(detailed: boolean) {
  const size = 512;
  const resolution = detailed ? size : size / 2;
  const rand = seeded(0xab5d);

  // Nero Portoro-style marble: smoky ground, a dominant gilt vein family and fine ivory crazing.
  const marble = document.createElement("canvas");
  marble.width = marble.height = resolution;
  const ctx = marble.getContext("2d")!;
  ctx.scale(resolution / size, resolution / size);
  ctx.fillStyle = "#1e1916"; ctx.fillRect(0, 0, size, size);
  const clouds = detailed ? 30 : 10;
  for (let cloud = 0; cloud < clouds; cloud++) {
    const x = rand() * size, y = rand() * size, r = 60 + rand() * 140;
    const glow = ctx.createRadialGradient(x, y, 0, x, y, r);
    // Smoky warm drifts over near-black: the depth that separates Portoro from flat grey stone.
    glow.addColorStop(0, cloud % 3 === 0 ? "#43362c3d" : "#0c0a0930");
    glow.addColorStop(1, "#00000000");
    ctx.fillStyle = glow; ctx.fillRect(x - r, y - r, r * 2, r * 2);
  }
  const drawVein = (offset: number, width: number, color: string, wobble: number, slope: number) => {
    ctx.beginPath(); ctx.lineWidth = width; ctx.strokeStyle = color;
    for (let x = -8; x <= size + 8; x += 3) {
      const y = offset + x * slope + Math.sin(x * .011 + offset) * 34 + Math.sin(x * .07 + offset * 2.3) * wobble;
      if (x === -8) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
  };
  // Dominant gilt vein family (soft halo, body, bright core), then a sparser, steeper secondary family.
  for (let vein = 0; vein < 9; vein++) {
    const offset = vein * 64 - 150 + rand() * 30, width = 1.8 + rand() * 1.6;
    drawVein(offset, width * 3.2, "#b8924f1f", 4, .56);
    drawVein(offset, width, "#d4ae6688", 4, .56);
    drawVein(offset + 1.2, .7, "#f6e2b466", 2, .56);
  }
  for (let vein = 0; vein < 5; vein++) drawVein(vein * 118 - 90 + rand() * 40, .9 + rand() * .8, "#c9a45c4a", 9, .38);
  const fineVeins = detailed ? 40 : 16;
  for (let vein = 0; vein < fineVeins; vein++) drawVein(rand() * size * 1.6 - size * .5, .4, "#efe2cc30", 7, -.3 + rand() * .2);
  const map = new THREE.CanvasTexture(marble);
  map.colorSpace = THREE.SRGBColorSpace;
  map.anisotropy = detailed ? 4 : 1;

  // Brushed-metal roughness: horizontal grain with slow banding, tiled so brass reads as worked, not plastic.
  // Grain amplitude stays low and the base sits mid-rough: per-row noise on thin beams at grazing
  // angles made the brass shimmer pixel to pixel. Mipmaps and anisotropy average out the rest.
  const brush = document.createElement("canvas"); brush.width = brush.height = 256;
  const brushCtx = brush.getContext("2d")!;
  for (let y = 0; y < 256; y++) {
    const shade = Math.round(118 + Math.sin(y * .37) * 7 + Math.sin(y * .09) * 10 + (rand() - .5) * 8);
    brushCtx.fillStyle = `rgb(${shade},${shade},${shade})`;
    brushCtx.fillRect(0, y, 256, 1);
  }
  const roughness = new THREE.CanvasTexture(brush);
  roughness.wrapS = roughness.wrapT = THREE.RepeatWrapping;
  roughness.repeat.set(2, 6);
  roughness.anisotropy = detailed ? 4 : 1;
  return { map, roughness, detailed };
}
const Maps = createContext<ReturnType<typeof createMaps> | null>(null);
const Blocks = createContext<ReturnType<typeof createBlockResources> | null>(null);

export function useBlockResources(color: string, metalness: number, roughness: number) {
  const resources = useContext(Blocks);
  if (!resources) throw new Error("Blocks need MaterialLibrary");
  return resources.get(color, metalness, roughness);
}
export function MaterialLibrary({ children, detailed }: { children: ReactNode; detailed: boolean }) {
  const maps = useMemo(() => createMaps(detailed), [detailed]);
  const blocks = useMemo(() => createBlockResources(), []);
  useEffect(() => () => {
    maps.map.dispose(); maps.roughness.dispose();
  }, [maps]);
  useEffect(() => () => blocks.dispose(), [blocks]);
  return <Maps.Provider value={maps}><Blocks.Provider value={blocks}>{children}</Blocks.Provider></Maps.Provider>;
}

/**
 * Honed-then-waxed stone: a thin clearcoat gives the polished reflection, the base stays slightly soft.
 * `repeat` tiles the shared slab across large daises so the veins keep a believable scale; the tiled
 * copy shares the canvas source, so it adds no second upload.
 */
export function MarbleMaterial({ repeat }: { repeat?: readonly [number, number] } = {}) {
  const maps = useContext(Maps);
  const [rx, ry] = repeat ?? [1, 1];
  const map = useMemo(() => {
    if (!maps || (rx === 1 && ry === 1)) return maps?.map;
    const tiled = maps.map.clone();
    tiled.wrapS = tiled.wrapT = THREE.RepeatWrapping;
    tiled.repeat.set(rx, ry);
    return tiled;
  }, [maps, rx, ry]);
  useEffect(() => () => { if (map && map !== maps?.map) map.dispose(); }, [map, maps]);
  const surface = { map, color: "#efe3d2", roughness: .32, metalness: .04, emissive: "#24100a", emissiveIntensity: .12 };
  return maps?.detailed ? <meshPhysicalMaterial {...surface} clearcoat={.6} clearcoatRoughness={.14} /> : <meshStandardMaterial {...surface} />;
}

/** Brushed brass: fully metallic, warm 18k-leaning base colour, grain in the roughness channel only. */
export function BrassMaterial() {
  const maps = useContext(Maps);
  return <meshStandardMaterial color="#cba45e" metalness={.94} roughness={.46} roughnessMap={maps?.roughness} emissive="#3a2208" emissiveIntensity={.1} />;
}

/**
 * Ruby cut velvet. `sheen` models the pile's grazing-angle highlight, so silhouettes glow lighter
 * than the faces turned to the viewer, which is the cue that separates velvet from painted plastic.
 */
export function VelvetMaterial({ color }: { color: string }) {
  const maps = useContext(Maps);
  // Less self-glow lets the pile fall into deep shadow, so the sheen carries the colour at the edges.
  const surface = { color, roughness: .92, emissive: "#2c0710", emissiveIntensity: .15 };
  return maps?.detailed ? <meshPhysicalMaterial {...surface} sheen={1} sheenColor="#ec5c78" sheenRoughness={.48} /> : <meshStandardMaterial {...surface} emissiveIntensity={.2} />;
}

/** Deep ruby lacquer for wall niches and inlays: saturated base under a glassy clearcoat. */
export function RubyLacquerMaterial({ color = "#440c1b" }: { color?: string }) {
  const maps = useContext(Maps);
  const surface = { color, emissive: "#1e040a", emissiveIntensity: .26 };
  // Detailed: satin pigment under a near-mirror clearcoat, the depth cue of real lacquer.
  return maps?.detailed ? <meshPhysicalMaterial {...surface} roughness={.48} clearcoat={1} clearcoatRoughness={.06} /> : <meshStandardMaterial {...surface} roughness={.29} />;
}
