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
test("manual input pauses a tour; stale tour ticks cannot move the camera", () => {
  let state = studioReducer({ ...initialStudioState, mode: "explore" }, { type: "tour" });
  state = studioReducer(state, { type: "manual" });
  assert.equal(state.tour, false);
  assert.equal(state.tourActive, true);
  assert.equal(studioReducer(state, { type: "advance" }), state);
});
test("tour pauses, resumes from the current room and stops cleanly", () => {
  let state = studioReducer({ ...initialStudioState, mode: "explore" }, { type: "tour" });
  state = studioReducer(state, { type: "advance" });
  assert.equal(state.area, "gallery");
  const paused = studioReducer(state, { type: "tour" });
  assert.equal(paused.tour, false);
  assert.equal(paused.tourActive, true);
  assert.equal(studioReducer(paused, { type: "advance" }), paused);
  const resumed = studioReducer(paused, { type: "tour" });
  assert.equal(resumed.tour, true);
  assert.equal(resumed.area, "gallery");
  const stopped = studioReducer(resumed, { type: "tourStop" });
  assert.equal(stopped.tour, false);
  assert.equal(stopped.tourActive, false);
  assert.equal(stopped.area, "gallery");
});
test("choosing a room interrupts the tour and ends it", () => {
  const touring = studioReducer({ ...initialStudioState, mode: "explore" }, { type: "tour" });
  const chosen = studioReducer(touring, { type: "select", area: "services" });
  assert.equal(chosen.tour, false);
  assert.equal(chosen.tourActive, false);
  assert.equal(chosen.area, "services");
  assert.equal(chosen.panel, true);
});
test("still view keeps the selected room and returning to 3D skips the arrival film", () => {
  const exploring = studioReducer({ ...initialStudioState, mode: "explore" }, { type: "select", area: "gallery" });
  const still = studioReducer(exploring, { type: "static" });
  assert.equal(still.mode, "static");
  assert.equal(still.still, true);
  assert.equal(still.area, "gallery");
  assert.equal(still.panel, true);
  const loading = studioReducer(still, { type: "enter", keep: true });
  assert.equal(loading.mode, "loading");
  assert.equal(loading.area, "gallery");
  assert.equal(loading.panel, true);
  const ready = studioReducer(loading, { type: "ready" });
  assert.equal(ready.mode, "explore");
  assert.equal(ready.resume, false);
  assert.equal(ready.area, "gallery");
});
test("reset re-frames the room while back to entrance leaves it; the two never coincide", () => {
  const inRoom = { ...initialStudioState, mode: "explore", area: "services", panel: true, overview: false, shot: 3 };
  const reset = studioReducer(inRoom, { type: "reset" });
  assert.equal(reset.area, "services");
  assert.equal(reset.panel, true);
  assert.equal(reset.outside, false);
  const outside = studioReducer(inRoom, { type: "entrance" });
  assert.equal(outside.outside, true);
  assert.equal(outside.panel, false);
  assert.equal(outside.area, "services");
  assert.equal(studioReducer(outside, { type: "reset" }).outside, false);
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
  const still = studioReducer(failed, { type: "static" });
  assert.equal(still.mode, "static");
  assert.equal(still.still, true);
  assert.equal(still.tour, false);
});

function webpSize(buffer) {
  const kind = buffer.toString("ascii", 12, 16);
  if (kind === "VP8X") return { width: buffer.readUIntLE(24, 3) + 1, height: buffer.readUIntLE(27, 3) + 1 };
  if (kind === "VP8 ") return { width: buffer.readUInt16LE(26) & 0x3fff, height: buffer.readUInt16LE(28) & 0x3fff };
  if (kind === "VP8L") {
    const bits = buffer.readUInt32LE(21);
    return { width: (bits & 0x3fff) + 1, height: ((bits >> 14) & 0x3fff) + 1 };
  }
  throw new Error(`Unknown WebP chunk ${kind}`);
}

