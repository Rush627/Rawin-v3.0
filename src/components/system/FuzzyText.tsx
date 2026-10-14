"use client";

import { useEffect, useRef } from "react";
import { THEME_CHANGE_EVENT } from "@/components/theme/ThemeProvider";

interface FuzzyTextProps {
  children: string;
  /** CSS font-size (any unit) */
  fontSize?: string;
  fontWeight?: number | string;
  /** CSS font-family; defaults to the display face */
  fontFamily?: string;
  /** CSS colour or custom property, resolved against the active theme */
  color?: string;
  baseIntensity?: number;
  hoverIntensity?: number;
  /** Maximum horizontal displacement in CSS px */
  fuzzRange?: number;
  fps?: number;
  className?: string;
}

/**
 * RAWIN's signature fuzzy status type (restored from the original error screens).
 * Each scanline of the rasterised text is displaced horizontally at random, so the
 * glyphs look softly unstable; hovering intensifies the drift. Theme-aware, DPR-sharp,
 * paused while the tab is hidden, and static under prefers-reduced-motion.
 */
export default function FuzzyText({
  children,
  fontSize = "clamp(5rem, 22vw, 15rem)",
  fontWeight = 400,
  fontFamily = "var(--font-display)",
  color = "var(--fg)",
  baseIntensity = 0.16,
  hoverIntensity = 0.5,
  fuzzRange = 26,
  fps = 40,
  className = "",
}: FuzzyTextProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let cancelled = false;
    let raf = 0;
    let hovering = false;
    let teardown: (() => void) | null = null;
    const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;

    const resolve = () => {
      const probe = document.createElement("span");
      probe.style.cssText = `position:absolute;visibility:hidden;font-size:${fontSize};font-weight:${fontWeight};font-family:${fontFamily};color:${color}`;
      document.body.appendChild(probe);
      const cs = getComputedStyle(probe);
      const out = { size: parseFloat(cs.fontSize) || 120, family: cs.fontFamily, color: cs.color };
      probe.remove();
      return out;
    };

    const init = async () => {
      teardown?.();
      const { size, family, color: fill } = resolve();
      const font = `${fontWeight} ${size}px ${family}`;
      try {
        await document.fonts.load(font, children);
      } catch {
        // fall back to whatever is loaded
      }
      if (cancelled) return;

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const off = document.createElement("canvas");
      const octx = off.getContext("2d")!;
      octx.font = font;
      const m = octx.measureText(children);
      const ascent = Math.ceil(m.actualBoundingBoxAscent || size * 0.8);
      const descent = Math.ceil(m.actualBoundingBoxDescent || size * 0.2);
      const left = Math.ceil(m.actualBoundingBoxLeft || 0);
      const textW = Math.ceil(left + (m.actualBoundingBoxRight || m.width)) + 8;
      const textH = ascent + descent;
      off.width = Math.ceil(textW * dpr);
      off.height = Math.ceil(textH * dpr);
      octx.scale(dpr, dpr);
      octx.font = font;
      octx.fillStyle = fill;
      octx.fillText(children, 4 + left, ascent);

      const margin = fuzzRange + 8;
      canvas.width = Math.ceil((textW + margin * 2) * dpr);
      canvas.height = off.height;
      canvas.style.width = `${textW + margin * 2}px`;
      canvas.style.aspectRatio = `${textW + margin * 2} / ${textH}`;
      const ox = margin * dpr;

      if (reduced) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(off, ox, 0);
        return;
      }

      let intensity = baseIntensity;
      let last = 0;
      const gap = 1000 / fps;
      const rows = off.height;
      const run = (t: number) => {
        raf = 0;
        if (cancelled) return;
        if (document.hidden) return;
        if (t - last >= gap) {
          last = t;
          const target = hovering ? hoverIntensity : baseIntensity;
          intensity += (target - intensity) * 0.12;
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          const range = fuzzRange * dpr * intensity;
          for (let y = 0; y < rows; y++) {
            const dx = Math.round((Math.random() - 0.5) * range);
            ctx.drawImage(off, 0, y, off.width, 1, ox + dx, y, off.width, 1);
          }
        }
        raf = requestAnimationFrame(run);
      };
      raf = requestAnimationFrame(run);

      const onVis = () => {
        if (!document.hidden && !raf) raf = requestAnimationFrame(run);
      };
      const enter = () => (hovering = true);
      const leave = () => (hovering = false);
      document.addEventListener("visibilitychange", onVis);
      canvas.addEventListener("pointerenter", enter);
      canvas.addEventListener("pointerleave", leave);
      teardown = () => {
        cancelAnimationFrame(raf);
        raf = 0;
        document.removeEventListener("visibilitychange", onVis);
        canvas.removeEventListener("pointerenter", enter);
        canvas.removeEventListener("pointerleave", leave);
      };
    };

    let resizeTimer: number | undefined;
    const onResize = () => {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(init, 160);
    };
    window.addEventListener("resize", onResize);
    window.addEventListener(THEME_CHANGE_EVENT, init);
    init();

    return () => {
      cancelled = true;
      teardown?.();
      window.clearTimeout(resizeTimer);
      window.removeEventListener("resize", onResize);
      window.removeEventListener(THEME_CHANGE_EVENT, init);
    };
  }, [children, fontSize, fontWeight, fontFamily, color, baseIntensity, hoverIntensity, fuzzRange, fps]);

  return (
    <span className={`relative inline-flex max-w-full ${className}`}>
      <span className="sr-only">{children}</span>
      <canvas ref={canvasRef} aria-hidden="true" className="block max-w-full h-auto" />
    </span>
  );
}
