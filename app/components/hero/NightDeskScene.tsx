"use client";

import { Canvas, useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { SVGLoader } from "three/examples/jsm/loaders/SVGLoader.js";
import { LOGO_PATHS, LOGO_VIEWBOX } from "../logo-mark";
import { screenTextureUrl } from "../../studio/studio-assets";
import { paintHarbour } from "./harbour-texture";

type Vec3 = [number, number, number];

export type NightDeskSceneProps = {
  slugs: readonly string[];
  screen: number;
  lampOn: boolean;
  hue: number;
  active: boolean;
  onReady: () => void;
  onNextScreen: () => void;
  onToggleLamp: () => void;
  onCycleHue: () => void;
};

/** Vivid lighting states for the neon sign's wash: ruby, harbour cyan, violet. */
const HUES = ["#ff2d55", "#35c9ff", "#9d7bff"] as const;
const CAMERA_HOME = new THREE.Vector3(-1.95, 1.72, 3.55);
const CAMERA_START = new THREE.Vector3(-2.12, 1.8, 3.9);
const CAMERA_TARGET = new THREE.Vector3(0.78, 1.16, -0.9);
const UP = new THREE.Vector3(0, 1, 0);

const pointer = (cursor: string) => ({
  onPointerOver: (event: ThreeEvent<PointerEvent>) => { event.stopPropagation(); document.body.style.cursor = cursor; },
  onPointerOut: () => { document.body.style.cursor = ""; },
});

/** A rounded limb between two joints. */
function Limb({ from, to, radius, color }: { from: Vec3; to: Vec3; radius: number; color: string }) {
  const { position, quaternion, length } = useMemo(() => {
    const a = new THREE.Vector3(...from);
    const b = new THREE.Vector3(...to);
    const direction = b.clone().sub(a);
    return {
      position: a.clone().add(b).multiplyScalar(0.5),
      quaternion: new THREE.Quaternion().setFromUnitVectors(UP, direction.clone().normalize()),
      length: direction.length(),
    };
  }, [from, to]);
  return (
    <mesh position={position} quaternion={quaternion}>
      <capsuleGeometry args={[radius, length, 6, 14]} />
      <meshStandardMaterial color={color} roughness={0.85} />
    </mesh>
  );
}

const HOODIE = "#e7e1d3";
const TROUSERS = "#232a3d";
const SKIN = "#b47b55";

/** Seated developer facing the screens. Proportions follow a ~1.75 m adult. */
function Developer() {
  const head = useRef<THREE.Group>(null);
  const torso = useRef<THREE.Group>(null);
  const leftHand = useRef<THREE.Group>(null);
  const rightHand = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    // Slow glance between the two screens, a breath, and unhurried typing.
    if (head.current) {
      head.current.rotation.y = -0.2 - 0.3 * (0.5 + 0.5 * Math.sin(t * 0.32));
      head.current.rotation.x = 0.05 * Math.sin(t * 0.5);
    }
    if (torso.current) torso.current.scale.setScalar(1 + 0.008 * Math.sin(t * 1.3));
    if (leftHand.current) leftHand.current.position.y = 0.006 * Math.max(0, Math.sin(t * 7.1));
    if (rightHand.current) rightHand.current.position.y = 0.006 * Math.max(0, Math.sin(t * 6.3 + 1.7));
  });

  return (
    <group position={[0.1, 0, 0.32]}>
      {/* Chair */}
      <mesh position={[0, 0.5, 0.05]}><boxGeometry args={[0.5, 0.07, 0.5]} /><meshStandardMaterial color="#12151f" roughness={0.6} /></mesh>
      <mesh position={[0, 0.8, 0.31]} rotation={[0.1, 0, 0]}><boxGeometry args={[0.44, 0.44, 0.05]} /><meshStandardMaterial color="#12151f" roughness={0.6} /></mesh>
      <mesh position={[0, 0.26, 0.05]}><cylinderGeometry args={[0.035, 0.035, 0.46, 12]} /><meshStandardMaterial color="#2a3042" metalness={0.7} roughness={0.3} /></mesh>
      <mesh position={[0, 0.035, 0.05]}><cylinderGeometry args={[0.3, 0.32, 0.04, 24]} /><meshStandardMaterial color="#1a1e2b" metalness={0.5} roughness={0.4} /></mesh>

      {/* Legs */}
      <Limb from={[-0.1, 0.6, 0.1]} to={[-0.12, 0.6, -0.32]} radius={0.075} color={TROUSERS} />
      <Limb from={[0.1, 0.6, 0.1]} to={[0.12, 0.6, -0.32]} radius={0.075} color={TROUSERS} />
      <Limb from={[-0.12, 0.56, -0.34]} to={[-0.12, 0.12, -0.3]} radius={0.06} color={TROUSERS} />
      <Limb from={[0.12, 0.56, -0.34]} to={[0.12, 0.12, -0.3]} radius={0.06} color={TROUSERS} />
      <mesh position={[-0.12, 0.05, -0.36]}><boxGeometry args={[0.1, 0.08, 0.26]} /><meshStandardMaterial color="#f1ede4" roughness={0.7} /></mesh>
      <mesh position={[0.12, 0.05, -0.36]}><boxGeometry args={[0.1, 0.08, 0.26]} /><meshStandardMaterial color="#f1ede4" roughness={0.7} /></mesh>

      {/* Torso and hood */}
      <group ref={torso} position={[0, 0.9, 0.06]} rotation={[-0.1, 0, 0]}>
        <mesh><capsuleGeometry args={[0.175, 0.3, 8, 18]} /><meshStandardMaterial color={HOODIE} roughness={0.9} /></mesh>
        <mesh position={[0, 0.25, 0.09]} rotation={[0.5, 0, 0]}><torusGeometry args={[0.1, 0.045, 10, 20]} /><meshStandardMaterial color={HOODIE} roughness={0.9} /></mesh>
      </group>

      {/* Arms reach the keyboard */}
      <Limb from={[-0.2, 1.1, 0.02]} to={[-0.27, 0.9, -0.16]} radius={0.058} color={HOODIE} />
      <Limb from={[0.2, 1.1, 0.02]} to={[0.27, 0.9, -0.16]} radius={0.058} color={HOODIE} />
      <Limb from={[-0.27, 0.9, -0.16]} to={[-0.15, 0.84, -0.46]} radius={0.05} color={HOODIE} />
      <Limb from={[0.27, 0.9, -0.16]} to={[0.15, 0.84, -0.46]} radius={0.05} color={HOODIE} />
      <group ref={leftHand}><mesh position={[-0.14, 0.825, -0.52]}><sphereGeometry args={[0.045, 14, 12]} /><meshStandardMaterial color={SKIN} roughness={0.7} /></mesh></group>
      <group ref={rightHand}><mesh position={[0.14, 0.825, -0.52]}><sphereGeometry args={[0.045, 14, 12]} /><meshStandardMaterial color={SKIN} roughness={0.7} /></mesh></group>

      {/* Head, hair and headphones */}
      <mesh position={[0, 1.17, 0.03]}><cylinderGeometry args={[0.05, 0.055, 0.1, 12]} /><meshStandardMaterial color={SKIN} roughness={0.7} /></mesh>
      <group ref={head} position={[0, 1.33, 0.02]}>
        <mesh scale={[1, 1.1, 1.02]}><sphereGeometry args={[0.115, 24, 20]} /><meshStandardMaterial color={SKIN} roughness={0.7} /></mesh>
        <mesh position={[0, 0.025, 0.02]} scale={[1.04, 1.08, 1.06]}>
          <sphereGeometry args={[0.118, 24, 20, 0, Math.PI * 2, 0, Math.PI * 0.58]} />
          <meshStandardMaterial color="#17120f" roughness={0.95} />
        </mesh>
        <mesh rotation={[0, 0, 0]}><torusGeometry args={[0.132, 0.012, 8, 28, Math.PI]} /><meshStandardMaterial color="#10131c" metalness={0.5} roughness={0.4} /></mesh>
        <mesh position={[-0.128, -0.01, 0]} rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[0.048, 0.048, 0.035, 18]} /><meshStandardMaterial color="#d21736" roughness={0.5} /></mesh>
        <mesh position={[0.128, -0.01, 0]} rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[0.048, 0.048, 0.035, 18]} /><meshStandardMaterial color="#d21736" roughness={0.5} /></mesh>
      </group>
    </group>
  );
}

