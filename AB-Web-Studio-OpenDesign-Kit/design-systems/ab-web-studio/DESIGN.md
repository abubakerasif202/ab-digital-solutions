# AB Web Studio — Gilt & Ruby

> Category: Creative Agency & Luxury Digital Experiences

AB Web Studio is a Sydney digital experience studio creating premium websites, visual identities and motion-rich digital experiences. The brand is confident, cinematic, distinctly Australian, accessible and conversion-aware. This design system belongs to the agency brand; client brands must retain their own identity.

## 1. Art Direction

Create digital environments with editorial restraint and purposeful drama. Use generous negative space, measured hierarchy, carefully art-directed imagery, polished materials and subtle interactive depth. The signature mood is midnight black, warm metallic gold and deep ruby. The overall impression should be bespoke, not template-driven. Treat motion as atmosphere and narrative, never as a distraction.

## 2. Color Language

Primary canvas: **Midnight Black** `#0A0A0D`. Elevated cards: **Charcoal** `#17171B`. Subtle warm tertiary panels: **Ink** `#211C20`. Text: **Ivory** `#F6F0E7`; subdued copy: `#C0B9B2`. Signature CTA accent: **Antique Gold** `#C8A86B` with dark foreground `#0A0A0D`. Secondary expression: **Deep Ruby** `#742D43`; reserve it for depth, secondary active states and selective storytelling moments. Hairline borders use `#403A3B`. Gold should be used sparingly, not everywhere, and should not be expressed as flat yellow. Preserve accessible contrast on controls and text. Tokens in `tokens.css` are the implementation source.

## 3. Typography

Use **Bodoni Moda** for display/hero editorial headings with **Schibsted Grotesk** for UI and body text, and **IBM Plex Mono** for labels, indexes, microcopy and tech captions. Load licensed/open-source webfonts where permitted; retain system fallbacks. Use a strong visual hierarchy, generous hero line lengths of at most 10 words where possible, and elegant rather than exaggerated letter spacing. Body copy must remain readable at 16–18px. Avoid microscopic text and all-caps paragraphs.

## 4. Grid and Spacing

Use a responsive 12-column desktop layout and 4-column mobile composition. Main container approximately 1280px, with 40px desktop gutters, 24px tablet gutters and 18px mobile gutters. Vertical sections should breathe: 112px desktop / 76px tablet / 52px phone. Establish clear component rhythm through an 8px-based spacing scale. Avoid generic equal-sized card grids if an editorial composition can communicate priority more clearly.

## 5. Components

Header: compact floating or transparent navigation with a refined active state. Primary button: antique-gold fill with dark text, clear hover and keyboard focus. Secondary button: subtle border with light text. Cards: near-black surfaces with fine warm borders and carefully staged hover states. Forms: explicit labels, robust validation, clear success/failure messages, accessible keyboard flow. Footer: generous typography, project links, social icons and trustworthy contact information. Do not invent testimonials, awards, analytics or client logos.

## 6. Imagery and 3D

Use high-quality, rights-cleared visual assets. For AB Web Studio, Sydney architecture, the Opera House, Harbour Bridge, reflective urban scenes and restrained Australian wildlife may be used as visual identity cues when geographically appropriate. Prefer real imagery or art-directed, cinematic 3D over generic vectors. The AB monogram may appear as a premium 3D sculptural object, but design a static fallback. Avoid empty decorative scenes and oversized image downloads. Never imply an AI-generated image is an authentic project photo.

## 7. Motion and Interaction

Use purposeful transitions around 180–300ms for controls, and 400–900ms for selective section reveals; longer hero sequences must not delay access to content. Scrolling should remain responsive. Parallax, shaders and 3D must degrade gracefully on low-end devices, reduced-motion preferences and weak connections. Pause nonessential continuous animation when inactive. Keep audio opt-in or explicitly user-initiated, and provide mute/pause controls.

## 8. Accessibility and Responsive Behaviour

Use semantic HTML, keyboard-operable components, visible focus indicators, correctly labelled inputs and meaningful alt text. Target WCAG 2.2 AA for relevant design work, including checked colour contrast, focus order and reduced-motion support. Test at 360, 390, 768, 1024, 1440 and 1920px widths where applicable. No horizontal overflow. Respect touch targets, notches, safe areas and system font rendering.

## 9. Performance and Implementation

Prefer fast-loading React/Next.js/Astro implementations aligned to the existing client repository. Use responsive images, modern formats, font subsets, code splitting and lazy loading. Keep effects behind performance budgets and provide fallback content. For prototypes, produce realistic functional interactions rather than mock buttons. For production, preserve SEO metadata, forms, conversions, redirects, analytics and core business flows. Do not change deployment configuration, branches or production files without approval.

## 10. Content and Conversion

Use concise, confident copy that focuses on business outcomes rather than vague AI-generated marketing language. Lead with an immediately understandable value proposition, strong relevant visual proof, one primary CTA per section and clear contact pathways. Use Australian English. For agency prototypes, include website design, development, SEO/marketing, selected work and enquiry pathways. Price or service claims must come from approved business details.

## 11. Anti-Patterns

Do not use generic purple SaaS gradients, oversized rounded cards, meaningless floating badges, repetitive stock photography, illegible gold-on-white text, constant motion, fake counters, unverified star ratings, placeholder client endorsements, invisible controls or intrusive full-screen overlays. Do not overwrite an existing client design system with AB's agency palette.

## 12. Review and Handoff

Before handoff, confirm desktop/mobile visual quality, typography consistency, accessibility, no broken interactions, no console errors, source attribution, reduced-motion fallbacks and clear differentiation from a stock template. Prototype work must be isolated from production code. Present design rationale, list intentional tradeoffs, and call out any unverified business facts.
