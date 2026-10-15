"use client";

import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { HeroFallback } from "./HeroFallback";
import { SVGLoader } from "three/examples/jsm/loaders/SVGLoader.js";
import { LOGO_PATHS, LOGO_VIEWBOX, type LogoPartName } from "./logo-mark";
import { studioRadiance } from "./studio-radiance";

/** Logo units are SVG pixels; this maps the 80-wide mark to ~4.4 scene units. */
const LOGO_SCALE = 0.055;
const LOGO_DEPTH = 7;
const SLASH_LIFT = 3.2;
const INTRO_MS = 1500;
const REST_YAW = -0.3;
const REST_PITCH = -0.1;

function buildLogoPart(name: LogoPartName, curveSegments: number): THREE.ExtrudeGeometry {
  const loader = new SVGLoader();
  const parsed = loader.parse(`<svg xmlns="http://www.w3.org/2000/svg"><path d="${LOGO_PATHS[name]}"/></svg>`);
  const shapes = parsed.paths.flatMap((path) => SVGLoader.createShapes(path));
  const geometry = new THREE.ExtrudeGeometry(shapes, {
    depth: name === "slash" ? LOGO_DEPTH + SLASH_LIFT : LOGO_DEPTH,
    bevelEnabled: true,
    bevelThickness: 0.9,
    bevelSize: 0.7,
    bevelSegments: 4,
    curveSegments,
  });
  // Centre on the mark's optical middle so rotation pivots around the logo.
  geometry.translate(-LOGO_VIEWBOX.width / 2, -LOGO_VIEWBOX.height / 2, -LOGO_DEPTH / 2);
  return geometry;
}

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
    scene.add(new THREE.AmbientLight(0xffffff, 1.1));
    const keyLight = new THREE.DirectionalLight(0xffffff, 5);
    keyLight.position.set(2, 4, 5);
    scene.add(keyLight);
    const edgeLight = new THREE.DirectionalLight(0xff6a7d, 2.2);
    edgeLight.position.set(-4, -2, 3);
    scene.add(edgeLight);
    const goldLight = new THREE.DirectionalLight(0xfff4de, 3.2);
    goldLight.position.set(3, -3, -2);
    scene.add(goldLight);
    const heroGroup = new THREE.Group();
    heroGroup.rotation.set(REST_PITCH, REST_YAW, 0);
    // SVG y runs downward; the negative y scale stands the mark upright.
    heroGroup.scale.set(LOGO_SCALE, -LOGO_SCALE, LOGO_SCALE);
    scene.add(heroGroup);
    // Gilt letters with a ruby slash, matching the flat brand mark.
    const giltMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xf0cf7c, metalness: 0.88, roughness: 0.2,
      clearcoat: 0.8, clearcoatRoughness: 0.2, envMapIntensity: 1.9,
    });
    const rubyMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xb3122d, metalness: 0.6, roughness: 0.3,
      clearcoat: 1, clearcoatRoughness: 0.18, envMapIntensity: 1.6,
    });
    // A view-dependent rim adds a champagne-to-ruby edge light without bloom passes.
    const chromaticShift = { value: 0.5 };
    giltMaterial.onBeforeCompile = (shader) => {
      shader.uniforms.uSignalShift = chromaticShift;
      shader.fragmentShader = "uniform float uSignalShift;\n" + shader.fragmentShader;
      shader.fragmentShader = shader.fragmentShader.replace("#include <opaque_fragment>", `
        float signalFresnel = pow(1.0 - abs(dot(normal, normalize(vViewPosition))), 3.0);
        vec3 signalRim = mix(vec3(0.94, 0.79, 0.42), vec3(0.82, 0.09, 0.21), uSignalShift);
        outgoingLight += signalRim * signalFresnel * 0.38;
        #include <opaque_fragment>
      `);
    };
    giltMaterial.customProgramCacheKey = () => "gilt-ruby-rim-v1";
    const curveSegments = isTablet ? 10 : 18;
    const geometries = (Object.keys(LOGO_PATHS) as LogoPartName[]).map((name) => ({
      name,
      geometry: buildLogoPart(name, curveSegments),
    }));
    for (const { name, geometry } of geometries) {
      heroGroup.add(new THREE.Mesh(geometry, name === "slash" ? rubyMaterial : giltMaterial));
    }

    // Animation & Smooth Control State
    let animationFrameId = 0;
    let revealFrame = 0;
    let isVisible = false;
    let isRunning = false;
    let inputListenersAttached = false;
    let nextRenderTime = 0;
    let lastFrameTime = 0;
    let introProgress = prefersReducedMotion ? 1 : 0;

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
      if (introProgress < 1) {
        introProgress = Math.min(1, introProgress + (lastFrameTime ? timestamp - lastFrameTime : 0) / INTRO_MS);
      }
      lastFrameTime = timestamp;
      const settle = 1 - Math.pow(1 - introProgress, 3);
      heroGroup.rotation.x = REST_PITCH + mouseY * 0.14;
      heroGroup.rotation.y = REST_YAW - (1 - settle) * 1.1 + mouseX * 0.38;
      heroGroup.position.y = -scrollFactor * 0.12;
      camera.position.x = mouseX * 0.12;
      camera.position.y = -mouseY * 0.12;
      camera.lookAt(scene.position);

      renderer.render(scene, camera);
      if (introProgress >= 1 && Math.abs(targetMouseX - mouseX) < 0.001 && Math.abs(targetMouseY - mouseY) < 0.001 && Math.abs(targetScrollY - scrollY) < 0.1) stopLoop();
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

      geometries.forEach(({ geometry }) => geometry.dispose());
      giltMaterial.dispose();
      rubyMaterial.dispose();
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
    >
      <HeroFallback />
    </div>
  );
}
