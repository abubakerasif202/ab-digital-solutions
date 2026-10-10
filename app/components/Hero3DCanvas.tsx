"use client";

import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { HeroFallback } from "./HeroFallback";

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
    renderer.toneMappingExposure = 1.45;

    container.appendChild(renderer.domElement);

    // A textured plane preserves the supplied bevels, letterforms and silhouette.
    const heroGroup = new THREE.Group();
    scene.add(heroGroup);
    const geometry = new THREE.PlaneGeometry(4.8, 4);
    const material = new THREE.MeshBasicMaterial({ transparent: true, depthWrite: false, toneMapped: false });
    const artwork = new THREE.Mesh(geometry, material);
    heroGroup.add(artwork);
    // Match the fallback's contained size so activating WebGL does not resize it.
    const fitArtwork = (canvasWidth: number, canvasHeight: number) => {
      const viewHeight = 2 * Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2) * camera.position.z;
      const viewWidth = viewHeight * canvasWidth / canvasHeight;
      heroGroup.scale.setScalar(Math.min(viewWidth * 0.86 / 4.8, viewHeight * 0.9 / 4));
    };
    fitArtwork(width, height);
    let disposed = false;
    let textureReady = false;
    let artworkTexture: THREE.Texture | undefined;
    new THREE.TextureLoader().load("/brand/ab-hero-monogram.webp", (texture) => {
      if (disposed) { texture.dispose(); return; }
      texture.colorSpace = THREE.SRGBColorSpace;
      artworkTexture = texture;
      material.map = texture;
      material.needsUpdate = true;
      textureReady = true;
      renderStaticFrame();
      startLoop();
    });

    // Animation & Smooth Control State
    let animationFrameId = 0;
    let revealFrame = 0;
    let isVisible = false;
    let isRunning = false;
    let inputListenersAttached = false;
    let nextRenderTime = 0;

    let mouseX = 0;
    let mouseY = 0;
    let targetMouseX = 0;
    let targetMouseY = 0;
    let scrollY = 0;
    let targetScrollY = window.scrollY;
    const frameInterval = 1000 / (isMobile || isTablet ? 30 : 60);

    const handleMouseMove = (event: MouseEvent) => {
      const windowHalfX = window.innerWidth / 2;
      const windowHalfY = window.innerHeight / 2;
      targetMouseX = (event.clientX - windowHalfX) / windowHalfX;
      targetMouseY = (event.clientY - windowHalfY) / windowHalfY;
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
    };

    const animate = (timestamp: number) => {
      if (!isVisible || prefersReducedMotion) {
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

      heroGroup.rotation.x = mouseY * 0.045;
      heroGroup.rotation.y = mouseX * 0.075;
      heroGroup.position.y = -scrollFactor * 0.12;
      camera.position.x = mouseX * 0.12;
      camera.position.y = -mouseY * 0.12;
      camera.lookAt(scene.position);

      renderer.render(scene, camera);
      if (Math.abs(targetMouseX - mouseX) < 0.001 && Math.abs(targetMouseY - mouseY) < 0.001 && Math.abs(targetScrollY - scrollY) < 0.1) stopLoop();
    };

    const startLoop = () => {
      if (isRunning || !isVisible || prefersReducedMotion) return;
      isRunning = true;
      nextRenderTime = 0;
      animationFrameId = requestAnimationFrame(animate);
    };

    const renderStaticFrame = () => {
      camera.lookAt(scene.position);
      renderer.render(scene, camera);
      if (!textureReady || revealFrame || container.dataset.renderReady === "true") return;
      // Two frames establish the artwork/canvas before-state for a crossfade.
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
      fitArtwork(newWidth, newHeight);
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
      geometry.dispose();
      material.dispose();
      artworkTexture?.dispose();
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
        minHeight: "0",
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
