/** Deterministic value in [0, 1) so the skyline is identical on every render. */
const hash = (seed: number) => {
  const value = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return value - Math.floor(value);
};

const VIVID = ["#ff2d55", "#ff5aa8", "#9d7bff", "#35c9ff", "#ffb65c"] as const;

/**
 * Paints an abstract Sydney harbour at night onto a canvas: a dusk-to-ink sky,
 * an arch bridge, a lit skyline with Vivid-style light beams and their
 * reflections on the water. Stylised on purpose; it is a backdrop, not a map.
 */
export function paintHarbour(canvas: HTMLCanvasElement) {
  const context = canvas.getContext("2d");
  if (!context) return;
  const { width, height } = canvas;
  const horizon = height * 0.68;

  const sky = context.createLinearGradient(0, 0, 0, horizon);
  sky.addColorStop(0, "#05060f");
  sky.addColorStop(0.55, "#101338");
  sky.addColorStop(1, "#3a1648");
  context.fillStyle = sky;
  context.fillRect(0, 0, width, horizon);

  // Stars
  for (let index = 0; index < 90; index += 1) {
    context.fillStyle = `rgba(255,255,255,${0.2 + hash(index) * 0.5})`;
    context.fillRect(hash(index + 200) * width, hash(index + 400) * horizon * 0.6, 1.5, 1.5);
  }

  // Light beams behind the skyline
  context.globalCompositeOperation = "lighter";
  for (let index = 0; index < 7; index += 1) {
    const x = width * (0.08 + hash(index + 11) * 0.84);
    const lean = (hash(index + 31) - 0.5) * 260;
    const beam = context.createLinearGradient(x, horizon, x + lean, 0);
    beam.addColorStop(0, `${VIVID[index % VIVID.length]}66`);
    beam.addColorStop(1, `${VIVID[index % VIVID.length]}00`);
    context.fillStyle = beam;
    context.beginPath();
    context.moveTo(x - 5, horizon);
    context.lineTo(x + 5, horizon);
    context.lineTo(x + lean + 60, 0);
    context.lineTo(x + lean - 60, 0);
    context.fill();
  }
  context.globalCompositeOperation = "source-over";

  // Skyline
  let x = 0;
  let index = 0;
  while (x < width) {
    const buildingWidth = 26 + hash(index + 50) * 58;
    const centreBoost = 1 - Math.abs(x / width - 0.62) * 1.6;
    const buildingHeight = 40 + hash(index + 70) * 120 + Math.max(0, centreBoost) * 150;
    context.fillStyle = "#070914";
    context.fillRect(x, horizon - buildingHeight, buildingWidth - 3, buildingHeight);
    const tint = VIVID[Math.floor(hash(index + 90) * VIVID.length)];
    for (let row = 6; row < buildingHeight - 6; row += 9) {
      for (let column = 5; column < buildingWidth - 9; column += 8) {
        const lit = hash(index * 131 + row * 17 + column);
        if (lit < 0.42) continue;
        context.fillStyle = lit > 0.9 ? tint : `rgba(255,214,150,${0.35 + lit * 0.4})`;
        context.fillRect(x + column, horizon - buildingHeight + row, 3.5, 4.5);
      }
    }
    // Crown light on taller towers
    if (buildingHeight > 190) {
      context.fillStyle = tint;
      context.fillRect(x, horizon - buildingHeight, buildingWidth - 3, 3);
    }
    x += buildingWidth;
    index += 1;
  }

  // Arch bridge on the left
  const bridgeLeft = width * 0.04;
  const bridgeRight = width * 0.42;
  const deck = horizon - 34;
  context.lineWidth = 5;
  context.strokeStyle = "#0a0c18";
  context.beginPath();
  context.moveTo(bridgeLeft, deck);
  context.quadraticCurveTo((bridgeLeft + bridgeRight) / 2, deck - 190, bridgeRight, deck);
  context.stroke();
  context.fillStyle = "#0a0c18";
  context.fillRect(bridgeLeft - 30, deck, bridgeRight - bridgeLeft + 60, 7);
  for (let step = 0; step <= 22; step += 1) {
    const t = step / 22;
    const px = bridgeLeft + (bridgeRight - bridgeLeft) * t;
    const py = deck - 95 * 4 * t * (1 - t) * 0.5 * 2;
    context.fillStyle = "#0a0c18";
    context.fillRect(px - 1, py, 2, deck - py);
    context.fillStyle = step % 2 ? "#ffd9a0" : "#ff5aa8";
    context.beginPath();
    context.arc(px, py - 2, 2.4, 0, Math.PI * 2);
    context.fill();
  }

  // Water with soft vertical reflections
  const water = context.createLinearGradient(0, horizon, 0, height);
  water.addColorStop(0, "#1a1236");
  water.addColorStop(1, "#04050c");
  context.fillStyle = water;
  context.fillRect(0, horizon, width, height - horizon);
  context.globalCompositeOperation = "lighter";
  for (let streak = 0; streak < 70; streak += 1) {
    const sx = hash(streak + 600) * width;
    const reflection = context.createLinearGradient(0, horizon, 0, horizon + 50 + hash(streak + 700) * 110);
    reflection.addColorStop(0, `${VIVID[streak % VIVID.length]}88`);
    reflection.addColorStop(1, `${VIVID[streak % VIVID.length]}00`);
    context.fillStyle = reflection;
    context.fillRect(sx, horizon, 3 + hash(streak + 800) * 8, 160);
  }
  context.globalCompositeOperation = "source-over";
}
