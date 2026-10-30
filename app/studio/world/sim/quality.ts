// Quality tiers come from measured capability (cores, memory, input type, texture limit, a short
// frame-time probe) and never from screen width alone.
export type Tier = "low" | "medium" | "high";
export type Capabilities = { cores?: number; memoryGb?: number; coarsePointer?: boolean; saveData?: boolean; maxTexture?: number; medianFrameMs?: number };
export type TierConfig = { tier: Tier; cars: number; pedestrians: number; walkingStaff: boolean; simHz: number; landmarkDetail: 0 | 1 | 2; trees: number; dpr: number; antialias: boolean };

export function pickTier(c: Capabilities): Tier {
  if (c.saveData) return "low";
  let score = 0;
  score += c.cores === undefined ? 1 : c.cores >= 8 ? 2 : c.cores >= 6 ? 1.5 : c.cores >= 4 ? 1 : 0;
  score += c.memoryGb === undefined ? 1 : c.memoryGb >= 8 ? 2 : c.memoryGb >= 4 ? 1 : 0;
  score += c.maxTexture !== undefined && c.maxTexture >= 8192 ? 1 : 0;
  if (c.coarsePointer) score -= 1;
  if (c.medianFrameMs !== undefined) score += c.medianFrameMs <= 12 ? 1 : c.medianFrameMs <= 20 ? 0 : -2;
  return score >= 4 ? "high" : score >= 2 ? "medium" : "low";
}

export const tierConfig: Record<Tier, TierConfig> = {
  low: { tier: "low", cars: 4, pedestrians: 3, walkingStaff: false, simHz: 24, landmarkDetail: 0, trees: 4, dpr: 1, antialias: false },
  medium: { tier: "medium", cars: 7, pedestrians: 7, walkingStaff: true, simHz: 30, landmarkDetail: 1, trees: 8, dpr: 1.25, antialias: false },
  high: { tier: "high", cars: 10, pedestrians: 12, walkingStaff: true, simHz: 45, landmarkDetail: 2, trees: 12, dpr: 1.5, antialias: true },
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
