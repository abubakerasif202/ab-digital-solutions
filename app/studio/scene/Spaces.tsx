import { createContext, Suspense, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState, type RefObject } from "react";
import { Html, RoundedBox, useTexture } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { monogramUrl, screenTextureUrl } from "../studio-assets";
import { Block, MarbleBlock, brass } from "./Architecture";
import { useStudioModel } from "./load-model";
import { BrassMaterial, MarbleMaterial } from "./Materials";
import type { Area } from "../studio-state";
import type { StudioProject } from "../studio-data";

/** Room labels step aside while an animal is framed, so they never cover it or swallow taps meant for it. */
export const HotspotsHiddenContext = createContext(false);
export const HotspotPortalContext = createContext<RefObject<HTMLDivElement | null> | undefined>(undefined);

type HotspotSlot = { distance: number; x: number; y: number; occluded: boolean; frame: number };
const hotspotSlots = new Map<string, HotspotSlot>();
const hotspotRay = new THREE.Raycaster();
const hotspotNdc = new THREE.Vector2();
const hotspotA = new THREE.Vector3();
const hotspotB = new THREE.Vector3();
const hotspotC = new THREE.Vector3();
const hotspotD = new THREE.Vector3();

function Hotspot({ area, label, position, onSelect }: { area: Area; label: string; position: [number,number,number]; onSelect: (area: Area) => void }) {
  const portal = useContext(HotspotPortalContext);
  const hiddenByAnimal = useContext(HotspotsHiddenContext);
  const scene = useThree((state) => state.scene);
  const button = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (hiddenByAnimal) hotspotSlots.delete(label);
    return () => { hotspotSlots.delete(label); };
  }, [hiddenByAnimal, label]);
  const calculatePosition = useCallback((el: THREE.Object3D, camera: THREE.Camera, size: { width: number; height: number }) => {
    const anchor = hotspotA.setFromMatrixPosition(el.matrixWorld);
    const camPos = hotspotB.setFromMatrixPosition(camera.matrixWorld);
    const behind = hotspotC.copy(anchor).sub(camPos).angleTo(camera.getWorldDirection(hotspotD)) > Math.PI / 2;
    const distance = anchor.distanceTo(camPos);
    const projected = hotspotC.copy(anchor).project(camera);
    const rawX = projected.x * size.width / 2 + size.width / 2;
    const rawY = -(projected.y * size.height / 2) + size.height / 2;
    const wayOff = rawX < -size.width || rawX > size.width * 2 || rawY < -size.height || rawY > size.height * 2;
    const marginX = Math.min(78, Math.max(36, size.width * 0.14), Math.max(8, size.width / 2 - 8));
    const marginY = Math.min(28, Math.max(16, size.height * 0.06), Math.max(8, size.height / 2 - 8));
    const x = Math.min(Math.max(rawX, marginX), size.width - marginX);
    const y = Math.min(Math.max(rawY, marginY), size.height - marginY);
    const previous = hotspotSlots.get(label);
    const frame = (previous?.frame ?? 0) + 1;
    let occluded = previous?.occluded ?? false;
    if (!behind && !wayOff && frame % 4 === 1) {
      hotspotNdc.set(projected.x, projected.y);
      hotspotRay.setFromCamera(hotspotNdc, camera);
      hotspotRay.far = distance;
      const hits = hotspotRay.intersectObjects(scene.children, true);
      occluded = hits.length > 0 && hits[0].distance + 0.2 < distance;
      hotspotRay.far = Infinity;
    }
    hotspotSlots.set(label, { distance, x, y, occluded, frame });
    let crowded = false;
    if (!behind && !wayOff && !occluded) {
      for (const [other, slot] of hotspotSlots) {
        if (other !== label && slot.distance < distance && Math.hypot(slot.x - x, slot.y - y) < 92) crowded = true;
      }
    }
    const hide = behind || wayOff || occluded || crowded;
    const node = button.current;
    if (node) {
      node.style.visibility = hide ? "hidden" : "visible";
      node.style.pointerEvents = hide ? "none" : "auto";
    }
    return [x, y] as [number, number];
  }, [label, scene]);
  if (hiddenByAnimal) return null;
  // Drei retains the pre-React-19 non-null RefObject signature; Html guards current.
  return <Html portal={portal as RefObject<HTMLElement> | undefined} position={position} center zIndexRange={[10, 0]} calculatePosition={calculatePosition} style={{ pointerEvents: "auto" }}>
    <button ref={button} className="ab-spatial-hotspot" type="button" onClick={() => onSelect(area)} aria-label={`Explore ${label}`}><span aria-hidden="true">+</span>{label}</button>
  </Html>;
}

