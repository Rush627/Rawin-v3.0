/**
 * Bundled default assets (files in /public, derived from the owner's originals) and the map
 * from retired URLs to them. Pure module: used by the content normaliser, the asset API
 * fallbacks, metadata and tests.
 *
 * Stored documents may still reference paths that no longer exist (/images/*, /favicon.svg,
 * /brand/rawin-logo*.svg). They are translated at read time, so nothing is rewritten in the
 * database and a later admin upload simply replaces the reference.
 */

export const BUNDLED = {
  profilePhoto: "/defaults/profile.webp",
  logoLight: "/brand/logo-light.png",
  logoDark: "/brand/logo-dark.png",
  faviconLight: "/brand/favicon-light-32.png",
  faviconDark: "/brand/favicon-dark-32.png",
  faviconLightLarge: "/brand/favicon-light-192.png",
  faviconDarkLarge: "/brand/favicon-dark-192.png",
  appleTouchIcon: "/icons/apple-touch-icon.png",
  faviconIco: "/favicon.ico",
} as const;

/** Bundled evolution screenshots, by the year in their original file name. */
export const BUNDLED_EVOLUTION: Record<string, string> = {
  "2022": "/defaults/evolution-2022.webp",
  "2023": "/defaults/evolution-2023.webp",
  "2026": "/defaults/evolution-2026.webp",
};

const LEGACY_URLS: Record<string, string> = {
  "/images/profile.png": BUNDLED.profilePhoto,
  "/profile.png": BUNDLED.profilePhoto,
  "/images/evolution-2022.png": BUNDLED_EVOLUTION["2022"],
  "/images/evolution-2023.png": BUNDLED_EVOLUTION["2023"],
  "/images/evolution-2026.png": BUNDLED_EVOLUTION["2026"],
  "/evolution-2022.png": BUNDLED_EVOLUTION["2022"],
  "/evolution-2023.png": BUNDLED_EVOLUTION["2023"],
  "/brand/rawin-logo.svg": BUNDLED.logoDark,
  "/brand/rawin-logo-light.svg": BUNDLED.logoLight,
  "/images/logo.png": BUNDLED.logoDark,
  "/logo.png": BUNDLED.logoDark,
  "/favicon.svg": BUNDLED.faviconDark,
  "/favicon.png": BUNDLED.faviconDark,
  "/images/favicon.png": BUNDLED.faviconDark,
};

/** A stored asset URL, with retired paths translated; empty → `fallback`. */
export function resolveAssetUrl(url: unknown, fallback: string): string {
  const value = typeof url === "string" ? url.trim() : "";
  if (!value) return fallback;
  return LEGACY_URLS[value] ?? value;
}

/** True when the URL points at an admin upload (GridFS) rather than a bundled default. */
export function isUploadedAsset(url: unknown): boolean {
  return typeof url === "string" && url.startsWith("/api/assets/");
}

/**
 * The bundled screenshot for a milestone: by its year, else by the year in a bundled milestone's
 * id ("milestone-2023", whose year may since have been edited); "" when there is none.
 */
export function evolutionFallback(year: unknown, id?: unknown): string {
  const byYear = BUNDLED_EVOLUTION[String(year ?? "").trim()];
  if (byYear) return byYear;
  const m = /^milestone-(\d{4})$/.exec(String(id ?? "").trim());
  return (m && BUNDLED_EVOLUTION[m[1]]) || "";
}

/* ------------------------------------------------------------------ uploads */

