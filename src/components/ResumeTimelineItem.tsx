"use client";

import React, { useEffect, useRef, useState } from "react";
import type { ResumeExperienceItem } from "@/lib/site-content";

interface ResumeTimelineItemProps {
  item: ResumeExperienceItem;
  variant: "desktop" | "mobile";
}

export default function ResumeTimelineItem({
  item,
  variant,
}: ResumeTimelineItemProps) {
  const itemRef = useRef<HTMLDivElement>(null);
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    const el = itemRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;

    // Trigger subtle breathing as the user scrolls toward this item
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsActive(entry.isIntersecting);
      },
      {
        rootMargin: "-15% 0px -25% 0px",
        threshold: 0.15,
      }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const dateDisplay = item.current
    ? `${item.startDate} -> Present`
    : item.endDate
    ? `${item.startDate} -> ${item.endDate}`
    : item.startDate;

  // Ensure "Engineer" / "Engineering" is replaced with "Developer" per UI wording rules
  const cleanRole = item.role
    .replace(/\bEngineer\b/g, "Developer")
    .replace(/\bEngineering\b/g, "Developer");

  if (variant === "desktop") {
    return (
      <div ref={itemRef} className="relative pl-9 sm:pl-10 flex flex-col gap-3 group">
        {/* Node container: horizontally centered on the exact 11px line axis */}
        <div
          aria-hidden="true"
          className="absolute left-[11px] top-6 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-none z-10"
        >
          {item.current ? (
            <span
              className={`rounded-full transition-all duration-500 will-change-transform ${
                isActive
                  ? "w-3.5 h-3.5 bg-pacific-cyan ring-4 ring-pacific-cyan/25 shadow-[0_0_12px_rgba(24,155,173,0.55)] scale-110 animate-[pulse_2.4s_cubic-bezier(0.4,0,0.6,1)_infinite] motion-reduce:animate-none"
                  : "w-3 h-3 bg-pacific-cyan/80 ring-2 ring-pacific-cyan/20 shadow-[0_0_8px_rgba(24,155,173,0.3)] scale-100"
              }`}
            />
          ) : (
            <span
              className={`rounded-full transition-all duration-500 will-change-transform ${
                isActive
                  ? "w-3 h-3 bg-pacific-cyan/90 ring-3 ring-pacific-cyan/25 shadow-[0_0_10px_rgba(24,155,173,0.4)] scale-110 animate-[pulse_2.8s_cubic-bezier(0.4,0,0.6,1)_infinite] motion-reduce:animate-none"
                  : "w-2.5 h-2.5 bg-ink-black border border-white/35 scale-100"
              }`}
            />
          )}
        </div>

        {/* Card content */}
        <div className="p-6 rounded-xl bg-ink-black/40 border border-white/[0.07] hover:border-pacific-cyan/30 transition-all duration-200 flex flex-col gap-3.5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2.5">
              <h3 className="text-lg lg:text-xl font-bold text-foreground font-space">
                {cleanRole}
              </h3>
              {item.current && (
                <span className="px-2 py-0.5 rounded bg-pacific-cyan/10 border border-pacific-cyan/30 text-pacific-cyan text-[10px] font-mono font-semibold uppercase">
                  Current Role
                </span>
              )}
            </div>
            <span className="text-xs font-mono font-bold text-pacific-cyan tracking-wider shrink-0">
              {dateDisplay}
            </span>
          </div>

          <p className="text-xs font-mono text-muted/70">
            {item.organization}
            {item.location ? ` · ${item.location}` : ""}
          </p>

          <ul className="flex flex-col gap-2 pt-1 text-xs lg:text-sm text-muted/85 leading-relaxed font-sans">
            {item.bullets.map((bullet, bIdx) => (
              <li key={bIdx} className="flex items-start gap-2.5">
                <span className="text-pacific-cyan font-bold mt-0.5 shrink-0">·</span>
                <span className="break-words">{bullet}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    );
  }

  // Mobile layout
  return (
    <div ref={itemRef} className="relative pl-7 flex flex-col gap-2">
      {/* Node container: horizontally centered on the exact 7px line axis */}
      <div
        aria-hidden="true"
        className="absolute left-[7px] top-5 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-none z-10"
      >
        {item.current ? (
          <span
            className={`rounded-full transition-all duration-500 will-change-transform ${
              isActive
                ? "w-3 h-3 bg-pacific-cyan ring-3 ring-pacific-cyan/30 shadow-[0_0_10px_rgba(24,155,173,0.55)] scale-110 animate-[pulse_2.4s_cubic-bezier(0.4,0,0.6,1)_infinite] motion-reduce:animate-none"
                : "w-2.5 h-2.5 bg-pacific-cyan/80 ring-1.5 ring-pacific-cyan/20 scale-100"
            }`}
          />
        ) : (
          <span
            className={`rounded-full transition-all duration-500 will-change-transform ${
              isActive
                ? "w-2.5 h-2.5 bg-pacific-cyan/90 ring-2 ring-pacific-cyan/25 shadow-[0_0_8px_rgba(24,155,173,0.4)] scale-110 animate-[pulse_2.8s_cubic-bezier(0.4,0,0.6,1)_infinite] motion-reduce:animate-none"
                : "w-2 h-2 bg-ink-black border border-white/40 scale-100"
            }`}
          />
        )}
      </div>

      {/* Card content */}
      <div className="p-4 rounded-xl bg-ink-black/40 border border-white/[0.06] flex flex-col gap-2.5">
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-mono text-pacific-cyan font-semibold">
              {dateDisplay}
            </span>
            {item.current && (
              <span className="px-1.5 py-0.5 rounded bg-pacific-cyan/10 border border-pacific-cyan/30 text-pacific-cyan text-[9px] font-mono font-semibold uppercase">
                Current
              </span>
            )}
          </div>
          <h3 className="text-sm font-bold text-foreground font-space leading-snug">
            {cleanRole}
          </h3>
          <p className="text-[11px] font-mono text-muted/70">
            {item.organization}
            {item.location ? ` · ${item.location}` : ""}
          </p>
        </div>

        <ul className="flex flex-col gap-1.5 pt-1 text-xs text-muted/85 leading-relaxed font-sans">
          {item.bullets.map((bullet, bIdx) => (
            <li key={bIdx} className="flex items-start gap-2">
              <span className="text-pacific-cyan font-bold shrink-0">·</span>
              <span className="break-words">{bullet}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
