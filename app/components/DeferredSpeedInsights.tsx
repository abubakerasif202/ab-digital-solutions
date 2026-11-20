"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { whenIdle } from "../lib/when-idle";

// Loaded as its own chunk, and only after the page has finished loading and the browser is idle, so the
// measurement script never competes with the content the visitor came for. Vitals are buffered by the browser.
const SpeedInsights = dynamic(() => import("@vercel/speed-insights/next").then((module) => module.SpeedInsights), { ssr: false });

export function DeferredSpeedInsights() {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    let cancelIdle = () => {};
    const schedule = () => { cancelIdle = whenIdle(() => setReady(true), 4000); };
    if (document.readyState === "complete") schedule();
    else addEventListener("load", schedule, { once: true });
    return () => { removeEventListener("load", schedule); cancelIdle(); };
  }, []);
  return ready ? <SpeedInsights /> : null;
}
