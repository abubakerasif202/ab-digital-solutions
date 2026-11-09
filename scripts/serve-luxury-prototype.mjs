// Serves the standalone luxury-homepage prototype for review and Playwright tests.
//   /            -> opendesign/luxury-homepage/
//   /site/...    -> public/site/... (the same asset paths the Next app serves)
//   POST /api/contact -> 503, because the prototype has no mail delivery. This mirrors
//   the live route's preview-deployment response, so the form shows an honest failure.
//
// Run: npm run opendesign:serve   (PORT=4173 by default)
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = fileURLToPath(new URL("../", import.meta.url));
const roots = [path.join(root, "opendesign", "luxury-homepage"), path.join(root, "public")];
const types = {
  ".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8", ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8", ".woff2": "font/woff2", ".webp": "image/webp", ".jpg": "image/jpeg",
  ".png": "image/png", ".svg": "image/svg+xml",
};

async function resolveFile(urlPath) {
  const relative = decodeURIComponent(urlPath === "/" ? "/index.html" : urlPath);
  for (const base of roots) {
    const file = path.join(base, relative);
    // Refuse anything that escapes the served directory.
    if (!file.startsWith(base + path.sep)) continue;
    try { return { file, body: await readFile(file) }; } catch { /* try the next root */ }
  }
  return null;
}

export function startServer(port = 0) {
  const server = createServer(async (request, response) => {
    const { pathname } = new URL(request.url ?? "/", "http://localhost");
    if (pathname === "/api/contact" && request.method === "POST") {
      request.resume();
      response.writeHead(503, { "Content-Type": "application/json" });
      response.end(JSON.stringify({ error: "Enquiry submissions are disabled on the standalone prototype. Nothing was sent.", code: "preview-disabled" }));
      return;
    }
    const found = request.method === "GET" || request.method === "HEAD" ? await resolveFile(pathname).catch(() => null) : null;
    if (!found) {
      response.writeHead(404, { "Content-Type": "text/plain" });
      response.end("Not found");
      return;
    }
    response.writeHead(200, {
      "Content-Type": types[path.extname(found.file)] ?? "application/octet-stream",
      "Content-Length": found.body.length,
      "Cache-Control": "no-store",
    });
    response.end(found.body);
  });
  return new Promise((resolve) => {
    server.listen(port, "127.0.0.1", () => resolve({ server, url: `http://127.0.0.1:${server.address().port}` }));
  });
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const { url } = await startServer(Number(process.env.PORT) || 4173);
  console.log(`Luxury homepage prototype: ${url}`);
}
