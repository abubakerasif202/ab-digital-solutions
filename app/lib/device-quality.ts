"use client";

import { useCallback, useEffect, useState } from "react";

export type QualityTier = "fallback" | "low" | "medium" | "high";
export type ViewportTier = "mobile" | "tablet" | "desktop";
export type EffectiveConnectionType = "slow-2g" | "2g" | "3g" | "4g" | string;

export interface DeviceSignals {
  reducedMotion: boolean;
  coarsePointer: boolean;
  hoverCapable: boolean;
  viewportTier: ViewportTier;
  viewportWidth: number;
  devicePixelRatio: number;
  saveData: boolean;
  effectiveType?: EffectiveConnectionType;
  hardwareConcurrency?: number;
  deviceMemory?: number;
  batteryLevel?: number;
  batteryCharging?: boolean;
  webglSupported?: boolean;
  softwareRenderer?: boolean;
  maxTextureSize?: number;
}

export interface QualityPreset {
  dprCap: number;
  particleMultiplier: number;
  targetFps: 0 | 24 | 30 | 60;
}

export interface DeviceQualityProfile {
  tier: QualityTier;
  viewportTier: ViewportTier;
  dprCap: number;
  effectiveDpr: number;
  particleMultiplier: number;
  targetFps: 0 | 24 | 30 | 60;
  allowWebGL: boolean;
  allowAmbientVideo: boolean;
  allowContinuousMotion: boolean;
  prefersReducedMotion: boolean;
  isConstrained: boolean;
  reason: string;
  signals: DeviceSignals;
}

export interface DeviceQualityOptions {
  /** Probe WebGL context capability only after passing constrained-device guards. */
  probeWebGL?: boolean;
  /** Permit WebGL on mobile/coarse devices (defaults to false for hero/decorative 3D). */
  allowMobileWebGL?: boolean;
  /** Upper bound on resolved quality tier. */
  maxTier?: QualityTier;
  /** Defer initial capability resolution until requestIdleCallback / short timeout. */
  waitForIdle?: boolean;
}

export const QUALITY_PRESETS: Record<QualityTier, QualityPreset> = {
  fallback: { dprCap: 1, particleMultiplier: 0, targetFps: 0 },
  low: { dprCap: 1, particleMultiplier: 0.35, targetFps: 24 },
  medium: { dprCap: 1.25, particleMultiplier: 0.65, targetFps: 30 },
  high: { dprCap: 1.5, particleMultiplier: 1, targetFps: 60 },
};

const TIER_ORDER: readonly QualityTier[] = ["fallback", "low", "medium", "high"];

const DEFAULT_SIGNALS: DeviceSignals = {
  reducedMotion: false,
  coarsePointer: false,
  hoverCapable: true,
  viewportTier: "desktop",
  viewportWidth: 1280,
  devicePixelRatio: 1,
  saveData: false,
};

export const FALLBACK_QUALITY_PROFILE: DeviceQualityProfile = {
  tier: "fallback",
  viewportTier: "desktop",
  dprCap: QUALITY_PRESETS.fallback.dprCap,
  effectiveDpr: 1,
  particleMultiplier: QUALITY_PRESETS.fallback.particleMultiplier,
  targetFps: QUALITY_PRESETS.fallback.targetFps,
  allowWebGL: false,
  allowAmbientVideo: false,
  allowContinuousMotion: false,
  prefersReducedMotion: false,
  isConstrained: true,
  reason: "ssr-initial",
  signals: DEFAULT_SIGNALS,
};

export function getViewportTier(width: number): ViewportTier {
  if (width <= 720) return "mobile";
  if (width <= 1024) return "tablet";
  return "desktop";
}

export function isSlowConnection(effectiveType?: string): boolean {
  return effectiveType === "slow-2g" || effectiveType === "2g" || effectiveType === "3g";
}

export function isLowBattery(level?: number, charging?: boolean): boolean {
  if (typeof level !== "number" || Number.isNaN(level)) return false;
  return charging === false && level <= 0.2;
}

export function downgradeQualityTier(tier: QualityTier): QualityTier {
  const index = TIER_ORDER.indexOf(tier);
  return index > 0 ? TIER_ORDER[index - 1] : "fallback";
}

export function clampQualityTier(tier: QualityTier, maxTier: QualityTier): QualityTier {
  return TIER_ORDER.indexOf(tier) > TIER_ORDER.indexOf(maxTier) ? maxTier : tier;
}

