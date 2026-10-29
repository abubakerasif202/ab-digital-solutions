import { createContext, useContext, useEffect, useMemo, type ReactNode } from "react";
import * as THREE from "three";

// Original deterministic 256px material maps. Shared by every surface, no downloads.
function createMaps() {
  const marble = document.createElement("canvas");
  marble.width = marble.height = 256;
  const ctx = marble.getContext("2d")!;
  ctx.fillStyle = "#c9c1b2"; ctx.fillRect(0, 0, 256, 256);
  for (let vein = 0; vein < 34; vein++) {
    ctx.beginPath(); ctx.lineWidth = vein % 4 === 0 ? 1.4 : .45;
    ctx.strokeStyle = vein % 4 === 0 ? "#625b5048" : "#fff7e766";
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
    const shade = Math.round(110 + Math.sin(y * 91.7) * 19);
    brushCtx.fillStyle = `rgb(${shade},${shade},${shade})`;
    brushCtx.fillRect(0, y, 256, 1);
  }
  const roughness = new THREE.CanvasTexture(brush);
  return { map, roughness };
}
const Maps = createContext<ReturnType<typeof createMaps> | null>(null);
export function MaterialLibrary({ children }: { children: ReactNode }) {
  const maps = useMemo(() => createMaps(), []);
  useEffect(() => () => { maps.map.dispose(); maps.roughness.dispose(); }, [maps]);
  return <Maps.Provider value={maps}>{children}</Maps.Provider>;
}
export function MarbleMaterial() {
  const maps = useContext(Maps);
  return <meshStandardMaterial map={maps?.map} color="#e2d8c6" roughness={.32} metalness={.08} />;
}
export function BrassMaterial() {
  const maps = useContext(Maps);
  return <meshStandardMaterial color="#c7a36a" metalness={.82} roughness={.7} roughnessMap={maps?.roughness} />;
}
