/** A closed sculptural ribbon shared by WebGL and its inline SVG fallback. */
export function signalPoint(t: number, across: number): [number, number, number] {
  const radius = 1.62 + 0.38 * Math.cos(3 * t);
  const twist = 2 * t + 0.35;
  const width = 0.47 + 0.13 * Math.sin(3 * t + 0.5);
  const radial = across * width * Math.cos(twist);
  return [(radius + radial) * Math.cos(t), (1.72 + radial) * Math.sin(t), 0.68 * Math.sin(2 * t) + across * width * Math.sin(twist)];
}

export function createSignalGeometry(segments = 180, strips = 12) {
  if (!Number.isInteger(segments) || segments < 12 || !Number.isInteger(strips) || strips < 2) {
    throw new RangeError("Signal geometry requires at least 12 segments and 2 strips.");
  }
  const positions: number[] = [];
  const indices: number[] = [];
  for (let segment = 0; segment <= segments; segment++) {
    for (let strip = 0; strip <= strips; strip++) {
      positions.push(...signalPoint(segment / segments * Math.PI * 2, strip / strips * 2 - 1));
    }
  }
  for (let segment = 0; segment < segments; segment++) {
    for (let strip = 0; strip < strips; strip++) {
      const a = segment * (strips + 1) + strip;
      const b = a + strips + 1;
      indices.push(a, b, a + 1, b, b + 1, a + 1);
    }
  }
  return { positions, indices };
}

export function projectSignalPoint(t: number, across: number) {
  const [x, y, z] = signalPoint(t, across);
  const rotatedX = x * Math.cos(-0.38) + z * Math.sin(-0.38);
  const depth = -x * Math.sin(-0.38) + z * Math.cos(-0.38);
  const rotatedY = y * Math.cos(-0.2) - depth * Math.sin(-0.2);
  const screenX = rotatedX * Math.cos(-0.12) - rotatedY * Math.sin(-0.12);
  const screenY = rotatedX * Math.sin(-0.12) + rotatedY * Math.cos(-0.12);
  return { x: 320 + screenX * 112, y: 310 - screenY * 112, depth };
}