/** Loads one screen capture and releases it on unmount. */
function useScreenTexture(slug: string) {
  const [texture, setTexture] = useState<THREE.Texture | null>(null);
  useEffect(() => {
    let cancelled = false;
    let loaded: THREE.Texture | null = null;
    new THREE.TextureLoader().load(screenTextureUrl(slug, false), (value) => {
      if (cancelled) { value.dispose(); return; }
      value.colorSpace = THREE.SRGBColorSpace;
      value.anisotropy = 4;
      loaded = value;
      setTexture(value);
    });
    return () => { cancelled = true; loaded?.dispose(); };
  }, [slug]);
  return texture;
}

function Monitor({ slug, width, position, rotation, onClick }: { slug: string; width: number; position: Vec3; rotation?: Vec3; onClick: () => void }) {
  const texture = useScreenTexture(slug);
  const height = width * 0.62;
  const veil = useRef<THREE.MeshBasicMaterial>(null);
  useEffect(() => { if (veil.current) veil.current.opacity = 1; }, [texture]);
  useFrame((_, delta) => {
    if (veil.current && veil.current.opacity > 0) veil.current.opacity = Math.max(0, veil.current.opacity - delta * 1.8);
  });
  return (
    <group position={position} rotation={rotation}>
      <mesh onClick={(event) => { event.stopPropagation(); onClick(); }} {...pointer("pointer")}>
        <boxGeometry args={[width + 0.04, height + 0.04, 0.035]} />
        <meshStandardMaterial color="#0c0e15" metalness={0.6} roughness={0.35} />
      </mesh>
      <mesh position={[0, 0, 0.019]}>
        <planeGeometry args={[width, height]} />
        {texture
          ? <meshBasicMaterial key={texture.uuid} map={texture} toneMapped={false} />
          : <meshBasicMaterial color="#141a2b" toneMapped={false} />}
      </mesh>
      <mesh position={[0, 0, 0.021]}>
        <planeGeometry args={[width, height]} />
        <meshBasicMaterial ref={veil} color="#05060c" transparent opacity={1} toneMapped={false} />
      </mesh>
      <mesh position={[0, -height / 2 - 0.1, -0.03]}><boxGeometry args={[0.05, 0.22, 0.03]} /><meshStandardMaterial color="#1b2030" metalness={0.7} roughness={0.3} /></mesh>
      <mesh position={[0, -height / 2 - 0.21, 0]}><boxGeometry args={[0.3, 0.015, 0.18]} /><meshStandardMaterial color="#1b2030" metalness={0.7} roughness={0.3} /></mesh>
      <pointLight position={[0, 0, 0.5]} color="#9fc4ff" intensity={0.5} distance={2.2} />
    </group>
  );
}

