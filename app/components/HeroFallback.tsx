import { LOGO_PATHS, LOGO_VIEWBOX } from "./logo-mark";

/* Depth is faked with a short stack of offset copies: the WebGL extrusion's
   side walls, flattened. Offsets run toward the lower right, away from the key light. */
const EXTRUSION_STEPS = 9;
const STEP_X = 0.42;
const STEP_Y = 0.34;

const extrusion = Array.from({ length: EXTRUSION_STEPS }, (_, index) => EXTRUSION_STEPS - index);

/** Inline geometry keeps this decorative layer off the image loading path. */
export function HeroFallback() {
  const { width, height } = LOGO_VIEWBOX;
  return (
    <div className="hero-3d-fallback" aria-hidden="true">
      <svg viewBox={`-6 -2 ${width + 14} ${height + 8}`} fill="none" focusable="false" className="hero-sculpture">
        <defs>
          <linearGradient id="hero-gilt" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#f6e2a4" />
            <stop offset="0.45" stopColor="#d1a64c" />
            <stop offset="1" stopColor="#8a6420" />
          </linearGradient>
          <linearGradient id="hero-ruby" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#ff4a63" />
            <stop offset="1" stopColor="#8f0f26" />
          </linearGradient>
        </defs>
        {extrusion.map((step) => (
          <g key={step} transform={`translate(${(step * STEP_X).toFixed(2)} ${(step * STEP_Y).toFixed(2)})`} fill="#3a2a0c" opacity={0.9}>
            <path d={LOGO_PATHS.letterA} />
            <path d={LOGO_PATHS.letterB} />
            <path d={LOGO_PATHS.slash} fill="#4a0a15" />
          </g>
        ))}
        <path d={LOGO_PATHS.letterA} fill="url(#hero-gilt)" />
        <path d={LOGO_PATHS.letterB} fill="url(#hero-gilt)" />
        <path d={LOGO_PATHS.slash} fill="url(#hero-ruby)" />
      </svg>
    </div>
  );
}
