import assert from "node:assert/strict";
import test from "node:test";
import { advanceExhibition, createExhibitionBag, exhibitionCanRun, exhibitionComposition, exhibitionInteractionPauses, exhibitionSwipeDirection, jumpExhibition, stepExhibition, upcomingExhibition } from "../app/components/cinematic/exhibition-sequence.ts";

function random(seed) { let value = seed; return () => ((value = (value * 1664525 + 1013904223) >>> 0) / 4294967296); }

test("controlled shuffle includes all nineteen projects exactly once and varies by visit", () => {
  const first = createExhibitionBag(19, random(15));
  assert.deepEqual([...first].sort((a,b)=>a-b), Array.from({ length: 19 }, (_, i)=>i));
  assert.notDeepEqual(first, createExhibitionBag(19, random(400)));
});

test("a new shuffled bag cannot repeat the last featured project immediately", () => {
  for (let seed = 1; seed < 80; seed++) {
    const bag = createExhibitionBag(19, random(seed), 0);
    assert.notEqual(bag[0], 0);
  }
  assert.deepEqual(createExhibitionBag(1, random(1), 0), [0]);
  assert.deepEqual(createExhibitionBag(0, random(1)), []);
});

test("next traverses the complete registry before another bag and previous retraces history", () => {
  let state = { sequence: Array.from({ length: 19 }, (_, i) => i), cursor: 0, previous: null };
  const visited = [0];
  for (let i = 0; i < 18; i++) { state = stepExhibition(state, 1, 19, random(i + 1)); visited.push(state.sequence[state.cursor]); }
  assert.equal(new Set(visited).size, 19);
  const last = state.sequence[state.cursor];
  state = stepExhibition(state, 1, 19, random(3));
  assert.notEqual(state.sequence[state.cursor], last);
  state = stepExhibition(state, -1, 19, random(3));
  assert.equal(state.sequence[state.cursor], last);
  assert.equal(state.sequence.length, 38);
});

test("long visits retain bounded history and do not immediately repeat", () => {
  let state = { sequence: createExhibitionBag(19, random(5)), cursor: 0, previous: null };
  for (let i = 0; i < 500; i++) {
    const current = state.sequence[state.cursor];
    state = stepExhibition(state, 1, 19, random(i+2));
    assert.notEqual(state.sequence[state.cursor], current);
    assert.ok(state.sequence.length <= 57);
  }
});

test("the preview rail predicts the next project at shuffled bag boundaries", () => {
  let state = { sequence: createExhibitionBag(19, random(5)), cursor: 0, previous: null };
  for (let i = 0; i < 80; i++) {
    const predicted = state.sequence[(state.cursor + 1) % state.sequence.length];
    state = stepExhibition(state, 1, 19, random(i + 9));
    assert.equal(state.sequence[state.cursor], predicted);
  }
});

const idle = { pointerInside: false, pointerOverInteractive: false, focusInside: false, focusVisible: false };
const ready = { ...idle, paused: false, visible: true, hidden: false, reduced: false, saveData: false };

test("a pointer resting inside the section does not pause; a pointer over an interactive target does", () => {
  assert.equal(exhibitionInteractionPauses(idle), false);
  assert.equal(exhibitionInteractionPauses({ ...idle, pointerInside: true }), false);
  assert.equal(exhibitionCanRun({ ...ready, pointerInside: true }), true);
  assert.equal(exhibitionInteractionPauses({ ...idle, pointerInside: true, pointerOverInteractive: true }), true);
  assert.equal(exhibitionCanRun({ ...ready, pointerInside: true, pointerOverInteractive: true }), false);
});

test("keyboard-visible focus pauses; focus left behind by a mouse click does not", () => {
  assert.equal(exhibitionInteractionPauses({ ...idle, focusInside: true, focusVisible: true }), true);
  assert.equal(exhibitionCanRun({ ...ready, focusInside: true, focusVisible: true }), false);
  assert.equal(exhibitionInteractionPauses({ ...idle, focusInside: true, focusVisible: false }), false);
  assert.equal(exhibitionCanRun({ ...ready, focusInside: true, focusVisible: false }), true);
  // A stale focus-visible flag without focus inside can never hold the exhibition.
  assert.equal(exhibitionInteractionPauses({ ...idle, focusInside: false, focusVisible: true }), false);
});

test("explicit pause, reduced motion, Save-Data, a hidden tab and an offscreen stage never run", () => {
  assert.equal(exhibitionCanRun(ready), true);
  for (const key of ["paused", "hidden", "reduced", "saveData"]) assert.equal(exhibitionCanRun({ ...ready, [key]: true }), false, key);
  assert.equal(exhibitionCanRun({ ...ready, visible: false }), false);
});

test("compositions cycle deterministically and never repeat twice in a row", () => {
  assert.deepEqual([0, 1, 2, 3, 4, 5].map(exhibitionComposition), ["a", "b", "c", "a", "b", "c"]);
  for (let step = 0; step < 300; step++) {
    assert.equal(exhibitionComposition(step), exhibitionComposition(step));
    assert.notEqual(exhibitionComposition(step), exhibitionComposition(step + 1));
    assert.ok(["a", "b", "c"].includes(exhibitionComposition(step)));
  }
});

test("every real change advances the composition; a no-op previous keeps the frame", () => {
  const start = { timeline: { sequence: createExhibitionBag(19, random(7)), cursor: 0, previous: null }, step: 0 };
  assert.equal(advanceExhibition(start, -1, 19, random(1)), start);
  let show = start;
  const directions = [1, 1, -1, 1, -1, -1, 1, 1, 1, -1];
  for (const [index, direction] of directions.entries()) {
    const next = advanceExhibition(show, direction, 19, random(index + 3));
    assert.equal(next.step, show.step + 1);
    assert.notEqual(exhibitionComposition(next.step), exhibitionComposition(show.step));
    assert.notEqual(next.timeline.sequence[next.timeline.cursor], show.timeline.sequence[show.timeline.cursor]);
    show = next;
  }
});

