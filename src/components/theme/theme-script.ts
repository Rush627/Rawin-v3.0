export const THEME_STORAGE_KEY = "rawin-theme";

/** Browser UI colour (meta theme-color) for each theme. */
export const THEME_COLOR = { light: "#f4f2f8", dark: "#08070e" } as const;

/**
 * Favicon for the active theme. The two URLs live on <html> (data-favicon-light / -dark, set by
 * the root layout); exactly one <link id="rawin-favicon"> exists, created by the boot script
 * and swapped for a NEW element on every change. Browsers reliably re-read a newly inserted
 * icon link (an href edited in place is not always picked up), React never owns it, and no
 * type is declared, so uploaded WebP / ICO icons are not mislabelled. Its source text is inlined
 * in the boot script, so it must stay self-contained (no imports, closures or helpers).
 */
export function setThemeFavicon(doc: Document, theme: string) {
  const url = doc.documentElement.getAttribute("data-favicon-" + theme);
  if (!url || !doc.head) return;
  const links = doc.querySelectorAll('link[rel="icon"]');
  if (links.length === 1 && links[0].id === "rawin-favicon" && links[0].getAttribute("href") === url) return;
  const next = doc.createElement("link");
  next.id = "rawin-favicon";
  next.rel = "icon";
  next.setAttribute("href", url);
  for (let i = 0; i < links.length; i++) {
    const parent = links[i].parentNode;
    if (parent && parent.nodeName !== "NOSCRIPT") parent.removeChild(links[i]);
  }
  doc.head.appendChild(next);
}

/** The same function as source text, for the inline boot script (types are stripped here). */
export const SET_FAVICON_SOURCE = setThemeFavicon.toString();

/**
 * Points the favicon and theme-color meta at the given theme. The boot script runs the same
 * favicon step before paint.
 */
export function applyThemeIdentity(theme: ThemeName) {
  if (typeof document === "undefined") return;
  setThemeFavicon(document, theme);
  const meta = document.getElementById("rawin-theme-color");
  const color = meta?.getAttribute(`data-${theme}`);
  if (meta && color) meta.setAttribute("content", color);
}

/**
 * Device classes for the CMS theme defaults: below the md breakpoint (768px) is a
 * smartphone; tablets and wider use the desktop default. One query, shared by the pre-paint
 * script and the ThemeProvider, so the two can never disagree.
 */
export const THEME_MOBILE_QUERY = "(max-width: 767px)";

export type ThemeName = "light" | "dark";

export interface ThemeDefaults {
  desktop: ThemeName;
  mobile: ThemeName;
}

/** Shipped defaults: used when the CMS has none (or no CMS is reachable, e.g. global-error). */
export const FALLBACK_THEME_DEFAULTS: ThemeDefaults = { desktop: "dark", mobile: "light" };

/**
 * Blocking pre-paint script. Theme resolution, in order:
 *   1. the visitor's explicit choice (localStorage "rawin-theme": light | dark | system);
 *   2. otherwise the CMS default for the device class (THEME_MOBILE_QUERY), inlined here;
 *   3. otherwise the shipped fallback.
 * It writes data-theme + color-scheme to <html> before first paint (no flash of the wrong
 * theme), data-theme-pref ("default" while the visitor has not chosen) and the defaults
 * themselves (data-theme-defaults="desktop mobile") for the ThemeProvider to reuse. The
 * defaults never write to storage: a default is not a choice.
 * It also restores manual scroll restoration. The startup animation is decided by its own boot
 * script, which runs after this one (lib/startup/boot-script.ts), so the theme is settled first.
 */
export function buildThemeBootScript(defaults: ThemeDefaults = FALLBACK_THEME_DEFAULTS) {
  // only the two literal values can ever reach the inline script
  const desk = defaults.desktop === "light" ? "light" : "dark";
  const mob = defaults.mobile === "dark" ? "dark" : "light";
  return `(function(){try{var d=document.documentElement;var p=null;try{p=localStorage.getItem("${THEME_STORAGE_KEY}")}catch(e){}var mm=window.matchMedia;var def=(mm&&mm("${THEME_MOBILE_QUERY}").matches)?"${mob}":"${desk}";var m=p==="dark"||p==="light"?p:p==="system"?(mm&&mm("(prefers-color-scheme: dark)").matches?"dark":"light"):def;d.setAttribute("data-theme",m);d.setAttribute("data-theme-pref",(p==="dark"||p==="light"||p==="system")?p:"default");d.setAttribute("data-theme-defaults","${desk} ${mob}");d.style.colorScheme=m;(${SET_FAVICON_SOURCE})(document,m);var tc=document.getElementById("rawin-theme-color");if(tc){var tv=tc.getAttribute("data-"+m);if(tv)tc.setAttribute("content",tv)}}catch(e){}try{if("scrollRestoration" in history){history.scrollRestoration="manual"}window.scrollTo(0,0)}catch(e){}})();`;
}

/** The boot script with the shipped defaults (screens rendered without CMS access). */
export const themeBootScript = buildThemeBootScript();
