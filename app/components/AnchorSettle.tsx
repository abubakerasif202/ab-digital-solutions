"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

/* Below-fold homepage sections skip layout until they near the viewport
   (content-visibility in globals.css), so an anchor jump is aimed at
   estimated heights. Once the jump goes idle, the sections it passed have
   rendered at their real size: re-align the target exactly. Any user input
   cancels this, so it never fights manual scrolling. */
export function AnchorSettle() {
  const pathname = usePathname();

  useEffect(() => {
    const root = document.documentElement;
    const userInputEvents = ["wheel", "touchstart", "keydown", "pointerdown"] as const;
    let idleTimer = 0;
    let passes = 0;
    let armed = false;
    let targetId = "";

    const disarm = () => {
      armed = false;
      window.clearTimeout(idleTimer);
      window.removeEventListener("scroll", onScroll);
      userInputEvents.forEach((type) => window.removeEventListener(type, disarm));
    };
    const settle = () => {
      const target = targetId ? document.getElementById(targetId) : null;
      if (!armed || !target) return disarm();
      const offset = parseFloat(getComputedStyle(root).scrollPaddingTop) || 0;
      if (Math.abs(target.getBoundingClientRect().top - offset) <= 8 || passes >= 2) return disarm();
      passes += 1;
      target.scrollIntoView({ block: "start", behavior: "instant" });
      idleTimer = window.setTimeout(settle, 200);
    };
    const onScroll = () => {
      window.clearTimeout(idleTimer);
      idleTimer = window.setTimeout(settle, 160);
    };
    const arm = (hash: string) => {
      if (hash.length < 2) return;
      disarm();
      targetId = decodeURIComponent(hash.slice(1));
      armed = true;
      passes = 0;
      window.addEventListener("scroll", onScroll, { passive: true });
      userInputEvents.forEach((type) => window.addEventListener(type, disarm, { passive: true }));
      idleTimer = window.setTimeout(settle, 450);
    };
    const onHashLinkClick = (event: MouseEvent) => {
      const link = event.target instanceof Element ? event.target.closest<HTMLAnchorElement>("a[href*='#']") : null;
      if (!link || link.origin !== window.location.origin || link.pathname !== window.location.pathname) return;
      // Arm after the click's own pointerdown has passed; the router updates
      // the URL asynchronously, so the target comes from the link itself.
      window.setTimeout(() => arm(link.hash), 0);
    };

    arm(window.location.hash);
    document.addEventListener("click", onHashLinkClick);
    return () => {
      disarm();
      document.removeEventListener("click", onHashLinkClick);
    };
  }, [pathname]);

  return null;
}
