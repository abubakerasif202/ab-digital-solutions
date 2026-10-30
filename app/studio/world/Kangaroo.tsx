"use client";

import { useEffect, useId, useMemo } from "react";
import * as THREE from "three";
import { useSceneClock } from "./SceneClock";
import { worldState } from "./worldState";
import { createKangaroo } from "./sim/kangaroo-behavior";
import type { KangarooPose } from "./sim/kangaroo-behavior";

type Vec = [number, number, number];

/** Procedural red kangaroo (about 1.5 m standing) built from shared unit spheres; faces +z in its own frame. */
function createKangarooRig() {
  const sphere = new THREE.SphereGeometry(1, 14, 10);
  const mats = {
    fur: new THREE.MeshStandardMaterial({ color: "#a4573a", roughness: 0.92 }),
    dark: new THREE.MeshStandardMaterial({ color: "#6d3b2b", roughness: 0.9 }),
    cream: new THREE.MeshStandardMaterial({ color: "#e3d3b5", roughness: 0.95 }),
    black: new THREE.MeshStandardMaterial({ color: "#161010", roughness: 0.4 }),
    inner: new THREE.MeshStandardMaterial({ color: "#d9b8a0", roughness: 0.9 }),
  };
  const group = (parent: THREE.Object3D, x = 0, y = 0, z = 0, order: THREE.EulerOrder = "XYZ") => {
    const g = new THREE.Group(); g.position.set(x, y, z); g.rotation.order = order; parent.add(g); return g;
  };
  const blob = (parent: THREE.Object3D, m: THREE.Material, s: Vec, p: Vec) => {
    const o = new THREE.Mesh(sphere, m); o.scale.set(...s); o.position.set(...p); parent.add(o); return o;
  };

  const root = new THREE.Group();
  const squash = group(root);
  const hip = group(squash, 0, 0.75, 0);
  blob(hip, mats.fur, [0.17, 0.17, 0.2], [0, 0.02, -0.04]);
  const legs = [-1, 1].map((m) => {
    const thigh = group(hip, m * 0.11, 0, 0);
    blob(thigh, mats.fur, [0.085, 0.25, 0.11], [0, -0.2, 0.01]);
    const knee = group(thigh, 0, -0.4, 0);
    blob(knee, mats.fur, [0.04, 0.24, 0.05], [0, -0.21, 0]);
    const ankle = group(knee, 0, -0.42, 0);
    blob(ankle, mats.dark, [0.04, 0.036, 0.19], [0, -0.046, 0.12]);
    blob(ankle, mats.black, [0.034, 0.028, 0.04], [0, -0.05, 0.3]);
    return { thigh, knee, ankle };
  });

  const body = group(hip, 0, 0, 0, "YXZ");
  blob(body, mats.fur, [0.155, 0.31, 0.18], [0, 0.29, 0.04]);
  blob(body, mats.cream, [0.115, 0.24, 0.1], [0, 0.27, 0.135]);
  const neck = group(body, 0, 0.54, 0.07, "YXZ");
  blob(neck, mats.fur, [0.07, 0.13, 0.075], [0, 0.09, 0.02]);
  const head = group(neck, 0, 0.17, 0.03, "YXZ");
  blob(head, mats.fur, [0.062, 0.068, 0.085], [0, 0.02, 0.02]);
  blob(head, mats.fur, [0.037, 0.035, 0.115], [0, -0.012, 0.13]);
  blob(head, mats.cream, [0.03, 0.02, 0.09], [0, -0.04, 0.12]);
  blob(head, mats.black, [0.022, 0.02, 0.022], [0, -0.002, 0.24]);
  const ears = [1, -1].map((m) => {
    blob(head, mats.black, [0.011, 0.012, 0.011], [m * 0.05, 0.035, 0.07]);
    const ear = group(head, m * 0.035, 0.07, -0.02, "YXZ");
    blob(ear, mats.fur, [0.027, 0.095, 0.014], [0, 0.09, 0]);
    blob(ear, mats.inner, [0.017, 0.075, 0.008], [0, 0.085, 0.008]);
    return ear;
  });
  const arms = [1, -1].map((m) => {
    const shoulder = group(body, m * 0.1, 0.44, 0.1);
    blob(shoulder, mats.fur, [0.032, 0.075, 0.032], [0, -0.07, 0]);
    const elbow = group(shoulder, 0, -0.14, 0);
    blob(elbow, mats.fur, [0.026, 0.07, 0.026], [0, -0.07, 0]);
    const paw = group(elbow, 0, -0.14, 0);
    blob(paw, mats.dark, [0.03, 0.035, 0.045], [0, -0.02, 0.015]);
    return { shoulder, elbow };
  });
  const tail1 = group(body, 0, 0.02, -0.14);
  blob(tail1, mats.fur, [0.085, 0.085, 0.21], [0, 0, -0.21]);
  const tail2 = group(tail1, 0, 0, -0.42);
  blob(tail2, mats.fur, [0.06, 0.06, 0.2], [0, 0, -0.2]);
  const tail3 = group(tail2, 0, 0, -0.4);
  blob(tail3, mats.dark, [0.04, 0.04, 0.17], [0, 0, -0.17]);

  root.visible = false;
  const apply = (p: KangarooPose, visible: boolean) => {
    root.visible = visible;
    if (!visible) return;
    root.position.set(p.x, p.y, p.z);
    root.rotation.y = p.heading;
    squash.scale.set(1 - p.squash * 0.5, 1 + p.squash, 1 - p.squash * 0.5);
    hip.position.y = p.hipH;
    legs.forEach((leg) => { leg.thigh.rotation.x = -p.thigh; leg.knee.rotation.x = p.knee; leg.ankle.rotation.x = p.ankle; });
    body.rotation.set(p.bodyPitch, p.bodyYaw, -p.bodyRoll);
    neck.rotation.x = p.neckPitch;
    head.rotation.set(p.headPitch, p.headYaw, -p.headRoll);
    ears[0].rotation.set(p.earLPitch, 0, -p.earLYaw);
    ears[1].rotation.set(p.earRPitch, 0, p.earRYaw);
    arms[0].shoulder.rotation.x = -p.armL; arms[0].elbow.rotation.x = -p.elbowL;
    arms[1].shoulder.rotation.x = -p.armR; arms[1].elbow.rotation.x = -p.elbowR;
    tail1.rotation.x = p.tail1; tail2.rotation.x = p.tail2; tail3.rotation.x = p.tail3;
  };
  const dispose = () => { sphere.dispose(); Object.values(mats).forEach((m) => m.dispose()); };
  return { root, apply, dispose };
}

/**
 * Occasional red kangaroo on the footpath. Driven by `worldState`: reads `visitor` and `kangaroo.summon`,
 * writes `kangaroo.{active,x,z}`. Not interactive; hidden while away.
 */
export function Kangaroo() {
  const { scheduler } = useSceneClock();
  const id = useId();
  const sim = useMemo(() => createKangaroo(20260611), []);
  const rig = useMemo(() => createKangarooRig(), []);

  useEffect(() => {
    const roo = worldState.kangaroo;
    const off = scheduler.add(`kangaroo-${id}`, (dt) => {
      sim.step(dt, { visitor: worldState.visitor, summon: roo.summon });
      if (sim.consumedSummon) roo.summon = false;
      roo.active = sim.active;
      if (sim.active) { roo.x = sim.pose.x; roo.z = sim.pose.z; }
      rig.apply(sim.pose, sim.active);
    });
    return () => { off(); roo.active = false; };
  }, [scheduler, id, sim, rig]);
  useEffect(() => () => rig.dispose(), [rig]);

  return <primitive object={rig.root} />;
}
