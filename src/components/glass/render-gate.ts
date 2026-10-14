/**
 * LiquidGL redraws every animation frame for as long as any lens exists — even when the
 * page is idle, the hero is scrolled away, or the tab is hidden. Measured on the hero this
 * roughly doubled idle main-thread time. The hero's glass output only changes when the
 * page scrolls or resizes, the pointer tilts a lens, a snapshot is recaptured or the theme
 * changes, so the shared renderer is gated to draw only for a short window after those
 * events, and only while its snapshot region is on screen and the document is visible.
 */

type Renderer = {
  render: (...args: unknown[]) => unknown;
  captureSnapshot?: (...args: unknown[]) => unknown;
  __rawinGated?: boolean;
};

const ACTIVE_MS = 900;

export function installRenderGate(regionSelector: string): () => void {
  const renderer = (window as unknown as { __liquidGLRenderer__?: Renderer }).__liquidGLRenderer__;
  if (!renderer || renderer.__rawinGated) return () => {};

  const region = document.querySelector(regionSelector);
  let visible = true;
  let activeUntil = performance.now() + 3000; // reveal + first frames
  const wake = (ms = ACTIVE_MS) => {
    activeUntil = Math.max(activeUntil, performance.now() + ms);
  };

  const originalRender = renderer.render;
  const originalCapture = renderer.captureSnapshot;
  renderer.render = function gatedRender(this: Renderer, ...args: unknown[]) {
    if (document.hidden || !visible || performance.now() > activeUntil) return undefined;
    return originalRender.apply(this, args);
  };
  if (originalCapture) {
    renderer.captureSnapshot = function gatedCapture(this: Renderer, ...args: unknown[]) {
      wake(1500);
      return originalCapture.apply(this, args);
    };
  }
  renderer.__rawinGated = true;

  const io = region
    ? new IntersectionObserver(([entry]) => {
        visible = entry.isIntersecting;
        if (visible) wake();
      })
    : null;
  if (region) io?.observe(region);

  const onWake = () => wake();
  const onVisibility = () => !document.hidden && wake();
  window.addEventListener("scroll", onWake, { passive: true });
  window.addEventListener("resize", onWake, { passive: true });
  window.addEventListener("pointermove", onWake, { passive: true });
  window.addEventListener("rawin:themechange", onWake);
  document.addEventListener("visibilitychange", onVisibility);

  return () => {
    io?.disconnect();
    window.removeEventListener("scroll", onWake);
    window.removeEventListener("resize", onWake);
    window.removeEventListener("pointermove", onWake);
    window.removeEventListener("rawin:themechange", onWake);
    document.removeEventListener("visibilitychange", onVisibility);
    renderer.render = originalRender;
    if (originalCapture) renderer.captureSnapshot = originalCapture;
    renderer.__rawinGated = false;
  };
}
