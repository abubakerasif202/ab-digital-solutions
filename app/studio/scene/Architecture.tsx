import { useLayoutEffect, useRef, type ReactNode } from "react";
import { BrassMaterial, MarbleMaterial, RubyLacquerMaterial, useBlockResources } from "./Materials";
import * as THREE from "three";

// Roughness .3, not mirror-smooth: thin brass tori and posts alias badly at grazing angles when glossier.
export const brass = { color: "#c9a45c", metalness: 0.88, roughness: 0.3 };
export const charcoal = { color: "#14171b", metalness: 0.22, roughness: 0.48 };

export function Block({ position, size, color = "#14171b", metalness = 0.18, roughness = 0.48 }: { position: [number, number, number]; size: [number, number, number]; color?: string; metalness?: number; roughness?: number }) {
  const { geometry, material } = useBlockResources(color, metalness, roughness);
  // The provider owns these resources; unmounting one block must not dispose its neighbours.
  return <mesh position={position} scale={size} geometry={geometry} material={material} dispose={null} />;
}

export function MarbleBlock({ position, size, repeat }: { position: [number, number, number]; size: [number, number, number]; repeat?: readonly [number, number] }) {
  return <mesh position={position}><boxGeometry args={size} /><MarbleMaterial repeat={repeat} /></mesh>;
}

type Piece = readonly [position: readonly [number, number, number], size: readonly [number, number, number]];
const noRaycast = () => {};

/**
 * Decorative trim batched into one draw call per material. Trim never takes pointer
 * events or hides wayfinding labels, so it skips raycasting entirely.
 */
export function TrimBatch({ pieces, children }: { pieces: readonly Piece[]; children: ReactNode }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    const matrix = new THREE.Matrix4();
    const position = new THREE.Vector3();
    const scale = new THREE.Vector3();
    const rotation = new THREE.Quaternion();
    pieces.forEach(([p, s], index) => mesh.setMatrixAt(index, matrix.compose(position.set(...p), rotation, scale.set(...s))));
    mesh.instanceMatrix.needsUpdate = true;
    mesh.computeBoundingSphere();
  }, [pieces]);
  return <instancedMesh ref={ref} args={[undefined, undefined, pieces.length]} raycast={noRaycast} userData={{ studioOcclusion: false }}>
    <boxGeometry />
    {children}
  </instancedMesh>;
}

const columnXs = [-10.5, 0, 10.5] as const;
const columnZs = [-7.8, 7.8] as const;

// Floor reveal grid: hairline inlays seen almost edge-on, so they get a honed gilt finish (below)
// instead of polished brass, which sparkled pixel to pixel along their length.
const floorInlays: readonly Piece[] = [
  ...[-7.5, -3.75, 0, 3.75, 7.5].map((x) => [[x, .05, 0], [.016, .008, 17.3]] as const),
  ...[-5.75, -2.9, 0, 2.9, 5.75].map((z) => [[0, .05, z], [22.3, .008, .016]] as const),
];

// Brushed brass: columns and capitals, beams, cornice lip, dado rail, niche architraves.
const brassTrim: readonly Piece[] = [
  ...columnXs.flatMap((x) => columnZs.flatMap((z) => [
    [[x, 2.3, z], [.24, 4.6, .24]] as const,
    [[x, 4.64, z], [.55, .12, .55]] as const,
    // Turned base collar above the stone plinth.
    [[x, .36, z], [.34, .05, .34]] as const,
  ])),
  [[0, 4.6, -7.8], [21.3, .18, .18]],
  [[0, 4.6, 7.8], [21.3, .18, .18]],
  ...columnXs.map((x) => [[x, 4.6, 0], [.16, .18, 15.6]] as const),
  // Cornice: two stepped brass lips over a dark frieze, along the back and side walls.
  [[0, 4.1, -8.6], [22.7, .12, .38]],
  [[-11.1, 3.68, 0], [.38, .12, 17.5]],
  [[0, 3.98, -8.44], [22.4, .03, .05]],
  [[-10.94, 3.56, 0], [.05, .03, 17.3]],
  // Dado rail at chair-back height on the side wall, where there is no marble panel.
  [[-10.93, 1.02, 0], [.04, .035, 17.3]],
  // Gilt architrave around the marble panel and the ruby niche.
  ...([[-5, 9.7], [5.4, 9.2]] as const).flatMap(([x, w]) => [
    [[x, 3.88, -8.33], [w + .12, .05, .05]] as const,
    [[x, .32, -8.33], [w + .12, .05, .05]] as const,
    [[x - w / 2 - .03, 2.1, -8.33], [.05, 3.61, .05]] as const,
    [[x + w / 2 + .03, 2.1, -8.33], [.05, 3.61, .05]] as const,
  ]),
  // Three bolection panel outlines inside the ruby niche.
  ...[2.45, 5.4, 8.35].flatMap((x) => [
    [[x, 3.35, -8.245], [2.5, .022, .018]] as const,
    [[x, .85, -8.245], [2.5, .022, .018]] as const,
    [[x - 1.25, 2.1, -8.245], [.022, 2.52, .018]] as const,
    [[x + 1.25, 2.1, -8.245], [.022, 2.52, .018]] as const,
    // Slim picture-light hood over each niche panel (its lamp is the emissive strip below).
    [[x, 3.56, -8.2], [1.3, .035, .09]] as const,
  ]),
  // Brass book-match seams split the marble panel into three slabs, as a real wall would be laid.
  ...[-6.617, -3.383].map((x) => [[x, 2.1, -8.335], [.018, 3.5, .012]] as const),
];

