import { useMemo } from "react";
import { useGLTF } from "@react-three/drei";
import { Block } from "./Architecture";
import { layout } from "../world/world-layout";

const glass = { color: "#a9c4c6", transparent: true, opacity: .12, roughness: .08, metalness: .1, depthWrite: false } as const;

// Front elevation of the studio: brass-framed glazing, an open entrance, canopy and the gold monogram.
export function Facade() {
  const { scene } = useGLTF("/studio/ab-monogram.glb", false, false);
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
        {Array.from({ length: bays + 1 }, (_, i) => <Block key={i} position={[-width / 2 + i * width / bays, 2.1, 0]} size={[.07, 4.2, .1]} color="#bca06b" metalness={.8} />)}
        <Block position={[0, .08, 0]} size={[width, .16, .14]} color="#bca06b" metalness={.8} />
      </group>;
    })}
    {/* Door frame, transom glass and fascia carrying the monogram. */}
    {[doorL, doorR].map((x) => <Block key={x} position={[x, layout.door.height / 2, z]} size={[.12, layout.door.height, .16]} color="#c9ac73" metalness={.85} />)}
    <Block position={[layout.door.x, layout.door.height + .05, z]} size={[layout.door.width + .24, .1, .16]} color="#c9ac73" metalness={.85} />
    <mesh position={[layout.door.x, (layout.door.height + 4.2) / 2 + .05, z]}><boxGeometry args={[layout.door.width, 4.2 - layout.door.height - .05, .04]} /><meshPhysicalMaterial {...glass} /></mesh>
    <Block position={[0, 4.35, z]} size={[22.4, .5, .3]} color="#1d2023" metalness={.35} roughness={.4} />
    <Block position={[0, 4.62, z + .02]} size={[22.6, .06, .34]} color="#c9ac73" metalness={.85} />
    <Block position={[layout.door.x, 3.62, z + .22]} size={[3.1, 1.2, .08]} color="#16191b" roughness={.6} />
    <group position={[layout.door.x, 3.62, z + .32]} scale={.55}><primitive object={sign} /></group>
    <mesh position={[layout.door.x, 3.0, z + .5]}><boxGeometry args={[2.6, .03, .02]} /><meshBasicMaterial color="#ffdca0" /></mesh>
    {/* Threshold slab; no canopy, so the monogram stays visible from the street. */}
    <Block position={[layout.door.x, .06, z + .3]} size={[layout.door.width + .6, .12, .6]} color="#2a2d2f" roughness={.35} />
  </group>;
}

// Everything the cutaway slab doesn't cover: forecourt and the land between studio and harbour.
export function Ground() {
  return <mesh position={[0, -.07, 4]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[240, 88]} /><meshStandardMaterial color="#3a3833" roughness={.95} /></mesh>;
}
