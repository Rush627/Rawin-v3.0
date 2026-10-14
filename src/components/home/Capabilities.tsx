import type { TechCategory } from "@/data/techArsenal";
import Reveal from "@/components/system/Reveal";

/**
 * Capabilities as a technical specification sheet: four ruled columns on desktop,
 * a 2×2 sheet on tablet, and native disclosure groups on phones.
 */
export default function Capabilities({ categories }: { categories: TechCategory[] }) {
  return (
    <>
      {/* Tablet + desktop sheet */}
      <div className="hidden md:grid md:grid-cols-2 xl:grid-cols-4 border-t border-line">
        {categories.map((cat, ci) => (
          <Reveal
            key={cat.title}
            delay={ci * 0.06}
            className={`flex flex-col gap-6 py-8 md:px-6 xl:px-7 border-b border-line ${ci % 2 === 0 ? "md:border-r" : ""} xl:border-r ${
              ci === categories.length - 1 ? "xl:border-r-0" : ""
            } first:md:pl-0`}
          >
            <div className="flex items-center justify-between">
              <span className="font-mono text-[11px] text-accent">{String(ci + 1).padStart(2, "0")}</span>
              <span className="label-mono text-fg-subtle">{cat.badge}</span>
            </div>
            <div>
              <h3 className="type-content md:text-[2rem] text-fg">{cat.title}</h3>
              <p className="mt-3 text-sm text-fg-muted leading-relaxed">{cat.description}</p>
            </div>
            <ul className="flex flex-col">
              {cat.items.map((item) => (
                <li key={item.name} className="group py-3 border-t border-line first:border-t-0">
                  <div className="flex items-baseline justify-between gap-3">
                    <span className={`text-[14px] ${item.highlight ? "text-fg font-medium" : "text-fg"}`}>
                      {item.highlight && <span className="inline-block w-1.5 h-1.5 rounded-full bg-accent mr-2 align-middle" />}
                      {item.name}
                    </span>
                    <span className="font-mono text-[10px] uppercase tracking-wider text-fg-subtle shrink-0">{item.level}</span>
                  </div>
                  <p className="mt-1 text-[12.5px] text-fg-subtle leading-snug">{item.description}</p>
                </li>
              ))}
            </ul>
          </Reveal>
        ))}
      </div>

      {/* Phone disclosure */}
      <div className="md:hidden border-t border-line">
        {categories.map((cat, ci) => (
          <details key={cat.title} className="group border-b border-line" open={ci === 0}>
            <summary className="flex items-center justify-between gap-4 py-5 cursor-pointer list-none [&::-webkit-details-marker]:hidden">
              <span className="flex items-baseline gap-3">
                <span className="font-mono text-[11px] text-accent">{String(ci + 1).padStart(2, "0")}</span>
                <span className="type-content text-fg">{cat.title}</span>
              </span>
              <span
                aria-hidden="true"
                className="relative w-4 h-4 shrink-0 before:absolute before:inset-x-0 before:top-1/2 before:h-px before:bg-fg after:absolute after:inset-y-0 after:left-1/2 after:w-px after:bg-fg after:transition-transform group-open:after:scale-y-0"
              />
            </summary>
            <div className="pb-6">
              <p className="text-sm text-fg-muted leading-relaxed mb-4">{cat.description}</p>
              <ul className="flex flex-col">
                {cat.items.map((item) => (
                  <li key={item.name} className="flex items-baseline justify-between gap-3 py-2.5 border-t border-line">
                    <span className="text-[15px] text-fg">{item.name}</span>
                    <span className="font-mono text-[10px] uppercase tracking-wider text-fg-subtle shrink-0">{item.level}</span>
                  </li>
                ))}
              </ul>
            </div>
          </details>
        ))}
      </div>
    </>
  );
}