const CODE_LINES: readonly (readonly [number, number, string][])[] = [
  [[0, 5, "#ff6b86"], [6, 4, "#f4f1ea"], [11, 7, "#4fd8ff"]],
  [[2, 6, "#a394ff"], [9, 9, "#f4f1ea"]],
  [[2, 4, "#a394ff"], [7, 5, "#ffb65c"], [13, 6, "#f4f1ea"]],
  [[4, 8, "#4fd8ff"], [13, 4, "#f4f1ea"]],
  [[4, 3, "#ff6b86"], [8, 10, "#ffb65c"]],
  [[2, 1, "#f4f1ea"]],
  [],
  [[0, 6, "#ff6b86"], [7, 8, "#4fd8ff"], [16, 2, "#f4f1ea"]],
  [[2, 5, "#a394ff"], [8, 7, "#f4f1ea"], [16, 3, "#ffb65c"]],
  [[2, 9, "#4fd8ff"], [12, 5, "#f4f1ea"]],
  [[4, 6, "#ffb65c"], [11, 6, "#f4f1ea"]],
  [[4, 4, "#a394ff"], [9, 9, "#4fd8ff"]],
  [[2, 1, "#f4f1ea"]],
  [[0, 1, "#f4f1ea"]],
];
const CODE_TOTAL = CODE_LINES.reduce((sum, line) => sum + line.reduce((n, [, length]) => n + length, 0), 0);

