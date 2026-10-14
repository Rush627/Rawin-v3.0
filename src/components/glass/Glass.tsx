"use client";

import { useEffect, useId, useRef, useState, type CSSProperties, type ReactNode } from "react";
import type { LiquidGLLens, LiquidGLOptions } from "liquid-gl";
import { useGlass } from "./GlassProvider";
import { THEME_CHANGE_EVENT } from "@/components/theme/ThemeProvider";
import { installRenderGate } from "./render-gate";

// One render gate for the shared LiquidGL renderer, alive while any lens is live.
let liveLenses = 0;
let gateTeardown: (() => void) | null = null;

export type GlassPreset = "card" | "pill" | "orb" | "lens";

const PRESETS: Record<GlassPreset, Partial<LiquidGLOptions>> = {
  card: { refraction: 0.02, bevelDepth: 0.1, bevelWidth: 0.22, frost: 3, magnify: 1.02 },
  pill: { refraction: 0.014, bevelDepth: 0.08, bevelWidth: 0.34, frost: 2.5, magnify: 1 },
  orb: { refraction: 0.03, bevelDepth: 0.14, bevelWidth: 0.5, frost: 0, magnify: 1.08 },
  lens: { refraction: 0.04, bevelDepth: 0.12, bevelWidth: 0.4, frost: 0, magnify: 1.15, aberration: 0.4 },
};

interface GlassProps {
  children?: ReactNode;
  className?: string;
  style?: CSSProperties;
  preset?: GlassPreset;
  /** CSS selector of a NON-fixed ancestor region to refract. Keep it small (e.g. the hero). */
  snapshot: string;
  /** Pointer tilt on fine pointers (ignored on touch tier) */
  tilt?: boolean;
  /** Fluid ripple interaction on fine pointers */
  fluid?: boolean;
  as?: "div" | "aside" | "figure";
  /** Delay (ms) before snapshotting — let entrance animations settle first */
  delay?: number;
  "aria-label"?: string;
  role?: string;
  /**
   * false = reliable CSS frosted glass only (no LiquidGL lens). Used where a live
   * snapshot-based lens is not dependable, e.g. the hero cards over moving content.
   */
  optical?: boolean;
}

/**
 * Opt-in optical glass. Renders the designed CSS fallback immediately; upgrades to a
 * LiquidGL lens when the device tier and lens budget allow. Recreated on theme change
 * because LiquidGL snapshots are static.
 */
export default function Glass({
  children,
  className = "",
  style,
  preset = "card",
  snapshot,
  tilt = false,
  fluid = false,
  as = "div",
  delay = 0,
  optical = true,
  ...aria
}: GlassProps) {
  const { tier, acquire, release, load } = useGlass();
  const id = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const [live, setLive] = useState(false);
  const [themeKey, setThemeKey] = useState(0);
  const lensRef = useRef<LiquidGLLens | null>(null);

  useEffect(() => {
    const onTheme = () => setThemeKey((k) => k + 1);
    window.addEventListener(THEME_CHANGE_EVENT, onTheme);
    return () => window.removeEventListener(THEME_CHANGE_EVENT, onTheme);
  }, []);

  useEffect(() => {
    if (!optical || tier === "none") return;
    if (!document.querySelector(snapshot)) return;
    if (!acquire()) return;

    let cancelled = false;
    const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
    const isDark = document.documentElement.getAttribute("data-theme") === "dark";
    const fine = tier === "full";

    const settle = async () => {
      if (delay > 0) await new Promise((r) => window.setTimeout(r, delay));
      try {
        await document.fonts?.ready;
        const region = document.querySelector(snapshot);
        const imgs = region ? Array.from(region.querySelectorAll("img")) : [];
        await Promise.all(imgs.map((img) => (img.complete ? Promise.resolve() : img.decode().catch(() => {}))));
        // Canvases that paint asynchronously (e.g. the toned portrait) flag data-paint="pending"
        // until drawn; snapshotting earlier would refract an empty plate.
        for (let i = 0; i < 40 && region?.querySelector('canvas[data-paint="pending"]'); i++) {
          await new Promise((r) => window.setTimeout(r, 100));
        }
      } catch {
        // proceed regardless
      }
      return load();
    };

    settle().then((liquidGL) => {
      if (cancelled || !liquidGL) return;
      try {
        const result = liquidGL({
          target: `[data-rawin-glass="${id}"]`,
          snapshot,
          resolution: fine ? 1.5 : 1,
          // Keep panel content as live DOM above the lens. LiquidGL's default rasterises the
          // target's children into the GL layer, which freezes text and garbles animated copy.
          content: false,
          shadow: true,
          specular: true,
          reveal: reduced ? "none" : "fade",
          tilt: fine && tilt && !reduced,
          tiltFactor: 4,
          interaction: fine && fluid && !reduced ? "fluid" : "none",
          interactionStrength: 0.35,
          // Frosted body keeps text legible over the dark portrait; refraction lives in the bevel.
          tint: isDark ? "rgba(14, 14, 16, 0.5)" : "rgba(250, 248, 243, 0.6)",
          ...PRESETS[preset],
          on: {
            init: () => {
              if (cancelled) return;
              setLive(true);
              if (!gateTeardown) gateTeardown = installRenderGate(snapshot);
            },
          },
        });
        const lens = Array.isArray(result) ? result[0] : result;
        if (!lens) return;
        if (cancelled) {
          lens.destroy();
          return;
        }
        lensRef.current = lens;
        liveLenses += 1;
      } catch (err) {
        console.warn("[RAWIN Glass] LiquidGL unavailable, using CSS fallback.", err);
      }
    });

    return () => {
      cancelled = true;
      setLive(false);
      if (lensRef.current) {
        liveLenses = Math.max(0, liveLenses - 1);
        if (liveLenses === 0) {
          gateTeardown?.();
          gateTeardown = null;
        }
      }
      try {
        lensRef.current?.destroy();
      } catch {
        // already torn down
      }
      lensRef.current = null;
      release();
    };
  }, [optical, tier, snapshot, preset, tilt, fluid, id, themeKey, delay, acquire, release, load]);

  const Tag = as;
  return (
    <Tag
      data-rawin-glass={id}
      data-glass-live={live ? "true" : undefined}
      className={`${!optical ? "glass-frost" : live ? "glass-live" : "glass-fallback"} ${className}`}
      style={style}
      {...aria}
    >
      {children}
    </Tag>
  );
}
