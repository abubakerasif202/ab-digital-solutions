import { projectSignalPoint } from "./signal-geometry";

const panels = Array.from({ length: 96 }, (_, index) => {
  const t = index / 96 * Math.PI * 2;
  const end = (index + 1) / 96 * Math.PI * 2;
  const corners = [projectSignalPoint(t, -1), projectSignalPoint(end, -1), projectSignalPoint(end, 1), projectSignalPoint(t, 1)];
  const light = Math.sin(t * 2 + 0.35);
  return {
    index,
    depth: corners.reduce((sum, point) => sum + point.depth, 0) / 4,
    points: corners.map((point) => `${point.x.toFixed(2)},${point.y.toFixed(2)}`).join(" "),
    colour: light > 0 ? `rgb(${Math.round(35 + light * 20)},${Math.round(66 + light * 28)},${Math.round(195 + light * 60)})` : `rgb(${Math.round(225 + light * 48)},${Math.round(226 + light * 46)},${Math.round(218 + light * 40)})`,
  };
}).sort((a, b) => a.depth - b.depth);

/** Inline geometry keeps this decorative layer off the image loading path. */
export function HeroFallback() {
  return (
    <div className="hero-3d-fallback signal-fallback" aria-hidden="true">
      <svg viewBox="0 0 640 620" fill="none" focusable="false" className="signal-sculpture">
        {panels.map((panel) => <polygon key={panel.index} points={panel.points} fill={panel.colour} stroke={panel.colour} strokeWidth="0.65" />)}
        {[-1, -0.86, 0.86, 1].map((across) => (
          <polyline key={across} points={Array.from({ length: 193 }, (_, index) => {
            const point = projectSignalPoint(index / 192 * Math.PI * 2, across);
            return `${point.x.toFixed(2)},${point.y.toFixed(2)}`;
          }).join(" ")} stroke={Math.abs(across) === 1 ? "#101114" : "#e9e9e2"} strokeOpacity="0.28" strokeWidth="0.8" />
        ))}
      </svg>
    </div>
  );
}
