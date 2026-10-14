"use client";

import { useEffect, useRef, useState } from "react";

interface TonalPortraitProps {
  src: string;
  alt: string;
  /** object-position focus, 0..1 */
  focusX?: number;
  focusY?: number;
  className?: string;
}

/**
 * Neutral grayscale tone curve (identical in both themes): a gentle S-curve that keeps
 * facial detail, lifts the deepest blacks slightly and never crushes shadows. R = G = B,
 * so no hue can enter the photograph.
 */
function buildLut(): Uint8ClampedArray {
  const lut = new Uint8ClampedArray(256);
  for (let i = 0; i < 256; i++) {
    const x = i / 255;
    const s = x * x * (3 - 2 * x);
    const t = s * 0.55 + x * 0.45;
    lut[i] = Math.round(10 + t * 235);
  }
  return lut;
}

/**
 * The hero portrait, converted to true black-and-white on a <canvas>.
 *
 * Why a canvas: LiquidGL builds its refraction texture with its own DOM rasteriser,
 * which does not apply CSS `filter` or `mix-blend-mode`. A CSS-graded <img> is
 * therefore sampled in full colour beneath the glass (the warm "smear"). Baking the
 * grade into canvas pixels makes what the lens refracts identical to what is shown.
 * The plain <img> remains as the SSR / no-JS / tainted-canvas fallback.
 */
export default function TonalPortrait({ src, alt, focusX = 0.5, focusY = 0.3, className = "" }: TonalPortraitProps) {
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    if (!wrap || !canvas) return;
    let cancelled = false;
    const img = new window.Image();
    img.decoding = "async";

    const paint = () => {
      if (cancelled || !img.naturalWidth) return;
      const rect = wrap.getBoundingClientRect();
      if (rect.width < 2 || rect.height < 2) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = Math.round(rect.width * dpr);
      const h = Math.round(rect.height * dpr);
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) return;
      // object-fit: cover with focus point
      const scale = Math.max(w / img.naturalWidth, h / img.naturalHeight);
      const dw = img.naturalWidth * scale;
      const dh = img.naturalHeight * scale;
      const dx = (w - dw) * focusX;
      const dy = (h - dh) * focusY;
      ctx.drawImage(img, dx, dy, dw, dh);
      try {
        const lut = buildLut();
        const data = ctx.getImageData(0, 0, w, h);
        const px = data.data;
        for (let i = 0; i < px.length; i += 4) {
          const l = Math.round(px[i] * 0.2126 + px[i + 1] * 0.7152 + px[i + 2] * 0.0722);
          const v = lut[l];
          px[i] = v;
          px[i + 1] = v;
          px[i + 2] = v;
        }
        ctx.putImageData(data, 0, 0);
        if (!cancelled) setReady(true);
      } catch {
        // Cross-origin asset: keep the CSS-graded <img> fallback.
        if (!cancelled) setReady(false);
      }
    };

    img.onload = paint;
    img.src = src;

    let t: number | undefined;
    const ro = new ResizeObserver(() => {
      window.clearTimeout(t);
      t = window.setTimeout(paint, 120);
    });
    ro.observe(wrap);

    return () => {
      cancelled = true;
      ro.disconnect();
      window.clearTimeout(t);
    };
  }, [src, focusX, focusY]);

  return (
    <div ref={wrapRef} className={`absolute inset-0 ${className}`}>
      {!ready && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={alt}
          fetchPriority="high"
          className="absolute inset-0 w-full h-full object-cover grayscale contrast-[1.12]"
          style={{ objectPosition: `${focusX * 100}% ${focusY * 100}%` }}
        />
      )}
      <canvas
        ref={canvasRef}
        role="img"
        aria-label={alt}
        aria-hidden={ready ? undefined : true}
        data-paint={ready ? "done" : "pending"}
        className={`absolute inset-0 w-full h-full ${ready ? "opacity-100" : "opacity-0"}`}
      />
    </div>
  );
}