/** Portrait editor screen. Abstract syntax-coloured tokens are "typed" in, then the file starts again. */
function CodeScreen({ position, rotation }: { position: Vec3; rotation: Vec3 }) {
  const texture = useMemo(() => {
    const element = document.createElement("canvas");
    element.width = 240;
    element.height = 400;
    const map = new THREE.CanvasTexture(element);
    map.colorSpace = THREE.SRGBColorSpace;
    return map;
  }, []);
  useEffect(() => () => texture.dispose(), [texture]);
  const drawn = useRef(-1);
  const screen = useRef<THREE.MeshBasicMaterial>(null);

  useFrame(({ clock }) => {
    // 14 characters a second, then hold the finished file for two seconds.
    const typed = Math.min(CODE_TOTAL, Math.floor((clock.elapsedTime % (CODE_TOTAL / 14 + 2)) * 14));
    const caretOn = Math.floor(clock.elapsedTime * 2) % 2 === 0;
    const key = typed * 2 + (caretOn ? 1 : 0);
    if (key === drawn.current) return;
    const map = screen.current?.map;
    if (!map) return;
    drawn.current = key;
    const context = (map.image as HTMLCanvasElement).getContext("2d");
    if (!context) return;
    context.fillStyle = "#0b0e18";
    context.fillRect(0, 0, 240, 400);
    context.fillStyle = "#151a2a";
    context.fillRect(0, 0, 240, 26);
    let remaining = typed;
    let caret: [number, number] = [16, 44];
    CODE_LINES.forEach((line, row) => {
      const y = 44 + row * 24;
      context.fillStyle = "#39415a";
      context.fillRect(6, y + 2, 5, 6);
      for (const [column, length, color] of line) {
        if (remaining <= 0) break;
        const shown = Math.min(length, remaining);
        remaining -= shown;
        context.fillStyle = color;
        context.fillRect(20 + column * 9.5, y, shown * 9.5 - 4, 10);
        caret = [20 + (column + shown) * 9.5, y];
      }
    });
    if (caretOn) { context.fillStyle = "#f4f1ea"; context.fillRect(caret[0], caret[1] - 2, 3, 14); }
    map.needsUpdate = true;
  });

  return (
    <group position={position} rotation={rotation}>
      <mesh><boxGeometry args={[0.44, 0.7, 0.03]} /><meshStandardMaterial color="#0c0e15" metalness={0.6} roughness={0.35} /></mesh>
      <mesh position={[0, 0, 0.017]}><planeGeometry args={[0.4, 0.66]} /><meshBasicMaterial ref={screen} map={texture} toneMapped={false} /></mesh>
      <mesh position={[0, -0.44, -0.03]}><boxGeometry args={[0.04, 0.2, 0.03]} /><meshStandardMaterial color="#1b2030" metalness={0.7} roughness={0.3} /></mesh>
      <mesh position={[0, -0.535, 0]}><boxGeometry args={[0.22, 0.015, 0.16]} /><meshStandardMaterial color="#1b2030" metalness={0.7} roughness={0.3} /></mesh>
    </group>
  );
}

