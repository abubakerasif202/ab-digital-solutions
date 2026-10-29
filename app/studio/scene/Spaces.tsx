import { createContext, Suspense, useContext, useEffect, useMemo, useRef, useState, type RefObject } from "react";
import { Html, useGLTF, useTexture } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { Block, MarbleBlock, brass } from "./Architecture";
import type { Area } from "../studio-state";
import type { StudioProject } from "../studio-data";

export const HotspotPortalContext = createContext<RefObject<HTMLDivElement | null> | undefined>(undefined);

function Hotspot({ area, label, position, onSelect }: { area: Area; label: string; position: [number,number,number]; onSelect: (area: Area) => void }) {
  const portal = useContext(HotspotPortalContext);
  // Drei retains the pre-React-19 non-null RefObject signature; Html guards current.
  return <Html portal={portal as RefObject<HTMLElement> | undefined} position={position} center zIndexRange={[10, 0]} style={{ pointerEvents: "auto" }}>
    <button className="ab-spatial-hotspot" type="button" onClick={() => onSelect(area)} aria-label={`Explore ${label}`}><span aria-hidden="true">+</span>{label}</button>
  </Html>;
}

function Sculpture({ animate }: { animate: boolean }) {
  const { scene } = useGLTF("/studio/ab-monogram.glb", false, false);
  const model = useMemo(() => scene.clone(true), [scene]);
  const group = useRef<THREE.Group>(null);
  const elapsed = useRef(0);
  useFrame((_, delta) => {
    if (!animate || !group.current) return;
    elapsed.current += Math.min(delta,.05);
    group.current.rotation.y = Math.sin(elapsed.current * .8) * .12;
  });
  return <group ref={group} position={[-5,2.35,3.1]}><primitive object={model} /></group>;
}

export function Reception({ animate, onSelect }: { animate: boolean; onSelect: (area: Area) => void }) {
  return <group>
    <Block position={[-5,.08,3.4]} size={[7,.08,5]} color="#171d20" roughness={.8} />
    <MarbleBlock position={[-5,.75,4]} size={[5.6,1.4,1.1]} />
    <Block position={[-5,.15,4.58]} size={[5.5,.09,.03]} color="#c2a166" metalness={.8} />
    <Block position={[-5,1.48,4]} size={[5.8,.08,1.2]} color="#141a1c" metalness={.4} roughness={.2} />
    <mesh position={[-5,2.45,2.6]}><torusGeometry args={[2,.055,8,48,Math.PI]} /><meshStandardMaterial {...brass} /></mesh>
    {[-7,-3].map((x) => <Block key={x} position={[x,1.3,2.6]} size={[.11,2.6,.11]} color="#bca06b" metalness={.8} />)}
    <Sculpture animate={animate} />
    <Hotspot area="reception" label="Reception" position={[-5,.4,6]} onSelect={onSelect} />
  </group>;
}

function DisplayImage({ image }: { image: string }) {
  const texture = useTexture(image);
  // Do not mutate or dispose Drei's shared cache textures here.
  return <mesh position={[0,0,.13]}><planeGeometry args={[3.4,2.33]} /><meshBasicMaterial map={texture} toneMapped={false} /></mesh>;
}
function ProjectDisplay({ project, position, onOpen }: { project: StudioProject; position: [number,number,number]; onOpen: () => void }) {
  const [hover, setHover] = useState(false);
  return <group position={position}>
    <Block position={[0,-1.5,0]} size={[.09,1,.09]} color="#ad9361" metalness={.8} />
    <Block position={[0,-2,.1]} size={[1,.05,.65]} color="#423e34" metalness={.6} />
    <mesh onClick={(event) => { event.stopPropagation(); onOpen(); }} onPointerOver={() => setHover(true)} onPointerOut={() => setHover(false)}>
      <boxGeometry args={[3.65,2.58,.22]} /><meshStandardMaterial color={hover ? "#e1c18a" : "#9a8055"} metalness={.75} roughness={.3} />
    </mesh>
    <Suspense fallback={null}><DisplayImage image={`/studio/screens/${project.slug}.webp`} /></Suspense>
  </group>;
}
export function Gallery({ projects, onSelect, onProject }: { projects: StudioProject[]; onSelect: (area: Area) => void; onProject: (index: number) => void }) {
  return <group>
    <Block position={[-5,.13,-4.5]} size={[10,.22,5.3]} color="#171d20" />
    {projects.map((project, index) => <ProjectDisplay key={project.slug} project={project} position={[-8.7 + index*3.8,2.45,-5]} onOpen={() => onProject(index)} />)}
    <Hotspot area="gallery" label="Portfolio" position={[-5,.5,-1.6]} onSelect={onSelect} />
  </group>;
}

