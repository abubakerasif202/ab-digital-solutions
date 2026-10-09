# Contact and analytics audit — 9 October 2026

## Verified findings

- Budget choices previously excluded enquiries below $1,500. Added `Under $1,500` as an enquiry range, without advertising a starting price. Retained all prior ranges and added a custom software / business systems service choice. UI and server validation now share the same option registry.
- Contact processing already has same-origin checking, bounded streamed JSON, required fields, length limits, enum validation, a honeypot, server-side Resend delivery, request timeout and Upstash-backed rate limiting with an in-memory fallback. The UI already has native validation, linked error text, an immediate duplicate-submission lock, loading/success/error states, preserved input after failure and telephone/email/name autofill.
- `admin@abwebstudio.com.au` remains the source default. Public mailbox and delivery overrides already exist. No mailbox replacement was made; deliverability cannot be established from source alone.
- GA4/GTM absence does not establish analytics absence: `WebVitals` already sends page views, CTA clicks and vitals to a first-party ClickHouse endpoint. No additional analytics scripts or tracking cookies were introduced.
- Successful contact submission previously had no lead event. Added `project_enquiry` after successful API response only, excluding honeypot-filled submissions. No enquiry contents enter the analytics event.
- WhatsApp clicks, contact CTA navigation and case-study links now receive meaningful labels. Explicit existing data-analytics labels still take precedence so each click produces one event.
- Analytics now respects browser Do Not Track and Global Privacy Control; privacy copy documents first-party measurement, technical browser information and the configured table's 180-day retention.
- Analytics body parsing previously trusted content-length; chunked configured requests now enforce the 4 KB limit during stream consumption.

## External configuration

Email delivery requires `RESEND_API_KEY` and a verified Resend sending domain. `CONTACT_FROM_EMAIL` and `CONTACT_TO_EMAIL` optionally control delivery. `NEXT_PUBLIC_CONTACT_EMAIL` changes visible business contact information and must only be set after mailbox verification. No production credentials or mailbox configuration were inspected and no real enquiries were sent.

Shared serverless rate limiting requires both `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`; without them limits are per instance.

First-party analytics requires `CLICKHOUSE_URL`, `CLICKHOUSE_USER`, `CLICKHOUSE_PASSWORD`; optional `CLICKHOUSE_DATABASE` and `CLICKHOUSE_TABLE` default to `default.web_events`. The existing `npm run clickhouse:init` creates the table (String event_name already supports the added event). This command was not run because it changes external infrastructure. Existing externally created tables should be checked for compatible columns and retention.

`.env.example` also documents optional `CSP_REPORT_ONLY=true` diagnostics. Browser diagnostics must precede any stricter enforcement decision.

## Validation

- `node --import ./tests/register-ts-hooks.mjs --test tests/contact-route.test.mjs`: 14 passed, zero failures. Mocked Resend/Upstash only. Covers delivery, limits, malformed/oversized input, honeypot, missing configuration, starter/custom-software choices, rejected options, cross-origin requests, upstream rejection and network failure.
- `node --import ./tests/register-ts-hooks.mjs --test tests/analytics-route.test.mjs`: 4 passed, zero failures. Mocked ClickHouse only. Covers successful lead event, private-data exclusion, invalid event/cross-origin rejection, disabled configuration and oversized chunked body.
- Targeted ESLint on touched contact/analytics/privacy sources: passed.
- `npm run typecheck`: passed.
- Browser event and contact-flow checks remain part of the primary agent's overall browser QA. Provider acceptance and real mailbox arrival were deliberately not tested.

## Files

`app/contact-options.ts`, `app/components/ContactForm.tsx`, `app/api/contact/route.ts`, `app/lib/contact-analytics.ts`, `app/web-vitals.tsx`, `app/lib/clickhouse.ts`, `app/api/analytics/route.ts`, `app/privacy/page.tsx`, `tests/contact-route.test.mjs`, `tests/analytics-route.test.mjs`, `.env.example`.
