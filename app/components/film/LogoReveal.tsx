"use client";

import { useCallback, useEffect, useRef } from "react";
import { buildParticles, clamp01, glide } from "./logo-reveal-math";

const SEEN_KEY = "ab-logo-reveal-seen";
const DURATION_S = 5.5;
const PERSPECTIVE = 1200;
const COLOURS = ["#a87a2c", "#d1a64c", "#efc96a", "#fff1cf", "#d21736"] as const;

/**
 * Gold particles assemble into the AB monogram, then settle into the static
 * lockup. The server HTML is the finished lockup, so reduced motion, no-JS and
 * repeat visits (the reveal plays once per session) all see the same still
 * image with no layout shift. The particle data is code-split and only
 * downloaded when the stage is on screen and about to play.
 */
export function LogoReveal() {
  const rootRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const haloRef = useRef<HTMLDivElement>(null);
  const markWrapRef = useRef<HTMLDivElement>(null);
  const markRef = useRef<HTMLImageElement>(null);
  const sweepRef = useRef<HTMLImageElement>(null);
  const wordRef = useRef<HTMLImageElement>(null);
  const rafRef = useRef(0);
  const generationRef = useRef(0);
  const stopRef = useRef<() => void>(() => {});

  const rest = useCallback(() => {
    const mark = markRef.current, sweep = sweepRef.current, word = wordRef.current, halo = haloRef.current, canvas = canvasRef.current;
    if (!mark || !sweep || !word || !halo || !canvas) return;
    Object.assign(mark.style, { opacity: "1", filter: "none", transform: "none" });
    sweep.style.opacity = "0";
    Object.assign(word.style, { opacity: "1", clipPath: "none", transform: "none" });
    halo.style.opacity = "1";
    canvas.getContext("2d")?.clearRect(0, 0, canvas.width, canvas.height);
  }, []);

  const play = useCallback(async () => {
    const root = rootRef.current, canvas = canvasRef.current, markWrap = markWrapRef.current;
    if (!root || !canvas || !markWrap) return;
    stopRef.current();
    const generation = ++generationRef.current;
    const data = await import("./logo-particles").catch(() => null);
    if (!data) { rest(); return; }
    const { logoParticles } = data;
    if (generation !== generationRef.current || !root.isConnected || document.hidden
      || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const ctx = canvas.getContext("2d");
    if (!ctx || !rootRef.current) return;

    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const W = root.clientWidth, H = root.clientHeight;
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    const rootBox = root.getBoundingClientRect(), markBox = markWrap.getBoundingClientRect();
    const mark = { x: markBox.left - rootBox.left, y: markBox.top - rootBox.top, w: markBox.width, h: markBox.height };
    const coarse = window.matchMedia("(pointer: coarse)").matches;
    const count = Math.round(Math.max(450, Math.min(coarse ? 700 : 1400, (W * H) / 1400)));
    const particles = buildParticles(logoParticles, count);
    const start = performance.now();

    const frame = (now: number) => {
      const markEl = markRef.current, sweepEl = sweepRef.current, wordEl = wordRef.current, haloEl = haloRef.current;
      if (!markEl || !sweepEl || !wordEl || !haloEl) return;
      const t = (now - start) / 1000;
      const lin = (s: number, d: number) => clamp01((t - s) / d);
      const enter = (s: number, d: number) => { const x = lin(s, d); return x === 1 ? 1 : 1 - Math.pow(2, -10 * x); };
      const g = glide(lin(0.2, 3.0));
      const ry = (1 - g) * 26 + Math.sin(t * 0.9) * 1.2 * g * (1 - lin(4.4, 0.6));
      const markIn = enter(2.4, 1.3), wordIn = enter(2.9, 1.2);
      const sweepPos = -30 + 160 * glide(lin(3.5, 1.0));
      const transform = `perspective(${PERSPECTIVE}px) rotateY(${ry.toFixed(2)}deg)`;
      const mask = `linear-gradient(105deg, transparent ${sweepPos - 18}%, #000 ${sweepPos}%, transparent ${sweepPos + 18}%)`;

      markEl.style.opacity = String(markIn);
      markEl.style.filter = markIn < 0.98 ? `blur(${((1 - markIn) * 10).toFixed(1)}px)` : "none";
      markEl.style.transform = transform;
      sweepEl.style.opacity = t > 3.4 && t < 4.6 ? "1" : "0";
      sweepEl.style.maskImage = mask;
      sweepEl.style.webkitMaskImage = mask;
      sweepEl.style.transform = transform;
      wordEl.style.opacity = String(wordIn);
      wordEl.style.clipPath = `inset(0 ${((1 - wordIn) * 100).toFixed(1)}% 0 0)`;
      wordEl.style.transform = `translateY(${((1 - wordIn) * 10).toFixed(1)}px)`;
      haloEl.style.opacity = String(lin(0.5, 2.4));

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);
      ctx.globalCompositeOperation = "lighter";
      const cx = mark.x + mark.w / 2, cy = mark.y + mark.h / 2;
      const rr = (ry * Math.PI) / 180, cr = Math.cos(rr), sr = Math.sin(rr);
      const ang = 0.35 + t * 0.16, ca = Math.cos(ang), sa = Math.sin(ang), k = mark.w / 560;
      const markFade = lin(2.4, 1.1), out = 1 - lin(4.6, 0.8);
      let current = -1;
      for (const p of particles) {
        const e = glide(lin(p.t0, p.du));
        const sx0 = p.sx * W * 0.9, zz = p.sz + 700;
        const sx = sx0 * ca + zz * sa, sz = -sx0 * sa + zz * ca - 700, sy = p.sy * H * 0.9;
        const lx = (p.tx - 0.5) * mark.w, ly = (p.ty - 0.5) * mark.h;
        const wob = (1 - e) * 30 * k;
        const x = sx + (lx * cr - sx) * e + Math.sin(t * 1.3 + p.ph) * wob;
        const y = sy + (ly - sy) * e + Math.cos(t * 1.1 + p.ph) * wob;
        const z = sz + (-lx * sr - sz) * e;
        if (z > PERSPECTIVE * 0.9) continue;
        const s = PERSPECTIVE / (PERSPECTIVE - z), blur = Math.min(1, Math.abs(z) / 1200);
        let a = (1.2 * lin(p.t0 * 0.5, 0.8)) / (1 + blur * 2);
        a *= p.glint
          ? (1 - markFade) + markFade * (0.25 + 0.75 * Math.pow(Math.max(0, Math.sin(t * 2.4 + p.ph * 3)), 6))
          : 1 - markFade * 0.95;
        a *= out;
        if (a < 0.03) continue;
        const radius = Math.max(0.4, (0.7 + p.size) * s * k * (1 + blur * 1.5) * (1 - 0.3 * e));
        if (p.col !== current) { ctx.fillStyle = COLOURS[p.col]; current = p.col; }
        ctx.globalAlpha = Math.min(1, a);
        ctx.beginPath();
        ctx.arc(cx + x * s, cy + y * s, radius, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = "source-over";
      if (t < DURATION_S) rafRef.current = requestAnimationFrame(frame);
      else rest();
    };

    stopRef.current = () => { cancelAnimationFrame(rafRef.current); rest(); };
    frame(performance.now());
  }, [rest]);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const reducedQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const stop = () => { generationRef.current++; stopRef.current(); };
    const visibility = () => { if (document.hidden) stop(); };
    document.addEventListener("visibilitychange", visibility);
    window.addEventListener("resize", stop, { passive: true });
    reducedQuery.addEventListener("change", stop);

    let observer: IntersectionObserver | undefined;
    let seen = false;
    try { seen = window.sessionStorage.getItem(SEEN_KEY) === "1"; } catch { /* storage unavailable: play */ }
    const constrained = window.matchMedia("(max-width: 720px), (pointer: coarse)").matches
      || navigator.hardwareConcurrency <= 4
      || ((navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 8) <= 4
      || (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData;
    if (!reducedQuery.matches && !constrained && !seen && "IntersectionObserver" in window) {
      observer = new IntersectionObserver(([entry]) => {
        if (!entry?.isIntersecting) { stop(); return; }
        observer?.disconnect();
        try { window.sessionStorage.setItem(SEEN_KEY, "1"); } catch { /* ignore */ }
        void play();
      }, { threshold: 0.45 });
      observer.observe(root);
    }
    const lifecycle = "IntersectionObserver" in window
      ? new IntersectionObserver(([entry]) => { if (!entry?.isIntersecting) stop(); }) : undefined;
    lifecycle?.observe(root);
    return () => {
      lifecycle?.disconnect();
      observer?.disconnect();
      reducedQuery.removeEventListener("change", stop);
      document.removeEventListener("visibilitychange", visibility);
      window.removeEventListener("resize", stop);
      stop();
    };
  }, [play]);

  const replay = () => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    void play();
  };

  return (
    <div className="logo-reveal" ref={rootRef}>
      <div className="logo-reveal-halo" ref={haloRef} aria-hidden="true" />
      <canvas className="logo-reveal-canvas" ref={canvasRef} aria-hidden="true" />
      <div className="logo-reveal-lockup">
        <div className="logo-reveal-mark" ref={markWrapRef}>
          {/* eslint-disable-next-line @next/next/no-img-element -- animated by inline style; sized by aspect-ratio */}
          <img ref={markRef} src="/brand/ab-reveal-mark.webp" width={882} height={779} alt="AB Web Studio monogram" loading="lazy" decoding="async" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img ref={sweepRef} className="logo-reveal-sweep" src="/brand/ab-reveal-mark-bright.webp" width={882} height={779} alt="" aria-hidden="true" loading="lazy" decoding="async" />
        </div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img ref={wordRef} className="logo-reveal-word" src="/brand/ab-reveal-wordmark.webp" width={1174} height={146} alt="AB Web Studio" loading="lazy" decoding="async" />
      </div>
      <button type="button" className="logo-reveal-replay" onClick={replay} aria-label="Replay the logo animation">Replay</button>
    </div>
  );
}
