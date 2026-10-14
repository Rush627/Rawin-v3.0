"use client";

import { useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { useReducedMotionSafe } from "@/lib/useReducedMotionSafe";
import { ArrowUpRight } from "lucide-react";
import type { Project } from "@/lib/projects";
import ProjectVisual from "@/components/work/ProjectVisual";
import { STATUS_LABEL } from "@/components/work/project-meta";
import { EASE_EDITORIAL } from "@/lib/motion";

/**
 * Selected work — a curated split.
 * Desktop: a large exhibition plate shows the active project beside an editorial index;
 *          hovering or focusing an entry swaps the plate (no pointer-chasing previews).
 * Tablet:  the lead project as a wide feature, the rest as a two-up grid.
 * Phone:   stacked previews at a landscape crop with the copy beneath.
 */
export default function WorkIndex({ projects }: { projects: Project[] }) {
  const reduced = useReducedMotionSafe();
  const [active, setActive] = useState(0);

  if (!projects.length) {
    return (
      <div className="border-y border-line py-16 text-center">
        <p className="font-display italic text-3xl text-fg">New work is on the bench.</p>
        <p className="mt-2 text-sm text-fg-muted">Featured projects will appear here once published.</p>
      </div>
    );
  }

  const current = projects[Math.min(active, projects.length - 1)];

  return (
    <div>
      {/* ------------------------------------------------------------ Desktop */}
      <div className="hidden lg:grid grid-cols-12 gap-x-10 xl:gap-x-14 items-start">
        <div className="col-span-7">
          <Link
            href={`/projects/${current.slug}`}
            className="group relative block aspect-[5/4] xl:aspect-[4/3] overflow-hidden rounded-[28px] bg-sunken shadow-[var(--shadow-3)]"
            aria-label={`Open ${current.title} case study`}
          >
            <AnimatePresence initial={false}>
              <motion.div
                key={current.slug}
                className="absolute inset-0"
                initial={reduced ? { opacity: 0 } : { opacity: 0, scale: 1.04 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: reduced ? 0.2 : 0.8, ease: EASE_EDITORIAL }}
              >
                <ProjectVisual project={current} className="w-full h-full" sizes="(min-width: 1280px) 52vw, 58vw" />
              </motion.div>
            </AnimatePresence>
            <div aria-hidden="true" className="absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-black/60 to-transparent" />
            <div className="absolute left-6 right-6 bottom-6 flex items-end justify-between gap-6 text-white">
              <div>
                <span className="label-mono text-white/70">
                  {current.category}
                  {current.year ? ` · ${current.year}` : ""}
                </span>
                <p className="mt-2 font-display text-[clamp(2rem,3vw,2.9rem)] leading-[0.95] tracking-[-0.02em]">{current.title}</p>
              </div>
              <span className="inline-flex items-center gap-2 h-11 pl-4 pr-1.5 rounded-full bg-white/15 backdrop-blur-md border border-white/25 text-[13px] font-medium shrink-0">
                Case study
                <span className="w-8 h-8 rounded-full bg-white text-[#141318] flex items-center justify-center transition-transform duration-500 group-hover:rotate-45">
                  <ArrowUpRight className="w-4 h-4" />
                </span>
              </span>
            </div>
          </Link>
        </div>

        <ol className="col-span-5 border-t border-line">
          {projects.map((p, i) => {
            const on = i === active;
            return (
              <li key={p._id || p.slug} className="border-b border-line">
                <Link
                  href={`/projects/${p.slug}`}
                  onPointerEnter={() => setActive(i)}
                  onFocus={() => setActive(i)}
                  aria-current={on ? "true" : undefined}
                  className="group relative grid grid-cols-[2.25rem_1fr_auto] items-start gap-x-3 py-6 xl:py-7"
                >
                  <span className={`font-mono text-[11px] pt-3 transition-colors ${on ? "text-accent" : "text-fg-subtle"}`}>
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="min-w-0">
                    <span
                      className={`block font-display text-[clamp(1.9rem,2.8vw,2.8rem)] leading-[0.98] tracking-[-0.02em] transition-[color,transform] duration-500 ease-[cubic-bezier(0.2,0.7,0.1,1)] ${
                        on ? "text-fg italic translate-x-1" : "text-fg-muted"
                      }`}
                    >
                      {p.title}
                    </span>
                    <span
                      className={`grid transition-[grid-template-rows,opacity] duration-500 ease-[cubic-bezier(0.2,0.7,0.1,1)] ${
                        on ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                      }`}
                    >
                      <span className="overflow-hidden">
                        {p.tagline && <span className="block mt-3 text-[14px] leading-relaxed text-fg-muted max-w-[38ch]">{p.tagline}</span>}
                        <span className="mt-3 flex flex-wrap gap-1.5">
                          {p.technologies.slice(0, 4).map((t) => (
                            <span key={t} className="px-2.5 py-1 rounded-full border border-line text-[11px] text-fg-muted">
                              {t}
                            </span>
                          ))}
                        </span>
                      </span>
                    </span>
                  </span>
                  <span className="flex flex-col items-end gap-2 pt-2.5">
                    <span className="label-mono text-fg-subtle whitespace-nowrap">{p.year || STATUS_LABEL[p.status] || ""}</span>
                    <ArrowUpRight
                      className={`w-4 h-4 transition-[transform,color] duration-500 ${on ? "text-accent rotate-45" : "text-fg-subtle"}`}
                    />
                  </span>
                </Link>
              </li>
            );
          })}
        </ol>
      </div>

      {/* ------------------------------------------------------ Tablet & phone */}
      <ol className="lg:hidden grid grid-cols-1 md:grid-cols-2 gap-x-5 gap-y-10 sm:gap-y-12">
        {projects.map((p, i) => (
          <li key={p._id || p.slug} className={i === 0 ? "md:col-span-2" : ""}>
            <Link href={`/projects/${p.slug}`} className="group block">
              <ProjectVisual
                project={p}
                className={`w-full rounded-[22px] shadow-[var(--shadow-2)] ${i === 0 ? "aspect-[4/3] md:aspect-[16/9]" : "aspect-[4/3]"}`}
                sizes="(min-width: 768px) 50vw, 100vw"
              />
              <div className="mt-4 sm:mt-5 flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <span className="label-mono text-fg-subtle">
                    {String(i + 1).padStart(2, "0")} · {p.category}
                    {p.year ? ` · ${p.year}` : ""}
                  </span>
                  <h3 className="mt-2 font-display text-[clamp(1.9rem,7vw,2.75rem)] leading-[0.98] tracking-[-0.02em] text-fg">{p.title}</h3>
                  {p.tagline && <p className="mt-2 text-[15px] text-fg-muted max-w-[42ch]">{p.tagline}</p>}
                </div>
                <span className="mt-1 inline-flex items-center justify-center w-11 h-11 shrink-0 rounded-full border border-line-strong transition-colors group-active:bg-fg group-active:text-bg">
                  <ArrowUpRight className="w-4 h-4" />
                </span>
              </div>
            </Link>
          </li>
        ))}
      </ol>
    </div>
  );
}
