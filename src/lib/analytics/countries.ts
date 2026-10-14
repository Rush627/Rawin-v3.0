import { COUNTRY_NAMES } from "./world-grid";

let display: Intl.DisplayNames | null = null;
try {
  display = new Intl.DisplayNames(["en"], { type: "region" });
} catch {
  display = null;
}

/** Names this site sets itself, ahead of the platform's region names. */
const NAMES: Record<string, string> = { PS: "Palestine" };

/**
 * The map has no separate Israel region (its geometry, Natural Earth's India point-of-view
 * edition, draws that land as Palestine), so visits located there are shown under Palestine.
 * Presentation only: stored events keep the code the platform reported.
 */
const DISPLAY_AS: Record<string, string> = { IL: "PS" };

/** The code a country is shown, counted and highlighted under on the public pages. */
export function displayCountry(code: string): string {
  return DISPLAY_AS[code] ?? code;
}

/** English short name for an ISO 3166-1 alpha-2 code (stable across server and browser). */
export function countryName(code: string): string {
  if (!/^[A-Z]{2}$/.test(code)) return "Unknown";
  code = displayCountry(code);
  if (NAMES[code]) return NAMES[code];
  try {
    const n = display?.of(code);
    if (n && n !== code) return n;
  } catch {
    // unknown to Intl: use the map dataset's name
  }
  return COUNTRY_NAMES[code] || code;
}

// ISO 3166-1 user-assigned and grouping codes: placeholders ("ZZ" unknown, "XX", "AA", "Q*"),
// unions and pseudo-locales, never a visitor's country (XK, Kosovo, is the one code in these
// ranges in real use and is allowed)
const NOT_A_COUNTRY = /^(AA|Q[M-Z]|X[A-JL-Z]|ZZ|EU|EZ|UN)$/;

/**
 * A real country or territory code in canonical form ("IN"), or null. Accepts surrounding space
 * and lower case; rejects placeholders, groupings and anything not a known region, so an unknown
 * value is dropped rather than shown as a place.
 */
export function normalizeCountryCode(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const code = raw.trim().toUpperCase();
  if (!/^[A-Z]{2}$/.test(code) || NOT_A_COUNTRY.test(code)) return null;
  if (COUNTRY_NAMES[code]) return code;
  try {
    const n = display?.of(code);
    return n && n !== code ? code : null;
  } catch {
    return null;
  }
}
