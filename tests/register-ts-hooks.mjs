// Registers the TypeScript resolution hooks for the test process. Loaded via
// `node --import` from scripts/run-tests.mjs so it applies to every test file.
import { register } from "node:module";

register("./ts-hooks.mjs", import.meta.url);
