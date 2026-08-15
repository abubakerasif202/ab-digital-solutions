"use client";

import React, { useEffect, useRef, useState } from "react";
// Named imports (rather than `import * as THREE`) so the bundler can drop the
// large parts of three we never touch — loaders, controls, curves, audio.
import {
  ACESFilmicToneMapping,
  AdditiveBlending,
  AmbientLight,
  BufferAttribute,
  BufferGeometry,
  DirectionalLight,
  DodecahedronGeometry,
  Group,
  IcosahedronGeometry,
  Mesh,
  MeshBasicMaterial,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  OctahedronGeometry,
  PerspectiveCamera,
  PointLight,
  Points,
  PointsMaterial,
  Scene,
  TorusKnotGeometry,
  WebGLRenderer,
} from "three";

interface Hero3DCanvasProps {
  className?: string;
  quality?: "mobile" | "tablet" | "desktop";
}

/**
 * Distance that keeps the sculpture framed on narrow portrait viewports.
 *
 * The camera sits at a fixed z on wide screens, but a phone-shaped container has
 * an aspect ratio well below 1, so the horizontal field of view collapses and
 * the geometry is cropped into stray diagonal lines. Pulling the camera back
 * until `framedRadius` fits horizontally keeps a composed object on portrait
 * screens while leaving desktop framing byte-for-byte unchanged.
 */
const DESKTOP_CAMERA_Z = 7.5;
const FRAMED_RADIUS = 1.7;

