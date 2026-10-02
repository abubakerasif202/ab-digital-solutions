/** Shared limits for restrained studio interactions. */
export const motionTokens = {
  duration: { carousel: 6500 },
  pointer: { ringLerp: 0.16, magneticLerp: 0.14, strength: 0.18, max: 8 },
  tilt: { maxDegrees: 3 },
} as const;
