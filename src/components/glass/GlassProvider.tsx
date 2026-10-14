"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { LiquidGLOptions, LiquidGLLens } from "liquid-gl";

/**
 * Optical glass orchestration for LiquidGL.
 *
 * - Lazy-loads the library once (client only, never during SSR).
 * - Decides a capability tier from pointer, viewport, GPU and user preferences.
 * - Enforces a hard budget of live lenses per tier; extra requests stay on the
 *   designed CSS fallback (.glass-fallback).
 * - Lenses are created per component and destroyed on unmount, so route changes
 *   and StrictMode double-mounts release GPU resources.
 */

export type GlassTier = "none" | "lite" | "full";

const BUDGET: Record<GlassTier, number> = { none: 0, lite: 1, full: 3 };

type LiquidGLFn = (options?: LiquidGLOptions) => LiquidGLLens | LiquidGLLens[] | undefined;

interface GlassContextValue {
  tier: GlassTier;
  acquire: () => boolean;
  release: () => void;
  load: () => Promise<LiquidGLFn | null>;
}

const GlassContext = createContext<GlassContextValue | null>(null);

function hasGPU(): boolean {
  try {
    if (typeof navigator !== "undefined" && "gpu" in navigator) return true;
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl2") || canvas.getContext("webgl");
    const ok = Boolean(gl);
    (gl as WebGLRenderingContext | null)?.getExtension("WEBGL_lose_context")?.loseContext();
    return ok;
  } catch {
    return false;
  }
}

function resolveTier(): GlassTier {
  if (typeof window === "undefined") return "none";
  const mm = (q: string) => window.matchMedia?.(q).matches ?? false;
  if (mm("(prefers-reduced-transparency: reduce)")) return "none";
  if (new URLSearchParams(window.location.search).get("glass") === "off") return "none";
  if (window.innerWidth < 640) return "none";
  if (!hasGPU()) return "none";
  const finePointer = mm("(pointer: fine)") && mm("(hover: hover)");
  if (finePointer && window.innerWidth >= 1024) return "full";
  return "lite";
}

export function GlassProvider({ children }: { children: ReactNode }) {
  const [tier, setTier] = useState<GlassTier>("none");
  const activeRef = useRef(0);
  const libRef = useRef<Promise<LiquidGLFn | null> | null>(null);

  useEffect(() => {
    setTier(resolveTier());
    let timer: number | undefined;
    const onResize = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => setTier(resolveTier()), 250);
    };
    window.addEventListener("resize", onResize, { passive: true });
    return () => {
      window.removeEventListener("resize", onResize);
      window.clearTimeout(timer);
    };
  }, []);

  const acquire = useCallback(() => {
    if (activeRef.current >= BUDGET[tier]) return false;
    activeRef.current += 1;
    return true;
  }, [tier]);

  const release = useCallback(() => {
    activeRef.current = Math.max(0, activeRef.current - 1);
  }, []);

  const load = useCallback(() => {
    if (!libRef.current) {
      libRef.current = import("liquid-gl")
        .then((mod) => (mod.default as LiquidGLFn | undefined) ?? null)
        .catch(() => null);
    }
    return libRef.current;
  }, []);

  const value = useMemo(() => ({ tier, acquire, release, load }), [tier, acquire, release, load]);
  return <GlassContext.Provider value={value}>{children}</GlassContext.Provider>;
}

export function useGlass(): GlassContextValue {
  return (
    useContext(GlassContext) ?? {
      tier: "none",
      acquire: () => false,
      release: () => {},
      load: async () => null,
    }
  );
}
