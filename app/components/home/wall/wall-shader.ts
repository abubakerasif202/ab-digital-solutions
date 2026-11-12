/**
 * GLSL for the project wall: one instanced draw call, a few hundred tiles.
 *
 * Every tile is a thin quad whose depth, tilt and flip are computed in the
 * vertex shader from a handful of uniforms (lens position, a ripple, a
 * transition clock), so the CPU does no per-tile work after setup.
 *
 * Fragment logic: outside the lens a tile shows the project's structure (a
 * Sobel edge map in steel blue over a faint ghost of the render). Inside the
 * lens it develops into the finished render. The wall is the site's idea in
 * miniature: what is under the surface, and what ships.
 */

export const wallVertexShader = /* glsl */ `
  attribute vec2 aCell;
  attribute float aRand;

  uniform vec2 uGrid;
  uniform vec2 uWall;
  uniform vec3 uPointer;   // wall-local lens centre (xy) and strength (z)
  uniform float uLensR;
  uniform float uTime;
  uniform float uTrans;    // 0..1 transition clock
  uniform vec3 uRipple;    // origin xy, age in seconds (-1 = off)
  uniform float uBreath;   // 0 when reduced motion is on
  uniform float uFlipOn;   // 0 = crossfade-free instant swap

  varying vec2 vUv;
  varying vec2 vCell;
  varying vec2 vWall;
  varying float vFlip;
  varying float vLift;

  const float PI = 3.14159265;

  void main() {
    vec2 tile = uWall / uGrid;
    vec2 center = vec2(
      ((aCell.x + 0.5) / uGrid.x - 0.5) * uWall.x,
      (0.5 - (aCell.y + 0.5) / uGrid.y) * uWall.y
    );

    // Lens: tiles near the pointer rise into a soft dome and lean away from it.
    float d = distance(center, uPointer.xy);
    float dome = smoothstep(uLensR * 1.35, 0.0, d) * uPointer.z;
    vec2 away = normalize(center - uPointer.xy + vec2(0.0001));

    // Ripple released by a project change, centred on the lens.
    float wave = 0.0;
    if (uRipple.z >= 0.0) {
      float r = distance(center, uRipple.xy);
      float front = uRipple.z * 3.4;
      wave = sin((r - front) * 5.2) * exp(-abs(r - front) * 1.15) * exp(-uRipple.z * 1.5) * 0.14;
    }

    float breath = sin(uTime * 0.7 + center.x * 0.9 + center.y * 0.7 + aRand * 6.2831) * 0.012 * uBreath;

    // Transition: a flip that travels outward from the ripple origin.
    float maxDist = length(uWall) * 0.5;
    float delay = (distance(center, uRipple.xy) / maxDist) * 0.46 + aRand * 0.1;
    float t = clamp((uTrans - delay) / 0.4, 0.0, 1.0) * uFlipOn + step(0.999, uTrans) * (1.0 - uFlipOn);
    float angle = t * PI;

    vec2 p = position.xy * tile * 0.975;
    float py = p.y * cos(angle);
    float pz = p.y * sin(angle);
    float lift = dome * 0.2 + sin(t * PI) * 0.32;
    float z = pz + lift + wave + breath + dot(p, away) * dome * 0.5;

    vLift = dome;
    vFlip = t;
    vUv = uv;
    vCell = aCell;
    vWall = center + vec2(p.x, py);

    gl_Position = projectionMatrix * modelViewMatrix * vec4(center.x + p.x, center.y + py, z, 1.0);
  }
`;

export const wallFragmentShader = /* glsl */ `
  uniform sampler2D uColA;
  uniform sampler2D uEdgeA;
  uniform sampler2D uColB;
  uniform sampler2D uEdgeB;
  uniform vec2 uGrid;
  uniform vec3 uPointer;
  uniform float uLensR;
  uniform float uDim;
  uniform vec3 uAccent;
  uniform vec3 uSteel;
  uniform vec3 uVoid;

  varying vec2 vUv;
  varying vec2 vCell;
  varying vec2 vWall;
  varying float vFlip;
  varying float vLift;

  void main() {
    bool useB = vFlip > 0.5;
    vec2 tileUv = vUv;
    if (useB) tileUv.y = 1.0 - tileUv.y; // the back face is mirrored; undo it

    vec2 atlas = vec2(
      (vCell.x + tileUv.x) / uGrid.x,
      1.0 - (vCell.y + 1.0 - tileUv.y) / uGrid.y
    );

    vec3 render = useB ? texture2D(uColB, atlas).rgb : texture2D(uColA, atlas).rgb;
    float edge = useB ? texture2D(uEdgeB, atlas).r : texture2D(uEdgeA, atlas).r;

    float dl = distance(vWall, uPointer.xy);
    float aa = max(fwidth(dl) * 1.5, 0.0005);
    float lens = (1.0 - smoothstep(uLensR - aa * 6.0, uLensR, dl)) * uPointer.z;
    float ring = (1.0 - smoothstep(0.0, aa, abs(dl - uLensR) - aa * 0.5)) * uPointer.z;

    // Structure view: edges in steel, a ghost of the render, hairline tile seams.
    float seam = 1.0 - smoothstep(0.0, 0.05, min(min(vUv.x, 1.0 - vUv.x), min(vUv.y, 1.0 - vUv.y)));
    vec3 structure = mix(uVoid, uSteel, clamp(edge * 1.15 + 0.05, 0.0, 1.0));
    structure += render * 0.11;
    structure += uAccent * seam * 0.07;

    // Finished view inside the lens.
    vec3 finished = render * (0.96 + lens * 0.1);

    vec3 color = mix(structure, finished, lens);
    color += uAccent * ring * 0.95;
    color += vLift * 0.06;
    color = mix(uVoid, color, uDim);

    gl_FragColor = vec4(color, 1.0);
    #include <colorspace_fragment>
  }
`;
