import assert from "node:assert/strict";
import test from "node:test";
import { initialStudioState, studioReducer } from "../app/studio/studio-state.ts";
import {
  animals, animalOrder, KANGAROO_ZONE, FLIGHT_RADIUS, FLIGHT_SECONDS, cockatooFlightPath, cockatooPose, cooldownReady,
  createLinePicker, detailLevel, footprintClear, inKangarooZone, koalaPose, wildlifePlacement,
} from "../app/studio/world/sim/wildlife.ts";
import { createResidentKangaroo, ROO_BODY_RADIUS } from "../app/studio/world/sim/resident-kangaroo.ts";
import { StudioAudio, STORAGE_KEY, WILDLIFE_CUES, createCueGate, masterGain, parsePrefs, DEFAULT_PREFS } from "../app/studio/audio/studio-audio.ts";

const visitor = { x: -0.5, z: 17 };

/* ---------------- content ---------------- */
test("each animal has a distinct personality and the requested speech lines", () => {
  assert.deepEqual(animalOrder, ["kangaroo", "koala", "cockatoo"]);
  assert.equal(new Set(animalOrder.map((id) => animals[id].personality)).size, 3);
  assert.ok(animals.kangaroo.lines.includes("Big ideas. Bigger hops."));
  assert.ok(animals.kangaroo.lines.includes("Hop in. Let’s build something."));
  assert.ok(animals.kangaroo.lines.includes("Just checking the website has bounce."));
  assert.ok(animals.koala.lines.includes("Big dreams. Small energy budget."));
  assert.ok(animals.cockatoo.lines.includes("Good design? Worth squawking about."));
  assert.ok(animals.cockatoo.lines.includes("Someone said launch?"));
});
test("speech lines rotate without immediate repeats and use every line before repeating", () => {
  const next = createLinePicker(animals.kangaroo.lines, 7);
  const first = Array.from({ length: 3 }, next);
  assert.equal(new Set(first).size, 3);
  let previous = first[2];
  for (let i = 0; i < 30; i++) { const line = next(); assert.notEqual(line, previous); previous = line; }
});
test("repeat taps are rate limited", () => {
  assert.equal(cooldownReady(0, 100, 1800), true);
  assert.equal(cooldownReady(1000, 1500, 1800), false);
  assert.equal(cooldownReady(1000, 2800, 1800), true);
});
test("animation detail falls with distance and quality tier", () => {
  assert.equal(detailLevel(5, "low"), 2);
  assert.equal(detailLevel(30, "low"), 1);
  assert.equal(detailLevel(100, "low"), 0);
  assert.equal(detailLevel(30, "high"), 2);
});

/* ---------------- placement and collisions ---------------- */
test("animals stand clear of furniture, the door and the pedestrian lane", () => {
  const { kangaroo, cockatoo, koala } = wildlifePlacement;
  assert.ok(inKangarooZone(kangaroo.x, kangaroo.z));
  assert.ok(footprintClear(kangaroo.x, kangaroo.z, ROO_BODY_RADIUS));
  assert.ok(footprintClear(koala.x, koala.z, 0.6), "tree and planter");
  assert.ok(footprintClear(cockatoo.x, cockatoo.z, 0.1), "railing");
  assert.ok(cockatoo.x - 1.2 > 0.6 + 0.12, "cockatoo rail is right of the door frame");
  assert.ok(kangaroo.x < -1.6 && kangaroo.x > -4.2, "kangaroo stands by the entrance, left of the door");
  assert.ok(koala.x < -11.4, "koala tree is outside the building line");
});
test("the resident kangaroo hops only inside its zone, clear of obstacles, with feet on the footpath", () => {
  const roo = createResidentKangaroo(1);
  let hops = 0, wasHopping = false;
  for (let t = 0; t < 240; t += 1 / 30) {
    if (Math.abs(t - 20) < 0.02) roo.react("wave");
    if (Math.abs(t - 40) < 0.02) roo.react("tilt");
    if (Math.abs(t - 60) < 0.02) roo.react("hop");
    const pose = roo.step(1 / 30, { visitor, reduced: false });
    assert.ok(pose.x >= KANGAROO_ZONE.x0 - 1e-6 && pose.x <= KANGAROO_ZONE.x1 + 1e-6, `x ${pose.x}`);
    assert.ok(pose.z >= KANGAROO_ZONE.z0 - 1e-6 && pose.z <= KANGAROO_ZONE.z1 + 1e-6, `z ${pose.z}`);
    assert.ok(footprintClear(pose.x, pose.z, ROO_BODY_RADIUS), `clear at ${pose.x},${pose.z}`);
    assert.ok(pose.footClear >= -1e-6, "feet never sink into the footpath");
    if (!roo.hopping) assert.ok(Math.abs(pose.y - 0.12) < 1e-6 && pose.footClear < 0.02, "grounded when not hopping");
    if (roo.hopping && !wasHopping) hops++;
    wasHopping = roo.hopping;
  }
  assert.ok(hops >= 3, `idle and interaction hops happened (${hops})`);
});
test("reduced motion replaces kangaroo hops with gentle poses", () => {
  const roo = createResidentKangaroo(2);
  roo.react("hop"); roo.greet();
  for (let t = 0; t < 120; t += 1 / 30) { roo.step(1 / 30, { visitor, reduced: true }); assert.equal(roo.hopping, false); }
});
test("kangaroo reactions: wave raises the arm, tilt tilts the head", () => {
  const roo = createResidentKangaroo(3);
  for (let t = 0; t < 1; t += 1 / 30) roo.step(1 / 30, { visitor, reduced: false });
  const rest = { arm: roo.pose.armR, roll: roo.pose.headRoll };
  roo.react("wave");
  let maxArm = 0;
  for (let t = 0; t < 2; t += 1 / 30) maxArm = Math.max(maxArm, roo.step(1 / 30, { visitor, reduced: false }).armR);
  assert.ok(maxArm > rest.arm + 1);
  for (let t = 0; t < 3; t += 1 / 30) roo.step(1 / 30, { visitor, reduced: false });
  roo.react("tilt");
  let maxRoll = 0;
  for (let t = 0; t < 1.5; t += 1 / 30) maxRoll = Math.max(maxRoll, Math.abs(roo.step(1 / 30, { visitor, reduced: false }).headRoll));
  assert.ok(maxRoll > rest.roll + 0.25);
});

