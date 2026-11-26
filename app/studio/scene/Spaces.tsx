import { createContext, Suspense, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState, type RefObject } from "react";
import { Html, RoundedBox, useTexture } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import { monogramUrl, screenTextureUrl } from "../studio-assets";
import { Block, MarbleBlock, TrimBatch, brass } from "./Architecture";
import { useStudioModel } from "./load-model";
import { BrassMaterial, MarbleMaterial, RubyLacquerMaterial, VelvetMaterial } from "./Materials";
import { ConsultationDetail, GalleryStatusLight, ReceptionDetail, ServiceExhibit } from "./RoomDetails";
import { useSceneClock } from "../world/SceneClock";
import type { Area } from "../studio-state";
import type { StudioProject } from "../studio-data";
import { collectHotspotOccluders } from "./hotspot-occlusion";

/** Room labels step aside while an animal is framed, so they never cover it or swallow taps meant for it. */
export const HotspotsHiddenContext = createContext(false);
export const HotspotPortalContext = createContext<RefObject<HTMLDivElement | null> | undefined>(undefined);

type HotspotSlot = { distance: number; x: number; y: number; occluded: boolean; frame: number };
const hotspotSlots = new Map<string, HotspotSlot>();
const hotspotRay = new THREE.Raycaster();
const hotspotOccluders: THREE.Object3D[] = [];
const hotspotHits: THREE.Intersection[] = [];
const hotspotNdc = new THREE.Vector2();
const hotspotA = new THREE.Vector3();
const hotspotB = new THREE.Vector3();
const hotspotC = new THREE.Vector3();
const hotspotD = new THREE.Vector3();
const noRaycast = () => {};

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
    // Reserve the stage footer for the room caption and orbit hint, including the button half-height.
    const y = Math.max(marginY, Math.min(rawY, size.height - 84));
    const previous = hotspotSlots.get(label);
    const frame = (previous?.frame ?? 0) + 1;
    let occluded = previous?.occluded ?? false;
    if (!behind && !wayOff && frame % 4 === 1) {
      hotspotNdc.set(projected.x, projected.y);
      hotspotRay.setFromCamera(hotspotNdc, camera);
      hotspotRay.far = distance;
      collectHotspotOccluders(scene, hotspotOccluders);
      hotspotRay.intersectObjects(hotspotOccluders, false, hotspotHits);
      occluded = hotspotHits.length > 0 && hotspotHits[0].distance + 0.2 < distance;
      hotspotHits.length = 0;
      hotspotOccluders.length = 0;
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
  const { scheduler } = useSceneClock();
  const group = useRef<THREE.Group>(null);
  const halo = useRef<THREE.Mesh>(null);
  useEffect(() => {
    if (!animate) return;
    return scheduler.add("reception-monogram", (_dt, time) => {
      if (group.current) {
        group.current.rotation.y = Math.sin(time * 0.72) * 0.14;
        group.current.position.y = 3.15 + Math.sin(time * 1.15) * 0.04;
      }
      if (halo.current) {
        const s = 1 + Math.sin(time * 1.4) * 0.03;
        halo.current.scale.set(s, s, 1);
      }
    });
  }, [animate, scheduler]);
  // The monogram is roughly 3.2 x 1.8 m at source scale. Raised and pulled forward so the brass arch frames the letters.
  return <>
    <mesh ref={halo} position={[-5, 3.15, 1.56]}>
      <ringGeometry args={[1.08, 1.13, 48]} />
      <meshBasicMaterial color="#c8173a" transparent opacity={0.48} side={THREE.DoubleSide} depthWrite={false} />
    </mesh>
    <group ref={group} position={[-5, 3.15, 1.7]} scale={.4}><primitive object={model} /></group>
  </>;
}

function HarbourInlay() {
  const arch = useMemo(() => {
    const shape = new THREE.Shape();
    shape.moveTo(-.52, -.045);
    shape.quadraticCurveTo(0, .39, .52, -.045);
    shape.lineTo(.46, -.045);
    shape.quadraticCurveTo(0, .28, -.46, -.045);
    shape.closePath();
    return shape;
  }, []);
  // A small harbour-bridge maker's mark, using the studio's ruby and brass palette.
  return <group position={[-5,.58,4.556]}>
    <mesh position={[0,0,-.004]}><boxGeometry args={[1.3,.46,.034]} /><RubyLacquerMaterial color="#4b1622" /></mesh>
    <Block position={[0,-.09,.016]} size={[1.09,.024,.01]} color="#d8b879" metalness={.65} />
    <mesh position={[0,0,.016]}>
      <shapeGeometry args={[arch, 16]} />
      <meshStandardMaterial {...brass} color="#e2c386" />
    </mesh>
  </group>;
}

