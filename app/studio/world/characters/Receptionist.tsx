"use client";

import { useEffect, useId, useMemo, useRef } from "react";
import { Block } from "../../scene/Architecture";
import { useSceneClock } from "../SceneClock";
import { worldState } from "../worldState";
import { createGreetingCue, createReceptionist } from "../sim/receptionist-behavior";
import type { VisitorAim } from "../sim/receptionist-behavior";
import { CAST, createHumanoid, createHumanoidKit } from "./humanoid";
import { createScreen, Keyboard, Monitor, OfficeChair } from "./StudioStaff";

const BRASS = "#bca06b", CREAM = "#e8dcc4";

type Props = {
  /** True while the visitor is in the reception shot; she looks up, smiles and waves once per onset. */
  greeting?: boolean;
  /** Floor point under her chair. Default: behind the counter on the reception platform (top y = 0.12). */
  position?: [number, number, number];
  /** Top of the recessed work shelf the keyboard and monitor rest on (world y). */
  shelfY?: number;
};

export function Receptionist({ greeting = false, position = [-6.1, 0.12, 2.95], shelfY = 0.78 }: Props) {
  const { scheduler } = useSceneClock();
  const id = useId();
  const [px, py, pz] = position;
  const sim = useMemo(() => createReceptionist(20260503), []);
  const kit = useMemo(() => createHumanoidKit(), []);
  const rig = useMemo(() => { const r = createHumanoid(kit, CAST.receptionist); r.apply(sim.pose); return r; }, [kit, sim]);
  const screen = useMemo(() => createScreen("dashboard", 11), []);
  const greetingRef = useRef(greeting);
  useEffect(() => { greetingRef.current = greeting; }, [greeting]);

  useEffect(() => {
    const aim: VisitorAim = { yaw: 0, pitch: 0.05 };
    const greet = createGreetingCue();
    const offSim = scheduler.add(`receptionist-${id}`, (dt) => {
      const v = worldState.visitor, dx = v.x - px, dz = v.z - pz;
      aim.yaw = Math.atan2(dx, dz);
      aim.pitch = Math.atan2(-(v.y - (py + 1.35)), Math.hypot(dx, dz));
      sim.step(dt, greet(dt, greetingRef.current), aim);
      rig.apply(sim.pose);
    });
    const offScreen = scheduler.add(`receptionist-screen-${id}`, () => screen.repaint(), 1.1);
    return () => { offSim(); offScreen(); };
  }, [scheduler, id, sim, rig, screen, px, py, pz]);
  useEffect(() => () => { kit.dispose(); screen.dispose(); }, [kit, screen]);

  const shelf = shelfY - py; // shelf height above her floor
  return <group position={[px, py, pz]}>
    <OfficeChair color="#22272a" />
    <Monitor texture={screen.texture} position={[0, shelf, 0.8]} rotationY={Math.PI} width={0.5} />
    <Keyboard position={[0, shelf + 0.01, 0.42]} />
    <Block position={[-0.3, shelf + 0.012, 0.44]} size={[0.06, 0.024, 0.1]} color="#3a4147" />
    {/* Small plant, mug and notepad on the shelf. */}
    <group position={[0.5, shelf, 0.72]}>
      <mesh position={[0, 0.05, 0]}><cylinderGeometry args={[0.05, 0.04, 0.1, 12]} /><meshStandardMaterial color={BRASS} metalness={0.7} roughness={0.35} /></mesh>
      <mesh position={[0, 0.16, 0]} scale={[1, 1.15, 1]}><sphereGeometry args={[0.08, 10, 8]} /><meshStandardMaterial color="#2c4a37" roughness={0.9} /></mesh>
      <mesh position={[0.05, 0.22, 0.02]}><sphereGeometry args={[0.05, 8, 6]} /><meshStandardMaterial color="#35573f" roughness={0.9} /></mesh>
    </group>
    <mesh position={[-0.52, shelf + 0.05, 0.62]}><cylinderGeometry args={[0.038, 0.034, 0.1, 12]} /><meshStandardMaterial color={CREAM} roughness={0.5} /></mesh>
    <Block position={[0.3, shelf + 0.008, 0.5]} size={[0.16, 0.012, 0.22]} color="#d8cdb4" roughness={0.7} />
    <primitive object={rig.root} />
  </group>;
}
