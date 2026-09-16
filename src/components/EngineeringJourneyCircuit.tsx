"use client";

import React, { useEffect, useState } from "react";
import type { TimelineItem } from "@/data/experience";

interface EngineeringJourneyCircuitProps {
  items: TimelineItem[];
}

function ExperienceCard({
  item,
  index,
}: {
  item: TimelineItem;
  index: number;
}) {
  const badgeNumber = `0${index + 1}`;

  return (
    <div className="relative group w-[280px] sm:w-[300px] lg:w-[310px] h-[440px] sm:h-[450px] shrink-0">
      <div className="glass-card rounded-2xl p-5 sm:p-6 border border-white/[0.08] bg-ink-black/85 group-hover:border-pacific-cyan/45 group-hover:bg-ink-black/95 transition-all duration-300 shadow-[0_8px_32px_rgba(0,0,0,0.5)] flex flex-col justify-between h-full">
        {/* Top Header and Content */}
        <div className="flex flex-col gap-2.5">
          <div className="flex items-center justify-between gap-2">
            {/* Badge and Period */}
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-pacific-cyan px-2 py-0.5 rounded-md bg-pacific-cyan/15 border border-pacific-cyan/25">
                {badgeNumber}
              </span>
              <span className="text-xs font-mono font-semibold text-muted/90">
                {item.period}
              </span>
            </div>

            {/* Milestone Node Terminal */}
            <div
              className="w-4 h-4 rounded-full bg-ink-black border border-pacific-cyan/40 group-hover:border-pacific-cyan flex items-center justify-center transition-all duration-300 shadow-[0_0_8px_rgba(24,155,173,0.25)] group-hover:shadow-[0_0_12px_rgba(24,155,173,0.5)]"
              aria-hidden="true"
            >
              <div className="w-1.5 h-1.5 rounded-full bg-pacific-cyan/80 group-hover:bg-pacific-cyan transition-colors" />
            </div>
          </div>

          {/* Organization / Eyebrow */}
          <span className="text-[11px] font-mono uppercase tracking-wider text-pacific-cyan/80 font-medium pt-0.5">
            {item.companyOrContext}
          </span>

          {/* Role Title */}
          <h3 className="text-base sm:text-lg font-bold text-foreground font-space leading-snug tracking-tight">
            {item.role}
          </h3>

          {/* Description */}
          <p className="text-xs sm:text-sm text-muted leading-relaxed">
            {item.description}
          </p>
        </div>

        {/* Highlights List */}
        <div className="pt-3 border-t border-white/[0.08] mt-3">
          <ul className="flex flex-col gap-2">
            {item.highlights.map((highlight, hIdx) => (
              <li
                key={hIdx}
                className="flex items-start gap-2 text-xs text-muted/80 leading-relaxed"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-pacific-cyan/60 shrink-0 mt-1.5" />
                <span>{highlight}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

export default function EngineeringJourneyCircuit({ items }: EngineeringJourneyCircuitProps) {
  const [isDesktop, setIsDesktop] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  // Desktop capability check (>= 1024px)
  useEffect(() => {
    const checkDesktop = () => window.innerWidth >= 1024;
    setIsDesktop(checkDesktop());

    const handleResize = () => {
      setIsDesktop(checkDesktop());
    };

    window.addEventListener("resize", handleResize, { passive: true });
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Reduced motion preference check
  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(media.matches);
    const listener = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    media.addEventListener("change", listener);
    return () => media.removeEventListener("change", listener);
  }, []);

  // Mobile and Tablet layout: clean vertical timeline with border (< 1024px)
  if (!isDesktop) {
    return (
      <div className="relative flex flex-col gap-8 sm:gap-10 border-l border-white/[0.08] ml-2 sm:ml-4 pl-6 sm:pl-8">
        {items.map((item) => (
          <div key={item.period} className="relative flex flex-col gap-3 group">
            {/* Node indicator */}
            <div className="absolute -left-[31px] sm:-left-[39px] top-1.5 w-3.5 h-3.5 rounded-full bg-ink-black border-2 border-pacific-cyan/60 group-hover:border-pacific-cyan group-hover:shadow-[0_0_10px_rgba(24,155,173,0.5)] transition-all" />

            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-mono font-semibold px-2.5 py-0.5 rounded-full bg-pacific-cyan/10 text-pacific-cyan border border-pacific-cyan/20">
                {item.period}
              </span>
              <span className="text-xs font-mono text-muted/70">{item.companyOrContext}</span>
            </div>

            <h3 className="text-lg sm:text-xl font-bold text-foreground font-space">{item.role}</h3>
            <p className="text-sm text-muted leading-relaxed">{item.description}</p>

            <ul className="flex flex-col gap-1.5 pt-1">
              {item.highlights.map((highlight, hIdx) => (
                <li key={hIdx} className="flex items-start gap-2 text-xs sm:text-sm text-muted/80">
                  <span className="w-1.5 h-1.5 rounded-full bg-pacific-cyan/60 shrink-0 mt-2" />
                  <span>{highlight}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    );
  }

  // Reduced motion accessible fallback for desktop
  if (prefersReducedMotion) {
    return (
      <div className="relative w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 py-4">
        {items.map((item, idx) => (
          <ExperienceCard key={`static-${idx}`} item={item} index={idx} />
        ))}
      </div>
    );
  }

  // Dynamically calculate repeated sequence so one loop set is at least 2800px wide
  // (guaranteeing that even on ultrawide screens, the right edge is NEVER blank)
  const CARD_SPAN_PX = 334; // 310px max card width + 24px gap
  const targetMinSpan = 2800;
  const repeatPerSet = Math.max(2, Math.ceil(targetMinSpan / (items.length * CARD_SPAN_PX)));

  const setList: { item: TimelineItem; originalIndex: number }[] = [];
  for (let r = 0; r < repeatPerSet; r++) {
    items.forEach((item, idx) => {
      setList.push({ item, originalIndex: idx });
    });
  }

  // Smooth, readable cinematic drifting speed (~38px/sec)
  const flowDuration = Math.round((setList.length * CARD_SPAN_PX) / 38);

  // Desktop Continuous Horizontal Card Flow: Near full-width stage across viewport
  return (
    <div className="relative w-[calc(100vw-40px)] left-1/2 -translate-x-1/2 overflow-hidden py-4 select-none">
      {/* Horizontal Viewport Mask with subtle edge clearance */}
      <div
        className="relative w-full overflow-hidden z-10 py-2"
        style={{
          maskImage:
            "linear-gradient(to right, transparent 0%, rgba(0,0,0,0.4) 1.5%, black 3.5%, black 96.5%, rgba(0,0,0,0.4) 98.5%, transparent 100%)",
          WebkitMaskImage:
            "linear-gradient(to right, transparent 0%, rgba(0,0,0,0.4) 1.5%, black 3.5%, black 96.5%, rgba(0,0,0,0.4) 98.5%, transparent 100%)",
        }}
      >
        {/* Continuous Horizontal Card Flow Track (Right to Left) */}
        <div
          className="animate-horizontal-card-flow flex flex-row cursor-default"
          style={
            {
              "--flow-duration": `${flowDuration}s`,
            } as React.CSSProperties
          }
        >
          {/* Set 1 */}
          <div className="flex flex-row">
            {setList.map((entry, idx) => (
              <div key={`flow-set1-${idx}`} className="pr-6 shrink-0">
                <ExperienceCard item={entry.item} index={entry.originalIndex} />
              </div>
            ))}
          </div>

          {/* Set 2 (Identical duplicate for seamless continuous infinite loop) */}
          <div className="flex flex-row" aria-hidden="true">
            {setList.map((entry, idx) => (
              <div key={`flow-set2-${idx}`} className="pr-6 shrink-0">
                <ExperienceCard item={entry.item} index={entry.originalIndex} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