test("200 seeded steps never feature the same project twice in a row, including bag boundaries", () => {
  const seeded = random(2026);
  let show = { timeline: { sequence: createExhibitionBag(19, seeded), cursor: 0, previous: null }, step: 0 };
  const seen = new Set();
  for (let i = 0; i < 200; i++) {
    const current = show.timeline.sequence[show.timeline.cursor];
    seen.add(current);
    show = advanceExhibition(show, 1, 19, seeded);
    assert.notEqual(show.timeline.sequence[show.timeline.cursor], current, `step ${i}`);
    assert.equal(show.timeline.previous, current);
    assert.equal(show.step, i + 1);
  }
  assert.equal(seen.size, 19);
  for (let i = 1; i < show.timeline.sequence.length; i++) assert.notEqual(show.timeline.sequence[i], show.timeline.sequence[i - 1]);
});

test("stepping backwards retraces the visited projects and returning forwards is stable", () => {
  const seeded = random(11);
  let show = { timeline: { sequence: createExhibitionBag(19, seeded), cursor: 0, previous: null }, step: 0 };
  const visited = [show.timeline.sequence[0]];
  for (let i = 0; i < 30; i++) { show = advanceExhibition(show, 1, 19, seeded); visited.push(show.timeline.sequence[show.timeline.cursor]); }
  for (let i = 29; i >= 20; i--) {
    show = advanceExhibition(show, -1, 19, seeded);
    assert.equal(show.timeline.sequence[show.timeline.cursor], visited[i]);
    assert.equal(show.timeline.previous, visited[i + 1]);
  }
  for (let i = 21; i <= 30; i++) {
    show = advanceExhibition(show, 1, 19, seeded);
    assert.equal(show.timeline.sequence[show.timeline.cursor], visited[i]);
  }
});

test("a swipe needs a decisive horizontal gesture and never claims a vertical scroll", () => {
  assert.equal(exhibitionSwipeDirection(-80, 6), 1);
  assert.equal(exhibitionSwipeDirection(80, -10), -1);
  assert.equal(exhibitionSwipeDirection(-20, 0), 0);
  assert.equal(exhibitionSwipeDirection(-70, 90), 0);
  assert.equal(exhibitionSwipeDirection(60, 55), 0);
  assert.equal(exhibitionSwipeDirection(0, -200), 0);
});

test("featuring a layered frame jumps to exactly the previewed project", () => {
  const seeded = random(4);
  let show = { timeline: { sequence: createExhibitionBag(19, seeded), cursor: 0, previous: null }, step: 0 };
  for (let i = 0; i < 60; i++) {
    const offset = (i % 2) + 1;
    const current = show.timeline.sequence[show.timeline.cursor];
    const [predicted] = upcomingExhibition(show.timeline, 2).slice(offset - 1);
    const next = jumpExhibition(show, offset, 19, seeded);
    assert.equal(next.timeline.sequence[next.timeline.cursor], predicted);
    assert.equal(next.timeline.previous, current);
    assert.notEqual(predicted, current);
    assert.equal(next.step, show.step + 1);
    show = next;
  }
  assert.equal(jumpExhibition(show, 0, 19, seeded), show);
});

test("previous at the first visited project is a no-op and next keeps the expected destination", () => {
  const initial = { sequence: Array.from({ length: 19 }, (_, index) => index), cursor: 0, previous: null };
  const previous = stepExhibition(initial, -1, 19, random(15));
  assert.deepEqual(previous, initial);
  const next = stepExhibition(previous, 1, 19, random(15));
  assert.equal(next.sequence[next.cursor], 1);
});

test("the live component uses V3 sequence, interaction and swipe policies rather than a section-wide hover lock", async () => {
  const { readFile } = await import("node:fs/promises");
  const component = await readFile(new URL("../app/components/cinematic/ProjectExhibition.tsx", import.meta.url), "utf8");
  assert.match(component, /exhibitionComposition\(show\.step\)/);
  assert.match(component, /advanceExhibition\(current/);
  assert.match(component, /exhibitionSwipeDirection\(/);
  assert.match(component, /pointerOverInteractive/);
  assert.match(component, /focusVisible/);
  assert.doesNotMatch(component, /setHovered\(true\)|setFocused\(true\)/);
});

test("pending foregrounds cannot retain another project's image and have a bounded failure fallback", async () => {
  const { readFile } = await import("node:fs/promises");
  const component = await readFile(new URL("../app/components/cinematic/ProjectExhibition.tsx", import.meta.url), "utf8");
  assert.match(component, /const imageReady = loaded\.has\(active\.slug\)/);
  assert.match(component, /imageReady && previous/);
  assert.match(component, /previewDeadline/);
  assert.match(component, /Loading project preview/);
  assert.match(component, /onError=\{/);
});

test("desktop stage reserves the complete foreground geometry plus maximum depth offset", async () => {
  const { readFile } = await import("node:fs/promises");
  const css = await readFile(new URL("../app/styles/project-exhibition.css", import.meta.url), "utf8");
  const stage = css.match(/\.exhibition-stage\s*\{([^}]+)\}/)?.[1] ?? "";
  assert.match(stage, /aspect-ratio:\s*2\s*\/\s*1/);
  assert.match(stage, /padding-bottom:\s*50px/);
  assert.doesNotMatch(stage, /710px|height:\s*clamp/);
});
