"use client";

import { motion, useInView } from "framer-motion";
import { useReducedMotionSafe } from "@/lib/useReducedMotionSafe";
import { Fragment, useEffect, useRef, type CSSProperties, type ReactNode } from "react";
import { EASE_EDITORIAL } from "@/lib/motion";

interface MaskTextProps {
  /** Each entry renders as one masked line. Use ReactNodes for mixed italic/roman lines. */
  lines: ReactNode[];
  className?: string;
  lineClassName?: string;
  delay?: number;
  stagger?: number;
  /** Animate on mount instead of on scroll-in */
  immediate?: boolean;
  as?: "h1" | "h2" | "h3" | "p" | "div";
  id?: string;
  /**
   * Phones (<640px): set the lines side by side as one unbroken line, sized to fit the
   * content width. `chars` (the heading's character count) gives a first-paint size close to
   * the final one; after fonts load the exact fit is measured, so CMS text of any length fits.
   */
  phoneInline?: { chars: number };
}

/**
 * Typography mask reveal: every line slides up from behind its own clip.
 * Text remains in the DOM (and accessible) from the first render.
 *
 * Visibility is observed on the unclipped heading element itself: each line starts
 * translated fully inside its own overflow clip, so observing the lines directly would
 * never report an intersection and the heading would stay hidden.
 */
export default function MaskText({
  lines,
  className,
  lineClassName = "",
  delay = 0,
  stagger = 0.09,
  immediate = false,
  as = "h2",
  phoneInline,
  id,
}: MaskTextProps) {
  const reduced = useReducedMotionSafe();
  const ref = useRef<HTMLElement | null>(null);
  const inView = useInView(ref, { once: true, amount: 0.25 });
  const Tag = as;
  const shown = immediate || inView;
  const inlinePhone = Boolean(phoneInline);

  // Exact fit on phones: shrink only if the estimated size still overflows the measure.
  useEffect(() => {
    if (!inlinePhone) return;
    const el = ref.current;
    if (!el) return;
    const mq = window.matchMedia("(max-width: 639px)");
    const fit = () => {
      el.style.removeProperty("font-size");
      if (!mq.matches) return;
      const sw = el.scrollWidth;
      const cw = el.clientWidth;
      if (cw > 0 && sw > cw + 0.5) {
        el.style.fontSize = `${(parseFloat(getComputedStyle(el).fontSize) * cw * 0.985) / sw}px`;
      }
    };
    fit();
    document.fonts?.ready.then(fit).catch(() => {});
    const ro = new ResizeObserver(fit);
    ro.observe(el.parentElement ?? el);
    mq.addEventListener("change", fit);
    return () => {
      ro.disconnect();
      mq.removeEventListener("change", fit);
      el.style.removeProperty("font-size");
    };
  }, [inlinePhone]);

  const style = phoneInline ? ({ "--fit-em": (phoneInline.chars * 0.335 + 0.3).toFixed(2) } as CSSProperties) : undefined;

  return (
    <Tag ref={ref as never} id={id} className={`${className ?? ""}${inlinePhone ? " heading-phone-line" : ""}`} style={style}>
      {lines.map((line, i) => (
        <Fragment key={i}>
          {/* word space between the side-by-side phone lines (collapses between block lines) */}
          {inlinePhone && i > 0 ? " " : null}
          {/* The clip is padded (and pulled back by equal negative margins, so layout is
              unchanged) to leave room for descenders and italic overhang: display type sets a
              line box (~0.9em) shorter than its glyphs, so a tight clip would shave the tail of
              a "g" or "q" and the slanted strokes. One-line phone titles use a tighter
              line height, so their clip gets more room on every side. */}
          <span
            className={`block overflow-hidden pb-[0.18em] -mb-[0.18em] pr-[0.12em] -mr-[0.12em] ${
              inlinePhone
                ? "max-sm:inline-block max-sm:align-bottom max-sm:pt-[0.12em] max-sm:-mt-[0.12em] max-sm:pb-[0.22em] max-sm:-mb-[0.22em] max-sm:pl-[0.06em] max-sm:-ml-[0.06em]"
                : ""
            }`}
          >
            {reduced ? (
              <span className={`block ${lineClassName}`}>{line}</span>
            ) : (
              <motion.span
                className={`block will-change-transform ${lineClassName}`}
                initial={{ y: "105%" }}
                animate={{ y: shown ? "0%" : "105%" }}
                transition={{ duration: 1.05, ease: EASE_EDITORIAL, delay: delay + i * stagger }}
              >
                {line}
              </motion.span>
            )}
          </span>
        </Fragment>
      ))}
    </Tag>
  );
}
