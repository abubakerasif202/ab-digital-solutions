import { useLayoutEffect, useRef } from "react";
import { BrassMaterial, MarbleMaterial } from "./Materials";
import * as THREE from "three";

export const brass = { color: "#bca06b", metalness: 0.8, roughness: 0.28 };
export const charcoal = { color: "#22272a", metalness: 0.18, roughness: 0.5 };

export function Block({ position, size, color = "#202427", metalness = 0.15, roughness = 0.5 }: { position: [number, number, number]; size: [number, number, number]; color?: string; metalness?: number; roughness?: number }) {
  return <mesh position={position}><boxGeometry args={size} /><meshStandardMaterial color={color} metalness={metalness} roughness={roughness} /></mesh>;
}

export function MarbleBlock({ position, size }: { position: [number, number, number]; size: [number, number, number] }) {
  return <mesh position={position}><boxGeometry args={size} /><MarbleMaterial /></mesh>;
}

export function Architecture() {
  return <group>
    <Block position={[0,-.4,0]} size={[23,.8,18]} color="#11171b" metalness={.4} roughness={.3} />
    <Block position={[0,.02,0]} size={[22.5,.04,17.5]} color="#11171b" metalness={.3} roughness={.32} />
    {/* Fine brass reveals articulate the floor without texture downloads. */}
    {[-7.5,-3.75,0,3.75,7.5].map((x) => <Block key={x} position={[x,.05,0]} size={[.014,.008,17.3]} color="#ad9361" />)}
    {[-5.75,-2.9,0,2.9,5.75].map((z) => <Block key={z} position={[0,.05,z]} size={[22.3,.008,.014]} color="#ad9361" />)}
    <Block position={[0,2,-8.6]} size={[22.5,4,.3]} color="#20191b" />
    <Block position={[-11.1,1.8,0]} size={[.3,3.6,17.5]} color="#21191c" />
    <Block position={[0,4.1,-8.6]} size={[22.7,.12,.38]} color="#b49a67" metalness={.85} />
    <Block position={[-11.1,3.68,0]} size={[.38,.12,17.5]} color="#b49a67" metalness={.85} />
    {/* Vertical brass fluting and inset warm light strips. */}
    <WallFlutes />
    {[-10.5,0,10.5].flatMap((x) => [-7.8,7.8].map((z) => <group key={`${x}-${z}`} position={[x,0,z]}>
      <Block position={[0,2.3,0]} size={[.24,4.6,.24]} color="#bda16a" metalness={.8} />
      <Block position={[0,4.64,0]} size={[.55,.12,.55]} color="#c1a572" metalness={.7} />
    </group>))}
    <Block position={[0,4.6,-7.8]} size={[21.3,.18,.18]} color="#b79e70" metalness={.8} />
    <Block position={[0,4.6,7.8]} size={[21.3,.18,.18]} color="#b79e70" metalness={.8} />
    {[-10.5,0,10.5].map((x) => <group key={x}><Block position={[x,4.6,0]} size={[.16,.18,15.6]} color="#9a825b" metalness={.7} /><mesh position={[x,4.48,0]}><boxGeometry args={[.04,.02,14]} /><meshBasicMaterial color="#ffe0a4" /></mesh></group>)}
    {/* Inset marble wall panels and a ruby gallery niche. */}
    <MarbleBlock position={[-5,2.1,-8.37]} size={[9.7,3.5,.06]} />
    <Block position={[5.4,2.1,-8.32]} size={[9.2,3.5,.12]} color="#3b1c25" roughness={.85} />
    <mesh position={[-5,3.94,-8.21]}><boxGeometry args={[9.7,.025,.03]} /><meshBasicMaterial color="#ffe1a3" /></mesh>
    <mesh position={[5.4,3.94,-8.21]}><boxGeometry args={[9.2,.025,.03]} /><meshBasicMaterial color="#ffe1a3" /></mesh>
    {/* Glass screens divide the atelier and meeting space. */}
    {[2.5,5,7.5].map((x) => <group key={x} position={[x,1.6,.3]}><mesh><boxGeometry args={[2.35,3.1,.045]} /><meshPhysicalMaterial color="#a3bfc2" transparent opacity={.14} roughness={.18} metalness={.1} depthWrite={false} /></mesh><Block position={[-1.2,0,0]} size={[.035,3.2,.08]} color="#bca06b" metalness={.8} /></group>)}
    {/* Warm shafts: low-cost, original translucent geometry; no postprocessing. */}
    {[-7,6].map((x) => <mesh key={x} position={[x,2.8,-4]} rotation={[0,0,.25]}><coneGeometry args={[1.4,5.4,16,1,true]} /><meshBasicMaterial color="#e6ba73" transparent opacity={.035} side={THREE.DoubleSide} depthWrite={false} /></mesh>)}
  </group>;
}

function WallFlutes() {
  const ref = useRef<THREE.InstancedMesh>(null);
  useLayoutEffect(() => {
    const matrix = new THREE.Matrix4();
    for (let i = 0; i < 38; i++) {
      matrix.makeTranslation(-10.5 + i * .56, 2, -8.39);
      ref.current!.setMatrixAt(i, matrix);
    }
    ref.current!.instanceMatrix.needsUpdate = true;
  }, []);
  return <instancedMesh ref={ref} args={[undefined, undefined, 38]}><boxGeometry args={[.025,3.9,.035]} /><BrassMaterial /></instancedMesh>;
}
