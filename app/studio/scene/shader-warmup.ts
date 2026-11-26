import type { Camera, Object3D, Scene, WebGLRenderer } from "three";

// Separate renderers own separate program lifetimes. Weak references allow Three
// to dispose programs and contexts when visitors return to the still view.
const completedPrograms = new WeakMap<WebGLRenderer, WeakSet<WebGLProgram>>();

function isShaderProgram(context: WebGLRenderingContext | WebGL2RenderingContext, value: unknown): value is WebGLProgram {
  return typeof value === "object" && value !== null && context.isProgram(value as WebGLProgram);
}

/** Cancellable counterpart to Three 185's non-cancellable compileAsync poll. */
export function compileStageShaders(renderer: WebGLRenderer, root: Object3D, camera: Camera, scene: Scene, requestFrame = requestAnimationFrame, cancelFrame = cancelAnimationFrame) {
  let cancelled = false;
  let frame = 0;
  let resolveReady!: () => void;
  let rejectReady!: (error: unknown) => void;
  const ready = new Promise<void>((resolve, reject) => { resolveReady = resolve; rejectReady = reject; });
  try {
    renderer.compile(root, camera, scene);
    const context = renderer.getContext();
    if (context.isContextLost()) {
      rejectReady(new Error("Studio shader context lost"));
      return { ready, cancel() { cancelled = true; resolveReady(); } };
    }
    const extension = context.getExtension("KHR_parallel_shader_compile");
    if (!extension) {
      // Without KHR_parallel_shader_compile, renderer.compile() already finished synchronously.
      resolveReady();
      return { ready, cancel() { cancelled = true; resolveReady(); } };
    }
    // info.programs is renderer-owned. Validate its handles rather than reading
    // private per-material state that disappears during resource disposal.
    const completed = completedPrograms.get(renderer) ?? new WeakSet<WebGLProgram>();
    completedPrograms.set(renderer, completed);
    const programs = new Set<WebGLProgram>();
    for (const entry of renderer.info.programs ?? []) {
      const program = entry.program as WebGLProgram | null | undefined;
      if (program && !completed.has(program)) programs.add(program);
    }
    if (programs.size === 0) {
      resolveReady();
      return { ready, cancel() { cancelled = true; resolveReady(); } };
    }
    const check = () => {
      if (cancelled) return;
      try {
        if (context.isContextLost()) throw new Error("Studio shader context lost");
        for (const program of programs) {
          if (!isShaderProgram(context, program)) throw new Error("Studio shader program disposed during preparation");
          if (completed.has(program) || context.getProgramParameter(program, extension.COMPLETION_STATUS_KHR)) {
            completed.add(program);
            programs.delete(program);
          }
        }
        if (programs.size === 0) resolveReady();
        else frame = requestFrame(check);
      } catch (error) { rejectReady(error); }
    };
    frame = requestFrame(check);
  } catch (error) { rejectReady(error); }
  return { ready, cancel() { cancelled = true; cancelFrame(frame); resolveReady(); } };
}