function isPreConstrained(signals: DeviceSignals, allowMobileWebGL: boolean): boolean {
  if (signals.reducedMotion || signals.saveData || isSlowConnection(signals.effectiveType)) {
    return true;
  }
  if (isLowBattery(signals.batteryLevel, signals.batteryCharging)) {
    return true;
  }
  if (!allowMobileWebGL && (signals.viewportTier === "mobile" || signals.coarsePointer)) {
    return true;
  }
  if (typeof signals.hardwareConcurrency === "number" && signals.hardwareConcurrency > 0 && signals.hardwareConcurrency <= 2) {
    return true;
  }
  if (typeof signals.deviceMemory === "number" && signals.deviceMemory > 0 && signals.deviceMemory <= 2) {
    return true;
  }
  return false;
}

export function resolveQualityProfile(
  signals: DeviceSignals,
  options: Pick<DeviceQualityOptions, "allowMobileWebGL" | "maxTier"> = {},
): DeviceQualityProfile {
  const allowMobileWebGL = options.allowMobileWebGL ?? false;
  const maxTier = options.maxTier ?? "high";
  const slowNet = isSlowConnection(signals.effectiveType);
  const lowPower = isLowBattery(signals.batteryLevel, signals.batteryCharging);

  const buildProfile = (tier: QualityTier, reason: string): DeviceQualityProfile => {
    const boundedTier = clampQualityTier(tier, maxTier);
    const preset = QUALITY_PRESETS[boundedTier];
    const effectiveDpr = Math.min(Math.max(1, signals.devicePixelRatio || 1), preset.dprCap);
    const allowWebGL = boundedTier !== "fallback" && signals.webglSupported !== false;
    const allowAmbientVideo =
      !signals.reducedMotion &&
      !signals.saveData &&
      !slowNet &&
      !lowPower &&
      boundedTier !== "fallback";

    return {
      tier: boundedTier,
      viewportTier: signals.viewportTier,
      dprCap: preset.dprCap,
      effectiveDpr,
      particleMultiplier: preset.particleMultiplier,
      targetFps: preset.targetFps,
      allowWebGL,
      allowAmbientVideo,
      allowContinuousMotion: !signals.reducedMotion && !lowPower && boundedTier !== "fallback",
      prefersReducedMotion: signals.reducedMotion,
      isConstrained: boundedTier === "fallback" || boundedTier === "low",
      reason,
      signals,
    };
  };

  if (signals.reducedMotion) return buildProfile("fallback", "reduced-motion");
  if (signals.saveData) return buildProfile("fallback", "save-data");
  if (slowNet) return buildProfile("fallback", "slow-connection");
  if (lowPower) return buildProfile("fallback", "low-battery");
  if (signals.webglSupported === false) return buildProfile("fallback", "webgl-unavailable");

  if (!allowMobileWebGL && (signals.viewportTier === "mobile" || signals.coarsePointer)) {
    return buildProfile("fallback", signals.viewportTier === "mobile" ? "mobile-viewport" : "coarse-pointer");
  }

  const lowCores =
    typeof signals.hardwareConcurrency === "number" &&
    signals.hardwareConcurrency > 0 &&
    signals.hardwareConcurrency <= 4;
  const lowMemory =
    typeof signals.deviceMemory === "number" &&
    signals.deviceMemory > 0 &&
    signals.deviceMemory <= 4;

  if (signals.softwareRenderer) {
    return buildProfile("low", "software-renderer");
  }

  if (
    (typeof signals.hardwareConcurrency === "number" && signals.hardwareConcurrency > 0 && signals.hardwareConcurrency <= 2) ||
    (typeof signals.deviceMemory === "number" && signals.deviceMemory > 0 && signals.deviceMemory <= 2)
  ) {
    return buildProfile("fallback", "low-hardware-spec");
  }

  let score = 0;
  score += signals.hardwareConcurrency === undefined ? 1 : signals.hardwareConcurrency >= 8 ? 2 : signals.hardwareConcurrency >= 6 ? 1.5 : 0.5;
  score += signals.deviceMemory === undefined ? 1 : signals.deviceMemory >= 8 ? 2 : 0.5;
  if (signals.maxTextureSize !== undefined && signals.maxTextureSize >= 8192) score += 1;
  if (signals.coarsePointer) score -= 1;
  if (signals.viewportTier === "tablet") score -= 0.5;
  if (signals.viewportTier === "mobile") score -= 1.5;

  if (lowCores || lowMemory) {
    return buildProfile(allowMobileWebGL ? "low" : "fallback", "constrained-hardware");
  }

  if (score >= 4 && signals.viewportTier === "desktop" && !signals.coarsePointer) {
    return buildProfile("high", "high-capability-desktop");
  }
  if (score >= 2) {
    return buildProfile("medium", signals.viewportTier === "tablet" ? "tablet-balanced" : "balanced-capability");
  }
  return buildProfile("low", "low-capability");
}