export function Reception({ animate, onSelect }: { animate: boolean; onSelect: (area: Area) => void }) {
  return <group>
    {/* Nero Portoro reception dais (top at the 0.12 m floor height); tiled so veins stay at slab scale. */}
    <MarbleBlock position={[-5,.08,3.4]} size={[7,.08,5]} repeat={[3,2]} />
    <MarbleBlock position={[-5,.46,4.25]} size={[5.6,.88,.6]} />
    <Block position={[-5,.15,4.56]} size={[5.5,.09,.03]} color="#c2a166" metalness={.8} />
    <RoundedBox position={[-5,.94,4.25]} args={[5.8,.12,.9]} radius={.06} smoothness={1} bevelSegments={2}><MarbleMaterial /></RoundedBox>
    <mesh position={[-5,.23,4.55]}><boxGeometry args={[5.3,.018,.02]} /><meshBasicMaterial color="#f4ce89" /></mesh>
    <HarbourInlay />
    <ReceptionDetail />
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
    applyScreenSampling(texture, Math.min(4, gl.capabilities.getMaxAnisotropy()));
  }, [texture, gl]);
  return <mesh position={[0,0,.13]}><planeGeometry args={[3.4,2.33]} /><meshBasicMaterial map={texture} toneMapped={false} /></mesh>;
}
function ProjectDisplay({ project, position, selected, crisp, onOpen }: { project: StudioProject; position: [number,number,number]; selected: boolean; crisp: boolean; onOpen: () => void }) {
  const [hover, setHover] = useState(false);
  return <group position={position}>
    <Block position={[0,-1.55,0]} size={[.19,.95,.15]} color="#c9a45c" metalness={.85} />
    <Block position={[0,-2.01,.1]} size={[1.2,.07,.69]} color="#16181c" metalness={.55} />
    <mesh onClick={(event) => { event.stopPropagation(); onOpen(); }} onPointerOver={() => setHover(true)} onPointerOut={() => setHover(false)}>
      <boxGeometry args={[3.65,2.58,.22]} />
      <meshStandardMaterial color={selected ? "#c9a45c" : hover ? "#9b7e47" : "#2b2520"} emissive={selected ? "#523811" : hover ? "#2d1a0b" : "#000000"} emissiveIntensity={selected ? .35 : hover ? .18 : 0} metalness={.78} roughness={.32} />
    </mesh>
    {/* Gilt slip between the frame and the capture, as a museum mount would have. Decorative only. */}
    <mesh position={[0,0,.118]} raycast={noRaycast}><boxGeometry args={[3.5,2.43,.02]} /><BrassMaterial /></mesh>
    <Suspense fallback={null}><DisplayImage image={screenTextureUrl(project.slug, crisp)} /></Suspense>
    <GalleryStatusLight active={selected} animate={crisp} />
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
    {/* Gallery stage in the same Portoro (top at the 0.24 m floor height), same footprint as before. */}
    <MarbleBlock position={[-5,.13,-4.5]} size={[10,.22,5.3]} repeat={[4,2]} />
    {/* Gilt front reveal and ruby inset ground the gallery platform; emissive only, no extra light. */}
    <mesh position={[-5,.1,-1.84]}><boxGeometry args={[9.6,.02,.012]} /><meshBasicMaterial color="#d9b66f" /></mesh>
    <mesh position={[-5,.245,-2.3]} rotation={[-Math.PI/2,0,0]}><planeGeometry args={[9.2,.05]} /><meshBasicMaterial color="#7a1228" /></mesh>
    {projects.slice(start, start + FRAMES).map((project, offset) => <ProjectDisplay key={project.slug} project={project} position={[-8.7 + offset*3.8,2.45,-5]} selected={start + offset === selected} crisp={crisp} onOpen={() => onProject(start + offset)} />)}
    <Hotspot area="gallery" label="Portfolio" position={[-5,.5,-1.6]} onSelect={onSelect} />
  </group>;
}

// Recessed shadow-gap bases lift each marble plinth off the floor; one draw call for all four.
const plinthBases = [0,1,2,3].map((index) => [[2.2 + index*2.2,.06,-4.4], [1.22,.1,1.22]] as const);

