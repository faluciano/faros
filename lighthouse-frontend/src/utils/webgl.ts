let supported: boolean | undefined;

// Whether this browser can create a WebGL context, which the map needs.
//
// The answer is worked out once. Probing means creating a context, and
// browsers cap how many a page may hold (16 in Chrome): past the cap the
// oldest one is dropped, and the oldest is the map's own. Probing on every
// render used to blank the map after a handful of clicks or hovers.
export function isWebGLSupported(): boolean {
  if (supported === undefined) {
    supported = probe();
  }
  return supported;
}

function probe(): boolean {
  if (typeof window === 'undefined' || !window.WebGLRenderingContext) {
    return false;
  }
  try {
    const context = document.createElement('canvas').getContext('webgl');
    // Hand the probe's context back straight away instead of waiting for
    // garbage collection.
    context?.getExtension('WEBGL_lose_context')?.loseContext();
    return context !== null;
  } catch {
    return false;
  }
}
