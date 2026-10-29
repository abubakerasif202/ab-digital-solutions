import assert from "node:assert/strict";
import test from "node:test";
import { initialStudioState, studioReducer } from "../app/studio/studio-state.ts";

test("studio only enters after intent and late loading cannot restart a skipped intro", () => {
  assert.equal(initialStudioState.mode, "static");
  let state = studioReducer(initialStudioState, { type: "enter" });
  assert.equal(state.mode, "loading");
  state = studioReducer(state, { type: "skip" });
  assert.equal(studioReducer(state, { type: "ready" }).mode, "explore");
});
test("manual input cancels a tour; stale tour ticks cannot move the camera", () => {
  let state = studioReducer({ ...initialStudioState, mode: "explore" }, { type: "tour" });
  state = studioReducer(state, { type: "manual" });
  assert.equal(state.tour, false);
  assert.equal(studioReducer(state, { type: "advance" }), state);
});
test("tour visits all four areas and ends with usable consultation content", () => {
  let state = studioReducer({ ...initialStudioState, mode: "explore" }, { type: "tour" });
  for (const area of ["gallery", "services", "consultation"]) {
    state = studioReducer(state, { type: "advance" });
    assert.equal(state.area, area);
  }
  state = studioReducer(state, { type: "advance" });
  assert.equal(state.tour, false);
  assert.equal(state.panel, true);
});
test("failure and leaving release interaction state; content remains selectable", () => {
  const failed = studioReducer({ ...initialStudioState, tour: true }, { type: "fail" });
  assert.equal(failed.tour, false);
  assert.equal(studioReducer(failed, { type: "select", area: "gallery" }).panel, true);
  assert.deepEqual(studioReducer(failed, { type: "static" }), { ...initialStudioState, shot: 1 });
});

test("original small GLB is valid and studio content uses canonical destinations", async () => {
  const { readFile } = await import("node:fs/promises");
  const { studioProjects, studioServices } = await import("../app/studio/studio-data.ts");
  const { projects } = await import("../app/project-data.ts");
  const model = await readFile(new URL("../public/studio/ab-monogram.glb", import.meta.url));
  assert.equal(model.toString("ascii", 0, 4), "glTF");
  assert.equal(model.readUInt32LE(4), 2);
  assert.equal(model.readUInt32LE(8), model.length);
  assert.ok(model.length < 64000);
  const poster = await readFile(new URL("../public/studio/studio-poster.png", import.meta.url));
  assert.equal(poster.subarray(0, 8).toString("hex"), "89504e470d0a1a0a");
  assert.equal(poster.readUInt32BE(16), 1440);
  assert.equal(poster.readUInt32BE(20), 900);
  for (const project of projects.slice(0, 3)) {
    const screen = await readFile(new URL(`../public/studio/screens/${project.slug}.webp`, import.meta.url));
    assert.equal(screen.toString("ascii", 8, 12), "WEBP");
    assert.ok(screen.length < 32000);
  }
  assert.deepEqual(studioProjects.map((project) => project.slug), projects.map((project) => project.slug));
  assert.equal(studioServices.length, 4);
  assert.equal(studioServices[3].href, "/contact");
});

test("explicit navigation or orbit cancels an unfinished introduction", () => {
  const loading = studioReducer(initialStudioState, { type: "enter" });
  const selected = studioReducer(loading, { type: "select", area: "services" });
  assert.equal(selected.mode, "explore");
  assert.equal(studioReducer(selected, { type: "ready" }).mode, "explore");
  const intro = studioReducer(loading, { type: "ready" });
  assert.equal(studioReducer(intro, { type: "manual" }).mode, "explore");
});


test("reset view recovers from manual navigation and clears tour and panel", () => {
  const state = { ...initialStudioState, mode: "explore", panel: true, tour: true, manual: true, shot: 5 };
  const reset = studioReducer(state, { type: "reset" });
  assert.equal(reset.panel, false);
  assert.equal(reset.tour, false);
  assert.equal(reset.manual, false);
  assert.equal(reset.shot, 6);
  assert.equal(reset.mode, "explore");
});
