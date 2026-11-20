import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(path, import.meta.url), "utf8");

test("Speed Insights never loads with the first render: it is a separate chunk mounted after load and idle", async () => {
  const [layout, deferred] = await Promise.all([read("../app/layout.tsx"), read("../app/components/DeferredSpeedInsights.tsx")]);
  assert.doesNotMatch(layout, /@vercel\/speed-insights/, "layout must not import the package statically");
  assert.match(layout, /<DeferredSpeedInsights \/>/);
  assert.match(deferred, /dynamic\(\(\) => import\("@vercel\/speed-insights\/next"\)/);
  assert.match(deferred, /ssr: false/);
  assert.match(deferred, /readyState === "complete"/, "waits for the load event");
  assert.match(deferred, /whenIdle\(/, "and for an idle moment");
});