/* ---------------- koala and cockatoo ---------------- */
test("koala sleeps with closed eyes, wakes on interaction, looks at the visitor and waves, then sleeps again", () => {
  assert.ok(koalaPose(3, -1, 0.5).eyeOpen < 0.2);
  assert.equal(koalaPose(3, -1, 0.5).headYaw, 0);
  const awake = koalaPose(3, 2, 0.5);
  assert.ok(awake.eyeOpen > 0.8);
  assert.ok(awake.headYaw > 0.4, "turns toward the visitor");
  assert.ok(koalaPose(3, 2.5, 0).armWave > 0.5);
  assert.ok(koalaPose(9, 5.3, 0).eyeOpen < 0.6 && koalaPose(9, 6, 0).eyeOpen < 0.2);
  assert.notEqual(koalaPose(1, -1, 0).breath, koalaPose(1.8, -1, 0).breath, "breathing moves");
});
test("cockatoo flight is a short lap that starts and ends exactly on the perch and never goes into the glass", () => {
  const start = cockatooFlightPath(0), end = cockatooFlightPath(1);
  for (const p of [start, end]) assert.ok(Math.hypot(p.dx, p.dy, p.dz) < 1e-9);
  for (let u = 0; u <= 1; u += 0.01) {
    const p = cockatooFlightPath(u);
    assert.ok(Math.hypot(p.dx, p.dz) <= FLIGHT_RADIUS * 1.1, "lap stays within about the flight radius");
    assert.ok(p.dz >= -1e-9, "only toward the street");
    assert.ok(p.dy >= -1e-9 && p.dy <= 0.5);
  }
  assert.ok(FLIGHT_SECONDS < 2.5);
  assert.ok(wildlifePlacement.cockatoo.z + FLIGHT_RADIUS * 1.1 < 10.55, "the lap ends before the far edge of the pedestrian lane");
});
test("cockatoo reacts with crest and a lap, but reduced motion never flies", () => {
  let flew = false, crest = 0;
  for (let t = 0; t < 3.4; t += 0.05) { const p = cockatooPose(10, t); flew ||= p.flying; crest = Math.max(crest, p.crest); }
  assert.ok(flew && crest > 0.9);
  for (let t = 0; t < 3.4; t += 0.05) { const p = cockatooPose(10, t, true); assert.equal(p.flying, false); assert.equal(Math.hypot(p.dx, p.dz), 0); }
  assert.equal(cockatooPose(5, -1).flying, false);
});

/* ---------------- state ---------------- */
test("choosing a local frames it and any room choice, tour or entrance returns to the room view", () => {
  const state = studioReducer({ ...initialStudioState, mode: "explore", panel: true }, { type: "animal", id: "koala" });
  assert.equal(state.animal, "koala");
  assert.equal(state.panel, false);
  assert.equal(studioReducer(state, { type: "reset" }).animal, "koala", "reset re-frames the animal");
  assert.equal(studioReducer(state, { type: "manual" }).animal, "koala", "orbiting keeps it");
  for (const event of [{ type: "select", area: "gallery" }, { type: "tour" }, { type: "entrance" }, { type: "static" }, { type: "fail" }])
    assert.equal(studioReducer(state, event).animal, null, event.type);
  assert.equal(studioReducer(state, { type: "animal", id: null }).animal, null);
  assert.equal(studioReducer({ ...initialStudioState, mode: "loading" }, { type: "animal", id: "cockatoo" }).mode, "explore");
});

