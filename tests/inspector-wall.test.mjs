import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { wallStore } from "../app/components/home/wall/wall-store.ts";

const read = (path) => readFile(new URL(path, import.meta.url), "utf8");

test("wall store notifies on a real change only and records who chose", () => {
  let calls = 0;
  const off = wallStore.subscribe(() => { calls += 1; });
  wallStore.setFocus(0, "auto");
  const start = wallStore.getFocus();
  wallStore.setFocus(start, "auto");
  assert.equal(calls, 0, "same index must not notify");

  const next = start + 1;
  wallStore.setFocus(next, "work");
  assert.equal(calls, 1);
  assert.equal(wallStore.getFocus(), next);
  assert.equal(wallStore.getSource(), "work");
  assert.ok(wallStore.msSinceManual() < 1000, "a deliberate choice starts the manual hold");

  off();
  wallStore.setFocus(next + 1, "hero");
  assert.equal(calls, 1, "unsubscribed listeners stay silent");
  wallStore.setFocus(0, "auto");
});

test("an automatic change never counts as a deliberate choice", () => {
  wallStore.setFocus(2, "work");
  const manualAt = wallStore.msSinceManual(Date.now() + 60_000);
  wallStore.setFocus(3, "auto");
  assert.ok(wallStore.msSinceManual(Date.now() + 60_000) >= manualAt, "auto must not refresh the manual clock");
  wallStore.setFocus(0, "auto");
});

test("the WebGL engine is lazy, instanced, GPU-driven and cleans up after itself", async () => {
  const [engine, shader, stage, home, edge] = await Promise.all([
    read("../app/components/home/wall/WallEngine.ts"),
    read("../app/components/home/wall/wall-shader.ts"),
    read("../app/components/home/HeroStage.tsx"),
    read("../app/agency-home.tsx"),
    read("../app/components/home/wall/edge-map.ts"),
  ]);

  // three.js is only fetched after the headline paints and never on the server.
  assert.match(engine, /await import\("three"\)/);
  assert.doesNotMatch(engine, /^import \* as THREE from "three"/m);
  assert.match(stage, /import\("\.\/wall\/WallEngine"\)/);
  assert.match(stage, /requestIdleCallback/);
  assert.match(stage, /saveData/);

  // One instanced draw call; per-tile motion lives in the vertex shader.
  assert.match(engine, /InstancedBufferGeometry/);
  assert.match(engine, /geometry\.instanceCount = count/);
  assert.match(shader, /attribute vec2 aCell;/);
  assert.match(shader, /uniform vec3 uPointer;/);
  assert.doesNotMatch(engine, /instanceMatrix|setMatrixAt/);

  // Structure view is precomputed once per screenshot, not sampled per pixel.
  assert.match(edge, /Sobel|gx|gy/);
  assert.doesNotMatch(shader, /texture2D\([^)]*\+ *vec2/);

  // Reduced motion, hidden tabs, off-screen and lost contexts are all handled.
  assert.match(engine, /reducedMotion/);
  assert.match(engine, /uBreath: \{ value: reducedMotion \? 0 : 1 \}/);
  assert.match(engine, /visibilitychange/);
  assert.match(engine, /webglcontextlost/);
  assert.match(stage, /new IntersectionObserver/);
  assert.match(stage, /prefers-reduced-motion: reduce/);

  // Adaptive resolution and complete disposal.
  assert.match(engine, /dpr - 0\.25/);
  assert.match(engine, /renderer\.dispose\(\)/);
  assert.match(engine, /geometry\.dispose\(\)/);
  assert.match(engine, /material\.dispose\(\)/);
  assert.match(engine, /removeEventListener\("webglcontextlost"/);

  // The canvas is decorative; the headline, selector and links are real DOM.
  assert.match(stage, /<canvas[^>]*aria-hidden="true"/);
  assert.match(stage, /aria-pressed=\{i === index\}/);
  assert.match(home, /<h1 id="hero-heading" className="hx-title">/);
  assert.doesNotMatch(home, /^"use client"/);
});

test("the work index keeps real links and drives the wall from hover, focus and scroll", async () => {
  const index = await read("../app/components/home/WorkIndex.tsx");
  assert.match(index, /<Link\s+href=\{row\.href\}/);
  assert.match(index, /onPointerEnter=\{\(\) => wallStore\.setFocus\(i, "work"\)\}/);
  assert.match(index, /onFocus=\{\(\) => wallStore\.setFocus\(i, "work"\)\}/);
  assert.match(index, /new IntersectionObserver/);
});
