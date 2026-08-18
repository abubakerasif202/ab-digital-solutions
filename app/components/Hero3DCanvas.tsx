"use client";

import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";

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

    // Lighting aligned with brand palette (Gold #d4a32f, Red #b5121b, Cyan #38bdf8)
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const mainLight = new THREE.DirectionalLight(0xd4a32f, 2.2); // Warm Gold directional light
    mainLight.position.set(5, 5, 5);
    scene.add(mainLight);

    const redAccentLight = new THREE.PointLight(0xb5121b, 3.5, 15); // Brand Red accent
    redAccentLight.position.set(-4, -3, 2);
    scene.add(redAccentLight);

    const cyanHighlightLight = new THREE.PointLight(0x38bdf8, 2.0, 12); // Crisp Cyan accent
    cyanHighlightLight.position.set(3, 4, 3);
    scene.add(cyanHighlightLight);

    // Group for 3D objects
    const heroGroup = new THREE.Group();
    scene.add(heroGroup);

    // 1. Central Complex Sculptural Geometry
    const tubularSegments = isMobile ? 60 : isTablet ? 72 : 120;
    const radialSegments = isMobile ? 9 : isTablet ? 10 : 16;
    const mainGeometry = new THREE.TorusKnotGeometry(1.15, 0.3, tubularSegments, radialSegments, 2, 3);
    // Clearcoat adds a second normal/roughness evaluation per fragment. Worth
    // it on desktop where the mesh fills more of the frame; on mobile/tablet
    // a plain metallic standard material reads almost identically at a
    // fraction of the shader cost.
    const mainMaterial = (isMobile || isTablet)
      ? new THREE.MeshStandardMaterial({
        color: 0x08090a,
        metalness: 0.88,
        roughness: 0.16,
      })
      : new THREE.MeshPhysicalMaterial({
        color: 0x08090a,
        metalness: 0.88,
        roughness: 0.12,
        clearcoat: 1.0,
        clearcoatRoughness: 0.08,
        reflectivity: 0.95,
      });
    const mainMesh = new THREE.Mesh(mainGeometry, mainMaterial);
    heroGroup.add(mainMesh);

    // 2. Outer Gold Wireframe Ring
    const ringGeometry = new THREE.IcosahedronGeometry(2.15, isMobile || isTablet ? 1 : 2);
    const ringMaterial = new THREE.MeshBasicMaterial({
      color: 0xd4a32f,
      wireframe: true,
      transparent: true,
      opacity: 0.22,
    });
    const ringMesh = new THREE.Mesh(ringGeometry, ringMaterial);
    heroGroup.add(ringMesh);

    // 3. Orbiting Geometric Satellites
    const satelliteGroup = new THREE.Group();
    heroGroup.add(satelliteGroup);

    const satGeom1 = new THREE.OctahedronGeometry(0.32, 0);
    const satMat1 = new THREE.MeshStandardMaterial({
      color: 0xd4a32f,
      metalness: 0.9,
      roughness: 0.1,
      emissive: 0xb45309,
      emissiveIntensity: 0.4,
    });
    const sat1 = new THREE.Mesh(satGeom1, satMat1);
    sat1.position.set(2.4, 1.2, 0.5);
    satelliteGroup.add(sat1);

    const satGeom2 = new THREE.DodecahedronGeometry(0.26, 0);
    const satMat2 = new THREE.MeshStandardMaterial({
      color: 0xb5121b,
      metalness: 0.9,
      roughness: 0.15,
      emissive: 0x7f1d1d,
      emissiveIntensity: 0.5,
    });
    const sat2 = new THREE.Mesh(satGeom2, satMat2);
    sat2.position.set(-2.2, -1.4, 0.8);
    satelliteGroup.add(sat2);

    // 4. Interactive Particle Field
    const particleCount = isMobile ? 88 : isTablet ? 100 : 240;
    const particleGeometry = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
      particlePositions[i * 3] = (Math.random() - 0.5) * 16;
      particlePositions[i * 3 + 1] = (Math.random() - 0.5) * 12;
      particlePositions[i * 3 + 2] = (Math.random() - 0.5) * 10;
    }

    particleGeometry.setAttribute(
      "position",
      new THREE.BufferAttribute(particlePositions, 3)
    );

    const particleMaterial = new THREE.PointsMaterial({
      color: 0xfef08a,
      size: isMobile || isTablet ? 0.04 : 0.045,
      transparent: true,
      opacity: 0.55,
      blending: THREE.AdditiveBlending,
    });

    const particleSystem = new THREE.Points(particleGeometry, particleMaterial);
    scene.add(particleSystem);

    // Animation & Smooth Control State
    let animationFrameId = 0;
    let isVisible = false;
    let isRunning = false;
    let inputListenersAttached = false;
    let lastRenderTime = 0;
    let nextRenderTime = 0;
    let elapsedTime = 0;
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
    };

    const handleScroll = () => {
      targetScrollY = window.scrollY;
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
      lastRenderTime = 0;
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

      if (lastRenderTime) {
        elapsedTime += Math.min((timestamp - lastRenderTime) / 1000, 0.1);
      }
      lastRenderTime = timestamp;
      do {
        nextRenderTime += frameInterval;
      } while (nextRenderTime <= timestamp);

      // Smooth mouse lerping
      mouseX += (targetMouseX - mouseX) * 0.05;
      mouseY += (targetMouseY - mouseY) * 0.05;

      // Smooth scroll lerping
      scrollY += (targetScrollY - scrollY) * 0.05;
      const scrollFactor = Math.min(scrollY / 1000, 2);

      if (!prefersReducedMotion) {
        // Main Mesh rotations
        mainMesh.rotation.x = elapsedTime * 0.25 + mouseY * 0.5 + scrollFactor * 0.8;
        mainMesh.rotation.y = elapsedTime * 0.35 + mouseX * 0.5 + scrollFactor * 1.2;

        // Wireframe ring counter-rotation
        ringMesh.rotation.x = -elapsedTime * 0.15 - mouseY * 0.3;
        ringMesh.rotation.y = -elapsedTime * 0.2 + mouseX * 0.3;

        // Satellites orbit
        satelliteGroup.rotation.y = elapsedTime * 0.4 + mouseX * 0.4;
        satelliteGroup.rotation.z = elapsedTime * 0.2;

        sat1.rotation.x = elapsedTime * 0.6;
        sat2.rotation.y = elapsedTime * 0.9;

        // Particle field floating effect
        particleSystem.rotation.y = elapsedTime * 0.03 + mouseX * 0.1;
        particleSystem.rotation.x = elapsedTime * 0.02 + mouseY * 0.1;
      }

      // Parallax camera movement
      camera.position.x = mouseX * 0.6;
      camera.position.y = -mouseY * 0.6 - scrollFactor * 0.5;
      camera.lookAt(scene.position);

      renderer.render(scene, camera);
    };

    const startLoop = () => {
      if (isRunning || !isVisible || prefersReducedMotion) return;
      isRunning = true;
      lastRenderTime = 0;
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

      // Dispose Geometries & Materials
      mainGeometry.dispose();
      mainMaterial.dispose();
      ringGeometry.dispose();
      ringMaterial.dispose();
      satGeom1.dispose();
      satMat1.dispose();
      satGeom2.dispose();
      satMat2.dispose();
      particleGeometry.dispose();
      particleMaterial.dispose();
      renderer.dispose();
      renderer.forceContextLoss();

      if (renderer.domElement && renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
    };
  }, [quality, rendererFailed]);

  if (rendererFailed) {
    return (
      <div
        className={`hero-3d-fallback ${className}`}
        style={{
          width: "100%",
          height: "100%",
          minHeight: "450px",
          background:
            "radial-gradient(circle at 50% 50%, rgba(212, 163, 47, 0.18), rgba(181, 18, 27, 0.1), transparent 70%)",
        }}
        aria-label="3D background visual representation"
      />
    );
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
