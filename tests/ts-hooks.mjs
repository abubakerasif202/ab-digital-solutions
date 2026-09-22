// Node module resolution hooks for behavior tests that import TypeScript
// sources directly. Next.js resolves extensionless relative imports at build
// time; Node does not, so append ".ts" for relative specifiers that have no
// extension. Bare package subpaths like "next/server" lack an exports map and
// need the literal file name (".js") under Node ESM.
const hasExtension = /\/[^/]+\.[^/.]+$/;

export async function resolve(specifier, context, nextResolve) {
  if ((specifier.startsWith("./") || specifier.startsWith("../")) && !hasExtension.test(specifier)) {
    try {
      return await nextResolve(`${specifier}.ts`, context);
    } catch {
      // Fall through to default resolution below.
    }
  }
  try {
    return await nextResolve(specifier, context);
  } catch (error) {
    if (error && error.code === "ERR_MODULE_NOT_FOUND" && !hasExtension.test(specifier)) {
      return nextResolve(`${specifier}.js`, context);
    }
    throw error;
  }
}
