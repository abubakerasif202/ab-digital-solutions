"use client";

import { useEffect, useRef, useState } from "react";
import { canAutoplayCinematicMedia, cinematicMediaVariant } from "./media-policy";

type Connection = EventTarget & { saveData?: boolean; effectiveType?: string };

const base = "/cinematic/sydney-ruby-v3";

/** Poster-first decorative atmosphere. No video request occurs before policy and visibility checks. */
export function CinematicMedia({ className = "" }: { className?: string }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const root = rootRef.current;
    const video = videoRef.current;
    if (!root || !video) return;
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const connection = (navigator as Navigator & { connection?: Connection }).connection;
    let inView = false;
    let ready = false;
    let idle: number | undefined;
    let timer: number | undefined;
    let disposed = false;
    let blocked = false;
    let mediaFailed = false;
    let hasSource = false;
    let playAttempt = 0;
    // Choose once per mount: resizing must not download both encodes.
    const variant = cinematicMediaVariant(window.innerWidth);
    const extension = video.canPlayType('video/webm; codecs="vp9"') ? "webm" : "mp4";

    const pause = () => {
      // A pause or source change invalidates any unresolved play request.
      playAttempt += 1;
      video.pause();
      // load() can cancel a queued pause event when a source is detached.
      if (!disposed) setPlaying(false);
    };
    const detach = () => {
      pause();
      if (hasSource) {
        video.removeAttribute("src");
        video.load();
        hasSource = false;
      }
    };
    const reconcile = () => {
      if (disposed) return;
      const allowed = canAutoplayCinematicMedia({
        reducedMotion: motion.matches,
        saveData: connection?.saveData,
        effectiveType: connection?.effectiveType,
      });
      if (!allowed || mediaFailed) return detach();
      if (!ready || !inView || document.hidden || blocked) return pause();
      if (!hasSource) {
        video.poster = variant === "mobile" ? `${base}-mobile-poster.webp` : `${base}-poster.webp`;
        video.src = `${base}-${variant}-lite.${extension}`;
        hasSource = true;
      }
      if (video.paused) {
        const attempt = ++playAttempt;
        void video.play().catch((error: unknown) => {
          if (disposed || attempt !== playAttempt || !hasSource) return;
          // Browser interruption is recoverable; policy denial needs a user gesture.
          if (error && typeof error === "object" && "name" in error && error.name === "AbortError") return;
          blocked = true;
          setPlaying(false);
        });
      }
    };
    const allowLoad = () => { ready = true; reconcile(); };
    const queueLoad = () => {
      if (typeof window.requestIdleCallback === "function") {
        idle = window.requestIdleCallback(allowLoad, { timeout: 1300 });
      } else {
        timer = window.setTimeout(allowLoad, 300);
      }
    };
    if (document.readyState === "complete") queueLoad();
    else window.addEventListener("load", queueLoad, { once: true });

    const preferencesChanged = () => reconcile();
    // iOS Low Power Mode and Android data savers refuse silent autoplay until a gesture:
    // the first touch lifts the block so the film starts without any visible control.
    const gesture = () => {
      if (!blocked) return;
      blocked = false;
      reconcile();
    };
    const onError = () => {
      if (disposed || !hasSource) return;
      mediaFailed = true;
      setFailed(true);
      setPlaying(false);
      detach();
    };
    const observer = new IntersectionObserver(([entry]) => {
      inView = entry?.isIntersecting ?? false;
      reconcile();
    }, { threshold: 0.01 });
    observer.observe(root);
    motion.addEventListener("change", preferencesChanged);
    connection?.addEventListener("change", preferencesChanged);
    document.addEventListener("visibilitychange", reconcile);
    video.addEventListener("error", onError);
    document.addEventListener("pointerdown", gesture, { passive: true });
    document.addEventListener("touchend", gesture, { passive: true });
    return () => {
      document.removeEventListener("pointerdown", gesture);
      document.removeEventListener("touchend", gesture);
      disposed = true;
      window.removeEventListener("load", queueLoad);
      if (idle !== undefined) window.cancelIdleCallback(idle);
      if (timer !== undefined) window.clearTimeout(timer);
      observer.disconnect();
      motion.removeEventListener("change", preferencesChanged);
      connection?.removeEventListener("change", preferencesChanged);
      document.removeEventListener("visibilitychange", reconcile);
      video.removeEventListener("error", onError);
      detach();
    };
  }, []);

  return (
    <div ref={rootRef} className={`cinema-media ${className}`} data-playing={playing} data-failed={failed}>
      <picture className="cinema-media-poster">
        <source media="(max-width: 720px)" srcSet={`${base}-mobile-poster.webp`} />
        {/* A native picture chooses the art-directed poster before hydration. */}
        <img src={`${base}-poster.webp`} width="1600" height="900" alt="" fetchPriority="high" />
      </picture>
      <video
        ref={videoRef}
        className="cinema-media-video"
        aria-hidden="true"
        tabIndex={-1}
        width="1600"
        height="900"
        muted
        playsInline
        disablePictureInPicture
        disableRemotePlayback
        loop
        preload="none"
        onPlaying={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
      />
    </div>
  );
}
