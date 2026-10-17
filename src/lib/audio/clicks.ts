import type { AudioDirector } from "./engine";

/**
 * Controls that give click feedback. Text fields, sliders, plain containers and decorative
 * elements do not; a <label> is left out because activating it re-dispatches the click on its
 * control (which is in the list), so one activation stays one sound.
 */
export const INTERACTIVE =
  "a[href], button, [role='button'], [role='tab'], [role='menuitem'], [role='menuitemradio'], [role='switch'], [role='option'], [role='link'], summary, select, input[type='checkbox'], input[type='radio'], input[type='submit'], input[type='button'], input[type='reset']";

let users = 0;
let detach: (() => void) | null = null;

/**
 * The one delegated click listener for interface sounds, shared by the public site's wiring and
 * the system screens: however many of them are mounted, each activation clicks once. An element
 * that makes its own sound opts out with data-sound="none". Returns the release.
 */
export function attachInterfaceClicks(audio: AudioDirector): () => void {
  users += 1;
  if (!detach) {
    const onClick = (e: MouseEvent) => {
      const el = (e.target as Element | null)?.closest?.(INTERACTIVE);
      if (!el || (el as HTMLButtonElement).disabled || el.getAttribute("aria-disabled") === "true") return;
      if (el.closest("[data-sound='none']")) return;
      // an activation that opens another tab or window takes the visitor away from this page at
      // once: no click (on phones it would start as the page is hidden and be cut mid-sound)
      if (el instanceof HTMLAnchorElement && (el.target === "_blank" || e.ctrlKey || e.metaKey || e.shiftKey || e.button === 1)) {
        audio.unlock();
        return;
      }
      // inside the gesture: also completes a start the browser held back
      audio.unlock();
      const r = el.getBoundingClientRect();
      audio.click(((r.left + r.width / 2) / Math.max(1, window.innerWidth) - 0.5) * 0.4);
    };
    document.addEventListener("click", onClick, { capture: true });
    detach = () => document.removeEventListener("click", onClick, { capture: true });
  }
  let released = false;
  return () => {
    if (released) return;
    released = true;
    users = Math.max(0, users - 1);
    if (users === 0 && detach) {
      detach();
      detach = null;
    }
  };
}
