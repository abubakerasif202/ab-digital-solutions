// Pure behaviour for the seated receptionist: typing bursts, glances, posture shifts, and a greeting
// that eases in, waves exactly once per greeting onset, then settles back. No three/React imports.
import { mulberry32, range, pick } from "./rng";
import type { Rng } from "./rng";
import { approach, aimHead, blendPose, clamp, createPose, lerp, poseSeatedRest, poseSeatedTyping, poseWave, smooth } from "./humanoid-pose";
import type { Pose } from "./humanoid-pose";

export type ReceptionistMode = "typing" | "glance" | "lookAround" | "gesture" | "shift";
export type VisitorAim = { yaw: number; pitch: number }; // character-frame yaw (+ = her left) and pitch (+ = down)

export const GREET_EASE_IN = 0.6; // seconds for the greeting to take full effect
export const GREET_EASE_OUT = 0.9;
export const WAVE_DELAY = 0.45; // seconds after onset before the wave starts
export const WAVE_DURATION = 2.1;
export const MAX_DT = 0.1;
// A visitor can remain in reception indefinitely. Welcome once, then resume work.
export function createGreetingCue(seconds = 5.5) {
  let age = 0;
  return (dt: number, present: boolean) => {
    if (!present) { age = 0; return false; }
    age += clamp(dt, 0, MAX_DT);
    return age <= seconds;
  };
}
const KEYBOARD = { y: 0.69, z: 0.4 }; // palm height/forward reach from the hips, matching the workstation

const WEIGHTS: ReadonlyArray<readonly [ReceptionistMode, number]> = [["typing", 5], ["glance", 1.6], ["lookAround", 1.2], ["gesture", 0.8], ["shift", 1]];

export type Receptionist = {
  pose: Pose;
  mode: ReceptionistMode;
  /** 0..1 eased greeting weight (linear ramp, smoothstepped in the pose). */
  greetBlend: number;
  waveCount: number;
  waveAmount: number;
  /** 0..1 how busy her hands are; the view can use it to drive screen activity. */
  typingGain: number;
  time: number;
  step: (dt: number, greeting: boolean, visitor?: VisitorAim) => Pose;
};