export function Services({ onSelect, onService }: { onSelect: (area: Area) => void; onService: (index: number) => void }) {
  return <group>
    {[0,1,2,3].map((index) => <group key={index} position={[2.2 + index*2.2,0,-4.4]}>
      <MarbleBlock position={[0,.5,0]} size={[1.35,1,1.35]} />
      <Block position={[0,1.03,0]} size={[1.4,.05,1.4]} color="#a38a5e" metalness={.8} />
      <mesh position={[0,1.9,0]} rotation={[.3,index*.45,.2]} onClick={(event) => { event.stopPropagation(); onService(index); }}>
        {index === 0 ? <boxGeometry args={[.9,.9,.9]} /> : index === 1 ? <torusGeometry args={[.53,.13,8,24]} /> : index === 2 ? <octahedronGeometry args={[.7,0]} /> : <icosahedronGeometry args={[.65,0]} />}
        <meshStandardMaterial color={index === 2 ? "#812d40" : "#c2a16b"} metalness={.72} roughness={.22} />
      </mesh>
      <mesh position={[0,.08,0]} rotation={[-Math.PI/2,0,0]}><ringGeometry args={[.95,.98,32]} /><meshBasicMaterial color="#b99a61" /></mesh>
    </group>)}
    <Hotspot area="services" label="Services" position={[5.5,.5,-1.6]} onSelect={onSelect} />
  </group>;
}

function Chair({ position, rotation = 0 }: { position: [number,number,number]; rotation?: number }) {
  return <group position={position} rotation={[0,rotation,0]}>
    <Block position={[0,.53,0]} size={[1.05,.25,1.05]} color="#632333" roughness={.95} />
    <Block position={[0,1,-.48]} size={[1.05,.95,.17]} color="#762e40" roughness={.95} />
    {[-.4,.4].flatMap((x) => [-.35,.35].map((z) => <Block key={`${x}-${z}`} position={[x,.23,z]} size={[.055,.46,.055]} color="#b49a67" metalness={.7} />))}
  </group>;
}
export function Consultation({ onSelect }: { onSelect: (area: Area) => void }) {
  return <group>
    <mesh position={[5.6,.08,4.3]} rotation={[-Math.PI/2,0,0]}><circleGeometry args={[3.4,48]} /><meshStandardMaterial color="#32272a" roughness={1} /></mesh>
    <mesh position={[5.6,1.13,4.3]}><cylinderGeometry args={[1.8,1.8,.14,48]} /><meshStandardMaterial color="#c8c0af" metalness={.1} roughness={.28} /></mesh>
    <mesh position={[5.6,.56,4.3]}><cylinderGeometry args={[.42,.7,1.02,24]} /><meshStandardMaterial {...brass} /></mesh>
    {[0,1,2,3].map((i) => { const angle = i * Math.PI/2; return <Chair key={i} position={[5.6+Math.sin(angle)*2.45,0,4.3+Math.cos(angle)*2.45]} rotation={angle+Math.PI} />; })}
    <mesh position={[5.6,1.4,4.3]}><cylinderGeometry args={[.12,.2,.45,12]} /><meshStandardMaterial {...brass} /></mesh>
    <mesh position={[5.6,3.8,4.3]} rotation={[Math.PI/2,0,0]}><torusGeometry args={[1.5,.045,8,48]} /><meshBasicMaterial color="#ffe1a6" /></mesh>
    {[4.6,6.6].map((x) => <Block key={x} position={[x,4.2,4.3]} size={[.015,.8,.015]} color="#bca06b" metalness={.8} />)}
    <Hotspot area="consultation" label="Let’s talk" position={[5.6,.4,7.3]} onSelect={onSelect} />
  </group>;
}

export function Ready({ onReady }: { onReady: () => void }) {
  useEffect(() => { const frame = requestAnimationFrame(onReady); return () => cancelAnimationFrame(frame); }, [onReady]);
  return null;
}
