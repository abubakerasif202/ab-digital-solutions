import { projectSignalPoint } from "./signal-geometry";

/* Gilt where the ribbon faces the light, ruby where it turns away: the same
   split as the WebGL object, computed once at module load. */
function panelColour(light: number, turned: boolean): string {
  const lift = (light + 1) / 2;
  const [r, g, b] = turned ? [Math.round(70 + lift * 150), Math.round(6 + lift * 34), Math.round(20 + lift * 44)] : [Math.round(120 + lift * 119), Math.round(88 + lift * 113), Math.round(24 + lift * 82)];
  return `rgb(${r},${g},${b})`;
}

const panels = Array.from({ length: 96 }, (_, index) => {
  const t = index / 96 * Math.PI * 2;
  const end = (index + 1) / 96 * Math.PI * 2;
  const corners = [projectSignalPoint(t, -1), projectSignalPoint(end, -1), projectSignalPoint(end, 1), projectSignalPoint(t, 1)];
  const light = Math.sin(t * 2 + 0.35);
  return {
    index,
    depth: corners.reduce((sum, point) => sum + point.depth, 0) / 4,
    points: corners.map((point) => `${point.x.toFixed(2)},${point.y.toFixed(2)}`).join(" "),
    colour: panelColour(light, t > Math.PI),
  };
}).sort((a, b) => a.depth - b.depth);

/** Inline geometry keeps this decorative layer off the image loading path. */
export function HeroFallback() {
  return (
    <div className="hero-3d-fallback" aria-hidden="true">
      <svg viewBox="0 0 640 620" fill="none" focusable="false" className="hero-sculpture">
        {panels.map((panel) => <polygon key={panel.index} points={panel.points} fill={panel.colour} stroke={panel.colour} strokeWidth="0.65" />)}
        {[-1, -0.86, 0.86, 1].map((across) => (
          <polyline key={across} points={Array.from({ length: 193 }, (_, index) => {
            const point = projectSignalPoint(index / 192 * Math.PI * 2, across);
            return `${point.x.toFixed(2)},${point.y.toFixed(2)}`;
          }).join(" ")} stroke={Math.abs(across) === 1 ? "#ffeebe" : "#e7c995"} strokeOpacity="0.45" strokeWidth="0.8" />
        ))}
      </svg>
    </div>
  );
}
