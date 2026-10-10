import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import ts from "typescript";

test("strict CSP diagnostics are opt-in and never replace the enforced policy", async () => {
  const originalEnvironment = { NODE_ENV: process.env.NODE_ENV, CSP_REPORT_ONLY: process.env.CSP_REPORT_ONLY };
  const source = await readFile(new URL("../next.config.ts", import.meta.url), "utf8");
  const compiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  try {
    for (const [mode, enabled, expected] of [
      ["production", "true", true],
      ["production", "false", false],
      ["development", "true", false],
    ]) {
      process.env.NODE_ENV = mode;
      process.env.CSP_REPORT_ONLY = enabled;
      const { default: config } = await import(`data:text/javascript;base64,${Buffer.from(compiled).toString("base64")}#${mode}-${enabled}`);
      const [{ headers }] = await config.headers();
      const enforced = headers.find(({ key }) => key === "Content-Security-Policy");
      const diagnostic = headers.find(({ key }) => key === "Content-Security-Policy-Report-Only");
      assert.ok(enforced.value.includes("'unsafe-inline'"));
      assert.equal(Boolean(diagnostic), expected);
      if (diagnostic) {
        assert.match(diagnostic.value, /script-src 'self'(?: [^;]*)?;/);
        assert.doesNotMatch(diagnostic.value.match(/script-src [^;]+/)[0], /unsafe-inline|unsafe-eval/);
      }
      assert.equal(config.poweredByHeader, false);
    }
  } finally {
    for (const [name, value] of Object.entries(originalEnvironment)) {
      if (value === undefined) delete process.env[name];
      else process.env[name] = value;
    }
  }
});