/** Image formats recognised from their first bytes (never from the declared MIME type). */
export function sniffImageType(bytes: Uint8Array): "image/png" | "image/jpeg" | "image/webp" | "image/x-icon" | null {
  const b = bytes;
  if (b.length >= 8 && b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47 && b[4] === 0x0d && b[5] === 0x0a && b[6] === 0x1a && b[7] === 0x0a) return "image/png";
  if (b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return "image/jpeg";
  if (b.length >= 12 && b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 && b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50) return "image/webp";
  if (b.length >= 6 && b[0] === 0 && b[1] === 0 && b[2] === 1 && b[3] === 0 && b[4] > 0) return "image/x-icon";
  return null;
}

export const IMAGE_UPLOAD_RULES: Record<string, { label: string; maxBytes: number; types: string[] }> = {
  profilePhoto: { label: "Profile photo", maxBytes: 5 * 1024 * 1024, types: ["image/jpeg", "image/png", "image/webp"] },
  logoLight: { label: "Logo (light theme)", maxBytes: 2 * 1024 * 1024, types: ["image/png", "image/webp"] },
  logoDark: { label: "Logo (dark theme)", maxBytes: 2 * 1024 * 1024, types: ["image/png", "image/webp"] },
  faviconLight: { label: "Favicon (light theme)", maxBytes: 1024 * 1024, types: ["image/png", "image/webp", "image/x-icon"] },
  faviconDark: { label: "Favicon (dark theme)", maxBytes: 1024 * 1024, types: ["image/png", "image/webp", "image/x-icon"] },
  milestone: { label: "Milestone image", maxBytes: 5 * 1024 * 1024, types: ["image/jpeg", "image/png", "image/webp"] },
  projectPreview: { label: "Project preview", maxBytes: 5 * 1024 * 1024, types: ["image/jpeg", "image/png", "image/webp"] },
  blogCover: { label: "Article cover", maxBytes: 5 * 1024 * 1024, types: ["image/jpeg", "image/png", "image/webp"] },
};

/**
 * Validates an uploaded image by its content. Returns the detected MIME type (which is what
 * gets stored and served) or a user-facing error.
 */
export function checkImageUpload(kind: keyof typeof IMAGE_UPLOAD_RULES, bytes: Uint8Array): { ok: true; type: string } | { ok: false; error: string } {
  const rule = IMAGE_UPLOAD_RULES[kind];
  if (!rule) return { ok: false, error: "Unknown upload type." };
  if (!bytes.length) return { ok: false, error: "The file is empty." };
  if (bytes.length > rule.maxBytes) {
    return { ok: false, error: `${rule.label} must be ${Math.round(rule.maxBytes / 1024 / 1024)} MB or smaller.` };
  }
  const type = sniffImageType(bytes);
  if (!type || !rule.types.includes(type)) {
    const names = rule.types.map((t) => (t === "image/x-icon" ? "ICO" : t.split("/")[1].toUpperCase())).join(", ");
    return { ok: false, error: `${rule.label} must be a ${names} image (the file's contents were checked, not its name).` };
  }
  return { ok: true, type };
}

/* ------------------------------------------------------------------ asset routes */

/**
 * GridFS asset type for a /api/assets/<type> URL segment, and the bundled file served when the
 * stored file is missing. Milestone images (evolution-<id>) have no generic fallback: an absent
 * file is a 404 rather than an unrelated picture.
 */
export function assetRouteTarget(rawType: string): { key: string; fallback: string | null } | null {
  switch (rawType) {
    case "profile":
    case "profilePhoto":
      return { key: "profilePhoto", fallback: BUNDLED.profilePhoto };
    case "logo":
      return { key: "logo", fallback: BUNDLED.logoDark };
    case "favicon":
    case "icon":
      return { key: "favicon", fallback: BUNDLED.faviconDark };
    case "logoLight":
      return { key: "logoLight", fallback: BUNDLED.logoLight };
    case "logoDark":
      return { key: "logoDark", fallback: BUNDLED.logoDark };
    case "faviconLight":
      return { key: "faviconLight", fallback: BUNDLED.faviconLight };
    case "faviconDark":
      return { key: "faviconDark", fallback: BUNDLED.faviconDark };
  }
  if (/^evolution-[A-Za-z0-9_-]{1,40}$/.test(rawType)) return { key: rawType, fallback: null };
  return null;
}
