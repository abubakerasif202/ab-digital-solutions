"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { useDeviceQuality, type QualityTier } from "../../lib/device-quality";

export type SydneyNightView = "overview" | "monogram" | "harbour";

const DynamicSydneyNightCanvas = dynamic(
  () => import("./SydneyNightCanvas").then((mod) => mod.SydneyNightCanvas),
  { ssr: false },
);

export interface SydneyNightStageProps {
  className?: string;
  /** Custom static fallback rendered during SSR, on constrained devices, or if WebGL fails. */
  fallback?: ReactNode;
  /** Optional interactive camera preset switcher ("overview" | "monogram" | "harbour"). */
  showViewControls?: boolean;
  defaultView?: SydneyNightView;
  interactive?: boolean;
  maxTier?: QualityTier;
}

const VIEW_LABELS: ReadonlyArray<{ id: SydneyNightView; label: string }> = [
  { id: "overview", label: "Studio" },
  { id: "monogram", label: "Monogram" },
  { id: "harbour", label: "Harbour" },
];

function DefaultNightFallback() {
  return (
    <Image
      src="/studio/studio-home-still.jpg"
      width={1440}
      height={900}
      sizes="(max-width: 960px) calc(100vw - 40px), 640px"
      loading="lazy"
      alt="A view into the AB Web Studio virtual studio: the reception monogram, project gallery screens and ruby consultation lounge behind a glass and brass facade"
      style={{ display: "block", width: "100%", height: "auto", aspectRatio: "16 / 10", objectFit: "cover" }}
    />
  );
}

/**
 * Selective interactive 3D showcase wrapper.
 * Keeps Three.js out of the initial/homepage bundle until idle + near viewport,
 * enforces adaptive device-quality tiers, and renders a seamless static fallback otherwise.
 */
export function SydneyNightStage({
  className = "",
  fallback,
  showViewControls = false,
  defaultView = "overview",
  interactive = true,
  maxTier = "high",
}: SydneyNightStageProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const [nearViewport, setNearViewport] = useState(false);
  const [contextLost, setContextLost] = useState(false);
  const [view, setView] = useState<SydneyNightView>(defaultView);

  const quality = useDeviceQuality({
    probeWebGL: nearViewport,
    allowMobileWebGL: false,
    maxTier,
    waitForIdle: true,
  });

  useEffect(() => {
    const node = hostRef.current;
    if (!node || !("IntersectionObserver" in window)) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setNearViewport(true);
          observer.disconnect();
        }
      },
      { rootMargin: "220px 0px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const handleContextLost = useCallback(() => {
    setContextLost(true);
  }, []);

  const showCanvas =
    nearViewport &&
    quality.ready &&
    quality.allowWebGL &&
    quality.tier !== "fallback" &&
    !contextLost;

  const fallbackNode = fallback ?? <DefaultNightFallback />;

  return (
    <div
      ref={hostRef}
      className={`sydney-night-stage ${className}`.trim()}
      data-quality-tier={quality.tier}
      data-webgl-active={showCanvas ? "true" : "false"}
      style={{ position: "relative", width: "100%", aspectRatio: "16 / 10", overflow: "hidden" }}
    >
      <div
        aria-hidden={showCanvas || undefined}
        style={{
          position: "relative",
          width: "100%",
          height: "100%",
          opacity: showCanvas ? 0 : 1,
          transition: quality.prefersReducedMotion ? "none" : "opacity 360ms ease",
          pointerEvents: showCanvas ? "none" : undefined,
        }}
      >
        {fallbackNode}
      </div>

      {showCanvas && (
        <div
          aria-hidden="true"
          style={{ position: "absolute", inset: 0, zIndex: 1 }}
        >
          <DynamicSydneyNightCanvas
            tier={quality.tier as Exclude<QualityTier, "fallback">}
            effectiveDpr={quality.effectiveDpr}
            particleMultiplier={quality.particleMultiplier}
            targetFps={quality.targetFps}
            reducedMotion={quality.prefersReducedMotion}
            interactive={interactive}
            activeView={view}
            onDowngrade={quality.downgrade}
            onContextLost={handleContextLost}
          />
        </div>
      )}

      {showCanvas && showViewControls && (
        <div
          role="group"
          aria-label="3D camera viewpoints"
          style={{
            position: "absolute",
            left: "14px",
            bottom: "14px",
            zIndex: 2,
            display: "flex",
            gap: "8px",
          }}
        >
          {VIEW_LABELS.map((item) => {
            const active = view === item.id;
            return (
              <button
                key={item.id}
                type="button"
                aria-pressed={active}
                onClick={() => setView(item.id)}
                style={{
                  minHeight: "44px",
                  padding: "0 14px",
                  border: active ? "1px solid var(--gold, #C9A45C)" : "1px solid rgba(201, 164, 92, 0.32)",
                  background: active ? "rgba(179, 18, 46, 0.9)" : "rgba(10, 9, 8, 0.84)",
                  color: "#F4F1EA",
                  fontSize: "12px",
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  cursor: "pointer",
                }}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
