import {
  AWAKENING_DONE_KEY,
  SUPERNOVA_DONE_KEY,
  decideStartup,
  startupPlan,
  type BootLaunch,
} from "./launch";

/** Same source text the browser runs: the boot script and the tests share one rule. */
const DECIDE_SOURCE = decideStartup.toString();
const PLAN_SOURCE = startupPlan.toString();

/** Slack (ms) after the planned end before a fail-safe clears the overlay: covers the stalls the startup clock pauses through (components/startup/clock.ts). */
export const STARTUP_FAILSAFE_SLACK_MS = 4000;

/**
 * The least time (ms) the boot script's guard waits for the app to start the animation. Until
 * then the overlay shows the composition's own dark ground. The guard only exists for a page
 * whose scripts never run; it used to end the phase totalMs + slack after <head> was parsed, so
 * a first visit that hydrated late (cold cache, slow phone: measured up to 3.4 s after the boot
 * script on production, 6x CPU and slow 4G) lost the normal startup entirely or had the special
 * launch cut before its end, while a refresh (scripts cached) played it. Once StartupStage
 * runs it replaces this guard with one timed from the animation's real start.
 */
export const STARTUP_PRELIVE_MS = 12000;

/** Window property holding the boot guard's timer, cleared by StartupStage when it takes over. */
export const STARTUP_GUARD_KEY = "__rawinStartupGuard";

/** Set on <html> by StartupStage while it owns the fail-safe (the CSS one then stands down). */
export const STARTUP_LIVE_ATTR = "data-startup-live";

/**
 * The startup coordinator's pre-paint half (runs in <head>, after the theme boot script, so the
 * theme is already settled and never touched here). It makes the one decision for this page
 * load (decideStartup) from:
 *   - the launch event as rendered by the server (enabled, valid, window, event id);
 *   - the visitor's clock (Date.now(), UTC ms: the window ends on time on a cached page);
 *   - this browser's records: completed launch events (localStorage) and whether Signal
 *     Awakening has finished this session (sessionStorage);
 *   - the HTTP status the page was served with, where the browser reports it: an error status
 *     (404, 500, 503) is a system screen and gets no startup. Where it is not reported, the
 *     system screen's own inline script withdraws the startup while the page is parsed
 *     (lib/system-screen.ts), and StartupStage stands down if one appears later.
 * It only READS storage; completion is written by the overlay when an animation finishes.
 * It sets html[data-startup] (supernova | awakening), html[data-startup-phase="play"], the
 * event being shown, when the site is revealed (ms) and a CSS fail-safe. A plain timer of its
 * own ends the phase even if the app's scripts never run, so no overlay can stay stuck: it waits
 * at least STARTUP_PRELIVE_MS (never less than the old totalMs + slack), and ends the phase at
 * once if one of the app's own scripts fails to load. StartupStage cancels it when it starts.
 * `enabled` false (maintenance screen) emits a script that does nothing.
 */
export function buildStartupBootScript(launch: BootLaunch | null, durationS: number, enabled = true): string {
  if (!enabled) return "";
  const data = JSON.stringify(launch).replace(/</g, "\\u003c");
  const dur = Number.isFinite(durationS) ? Number(durationS) : 12;
  return `(function(){try{var d=document.documentElement;var L=${data};var done=[];try{var r=localStorage.getItem(${JSON.stringify(SUPERNOVA_DONE_KEY)});var a=r?JSON.parse(r):[];if(Array.isArray(a))done=a}catch(e){}var sd=false;try{sd=sessionStorage.getItem(${JSON.stringify(AWAKENING_DONE_KEY)})==="1"}catch(e){}var ns=0;try{var nv=performance.getEntriesByType("navigation")[0];ns=nv&&nv.responseStatus||0}catch(e){}var c=(${DECIDE_SOURCE})({path:location.pathname,now:Date.now(),launch:L,done:done,sessionDone:sd,status:ns});if(c==="none")return;var mm=window.matchMedia;var mob=!!(mm&&mm("(max-width: 767px)").matches);var red=!!(mm&&mm("(prefers-reduced-motion: reduce)").matches);var p=(${PLAN_SOURCE})(c,${dur},mob,red);d.setAttribute("data-startup",c);d.setAttribute("data-startup-phase","play");d.setAttribute("data-startup-layout",mob?"mobile":"desktop");d.setAttribute("data-startup-reveal",String(p.revealMs));if(c==="supernova"&&L)d.setAttribute("data-startup-event",L.eventId);if(red)d.setAttribute("data-startup-reduced","true");var g=Math.max(p.totalMs+${STARTUP_FAILSAFE_SLACK_MS},${STARTUP_PRELIVE_MS});d.style.setProperty("--startup-failsafe",g+"ms");var end=function(){if(d.getAttribute("data-startup-phase")!=="done"){d.setAttribute("data-startup-phase","done");try{window.dispatchEvent(new Event("rawin:startup-reveal"))}catch(e){}}};window.${STARTUP_GUARD_KEY}=setTimeout(end,g);if(window.addEventListener)window.addEventListener("error",function(e){var t=e&&e.target;if(t&&t.tagName==="SCRIPT"&&/\\/_next\\/static\\//.test(t.src||"")&&!d.hasAttribute("${STARTUP_LIVE_ATTR}"))end()},true)}catch(e){}})();`;
}

/** Fired when the site behind the startup becomes visible (reveal, skip, finish or fail-safe). */
export const STARTUP_REVEAL_EVENT = "rawin:startup-reveal";

interface GuardDoc {
  getAttribute(name: string): string | null;
  setAttribute(name: string, value: string): void;
}
interface GuardWin {
  setTimeout(fn: () => void, ms: number): unknown;
  clearTimeout(handle: unknown): void;
  dispatchEvent(e: Event): boolean;
}

/**
 * StartupStage's half of the fail-safe, called when it starts the animation: cancels the boot
 * guard (timed from <head>), marks html[data-startup-live] (the CSS fail-safe stands down) and
 * arms a guard timed from now for the animation's planned length plus slack, so the time the
 * page took to hydrate is never taken out of the startup. Returns the cancel for unmount.
 */
export function takeOverStartupGuard(d: GuardDoc, w: GuardWin, totalMs: number): () => void {
  const slots = w as unknown as Record<string, unknown>;
  w.clearTimeout(slots[STARTUP_GUARD_KEY]);
  slots[STARTUP_GUARD_KEY] = undefined;
  d.setAttribute(STARTUP_LIVE_ATTR, "true");
  const handle = w.setTimeout(() => {
    if (d.getAttribute("data-startup-phase") !== "done") {
      d.setAttribute("data-startup-phase", "done");
      w.dispatchEvent(new Event(STARTUP_REVEAL_EVENT));
    }
  }, totalMs + STARTUP_FAILSAFE_SLACK_MS);
  return () => w.clearTimeout(handle);
}

/** True while a startup overlay still hides the page (read in the browser only). */
export function startupHolding(): boolean {
  if (typeof document === "undefined") return false;
  const d = document.documentElement;
  return Boolean(d.getAttribute("data-startup")) && d.getAttribute("data-startup-phase") === "play";
}
