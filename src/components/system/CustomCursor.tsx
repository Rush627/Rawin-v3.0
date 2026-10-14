"use client";

import { useEffect, useRef } from "react";

const INTERACTIVE = 'a[href], button:not(:disabled), [role="button"], select, label, summary, [data-clickable="true"]';
// Text entry keeps the native I-beam; disabled controls keep the native not-allowed cursor
const NATIVE =
  'input:not([type="checkbox"]):not([type="radio"]):not([type="range"]):not([type="button"]):not([type="submit"]):not([type="file"]), textarea, [contenteditable="true"], :disabled, [aria-disabled="true"]';

/**
 * RAWIN's directional chevron cursor, restored from the original site.
 * - Fine pointers only, never on touch; off under prefers-reduced-motion.
 * - Difference blending keeps it monochrome and legible on paper and ink alike.
 * - Position/rotation are written straight to the DOM; the rAF loop sleeps once settled,
 *   so an idle page costs nothing and React never re-renders on pointer movement.
 */
export default function CustomCursor() {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)");
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (!fine.matches || reduced.matches) return;

    const root = document.documentElement;
    root.classList.add("custom-cursor-active");

    let visible = false;
    let hidden = false; // over a native-cursor region
    let tx = -100, ty = -100, x = -100, y = -100, px = -100, py = -100;
    let targetAngle = -45, angle = -45, targetScale = 1, scale = 1;
    let raf = 0;

    const apply = () => {
      el.style.opacity = visible && !hidden ? "1" : "0";
      el.style.transform = `translate3d(${x - 12}px, ${y - 12}px, 0) rotate(${angle}deg) scale(${scale})`;
    };

    const tick = () => {
      raf = 0;
      x += (tx - x) * 0.3;
      y += (ty - y) * 0.3;
      let d = targetAngle - angle;
      while (d > 180) d -= 360;
      while (d < -180) d += 360;
      angle += d * 0.18;
      scale += (targetScale - scale) * 0.2;
      apply();
      const settled = Math.abs(tx - x) < 0.1 && Math.abs(ty - y) < 0.1 && Math.abs(d) < 0.1 && Math.abs(targetScale - scale) < 0.002;
      if (!settled) raf = requestAnimationFrame(tick);
    };
    const wake = () => {
      if (!raf) raf = requestAnimationFrame(tick);
    };

    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      if (!visible) {
        visible = true;
        x = tx = px = e.clientX;
        y = ty = py = e.clientY;
      }
      tx = e.clientX;
      ty = e.clientY;
      const dx = tx - px;
      const dy = ty - py;
      if (Math.hypot(dx, dy) >= 1.8) {
        targetAngle = (Math.atan2(dy, dx) * 180) / Math.PI;
        px = tx;
        py = ty;
      }
      const target = e.target as Element | null;
      hidden = Boolean(target?.closest?.(NATIVE));
      targetScale = target?.closest?.(INTERACTIVE) ? 1.25 : 1;
      wake();
    };
    const onLeave = () => {
      visible = false;
      apply();
    };
    const onDown = () => {
      targetScale = 0.85;
      wake();
    };
    const onUp = () => {
      targetScale = 1;
      wake();
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerdown", onDown, { passive: true });
    window.addEventListener("pointerup", onUp, { passive: true });
    root.addEventListener("pointerleave", onLeave);

    return () => {
      root.classList.remove("custom-cursor-active");
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
      root.removeEventListener("pointerleave", onLeave);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div
      ref={ref}
      data-custom-cursor="true"
      aria-hidden="true"
      className="fixed top-0 left-0 z-[9999] pointer-events-none opacity-0 will-change-transform"
      style={{ mixBlendMode: "difference", transition: "opacity 0.2s ease" }}
    >
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="w-6 h-6">
        <path
          d="M 20.2 11.2 Q 21.8 12 20.2 12.8 L 4.6 19.6 Q 3.6 20.2 4.4 18.8 L 8.5 13.2 Q 9.5 12 8.5 10.8 L 4.4 5.2 Q 3.6 3.8 4.6 4.4 Z"
          fill="#ffffff"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}
