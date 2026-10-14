"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Which item of a list is "being read": the latest item to reach a reading band across the
 * viewport (by default 40%–50% from the top), i.e. an item takes over as soon as its top
 * crosses the band, in either scroll direction. One IntersectionObserver serves the whole
 * list (no scroll listener), React state changes only when the active item changes, and
 * when no item is in the band the last active one stays lit, so it never flickers between
 * neighbours or goes dark in the gaps. Works the same scrolling up or down.
 *
 * Usage: const { active, itemRef } = useActiveItem(items.length);  <li ref={itemRef(i)} />
 */
export function useActiveItem(count: number, band: { top: number; bottom: number } = { top: 0.4, bottom: 0.5 }) {
  const [active, setActive] = useState(-1);
  const els = useRef<(Element | null)[]>([]);
  const refs = useRef<((el: Element | null) => void)[]>([]);

  const itemRef = useCallback((i: number) => {
    if (!refs.current[i]) {
      refs.current[i] = (el: Element | null) => {
        els.current[i] = el;
      };
    }
    return refs.current[i];
  }, []);

  useEffect(() => {
    const nodes = els.current.slice(0, count).filter((n): n is Element => Boolean(n));
    if (!nodes.length || typeof IntersectionObserver === "undefined") return;
    const inBand = new Set<number>();
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          const i = els.current.indexOf(e.target);
          if (i < 0) continue;
          if (e.isIntersecting) inBand.add(i);
          else inBand.delete(i);
        }
        if (inBand.size) {
          const next = Math.max(...inBand);
          setActive((prev) => (prev === next ? prev : next));
        }
      },
      { rootMargin: `-${band.top * 100}% 0px -${(1 - band.bottom) * 100}% 0px`, threshold: 0 },
    );
    nodes.forEach((n) => io.observe(n));
    return () => io.disconnect();
  }, [count, band.top, band.bottom]);

  return { active, itemRef };
}
