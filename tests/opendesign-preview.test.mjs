// Guards for the noindex OpenDesign preview route (app/preview/opendesign).
// Browser behaviour is covered by tests/e2e/opendesign-preview.spec.mjs.
import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import ts from "typescript";

const root = fileURLToPath(new URL("../", import.meta.url));
const read = (relative) => readFile(path.join(root, relative), "utf8");

async function walk(dir) {
  const entries = await readdir(path.join(root, dir), { withFileTypes: true });
  const files = await Promise.all(entries.map((entry) => {
    const relative = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(relative) : [relative];
  }));
  return files.flat();
}

test("preview page is noindex, self-canonical and not served on Vercel production", async () => {
  const page = await read("app/preview/opendesign/page.tsx");
  assert.match(page, /robots: \{\s*index: false,\s*follow: false/);
  assert.match(page, /googleBot: \{ index: false, follow: false/);
  assert.match(page, /canonical: "\/preview\/opendesign"/);
  assert.match(page, /process\.env\.VERCEL_ENV === "production"\) notFound\(\)/);
});

test("preview routes carry an X-Robots-Tag header from next.config.ts", async () => {
  const source = await read("next.config.ts");
  const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText;
  const { default: config } = await import(`data:text/javascript;base64,${Buffer.from(compiled).toString("base64")}#preview-headers`);
  const rules = await config.headers();
  const preview = rules.find((rule) => rule.source === "/preview/:path*");
  assert.ok(preview, "a header rule for /preview/:path*");
  const tag = preview.headers.find((header) => header.key === "X-Robots-Tag");
  assert.match(tag.value, /noindex/);
  assert.match(tag.value, /nofollow/);
  // The site-wide security headers must remain the first rule.
  assert.equal(rules[0].source, "/(.*)");
});

test("nothing outside the preview references it: not the sitemap, robots, llms.txt, nav or footer", async () => {
  const { default: sitemap } = await import("../app/sitemap.ts");
  assert.ok(sitemap().every((entry) => !entry.url.includes("preview")));
  const files = (await walk("app")).filter((file) => /\.(ts|tsx)$/.test(file) && !file.startsWith(path.join("app", "preview")));
  for (const file of files) assert.doesNotMatch(await read(file), /\/preview\/opendesign|preview\/opendesign/, `${file} must not link to the preview`);
  assert.doesNotMatch(await read("public/llms.txt"), /preview/i);
});

test("the live homepage and existing hero behaviour are unchanged by the preview", async () => {
  const [page, home, experience, canvas] = await Promise.all([
    read("app/page.tsx"), read("app/agency-home.tsx"), read("app/components/Hero3DExperience.tsx"), read("app/components/Hero3DCanvas.tsx"),
  ]);
  assert.doesNotMatch(page + home, /preview\/opendesign|opendesign\/|_components\/Preview|\.\/preview/);
  // `fallback` is optional and defaults to the approved artwork, so existing callers are unaffected.
  assert.match(experience, /fallback \?\? <HeroFallback \/>/);
  assert.match(canvas, /fallback \?\? <HeroFallback \/>/);
  assert.match(experience, /export function Hero3DExperience\(\{ fallback \}: \{ fallback\?: ReactNode \} = \{\}\)/);
});

test("preview CSS is scoped: every rule sits under .odp and no global token is overridden", async () => {
  const css = (await read("app/preview/opendesign/preview.css")).replace(/\/\*[\s\S]*?\*\//g, "");
  const preludes = [...css.matchAll(/([^{}]+)\{/g)].map(([, prelude]) => prelude.trim());
  assert.ok(preludes.length > 40);
  for (const prelude of preludes) {
    if (prelude.startsWith("@") || /^(from|to|\d+%)$/.test(prelude)) continue;
    for (const selector of prelude.split(",")) assert.match(selector.trim(), /^\.odp\b/, `unscoped selector: ${selector.trim()}`);
  }
  assert.doesNotMatch(css, /^\s*:root|^\s*html|^\s*body/m);
});

test("the preview reuses existing components and contains no second form or fetch implementation", async () => {
  const page = await read("app/preview/opendesign/page.tsx");
  for (const reused of ["ContactForm", "EnquirySection", "SiteHeader", "SiteFooter", "Hero3DExperience", "ProjectArtwork", "VirtualStudioPreview"]) {
    assert.match(page, new RegExp(`import \\{[^}]*\\b${reused}\\b[^}]*\\} from`), `${reused} is imported, not re-implemented`);
  }
  assert.match(page, /from "\.\.\/\.\.\/project-data"/);
  const sources = await Promise.all((await walk("app/preview/opendesign")).filter((file) => /\.tsx?$/.test(file)).map(read));
  for (const source of sources) assert.doesNotMatch(source, /fetch\(|\/api\/contact|<form\b/);
});

test("a project is only labelled live when the dated link check reached it", async () => {
  const page = await read("app/preview/opendesign/page.tsx");
  assert.match(page, /label === "Live website" && !liveUrls\.has\(project\.url\) \? "Case study" : label/);
  assert.match(page, /entry\.status === 200 \|\| \("ownerConfirmedLive" in entry/);
  const check = JSON.parse(await read("opendesign/luxury-homepage/link-check.json"));
  const trailers = check.results.find((entry) => entry.url === "https://oncalltrailers.com.au/");
  // Owner-reported, not independently verified: the evidence must say so.
  assert.equal(trailers.status, 0);
  assert.equal(trailers.ownerConfirmedLive, true);
  assert.match(trailers.note, /NOT independently verified/);
  assert.match(trailers.note, /Domain Parked With VentraIP/);
});
