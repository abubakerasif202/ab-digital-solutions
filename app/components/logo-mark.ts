/** Canonical AB monogram outlines, shared by the flat logo, the WebGL hero and
 *  its SVG fallback. Mirrors public/brand/ab-mark.svg (viewBox 0 0 80 64). */
export const LOGO_VIEWBOX = { width: 80, height: 64 } as const;

export const LOGO_PATHS = {
  letterA: "M4 52 19 12h8l15 40h-9l-3-9H15l-3 9H4Zm14-17h9l-4.5-13L18 35Z",
  letterB:
    "M44 12h14c9 0 14 4 14 11 0 4-2 7-5 9 4 2 6 5 6 9 0 7-5 11-15 11H44V12Zm8 8v9h6c4 0 6-2 6-5s-2-4-6-4h-6Zm0 17v7h6c5 0 7-1 7-4s-2-3-7-3h-6Z",
  slash: "M34 54 47 10h4L38 54Z",
} as const;

export type LogoPartName = keyof typeof LOGO_PATHS;
