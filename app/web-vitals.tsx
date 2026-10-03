"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { useReportWebVitals } from "next/web-vitals";

declare global {
  interface Window {
    reportWebVitals?: (metric: unknown) => void;
  }
}

type AnalyticsPayload = {
  event_name: "page_view" | "cta_click" | "web_vital";
  path: string;
  label?: string;
  metric_name?: string;
  metric_value?: number;
  metric_rating?: string;
  navigation_type?: string;
};

function sendAnalytics(payload: AnalyticsPayload) {
  if (typeof window === "undefined") return;

  const body = JSON.stringify(payload);

  try {
    if (typeof navigator.sendBeacon === "function") {
      const blob = new Blob([body], { type: "application/json" });
      if (navigator.sendBeacon("/api/analytics", blob)) return;
    }

    void fetch("/api/analytics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      keepalive: true,
    }).catch(() => undefined);
  } catch {
    // Analytics must never affect the visitor experience.
  }
}

export function WebVitals() {
  const pathname = usePathname();
  const lastPath = useRef<string | null>(null);

  useEffect(() => {
    if (!pathname || lastPath.current === pathname) return;
    lastPath.current = pathname;
    sendAnalytics({ event_name: "page_view", path: pathname });
  }, [pathname]);

  useEffect(() => {
    function trackClick(event: MouseEvent) {
      if (!(event.target instanceof Element)) return;

      const target = event.target.closest<HTMLElement>("[data-analytics],a[href]");
      if (!target) return;

      const explicitLabel = target.dataset.analytics?.trim();
      if (explicitLabel) {
        sendAnalytics({
          event_name: "cta_click",
          path: window.location.pathname,
          label: explicitLabel.slice(0, 160),
        });
        return;
      }

      if (!(target instanceof HTMLAnchorElement)) return;
      const href = target.getAttribute("href") || "";

      let label = "";
      if (href.startsWith("tel:")) label = "phone";
      else if (href.startsWith("mailto:")) label = "email";
      else {
        try {
          const url = new URL(target.href, window.location.href);
          if (url.origin !== window.location.origin) label = `outbound:${url.hostname}`;
        } catch {
          return;
        }
      }

      if (label) {
        sendAnalytics({
          event_name: "cta_click",
          path: window.location.pathname,
          label,
        });
      }
    }

    document.addEventListener("click", trackClick, { capture: true });
    return () => document.removeEventListener("click", trackClick, { capture: true });
  }, []);

  useReportWebVitals((metric) => {
    if (typeof window !== "undefined" && typeof window.reportWebVitals === "function") {
      try {
        window.reportWebVitals(metric);
      } catch {
        // Silently ignore monitoring callback errors.
      }
    }

    sendAnalytics({
      event_name: "web_vital",
      path: window.location.pathname,
      metric_name: metric.name,
      metric_value: metric.value,
      metric_rating: metric.rating || "",
      navigation_type: metric.navigationType || "",
    });
  });

  return null;
}