/** The AB monogram, extruded from the canonical logo outlines and lit as neon. */
function NeonSign({ hue, onClick }: { hue: string; onClick: () => void }) {
  const { letters, slash } = useMemo(() => {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg"><path id="a" d="${LOGO_PATHS.letterA}"/><path id="b" d="${LOGO_PATHS.letterB}"/><path id="s" d="${LOGO_PATHS.slash}"/></svg>`;
    const paths = new SVGLoader().parse(svg).paths;
    const extrude = (subset: typeof paths) =>
      new THREE.ExtrudeGeometry(subset.flatMap((path) => SVGLoader.createShapes(path)), { depth: 3, bevelEnabled: false });
    return { letters: extrude(paths.slice(0, 2)), slash: extrude(paths.slice(2)) };
  }, []);
  useEffect(() => () => { letters.dispose(); slash.dispose(); }, [letters, slash]);

  const scale = 0.021;
  const glow = useRef<THREE.PointLight>(null);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    // The poster shows the sign lit, so it never goes dark: two soft dips, then steady.
    const lit = t < 0.9 ? 1 : t < 0.98 ? 0.55 : t < 1.2 ? 1 : t < 1.26 ? 0.7 : 1;
    if (glow.current) glow.current.intensity = 4.2 * lit;
  });
  return (
    // SVG space is y-down: flip it and centre the mark on the group origin.
    <group onClick={(event) => { event.stopPropagation(); onClick(); }} {...pointer("pointer")}>
      <group scale={[scale, -scale, scale]} position={[(-LOGO_VIEWBOX.width / 2) * scale, (LOGO_VIEWBOX.height / 2) * scale, 0]}>
        <mesh geometry={letters}><meshBasicMaterial color="#fff6ee" toneMapped={false} /></mesh>
        {/* The slash is the brand mark: it stays ruby whatever the room lights do. */}
        <mesh geometry={slash}><meshBasicMaterial color="#ff2d55" toneMapped={false} /></mesh>
      </group>
      <mesh position={[0, 0, -0.03]}><planeGeometry args={[2.3, 1.75]} /><meshStandardMaterial color="#0d1019" roughness={0.9} /></mesh>
      <pointLight ref={glow} position={[0, 0, 0.7]} color={hue} intensity={4.2} distance={5} decay={1.7} />
    </group>
  );
}

function Lamp({ on, onClick }: { on: boolean; onClick: () => void }) {
  return (
    <group position={[1.78, 0.78, -0.95]} onClick={(event) => { event.stopPropagation(); onClick(); }} {...pointer("pointer")}>
      <mesh position={[0, 0.012, 0]}><cylinderGeometry args={[0.1, 0.11, 0.024, 24]} /><meshStandardMaterial color="#c9a25a" metalness={0.8} roughness={0.3} /></mesh>
      <mesh position={[0, 0.24, 0]}><cylinderGeometry args={[0.012, 0.012, 0.46, 10]} /><meshStandardMaterial color="#c9a25a" metalness={0.8} roughness={0.3} /></mesh>
      <mesh position={[-0.1, 0.5, 0.06]} rotation={[0.4, 0, 0.9]}><cylinderGeometry args={[0.012, 0.012, 0.3, 10]} /><meshStandardMaterial color="#c9a25a" metalness={0.8} roughness={0.3} /></mesh>
      <mesh position={[-0.24, 0.53, 0.12]} rotation={[0.5, 0, 0.5]}><coneGeometry args={[0.11, 0.15, 24, 1, true]} /><meshStandardMaterial color="#c9a25a" metalness={0.7} roughness={0.35} side={THREE.DoubleSide} /></mesh>
      <mesh position={[-0.25, 0.49, 0.14]}><sphereGeometry args={[0.035, 14, 12]} /><meshBasicMaterial color={on ? "#ffd9a0" : "#3a3329"} toneMapped={false} /></mesh>
      <pointLight position={[-0.3, 0.42, 0.2]} color="#ffb86b" intensity={on ? 3.2 : 0} distance={3.4} decay={1.7} />
    </group>
  );
}