function Sculpture({ animate }: { animate: boolean }) {
  const { scene } = useStudioModel(monogramUrl);
  const model = useMemo(() => scene.clone(true), [scene]);
  const group = useRef<THREE.Group>(null);
  const elapsed = useRef(0);
  useFrame((_, delta) => {
    if (!animate || !group.current) return;
    elapsed.current += Math.min(delta,.05);
    group.current.rotation.y = Math.sin(elapsed.current * .8) * .12;
  });
  // The monogram is roughly 3.2 x 1.8 m at source scale. Raised and pulled forward so the brass arch frames the letters.
  return <group ref={group} position={[-5, 3.15, 1.7]} scale={.4}><primitive object={model} /></group>;
}

export function Reception({ animate, onSelect }: { animate: boolean; onSelect: (area: Area) => void }) {
  return <group>
    <Block position={[-5,.08,3.4]} size={[7,.08,5]} color="#171d20" roughness={.8} />
    <MarbleBlock position={[-5,.46,4.25]} size={[5.6,.88,.6]} />
    <Block position={[-5,.15,4.56]} size={[5.5,.09,.03]} color="#c2a166" metalness={.8} />
    <RoundedBox position={[-5,.94,4.25]} args={[5.8,.12,.9]} radius={.06} smoothness={1} bevelSegments={2}><MarbleMaterial /></RoundedBox>
    <mesh position={[-5,.23,4.55]}><boxGeometry args={[5.3,.018,.02]} /><meshBasicMaterial color="#f4ce89" /></mesh>
    <Bench position={[-8.6,0,5.9]} />
    {/* Staff-side work shelf: the receptionist’s keyboard and monitor sit here, hidden from visitors by the counter. */}
    <Block position={[-5.6,.755,3.52]} size={[4.4,.05,.85]} color="#2b2f31" metalness={.3} roughness={.45} />
    {[-7.6,-3.6].map((x) => <Block key={x} position={[x,.38,3.52]} size={[.05,.76,.8]} color="#bca06b" metalness={.8} />)}
    <mesh position={[-5,2.45,2.6]}><torusGeometry args={[2,.055,8,48,Math.PI]} /><meshStandardMaterial {...brass} /></mesh>
    {[-7,-3].map((x) => <Block key={x} position={[x,1.3,2.6]} size={[.11,2.6,.11]} color="#bca06b" metalness={.8} />)}
    <Sculpture animate={animate} />
    <Hotspot area="reception" label="Reception" position={[-5,.4,6]} onSelect={onSelect} />
  </group>;
}

/** Three.js textures are mutable GPU resources. Drei caches one instance per URL, so configure it and never dispose it. */
function applyScreenSampling(map: THREE.Texture, anisotropy: number) {
  map.colorSpace = THREE.SRGBColorSpace;
  map.anisotropy = anisotropy;
  map.generateMipmaps = true;
  map.minFilter = THREE.LinearMipmapLinearFilter;
  map.magFilter = THREE.LinearFilter;
  map.needsUpdate = true;
}

function DisplayImage({ image }: { image: string }) {
  const texture = useTexture(image);
  const gl = useThree((state) => state.gl);
  useLayoutEffect(() => {
    applyScreenSampling(texture, gl.capabilities.getMaxAnisotropy());
  }, [texture, gl]);
  return <mesh position={[0,0,.13]}><planeGeometry args={[3.4,2.33]} /><meshBasicMaterial map={texture} toneMapped={false} /></mesh>;
}
function ProjectDisplay({ project, position, selected, crisp, onOpen }: { project: StudioProject; position: [number,number,number]; selected: boolean; crisp: boolean; onOpen: () => void }) {
  const [hover, setHover] = useState(false);
  return <group position={position}>
    <Block position={[0,-1.5,0]} size={[.09,1,.09]} color="#ad9361" metalness={.8} />
    <Block position={[0,-2,.1]} size={[1,.05,.65]} color="#423e34" metalness={.6} />
    <mesh onClick={(event) => { event.stopPropagation(); onOpen(); }} onPointerOver={() => setHover(true)} onPointerOut={() => setHover(false)}>
      <boxGeometry args={[3.65,2.58,.22]} />
      <meshStandardMaterial color={selected ? "#f0d49a" : hover ? "#e1c18a" : "#9a8055"} emissive={selected ? "#6b4f1c" : "#000000"} emissiveIntensity={selected ? .55 : 0} metalness={.75} roughness={.3} />
    </mesh>
    <Suspense fallback={null}><DisplayImage image={screenTextureUrl(project.slug, crisp)} /></Suspense>
    {/* A brass plinth light marks the selected frame without relying on colour alone. */}
    {selected && <Block position={[0,-1.45,.14]} size={[1.6,.035,.02]} color="#f4ce89" metalness={.4} />}
  </group>;
}
const FRAMES = 3;
export function galleryWindowStart(selected: number, total: number) {
  return Math.min(Math.max(selected - 1, 0), Math.max(total - FRAMES, 0));
}
/** Three physical frames slide over the whole portfolio, so at most three textures are live at once. */
export function Gallery({ projects, selected, crisp, onSelect, onProject }: { projects: StudioProject[]; selected: number; crisp: boolean; onSelect: (area: Area) => void; onProject: (index: number) => void }) {
  const start = galleryWindowStart(selected, projects.length);
  return <group>
    <Block position={[-5,.13,-4.5]} size={[10,.22,5.3]} color="#171d20" />
    {projects.slice(start, start + FRAMES).map((project, offset) => <ProjectDisplay key={project.slug} project={project} position={[-8.7 + offset*3.8,2.45,-5]} selected={start + offset === selected} crisp={crisp} onOpen={() => onProject(start + offset)} />)}
    <Hotspot area="gallery" label="Portfolio" position={[-5,.5,-1.6]} onSelect={onSelect} />
  </group>;
}

