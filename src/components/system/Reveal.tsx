"use client";

import { motion } from "framer-motion";
import { useReducedMotionSafe } from "@/lib/useReducedMotionSafe";
import type { ReactNode, Ref } from "react";
import { DURATION, EASE_EDITORIAL } from "@/lib/motion";

type RevealTag = "div" | "section" | "article" | "li" | "header" | "aside" | "figure" | "p" | "span";

interface RevealProps {
  children: ReactNode;
  as?: RevealTag;
  className?: string;
  delay?: number;
  /** Vertical travel in px */
  y?: number;
  /** Viewport amount before triggering */
  amount?: number;
  id?: string;
  /** Forwarded to the rendered element (React 19: ref is a plain prop) */
  ref?: Ref<HTMLElement>;
}

/** Scroll-triggered entrance: short rise + fade on the editorial curve. Runs once. */
export default function Reveal({ children, as = "div", className, delay = 0, y = 28, amount = 0.2, id, ref }: RevealProps) {
  const reduced = useReducedMotionSafe();
  const Comp = motion[as];

  if (reduced) {
    const Static = as;
    return (
      <Static ref={ref as never} className={className} id={id}>
        {children}
      </Static>
    );
  }

  return (
    <Comp
      ref={ref as never}
      id={id}
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount }}
      transition={{ duration: DURATION.slow, ease: EASE_EDITORIAL, delay }}
    >
      {children}
    </Comp>
  );
}