// Lamps of the niche picture lights: emissive only, so they read as light without another light source.
const nichePictureLamps: readonly Piece[] = [2.45, 5.4, 8.35].map((x) => [[x, 3.535, -8.165], [1.22, .012, .02]] as const);

// Shadow-gap skirting and stone column plinths: dark, low and grounding.
const plinthTrim: readonly Piece[] = [
  [[0, .14, -8.43], [22.4, .2, .05]],
  [[-10.93, .14, 0], [.05, .2, 17.3]],
  ...columnXs.flatMap((x) => columnZs.map((z) => [[x, .17, z], [.42, .3, .42]] as const)),
  // Recessed frieze band under the cornice.
  [[0, 3.92, -8.43], [22.4, .1, .03]],
];

const mullions: readonly Piece[] = [1.3, 3.8, 6.3].map((x) => [[x, 1.6, .3], [.035, 3.2, .08]] as const);

export function Architecture() {
  return <group>
    <Block position={[0,-.4,0]} size={[23,.8,18]} color="#0a0c0f" metalness={.45} roughness={.28} />
    <Block position={[0,.02,0]} size={[22.5,.04,17.5]} color="#0d1014" metalness={.36} roughness={.28} />
    <Block position={[0,2,-8.6]} size={[22.5,4,.3]} color="#131014" roughness={.55} />
    <Block position={[-11.1,1.8,0]} size={[.3,3.6,17.5]} color="#141014" roughness={.55} />
    <TrimBatch pieces={brassTrim}><BrassMaterial /></TrimBatch>
    <TrimBatch pieces={floorInlays}><meshStandardMaterial color="#b4935a" metalness={.6} roughness={.58} /></TrimBatch>
    <TrimBatch pieces={nichePictureLamps}><meshBasicMaterial color="#ffe2a8" /></TrimBatch>
    <TrimBatch pieces={plinthTrim}><meshStandardMaterial color="#0b0b0d" metalness={.3} roughness={.36} /></TrimBatch>
    {/* Vertical brass fluting behind the marble and niche. */}
    <WallFlutes />
    {/* Concealed LED coves: one emissive strip per beam, no extra lights. */}
    {columnXs.map((x) => <mesh key={x} position={[x,4.48,0]} raycast={noRaycast}><boxGeometry args={[.04,.02,14]} /><meshBasicMaterial color="#ffe0a4" /></mesh>)}
    {/* Inset marble wall panel and a lacquered ruby gallery niche. */}
    <MarbleBlock position={[-5,2.1,-8.37]} size={[9.7,3.5,.06]} />
    <mesh position={[5.4,2.1,-8.32]}><boxGeometry args={[9.2,3.5,.12]} /><RubyLacquerMaterial /></mesh>
    <mesh position={[-5,3.94,-8.21]} raycast={noRaycast}><boxGeometry args={[9.7,.025,.03]} /><meshBasicMaterial color="#ffe1a3" /></mesh>
    <mesh position={[5.4,3.94,-8.21]} raycast={noRaycast}><boxGeometry args={[9.2,.025,.03]} /><meshBasicMaterial color="#e02446" /></mesh>
    {/* Glass screens divide the atelier and meeting space; brass mullions batched below. */}
    {[2.5,5,7.5].map((x) => <mesh key={x} position={[x,1.6,.3]}><boxGeometry args={[2.35,3.1,.045]} /><meshPhysicalMaterial color="#8fb5c2" transparent opacity={.13} roughness={.14} metalness={.12} depthWrite={false} /></mesh>)}
    <TrimBatch pieces={mullions}><BrassMaterial /></TrimBatch>
    {/* Warm gilt & subtle ruby architectural shafts: low-cost translucent geometry; no postprocessing. */}
    {[-7,6].map((x, idx) => <mesh key={x} position={[x,2.8,-4]} rotation={[0,0,.25]} raycast={noRaycast}><coneGeometry args={[1.4,5.4,16,1,true]} /><meshBasicMaterial color={idx === 0 ? "#e6ba73" : "#c8173a"} transparent opacity={idx === 0 ? .04 : .026} side={THREE.DoubleSide} depthWrite={false} /></mesh>)}
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
  return <instancedMesh ref={ref} args={[undefined, undefined, 38]} raycast={noRaycast}><boxGeometry args={[.025,3.9,.035]} /><BrassMaterial /></instancedMesh>;
}
