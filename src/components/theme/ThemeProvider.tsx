"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { flushSync } from "react-dom";
import { FALLBACK_THEME_DEFAULTS, THEME_MOBILE_QUERY, THEME_STORAGE_KEY, applyThemeIdentity } from "./theme-script";

/** "default": the visitor has not chosen; the CMS default for their device class applies. */
export type ThemePreference = "light" | "dark" | "system" | "default";
export type ResolvedTheme = "light" | "dark";

interface ThemeContextValue {
  preference: ThemePreference;
  resolved: ResolvedTheme;
  setPreference: (next: ThemePreference, origin?: { x: number; y: number }) => void;
  toggle: (origin?: { x: number; y: number }) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export const THEME_CHANGE_EVENT = "rawin:themechange";

function systemTheme(): ResolvedTheme {
  if (typeof window === "undefined" || !window.matchMedia) return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function readPreference(): ThemePreference {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (stored === "light" || stored === "dark" || stored === "system") return stored;
  } catch {
    // storage unavailable
  }
  return "default";
}

/** The CMS default for this device class, as the pre-paint script inlined it on <html>. */
function defaultTheme(): ResolvedTheme {
  const [desk, mob] = (document.documentElement.getAttribute("data-theme-defaults") || "").split(" ");
  const mobile = window.matchMedia?.(THEME_MOBILE_QUERY).matches ?? false;
  const v = mobile ? mob : desk;
  return v === "light" || v === "dark" ? v : mobile ? FALLBACK_THEME_DEFAULTS.mobile : FALLBACK_THEME_DEFAULTS.desktop;
}

function resolve(pref: ThemePreference): ResolvedTheme {
  return pref === "system" ? systemTheme() : pref === "default" ? defaultTheme() : pref;
}

function applyTheme(resolved: ResolvedTheme, preference: ThemePreference) {
  const root = document.documentElement;
  root.setAttribute("data-theme", resolved);
  root.setAttribute("data-theme-pref", preference);
  root.style.colorScheme = resolved;
  applyThemeIdentity(resolved);
  window.dispatchEvent(new CustomEvent(THEME_CHANGE_EVENT, { detail: { resolved } }));
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  // Initial values mirror what the boot script already applied to <html>.
  const [preference, setPreferenceState] = useState<ThemePreference>("default");
  const [resolved, setResolved] = useState<ResolvedTheme>("light");

  useEffect(() => {
    const pref = readPreference();
    const attr = document.documentElement.getAttribute("data-theme");
    setPreferenceState(pref);
    setResolved(attr === "dark" || attr === "light" ? attr : resolve(pref));
  }, []);

  // No choice made: follow the device-class default across the phone/desktop breakpoint
  // (a window resized past 768px, a tablet rotated). An explicit choice is never touched.
  useEffect(() => {
    if (preference !== "default" || !window.matchMedia) return;
    const mq = window.matchMedia(THEME_MOBILE_QUERY);
    const onChange = () => {
      const next = defaultTheme();
      setResolved(next);
      if (document.documentElement.getAttribute("data-theme") !== next) applyTheme(next, "default");
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [preference]);

  // Follow the OS while the preference is "system"
  useEffect(() => {
    if (preference !== "system" || !window.matchMedia) return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => {
      const next = mq.matches ? "dark" : "light";
      setResolved(next);
      applyTheme(next, "system");
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [preference]);

  const setPreference = useCallback((next: ThemePreference, origin?: { x: number; y: number }) => {
    const nextResolved: ResolvedTheme = resolve(next);
    try {
      // a choice is remembered; going back to "default" forgets it
      if (next === "default") localStorage.removeItem(THEME_STORAGE_KEY);
      else localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      // storage unavailable — preference still applies for this session
    }

    const commit = () => {
      flushSync(() => {
        setPreferenceState(next);
        setResolved(nextResolved);
      });
      applyTheme(nextResolved, next);
    };

    const root = document.documentElement;
    const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    const doc = document as Document & {
      startViewTransition?: (cb: () => void) => { ready: Promise<void> };
    };

    if (!reduced && typeof doc.startViewTransition === "function" && origin) {
      const { x, y } = origin;
      const radius = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y));
      const transition = doc.startViewTransition(commit);
      transition.ready
        .then(() => {
          root.animate(
            { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${radius}px at ${x}px ${y}px)`] },
            { duration: 640, easing: "cubic-bezier(0.2, 0.7, 0.1, 1)", pseudoElement: "::view-transition-new(root)" }
          );
        })
        .catch(() => {});
      return;
    }

    if (!reduced) {
      root.classList.add("theme-switching");
      window.setTimeout(() => root.classList.remove("theme-switching"), 460);
    }
    commit();
  }, []);

  const toggle = useCallback(
    (origin?: { x: number; y: number }) => {
      setPreference(resolved === "dark" ? "light" : "dark", origin);
    },
    [resolved, setPreference]
  );

  const value = useMemo(() => ({ preference, resolved, setPreference, toggle }), [preference, resolved, setPreference, toggle]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    return {
      preference: "system",
      resolved: "light",
      setPreference: () => {},
      toggle: () => {},
    };
  }
  return ctx;
}
