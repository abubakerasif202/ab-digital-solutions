# Completed Projects Watermark Design

## Goal
Add a consistent AB Web Studio watermark to every completed-project preview on the portfolio without permanently editing the underlying screenshots.

## Scope
The watermark applies anywhere a completed-project image is rendered through the shared `ProjectArtwork` component. This automatically covers current projects and future projects that continue using the same component.

## Visual Treatment
- Position: bottom-right corner of the project preview.
- Content: AB Web Studio branding plus `abwebstudio.com.au`.
- Opacity: subtle, approximately 55–65% depending on final CSS treatment.
- Scale: compact on desktop and reduced further on small screens.
- Contrast: light/gold treatment with a minimal shadow or backdrop only when needed for legibility.
- Interaction: `pointer-events: none`; watermark must never block project links or controls.
- Accessibility: decorative branding should not add noisy screen-reader output.

## Architecture
Implement the watermark inside `app/project-artwork.tsx`, wrapping the project image in a positioned container and rendering a reusable overlay above the image. This keeps the behavior centralized and avoids duplicating watermark markup across the homepage carousel, work listing, case-study pages, or future project cards.

## Responsive Behaviour
- Maintain safe inset spacing from the image edge.
- Reduce text/logo size on mobile.
- Keep the watermark visible without obscuring important project UI shown in the screenshot.
- Preserve existing image sizing, lazy loading, priority loading, and responsive `sizes` behavior.

## Styling
Add dedicated watermark classes in the existing global stylesheet unless an equivalent local pattern already exists. Do not alter the visual design of the project cards beyond the watermark overlay.

## Data Flow
No project-data changes are required. The component receives the existing `Project` object and renders the same image plus the brand overlay.

## Error Handling
The watermark should be pure presentational markup with no runtime state or network dependency beyond any existing local brand asset. If no dedicated logo asset is suitable, use a styled text treatment rather than introducing an external dependency.

## Testing
Verify:
1. Watermark appears on all current completed projects.
2. Homepage featured-project carousel still links and slides correctly.
3. Work listing and project detail pages retain correct layout.
4. No clipping or overlap issues at mobile and desktop widths.
5. Existing image loading behavior remains unchanged.
6. Watermark does not intercept clicks or keyboard interaction.

## Non-Goals
- Do not burn the watermark into image files.
- Do not modify client websites themselves.
- Do not add animation to the watermark.
- Do not redesign project cards or carousel behavior.