export function Services({ onSelect, onService }: { onSelect: (area: Area) => void; onService: (index: number) => void }) {
  return <group>
    <TrimBatch pieces={plinthBases}><meshStandardMaterial color="#0b0b0d" metalness={.3} roughness={.4} /></TrimBatch>
    {[0,1,2,3].map((index) => <group key={index} position={[2.2 + index*2.2,0,-4.4]}>
      <MarbleBlock position={[0,.56,0]} size={[1.35,.88,1.35]} />
      <Block position={[0,1.03,0]} size={[1.4,.05,1.4]} color="#a38a5e" metalness={.8} />
      <ServiceExhibit index={index} onOpen={() => onService(index)} />
      <mesh position={[0,.08,0]} rotation={[-Math.PI/2,0,0]}><ringGeometry args={[.95,.98,32]} /><meshBasicMaterial color="#b99a61" /></mesh>
    </group>)}
    <Hotspot area="services" label="Services" position={[5.5,.5,-1.6]} onSelect={onSelect} />
  </group>;
}

function Chair({ position, rotation = 0 }: { position: [number,number,number]; rotation?: number }) {
  return <group position={position} rotation={[0,rotation,0]}>
    <RoundedBox position={[0,.64,0]} args={[1.12,.28,1.08]} radius={.12} smoothness={1} bevelSegments={2}><VelvetMaterial color="#581425" /></RoundedBox>
    <RoundedBox position={[0,1.08,-.43]} rotation={[-.12,0,0]} args={[1.22,1.02,.24]} radius={.11} smoothness={1} bevelSegments={2}><VelvetMaterial color="#731a30" /></RoundedBox>
    {[-.57,.57].map(x => <RoundedBox key={x} position={[x,.91,0]} args={[.17,.36,.88]} radius={.08} smoothness={1} bevelSegments={2}><VelvetMaterial color="#64172b" /></RoundedBox>)}
    <mesh position={[0,.3,0]}><cylinderGeometry args={[.075,.075,.58,12]} /><BrassMaterial /></mesh>
    <mesh position={[0,.035,0]}><cylinderGeometry args={[.49,.52,.06,24]} /><BrassMaterial /></mesh>
  </group>;
}
function Bench({ position }: { position: [number,number,number] }) {
  return <group position={position} rotation={[0,.3,0]}>
    <RoundedBox position={[0,.58,0]} args={[2.2,.3,.85]} radius={.12} smoothness={1} bevelSegments={2}><VelvetMaterial color="#651629" /></RoundedBox>
    {[-.85,.85].map(x => <mesh key={x} position={[x,.24,0]}><boxGeometry args={[.06,.48,.65]} /><BrassMaterial /></mesh>)}
  </group>;
}
export function Consultation({ onSelect }: { onSelect: (area: Area) => void }) {
  return <group>
    <mesh position={[5.6,.08,4.3]} rotation={[-Math.PI/2,0,0]}><circleGeometry args={[3.4,48]} /><MarbleMaterial repeat={[2,2]} /></mesh>
    <mesh position={[5.6,.085,4.3]} rotation={[-Math.PI/2,0,0]}><ringGeometry args={[3.35,3.41,48]} /><meshBasicMaterial color="#c9a45c" /></mesh>
    {/* Deep ruby rug under the seating ring adds colour contrast against the dark floor and marble top. */}
    <mesh position={[5.6,.087,4.3]} rotation={[-Math.PI/2,0,0]}><ringGeometry args={[1.95,3.2,48]} /><meshStandardMaterial color="#3d0f1b" roughness={.95} emissive="#2a0610" emissiveIntensity={.35} /></mesh>
    <mesh position={[5.6,1.13,4.3]}><cylinderGeometry args={[1.8,1.8,.14,48]} /><MarbleMaterial /></mesh>
    <mesh position={[5.6,.56,4.3]}><cylinderGeometry args={[.42,.7,1.02,24]} /><meshStandardMaterial {...brass} /></mesh>
    {[0,1,2,3].map((i) => { const angle = i * Math.PI/2; return <Chair key={i} position={[5.6+Math.sin(angle)*2.45,0,4.3+Math.cos(angle)*2.45]} rotation={angle+Math.PI} />; })}
    <ConsultationDetail />
    <mesh position={[5.6,3.82,4.3]} rotation={[Math.PI/2,0,0]}><torusGeometry args={[1.5,.068,8,48]} /><meshStandardMaterial {...brass} /></mesh>
    <mesh position={[5.6,3.75,4.3]} rotation={[Math.PI/2,0,0]}><torusGeometry args={[1.5,.029,6,48]} /><meshBasicMaterial color="#ffe1a6" /></mesh>
    {[4.6,6.6].map((x) => <Block key={x} position={[x,4.2,4.3]} size={[.015,.8,.015]} color="#bca06b" metalness={.8} />)}
    <Hotspot area="consultation" label="Let’s talk" position={[5.6,.4,7.3]} onSelect={onSelect} />
  </group>;
}


