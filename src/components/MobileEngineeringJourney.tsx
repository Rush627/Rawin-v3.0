"use client";

import React, { useEffect, useRef, useState } from "react";
import { Terminal, Check } from "lucide-react";
import type { TimelineItem } from "@/data/experience";

interface MobileEngineeringJourneyProps {
  items: TimelineItem[];
}

function JourneyEntryNode({
  item,
  isLast,
}: {
  item: TimelineItem;
  isLast: boolean;
}) {
  const entryRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const el = entryRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          setIsVisible(entry.isIntersecting);
        });
      },
      {
        threshold: 0.25,
        rootMargin: "-5% 0px -15% 0px",
      }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={entryRef}
      className={`relative pl-7 sm:pl-9 transition-all duration-500 ease-out ${
        isVisible ? "opacity-100 translate-y-0" : "opacity-75 translate-y-1"
      }`}
    >
      {/* Cyan Circuit Node */}
      <div
        className={`absolute left-[6px] sm:left-[8px] top-1.5 w-3 h-3 rounded-full bg-ink-black border-2 transition-all duration-500 ${
          isVisible
            ? "border-pacific-cyan scale-110 shadow-[0_0_12px_rgba(24,155,173,0.8)]"
            : "border-pacific-cyan/50 scale-100 shadow-[0_0_4px_rgba(24,155,173,0.3)]"
        }`}
      />

      <div className="flex flex-col gap-1.5">
        {/* Period & Context Badge */}
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`text-xs font-mono font-semibold transition-colors duration-300 ${
              isVisible ? "text-pacific-cyan" : "text-pacific-cyan/80"
            }`}
          >
            {item.period}
          </span>
          <span className="text-white/20">•</span>
          <span className="text-xs text-muted/80 font-mono">
            {item.companyOrContext}
          </span>
        </div>

        <h4 className="text-base font-bold text-foreground font-space leading-snug">
          {item.role}
        </h4>

        <p className="text-xs text-muted leading-relaxed mt-0.5 max-w-xl">
          {item.description}
        </p>

        {/* Highlights / Achievements */}
        <ul className="flex flex-col gap-2 mt-2 pt-1 border-t border-white/[0.04]">
          {item.highlights.map((highlight, hIdx) => (
            <li
              key={hIdx}
              className="flex items-start gap-2 text-xs text-muted/85 leading-snug"
            >
              <span className="flex items-center justify-center w-4 h-4 rounded-[4px] bg-pacific-cyan/10 border border-pacific-cyan/25 text-pacific-cyan shrink-0 mt-0.5 shadow-[0_0_6px_rgba(24,155,173,0.15)]">
                <Check className="w-2.5 h-2.5 stroke-[2.5]" />
              </span>
              <span>{highlight}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default function MobileEngineeringJourney({
  items,
}: MobileEngineeringJourneyProps) {
  if (!items || items.length === 0) {
    return null;
  }

  return (
    <div
      data-particle-protected
      className="glass-panel rounded-2xl p-5 sm:p-7 border border-white/[0.07] w-full"
      style={{
        background:
          "linear-gradient(180deg, rgba(20, 20, 30, 0.98) 0%, rgba(14, 14, 22, 0.97) 100%)",
      }}
    >
      <h3 className="text-lg sm:text-xl font-bold text-foreground font-space mb-6 flex items-center gap-2">
        <Terminal className="w-4 h-4 text-pacific-cyan shrink-0" />
        <span>Engineering Journey</span>
      </h3>

      {/* Vertical circuit container */}
      <div className="flex flex-col gap-8 relative before:absolute before:top-2 before:bottom-3 before:left-[11px] sm:before:left-[13px] before:w-[2px] before:bg-gradient-to-b before:from-pacific-cyan/60 before:via-pacific-cyan/25 before:to-white/[0.08]">
        {items.map((item, idx) => (
          <JourneyEntryNode
            key={item.period || idx}
            item={item}
            isLast={idx === items.length - 1}
          />
        ))}
      </div>
    </div>
  );
}