function Room({ hue }: { hue: string }) {
  const harbour = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 1536;
    canvas.height = 640;
    paintHarbour(canvas);
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  }, []);
  useEffect(() => () => harbour.dispose(), [harbour]);

  const mullions = [-4.6, -3.25, -1.9, -0.55];
  return (
    <group>
      {/* Floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0.5]}><planeGeometry args={[16, 10]} /><meshStandardMaterial color="#0c0f18" roughness={0.42} metalness={0.35} /></mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0.6, 0.004, -0.3]}><circleGeometry args={[1.9, 40]} /><meshBasicMaterial color="#000" transparent opacity={0.4} /></mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0.5, 0.006, -0.1]}><planeGeometry args={[3.4, 2.2]} /><meshStandardMaterial color="#1d2336" roughness={0.95} /></mesh>

      {/* Harbour through the window */}
      <mesh position={[-2.05, 2.02, -3.1]}><planeGeometry args={[7.4, 3.1]} /><meshBasicMaterial map={harbour} toneMapped={false} /></mesh>
      <mesh position={[-2.05, 0.26, -2.5]}><boxGeometry args={[7.4, 0.52, 0.2]} /><meshStandardMaterial color="#10131d" roughness={0.8} /></mesh>
      <mesh position={[-2.05, 3.56, -2.5]}><boxGeometry args={[7.4, 0.5, 0.2]} /><meshStandardMaterial color="#10131d" roughness={0.8} /></mesh>
      {mullions.map((x) => (
        <mesh key={x} position={[x, 1.92, -2.5]}><boxGeometry args={[0.06, 2.9, 0.1]} /><meshStandardMaterial color="#0b0d14" roughness={0.6} /></mesh>
      ))}

      {/* Solid wall for the sign, and the return wall */}
      <mesh position={[3.1, 1.9, -2.5]}><boxGeometry args={[2.9, 3.8, 0.2]} /><meshStandardMaterial color="#121622" roughness={0.9} /></mesh>
      <mesh position={[4.5, 1.9, 0.5]} rotation={[0, -Math.PI / 2, 0]}><planeGeometry args={[6.2, 3.8]} /><meshStandardMaterial color="#0f121c" roughness={0.9} /></mesh>

      {/* Shelf with books */}
      <mesh position={[3.4, 0.55, -2.15]}><boxGeometry args={[1.6, 1.1, 0.4]} /><meshStandardMaterial color="#161a27" roughness={0.7} /></mesh>
      {[["#d21736", 0.26], ["#e7e1d3", 0.32], ["#35c9ff", 0.22], ["#9d7bff", 0.3], ["#ffb65c", 0.24]].map(([color, height], index) => (
        <mesh key={color} position={[2.95 + index * 0.085, 1.1 + Number(height) / 2, -2.15]}><boxGeometry args={[0.06, Number(height), 0.2]} /><meshStandardMaterial color={String(color)} roughness={0.7} /></mesh>
      ))}

      {/* Vivid washes from outside */}
      <pointLight position={[-4.2, 2.4, -1.6]} color="#35c9ff" intensity={5} distance={7} decay={1.6} />
      <pointLight position={[-1.4, 0.7, -2.0]} color={hue} intensity={2.2} distance={5} decay={1.8} />
    </group>
  );
}