interface NetworkInformationLike extends EventTarget {
  saveData?: boolean;
  effectiveType?: EffectiveConnectionType;
}

interface BatteryManagerLike extends EventTarget {
  level?: number;
  charging?: boolean;
}

type ExtendedNavigator = Navigator & {
  deviceMemory?: number;
  connection?: NetworkInformationLike;
  getBattery?: () => Promise<BatteryManagerLike>;
};

export function probeWebGLCapability(): {
  supported: boolean;
  softwareRenderer: boolean;
  maxTextureSize?: number;
} {
  if (typeof document === "undefined") {
    return { supported: false, softwareRenderer: false };
  }
  try {
    const canvas = document.createElement("canvas");
    const gl =
      (canvas.getContext("webgl2", { powerPreference: "low-power", failIfMajorPerformanceCaveat: false }) as WebGL2RenderingContext | null) ??
      (canvas.getContext("webgl", { powerPreference: "low-power", failIfMajorPerformanceCaveat: false }) as WebGLRenderingContext | null);

    if (!gl) {
      return { supported: false, softwareRenderer: false };
    }

    const maxTexture = gl.getParameter(gl.MAX_TEXTURE_SIZE);
    const debug = gl.getExtension("WEBGL_debug_renderer_info");
    const renderer = debug ? String(gl.getParameter(debug.UNMASKED_RENDERER_WEBGL)) : "";
    const softwareRenderer = /swiftshader|llvmpipe|software|microsoft basic render/i.test(renderer);

    // Explicitly release the temporary probe context immediately.
    gl.getExtension("WEBGL_lose_context")?.loseContext();

    return {
      supported: true,
      softwareRenderer,
      maxTextureSize: typeof maxTexture === "number" ? maxTexture : undefined,
    };
  } catch {
    return { supported: false, softwareRenderer: false };
  }
}

export function readDeviceSignals(
  options: Pick<DeviceQualityOptions, "probeWebGL" | "allowMobileWebGL"> & {
    batteryLevel?: number;
    batteryCharging?: boolean;
    cachedWebGL?: { supported: boolean; softwareRenderer: boolean; maxTextureSize?: number };
  } = {},
): DeviceSignals {
  if (typeof window === "undefined") {
    return DEFAULT_SIGNALS;
  }

  const nav = navigator as ExtendedNavigator;
  const width = window.innerWidth || DEFAULT_SIGNALS.viewportWidth;
  const baseSignals: DeviceSignals = {
    reducedMotion: window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    coarsePointer: window.matchMedia("(pointer: coarse)").matches,
    hoverCapable: window.matchMedia("(hover: hover)").matches,
    viewportTier: getViewportTier(width),
    viewportWidth: width,
    devicePixelRatio: window.devicePixelRatio || 1,
    saveData: Boolean(nav.connection?.saveData),
    effectiveType: nav.connection?.effectiveType,
    hardwareConcurrency: typeof nav.hardwareConcurrency === "number" ? nav.hardwareConcurrency : undefined,
    deviceMemory: typeof nav.deviceMemory === "number" ? nav.deviceMemory : undefined,
    batteryLevel: options.batteryLevel,
    batteryCharging: options.batteryCharging,
  };

  if (options.cachedWebGL) {
    return {
      ...baseSignals,
      webglSupported: options.cachedWebGL.supported,
      softwareRenderer: options.cachedWebGL.softwareRenderer,
      maxTextureSize: options.cachedWebGL.maxTextureSize,
    };
  }

  // Never initialize a WebGL context on constrained phones, Save-Data, or reduced-motion.
  if (options.probeWebGL && !isPreConstrained(baseSignals, options.allowMobileWebGL ?? false)) {
    const probed = probeWebGLCapability();
    return {
      ...baseSignals,
      webglSupported: probed.supported,
      softwareRenderer: probed.softwareRenderer,
      maxTextureSize: probed.maxTextureSize,
    };
  }

  return baseSignals;
}

export function detectDeviceQuality(options: DeviceQualityOptions = {}): DeviceQualityProfile {
  const signals = readDeviceSignals(options);
  return resolveQualityProfile(signals, options);
}

