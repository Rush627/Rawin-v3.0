"use client";

import type { ValueProposition } from "@/data/experience";
import Reveal from "@/components/system/Reveal";
import { useActiveItem } from "@/lib/useActiveItem";

/**
 * Manifesto rows: oversized index numerals, display title, italic tagline, body.
 * The numeral of the row being read lights in the accent as the reader scrolls (one shared
 * observer, see useActiveItem); the others stay as quiet outlines.
 */
export default function Principles({ items }: { items: ValueProposition[] }) {
  const { active, itemRef } = useActiveItem(items.length);
  return (
    <ol className="border-t border-line">
      {items.map((item, i) => (
        <Reveal as="li" key={item.title} delay={i * 0.04} className="border-b border-line" ref={itemRef(i)}>
          <div className="group grid grid-cols-12 gap-x-4 gap-y-3 py-7 sm:py-10 lg:py-12 items-baseline" data-active={active === i ? "" : undefined}>
            <span
              aria-hidden="true"
              className="principle-index col-span-3 sm:col-span-2 font-display text-[clamp(2.4rem,7vw,6.5rem)] leading-[0.8]"
            >
              {item.metric}
            </span>
            <div className="col-span-9 sm:col-span-10 lg:col-span-5">
              <h3 className="type-content lg:text-[clamp(2rem,4vw,3.6rem)] lg:leading-[0.95] text-fg">{item.title}</h3>
              <p className="mt-1.5 sm:mt-2 font-display italic text-[1.05rem] sm:text-xl text-accent">{item.tagline}</p>
            </div>
            <p className="col-span-12 sm:col-start-3 sm:col-span-10 lg:col-start-8 lg:col-span-5 text-[15px] sm:text-base text-fg-muted leading-relaxed">
              {item.description}
            </p>
          </div>
        </Reveal>
      ))}
    </ol>
  );
}
