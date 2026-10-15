"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { introTiming } from "./intro-config";

/** A brief identity accent. Content and navigation remain usable throughout. */
export function BrandIntro() {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const root = document.documentElement;
    if (root.getAttribute("data-intro") !== "playing") return;
    root.setAttribute("data-intro-live", "");
    const frame = requestAnimationFrame(() => setVisible(true));
    const finish = () => {
      setVisible(false);
      root.removeAttribute("data-intro");
      root.removeAttribute("data-intro-live");
    };
    const timer = window.setTimeout(finish, introTiming.maxMs);
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    motion.addEventListener("change", finish);
    return () => {
      cancelAnimationFrame(frame);
      window.clearTimeout(timer);
      motion.removeEventListener("change", finish);
      root.removeAttribute("data-intro");
      root.removeAttribute("data-intro-live");
    };
  }, []);
  if (!visible) return null;
  return (
    <div className="brand-intro" aria-hidden="true">
      <Image src="/brand/ab-luxury-monogram.webp" width={32} height={32} alt="" />
      <span>AB Web Studio</span>
      <span className="brand-intro-line" />
    </div>
  );
}
