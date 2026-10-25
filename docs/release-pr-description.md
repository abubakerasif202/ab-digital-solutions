## Change

Complete the existing AB Web Studio improvements and add owner-approved Fresh Stop as portfolio project #16 at its published custom domain. Preserve the premium design, authentic AB artwork and optional WebGL presentation. Improve mobile navigation, reduced motion, portfolio classifications, contact acceptance checks and metadata.

Fresh Stop uses a genuine 1348 × 926 website capture. Its case study describes catalogue browsing, indicative prices, cart-based enquiries and wholesale/home-delivery contact pathways. Its Next.js, React, TypeScript, Tailwind CSS, Prisma and PostgreSQL stack is verified against source. No live payment, confirmed-order or inventory-synchronisation capability is claimed.

## Validation

Clean Node 22 checkout at `6a9667c`: `npm ci`, `npm run verify` and `npm run build` pass, including 75 tests and 36 build outputs. Production dependency audit reports zero vulnerabilities. The five development audit entries remain in the unpatched braces/Next ESLint chain; no forced downgrade was applied.

Browser coverage passes 168 route/width checks, 16 representative axe audits and the 39-assertion interaction suite. After the contact fix, the affected routes pass 55 assertions and the header/contact regression passes 12 checks; Fresh Stop passes its separate 41-check suite on the final build. Local cold-browser-cache median LCP is 0.872s at 390px and 0.912s at 1440px, with zero observed unexpected layout shift; these are lab samples rather than production CWV. A focused QA fix waits for rendered image completion and allows an external output directory. A visually confirmed desktop contact-email wrap is corrected using the existing stacked contact pattern in narrow columns, with six-width line-count regression coverage. Assets, portfolio data and dependency files are preserved. Prior implementation evidence and responsive screenshots are committed in `docs/studio-rebuild-qa.md`, `docs/fresh-stop-portfolio-qa.md` and their linked evidence directories.

## Release gates

Correct `NEXT_PUBLIC_CONTACT_EMAIL` to `enquiry@abwebstudio.com.au`; both it and the current form-recipient override differ from that address. Confirm the actual mailbox/recipient with the owner. Configure a dedicated shared Upstash Redis REST endpoint/write-capable token in Production. Verify the existing AB-domain sender and deployed key in the correct Resend account (connector access is unavailable), then obtain approval for one actual delivery test. Existing public iCloud/SES/DKIM DNS records do not prove inbox delivery or provider verification. Preview delivery remains disabled. Require passing Quality and Vercel Preview checks; main is not currently protected.

Merging this PR triggers Vercel production deployment and requires explicit production authorisation. Use a normal merge commit to retain `6fbcd71`, `2ab41ab`, `0773791` and `6a9667c`. Previous READY production deployment for an authorised rollback: `dpl_9PGNMah9sEn4jNowHhDiiYyznzgk`. The local release readiness report provides the full procedure. No new dependency addition, nested reference tree, secret or temporary QA artifact is part of this release preparation.
