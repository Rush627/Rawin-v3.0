/**
 * System screens: maintenance, offline, not found, application errors and "content
 * unavailable". Every one of them is drawn by RawinErrorView, and while one is on screen the
 * site is not being browsed normally, so:
 *   - the background ambience is not wanted (the audio director stops it and will not start it;
 *     interface clicks are unaffected);
 *   - no startup plays (the pre-paint decision skips it, and a startup already running stands
 *     down without recording anything, so the visitor's eligibility is untouched).
 *
 * One shared signal, counted so overlapping screens (an offline overlay above a 404) release it
 * only when the last one goes. Framework-free so the audio director, the startup coordinator
 * and the tests all read the same rule.
 */

/** Set on <html> while a system screen is shown (and by SYSTEM_SCREEN_BOOT_SCRIPT before hydration). */
export const SYSTEM_SCREEN_ATTR = "data-system-screen";

/** The attributes the startup boot script sets on <html> (lib/startup/boot-script.ts). */
export const STARTUP_ATTRS = [
  "data-startup",
  "data-startup-phase",
  "data-startup-layout",
  "data-startup-reveal",
  "data-startup-event",
  "data-startup-reduced",
] as const;

let claims = 0;
const listeners = new Set<() => void>();

function mark(on: boolean) {
  if (typeof document === "undefined") return;
  if (on) document.documentElement.setAttribute(SYSTEM_SCREEN_ATTR, "true");
  else document.documentElement.removeAttribute(SYSTEM_SCREEN_ATTR);
}

/** True while at least one system screen is mounted. */
export function systemScreenActive(): boolean {
  return claims > 0;
}

/** A system screen is shown until the returned release is called (safe to call twice). */
export function claimSystemScreen(): () => void {
  claims += 1;
  if (claims === 1) {
    mark(true);
    listeners.forEach((fn) => fn());
  }
  let released = false;
  return () => {
    if (released) return;
    released = true;
    claims = Math.max(0, claims - 1);
    if (claims === 0) {
      mark(false);
      listeners.forEach((fn) => fn());
    }
  };
}

/** Called whenever the signal turns on or off. */
export function subscribeSystemScreen(fn: () => void): () => void {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

/**
 * Inlined at the top of a server-rendered system screen, so it runs while the HTML is parsed,
 * before hydration: it marks <html> and withdraws a startup the head boot script chose for this
 * load (the server could not know the page would be a system screen when the root layout's
 * head was rendered). Nothing is recorded, so the startup stays owed for a normal page.
 */
export const SYSTEM_SCREEN_BOOT_SCRIPT = `(function(){try{var d=document.documentElement;d.setAttribute(${JSON.stringify(
  SYSTEM_SCREEN_ATTR,
)},"true");if(d.getAttribute("data-startup-phase")==="play"){var a=${JSON.stringify(
  STARTUP_ATTRS,
)};for(var i=0;i<a.length;i++)d.removeAttribute(a[i]);d.style.removeProperty("--startup-failsafe")}}catch(e){}})();`;
