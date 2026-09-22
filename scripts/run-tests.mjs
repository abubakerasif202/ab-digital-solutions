// Resolves test files explicitly before invoking the Node test runner.
//
// A bare `node --test tests/*.test.mjs` relies on the shell to expand the glob,
// which cmd.exe (npm's default shell on Windows) does not do. Passing the
// pattern through instead is not portable either: Node 20 treats arguments as
// paths, while Node 22.6+ treats them as glob patterns, so no single literal
// argument works on both. Explicit file paths are valid input for every
// supported version and shell.
import { readdirSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

const testDir = fileURLToPath(new URL("../tests/", import.meta.url));
const testFiles = readdirSync(testDir)
  .filter((name) => name.endsWith(".test.mjs"))
  .sort()
  .map((name) => path.join("tests", name));

if (testFiles.length === 0) {
  console.error("No test files found in tests/.");
  process.exit(1);
}

// Behavior tests import TypeScript sources directly. Type stripping is enabled
// by default from Node 22.18 / 23.6; earlier 22.x releases need the flag.
const [nodeMajor, nodeMinor] = process.versions.node.split(".").map(Number);
const typeArgs = nodeMajor === 22 && nodeMinor >= 6 ? ["--experimental-strip-types"] : [];

const result = spawnSync(
  process.execPath,
  [...typeArgs, "--import", "./tests/register-ts-hooks.mjs", "--test", ...testFiles],
  {
    stdio: "inherit",
    cwd: fileURLToPath(new URL("../", import.meta.url)),
  },
);

process.exit(result.status ?? 1);
