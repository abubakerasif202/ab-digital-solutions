import { useMemo } from "react";
import { monogramUrl } from "../studio-assets";
import { Block, TrimBatch } from "./Architecture";
import { BrassMaterial, RubyLacquerMaterial } from "./Materials";
import { useStudioModel } from "./load-model";
import { layout } from "../world/world-layout";

const glass = { color: "#8fb3be", transparent: true, opacity: .13, roughness: .08, metalness: .12, depthWrite: false } as const;
type Piece = readonly [readonly [number, number, number], readonly [number, number, number]];
const noRaycast = () => {};

const z = layout.facadeZ;
const doorL = layout.door.x - layout.door.width / 2, doorR = layout.door.x + layout.door.width / 2;
const glazing: [number, number][] = [[-11.1, doorL], [doorR, 11.1]];
const TRANSOM_Y = 3.05;

// Every brass member of the storefront in one draw call: mullions, sills, transoms, door frame and fascia lip.
const brassMembers: readonly Piece[] = [
  ...glazing.flatMap(([a, b]) => {
    const width = b - a, cx = (a + b) / 2;
    const bays = Math.max(1, Math.round(width / 2.6));
    return [
      ...Array.from({ length: bays + 1 }, (_, i) => [[a + i * width / bays, 2.1, z], [.07, 4.2, .1]] as const),
      [[cx, .08, z], [width, .16, .14]] as const,
      // Transom bar: shop glazing reads as architecture, not one sheet, once it carries a clerestory line.
      [[cx, TRANSOM_Y, z + .01], [width, .045, .09]] as const,
    ];
  }),
  ...[doorL, doorR].map((x) => [[x, layout.door.height / 2, z], [.12, layout.door.height, .16]] as const),
  [[layout.door.x, layout.door.height + .05, z], [layout.door.width + .24, .1, .16]],
  [[0, 4.62, z + .02], [22.6, .06, .34]],
];

// Honed bluestone plinth course under the glazing: stops the glass from meeting the paving directly.
const plinthCourse: readonly Piece[] = glazing.map(([a, b]) => [[(a + b) / 2, .2, z + .04], [b - a, .4, .2]] as const);

// Front elevation of the studio: brass-framed glazing, an open entrance, fascia and the gold monogram.
export function Facade() {
  const { scene } = useStudioModel(monogramUrl);
  const sign = useMemo(() => scene.clone(true), [scene]);
  return <group>
    {glazing.map(([a, b]) => <mesh key={a} position={[(a + b) / 2, 2.1, z]}><boxGeometry args={[b - a, 4.2, .04]} /><meshPhysicalMaterial {...glass} /></mesh>)}
    <TrimBatch pieces={brassMembers}><BrassMaterial /></TrimBatch>
    <TrimBatch pieces={plinthCourse}><meshStandardMaterial color="#2a2d31" metalness={.08} roughness={.62} /></TrimBatch>
    {/* Transom glass over the door and the fascia carrying the monogram. */}
    <mesh position={[layout.door.x, (layout.door.height + 4.2) / 2 + .05, z]}><boxGeometry args={[layout.door.width, 4.2 - layout.door.height - .05, .04]} /><meshPhysicalMaterial {...glass} /></mesh>
    <Block position={[0, 4.35, z]} size={[22.4, .5, .3]} color="#101216" metalness={.38} roughness={.36} />
    <Block position={[layout.door.x, 3.62, z + .22]} size={[3.1, 1.2, .08]} color="#0c0e11" roughness={.5} />
    <mesh position={[layout.door.x, 3.62, z + .25]}><boxGeometry args={[2.95, 1.06, .03]} /><RubyLacquerMaterial /></mesh>
    <group position={[layout.door.x, 3.62, z + .32]} scale={.55}><primitive object={sign} /></group>
    <mesh position={[layout.door.x, 3.0, z + .5]} raycast={noRaycast}><boxGeometry args={[2.6, .03, .02]} /><meshBasicMaterial color="#ffe0a3" /></mesh>
    {/* Threshold slab; no canopy, so the monogram stays visible from the street. */}
    <Block position={[layout.door.x, .06, z + .3]} size={[layout.door.width + .6, .12, .6]} color="#1d2024" roughness={.32} />
    <mesh position={[layout.door.x, .125, z + .58]} raycast={noRaycast}><boxGeometry args={[layout.door.width + .2, .012, .02]} /><meshBasicMaterial color="#c8173a" /></mesh>
  </group>;
}

// Everything the cutaway slab doesn't cover: forecourt and the land between studio and harbour.
export function Ground() {
  return <mesh position={[0, -.07, 4]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[240, 88]} /><meshStandardMaterial color="#191b1f" roughness={.92} /></mesh>;
}
