AB virtual studio: implementation contract (29 October 2026)

User delegated design choices and approved React Three Fiber/Drei.
Preserve existing routes, homepage sections, typography, project registry,
contact form/API, analytics and SEO. Add a separate static /studio page and
an intent-loaded client experience. Only homepage change: a static preview.

Original cutaway loft: Reception southwest, Gallery northwest, Services
northeast, Consultation southeast. Obsidian marble, brass reveals, ruby
upholstery, warm light shafts, glass dividers, low-poly original AB sculpture.
Use procedural architecture and a small reproducibly generated GLB monogram.
No downloaded models, remote fonts in canvas, HDRIs or postprocessing.

Deliver in sequence:
1. Interaction reducer and focused behavior tests.
2. Static SEO route, existing-content panels, bounded client loading/error flow.
3. Modular scene, GLB, camera rig, orbit/touch controls and HTML hotspots.
4. Homepage preview, sitemap and original fallback artwork.
5. Lint/type/tests/build, Playwright responsive/fallback/keyboard/touch/contact
   checks, repeatable cold-cache performance samples and screenshots.
6. Review diff and document provenance, controls, evidence and limitations.

Render on demand at DPR <= 1.5 desktop / 1 mobile, no real-time shadows or
postprocessing. Stop intro/tour on manual input; pause when hidden/offscreen.
Fall back for reduced motion, save-data/2g, errors and context loss. Page
content and navigation stay available without JS, GPU or contact credentials.
No new contact endpoint. Test delivery with local interception, never live leads.
No commit, push or deployment is authorised.

Release authorization: after local verification and delivery, the owner explicitly
requested push, merge and deploy. Release uses the existing GitHub/Vercel project.