export function createReceptionist(seed: number): Receptionist {
  const rng: Rng = mulberry32(seed);
  const pose = createPose(), activity = createPose(), attentive = createPose();
  const phase = range(rng, 0, 100);
  let mode: ReceptionistMode = "typing", modeT = 0, modeDur = range(rng, 4, 8), prevMode: ReceptionistMode = "typing";
  let burstOn = true, burstT = range(rng, 2, 5), gain = 0;
  let glanceYaw = 0, glancePitch = 0, shiftDir = 1, gestureSide = 1;
  let blinkIn = range(rng, 2, 5), blinkT = -1;
  let greetProgress = 0, wasGreeting = false;
  let wavePending = false, waveActive = false, waveT = 0, waveClock = 0;
  const self: Receptionist = {
    pose, mode, greetBlend: 0, waveCount: 0, waveAmount: 0, typingGain: 0, time: 0,
    step(dtIn, greeting, visitor = { yaw: 0, pitch: 0.05 }) {
      const dt = clamp(dtIn, 0, MAX_DT);
      self.time += dt;
      const t = self.time + phase;

      // Greeting onset schedules exactly one wave; ending cancels one that has not started.
      if (greeting && !wasGreeting) { wavePending = true; waveActive = false; }
      if (!greeting) wavePending = false;
      wasGreeting = greeting;
      greetProgress = clamp(greetProgress + (greeting ? dt / GREET_EASE_IN : -dt / GREET_EASE_OUT), 0, 1);
      const w = smooth(greetProgress);
      if (wavePending && greetProgress * GREET_EASE_IN >= WAVE_DELAY) { wavePending = false; waveActive = true; waveT = 0; self.waveCount++; }
      if (waveActive) { waveT += dt; waveClock += dt; if (waveT >= WAVE_DURATION) waveActive = false; }
      const waveTarget = waveActive && greeting ? Math.min(1, waveT / 0.35) * (waveT > WAVE_DURATION - 0.5 ? (WAVE_DURATION - waveT) / 0.5 : 1) : 0;
      self.waveAmount = approach(self.waveAmount, waveTarget, 9, dt);
      if (waveTarget === 0 && self.waveAmount < 0.005) self.waveAmount = 0;

      // Activity scheduler: she keeps working unless something small interrupts.
      modeT += dt;
      if (modeT >= modeDur) {
        prevMode = mode;
        let total = 0;
        for (const [m, wt] of WEIGHTS) total += m === prevMode && m !== "typing" ? 0 : wt;
        let roll = rng() * total;
        mode = "typing";
        for (const [m, wt] of WEIGHTS) {
          const eff = m === prevMode && m !== "typing" ? 0 : wt;
          if (roll < eff) { mode = m; break; }
          roll -= eff;
        }
        modeT = 0;
        modeDur = mode === "typing" ? range(rng, 4, 11) : mode === "glance" ? range(rng, 1.3, 2.4) : mode === "lookAround" ? range(rng, 2.4, 3.8) : mode === "gesture" ? range(rng, 1.8, 2.8) : range(rng, 1.4, 2.2);
        glanceYaw = range(rng, 0.25, 0.6) * pick(rng, [-1, 1]); glancePitch = range(rng, -0.12, 0.05);
        shiftDir = pick(rng, [-1, 1]); gestureSide = pick(rng, [-1, 1]);
      }
      self.mode = mode;
      const p = clamp(modeT / modeDur, 0, 1);
      const env = smooth(Math.min(p / 0.2, (1 - p) / 0.25, 1));

      burstT -= dt;
      if (burstT <= 0) { burstOn = !burstOn; burstT = burstOn ? range(rng, 2, 6) : range(rng, 0.5, 1.8); }
      gain = approach(gain, mode === "typing" && burstOn ? 1 : mode === "typing" ? 0.12 : mode === "shift" ? 0 : 0.05, 6, dt);
      self.typingGain = gain;

      poseSeatedTyping(activity, t, gain, KEYBOARD);
      if (mode === "glance") aimHead(activity, glanceYaw * env, glancePitch * env - 0.16 * env + 0.0, 1);
      else if (mode === "lookAround") aimHead(activity, 0.5 * Math.sin(p * Math.PI * 2) * env, -0.06 * env, 1);
      else if (mode === "shift") {
        activity.spinePitch = lerp(activity.spinePitch, -0.03, env); activity.hipsRoll = shiftDir * 0.04 * env;
        activity.spineRoll = -shiftDir * 0.03 * env; activity.headRoll = shiftDir * 0.05 * env;
      } else if (mode === "gesture") {
        const s = gestureSide > 0 ? "l" : "r";
        activity[`${s}ShoulderPitch`] = lerp(activity[`${s}ShoulderPitch`], 0.85, env) + 0.08 * Math.sin(t * 3.4) * env;
        activity[`${s}ShoulderYaw`] = lerp(activity[`${s}ShoulderYaw`], 0.1, env);
        activity[`${s}Elbow`] = lerp(activity[`${s}Elbow`], 1.55, env) + 0.12 * Math.sin(t * 3.4 + 1) * env;
        activity[`${s}WristPitch`] = lerp(activity[`${s}WristPitch`], 0.1, env);
        aimHead(activity, 0.16 * Math.sin(t * 1.3) * env, -0.2 * env, 1);
      }

      // Greeting pose: hands settle on the desk, back upright, eyes on the visitor, smiling.
      poseSeatedRest(attentive);
      attentive.spinePitch = -0.03;
      const nod = Math.sin(t * 1.1) > 0.94 ? 0.1 : 0;
      aimHead(attentive, clamp(visitor.yaw, -0.9, 0.9), clamp(visitor.pitch, -0.3, 0.4) + nod, 1);

      blendPose(pose, activity, attentive, w);
      if (self.waveAmount > 0) poseWave(pose, waveClock, self.waveAmount);

      // Face and breathing.
      blinkIn -= dt;
      if (blinkIn <= 0 && blinkT < 0) { blinkT = 0; blinkIn = range(rng, 2.5, 6); }
      if (blinkT >= 0) { blinkT += dt; if (blinkT > 0.16) blinkT = -1; }
      pose.blink = blinkT < 0 ? 0 : Math.sin((blinkT / 0.16) * Math.PI);
      pose.smile = lerp(0.18, 0.95, w) + (self.waveAmount > 0.05 ? 0.05 : 0);
      pose.brow = 0.55 * w + 0.12 * (mode === "glance" ? env : 0);
      pose.spinePitch += 0.012 * Math.sin(t * 1.5);
      pose.lShoulderRoll += 0.01 * Math.sin(t * 1.5); pose.rShoulderRoll += 0.01 * Math.sin(t * 1.5);
      self.greetBlend = greetProgress;
      return pose;
    },
  };
  return self;
}
