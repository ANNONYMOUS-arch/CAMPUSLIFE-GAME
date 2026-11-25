import * as THREE from 'three';

let cachedSoftwareGl: boolean | null = null;

/**
 * Detects software WebGL rasterizers (SwiftShader, llvmpipe, WARP) from the GPU renderer string.
 * Used strictly for rendering cost (pixelRatio, shadows, antialiasing, frame pacing) without
 * altering scene layout, geometry counts, or gameplay logic.
 */
export function detectSoftwareWebGL(): boolean {
  if (cachedSoftwareGl !== null) return cachedSoftwareGl;
  if (typeof document === 'undefined') {
    cachedSoftwareGl = false;
    return false;
  }

  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2');
    if (!gl) {
      cachedSoftwareGl = true;
      return true;
    }
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
    const gpu = String(gl.getParameter(param) || '');
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    cachedSoftwareGl = /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    return cachedSoftwareGl;
  } catch {
    cachedSoftwareGl = false;
    return false;
  }
}

/**
 * Waits for WebGL2 GPU/SwiftShader command completion using fenceSync before scheduling
 * the next render tick so software WebGL never starves DOM rendering or input events.
 */
export function scheduleAfterDraw(
  glContext: WebGLRenderingContext | WebGL2RenderingContext,
  callback: () => void,
  registerTimer: (id: number) => void
): void {
  const gl2 = glContext as WebGL2RenderingContext;
  if (typeof gl2.fenceSync !== 'function') {
    const id = window.setTimeout(callback, 80);
    registerTimer(id);
    return;
  }

  const sync = gl2.fenceSync(gl2.SYNC_GPU_COMMANDS_COMPLETE, 0);
  gl2.flush();

  const poll = () => {
    const status = sync ? gl2.getSyncParameter(sync, gl2.SYNC_STATUS) : gl2.SIGNALED;
    if (status === gl2.UNSIGNALED) {
      const id = window.setTimeout(poll, 5);
      registerTimer(id);
    } else {
      if (sync) gl2.deleteSync(sync);
      const id = window.setTimeout(callback, 80);
      registerTimer(id);
    }
  };

  const id = window.setTimeout(poll, 5);
  registerTimer(id);
}

/** Shared contact shadow radial texture for grounding characters and props */
export function createContactShadowTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;
  const grad = ctx.createRadialGradient(64, 64, 8, 64, 64, 60);
  grad.addColorStop(0, 'rgba(10, 18, 14, 0.55)');
  grad.addColorStop(0.55, 'rgba(10, 18, 14, 0.22)');
  grad.addColorStop(1, 'rgba(10, 18, 14, 0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 128, 128);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}