export function useDeviceQuality(options: DeviceQualityOptions = {}): DeviceQualityProfile & {
  ready: boolean;
  downgraded: boolean;
  downgrade: () => void;
} {
  const probeWebGL = options.probeWebGL ?? false;
  const allowMobileWebGL = options.allowMobileWebGL ?? false;
  const maxTier = options.maxTier ?? "high";
  const waitForIdle = options.waitForIdle ?? false;

  const [profile, setProfile] = useState<DeviceQualityProfile>(FALLBACK_QUALITY_PROFILE);
  const [ready, setReady] = useState(false);
  const [downgradeCount, setDowngradeCount] = useState(0);

  const downgrade = useCallback(() => {
    setDowngradeCount((count) => Math.min(3, count + 1));
  }, []);

  useEffect(() => {
    let disposed = false;
    let batteryRef: BatteryManagerLike | null = null;
    let batteryState: { level?: number; charging?: boolean } = {};
    let cachedWebGL: { supported: boolean; softwareRenderer: boolean; maxTextureSize?: number } | undefined;

    const recompute = () => {
      if (disposed) return;
      const signals = readDeviceSignals({
        probeWebGL: false,
        allowMobileWebGL,
        batteryLevel: batteryState.level,
        batteryCharging: batteryState.charging,
        cachedWebGL,
      });

      if (probeWebGL && !cachedWebGL && !isPreConstrained(signals, allowMobileWebGL)) {
        cachedWebGL = probeWebGLCapability();
        signals.webglSupported = cachedWebGL.supported;
        signals.softwareRenderer = cachedWebGL.softwareRenderer;
        signals.maxTextureSize = cachedWebGL.maxTextureSize;
      }

      setProfile(resolveQualityProfile(signals, { allowMobileWebGL, maxTier }));
      setReady(true);
    };

    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const mobileQuery = window.matchMedia("(max-width: 720px)");
    const tabletQuery = window.matchMedia("(max-width: 1024px)");
    const coarseQuery = window.matchMedia("(pointer: coarse)");
    const nav = navigator as ExtendedNavigator;
    const connection = nav.connection;

    const onBatteryChange = () => {
      if (!batteryRef) return;
      batteryState = { level: batteryRef.level, charging: batteryRef.charging };
      recompute();
    };

    if (typeof nav.getBattery === "function") {
      void nav.getBattery().then((battery) => {
        if (disposed) return;
        batteryRef = battery;
        batteryState = { level: battery.level, charging: battery.charging };
        battery.addEventListener("levelchange", onBatteryChange);
        battery.addEventListener("chargingchange", onBatteryChange);
        recompute();
      }).catch(() => {
        /* Battery API is optional and may be restricted by browser privacy policy. */
      });
    }

    let cancelIdle = () => {};
    if (waitForIdle) {
      const idleWin = window as typeof window & {
        requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
        cancelIdleCallback?: (id: number) => void;
      };
      if (idleWin.requestIdleCallback) {
        const id = idleWin.requestIdleCallback(recompute, { timeout: 1200 });
        cancelIdle = () => idleWin.cancelIdleCallback?.(id);
      } else {
        const timer = window.setTimeout(recompute, 250);
        cancelIdle = () => window.clearTimeout(timer);
      }
    } else {
      recompute();
    }

    motionQuery.addEventListener("change", recompute);
    mobileQuery.addEventListener("change", recompute);
    tabletQuery.addEventListener("change", recompute);
    coarseQuery.addEventListener("change", recompute);
    connection?.addEventListener?.("change", recompute);
    window.addEventListener("resize", recompute, { passive: true });

    return () => {
      disposed = true;
      cancelIdle();
      motionQuery.removeEventListener("change", recompute);
      mobileQuery.removeEventListener("change", recompute);
      tabletQuery.removeEventListener("change", recompute);
      coarseQuery.removeEventListener("change", recompute);
      connection?.removeEventListener?.("change", recompute);
      window.removeEventListener("resize", recompute);
      batteryRef?.removeEventListener("levelchange", onBatteryChange);
      batteryRef?.removeEventListener("chargingchange", onBatteryChange);
    };
  }, [allowMobileWebGL, maxTier, probeWebGL, waitForIdle]);

  let activeTier = profile.tier;
  for (let i = 0; i < downgradeCount; i += 1) {
    activeTier = downgradeQualityTier(activeTier);
  }

  if (activeTier === profile.tier) {
    return { ...profile, ready, downgraded: downgradeCount > 0, downgrade };
  }

  const downgradedPreset = QUALITY_PRESETS[activeTier];
  return {
    ...profile,
    tier: activeTier,
    dprCap: downgradedPreset.dprCap,
    effectiveDpr: Math.min(Math.max(1, profile.signals.devicePixelRatio || 1), downgradedPreset.dprCap),
    particleMultiplier: downgradedPreset.particleMultiplier,
    targetFps: downgradedPreset.targetFps,
    allowWebGL: activeTier !== "fallback" && profile.signals.webglSupported !== false,
    allowContinuousMotion: !profile.prefersReducedMotion && activeTier !== "fallback",
    isConstrained: activeTier === "fallback" || activeTier === "low",
    reason: "runtime-downgrade",
    ready,
    downgraded: true,
    downgrade,
  };
}
