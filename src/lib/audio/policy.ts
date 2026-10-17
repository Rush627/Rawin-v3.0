/**
 * Sound rules that need no Web Audio: the stored preference, and how loud the ambience plays for
 * a route and a scroll position. Pure, so tests cover them without a browser.
 *
 * Sound is on by default (when the CMS allows it), but nothing is heard until the browser allows
 * it. An explicit mute is remembered and never undone by the site itself.
 */

export const SOUND_STORAGE_KEY = "rawin-sound";

export type SoundPreference = "on" | "off";

/** Stored "off" is the only state that silences the site; anything else means the default (on). */
export function parseSoundPreference(stored: string | null | undefined): SoundPreference {
  return stored === "off" ? "off" : "on";
}

export function readSoundPreference(storage: Pick<Storage, "getItem"> | null): SoundPreference {
  try {
    return parseSoundPreference(storage?.getItem(SOUND_STORAGE_KEY));
  } catch {
    return "on";
  }
}

export function writeSoundPreference(storage: Pick<Storage, "setItem"> | null, pref: SoundPreference) {
  try {
    storage?.setItem(SOUND_STORAGE_KEY, pref);
  } catch {
    // storage unavailable: the choice holds for this page only
  }
}

/** Routes where the ambience is silent: the Studio, system screens, or outside the public site (null). */
export function ambienceSilent(pathname: string | null): boolean {
  return pathname === null || pathname.startsWith("/saint-denis") || pathname.startsWith("/maintenance");
}

/**
 * How much the homepage hero "holds" the view, from the share of the viewport it covers (0..1):
 * full while it fills most of the screen, none once it has mostly scrolled away, eased between.
 */
export function heroPresence(coverage: number): number {
  const t = Math.min(1, Math.max(0, (coverage - 0.2) / (0.85 - 0.2)));
  return t * t * (3 - 2 * t);
}

/**
 * The ambience level for a route: the hero level on the homepage while the hero holds the view,
 * the quieter ambient level below it and on every other public page, silence where the site is
 * not public. `presence` is only meaningful on the homepage.
 */
export function ambienceLevel(pathname: string | null, presence: number, levels: { heroLevel: number; ambientLevel: number }): number {
  if (ambienceSilent(pathname)) return 0;
  if (pathname !== "/") return levels.ambientLevel;
  const p = Math.min(1, Math.max(0, presence));
  return levels.ambientLevel + (levels.heroLevel - levels.ambientLevel) * p;
}

/** The public sound control is shown when the CMS allows at least one of the two sounds. */
export function soundControlVisible(available: { background: boolean; click: boolean }): boolean {
  return available.background || available.click;
}

/**
 * The ambience level after every rule, in order of precedence: the CMS switch, the visitor's
 * mute, Orbit's voice (held at silence), then the route and scroll level.
 */
export function effectiveAmbienceLevel(
  s: { cmsBackground: boolean; muted: boolean; held: boolean; route: string | null; presence: number },
  levels: { heroLevel: number; ambientLevel: number },
): number {
  if (!s.cmsBackground || s.muted || s.held) return 0;
  return ambienceLevel(s.route, s.presence, levels);
}
