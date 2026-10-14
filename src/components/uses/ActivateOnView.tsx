"use client";

import { useEffect, useRef, type ReactNode } from "react";

type Tag = "div" | "ol" | "ul" | "section" | "dl";

/**
 * Marks elements as they reach the reading line: every descendant carrying `data-activate`
 * (and the wrapper itself, if it carries one) receives `data-on` once, and the CSS takes it
 * from there. One IntersectionObserver per group, attributes set directly on the elements, so
 * scrolling never re-renders React. Content never depends on this: the CSS only brightens
 * nodes and draws connectors that are already legible without it.
 */
export default function ActivateOnView({
  as = "div",
  className,
  children,
  rootMargin = "0px 0px -18% 0px",
  ...rest
}: {
  as?: Tag;
  className?: string;
  children: ReactNode;
  rootMargin?: string;
  "aria-label"?: string;
  "data-activate"?: string;
  style?: React.CSSProperties;
}) {
  const ref = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    const targets = [
      ...(root.hasAttribute("data-activate") ? [root] : []),
      ...Array.from(root.querySelectorAll<HTMLElement>("[data-activate]")),
    ];
    if (!targets.length) return;
    if (typeof IntersectionObserver === "undefined") {
      targets.forEach((t) => t.setAttribute("data-on", ""));
      return;
    }
    const io = new IntersectionObserver(
      (records) => {
        for (const r of records) {
          if (!r.isIntersecting) continue;
          r.target.setAttribute("data-on", "");
          io.unobserve(r.target);
        }
      },
      { rootMargin }
    );
    targets.forEach((t) => io.observe(t));
    return () => io.disconnect();
  }, [rootMargin]);

  const Comp = as;
  return (
    <Comp ref={ref as never} className={className} {...rest}>
      {children}
    </Comp>
  );
}
