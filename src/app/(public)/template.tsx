"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";
import { EASE_EDITORIAL } from "@/lib/motion";

/**
 * Route entrance. Templates remount on navigation, giving every page a short,
 * deliberate arrival without delaying interaction (no exit hold).
 */
export default function PublicTemplate({ children }: { children: ReactNode }) {
  // Same markup on server and client (the server can't know the motion preference, so an
  // early bare-fragment return here caused a hydration mismatch); reduced motion just skips
  // the animation and settles the stage immediately.
  const reduced = useReducedMotion();
  return (
    <motion.div
      className="flex-1 flex flex-col"
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={reduced ? { duration: 0 } : { duration: 0.6, ease: EASE_EDITORIAL }}
      onAnimationComplete={() => {
        // Clear the transform so fixed/sticky descendants and glass snapshots resolve against the viewport
        const el = document.querySelector<HTMLElement>("[data-route-stage]");
        if (el) el.style.transform = "none";
      }}
      data-route-stage
    >
      {children}
    </motion.div>
  );
}
