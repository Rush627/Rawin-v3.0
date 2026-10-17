"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { SCREENSHOT_QUALITY, optimizableImage } from "@/lib/image-source";
import { AnimatePresence, motion } from "framer-motion";
import { useReducedMotionSafe } from "@/lib/useReducedMotionSafe";
import { ArrowUpRight } from "lucide-react";
import { EASE_EDITORIAL } from "@/lib/motion";
import { EVOLUTION_MILESTONES } from "@/data/evolution";
import type { AboutMilestoneLabels, EvolutionMilestoneItem } from "@/lib/site-content";

interface Milestone {
  key: string;
  year: string;
  label: string;
  progression: string;
  title: string;
  domain: string;
  description: string;
  technologies: string[];
  url?: string;
  isCurrent: boolean;
  preview: string;
  previewAlt: string;
  ctaText: string;
}

function normalise(milestones?: EvolutionMilestoneItem[]): Milestone[] {
  if (milestones && milestones.length > 0) {
    return [...milestones]
      .sort((a, b) => (a.order ?? a.displayOrder ?? 0) - (b.order ?? b.displayOrder ?? 0))
      .map((m, i) => ({
        key: m.id || `${m.year}-${i}`,
        year: m.year,
        label: m.eyebrow || m.label || "Milestone",
        progression: m.quote || m.progression || "",
        title: m.title,
        domain: m.domain,
        description: m.description,
        technologies: m.technologies || [],
        url: m.url,
        isCurrent: Boolean(m.isCurrent || m.status === "current"),
        preview: m.preview,
        previewAlt: m.previewAlt || `${m.title} (${m.year}) preview`,
        ctaText: m.ctaText,
      }));
  }
  return EVOLUTION_MILESTONES.map((m, i) => ({
    key: `${m.year}-${i}`,
    year: m.year,
    label: m.label,
    progression: m.progression,
    title: m.title,
    domain: m.domain,
    description: m.description,
    technologies: m.technologies,
    url: m.url,
    isCurrent: m.status === "current",
    preview: m.preview,
    previewAlt: `${m.title} (${m.year}) preview`,
    ctaText: m.ctaText,
  }));
}

function milestoneCaption(labels: AboutMilestoneLabels | undefined, idx: number, year: string) {
  const fromCms = [labels?.milestone01, labels?.milestone02, labels?.milestone03][idx];
  return fromCms || `${year} Milestone`;
}

/**
 * The RAWIN evolution as numbered chapters. On large screens a sticky year index
 * tracks the chapter in view; on tablet and phone each chapter is self-contained.
 */
