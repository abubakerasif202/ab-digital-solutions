/**
 * Zero-JavaScript, zero-image "AB" monogram: layered CSS 3D extrusion.
 * Evaluated as a lighter stand-in for the approved artwork shown on phones,
 * with reduced motion and on constrained devices (`?fallback=css`).
 * Decorative only; the sway is CSS and switches off for reduced motion.
 */
const DEPTH = 22;
const STEP = 2;
const layers = Array.from({ length: DEPTH / STEP }, (_, index) => -DEPTH + index * STEP);

export function CssMonogram() {
  return (
    <div className="odp-mono-stage" aria-hidden="true">
      <div className="odp-mono-glow" />
      <div className="odp-mono">
        {layers.map((z) => (
          <span
            key={z}
            className={`odp-mono-layer ${z < -DEPTH + 6 ? "is-edge" : "is-depth"}`}
            style={{ transform: `translateZ(${z}px)` }}
          >
            AB
          </span>
        ))}
        <span className="odp-mono-layer is-face">AB</span>
      </div>
    </div>
  );
}
