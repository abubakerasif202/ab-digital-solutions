# Security audit — 9 October 2026

## Verified findings

- Live HTTPS homepage sends enforced CSP, HSTS, `nosniff`, frame restrictions, referrer and permissions policies. Production CSP excludes `unsafe-eval`, but permits inline scripts/styles. This is a real limitation of the existing policy, not evidence of an injection vulnerability.
- `poweredByHeader: false` already removes the application `X-Powered-By` header. Live responses still disclose Vercel and rendering/cache details through platform headers. These are fingerprints, not authentication bypasses; platform header removal needs hosting support and is not attempted here.
- `npm audit --omit=dev --json` reports zero production vulnerabilities. Full `npm audit --json` reports five high-severity dependency entries in the development-only ESLint chain: `eslint-config-next` → `@next/eslint-plugin-next` → `fast-glob` → `micromatch` → `braces`. The underlying advisory is GHSA-vfj7-8cjw-p6xm (deeply nested pattern stack exhaustion). Do not run lint against untrusted attacker-supplied projects/patterns. The automatic suggestion downgrades Next's ESLint config to 14.2.35, so it is unsuitable for this Next 16 project. Existing modified dependency files were preserved.

## Scanner findings that do not reproduce as claimed

- Google DNS-over-HTTPS query `https://dns.google/resolve?name=abwebstudio.com.au&type=CAA` returns existing CAA issuer authorizations for `pki.goog`, `sectigo.com`, and `letsencrypt.org`. Missing CAA is a false positive at the audit date. No DNS change is needed or made.
- Homepage cached public HTML has `Access-Control-Allow-Origin: *`, but a live `OPTIONS /api/contact` request with `Origin: https://example.com` returns no ACAO header. No repository CORS wildcard was found. Public HTML readability does not demonstrate sensitive endpoint CORS exposure. Contact POST additionally validates origin server-side. No real enquiry was sent.

## CSP improvement and remaining work

Set server-only `CSP_REPORT_ONLY=true` at build time to add an opt-in production `Content-Security-Policy-Report-Only` policy that excludes inline scripts. It preserves the existing enforced CSP and static rendering. Browser console violations identify Next hydration scripts and integrations that need nonces or hashes before enforcement. This diagnostic policy deliberately has no report collector: it sends no page/referrer information to a third party, and no backend collection is implied.

Do not copy this report-only policy into enforcement: current App Router pages require inline hydration scripts. The installed Next guide (`node_modules/next/dist/docs/01-app/02-guides/content-security-policy.md`) requires dynamic rendering for request-specific nonces. Its SRI alternative is experimental and webpack-only, whereas this project builds with Turbopack. A strict enforced migration needs a separately measured rendering/caching decision and framework-script compatibility testing. Style inline allowances also require auditing React style attributes and animations before removal.

DNS/hosting changes, an external CSP reporting collector, dependency upgrades and an enforced nonce migration require a separate reviewed change. No production infrastructure, keys, mailboxes or deployment was modified.
