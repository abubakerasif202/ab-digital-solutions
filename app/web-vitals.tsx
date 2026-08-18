"use client";

import { useReportWebVitals } from "next/web-vitals";

declare global {
  interface Window {
    reportWebVitals?: (metric: unknown) => void;
  }
}

export function WebVitals() {
  useReportWebVitals((metric) => {
    if (typeof window !== "undefined" && typeof window.reportWebVitals === "function") {
      try {
        window.reportWebVitals(metric);
      } catch {
        // Silently ignore monitoring callback errors
      }
    }
  });

  return null;
}
