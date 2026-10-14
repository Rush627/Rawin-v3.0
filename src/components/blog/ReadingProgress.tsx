"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { motion, useScroll, useSpring } from "framer-motion";
import { useReducedMotionSafe } from "@/lib/useReducedMotionSafe";

/**
 * Reading progress for long-form articles: a spectral hairline at the top of the
 * viewport plus a small percentage marker that appears once reading begins.
 */
export default function ReadingProgress({ targetId }: { targetId: string }) {
  const reduced = useReducedMotionSafe();
  const targetRef = useRef<HTMLElement | null>(null);
  const [pct, setPct] = useState(0);

  // Resolve the article element before useScroll's own layout effect measures it
  useLayoutEffect(() => {
    targetRef.current = document.getElementById(targetId);
  }, [targetId]);

  const { scrollYProgress } = useScroll({ target: targetRef, offset: ["start 30%", "end end"] });
  const scaleX = useSpring(scrollYProgress, { stiffness: 140, damping: 30, mass: 0.4 });

  useEffect(() => scrollYProgress.on("change", (v) => setPct(Math.round(Math.min(1, Math.max(0, v)) * 100))), [scrollYProgress]);

  return (
    <>
      <motion.div
        aria-hidden="true"
        className="fixed left-0 right-0 top-0 z-[60] h-[2px] origin-left pointer-events-none"
        style={{ scaleX: reduced ? scrollYProgress : scaleX, background: "var(--spectrum)" }}
      />
      <div
        aria-hidden="true"
        className={`hidden md:flex fixed right-6 bottom-6 z-40 items-center gap-2 glass-fallback rounded-full h-10 px-4 label-mono text-fg transition-opacity duration-500 ${
          pct > 2 && pct < 100 ? "opacity-100" : "opacity-0"
        }`}
      >
        <span className="tabular-nums">{String(pct).padStart(2, "0")}%</span>
        <span className="text-fg-subtle">read</span>
      </div>
    </>
  );
}
