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
    camera.position.set(0, 0, 7.5);

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
    renderer.toneMappingExposure = 1.2;

    container.appendChild(renderer.domElement);

    // A compact extruded A / B sculpture. Flat front faces and bevelled edges
    // keep the brand legible; ruby is structural rather than a particle effect.
    scene.add(new THREE.AmbientLight(0xf4f1ea, 1.2));
    const keyLight = new THREE.DirectionalLight(0xf4f1ea, 4);
    keyLight.position.set(2, 4, 5);
    scene.add(keyLight);
    const rubyLight = new THREE.PointLight(0xd21736, 14, 12);
    rubyLight.position.set(-3, -1, 3);
    scene.add(rubyLight);
    const edgeLight = new THREE.DirectionalLight(0xd1a64c, 1.4);
    edgeLight.position.set(-4, 3, -1);
    scene.add(edgeLight);

    const heroGroup = new THREE.Group();
    heroGroup.rotation.set(-0.12, -0.22, -0.06);
    scene.add(heroGroup);
    const chromeMaterial = new THREE.MeshStandardMaterial({
      color: 0x151519, metalness: 0.72, roughness: 0.24,
    });
    const rubyMaterial = new THREE.MeshStandardMaterial({
      color: 0xd21736, metalness: 0.45, roughness: 0.26,
      emissive: 0x760d21, emissiveIntensity: 0.35,
    });
    const geometries: THREE.ExtrudeGeometry[] = [];
    const polygon = (points: [number, number][]) => {
      const shape = new THREE.Shape();
      points.forEach(([x, y], index) => index === 0 ? shape.moveTo(x, y) : shape.lineTo(x, y));
      shape.closePath();
      return shape;
    };
    const addShape = (shape: THREE.Shape, material: THREE.MeshStandardMaterial) => {
      const geometry = new THREE.ExtrudeGeometry(shape, {
        depth: 0.28, bevelEnabled: true, bevelSegments: 2,
        steps: 1, bevelSize: 0.035, bevelThickness: 0.035, curveSegments: 8,
      });
      geometries.push(geometry);
      heroGroup.add(new THREE.Mesh(geometry, material));
    };
    const aShape = polygon([[-2.15, -1.2], [-1.22, 1.2], [-0.72, 1.2], [0.05, -1.2], [-0.5, -1.2], [-0.67, -0.63], [-1.43, -0.63], [-1.62, -1.2]]);
    const aCounter = new THREE.Path();
    aCounter.moveTo(-1.29, -0.12);
    aCounter.lineTo(-0.83, -0.12);
    aCounter.lineTo(-1.04, 0.64);
    aCounter.closePath();
    aShape.holes.push(aCounter);
    addShape(aShape, chromeMaterial);
    const bShape = polygon([[0.55, -1.2], [0.55, 1.2], [1.44, 1.2], [1.94, 0.94], [2.04, 0.48], [1.8, 0.1], [2.09, -0.19], [2.1, -0.73], [1.76, -1.2]]);
    for (const [bottom, top] of [[0.3, 0.77], [-0.73, -0.22]]) {
      const hole = new THREE.Path();
      hole.moveTo(1.07, bottom);
      hole.lineTo(1.54, bottom);
      hole.lineTo(1.54, top);
      hole.lineTo(1.07, top);
      hole.closePath();
      bShape.holes.push(hole);
    }
    addShape(bShape, chromeMaterial);
    addShape(polygon([[-0.36, -1.43], [-0.03, -1.43], [0.7, 1.43], [0.37, 1.43]]), rubyMaterial);

    // Animation & Smooth Control State
    let animationFrameId = 0;
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

      heroGroup.rotation.x = -0.12 + mouseY * 0.05;
      heroGroup.rotation.y = -0.22 + mouseX * 0.05;
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
      stopLoop();
      detachInputListeners();
      reducedMotionQuery.removeEventListener("change", handleMotionChange);
      resizeObserver.disconnect();
      visibilityObserver.disconnect();
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      renderer.domElement.removeEventListener("webglcontextlost", handleContextLost);

      geometries.forEach((geometry) => geometry.dispose());
      chromeMaterial.dispose();
      rubyMaterial.dispose();
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
    />
  );
}
