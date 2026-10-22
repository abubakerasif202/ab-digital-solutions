"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";

export interface FilmChapter {
  label: string;
  start: number;
  description: string;
}

interface BrandFilmPlayerProps {
  poster: string;
  sources: { desktop: string; mobile: string };
  chapters: readonly FilmChapter[];
  duration: number;
  title: string;
}

type FullscreenVideo = HTMLVideoElement & { webkitEnterFullscreen?: () => void };
type FullscreenRoot = HTMLElement & { webkitRequestFullscreen?: () => void };

const formatTime = (seconds: number): string => {
  const whole = Math.max(0, Math.floor(seconds));
  return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, "0")}`;
};

/**
 * Click-to-load film player. Until the visitor presses play, no video bytes
 * are requested: the poster is the only asset. A smaller 720p encode is served
 * to narrow screens and Save-Data connections.
 */
export function BrandFilmPlayer({ poster, sources, chapters, duration, title }: BrandFilmPlayerProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const pendingStartRef = useRef(0);
  const [src, setSrc] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [ended, setEnded] = useState(false);
  const [failed, setFailed] = useState(false);
  const [time, setTime] = useState(0);

  const chooseSource = (): string => {
    const connection = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
    const small = window.matchMedia("(max-width: 768px)").matches || connection?.saveData === true;
    return small ? sources.mobile : sources.desktop;
  };

  // The <video> mounts after the first user gesture, so playback may begin immediately.
  useEffect(() => {
    if (!src) return;
    videoRef.current?.play().catch(() => setPlaying(false));
  }, [src]);

  const start = (at = 0) => {
    const video = videoRef.current;
    if (!src || !video) {
      pendingStartRef.current = at;
      setLoading(true);
      setFailed(false);
      setSrc(chooseSource());
      return;
    }
    video.currentTime = at;
    setEnded(false);
    video.play().catch(() => setPlaying(false));
  };

  const toggle = () => {
    const video = videoRef.current;
    if (!video || !src) return start(0);
    if (video.ended) return start(0);
    if (video.paused) {
      video.play().catch(() => setPlaying(false));
      return;
    }
    video.pause();
  };

  const seek = (to: number) => {
    const video = videoRef.current;
    if (!video || !src) return start(to);
    video.currentTime = to;
    setTime(to);
    setEnded(false);
    if (video.paused) video.play().catch(() => setPlaying(false));
  };

  const fullscreen = () => {
    const root = rootRef.current as FullscreenRoot | null;
    const video = videoRef.current as FullscreenVideo | null;
    if (document.fullscreenElement) { void document.exitFullscreen(); return; }
    if (root?.requestFullscreen) void root.requestFullscreen();
    else if (video?.webkitEnterFullscreen) video.webkitEnterFullscreen();
    else root?.webkitRequestFullscreen?.();
  };

  const started = Boolean(src);
  const activeChapter = chapters.reduce((current, chapter, index) => (time >= chapter.start ? index : current), 0);
  const state = playing ? "playing" : ended ? "ended" : started ? "paused" : "idle";

  return (
    <div className="film-player" ref={rootRef} data-state={state}>
      <div className="film-stage">
        {started ? (
          <video
            ref={videoRef}
            className="film-video"
            src={src ?? undefined}
            poster={poster}
            playsInline
            preload="auto"
            aria-label={title}
            onLoadedMetadata={(event) => {
              if (pendingStartRef.current) event.currentTarget.currentTime = pendingStartRef.current;
              pendingStartRef.current = 0;
            }}
            onPlay={() => { setPlaying(true); setEnded(false); }}
            onPause={() => setPlaying(false)}
            onPlaying={() => setLoading(false)}
            onWaiting={() => setLoading(true)}
            onCanPlay={() => setLoading(false)}
            onTimeUpdate={(event) => setTime(event.currentTarget.currentTime)}
            onEnded={() => { setPlaying(false); setEnded(true); }}
            onError={() => { setFailed(true); setLoading(false); setPlaying(false); }}
            onClick={toggle}
          />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element -- static poster; the video is the only deferred asset
          <img className="film-poster" src={poster} width={1280} height={720} alt="" loading="lazy" decoding="async" />
        )}

        {(!playing || failed) && (
          <button
            type="button"
            className="film-big-play"
            onClick={() => (ended ? start(0) : toggle())}
            aria-label={ended ? `Replay ${title}` : started ? `Resume ${title}` : `Play ${title}`}
          >
            <span className="film-big-play-ring" aria-hidden="true">
              {loading ? <span className="film-spinner" /> : ended ? <ReplayGlyph /> : <PlayGlyph />}
            </span>
            <span className="film-big-play-label" aria-hidden="true">
              {loading ? "Loading" : ended ? "Replay" : started ? "Resume" : "Play the film"}
            </span>
          </button>
        )}

        <p className="film-status" role="status" aria-live="polite">
          {failed ? "The film could not be loaded. Please try again shortly." : loading ? "Loading film…" : ""}
        </p>
      </div>

      <div className="film-controls" role="group" aria-label="Film controls">
        <button type="button" className="film-btn" onClick={toggle} aria-label={playing ? "Pause" : "Play"}>
          {playing ? <PauseGlyph /> : <PlayGlyph />}
        </button>
        <button type="button" className="film-btn" onClick={() => start(0)} aria-label="Replay from the start">
          <ReplayGlyph />
        </button>
        <span className="film-time" aria-hidden="true">{formatTime(time)}</span>
        <input
          className="film-scrub"
          type="range"
          min={0}
          max={duration}
          step={0.1}
          value={Math.min(time, duration)}
          onChange={(event) => seek(Number(event.target.value))}
          aria-label="Seek"
          aria-valuetext={`${formatTime(time)} of ${formatTime(duration)}`}
          style={{ "--film-progress": `${(Math.min(time, duration) / duration) * 100}%` } as CSSProperties}
        />
        <span className="film-time" aria-hidden="true">{formatTime(duration)}</span>
        <button type="button" className="film-btn" onClick={fullscreen} aria-label="Toggle fullscreen">
          <FullscreenGlyph />
        </button>
      </div>

      <ol className="film-chapters" aria-label="Film chapters">
        {chapters.map((chapter, index) => (
          <li key={chapter.label}>
            <button
              type="button"
              className="film-chapter"
              aria-current={started && index === activeChapter ? "true" : undefined}
              onClick={() => seek(chapter.start)}
              title={chapter.description}
            >
              <span className="film-chapter-time">{formatTime(chapter.start)}</span>
              <span className="film-chapter-label">{chapter.label}</span>
            </button>
          </li>
        ))}
      </ol>
    </div>
  );
}

const glyph = { width: 18, height: 18, viewBox: "0 0 24 24", fill: "currentColor", "aria-hidden": true, focusable: false } as const;
const stroke = { fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round" } as const;
const PlayGlyph = () => <svg {...glyph}><path d="M8 5.5v13a1 1 0 0 0 1.5.86l10.5-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5Z" /></svg>;
const PauseGlyph = () => <svg {...glyph}><rect x="6" y="5" width="4" height="14" rx="1" /><rect x="14" y="5" width="4" height="14" rx="1" /></svg>;
const ReplayGlyph = () => <svg {...glyph} {...stroke}><path d="M3 12a9 9 0 1 0 3-6.7" /><path d="M3 4v5h5" /></svg>;
const FullscreenGlyph = () => <svg {...glyph} {...stroke}><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" /></svg>;
