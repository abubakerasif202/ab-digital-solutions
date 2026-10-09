# Release configuration verification — 9 October 2026

Read-only source and production environment-name review; no configuration changes, credential retrieval, real enquiries or deployment.

## Verified inventory and mocked behaviour

- Canonical module imports confirm **14 projects and six service pages**.
- `node --experimental-strip-types --import ./tests/register-ts-hooks.mjs --test tests/contact-route.test.mjs tests/analytics-route.test.mjs tests/project-destinations.test.mjs`: **20 passed, zero failed**.
- Tests verify `Under $1,500` and custom software choices reach the mocked email body; malformed/oversized/invalid/cross-origin requests are rejected; honeypot submissions send nothing; limits and delivery failures behave correctly.
- `ContactForm` dispatches the lead event only after a successful HTTP response and only with an empty honeypot. Failed submissions preserve input. The synchronous submission ref prevents concurrent sends; browser flow validation is recorded in the main production audit.
- Analytics accepts the dedicated `project_enquiry` event without forwarding enquiry email/message, uses a single first-party beacon/fetch path, honours Do Not Track/Global Privacy Control, and remains inert when ClickHouse is unconfigured.

## Dependency review

`@tabler/icons` 3.49.0 is a pre-existing package/lockfile addition. Exact tracked search found no `@tabler/icons` import in application source, scripts, tests or runtime configuration. Other broad matches were unrelated `TableRow` references in skill documentation. A current application requirement is therefore **not established**. Preserve the unrelated dependency change; it is not imported into application bundles. Its eventual retention/removal should be handled separately by the owner of that change.

## Production configuration evidence

Read-only Vercel CLI environment listing identified the existing `abubakerasif202s-projects/ab-digital-solutions` project. Only configuration presence/scopes are relevant to this report; secret values were neither retrieved nor saved.

| Environment name | Listed scope | Meaning |
|---|---|---|
| `RESEND_API_KEY` | Production | Present; validity and domain authorisation not tested |
| `CONTACT_FROM_EMAIL` | Production, Preview, Development | Sender override present |
| `NEXT_PUBLIC_CONTACT_EMAIL` | Production, Preview, Development | Public mailbox override present |
| `CONTACT_TO_EMAIL` | Production, Preview, Development | Recipient override present |
| `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` | Not listed | Distributed rate limiting currently unconfigured |
| `CLICKHOUSE_URL`, `CLICKHOUSE_USER`, `CLICKHOUSE_PASSWORD` | Not listed | Optional first-party analytics persistence currently unconfigured |

Presence does not prove delivery or credential validity. The CLI listing does not establish Resend account/domain status. No real mail was sent. Resend is not listed for Preview/Development, so those environments cannot deliver unless separately configured; use mocks or a deliberately isolated test recipient.

## Required release actions and limits

1. Verify the existing Resend API key permits sending from the configured, verified domain and that the configured recipient mailbox works. This remains external evidence; no mailbox switch is justified.
2. Configure both Upstash REST variables in Production to obtain a shared five-enquiry-per-ten-minute client-IP limit. Without them, production uses a logged per-instance fallback; limits multiply across serverless instances. Store failures also fall back. This is a production spam-control limitation, not a failed mocked test.
3. If analytics persistence is required, configure the three server-only ClickHouse credentials and confirm a compatible table. Optional database/table overrides default to `default.web_events` and require SQL identifiers. The table must support `project_enquiry` as an event value plus existing metric columns; `scripts/clickhouse-init.mjs` documents the schema and 180-day retention. Do not run that mutating setup against production without approval. Without configuration, analytics responds 204 while intentionally storing nothing.
4. `CSP_REPORT_ONLY=true` remains optional and build-time, with browser-console diagnostics rather than a report collector. Do not move it into enforcement without compatibility validation.

Recommendation from this bounded review: **GO for code review after full build/browser/performance validation; conditional NO-GO for claiming a fully verified production lead pipeline or conversion reporting** until Resend delivery/domain evidence and the required operational configuration are supplied. Missing optional analytics is not a site-rendering blocker; release with it disabled must be explicit. Performance and final browser evidence belong in the main production audit.

## Final browser verification

The final production build on local port 3100 passed all **156 route/width checks** (26 routes at 360, 390, 768, 1024, 1440 and 1920px). The initial complete run recorded 206/211 assertions passed; retain `report.json` for diagnostic transparency. Two Work contrast findings occurred on offscreen low-opacity reveal content; naturally visible, settled rechecks at 390/1440px found zero axe violations. Two initial beacon checks failed because Puppeteer's synchronous `postData()` omitted Blob bodies; awaited CDP `fetchPostData()` verified genuine outgoing payloads. The final diagnostic was the expected forced-WebGL-failure message with a duplicate renderer prefix; the allowlist permits only that exact diagnostic in the forced-failure scenario.

The corrected, affected supplementary suite passed **41/41** assertions (`report-supplement.json`). It verifies native required-field errors and focus, associated error descriptions, under-$1,500 selection, disabled/loading state, duplicate protection, failed-submission input preservation, exactly one genuine `project_enquiry` analytics request after success and none after failure, mobile keyboard navigation/Escape, reduced motion, no-JavaScript contact access, desktop WebGL rendering, context-loss fallback and forced WebGL failure. No real enquiry or analytics writes occurred; all endpoints were intercepted. No unexpected page, console, network or HTTP errors occurred, including separately monitored WebGL pages.

Focused project reveal ancestors at 390/1440px were visible with opacity 1 and no blur, transform or animation (**2/2**, `report-focus-final.json`). The 14 other initial representative axe checks were clean; the two visible Work rechecks complete the final representative coverage. Automated checks do not certify full WCAG conformance. Prior reports/screenshots are archived under `test-results/production-audit/previous-pass`; final screenshots use the existing 390/1440 filenames. Targeted harness ESLint passed and the corrected script received independent read-only review.
