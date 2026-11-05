# Wild Pest Solutions and Pept Up Labs portfolio release

Both projects are registered in `app/project-data.ts`, feeding the homepage showcase, full index, case-study routes and sitemap. Existing project order is preserved. The case-study renderer accepts optional headlines, regions and screenshot proportions. No client technology stack or business outcomes are inferred.

Six WebP screenshots were captured from the published sites. See ASSET-SOURCES.md and the capture scripts for provenance. Browser evidence and local logs stay in this directory.

Validation (Windows Node 22):

```powershell
npm.cmd run build
npm.cmd run start -- --port 3113
$env:QA_BASE_URL="http://localhost:3113"
$env:QA_OUT="qa/wild-pest-solutions/production"
$env:QA_TEST_RESULTS="test-results/wild-pest-production"
node node_modules/@playwright/test/cli.js test tests/e2e/wild-pest-solutions.spec.mjs
node qa/wild-pest-solutions/smoke.mjs
```

The build includes lint, typecheck and the Node test suite. Run existing public-route Playwright coverage with `--grep "existing public routes"` in `tests/e2e/virtual-studio.spec.mjs`, using a separate QA_TEST_RESULTS directory when running concurrently.
