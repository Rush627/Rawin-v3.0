"use client";

import { useState } from "react";
import { BUNDLED } from "@/lib/brand-assets";

export interface StudioBrandConfig {
  /** The same Global → Header brand choice the public header uses */
  mode: "wordmark" | "logo";
  logos: { light: { url: string; alt?: string }; dark: { url: string; alt?: string } };
}

/**
 * Studio identity. Follows the CMS Header brand setting: the typographic RAWIN wordmark, or the
 * theme's logo image (both variants are in the markup and the active theme's stylesheet shows
 * one, so a theme switch never flashes the wrong one). A logo that fails to load falls back to
 * the bundled artwork for that theme, then to the wordmark; never a broken image.
 */
export default function StudioBrand({ brand, compact = false }: { brand: StudioBrandConfig; compact?: boolean }) {
  const [failed, setFailed] = useState<{ light: number; dark: number }>({ light: 0, dark: 0 });
  const fail = (v: "light" | "dark") => setFailed((f) => ({ ...f, [v]: f[v] + 1 }));
  // An image that failed before hydration never reports onError to React: check on mount too
  const watch = (v: "light" | "dark") => (el: HTMLImageElement | null) => {
    if (el && el.complete && el.naturalWidth === 0) queueMicrotask(() => fail(v));
  };
  const descriptor = (
    <span className="label-mono text-fg-subtle text-[10px] tracking-[0.22em] leading-none">Studio</span>
  );

  if (brand.mode === "logo" && failed.light < 2 && failed.dark < 2) {
    const src = (v: "light" | "dark") => (failed[v] === 0 ? brand.logos[v].url : v === "light" ? BUNDLED.logoLight : BUNDLED.logoDark);
    const alt = brand.logos.light.alt || brand.logos.dark.alt || "RAWIN";
    // Same footprint as the typographic "RAWIN" below (em of its font size), fitted inside
    return (
      <span className="inline-flex items-center gap-3 min-w-0">
        <span className={`inline-flex items-center w-[5.4em] h-[1.15em] ${compact ? "text-[0.8rem]" : "text-[0.86rem]"}`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img key={src("light")} ref={watch("light")} src={src("light")} alt={alt} className="w-full h-full object-contain object-left dark:hidden" decoding="async" onError={() => fail("light")} />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img key={src("dark")} ref={watch("dark")} src={src("dark")} alt={alt} className="w-full h-full object-contain object-left hidden dark:block" decoding="async" onError={() => fail("dark")} />
        </span>
        <span aria-hidden="true" className="w-px h-3.5 bg-line-strong" />
        {descriptor}
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-3 select-none">
      <span className={`font-sans font-semibold tracking-[0.32em] leading-none text-fg ${compact ? "text-[0.8rem]" : "text-[0.86rem]"}`}>RAWIN</span>
      <span aria-hidden="true" className="w-px h-3.5 bg-line-strong" />
      {descriptor}
    </span>
  );
}