test("original small GLB is valid and studio content uses canonical destinations", async () => {
  const { readFile } = await import("node:fs/promises");
  const { studioProjects, studioServices } = await import("../app/studio/studio-data.ts");
  const { projects } = await import("../app/project-data.ts");
  const { STUDIO_ASSET_REV, monogramUrl } = await import("../app/studio/studio-assets.ts");
  const config = await readFile(new URL("../next.config.ts", import.meta.url), "utf8");
  assert.match(config, new RegExp(`const STUDIO_ASSET_REV = "${STUDIO_ASSET_REV}"`));
  assert.match(config, /\/studio\/\$\{STUDIO_ASSET_REV\}\/:path\*/);
  assert.match(config, /max-age=31536000, immutable/);
  assert.equal(monogramUrl, `/studio/${STUDIO_ASSET_REV}/ab-monogram.glb`);
  const model = await readFile(new URL("../public/studio/ab-monogram.glb", import.meta.url));
  assert.equal(model.toString("ascii", 0, 4), "glTF");
  assert.equal(model.readUInt32LE(4), 2);
  assert.equal(model.readUInt32LE(8), model.length);
  assert.ok(model.length < 64000);
  const poster = await readFile(new URL("../public/studio/studio-poster.png", import.meta.url));
  assert.equal(poster.subarray(0, 8).toString("hex"), "89504e470d0a1a0a");
  assert.equal(poster.readUInt32BE(16), 1440);
  assert.equal(poster.readUInt32BE(20), 900);
  // Every project can be shown on a gallery frame, so each needs a small display texture.
  for (const project of projects) {
    const screen = await readFile(new URL(`../public/studio/screens/${project.slug}.webp`, import.meta.url));
    assert.equal(screen.toString("ascii", 8, 12), "WEBP");
    assert.ok(screen.length < 32000);
    const crisp = await readFile(new URL(`../public/studio/screens/${project.slug}@2x.webp`, import.meta.url));
    assert.equal(crisp.toString("ascii", 8, 12), "WEBP");
    assert.ok(crisp.length > screen.length, project.slug);
    assert.ok(crisp.length < 250000, project.slug);
    const size = webpSize(crisp);
    assert.ok(size.width > 512 && size.width <= 1536, `${project.slug} ${size.width}`);
  }
  assert.deepEqual(studioProjects.map((project) => project.slug), projects.map((project) => project.slug));
  assert.ok(studioProjects.some((project) => project.slug === "wild-pest-solutions"));
  assert.ok(studioProjects.some((project) => project.slug === "pept-up-labs"));
  // Services come from the real catalogue (custom business systems has its own page); every destination is an existing route.
  const { servicePages } = await import("../app/services/service-data.ts");
  const { contactServices } = await import("../app/contact-options.ts");
  assert.equal(studioServices.length, servicePages.length);
  for (const page of servicePages) assert.ok(studioServices.some((service) => service.href === `/services/${page.slug}`));
  assert.ok(studioServices.some((service) => service.title === "Custom Software & Business Systems" && service.href === "/services/custom-software-business-systems"));
  for (const service of studioServices) assert.ok(contactServices.includes(service.contactService), service.title);
});

test("explicit navigation or orbit cancels an unfinished introduction", () => {
  const loading = studioReducer(initialStudioState, { type: "enter" });
  const selected = studioReducer(loading, { type: "select", area: "services" });
  assert.equal(selected.mode, "explore");
  assert.equal(studioReducer(selected, { type: "ready" }).mode, "explore");
  const intro = studioReducer(loading, { type: "ready" });
  assert.equal(studioReducer(intro, { type: "manual" }).mode, "explore");
});


test("reset view recovers from manual navigation, pauses the tour and keeps the open room", () => {
  const state = { ...initialStudioState, mode: "explore", panel: true, tour: true, tourActive: true, manual: true, shot: 5 };
  const reset = studioReducer(state, { type: "reset" });
  assert.equal(reset.panel, true);
  assert.equal(reset.area, state.area);
  assert.equal(reset.tour, false);
  assert.equal(reset.manual, false);
  assert.equal(reset.shot, 6);
  assert.equal(reset.mode, "explore");
});
