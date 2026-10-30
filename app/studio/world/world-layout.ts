// Shared world layout, in metres. The interior cutaway (floor x:-11.4..11.4, z:-9..9, y=0) is
// unchanged from V3. The street lies in front of it (+z). Vehicles drive on the LEFT (Australia):
// +x travellers use the near lane (smaller z, kerb side of the studio), -x travellers the far lane.
export const layout = {
  facadeZ: 9,
  door: { x: -0.5, width: 2.2, height: 2.9 },
  footpath: { z0: 9.6, z1: 12, y: 0.12 },
  pedestrianLanes: { z0: 9.95, z1: 10.55 }, // leave a separate wildlife corridor
  kangarooStrip: { z0: 11, z1: 11.2 }, // clear of kerb bins (z11.8) and poles (z11.88)
  road: { z0: 12, z1: 22, y: 0.01, centerZ: 17 },
  lanes: { plusX: 15, minusX: 19.2 },
  farFootpath: { z0: 22, z1: 25, y: 0.12 },
  crossing: { x: 6, width: 4 },
  stopLines: { plusX: 3.4, minusX: 8.6 }, // x position vehicles stop before
  streetLength: 120, // street runs x:-60..60
  harbour: { waterY: -1.2, waterZ: -40 }, // water begins behind the studio
} as const;

export const reduceFarClip = 420;
