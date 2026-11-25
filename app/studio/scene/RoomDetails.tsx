import { useLayoutEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { brass } from "./Architecture";

type BoxDetail = readonly [
  color: string,
  center: readonly [number, number, number],
  size: readonly [number, number, number],
  rotationZ?: number,
];

const noRaycast = () => {};
const gold = "#c9a45c";
const light = "#edd9b0";
const ink = "#101418";
const ruby = "#a31630";

/** Batch small decorative pieces by object, not by piece. Existing room hit targets stay separate. */
function DetailBoxes({ pieces, metalness = .35, roughness = .55 }: { pieces: readonly BoxDetail[]; metalness?: number; roughness?: number }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    const dummy = new THREE.Object3D();
    const tint = new THREE.Color();
    pieces.forEach(([color, center, size, rotationZ = 0], index) => {
      dummy.position.set(...center);
      dummy.scale.set(...size);
      dummy.rotation.z = rotationZ;
      dummy.updateMatrix();
      mesh.setMatrixAt(index, dummy.matrix);
      mesh.setColorAt(index, tint.set(color));
    });
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    mesh.computeBoundingSphere();
  }, [pieces]);
  return <instancedMesh ref={ref} args={[undefined, undefined, pieces.length]} raycast={noRaycast}>
    <boxGeometry />
    <meshStandardMaterial metalness={metalness} roughness={roughness} emissive="#24100a" emissiveIntensity={.4} />
  </instancedMesh>;
}

const counter: readonly BoxDetail[] = [
  [ink, [-5,.11,4.48], [5.54,.14,.16]],
  [gold, [-5,.835,4.572], [5.46,.018,.021]],
  [gold, [-5,.315,4.572], [5.46,.018,.021]],
  [gold, [-7.48,.575,4.572], [.018,.52,.021]],
  [gold, [-2.52,.575,4.572], [.018,.52,.021]],
  [ink, [-6.7,1.013,4.27], [.56,.025,.39]],
  // Reeded brass fascia either side of the harbour inlay; the reeds stop short of the maker's mark.
  ...Array.from({ length: 22 }, (_, i) => -7.36 + i * .22)
    .filter((x) => Math.abs(x + 5) > .74)
    .map((x) => [gold, [x,.575,4.566], [.028,.46,.012]] satisfies BoxDetail),
  // Ruby piping under the counter's marble nosing.
  [ruby, [-5,.875,4.572], [5.46,.012,.014]],
];

export function ReceptionDetail() {
  return <>
    <DetailBoxes pieces={counter} />
    {/* Ruby toe-kick glow and a gilt floor reveal separate the counter from the dark plinth. */}
    <mesh position={[-5,.2,4.583]} raycast={noRaycast}>
      <boxGeometry args={[5.1,.025,.012]} />
      <meshBasicMaterial color="#c8173a" />
    </mesh>
    {/* An inset light channel is an emissive surface, not another shadow-casting light. */}
    <mesh position={[-5,2.45,2.635]} raycast={noRaycast}>
      <torusGeometry args={[1.97,.019,6,32,Math.PI]} />
      <meshBasicMaterial color="#ffdfa9" />
    </mesh>
  </>;
}

// The four physical exhibits match the canonical featured service order: web, commerce, SEO, systems.
const exhibits: readonly (readonly BoxDetail[])[] = [
  [
    [gold, [-.19,1.54,-.14], [.86,.68,.10]], [ink, [-.19,1.54,-.08], [.76,.58,.04]],
    [ruby, [-.19,1.71,-.051], [.69,.18,.012]], [light, [-.27,1.55,-.05], [.47,.024,.012]],
    [light, [-.28,1.46,-.05], [.45,.024,.012]], [gold, [-.19,1.15,-.14], [.11,.23,.12]],
    [gold, [.39,1.35,.23], [.31,.61,.10]], [ink, [.39,1.36,.285], [.25,.51,.02]],
    [ruby, [.39,1.48,.302], [.2,.16,.012]], [light, [.39,1.31,.302], [.16,.024,.012]],
  ],
  [
    [ink, [-.31,1.4,-.16], [.55,.69,.12]], [gold, [-.31,1.65,-.085], [.46,.11,.04]],
    [ruby, [-.31,1.43,-.085], [.38,.16,.04]], [light, [-.31,1.25,-.085], [.32,.05,.04]],
    [light, [.33,1.33,.09], [.56,.55,.49]], [gold, [.33,1.615,.09], [.11,.025,.50]],
    [gold, [.33,1.33,.341], [.11,.55,.02]], [ink, [.48,1.32,.355], [.15,.11,.012]],
  ],
  [
    [ink, [0,1.135,0], [1.18,.16,.49]],
    ...([.24,.37,.49,.67] as const).map((height, index) => [index === 3 ? ruby : gold,
      [-.42 + index * .28, 1.21 + height/2, .03], [.16,height,.12]] satisfies BoxDetail),
    [light, [.31,1.93,.03], [.18,.035,.15]],
  ],
  [
    [ink, [0,1.14,0], [1.18,.17,.48]],
    [ruby, [0,1.63,.03], [.28,.27,.22]], [gold, [-.41,1.79,.03], [.22,.18,.19]],
    [gold, [.41,1.79,.03], [.22,.18,.19]], [light, [0,1.31,.03], [.17,.16,.17]],
    [gold, [-.22,1.71,.03], [.34,.034,.045], -.35], [gold, [.22,1.71,.03], [.34,.034,.045], .35],
    [gold, [0,1.45,.03], [.033,.21,.045]],
  ],
];

