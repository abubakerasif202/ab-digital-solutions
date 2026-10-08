"use client";

import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { HeroFallback } from "./HeroFallback";
import { createSignalGeometry, signalPoint } from "./signal-geometry";
import { studioRadiance } from "./studio-radiance";

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

    // The physical iridescence shader samples an original procedural softbox rig.
    const radiance = new THREE.DataTexture(studioRadiance(), 256, 128);
    radiance.mapping = THREE.EquirectangularReflectionMapping;
    radiance.colorSpace = THREE.SRGBColorSpace;
    radiance.needsUpdate = true;
    const pmrem = new THREE.PMREMGenerator(renderer);
    const environment = pmrem.fromEquirectangular(radiance);
    scene.environment = environment.texture;
    pmrem.dispose();
    radiance.dispose();
    scene.add(new THREE.AmbientLight(0xddeaff, 1.8));
    const keyLight = new THREE.DirectionalLight(0xffffff, 5);
    keyLight.position.set(2, 4, 5);
    scene.add(keyLight);
    const edgeLight = new THREE.DirectionalLight(0x8beaff, 4);
    edgeLight.position.set(-4, -2, 3);
    scene.add(edgeLight);
    const goldLight = new THREE.DirectionalLight(0xf3d5a1, 2.5);
    goldLight.position.set(3, -3, -2);
    scene.add(goldLight);
    const heroGroup = new THREE.Group();
    heroGroup.rotation.set(-0.2, -0.38, -0.12);
    scene.add(heroGroup);
    const cobaltMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x577cff, metalness: 0.68, roughness: 0.23,
      clearcoat: 1, clearcoatRoughness: 0.16, envMapIntensity: 2.2,
      iridescence: 0.48, iridescenceIOR: 1.35,
      iridescenceThicknessRange: [120, 360], side: THREE.FrontSide,
    });
    const mineralMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xe4e9ef, metalness: 0.8, roughness: 0.22,
      clearcoat: 1, envMapIntensity: 1.8, side: THREE.BackSide,
    });
    // A view-dependent rim adds legible cyan/violet edges without bloom passes.
    const chromaticShift = { value: 0.5 };
    cobaltMaterial.onBeforeCompile = (shader) => {
      shader.uniforms.uSignalShift = chromaticShift;
      shader.fragmentShader = "uniform float uSignalShift;\n" + shader.fragmentShader;
      shader.fragmentShader = shader.fragmentShader.replace("#include <opaque_fragment>", `
        float signalFresnel = pow(1.0 - abs(dot(normal, normalize(vViewPosition))), 3.0);
        vec3 signalRim = mix(vec3(0.16, 0.7, 1.0), vec3(0.55, 0.25, 1.0), uSignalShift);
        outgoingLight += signalRim * signalFresnel * 0.38;
        #include <opaque_fragment>
      `);
    };
    cobaltMaterial.customProgramCacheKey = () => "signal-chromatic-rim-v1";
    const surface = createSignalGeometry(isTablet ? 120 : 180, 12);
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.Float32BufferAttribute(surface.positions, 3));
    geometry.setIndex(surface.indices);
    geometry.computeVertexNormals();
    const geometries: THREE.BufferGeometry[] = [geometry];
    heroGroup.add(new THREE.Mesh(geometry, cobaltMaterial), new THREE.Mesh(geometry, mineralMaterial));
    const contourMaterial = new THREE.LineBasicMaterial({ color: 0xa8edff, transparent: true, opacity: 0.48 });
    const seamMaterial = new THREE.LineBasicMaterial({ color: 0xf5dcb0, transparent: true, opacity: 0.4 });
    for (const across of [-1, -0.86, 0.86, 1]) {
      const points = Array.from({ length: 241 }, (_, index) => new THREE.Vector3(...signalPoint(index / 240 * Math.PI * 2, across)));
      const contour = new THREE.BufferGeometry().setFromPoints(points);
      geometries.push(contour);
      heroGroup.add(new THREE.Line(contour, Math.abs(across) === 1 ? contourMaterial : seamMaterial));
    }

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

      chromaticShift.value = (mouseX + 1) * 0.5;
      edgeLight.position.x = -4 + mouseX * 2;
      keyLight.position.y = 4 - mouseY * 1.5;
      heroGroup.rotation.x = -0.2 + mouseY * 0.09;
      heroGroup.rotation.y = -0.38 + mouseX * 0.12;
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
      cobaltMaterial.dispose();
      mineralMaterial.dispose();
      contourMaterial.dispose();
      seamMaterial.dispose();
      environment.dispose();
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
