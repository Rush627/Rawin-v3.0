"use client";

import React from "react";
import type { TimelineItem } from "@/data/experience";

interface MobileAboutExperienceProps {
  items: TimelineItem[];
}

export default function MobileAboutExperience({ items }: MobileAboutExperienceProps) {
  if (!items || items.length === 0) {
    return null;
  }

  return (
    <div
      data-particle-protected
      className="relative w-full pl-6 sm:pl-8 flex flex-col gap-8 sm:gap-10"
    >
      {/* Continuous vertical timeline rail */}
      <div
        className="absolute left-[11px] sm:left-[15px] top-2 bottom-3 w-[2px] bg-gradient-to-b from-pacific-cyan/70 via-pacific-cyan/30 to-white/[0.08]"
        aria-hidden="true"
      />

      {items.map((item, idx) => (
        <div key={item.period || idx} className="relative flex flex-col gap-2 group">
          {/* Milestone Node on Rail */}
          <div
            className="absolute -left-[19px] sm:-left-[23px] top-1 w-3.5 h-3.5 rounded-full bg-ink-black border-2 border-pacific-cyan shadow-[0_0_10px_rgba(24,155,173,0.5)] flex items-center justify-center transition-all duration-300 group-hover:scale-110"
            aria-hidden="true"
          >
            <div className="w-1.5 h-1.5 rounded-full bg-pacific-cyan" />
          </div>

          {/* Date Badge and Context */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs font-mono font-semibold px-2.5 py-0.5 rounded-full bg-pacific-cyan/10 text-pacific-cyan border border-pacific-cyan/20">
              {item.period}
            </span>
            <span className="text-xs font-mono text-muted/70">
              {item.companyOrContext}
            </span>
          </div>

          {/* Role Title */}
          <h3 className="text-base sm:text-lg font-bold text-foreground font-space leading-snug">
            {item.role}
          </h3>

          {/* Description */}
          <p className="text-xs sm:text-sm text-muted leading-relaxed">
            {item.description}
          </p>

          {/* Highlight Bullets */}
          {item.highlights && item.highlights.length > 0 && (
            <ul className="flex flex-col gap-2 mt-2 pt-2 border-t border-white/[0.05]">
              {item.highlights.map((highlight, hIdx) => (
                <li
                  key={hIdx}
                  className="flex items-start gap-2 text-xs text-muted/85 leading-relaxed"
                >
                  <span
                    className="w-1.5 h-1.5 rounded-full bg-pacific-cyan/70 shrink-0 mt-1.5 shadow-[0_0_6px_rgba(24,155,173,0.3)]"
                    aria-hidden="true"
                  />
                  <span>{highlight}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      ))}
    </div>
  );
}