function Desk() {
  return (
    <group>
      <mesh position={[0.75, 0.76, -0.72]}><boxGeometry args={[2.9, 0.05, 0.95]} /><meshStandardMaterial color="#5b3a26" roughness={0.55} /></mesh>
      <mesh position={[-0.62, 0.37, -0.72]}><boxGeometry args={[0.05, 0.74, 0.85]} /><meshStandardMaterial color="#141824" metalness={0.4} roughness={0.5} /></mesh>
      <mesh position={[2.12, 0.37, -0.72]}><boxGeometry args={[0.05, 0.74, 0.85]} /><meshStandardMaterial color="#141824" metalness={0.4} roughness={0.5} /></mesh>
      {/* Keyboard, trackpad and mug */}
      <mesh position={[0.1, 0.795, -0.48]}><boxGeometry args={[0.46, 0.018, 0.15]} /><meshStandardMaterial color="#1a1e2c" roughness={0.5} /></mesh>
      <mesh position={[0.5, 0.79, -0.48]}><boxGeometry args={[0.14, 0.008, 0.14]} /><meshStandardMaterial color="#252b3d" roughness={0.4} /></mesh>
      <mesh position={[0.72, 0.84, -0.5]}><cylinderGeometry args={[0.045, 0.04, 0.1, 18]} /><meshStandardMaterial color="#e7e1d3" roughness={0.6} /></mesh>
      {/* Plant */}
      <mesh position={[1.95, 0.86, -0.42]}><cylinderGeometry args={[0.09, 0.07, 0.15, 18]} /><meshStandardMaterial color="#c96f4a" roughness={0.8} /></mesh>
      {[[0, 0.2, 0, 0.13], [-0.09, 0.14, 0.03, 0.09], [0.09, 0.16, -0.02, 0.1], [0.02, 0.3, 0.02, 0.08]].map(([x, y, z, radius]) => (
        <mesh key={`${x}-${y}`} position={[1.95 + x, 0.9 + y, -0.42 + z]}><icosahedronGeometry args={[radius, 0]} /><meshStandardMaterial color="#2f7d5b" roughness={0.8} flatShading /></mesh>
      ))}
    </group>
  );
}

function Rig({ onReady }: { onReady: () => void }) {
  const camera = useThree((state) => state.camera);
  const announced = useRef(false);
  const look = useRef(CAMERA_TARGET.clone());
  const goal = useRef(new THREE.Vector3());

  useFrame(({ pointer: cursor }, delta) => {
    // Shallow parallax: the room shifts a little with the cursor, then settles.
    goal.current.set(CAMERA_HOME.x + cursor.x * 0.35, CAMERA_HOME.y + cursor.y * 0.16, CAMERA_HOME.z);
    // The same easing carries the opening dolly-in from CAMERA_START.
    camera.position.lerp(goal.current, 1 - Math.exp(-Math.min(delta, 0.05) * 1.9));
    camera.lookAt(look.current);
    if (!announced.current) { announced.current = true; onReady(); }
  });
  return null;
}

export default function NightDeskScene({ slugs, screen, lampOn, hue, active, onReady, onNextScreen, onToggleLamp, onCycleHue }: NightDeskSceneProps) {
  const color = HUES[hue % HUES.length];
  const main = slugs[screen % slugs.length];
  const side = slugs[(screen + 1) % slugs.length];

  useEffect(() => () => { document.body.style.cursor = ""; }, []);

  return (
    <Canvas
      frameloop={active ? "always" : "never"}
      dpr={[1, 1.5]}
      camera={{ position: CAMERA_START.toArray(), fov: 38, near: 0.1, far: 40 }}
      gl={{ antialias: true, powerPreference: "high-performance" }}
    >
      <color attach="background" args={["#070912"]} />
      <fog attach="fog" args={["#070912", 7, 16]} />
      <ambientLight intensity={0.85} color="#93a0d8" />
      <directionalLight position={[-3, 4, 3]} intensity={0.9} color="#c8d4ff" />
      <pointLight position={[-0.9, 2.3, 1.6]} color="#ffe2c4" intensity={3.2} distance={6} decay={1.7} />
      <Rig onReady={onReady} />
      <Room hue={color} />
      <Desk />
      <Monitor slug={main} width={1.02} position={[0.2, 1.36, -0.98]} onClick={onNextScreen} />
      <Monitor slug={side} width={0.86} position={[1.36, 1.31, -0.78]} rotation={[0, -0.55, 0]} onClick={onNextScreen} />
      <CodeScreen position={[-0.58, 1.34, -0.88]} rotation={[0, 0.5, 0]} />
      <Lamp on={lampOn} onClick={onToggleLamp} />
      <Developer />
      <group position={[3.0, 2.35, -2.37]}><NeonSign hue={color} onClick={onCycleHue} /></group>
    </Canvas>
  );
}
