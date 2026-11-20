import assert from "node:assert/strict";
import test from "node:test";
import { startPointerFX } from "../app/components/pointer-fx.ts";
import { whenIdle } from "../app/lib/when-idle.ts";

function fakeTarget() {
  const listeners = [];
  return {
    listeners,
    addEventListener(type, fn, options) { listeners.push({ type, fn, options }); },
    removeEventListener(type, fn) { const i = listeners.findIndex((l) => l.type === type && l.fn === fn); if (i >= 0) listeners.splice(i, 1); },
  };
}
function fakeQuery(matches) {
  const target = fakeTarget();
  return Object.assign(target, { matches, set(next) { this.matches = next; [...target.listeners].filter((l) => l.type === "change").forEach((l) => l.fn()); } });
}
function setup({ fine, reduced = false }) {
  const win = fakeTarget();
  const doc = Object.assign(fakeTarget(), { hidden: false });
  const queries = { fine: fakeQuery(fine), reduced: fakeQuery(reduced) };
  win.matchMedia = (q) => (q.includes("reduced-motion") ? queries.reduced : queries.fine);
  globalThis.window = win;
  globalThis.document = doc;
  globalThis.cancelAnimationFrame = () => {};
  const pointerListeners = () => [...win.listeners, ...doc.listeners].map((l) => l.type);
  return { win, doc, queries, pointerListeners };
}
const teardown = () => { delete globalThis.window; delete globalThis.document; delete globalThis.cancelAnimationFrame; };

test("PointerFX attaches no pointer, blur or visibility listeners on coarse pointers", () => {
  const env = setup({ fine: false });
  const stop = startPointerFX();
  assert.deepEqual(env.pointerListeners(), [], "touch devices get nothing attached");
  assert.equal(env.queries.fine.listeners.length, 1, "still watches for a mouse being connected");
  stop();
  assert.equal(env.queries.fine.listeners.length, 0);
  teardown();
});

test("PointerFX is unchanged on fine pointers: passive pointermove/pointerout plus visibility and blur resets", () => {
  const env = setup({ fine: true });
  const stop = startPointerFX();
  assert.deepEqual(env.pointerListeners().sort(), ["blur", "pointermove", "pointerout", "visibilitychange"]);
  const move = env.win.listeners.find((l) => l.type === "pointermove");
  assert.deepEqual(move.options, { passive: true });
  stop();
  assert.deepEqual(env.pointerListeners(), [], "cleanup removes everything");
  teardown();
});

test("PointerFX follows the pointer and motion media queries without leaking listeners", () => {
  const env = setup({ fine: false });
  const stop = startPointerFX();
  env.queries.fine.set(true);
  assert.equal(env.pointerListeners().length, 4);
  env.queries.fine.set(true);
  assert.equal(env.pointerListeners().length, 4, "re-evaluating does not double attach");
  env.queries.reduced.set(true);
  assert.deepEqual(env.pointerListeners(), [], "reduced motion detaches");
  env.queries.reduced.set(false);
  assert.equal(env.pointerListeners().length, 4);
  env.queries.fine.set(false);
  assert.deepEqual(env.pointerListeners(), []);
  stop();
  teardown();
});

test("whenIdle uses requestIdleCallback with a timeout, falls back to a short timer, and cancels", () => {
  const calls = [];
  const idleHost = {
    requestIdleCallback: (fn, options) => { calls.push(["ric", options.timeout]); return 7; },
    cancelIdleCallback: (h) => calls.push(["cancel", h]),
    setTimeout: () => assert.fail("timer unused"), clearTimeout: () => assert.fail("timer unused"),
  };
  whenIdle(() => {}, 1500, idleHost)();
  assert.deepEqual(calls, [["ric", 1500], ["cancel", 7]]);

  const timers = [];
  const safari = { setTimeout: (fn, ms) => { timers.push(ms); return 3; }, clearTimeout: (h) => timers.push(`clear ${h}`) };
  whenIdle(() => {}, 1500, safari)();
  assert.deepEqual(timers, [200, "clear 3"]);
});
