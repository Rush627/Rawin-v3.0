"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useReducedMotionSafe } from "@/lib/useReducedMotionSafe";
import { EASE_EDITORIAL } from "@/lib/motion";

const DEFAULT_ROLES = ["Full Stack Developer", "Creative Technologies", "UI/UX Designer"];

/** Cycles the CMS role phrases through a vertical mask. Static list when motion is reduced. */
export default function RoleCycler({ phrases, className = "" }: { phrases?: string[]; className?: string }) {
  const roles = phrases && phrases.length ? phrases : DEFAULT_ROLES;
  const reduced = useReducedMotionSafe();
  const [i, setI] = useState(0);

  useEffect(() => {
    if (reduced || roles.length < 2) return;
    const t = window.setInterval(() => setI((v) => (v + 1) % roles.length), 2800);
    return () => window.clearInterval(t);
  }, [reduced, roles.length]);

  if (reduced) {
    return <span className={className}>{roles.join(" / ")}</span>;
  }

  return (
    // The mask is padded below (and pulled back with a negative margin) so descenders are not
    // shaved; long roles wrap instead of running past narrow cards.
    <span className={`relative inline-grid overflow-hidden align-bottom pb-[0.16em] -mb-[0.16em] ${className}`} aria-live="polite">
      <span className="sr-only">{roles.join(", ")}</span>
      {/* invisible sizers: the cell always fits the longest role, so the card never resizes */}
      {roles.map((r) => (
        <span key={`size-${r}`} aria-hidden="true" className="col-start-1 row-start-1 invisible whitespace-normal [text-wrap:balance]">
          {r}
        </span>
      ))}
      <AnimatePresence initial={false}>
        <motion.span
          key={roles[i]}
          aria-hidden="true"
          className="col-start-1 row-start-1 whitespace-normal [text-wrap:balance]"
          initial={{ y: "100%", opacity: 0 }}
          animate={{ y: "0%", opacity: 1 }}
          exit={{ y: "-100%", opacity: 0 }}
          transition={{ duration: 0.7, ease: EASE_EDITORIAL }}
        >
          {roles[i]}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}
