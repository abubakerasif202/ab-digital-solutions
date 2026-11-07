import type { Camera, Object3D, Scene, WebGLRenderer } from "three";

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
    const extension = context.getExtension("KHR_parallel_shader_compile");
    // info.programs is renderer-owned. Validate its handles rather than reading
    // private per-material state that disappears during resource disposal.
    const programs = (renderer.info.programs ?? []).map((entry) => entry.program);
    const check = () => {
      if (cancelled) return;
      try {
        if (context.isContextLost()) throw new Error("Studio shader context lost");
        if (!extension) { resolveReady(); return; } // Functional fallback; first use may still stall.
        let complete = true;
        for (const program of programs) {
          if (!isShaderProgram(context, program)) throw new Error("Studio shader program disposed during preparation");
          if (!context.getProgramParameter(program, extension.COMPLETION_STATUS_KHR)) complete = false;
        }
        if (complete) resolveReady();
        else frame = requestFrame(check);
      } catch (error) { rejectReady(error); }
    };
    frame = requestFrame(check);
  } catch (error) { rejectReady(error); }
  return { ready, cancel() { cancelled = true; cancelFrame(frame); resolveReady(); } };
}
