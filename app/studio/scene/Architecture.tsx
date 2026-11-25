import { useLayoutEffect, useRef } from "react";
import { BrassMaterial, MarbleMaterial, useBlockResources } from "./Materials";
import * as THREE from "three";

export const brass = { color: "#c9a45c", metalness: 0.88, roughness: 0.2 };
export const charcoal = { color: "#14171b", metalness: 0.22, roughness: 0.48 };

export function Block({ position, size, color = "#14171b", metalness = 0.18, roughness = 0.48 }: { position: [number, number, number]; size: [number, number, number]; color?: string; metalness?: number; roughness?: number }) {
  const { geometry, material } = useBlockResources(color, metalness, roughness);
  // The provider owns these resources; unmounting one block must not dispose its neighbours.
  return <mesh position={position} scale={size} geometry={geometry} material={material} dispose={null} />;
}

export function MarbleBlock({ position, size }: { position: [number, number, number]; size: [number, number, number] }) {
  return <mesh position={position}><boxGeometry args={size} /><MarbleMaterial /></mesh>;
}

export function Architecture() {
  return <group>
    <Block position={[0,-.4,0]} size={[23,.8,18]} color="#0a0c0f" metalness={.45} roughness={.28} />
    <Block position={[0,.02,0]} size={[22.5,.04,17.5]} color="#0d1014" metalness={.36} roughness={.28} />
    {/* Fine brass reveals articulate the floor without texture downloads. */}
    {[-7.5,-3.75,0,3.75,7.5].map((x) => <Block key={x} position={[x,.05,0]} size={[.014,.008,17.3]} color="#c9a45c" metalness={.85} roughness={.24} />)}
    {[-5.75,-2.9,0,2.9,5.75].map((z) => <Block key={z} position={[0,.05,z]} size={[22.3,.008,.014]} color="#c9a45c" metalness={.85} roughness={.24} />)}
    <Block position={[0,2,-8.6]} size={[22.5,4,.3]} color="#131014" roughness={.55} />
    <Block position={[-11.1,1.8,0]} size={[.3,3.6,17.5]} color="#141014" roughness={.55} />
    <Block position={[0,4.1,-8.6]} size={[22.7,.12,.38]} color="#c9a45c" metalness={.88} roughness={.22} />
    <Block position={[-11.1,3.68,0]} size={[.38,.12,17.5]} color="#c9a45c" metalness={.88} roughness={.22} />
    {/* Vertical brass fluting and inset warm light strips. */}
    <WallFlutes />
    {[-10.5,0,10.5].flatMap((x) => [-7.8,7.8].map((z) => <group key={`${x}-${z}`} position={[x,0,z]}>
      <Block position={[0,2.3,0]} size={[.24,4.6,.24]} color="#c9a45c" metalness={.85} roughness={.24} />
      <Block position={[0,4.64,0]} size={[.55,.12,.55]} color="#c9a45c" metalness={.78} roughness={.26} />
    </group>))}
    <Block position={[0,4.6,-7.8]} size={[21.3,.18,.18]} color="#c9a45c" metalness={.84} roughness={.24} />
    <Block position={[0,4.6,7.8]} size={[21.3,.18,.18]} color="#c9a45c" metalness={.84} roughness={.24} />
    {[-10.5,0,10.5].map((x) => <group key={x}><Block position={[x,4.6,0]} size={[.16,.18,15.6]} color="#a7894d" metalness={.76} /><mesh position={[x,4.48,0]}><boxGeometry args={[.04,.02,14]} /><meshBasicMaterial color="#ffe0a4" /></mesh></group>)}
    {/* Inset marble wall panels and a vivid ruby gallery niche. */}
    <MarbleBlock position={[-5,2.1,-8.37]} size={[9.7,3.5,.06]} />
    <Block position={[5.4,2.1,-8.32]} size={[9.2,3.5,.12]} color="#4a1120" roughness={.78} />
    <mesh position={[-5,3.94,-8.21]}><boxGeometry args={[9.7,.025,.03]} /><meshBasicMaterial color="#ffe1a3" /></mesh>
    <mesh position={[5.4,3.94,-8.21]}><boxGeometry args={[9.2,.025,.03]} /><meshBasicMaterial color="#e02446" /></mesh>
    {/* Glass screens divide the atelier and meeting space. */}
    {[2.5,5,7.5].map((x) => <group key={x} position={[x,1.6,.3]}><mesh><boxGeometry args={[2.35,3.1,.045]} /><meshPhysicalMaterial color="#8fb5c2" transparent opacity={.13} roughness={.14} metalness={.12} depthWrite={false} /></mesh><Block position={[-1.2,0,0]} size={[.035,3.2,.08]} color="#c9a45c" metalness={.85} /></group>)}
    {/* Warm gilt & subtle ruby architectural shafts: low-cost translucent geometry; no postprocessing. */}
    {[-7,6].map((x, idx) => <mesh key={x} position={[x,2.8,-4]} rotation={[0,0,.25]}><coneGeometry args={[1.4,5.4,16,1,true]} /><meshBasicMaterial color={idx === 0 ? "#e6ba73" : "#c8173a"} transparent opacity={idx === 0 ? .04 : .026} side={THREE.DoubleSide} depthWrite={false} /></mesh>)}
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
