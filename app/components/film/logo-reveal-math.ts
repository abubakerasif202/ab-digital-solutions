export type Particle = {
  tx: number; ty: number; col: number; sx: number; sy: number; sz: number;
  t0: number; du: number; ph: number; size: number; glint: boolean;
};

export const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
export const glide = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);

export function buildParticles(data: ReadonlyArray<readonly [number, number, number, number]>, count: number): Particle[] {
  // Deterministic LCG keeps the layout identical between plays and renders.
  let seed = 42;
  const rand = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
  const step = data.length / count;
  const out: Particle[] = [];
  for (let i = 0; i < count && data.length; i++) {
    const [tx, ty, ruby, bright] = data[Math.floor(i * step)];
    out.push({
      tx, ty,
      col: ruby ? 4 : bright > 0.9 ? 3 : bright > 0.68 ? 2 : bright > 0.42 ? 1 : 0,
      sx: rand() * 2 - 1, sy: rand() * 2 - 1, sz: -2000 + rand() * 2300,
      t0: 0.1 + rand() * 0.9, du: 1.3 + rand() * 0.5, ph: rand() * 6.283,
      size: 0.5 + rand(), glint: rand() < 0.1,
    });
  }
  return out.sort((a, b) => a.col - b.col);
}
