/** Shared rounded studio ligature: flat identity and live scene use identical outlines. */
export const LOGO_VIEWBOX = { width: 88, height: 64 } as const;
export const LOGO_PATHS = {
  letterA: "M6 38C6 27 13 20 23 20C28 20 32 22 35 26V21H43V52H35V48C32 52 28 54 23 54C13 54 6 47 6 38ZM15 38C15 44 19 47 24 47C30 47 35 43 35 38C35 32 30 28 24 28C19 28 15 32 15 38Z",
  letterB: "M46 10H55V25C58 22 62 20 67 20C77 20 82 27 82 37C82 47 76 54 67 54C62 54 58 52 55 49V52H46V10ZM55 37C55 43 59 47 64 47C70 47 74 43 74 37C74 31 70 28 64 28C59 28 55 32 55 37Z",
  slash: "M36 9H43V16H36Z",
} as const;
export type LogoPartName = keyof typeof LOGO_PATHS;
