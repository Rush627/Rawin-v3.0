"use client";

import Reveal from "@/components/system/Reveal";
import { useActiveItem } from "@/lib/useActiveItem";

interface Principle {
  number?: string;
  title: string;
  statement: string;
}

/**
 * "How I build" principles. The numeral of the principle being read lights in the accent as
 * the reader scrolls, in either direction (one shared observer, see useActiveItem). On the
 * two-column grid (md+) a row is read as one, so both numerals of the active row light.
 * Only colour/stroke change, so the layout never shifts.
 */
export default function PrinciplesList({ principles, titles }: { principles: Principle[]; titles: string[] }) {
  const { active, itemRef } = useActiveItem(principles.length);
  const activeRow = active < 0 ? -1 : Math.floor(active / 2);
  return (
    <ol className="grid grid-cols-1 md:grid-cols-2 border-t border-line">
      {principles.map((p, i) => (
        <Reveal
          as="li"
          key={p.number || i}
          ref={itemRef(i)}
          delay={(i % 2) * 0.06}
          className={`about-principle group relative py-7 sm:py-12 lg:py-14 border-b border-line md:px-8 ${i % 2 === 0 ? "md:border-r md:pl-0" : "md:pr-0"}`}
        >
          <div
            className="flex items-baseline justify-between gap-6"
            data-active={active === i ? "" : undefined}
            data-row-active={activeRow === Math.floor(i / 2) ? "" : undefined}
          >
            <span className="label-mono text-fg-subtle">{titles[i]}</span>
            <span aria-hidden="true" className="about-principle-num font-display text-[clamp(2.4rem,7vw,6rem)] leading-[0.75]">
              {p.number || String(i + 1).padStart(2, "0")}
            </span>
          </div>
          <p className="mt-4 sm:mt-6 type-content lg:text-[clamp(1.9rem,3.4vw,3rem)] text-fg max-w-[18ch]">{p.statement}</p>
        </Reveal>
      ))}
    </ol>
  );
}
