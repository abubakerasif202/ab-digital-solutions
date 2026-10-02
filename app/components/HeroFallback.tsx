import { ABLogo } from "./brand/ABLogo";

/** Inline geometry keeps this decorative layer off the image loading path. */
export function HeroFallback() {
  return <div className="hero-3d-fallback" aria-hidden="true"><ABLogo decorative /></div>;
}
