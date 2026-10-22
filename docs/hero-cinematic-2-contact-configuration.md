# Cinematic Hero 2.0: contact limiter configuration

The contact endpoint allows five requests per visitor per ten minutes. Origin checks, the 12 KB streaming body limit, field validation, honeypot, provider acceptance-ID validation, and preview delivery prohibition remain active.

## Required Vercel configuration

As checked on 23 October 2026, the linked `ab-digital-solutions` Vercel project has neither Redis variable configured. No credentials were invented or copied into this repository.

1. In the intended Upstash Redis database, obtain the REST endpoint and a read/write REST token. A read-only token cannot run INCR or PEXPIRE.
2. Open Vercel → `ab-digital-solutions` → Settings → Environment Variables.
3. Add `UPSTASH_REDIS_REST_URL` with the HTTPS database origin only, without a command path, query or user information.
4. Add `UPSTASH_REDIS_REST_TOKEN` as a sensitive server-only variable. Do not use a `NEXT_PUBLIC_` prefix.
5. Select Production and Preview scopes. Do not add the Resend delivery key to Preview; preview enquiry delivery remains intentionally disabled by code regardless of that key.
6. Redeploy the approved preview commit to apply changed environment variables. Production redeployment and merging remain subject to separate user authorization.
7. Confirm the missing-configuration warning disappears. On a disposable fixture database, confirm five allowed requests followed by HTTP 429 and `Retry-After: 600`. Do not send test enquiries through production Resend.

The shared limiter uses the documented atomic `/multi-exec` REST transaction: INCR plus PEXPIRE with NX. Store responses and HTTPS endpoint shape are validated. Stored IP keys are SHA-256 digests; hashing is pseudonymization, not anonymization. The fallback map is capped at 5,000 active keys, denying additional new buckets at capacity rather than evicting active limits.

## Availability and concurrency limitation

The existing per-instance fallback is deliberately retained to preserve legitimate submissions while credentials are missing or Redis is unavailable. The five-request budget is therefore per process in that state and multiplies across serverless instances. This is explicitly logged; it is not equivalent to a configured shared limiter. The deployment is not claimed to have distributed spam protection until the variables are configured and validated. Existing origin, validation, honeypot and local rate limiting continue to apply.

## Local proof

`tests/contact-route.test.mjs` exercises the real handler with mocked Resend/Redis responses: accepted delivery, origin/validation failures, honeypot, malformed store results, store outages, rejected insecure endpoint, hashed Redis key, atomic command contract, preview refusal and 429 retry headers. The browser QA substitutes contact responses for success/503/429 and never delivers an enquiry.