function fitCameraToViewport(camera: PerspectiveCamera, width: number, height: number) {
  const aspect = width / Math.max(height, 1);
  camera.aspect = aspect;
  const verticalFov = (camera.fov * Math.PI) / 180;
  const halfHorizontalTan = Math.tan(verticalFov / 2) * aspect;
  const distanceToFrame = halfHorizontalTan > 0 ? FRAMED_RADIUS / halfHorizontalTan : DESKTOP_CAMERA_Z;
  camera.position.z = Math.max(DESKTOP_CAMERA_Z, distanceToFrame);
  camera.updateProjectionMatrix();
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
    const scene = new Scene();

    // Camera Setup
    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || 500;
    const camera = new PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 0, DESKTOP_CAMERA_Z);
    fitCameraToViewport(camera, width, height);

    // Renderer Setup
    const isMobile = quality === "mobile";
    const isTablet = quality === "tablet";
    let renderer: WebGLRenderer;

    try {
      renderer = new WebGLRenderer({
        antialias: !isTablet && !isMobile,
        alpha: true,
        // "high-performance" asks the OS for the discrete/high-power GPU. That
        // is right for a desktop showpiece and wrong for a phone, where it
        // costs battery for a backdrop the user barely inspects.
        powerPreference: isMobile || isTablet ? "default" : "high-performance",
        // Fragment precision dominates cost on mobile GPUs; mediump is ample
        // for a dark metallic backdrop and measurably cheaper per pixel.
        precision: isMobile ? "mediump" : "highp",
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
    renderer.toneMapping = ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;

    container.appendChild(renderer.domElement);

    // Lighting aligned with brand palette (Gold #d4a32f, Red #b5121b, Cyan #38bdf8)
    const ambientLight = new AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const mainLight = new DirectionalLight(0xd4a32f, 2.2); // Warm Gold directional light
    mainLight.position.set(5, 5, 5);
    scene.add(mainLight);

    const redAccentLight = new PointLight(0xb5121b, 3.5, 15); // Brand Red accent
    redAccentLight.position.set(-4, -3, 2);
    scene.add(redAccentLight);

    // Every extra light costs per-fragment work. The gold key and red accent
    // are the brand and are never dropped; the cyan rim light is a non-brand
    // highlight, so phones skip it and gain a light's worth of shading back.
    // The red accent is boosted slightly there so the ruby glow does not weaken.
    const cyanHighlightLight = isMobile ? null : new PointLight(0x38bdf8, 2.0, 12);
    if (cyanHighlightLight) {
      cyanHighlightLight.position.set(3, 4, 3);
      scene.add(cyanHighlightLight);
    } else {
      redAccentLight.intensity = 4.1;
    }

    // Group for 3D objects
    const heroGroup = new Group();
    scene.add(heroGroup);

    // 1. Central Complex Sculptural Geometry
    const tubularSegments = isMobile ? 60 : isTablet ? 72 : 120;
    const radialSegments = isMobile ? 9 : isTablet ? 10 : 16;
    const mainGeometry = new TorusKnotGeometry(1.15, 0.3, tubularSegments, radialSegments, 2, 3);
    // Clearcoat is a second specular lobe evaluated per fragment. It earns its
    // cost on a full-size desktop showpiece; on a phone the sculpture renders
    // small and dimmed, where the standard metallic lobe is indistinguishable
    // for a fraction of the shader work. Metalness and roughness are identical
    // in both, so the material still reads as polished dark metal.
    const mainMaterial = isMobile
      ? new MeshStandardMaterial({ color: 0x08090a, metalness: 0.88, roughness: 0.12 })
      : new MeshPhysicalMaterial({
        color: 0x08090a,
        metalness: 0.88,
        roughness: 0.12,
        clearcoat: 1.0,
        clearcoatRoughness: 0.08,
        reflectivity: 0.95,
      });
    const mainMesh = new Mesh(mainGeometry, mainMaterial);
    heroGroup.add(mainMesh);

    // 2. Outer Gold Wireframe Ring
    const ringGeometry = new IcosahedronGeometry(2.15, isMobile || isTablet ? 1 : 2);
    const ringMaterial = new MeshBasicMaterial({
      color: 0xd4a32f,
      wireframe: true,
      transparent: true,
      opacity: 0.22,
    });
    const ringMesh = new Mesh(ringGeometry, ringMaterial);
    heroGroup.add(ringMesh);

    // 3. Orbiting Geometric Satellites
    const satelliteGroup = new Group();
    heroGroup.add(satelliteGroup);

    const satGeom1 = new OctahedronGeometry(0.32, 0);
    const satMat1 = new MeshStandardMaterial({
      color: 0xd4a32f,
      metalness: 0.9,
      roughness: 0.1,
      emissive: 0xb45309,
      emissiveIntensity: 0.4,
    });
    const sat1 = new Mesh(satGeom1, satMat1);
    sat1.position.set(2.4, 1.2, 0.5);
    satelliteGroup.add(sat1);

    const satGeom2 = new DodecahedronGeometry(0.26, 0);
    const satMat2 = new MeshStandardMaterial({
      color: 0xb5121b,
      metalness: 0.9,
      roughness: 0.15,
      emissive: 0x7f1d1d,
      emissiveIntensity: 0.5,
    });
    const sat2 = new Mesh(satGeom2, satMat2);
    sat2.position.set(-2.2, -1.4, 0.8);
    satelliteGroup.add(sat2);

    // 4. Interactive Particle Field
    const particleCount = isMobile ? 88 : isTablet ? 100 : 240;
    const particleGeometry = new BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
      particlePositions[i * 3] = (Math.random() - 0.5) * 16;
      particlePositions[i * 3 + 1] = (Math.random() - 0.5) * 12;
      particlePositions[i * 3 + 2] = (Math.random() - 0.5) * 10;
    }

    particleGeometry.setAttribute(
      "position",
      new BufferAttribute(particlePositions, 3)
    );

    const particleMaterial = new PointsMaterial({
      color: 0xfef08a,
      size: isMobile || isTablet ? 0.04 : 0.045,
      transparent: true,
      opacity: 0.55,
      blending: AdditiveBlending,
    });

    const particleSystem = new Points(particleGeometry, particleMaterial);
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

    const attachInputListeners = () => {
      if (inputListenersAttached) return;
      // Under reduced motion the loop never runs, so parallax input would only
      // accumulate values nothing reads. Skip the listeners entirely.
      if (prefersReducedMotion) return;
      if (!isTablet) window.addEventListener("mousemove", handleMouseMove, { passive: true });
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
        detachInputListeners();
        renderStaticFrame();
      } else {
        // Listeners are skipped while reduced motion is on, so (re)attach them
        // before restarting the loop or parallax would stay frozen.
        if (isVisible) attachInputListeners();
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
    //
    // setSize reallocates the WebGL drawing buffer, which is one of the most
    // expensive things this component can do. ResizeObserver fires for every
    // incidental layout change, so coalesce to one resize per frame and ignore
    // sub-pixel jitter — otherwise a phone reallocates the buffer repeatedly
    // while the URL bar animates.
    let appliedWidth = width;
    let appliedHeight = height;
    let resizeFrameId = 0;

    const currentPixelRatio = () => (isMobile
      ? Math.min(window.devicePixelRatio, 1.25)
      : isTablet
        ? 1
        : Math.min(window.devicePixelRatio, 1.5));

    const handleResize = () => {
      resizeFrameId = 0;
      if (!container) return;
      const newWidth = container.clientWidth || window.innerWidth;
      const newHeight = container.clientHeight || 500;
      if (newWidth <= 0 || newHeight <= 0) return;
      if (Math.abs(newWidth - appliedWidth) < 2 && Math.abs(newHeight - appliedHeight) < 2) return;

      appliedWidth = newWidth;
      appliedHeight = newHeight;

      fitCameraToViewport(camera, newWidth, newHeight);
      renderer.setPixelRatio(currentPixelRatio());
      renderer.setSize(newWidth, newHeight);
      if (isVisible || prefersReducedMotion) renderStaticFrame();
    };

    const scheduleResize = () => {
      if (resizeFrameId) return;
      resizeFrameId = requestAnimationFrame(handleResize);
    };

    const resizeObserver = new ResizeObserver(scheduleResize);
    resizeObserver.observe(container);

    // Cleanup
    return () => {
      stopLoop();
      detachInputListeners();
      // A queued resize would otherwise run against a disposed renderer.
      if (resizeFrameId) cancelAnimationFrame(resizeFrameId);
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
