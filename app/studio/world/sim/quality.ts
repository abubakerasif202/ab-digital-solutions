// Quality tiers use browser capability hints, renderer limits, and sustained frame timing.
export type Tier = "low" | "medium" | "high";
export type Capabilities = {
  cores?: number;
  memoryGb?: number;
  coarsePointer?: boolean;
  saveData?: boolean;
  reducedMotion?: boolean;
  lowBattery?: boolean;
  effectiveType?: string;
  softwareRenderer?: boolean;
  maxTexture?: number;
  medianFrameMs?: number;
};
export type TierConfig = { tier: Tier; cars: number; pedestrians: number; walkingStaff: boolean; simHz: number; landmarkDetail: 0 | 1 | 2; trees: number; dpr: number };

export function pickTier(c: Capabilities, ceiling: Tier = "high"): Tier {
  if (
    ceiling === "low" ||
    c.saveData ||
    c.reducedMotion ||
    c.lowBattery ||
    c.softwareRenderer ||
    c.effectiveType === "slow-2g" ||
    c.effectiveType === "2g"
  ) {
    return "low";
  }
  let score = 0;
  score += c.cores === undefined ? 1 : c.cores >= 8 ? 2 : c.cores >= 6 ? 1.5 : c.cores >= 4 ? 1 : 0;
  score += c.memoryGb === undefined ? 1 : c.memoryGb >= 8 ? 2 : c.memoryGb >= 4 ? 1 : 0;
  if (c.coarsePointer) score -= 1;
  if (c.medianFrameMs !== undefined) score += c.medianFrameMs <= 12 ? 1 : c.medianFrameMs <= 20 ? 0 : -2;
  if (score < 2) return "low";
  // Texture capacity is a ceiling only. A large limit says little about render throughput.
  const limitedTextureSize = c.maxTexture !== undefined && c.maxTexture < 8192;
  return score >= 4 && ceiling === "high" && !limitedTextureSize && !c.coarsePointer && c.effectiveType !== "3g"
    ? "high"
    : "medium";
}

export function stepDownTier(tier: Tier): Tier {
  return tier === "high" ? "medium" : "low";
}

export function readRuntimeCapabilities(): Capabilities {
  if (typeof window === "undefined" || typeof navigator === "undefined") return {};
  const nav = navigator as Navigator & {
    deviceMemory?: number;
    connection?: { saveData?: boolean; effectiveType?: string };
  };
  return {
    cores: typeof nav.hardwareConcurrency === "number" ? nav.hardwareConcurrency : undefined,
    memoryGb: typeof nav.deviceMemory === "number" ? nav.deviceMemory : undefined,
    coarsePointer: window.matchMedia("(pointer: coarse)").matches,
    saveData: Boolean(nav.connection?.saveData),
    effectiveType: nav.connection?.effectiveType,
    reducedMotion: window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  };
}

export const tierConfig: Record<Tier, TierConfig> = {
  low: { tier: "low", cars: 4, pedestrians: 3, walkingStaff: false, simHz: 24, landmarkDetail: 0, trees: 4, dpr: 1 },
  medium: { tier: "medium", cars: 7, pedestrians: 7, walkingStaff: true, simHz: 30, landmarkDetail: 1, trees: 8, dpr: 1.25 },
  high: { tier: "high", cars: 10, pedestrians: 12, walkingStaff: true, simHz: 45, landmarkDetail: 2, trees: 12, dpr: 1.5 },
};

// One-way runtime downgrade: two consecutive windows with a median frame above ~40 ms (<25 fps).
export const DOWNGRADE_WINDOW = 24;
export const DOWNGRADE_FRAME_MS = 40;
export function medianOf(values: number[]) {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted.length ? sorted[Math.floor(sorted.length / 2)] : 0;
}
export function shouldDowngrade(previousWindowSlow: boolean, window: number[]) {
  const slow = window.length >= DOWNGRADE_WINDOW && medianOf(window) > DOWNGRADE_FRAME_MS;
  return { slow, downgrade: slow && previousWindowSlow };
}

/** Pixel-area ceilings bound compositor/readback cost on wide or high-DPR viewports. */
export function canvasPixelRatio({ width, height, deviceDpr, tier, software }: {
  width: number; height: number; deviceDpr: number; tier: Tier; software: boolean;
}) {
  const maxPixels = software ? 105_000 : tier === "low" ? 1_000_000 : tier === "medium" ? 1_800_000 : 2_600_000;
  return Math.min(deviceDpr, tierConfig[tier].dpr, Math.sqrt(maxPixels / Math.max(1, width * height)));
}
