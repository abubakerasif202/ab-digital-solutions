import { createContext, useContext, useEffect, useMemo, type ReactNode } from "react";
import * as THREE from "three";
import { createBlockResources } from "./block-resources";

// Original deterministic 256px material maps. Shared by every surface, no downloads.
function createMaps() {
  const marble = document.createElement("canvas");
  marble.width = marble.height = 256;
  const ctx = marble.getContext("2d")!;
  ctx.fillStyle = "#2b2624"; ctx.fillRect(0, 0, 256, 256);
  for (let vein = 0; vein < 34; vein++) {
    ctx.beginPath(); ctx.lineWidth = vein % 4 === 0 ? 1.3 : .45;
    ctx.strokeStyle = vein % 4 === 0 ? "#c9a45c62" : "#f1dfc232";
    for (let x = 0; x <= 256; x += 2) {
      const y = vein * 14 - 110 + x * .65 + Math.sin(x * .021 + vein) * 20 + Math.sin(x * .12 + vein * 3) * 2;
      if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
  const map = new THREE.CanvasTexture(marble); map.colorSpace = THREE.SRGBColorSpace;
  const brush = document.createElement("canvas"); brush.width = brush.height = 256;
  const brushCtx = brush.getContext("2d")!;
  for (let y = 0; y < 256; y++) {
    const shade = Math.round(98 + Math.sin(y * 91.7) * 22);
    brushCtx.fillStyle = `rgb(${shade},${shade},${shade})`;
    brushCtx.fillRect(0, y, 256, 1);
  }
  const roughness = new THREE.CanvasTexture(brush);
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
export function MarbleMaterial() {
  const maps = useContext(Maps);
  return <meshStandardMaterial map={maps?.map} color="#d8cec0" roughness={.26} metalness={.14} />;
}
export function BrassMaterial() {
  const maps = useContext(Maps);
  return <meshStandardMaterial color="#c9a45c" metalness={.88} roughness={.52} roughnessMap={maps?.roughness} />;
}