/* ---------------- audio ---------------- */
function fakeAudio({ state = "suspended", resumeWorks = true } = {}) {
  const log = { closed: 0, suspended: 0, resumed: 0, oscillators: 0 };
  const param = () => ({ value: 0, setValueAtTime() {}, linearRampToValueAtTime() {}, exponentialRampToValueAtTime() {}, setTargetAtTime() {} });
  const node = () => ({ connect() {}, disconnect() {}, gain: param(), frequency: param(), Q: { value: 0 }, threshold: { value: 0 }, ratio: { value: 0 }, attack: { value: 0 }, release: { value: 0 } });
  class FakeContext {
    state = state; currentTime = 0; destination = node(); listeners = [];
    addEventListener(_, fn) { this.listeners.push(fn); }
    createDynamicsCompressor() { return node(); }
    createGain() { return node(); }
    createBiquadFilter() { return node(); }
    createOscillator() { log.oscillators++; return { ...node(), type: "sine", start() {}, stop() {}, onended: null }; }
    async resume() { log.resumed++; if (resumeWorks) { this.state = "running"; this.listeners.forEach((fn) => fn()); } }
    async suspend() { log.suspended++; this.state = "suspended"; }
    async close() { log.closed++; this.state = "closed"; }
  }
  return { log, Ctor: FakeContext };
}
const memory = () => { const data = new Map(); return { getItem: (k) => data.get(k) ?? null, setItem: (k, v) => data.set(k, v), data }; };

test("sound defaults to on at a gentle volume, remembers choices and survives bad stored data", () => {
  assert.deepEqual(parsePrefs(null), DEFAULT_PREFS);
  assert.equal(DEFAULT_PREFS.enabled, true);
  assert.ok(DEFAULT_PREFS.volume <= 0.4);
  assert.deepEqual(parsePrefs("{not json"), DEFAULT_PREFS);
  assert.deepEqual(parsePrefs('{"enabled":false,"volume":9}'), { enabled: false, volume: 1 });
  assert.ok(masterGain(1) <= 0.5, "comfortable ceiling");
});
test("cue gate: per-cue cooldown, no overlapping wildlife sounds, repeat taps stay quiet", () => {
  const gate = createCueGate();
  assert.equal(gate.allow("hop", 0), true);
  assert.equal(gate.allow("hop", 300), false, "repeat tap");
  assert.equal(gate.allow("cockatoo", 400), false, "wildlife cue still sounding");
  assert.equal(gate.allow("cockatoo", 900), true);
  assert.equal(gate.allow("select", 910), false, "global gap");
  assert.equal(gate.allow("select", 1500), true);
  assert.deepEqual([...WILDLIFE_CUES], ["hop", "koala", "cockatoo"]);
});
test("audio stays silent until the browser allows it, then plays; mute persists and is honoured", async () => {
  const blocked = fakeAudio({ resumeWorks: false });
  const storage = memory();
  const audio = new StudioAudio({ storage, AudioContextCtor: blocked.Ctor, now: () => 0 });
  audio.attach();
  await audio.resume();
  assert.equal(audio.getSnapshot().enabled, true);
  assert.equal(audio.getSnapshot().status, "locked", "does not claim audio while blocked");
  assert.equal(audio.play("welcome"), false);
  assert.equal(blocked.log.oscillators, 0);
  audio.dispose();

  const open = fakeAudio();
  let clock = 0;
  const live = new StudioAudio({ storage, AudioContextCtor: open.Ctor, now: () => (clock += 5000) });
  live.attach();
  await live.resume();
  assert.equal(live.getSnapshot().status, "ready");
  assert.equal(live.play("welcome"), true);
  assert.ok(open.log.oscillators > 0);
  live.setEnabled(false);
  assert.equal(live.play("select"), false, "muted means silent");
  assert.equal(JSON.parse(storage.data.get(STORAGE_KEY)).enabled, false);
  live.dispose();
  assert.equal(open.log.closed, 1, "context is released when leaving the studio");

  const again = new StudioAudio({ storage, AudioContextCtor: fakeAudio().Ctor });
  again.attach();
  assert.equal(again.getSnapshot().enabled, false, "mute is remembered across visits");
  assert.equal(again.getSnapshot().status, "muted");
  again.dispose();
});
test("zero volume plays nothing and volume is clamped and stored", async () => {
  const { Ctor, log } = fakeAudio();
  const storage = memory();
  const audio = new StudioAudio({ storage, AudioContextCtor: Ctor, now: () => 0 });
  audio.attach();
  await audio.resume();
  audio.setVolume(5);
  assert.equal(audio.getSnapshot().volume, 1);
  audio.setVolume(0);
  assert.equal(audio.play("select"), false);
  assert.equal(log.oscillators, 0);
  assert.equal(JSON.parse(storage.data.get(STORAGE_KEY)).volume, 0);
  audio.dispose();
});
test("unsupported browsers report it and every call is a safe no-op", () => {
  const audio = new StudioAudio({ storage: memory(), AudioContextCtor: null });
  audio.attach();
  assert.equal(audio.getSnapshot().status, "unsupported");
  assert.equal(audio.play("hop"), false);
  audio.dispose();
});
