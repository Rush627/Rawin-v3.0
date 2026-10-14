"use client";

import { useEffect, useRef, type ReactNode } from "react";

/**
 * Pauses the hero instrument's CSS motion while it is off screen: animations inside an SVG
 * repaint the whole drawing every frame, even when nobody can see it.
 */
export default function HeroMotion({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(([entry]) => {
      el.dataset.motion = entry.isIntersecting ? "on" : "off";
    });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <div ref={ref} className="an-hero-motion w-full">
      {children}
    </div>
  );
}
