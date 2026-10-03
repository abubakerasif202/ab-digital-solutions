"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { INTRO_POSTER_SRC, INTRO_VIDEO_SRC, introTiming } from "./intro-config";

type Phase = "idle" | "playing" | "exiting" | "done";

const root = () => document.documentElement;

/**
 * Cinematic opening film, rendered as an overlay above the real homepage.
 *
 * The inline gate (intro-gate.ts) decides before first paint whether this
 * visit plays the intro and flags <html data-intro="playing">. The tree is
 * identical on server and client until mount, so hydration stays safe; the
 * <video> is only created for visits that play. The page beneath is fully
 * rendered the whole time, so a failed video can never leave a blank screen.
 *
 * html[data-intro] drives the choreography in intro.css:
 *   playing → hero + navbar held back
 *   exit    → overlay dissolves, hero and navbar enter in sequence
 *   done    → overlay removed from the DOM; the flag is cleared at settleMs
 */
export function BrandIntro() {
  const [phase, setPhase] = useState<Phase>("idle");
  const videoRef = useRef<HTMLVideoElement>(null);
  const exitingRef = useRef(false);
  const timers = useRef<number[]>([]);

  const later = useCallback((fn: () => void, ms: number) => {
    timers.current.push(window.setTimeout(fn, ms));
  }, []);

  const exit = useCallback(() => {
    if (exitingRef.current) return;
    exitingRef.current = true;
    setPhase("exiting");
    root().setAttribute("data-intro", "exit");
    later(() => {
      setPhase("done");
      root().setAttribute("data-intro", "done");
    }, introTiming.exitMs);
    later(() => {
      root().removeAttribute("data-intro");
      root().removeAttribute("data-intro-live");
    }, introTiming.settleMs);
  }, [later]);

  // Claim the overlay if the gate flagged this visit; otherwise get out of the way.
  useEffect(() => {
    const flagged = root().getAttribute("data-intro") === "playing";
    if (!flagged) {
      const frame = requestAnimationFrame(() => setPhase("done"));
      return () => cancelAnimationFrame(frame);
    }
    root().setAttribute("data-intro-live", "");
    const frame = requestAnimationFrame(() => setPhase("playing"));
    const pending = timers.current;
    return () => {
      cancelAnimationFrame(frame);
      pending.forEach(window.clearTimeout);
      pending.length = 0;
    };
  }, []);

  // Drive playback, the exit point and every failure path.
  useEffect(() => {
    if (phase !== "playing") return;
    const video = videoRef.current;
    let frameId = 0;
    let started = false;
    let released = false;

    const watchExitPoint = () => {
      if (!video || released) return;
      if (video.currentTime >= introTiming.exitAt) {
        exit();
        return;
      }
      frameId = requestAnimationFrame(watchExitPoint);
    };
    const onPlaying = () => {
      if (started) return;
      started = true;
      frameId = requestAnimationFrame(watchExitPoint);
    };
    // Playback failed or stalled: hold the poster briefly, then dissolve.
    const fallBackToPoster = () => {
      if (released || exitingRef.current) return;
      video?.pause();
      video?.classList.add("is-failed");
      later(exit, introTiming.posterHoldMs);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") exit();
    };

    video?.addEventListener("playing", onPlaying);
    video?.addEventListener("ended", exit);
    video?.addEventListener("error", fallBackToPoster);
    document.addEventListener("keydown", onKeyDown);
    video?.play().catch(fallBackToPoster);
    const startTimer = window.setTimeout(() => {
      if (!started) fallBackToPoster();
    }, introTiming.startTimeoutMs);
    const maxTimer = window.setTimeout(exit, introTiming.maxMs);

    return () => {
      released = true;
      cancelAnimationFrame(frameId);
      window.clearTimeout(startTimer);
      window.clearTimeout(maxTimer);
      video?.removeEventListener("playing", onPlaying);
      video?.removeEventListener("ended", exit);
      video?.removeEventListener("error", fallBackToPoster);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [phase, exit, later]);

  useEffect(() => {
    const pending = timers.current;
    return () => {
      pending.forEach(window.clearTimeout);
      pending.length = 0;
    };
  }, []);

  if (phase === "done") return null;

  return (
    <div className="brand-intro" role="region" aria-label="AB Web Studio opening film">
      <div className="brand-intro-stage" aria-hidden="true">
        {/* Lazy + display:none until the gate flags a playing visit, so repeat visitors never fetch it. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="brand-intro-media brand-intro-poster" src={INTRO_POSTER_SRC} alt="" width={1280} height={720} loading="lazy" decoding="async" />
        {phase !== "idle" ? (
          <video
            ref={videoRef}
            className="brand-intro-media brand-intro-video"
            src={INTRO_VIDEO_SRC}
            poster={INTRO_POSTER_SRC}
            autoPlay
            muted
            playsInline
            preload="auto"
            disablePictureInPicture
            disableRemotePlayback
            tabIndex={-1}
          />
        ) : null}
      </div>
      {phase === "playing" ? (
        <button className="brand-intro-skip" type="button" onClick={exit}>
          <span>Skip Intro</span>
        </button>
      ) : null}
    </div>
  );
}