export function Services({ onSelect, onService }: { onSelect: (area: Area) => void; onService: (index: number) => void }) {
  return <group>
    {[0,1,2,3].map((index) => <group key={index} position={[2.2 + index*2.2,0,-4.4]}>
      <MarbleBlock position={[0,.5,0]} size={[1.35,1,1.35]} />
      <Block position={[0,1.03,0]} size={[1.4,.05,1.4]} color="#a38a5e" metalness={.8} />
      <mesh position={[0,1.8,0]} scale={.78} rotation={[.3,index*.45,.2]} onClick={(event) => { event.stopPropagation(); onService(index); }}>
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
    <RoundedBox position={[0,.64,0]} args={[1.12,.28,1.08]} radius={.12} smoothness={1} bevelSegments={2}><meshStandardMaterial color="#672333" roughness={.88} /></RoundedBox>
    <RoundedBox position={[0,1.08,-.43]} rotation={[-.12,0,0]} args={[1.22,1.02,.24]} radius={.11} smoothness={1} bevelSegments={2}><meshStandardMaterial color="#792c40" roughness={.88} /></RoundedBox>
    {[-.57,.57].map(x => <RoundedBox key={x} position={[x,.91,0]} args={[.17,.36,.88]} radius={.08} smoothness={1} bevelSegments={2}><meshStandardMaterial color="#672333" roughness={.88} /></RoundedBox>)}
    <mesh position={[0,.3,0]}><cylinderGeometry args={[.075,.075,.58,12]} /><BrassMaterial /></mesh>
    <mesh position={[0,.035,0]}><cylinderGeometry args={[.49,.52,.06,24]} /><BrassMaterial /></mesh>
  </group>;
}
function Bench({ position }: { position: [number,number,number] }) {
  return <group position={position} rotation={[0,.3,0]}>
    <RoundedBox position={[0,.58,0]} args={[2.2,.3,.85]} radius={.12} smoothness={1} bevelSegments={2}><meshStandardMaterial color="#652335" roughness={.9} /></RoundedBox>
    {[-.85,.85].map(x => <mesh key={x} position={[x,.24,0]}><boxGeometry args={[.06,.48,.65]} /><BrassMaterial /></mesh>)}
  </group>;
}
export function Consultation({ onSelect }: { onSelect: (area: Area) => void }) {
  return <group>
    <mesh position={[5.6,.08,4.3]} rotation={[-Math.PI/2,0,0]}><circleGeometry args={[3.4,48]} /><meshStandardMaterial color="#32272a" roughness={1} /></mesh>
    <mesh position={[5.6,1.13,4.3]}><cylinderGeometry args={[1.8,1.8,.14,48]} /><MarbleMaterial /></mesh>
    <mesh position={[5.6,.56,4.3]}><cylinderGeometry args={[.42,.7,1.02,24]} /><meshStandardMaterial {...brass} /></mesh>
    {[0,1,2,3].map((i) => { const angle = i * Math.PI/2; return <Chair key={i} position={[5.6+Math.sin(angle)*2.45,0,4.3+Math.cos(angle)*2.45]} rotation={angle+Math.PI} />; })}
    <mesh position={[5.6,1.4,4.3]}><cylinderGeometry args={[.12,.2,.45,12]} /><meshStandardMaterial {...brass} /></mesh>
    <mesh position={[5.6,3.8,4.3]} rotation={[Math.PI/2,0,0]}><torusGeometry args={[1.5,.045,8,48]} /><meshBasicMaterial color="#ffe1a6" /></mesh>
    {[4.6,6.6].map((x) => <Block key={x} position={[x,4.2,4.3]} size={[.015,.8,.015]} color="#bca06b" metalness={.8} />)}
    <Hotspot area="consultation" label="Let’s talk" position={[5.6,.4,7.3]} onSelect={onSelect} />
  </group>;
}


