import { useMemo } from "react";
import { monogramUrl } from "../studio-assets";
import { Block } from "./Architecture";
import { useStudioModel } from "./load-model";
import { layout } from "../world/world-layout";

const glass = { color: "#8fb3be", transparent: true, opacity: .13, roughness: .08, metalness: .12, depthWrite: false } as const;

// Front elevation of the studio: brass-framed glazing, an open entrance, canopy and the gold monogram.
export function Facade() {
  const { scene } = useStudioModel(monogramUrl);
  const sign = useMemo(() => scene.clone(true), [scene]);
  const z = layout.facadeZ;
  const doorL = layout.door.x - layout.door.width / 2, doorR = layout.door.x + layout.door.width / 2;
  const glazing: [number, number][] = [[-11.1, doorL], [doorR, 11.1]];
  return <group>
    {glazing.map(([a, b]) => {
      const width = b - a;
      const bays = Math.max(1, Math.round(width / 2.6));
      return <group key={a} position={[(a + b) / 2, 0, z]}>
        <mesh position={[0, 2.1, 0]}><boxGeometry args={[width, 4.2, .04]} /><meshPhysicalMaterial {...glass} /></mesh>
        {Array.from({ length: bays + 1 }, (_, i) => <Block key={i} position={[-width / 2 + i * width / bays, 2.1, 0]} size={[.07, 4.2, .1]} color="#c9a45c" metalness={.85} />)}
        <Block position={[0, .08, 0]} size={[width, .16, .14]} color="#c9a45c" metalness={.85} />
      </group>;
    })}
    {/* Door frame, transom glass and fascia carrying the monogram. */}
    {[doorL, doorR].map((x) => <Block key={x} position={[x, layout.door.height / 2, z]} size={[.12, layout.door.height, .16]} color="#c9a45c" metalness={.88} />)}
    <Block position={[layout.door.x, layout.door.height + .05, z]} size={[layout.door.width + .24, .1, .16]} color="#c9a45c" metalness={.88} />
    <mesh position={[layout.door.x, (layout.door.height + 4.2) / 2 + .05, z]}><boxGeometry args={[layout.door.width, 4.2 - layout.door.height - .05, .04]} /><meshPhysicalMaterial {...glass} /></mesh>
    <Block position={[0, 4.35, z]} size={[22.4, .5, .3]} color="#101216" metalness={.38} roughness={.36} />
    <Block position={[0, 4.62, z + .02]} size={[22.6, .06, .34]} color="#c9a45c" metalness={.88} />
    <Block position={[layout.door.x, 3.62, z + .22]} size={[3.1, 1.2, .08]} color="#0c0e11" roughness={.5} />
    <Block position={[layout.door.x, 3.62, z + .25]} size={[2.95, 1.06, .03]} color="#4a1120" roughness={.65} />
    <group position={[layout.door.x, 3.62, z + .32]} scale={.55}><primitive object={sign} /></group>
    <mesh position={[layout.door.x, 3.0, z + .5]}><boxGeometry args={[2.6, .03, .02]} /><meshBasicMaterial color="#ffe0a3" /></mesh>
    {/* Threshold slab; no canopy, so the monogram stays visible from the street. */}
    <Block position={[layout.door.x, .06, z + .3]} size={[layout.door.width + .6, .12, .6]} color="#1d2024" roughness={.32} />
    <mesh position={[layout.door.x, .125, z + .58]}><boxGeometry args={[layout.door.width + .2, .012, .02]} /><meshBasicMaterial color="#c8173a" /></mesh>
  </group>;
}

// Everything the cutaway slab doesn't cover: forecourt and the land between studio and harbour.
export function Ground() {
  return <mesh position={[0, -.07, 4]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[240, 88]} /><meshStandardMaterial color="#191b1f" roughness={.92} /></mesh>;
}
