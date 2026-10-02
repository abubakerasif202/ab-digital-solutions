# Cinematic portfolio browser checks

Run against the local production server after `npm run build`:

```powershell
npm run start -- --port 3100
# In another PowerShell terminal:
node scripts/cinematic-browser-qa.mjs
```

The runner uses the installed Puppeteer dependency. Set `QA_BASE_URL` to change the local origin or `QA_OUTPUT` to change the artifact directory. The default output is the ignored `test-results/cinematic/` directory. `report.json` records individual assertions and failures; a failed assertion sets a nonzero exit code.

Coverage includes seven responsive viewports, fully rendered document overflow, desktop/mobile section screenshots, canonical portfolio preservation, all project detail routes and live links, sample service and privacy metadata, mobile keyboard focus trapping and Escape, carousel controls, reduced motion, and forced WebGL failure. Scroll-driven and infinite decorative animations do not block screenshot settling.

Contact success and error responses are intercepted in Chromium. The runner does not deliver a contact enquiry or call the contact API server. The error test deliberately mocks an HTTP 503 and excludes that expected network console message from runtime error findings.

The local runner supplies an empty JavaScript response for `/_vercel/speed-insights/script.js`, because that Vercel edge endpoint is unavailable on a standalone Next.js server. Analytics remains in the application; real tracking delivery requires deployed verification. Other script and resource failures remain failures.

Screenshot review remains a manual gate: inspect typography, section rhythm, clipping, media composition and contact layout. These assertions verify functional browser behavior; they do not constitute Lighthouse or production deployment verification.

The final local production-build run passed **51 assertions, 0 failures**. Artifacts include seven full-page responsive captures, sixteen major-section captures, thirty-four centered project/capability viewport captures, an open mobile menu, a full-page reduced-motion capture, the forced WebGL fallback, and desktop/mobile work index and case-study pages. Centered card captures and reduced-motion full-page output make scroll-timeline content reviewable without disabling supported motion behavior.