export default function EvolutionChapters({
  milestones,
  labels,
}: {
  milestones?: EvolutionMilestoneItem[];
  labels?: AboutMilestoneLabels;
}) {
  const items = normalise(milestones);
  const reduced = useReducedMotionSafe();
  const [active, setActive] = useState(0);
  const refs = useRef<(HTMLElement | null)[]>([]);

  useEffect(() => {
    const els = refs.current.filter(Boolean) as HTMLElement[];
    if (!els.length || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const idx = Number((entry.target as HTMLElement).dataset.idx);
            if (!Number.isNaN(idx)) setActive(idx);
          }
        }
      },
      { rootMargin: "-45% 0px -45% 0px" }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [items.length]);

  const current = items[active] ?? items[0];
  if (!items.length) return null;

  return (
    <div className="grid grid-cols-12 gap-x-4 lg:gap-x-10">
      {/* Sticky year index (desktop) */}
      <aside className="hidden lg:block col-span-4" aria-hidden="true">
        <div className="sticky top-28 pt-6">
          <div className="relative h-[clamp(8rem,13vw,13rem)] overflow-hidden">
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.span
                key={current.key}
                className={`absolute inset-x-0 top-0 display-xl leading-[0.9] ${current.isCurrent ? "italic text-accent" : "text-fg"}`}
                initial={reduced ? false : { y: "100%" }}
                animate={{ y: "0%" }}
                exit={reduced ? undefined : { y: "-100%" }}
                transition={{ duration: 0.8, ease: EASE_EDITORIAL }}
              >
                {current.year}
              </motion.span>
            </AnimatePresence>
          </div>
          <ol className="mt-10 flex flex-col border-t border-line">
            {items.map((m, i) => (
              <li
                key={m.key}
                className={`flex items-baseline justify-between gap-4 py-3 border-b border-line transition-colors duration-500 ${
                  i === active ? "text-fg" : "text-fg-subtle"
                }`}
              >
                <span className="flex items-baseline gap-3">
                  <span className="font-mono text-[11px]">{String(i + 1).padStart(2, "0")}</span>
                  <span className="text-[15px]">{m.title}</span>
                </span>
                <span className="font-mono text-[11px]">{m.year}</span>
              </li>
            ))}
          </ol>
          <div className="mt-6 h-px bg-line relative overflow-hidden">
            <motion.span
              className="absolute inset-y-0 left-0 bg-accent"
              animate={{ width: `${((active + 1) / items.length) * 100}%` }}
              transition={{ duration: reduced ? 0 : 0.6, ease: EASE_EDITORIAL }}
            />
          </div>
        </div>
      </aside>

      {/* Chapters */}
      <ol className="col-span-12 lg:col-span-8 flex flex-col gap-20 sm:gap-28 lg:gap-40">
        {items.map((m, i) => (
          <li
            key={m.key}
            data-idx={i}
            ref={(el) => {
              refs.current[i] = el;
            }}
            className="group"
          >
            {/* Entry identity: number + label, and the year (phones) / milestone label (desktop,
                where the sticky index already shows the year) on the same line */}
            <div className="flex items-baseline justify-between gap-4 mb-4 sm:mb-5 pb-3 border-b border-line">
              <span className="flex items-baseline gap-3 min-w-0">
                <span className="font-mono text-[11px] text-accent shrink-0">{String(i + 1).padStart(2, "0")}</span>
                <span className="label-mono text-fg-muted truncate">{m.label}</span>
              </span>
              {m.isCurrent ? (
                <span className="inline-flex items-center gap-2 label-mono text-success shrink-0">
                  <span className="status-dot" />
                  {labels?.currentEra || "Current era"}
                </span>
              ) : (
                <>
                  <span className="lg:hidden font-display text-[1.75rem] leading-none text-fg shrink-0">{m.year}</span>
                  <span className="hidden lg:inline label-mono text-fg-subtle shrink-0">{milestoneCaption(labels, i, m.year)}</span>
                </>
              )}
            </div>

            {/* Plate: the preview in its original colour, the quote card directly beneath it on
                the same left and right edges, so image and quote read as one stack. The screenshot
                is fitted like a project preview (ProjectVisual): shown whole, centred, never
                cropped, stretched or zoomed, with the theme surface filling any space its
                proportions leave (the 2022 and 2026 captures are wider than the 16:10 frame). */}
            <figure className="relative">
              <div data-field-surface="image" className="relative aspect-[16/10] w-full overflow-hidden rounded-[22px] sm:rounded-[28px] bg-surface border border-line shadow-[var(--shadow-2)]">
                <Image
                  src={m.preview}
                  alt={m.previewAlt}
                  fill
                  unoptimized={!optimizableImage(m.preview)}
                  quality={SCREENSHOT_QUALITY}
                  sizes="(min-width: 1024px) 60vw, 100vw"
                  className="object-contain object-center"
                />
              </div>
              {m.progression && (
                <blockquote className="mt-2.5 sm:mt-3 w-full glass-fallback rounded-[18px] sm:rounded-[22px] px-5 py-4 sm:px-6 sm:py-5">
                  <p className="font-display italic text-[1.35rem] sm:text-2xl leading-tight text-fg">&ldquo;{m.progression}&rdquo;</p>
                </blockquote>
              )}
            </figure>

            <div className="mt-7 sm:mt-12 grid grid-cols-1 md:grid-cols-12 gap-3 sm:gap-6">
              <h3 className="md:col-span-5 type-content lg:text-[clamp(2rem,4vw,3.25rem)] lg:leading-[0.98] text-fg">
                {m.title}
              </h3>
              <div className="md:col-span-7 flex flex-col gap-6">
                <p className="text-[15px] sm:text-base text-fg-muted leading-relaxed">{m.description}</p>
                {m.technologies.length > 0 && (
                  <ul className="flex flex-wrap gap-x-4 gap-y-2" aria-label="Technologies">
                    {m.technologies.map((t) => (
                      <li key={t} className="font-mono text-[12px] text-fg">
                        <span className="text-accent">/</span> {t}
                      </li>
                    ))}
                  </ul>
                )}
                <div className="pt-4 border-t border-line flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
                  {m.url ? (
                    <a
                      href={m.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group/cta inline-flex items-center gap-2 text-sm font-medium text-fg"
                      aria-label={`${m.ctaText} — ${m.title} (${m.year}), opens in a new tab`}
                    >
                      <span className="link-draw">{m.ctaText}</span>
                      <ArrowUpRight className="w-4 h-4 transition-transform group-hover/cta:rotate-45" />
                    </a>
                  ) : (
                    <span className="inline-flex items-center gap-2 text-sm text-success">
                      <span className="status-dot" />
                      <span className="text-fg">{m.ctaText}</span>
                    </span>
                  )}
                  {m.domain && <span className="label-mono text-fg-subtle truncate">{m.domain}</span>}
                </div>
              </div>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
