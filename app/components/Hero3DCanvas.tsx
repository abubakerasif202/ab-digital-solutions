"use client";

import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { HeroFallback } from "./HeroFallback";
import { buildParticles, clamp01, glide, type Particle } from "./film/logo-reveal-math";
const INTRO_MS = 4600;
const SEEN_KEY = "ab-logo-reveal-seen";
const REST_YAW = -0.06;
const REST_PITCH = -0.025;

interface Hero3DCanvasProps {
  className?: string;
  quality?: "mobile" | "tablet" | "desktop";
}

export function Hero3DCanvas({ className = "", quality = "desktop" }: Hero3DCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [rendererFailed, setRendererFailed] = useState(false);

  useEffect(() => {
    if (rendererFailed) return;

    const container = containerRef.current;
    if (!container) return;

    // Check prefers-reduced-motion
    const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    let prefersReducedMotion = reducedMotionQuery.matches;

    // Scene Setup
    const scene = new THREE.Scene();

    // Camera Setup
    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || 500;
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 0, 6.8);

    // Renderer Setup
    const isMobile = quality === "mobile";
    const isTablet = quality === "tablet";
    let renderer: THREE.WebGLRenderer;

    try {
      renderer = new THREE.WebGLRenderer({
        antialias: !isTablet && !isMobile,
        alpha: true,
        // Mobile/tablet favour the integrated GPU: it keeps the fan quiet and
        // the battery drain reasonable for a decorative background.
        powerPreference: isMobile || isTablet ? "low-power" : "high-performance",
      });
    } catch {
      const failureTimer = window.setTimeout(() => setRendererFailed(true), 0);
      return () => window.clearTimeout(failureTimer);
    }

    const dpr = isMobile
      ? Math.min(window.devicePixelRatio, 1.25)
      : isTablet
        ? 1
        : Math.min(window.devicePixelRatio, 1.5);
    renderer.setPixelRatio(dpr);
    renderer.setSize(width, height);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.3;

    container.appendChild(renderer.domElement);

    // Render the supplied artwork intact. Invented extrusion geometry changed
    // the identity; a lightly tilted image plane preserves its real proportions.
    const heroGroup = new THREE.Group();
    heroGroup.rotation.set(REST_PITCH, REST_YAW, 0);
    scene.add(heroGroup);
    const geometry = new THREE.PlaneGeometry(4.8, 4.8 * 792 / 936);
    const material = new THREE.MeshBasicMaterial({ transparent: true, toneMapped: false });
    heroGroup.add(new THREE.Mesh(geometry, material));
    const sweepMaterial = new THREE.ShaderMaterial({
      uniforms: { artwork: { value: null }, progress: { value: -1 } },
      vertexShader: `varying vec2 artworkUv;
        void main() { artworkUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
      fragmentShader: `uniform sampler2D artwork; uniform float progress; varying vec2 artworkUv;
        void main() {
          vec4 pixel = texture2D(artwork, artworkUv);
          float band = pow(max(0.0, 1.0 - abs(artworkUv.x + artworkUv.y * 0.18 - progress) / 0.12), 2.0);
          gl_FragColor = vec4(pixel.rgb * vec3(1.0, 0.88, 0.62), pixel.a * band * 0.24);
        }`,
      transparent: true, blending: THREE.AdditiveBlending, depthWrite: false,
    });
    const sweep = new THREE.Mesh(geometry, sweepMaterial);
    sweep.position.z = 0.01;
    sweep.visible = false;
    heroGroup.add(sweep);
    let disposed = false;
    let textureReady = false;
    const texture = new THREE.TextureLoader().load("/brand/ab-hero-monogram.webp", (loaded) => {
      if (disposed) return;
      loaded.colorSpace = THREE.SRGBColorSpace;
      material.map = loaded;
      sweepMaterial.uniforms.artwork.value = loaded;
      material.needsUpdate = true;
      textureReady = true;
      renderStaticFrame();
      startLoop();
    }, undefined, () => {
      if (!disposed) setRendererFailed(true);
    });

    // Animation & Smooth Control State
    let animationFrameId = 0;
    let revealFrame = 0;
    let isVisible = false;
    let isRunning = false;
    let inputListenersAttached = false;
    let nextRenderTime = 0;
    let lastFrameTime = 0;
    let seen = false;
    try { seen = sessionStorage.getItem(SEEN_KEY) === "1"; } catch { /* storage is optional */ }
    let introProgress = prefersReducedMotion || seen ? 1 : 0;
    const particleGeometry = new THREE.BufferGeometry();
    const particleMaterial = new THREE.PointsMaterial({
      size: isTablet ? 0.018 : 0.014, transparent: true, opacity: 0,
      vertexColors: true, blending: THREE.AdditiveBlending, depthWrite: false,
    });
    const points = new THREE.Points(particleGeometry, particleMaterial);
    points.frustumCulled = false;
    heroGroup.add(points);
    let particles: Particle[] = [];
    let positions = new Float32Array(0);
    let particlesReady = introProgress === 1;
    if (!particlesReady) {
      void import("./film/logo-particles").then(({ logoParticles }) => {
        if (disposed) return;
        particles = buildParticles(logoParticles, isTablet ? 450 : 900);
        positions = new Float32Array(particles.length * 3);
        const colours = new Float32Array(particles.length * 3);
        const palette = ["#a87a2c", "#d1a64c", "#efc96a", "#fff1cf", "#d21736"];
        particles.forEach((particle, index) => {
          new THREE.Color(palette[particle.col]).toArray(colours, index * 3);
        });
        particleGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
        particleGeometry.setAttribute("color", new THREE.BufferAttribute(colours, 3));
        particlesReady = true;
        startLoop();
      }).catch(() => { introProgress = 1; particlesReady = true; startLoop(); });
    }

    let mouseX = 0;
    let mouseY = 0;
    let targetMouseX = 0;
    let targetMouseY = 0;
    let scrollY = 0;
    let targetScrollY = window.scrollY;
    const frameInterval = 1000 / (isMobile || isTablet ? 30 : 60);

    const handleMouseMove = (event: MouseEvent) => {
      const bounds = container.getBoundingClientRect();
      targetMouseX = THREE.MathUtils.clamp((event.clientX - bounds.left) / bounds.width * 2 - 1, -1, 1);
      targetMouseY = THREE.MathUtils.clamp((event.clientY - bounds.top) / bounds.height * 2 - 1, -1, 1);
      startLoop();
    };

    const handleScroll = () => {
      targetScrollY = window.scrollY;
      startLoop();
    };

    const hasHoverPointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    const wantsPointerParallax = hasHoverPointer && !isTablet && !isMobile;

    const attachInputListeners = () => {
      if (inputListenersAttached) return;
      if (wantsPointerParallax) window.addEventListener("mousemove", handleMouseMove, { passive: true });
      window.addEventListener("scroll", handleScroll, { passive: true });
      inputListenersAttached = true;
    };

    const detachInputListeners = () => {
      if (!inputListenersAttached) return;
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("scroll", handleScroll);
      inputListenersAttached = false;
    };

    const stopLoop = () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
      animationFrameId = 0;
      isRunning = false;
      nextRenderTime = 0;
      lastFrameTime = 0;
    };

    const animate = (timestamp: number) => {
      if (!isVisible || document.hidden || prefersReducedMotion || !textureReady || !particlesReady) {
        stopLoop();
        return;
      }

      animationFrameId = requestAnimationFrame(animate);
      if (!nextRenderTime) nextRenderTime = timestamp;
      if (timestamp < nextRenderTime) return;

      do {
        nextRenderTime += frameInterval;
      } while (nextRenderTime <= timestamp);

      // Smooth mouse lerping
      mouseX += (targetMouseX - mouseX) * 0.05;
      mouseY += (targetMouseY - mouseY) * 0.05;

      // Smooth scroll lerping
      scrollY += (targetScrollY - scrollY) * 0.05;
      const scrollFactor = Math.min(scrollY / 1000, 2);

      if (introProgress < 1) {
        introProgress = Math.min(1, introProgress + (lastFrameTime ? timestamp - lastFrameTime : 0) / INTRO_MS);
      }
      lastFrameTime = timestamp;
      const settle = 1 - Math.pow(1 - introProgress, 3);
      const elapsed = introProgress * INTRO_MS / 1000;
      material.opacity = introProgress === 1 ? 1 : 0.2 + 0.8 * glide(clamp01((elapsed - 1.7) / 1.5));
      particleMaterial.opacity = clamp01(elapsed / 0.5) * (1 - clamp01((elapsed - 2.7) / 1.4));
      points.visible = introProgress < 1;
      sweep.visible = elapsed > 2.8 && elapsed < 4.3;
      sweepMaterial.uniforms.progress.value = -0.2 + clamp01((elapsed - 2.8) / 1.5) * 1.6;
      if (points.visible && particles.length) {
        particles.forEach((particle, index) => {
          const assembly = glide(clamp01((elapsed - particle.t0) / particle.du));
          const x = (particle.tx - 0.5) * 4.8;
          const y = (0.5 - particle.ty) * (4.8 * 792 / 936);
          positions[index * 3] = particle.sx * 7 * (1 - assembly) + x * assembly;
          positions[index * 3 + 1] = particle.sy * 5 * (1 - assembly) + y * assembly;
          positions[index * 3 + 2] = (particle.sz / 900) * (1 - assembly) + 0.02;
        });
        particleGeometry.attributes.position.needsUpdate = true;
      }
      if (!seen) {
        seen = true;
        try { sessionStorage.setItem(SEEN_KEY, "1"); } catch { /* storage is optional */ }
      }
      heroGroup.rotation.x = REST_PITCH + mouseY * 0.035;
      heroGroup.rotation.y = REST_YAW - (1 - settle) * 0.08 + mouseX * 0.07;
      heroGroup.position.y = -scrollFactor * 0.12;
      camera.position.x = mouseX * 0.12;
      camera.position.y = -mouseY * 0.12;
      camera.position.z = 6.8 + (1 - settle) * 0.24;
      camera.lookAt(scene.position);

      renderer.render(scene, camera);
      if (introProgress >= 1 && Math.abs(targetMouseX - mouseX) < 0.001 && Math.abs(targetMouseY - mouseY) < 0.001 && Math.abs(targetScrollY - scrollY) < 0.1) stopLoop();
    };

    const startLoop = () => {
      if (isRunning || !isVisible || document.hidden || prefersReducedMotion || !textureReady || !particlesReady) return;
      isRunning = true;
      nextRenderTime = 0;
      animationFrameId = requestAnimationFrame(animate);
    };

    const renderStaticFrame = () => {
      if (!textureReady || disposed) return;
      camera.lookAt(scene.position);
      renderer.render(scene, camera);
      if (revealFrame || container.dataset.renderReady === "true") return;
      // Two frames establish the SVG/canvas before-state for a real crossfade.
      revealFrame = requestAnimationFrame(() => {
        revealFrame = requestAnimationFrame(() => {
          container.dataset.renderReady = "true";
          revealFrame = 0;
        });
      });
    };

    const handleMotionChange = (event: MediaQueryListEvent) => {
      prefersReducedMotion = event.matches;
      if (prefersReducedMotion) {
        introProgress = 1;
        material.opacity = 1;
        points.visible = false;
        sweep.visible = false;
        stopLoop();
        renderStaticFrame();
      } else {
        startLoop();
      }
    };
    reducedMotionQuery.addEventListener("change", handleMotionChange);

    const visibilityObserver = new IntersectionObserver(([entry]) => {
      isVisible = entry.isIntersecting && document.visibilityState === "visible";
      if (isVisible) {
        attachInputListeners();
        if (prefersReducedMotion) renderStaticFrame();
        else startLoop();
      } else {
        stopLoop();
        detachInputListeners();
      }
    }, { threshold: 0.01 });
    visibilityObserver.observe(container);

    const handleVisibilityChange = () => {
      const bounds = container.getBoundingClientRect();
      isVisible = !document.hidden
        && bounds.bottom > 0
        && bounds.top < window.innerHeight
        && bounds.right > 0
        && bounds.left < window.innerWidth;

      if (isVisible) {
        attachInputListeners();
        startLoop();
      } else {
        stopLoop();
        detachInputListeners();
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    const handleContextLost: EventListener = (event) => {
      event.preventDefault();
      isVisible = false;
      stopLoop();
      detachInputListeners();
      cancelAnimationFrame(revealFrame);
      setRendererFailed(true);
    };
    renderer.domElement.addEventListener("webglcontextlost", handleContextLost);
    renderStaticFrame();

    // Resize Handler
    const currentPixelRatio = () => (isMobile
      ? Math.min(window.devicePixelRatio, 1.25)
      : isTablet
        ? 1
        : Math.min(window.devicePixelRatio, 1.5));

    let renderedWidth = width;
    let renderedHeight = height;
    let renderedPixelRatio = dpr;

    const handleResize = () => {
      const newWidth = container.clientWidth || window.innerWidth;
      const newHeight = container.clientHeight || 500;
      const newPixelRatio = currentPixelRatio();

      // A ResizeObserver fires for sub-pixel and no-op changes too. Skipping
      // those avoids reallocating the drawing buffer on every scroll-driven
      // layout nudge.
      if (
        newWidth === renderedWidth
        && newHeight === renderedHeight
        && newPixelRatio === renderedPixelRatio
      ) return;

      renderedWidth = newWidth;
      renderedHeight = newHeight;
      renderedPixelRatio = newPixelRatio;

      camera.aspect = newWidth / newHeight;
      camera.updateProjectionMatrix();
      renderer.setPixelRatio(newPixelRatio);
      renderer.setSize(newWidth, newHeight);
      if (isVisible || prefersReducedMotion) renderStaticFrame();
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);

    // Cleanup
    return () => {
      cancelAnimationFrame(revealFrame);
      delete container.dataset.renderReady;
      stopLoop();
      detachInputListeners();
      reducedMotionQuery.removeEventListener("change", handleMotionChange);
      resizeObserver.disconnect();
      visibilityObserver.disconnect();
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      renderer.domElement.removeEventListener("webglcontextlost", handleContextLost);

      disposed = true;
      texture.dispose();
      particleGeometry.dispose();
      particleMaterial.dispose();
      sweepMaterial.dispose();
      geometry.dispose();
      material.dispose();
      renderer.dispose();
      renderer.forceContextLoss();

      if (renderer.domElement && renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
    };
  }, [quality, rendererFailed]);

  if (rendererFailed) {
    return <HeroFallback />;
  }

  return (
    <div
      ref={containerRef}
      className={`hero-3d-container ${className}`}
      style={{
        width: "100%",
        height: "100%",
        minHeight: "450px",
        position: "relative",
        overflow: "hidden",
        pointerEvents: "none", // Prevent canvas from hijacking clicks or drag gestures
      }}
      aria-hidden="true"
    >
      <HeroFallback />
    </div>
  );
}