export function ServiceExhibit({ index, onOpen }: { index: number; onOpen: () => void }) {
  const pieces = exhibits[index];
  if (!pieces) return null;
  return <group>
    <DetailBoxes pieces={pieces} metalness={.32} roughness={.43} />
    <mesh position={[0,1.5,0]} userData={{ studioOcclusion: false }} onClick={(event) => { event.stopPropagation(); onOpen(); }}>
      <boxGeometry args={[1.26,.93,.82]} />
      {/* This material keeps the interaction volume out of the rendered scene. */}
      <meshBasicMaterial visible={false} />
    </mesh>
  </group>;
}

const table: readonly BoxDetail[] = [
  [ink, [-.49,.031,.16], [.63,.062,.42]],
  [light, [-.49,.069,.16], [.53,.018,.34]],
  [ruby, [-.49,.084,.16], [.55,.014,.36]],
  [gold, [-.63,.107,.16], [.022,.022,.27]],
];

export function ConsultationDetail() {
  return <group position={[5.6,1.2,4.3]}>
    <DetailBoxes pieces={table} />
    {/* Gilt edge reveal under the marble top: emissive material only, no light. */}
    <mesh position={[0,-.151,0]} rotation={[Math.PI/2,0,0]} raycast={noRaycast}>
      <torusGeometry args={[1.79,.012,4,48]} />
      <meshBasicMaterial color="#e7c27a" />
    </mesh>
    <mesh position={[0,-.12,0]} raycast={noRaycast}>
      <cylinderGeometry args={[1.72,1.72,.04,32]} />
      <meshStandardMaterial {...brass} roughness={.35} />
    </mesh>
    {[.55,.97].map((x) => <mesh key={x} position={[x,.074,-.22]} raycast={noRaycast}>
      <cylinderGeometry args={[.075,.056,.145,12]} />
      <meshStandardMaterial color="#d4bc99" roughness={.21} />
    </mesh>)}
  </group>;
}

export function GalleryStatusLight({ active, animate }: { active: boolean; animate: boolean }) {
  const ref = useRef<THREE.Group>(null);
  const started = useRef<number | null>(null);
  const invalidate = useThree((state) => state.invalidate);
  useLayoutEffect(() => {
    if (!ref.current) return;
    started.current = active && animate ? performance.now() : null;
    ref.current.scale.x = started.current === null ? 1 : .15;
    invalidate();
  }, [active, animate, invalidate]);
  useFrame(() => {
    if (started.current === null || !ref.current) return;
    const progress = Math.min((performance.now() - started.current) / 320, 1);
    ref.current.scale.x = .15 + .85 * (1 - (1 - progress) ** 3);
    if (progress < 1) invalidate();
    else started.current = null;
  });
  return <group ref={ref} position={[0,-1.22,.128]}>
    <mesh raycast={noRaycast}>
      <boxGeometry args={[active ? 1.28 : .35,.024,.015]} />
      <meshBasicMaterial color={active ? "#c8173a" : "#5e4f3b"} />
    </mesh>
    {active && <mesh position={[0,.022,0]} raycast={noRaycast}>
      <boxGeometry args={[.72,.01,.015]} />
      <meshBasicMaterial color="#f5d99b" />
    </mesh>}
  </group>;
}
