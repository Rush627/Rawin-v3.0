"use client";

import type { TimelineItem } from "@/data/experience";
import Reveal from "@/components/system/Reveal";
import { useActiveItem } from "@/lib/useActiveItem";

/**
 * Ruled chronology with sticky period markers on large screens.
 *
 * Below lg the record is one continuous timeline under its section title: a hairline rail
 * with a node per entry ties every entry to "A record of practice"; each entry opens with a
 * quiet mono line (number · period) rather than a display-size date, so the role title is
 * the strongest line of the entry and the supporting copy sits clearly beneath it. The
 * node of the entry being read fills with the accent as the reader scrolls (one shared
 * observer, see useActiveItem).
 */
export default function Chronology({ items }: { items: TimelineItem[] }) {
  const { active, itemRef } = useActiveItem(items.length);
  return (
    <ol className="relative pl-6 sm:pl-8 lg:pl-0">
      {/* the rail (phones & tablets): runs from the first node to the last entry */}
      <span aria-hidden="true" className="lg:hidden absolute left-[3px] top-[0.55rem] bottom-6 w-px bg-line-strong" />
      {items.map((item, i) => {
        const parts = item.period.split(/\s*-\s*/);
        return (
          <Reveal
            as="li"
            key={item.period}
            ref={itemRef(i)}
            className="relative grid grid-cols-12 gap-x-4 lg:gap-x-10 lg:border-t lg:border-line pt-0 pb-10 sm:pb-12 lg:py-14 last:pb-0 lg:last:pb-14"
          >
            {/* rail node */}
            <span
              aria-hidden="true"
              data-active={active === i ? "" : undefined}
              className="timeline-node lg:hidden absolute -left-6 sm:-left-8 top-[0.3rem] w-[7px] h-[7px] rounded-full"
            />
            <div className="col-span-12 lg:col-span-4 mb-2.5 lg:mb-0">
              <div className="flex items-baseline gap-2.5 lg:block lg:sticky lg:top-28">
                <span className="font-mono text-[11px] text-accent lg:text-fg-subtle">{String(i + 1).padStart(2, "0")}</span>
                <span aria-hidden="true" className="lg:hidden h-px w-4 bg-line-strong self-center" />
                {/* (utilities rather than .label-mono, which is unlayered and would override the lg: display style) */}
                <p className="font-mono text-[11px] leading-[1.2] tracking-[0.14em] uppercase text-fg-muted lg:mt-1.5 lg:font-display lg:normal-case lg:tracking-[-0.02em] lg:text-[clamp(1.85rem,4vw,3.4rem)] lg:leading-none lg:text-fg">
                  {parts.map((part, idx, arr) => (
                    <span key={idx} className={idx === arr.length - 1 && arr.length > 1 ? "lg:italic lg:text-accent" : ""}>
                      {part}
                      {idx < arr.length - 1 && <span className="text-fg-subtle"> — </span>}
                    </span>
                  ))}
                </p>
              </div>
            </div>
            <div className="col-span-12 lg:col-span-8">
              <p className="label-mono text-fg-subtle lg:text-fg-muted">{item.companyOrContext}</p>
              <h3 className="mt-1.5 sm:mt-2 lg:mt-3 text-[1.2rem] sm:text-[1.5rem] lg:text-[1.75rem] leading-[1.25] lg:leading-snug font-medium tracking-[-0.02em] text-fg text-balance">
                {item.role}
              </h3>
              <p className="mt-2.5 sm:mt-3 lg:mt-4 text-[15px] sm:text-base text-fg-muted leading-relaxed max-w-[62ch]">{item.description}</p>
              <ul className="mt-4 sm:mt-5 lg:mt-6 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2 lg:gap-y-0">
                {item.highlights.map((h) => (
                  <li key={h} className="flex gap-3 lg:py-3 lg:border-t lg:border-line text-[14px] leading-relaxed lg:leading-normal text-fg">
                    <span aria-hidden="true" className="mt-[0.7em] lg:mt-[0.55em] w-3 h-px bg-accent shrink-0" />
                    <span>{h}</span>
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        );
      })}
    </ol>
  );
}
