"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { History, ArrowUpRight } from "lucide-react";
import { EVOLUTION_MILESTONES, type EvolutionMilestone } from "@/data/evolution";
import type { EvolutionMilestoneItem, AboutMilestoneLabels } from "@/lib/site-content";
import RawinEvolutionConstellation from "@/components/RawinEvolutionConstellation";

// Symmetrical 8-point geometric star icon path for milestone header anchors
const STAR_ICON_PATH =
  "M 0,-6 L 0.8,-2 L 4.2,-4.2 L 2,-0.8 L 6,0 L 2,0.8 L 4.2,4.2 L 0.8,2 L 0,6 L -0.8,2 L -4.2,4.2 L -2,0.8 L -6,0 L -2,-0.8 L -4.2,-4.2 L -0.8,-2 Z";

export interface RawinEvolutionProps {
  milestones?: EvolutionMilestoneItem[];
  eyebrow?: string;
  heading?: string;
  description?: string;
  milestoneLabels?: AboutMilestoneLabels;
}

interface NormalizedMilestone {
  id?: string;
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
  previewAlt?: string;
  ctaText: string;
}

export default function RawinEvolution({
  milestones,
  eyebrow = "A RECORD OF THE BUILD",
  heading = "From a first HTML page to a full engineering platform.",
  description = "RAWIN has evolved alongside the way I build for the web.",
  milestoneLabels,
}: RawinEvolutionProps = {}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const milestoneRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [activeMilestone, setActiveMilestone] = useState(0);

  // Use CMS milestones if present, sorted by order; otherwise fallback to default records
  const items: NormalizedMilestone[] = milestones && milestones.length > 0
    ? [...milestones]
        .sort((a, b) => (a.order ?? a.displayOrder ?? 0) - (b.order ?? b.displayOrder ?? 0))
        .map((m) => ({
          id: m.id,
          year: m.year,
          label: m.eyebrow || m.label || "MILESTONE",
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
        }))
    : EVOLUTION_MILESTONES.map((m) => ({
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

  return (
    <section className="flex flex-col gap-10 w-full" data-particle-protected>
      {/* Section Header */}
      <div className="flex flex-col gap-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono font-medium glass-pill text-pacific-cyan w-fit border border-pacific-cyan/20">
          <History className="w-3.5 h-3.5" />
          <span>{eyebrow}</span>
        </div>
        <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-foreground font-space">
          {heading}
        </h2>
        <p className="text-sm sm:text-base text-muted max-w-2xl leading-relaxed">
          {description}
        </p>
      </div>

      {/* Evolution Journey Area: Generous Negative Space for Star Trail */}
      <div
        ref={containerRef}
        className="relative flex flex-col gap-36 sm:gap-40 lg:gap-52 w-full py-8 sm:py-12"
      >
        {/* Constellation Single-Spline Star Layer (z-0, behind cards) */}
        <RawinEvolutionConstellation
          containerRef={containerRef}
          milestoneRefs={milestoneRefs}
          onActiveMilestoneChange={setActiveMilestone}
        />

        {items.map((milestone, idx) => {
          const isCurrent = milestone.isCurrent;
          const isActive = activeMilestone === idx;
          const milestoneLabel = milestone.label;
          const milestoneProgression = milestone.progression;
          const milestoneAlt = milestone.previewAlt || `${milestone.title} (${milestone.year}) preview`;

          // Responsive Card Sizing:
          // Mobile: Centered, approximately 70% of viewport width (min(345px, 70vw)) with generous breathing room
          // Tablet: Centered, 78% width up to 540px
          // Desktop (Locked): 82% width, alternating left/right
          const alignmentClass =
            idx % 2 === 1
              ? "w-[min(345px,70vw)] mx-auto sm:w-[78%] sm:max-w-[540px] lg:w-[82%] lg:max-w-none lg:self-end lg:mx-0"
              : "w-[min(345px,70vw)] mx-auto sm:w-[78%] sm:max-w-[540px] lg:w-[82%] lg:max-w-none lg:self-start lg:mx-0";

          return (
            <div
              key={milestone.id || milestone.year || idx}
              ref={(el) => {
                milestoneRefs.current[idx] = el;
              }}
              className={`relative z-10 flex flex-col gap-2.5 sm:gap-3.5 transition-all duration-500 ${alignmentClass}`}
              data-particle-protected
            >
              {/* Editorial Milestone Header with Sharp Geometric Star Anchor */}
              <div className="flex items-center justify-between gap-2 px-1">
                <div className="flex items-center gap-2 sm:gap-3">
                  {/* Origin Star Spark */}
                  <div className="relative flex items-center justify-center w-4 h-4 sm:w-5 sm:h-5">
                    <svg
                      viewBox="-8 -8 16 16"
                      className={`w-3 h-3 sm:w-3.5 sm:h-3.5 transition-all duration-300 ${
                        isCurrent
                          ? "text-emerald-400 drop-shadow-[0_0_4px_rgba(52,211,153,0.7)] scale-110"
                          : isActive
                          ? "text-pacific-cyan drop-shadow-[0_0_4px_rgba(24,155,173,0.8)] scale-110"
                          : "text-muted/40 scale-95"
                      }`}
                    >
                      <path d={STAR_ICON_PATH} fill="currentColor" />
                    </svg>
                  </div>

                  <span className="font-mono text-[11px] sm:text-xs font-semibold tracking-wider text-pacific-cyan">
                    0{idx + 1}
                  </span>
                  <span className="text-white/20 text-xs font-mono">/</span>
                  <span
                    className={`font-space font-bold text-base sm:text-2xl tracking-tight transition-colors duration-300 ${
                      isCurrent
                        ? "text-emerald-400"
                        : isActive
                        ? "text-foreground"
                        : "text-muted/70"
                    }`}
                  >
                    {milestone.year}
                  </span>
                </div>

                {isCurrent && (
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 sm:px-2.5 rounded-full text-[9px] sm:text-xs font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse motion-reduce:animate-none" />
                    {milestoneLabels?.currentEra || "CURRENT ERA"}
                  </span>
                )}
              </div>

              {/* Milestone Card Content */}
              <div
                className={`relative w-full rounded-xl sm:rounded-2xl border transition-all duration-300 overflow-hidden flex flex-col lg:flex-row ${
                  isCurrent
                    ? "bg-surface-card/90 border-emerald-500/30 shadow-[0_0_30px_rgba(34,197,94,0.08)]"
                    : isActive
                    ? "glass-card border-pacific-cyan/35 shadow-[0_0_24px_rgba(24,155,173,0.1)]"
                    : "glass-card border-white/[0.08] hover:border-white/[0.15]"
                }`}
              >
                {/* Visual Website Preview Column */}
                <div className="w-full lg:w-1/2 p-2.5 sm:p-4 lg:p-5 flex flex-col justify-center bg-black/40 border-b lg:border-b-0 lg:border-r border-white/[0.06]">
                  {/* Browser Window Mockup Frame */}
                  <div className="rounded-lg sm:rounded-xl overflow-hidden border border-white/[0.1] bg-ink-black/80 shadow-2xl flex flex-col">
                    {/* Browser Chrome Header */}
                    <div className="px-2.5 py-1.5 sm:px-3 sm:py-2 bg-surface/90 border-b border-white/[0.08] flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-red-500/60" />
                        <span className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-amber-500/60" />
                        <span className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-emerald-500/60" />
                      </div>
                      <span className="text-[10px] sm:text-[11px] font-mono text-muted/70 truncate max-w-[160px] sm:max-w-[200px]">
                        {milestone.domain}
                      </span>
                      <div className="w-4 sm:w-8" />
                    </div>

                    {/* Screenshot Image Container */}
                    <div className="relative aspect-[16/10] w-full bg-ink-black overflow-hidden group/img">
                      <Image
                        src={milestone.preview}
                        alt={milestoneAlt}
                        fill
                        unoptimized
                        sizes="(max-width: 640px) 320px, (max-width: 1024px) 500px, 600px"
                        className="object-cover object-top transition-transform duration-500 group-hover/img:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-ink-black/60 via-transparent to-transparent opacity-60" />
                    </div>
                  </div>
                </div>

                {/* Milestone Information Column */}
                <div className="w-full lg:w-1/2 p-3.5 sm:p-6 lg:p-8 flex flex-col justify-between gap-3 sm:gap-6">
                  <div className="flex flex-col gap-2 sm:gap-3">
                    {/* Top Status & Progression Badges */}
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <span className="text-[10px] sm:text-xs font-mono font-semibold tracking-wider text-pacific-cyan uppercase">
                        {milestoneLabel}
                      </span>
                      {milestoneProgression && (
                        <span className="text-[10px] sm:text-xs font-mono text-apricot-cream/90 italic">
                          &quot;{milestoneProgression}&quot;
                        </span>
                      )}
                    </div>

                    {/* Milestone Title */}
                    <h3 className="text-base sm:text-2xl font-bold text-foreground font-space leading-snug">
                      {milestone.title}
                    </h3>

                    {/* Milestone Description */}
                    <p className="text-xs sm:text-sm text-muted leading-relaxed">
                      {milestone.description}
                    </p>

                    {/* Technology Stack Pills */}
                    <div className="flex flex-wrap gap-1.5 sm:gap-2 pt-1 sm:pt-2">
                      {milestone.technologies.map((tech) => (
                        <span
                          key={tech}
                          className="px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-md text-[10px] sm:text-xs font-mono bg-white/[0.04] text-foreground/90 border border-white/[0.08]"
                        >
                          {tech}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Milestone Action / CTA */}
                  <div className="pt-2.5 sm:pt-4 border-t border-white/[0.06] flex items-center justify-between flex-wrap gap-2 sm:gap-3">
                    {milestone.url ? (
                      <a
                        href={milestone.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 sm:gap-2 px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg sm:rounded-xl text-[10px] sm:text-xs font-mono font-semibold bg-pacific-cyan/10 text-pacific-cyan border border-pacific-cyan/30 hover:bg-pacific-cyan hover:text-ink-black transition-all group/btn"
                        aria-label={`View the ${milestone.year} ${milestone.title} live website in a new tab`}
                      >
                        <span>{milestone.ctaText}</span>
                        <ArrowUpRight className="w-3 h-3 sm:w-3.5 sm:h-3.5 transition-transform group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5" />
                      </a>
                    ) : (
                      <div className="inline-flex items-center gap-1.5 sm:gap-2 px-2.5 py-1 sm:px-3.5 sm:py-1.5 rounded-lg sm:rounded-xl text-[10px] sm:text-xs font-mono font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                        <span className="relative flex h-1.5 w-1.5 sm:h-2 sm:w-2">
                          <span className="animate-ping motion-reduce:animate-none absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                          <span className="relative inline-flex rounded-full h-1.5 w-1.5 sm:h-2 sm:w-2 bg-emerald-500" />
                        </span>
                        <span>{milestone.ctaText}</span>
                      </div>
                    )}

                    <span className="text-[9px] sm:text-[11px] font-mono text-muted/60">
                      {idx === 0
                        ? milestoneLabels?.milestone01 || `${milestone.year} Milestone`
                        : idx === 1
                        ? milestoneLabels?.milestone02 || `${milestone.year} Milestone`
                        : idx === 2
                        ? milestoneLabels?.milestone03 || `${milestone.year} Milestone`
                        : `${milestone.year} Milestone`}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
