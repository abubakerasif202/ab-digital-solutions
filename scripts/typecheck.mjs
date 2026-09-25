import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
// Run package entry points with this Node executable, avoiding shell-specific
// .bin wrappers and a Windows dependency on Bash or WSL.
for (const [entry, args] of [
  ["../node_modules/next/dist/bin/next", ["typegen"]],
  ["../node_modules/typescript/bin/tsc", ["--noEmit"]],
]) {
  const result = spawnSync(process.execPath, [fileURLToPath(new URL(entry, import.meta.url)), ...args], {
    cwd: root,
    stdio: "inherit",
  });
  if (result.error) console.error(result.error.message);
  if (result.status !== 0) process.exit(result.status ?? 1);
}
