/**
 * Canonical public origin of RAWIN. NEXT_PUBLIC_SITE_URL overrides it (e.g. a preview
 * deployment); otherwise the production domain is used. Shared by metadata and any UI that
 * displays the domain, so the domain is defined in exactly one place.
 */
export const SITE_URL = ((process.env.NEXT_PUBLIC_SITE_URL || "").trim() || "https://rawin.space").replace(/\/+$/, "");

/** Bare host for display, e.g. "rawin.space". */
export const SITE_HOST = (() => {
  try {
    return new URL(SITE_URL).host;
  } catch {
    return "rawin.space";
  }
})();
