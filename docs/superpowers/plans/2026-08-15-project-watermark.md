# Project Watermark Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a subtle AB Web Studio logo-and-domain watermark to every completed-project preview while preserving existing image loading, links, carousel behavior, and responsive layouts.

**Architecture:** Keep watermark behavior centralized in `ProjectArtwork`, because every portfolio preview already uses that component. Wrap the existing fill image in a positioned artwork layer, render an aria-hidden brand overlay using the existing local `ab-logo-mark.png`, and add narrowly scoped global CSS for sizing, contrast, pointer-event isolation, and mobile reduction.

**Tech Stack:** Next.js 16, React 19, TypeScript 5.9, CSS, Node.js built-in test runner.

## Global Constraints

- Position: bottom-right corner of the project preview.
- Content: AB Web Studio branding plus `abwebstudio.com.au`.
- Opacity: subtle, approximately 55–65% depending on final CSS treatment.
- Scale: compact on desktop and reduced further on small screens.
- Contrast: light/gold treatment with a minimal shadow or backdrop only when needed for legibility.
- Interaction: `pointer-events: none`; watermark must never block project links or controls.
- Accessibility: decorative branding should not add noisy screen-reader output.
- Do not burn the watermark into image files.
- Do not add animation to the watermark.
- Do not redesign project cards or carousel behavior.
- Preserve existing image sizing, lazy loading, priority loading, and responsive `sizes` behavior.

---

### Task 1: Shared Project Artwork Watermark

**Files:**
- Modify: `tests/rendered-html.test.mjs`
- Modify: `app/project-artwork.tsx`
- Modify: `app/globals.css`

**Interfaces:**
- Consumes: existing `ProjectArtwork({ project, sizes, priority })` API and `assetBase` from `app/site-config.ts`.
- Produces: unchanged `ProjectArtwork` public props plus `.project-artwork` and `.project-artwork-watermark` presentation hooks used only by the shared component.

- [ ] **Step 1: Write the failing regression test**

Extend the existing `every project ships a real preview image and routes visitors through a case study` test so it reads `app/globals.css` and verifies the centralized watermark markup and interaction-safe styling:

```js
const [projects, homepage, artwork, workPage, caseStudy, styles] = await Promise.all([
  read("../app/project-data.ts"),
  read("../app/agency-home.tsx"),
  read("../app/project-artwork.tsx"),
  read("../app/work/page.tsx"),
  read("../app/work/[slug]/page.tsx"),
  read("../app/globals.css"),
]);

assert.match(artwork, /className="project-artwork"/);
assert.match(artwork, /className="project-artwork-watermark"/);
assert.match(artwork, /ab-logo-mark\.png/);
assert.match(artwork, /abwebstudio\.com\.au/);
assert.match(artwork, /aria-hidden="true"/);
assert.match(styles, /\.project-artwork-watermark\s*\{[\s\S]*?pointer-events: none;[\s\S]*?opacity: 0\.62;/);
assert.match(styles, /@media \(max-width: 720px\)[\s\S]*?\.project-artwork-watermark/);
```

- [ ] **Step 2: Run the test and verify it fails**

Run:

```bash
npm test
```

Expected: FAIL because `ProjectArtwork` does not yet render `.project-artwork`, `.project-artwork-watermark`, the logo/domain, or corresponding watermark CSS.

- [ ] **Step 3: Implement the centralized artwork wrapper and watermark**

Replace the single-image return in `app/project-artwork.tsx` with the following structure while preserving the existing image props:

```tsx
import Image from "next/image";
import type { Project } from "./project-data";
import { assetBase } from "./site-config";

type Props = {
  project: Project;
  sizes: string;
  priority?: boolean;
};

export function ProjectArtwork({ project, sizes, priority = false }: Props) {
  return (
    <div className="project-artwork">
      <Image
        src={project.image}
        alt={project.alt}
        fill
        priority={priority}
        loading={priority ? undefined : "lazy"}
        sizes={sizes}
      />
      <span className="project-artwork-watermark" aria-hidden="true">
        <Image
          className="project-artwork-watermark-logo"
          src={`${assetBase}/ab-logo-mark.png`}
          alt=""
          width={400}
          height={340}
          sizes="32px"
        />
        <span>
          <strong>AB Web Studio</strong>
          <small>abwebstudio.com.au</small>
        </span>
      </span>
    </div>
  );
}
```

Use a `div` for the artwork wrapper so the existing `.service-project-image > span` selector continues to target only the `View Case Study` overlay rather than accidentally restyling the shared artwork wrapper.

- [ ] **Step 4: Add scoped responsive watermark styling**

Add these rules to `app/globals.css` near the existing project artwork/showcase rules:

```css
.project-artwork {
  position: absolute;
  inset: 0;
  overflow: hidden;
}

.project-artwork-watermark {
  position: absolute;
  right: clamp(10px, 1.25vw, 18px);
  bottom: clamp(10px, 1.25vw, 18px);
  z-index: 3;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 7px 10px 7px 8px;
  border: 1px solid rgba(239, 201, 106, 0.35);
  background: rgba(5, 5, 5, 0.72);
  box-shadow: 0 5px 18px rgba(0, 0, 0, 0.28);
  color: var(--paper);
  pointer-events: none;
  user-select: none;
  opacity: 0.62;
  backdrop-filter: blur(6px);
}

.project-artwork-watermark-logo {
  width: 28px;
  height: 24px;
  flex: 0 0 auto;
  object-fit: contain !important;
}

.project-artwork-watermark > span {
  display: grid;
  gap: 1px;
  line-height: 1.05;
}

.project-artwork-watermark strong {
  color: var(--gold-bright);
  font-size: 0.68rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.project-artwork-watermark small {
  color: rgba(255, 255, 255, 0.88);
  font-family: var(--mono);
  font-size: 0.58rem;
  letter-spacing: 0.02em;
}
```

Inside the existing `@media (max-width: 720px)` block, add:

```css
.project-artwork-watermark {
  right: 8px;
  bottom: 8px;
  gap: 6px;
  padding: 5px 7px 5px 6px;
}

.project-artwork-watermark-logo {
  width: 22px;
  height: 19px;
}

.project-artwork-watermark strong {
  font-size: 0.58rem;
}

.project-artwork-watermark small {
  font-size: 0.5rem;
}
```

- [ ] **Step 5: Run the repository verification suite**

Run:

```bash
npm run verify
```

Expected: lint, TypeScript typecheck, and all tests PASS.

- [ ] **Step 6: Build the production application**

Run:

```bash
npm run build
```

Expected: verification passes and the Next.js production build completes successfully.

- [ ] **Step 7: Review the diff for scope and interaction safety**

Confirm the diff changes only:

```text
app/project-artwork.tsx
app/globals.css
tests/rendered-html.test.mjs
```

Verify that `ProjectArtwork` props are unchanged, watermark markup is `aria-hidden`, and `.project-artwork-watermark` keeps `pointer-events: none`.

- [ ] **Step 8: Commit the implementation**

```bash
git add app/project-artwork.tsx app/globals.css tests/rendered-html.test.mjs
git commit -m "feat: watermark portfolio project previews"
```
