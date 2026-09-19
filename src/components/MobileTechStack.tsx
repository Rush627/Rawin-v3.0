"use client";

import React, { useEffect, useRef, useState } from "react";
import type { TechCategory } from "@/data/techArsenal";

interface MobileTechStackProps {
  categories: TechCategory[];
}

function TechCategoryCardContent({ category }: { category: TechCategory }) {
  return (
    <div
      data-particle-protected
      className="glass-card rounded-2xl p-5 sm:p-6 border border-white/[0.09] flex flex-col gap-4 w-full shadow-[0_-8px_24px_rgba(0,0,0,0.65),0_16px_40px_rgba(0,0,0,0.7),0_0_1px_1px_rgba(255,255,255,0.06)]"
      style={{
        background:
          "linear-gradient(180deg, rgba(20, 20, 30, 0.99) 0%, rgba(14, 14, 22, 0.98) 100%)",
      }}
    >
      {/* Category Header */}
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-lg sm:text-xl font-bold text-foreground font-space">
          {category.title}
        </h3>
        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-medium bg-pacific-cyan/10 text-pacific-cyan border border-pacific-cyan/20 shrink-0">
          {category.badge}
        </span>
      </div>

      <p className="text-xs text-muted/80 leading-relaxed">
        {category.description}
      </p>

      {/* Skill Items Grid: single column on narrow screens, 2-col on >= 400px */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
        {category.items.map((item) => (
          <div
            key={item.name}
            className={`p-3 rounded-xl border transition-colors ${
              item.highlight
                ? "bg-surface/90 border-pacific-cyan/25 shadow-sm"
                : "bg-ink-black/50 border-white/5"
            }`}
          >
            <div className="flex items-center justify-between gap-1.5">
              <span className="text-xs font-semibold text-foreground font-space truncate">
                {item.name}
              </span>
              <span className="text-[10px] font-mono text-pacific-cyan shrink-0">
                {item.level}
              </span>
            </div>
            <p className="text-[11px] text-muted/70 mt-1 leading-snug line-clamp-2">
              {item.description}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function MobileTechStack({ categories }: MobileTechStackProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);

  // High-performance scroll tracking loop: directly updates DOM styles via rAF with zero React re-renders
  useEffect(() => {
    // Strictly isolate to mobile/tablet (< 1024px). Never execute on desktop.
    if (typeof window === "undefined" || window.innerWidth >= 1024) return;
    if (categories.length <= 1) return;

    const isReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (isReducedMotion) return;

    const container = containerRef.current;
    if (!container) return;

    let cachedContainerTop = 0;
    let cachedStickyTop = window.innerWidth < 640 ? 72 : 80;
    let rafId: number | null = null;

    const SCROLL_STEP = 380;
    const totalTravel = (categories.length - 1) * SCROLL_STEP;

    const updateStack = () => {
      rafId = null;
      if (!container) return;

      const rect = container.getBoundingClientRect();
      const stickyTop = window.innerWidth < 640 ? 72 : 80;
      const tabOffset = window.innerWidth < 640 ? 18 : 22;
      const scrolledIn = stickyTop - rect.top;

      let progress = 0;
      if (scrolledIn <= 0) {
        progress = 0;
      } else if (scrolledIn >= totalTravel) {
        progress = 1;
      } else {
        progress = scrolledIn / totalTravel;
      }

      const step = progress * (categories.length - 1);
      const activeIdx = Math.min(Math.floor(step), categories.length - 2);
      const fraction = step - activeIdx;

      for (let i = 0; i < categories.length; i++) {
        const el = cardRefs.current[i];
        if (!el) continue;

        if (i < activeIdx) {
          // Resting in stacked deck behind: shows visible top tab
          const depth = activeIdx - i;
          const translateY = -depth * tabOffset;
          const scale = Math.max(0.90, 1 - depth * 0.025);
          el.style.transform = `translate3d(0, ${translateY}px, 0) scale(${scale})`;
          el.style.opacity = `${Math.max(0.55, 1 - depth * 0.15)}`;
          el.style.visibility = "visible";
          el.style.pointerEvents = "none";
        } else if (i === activeIdx) {
          // Active card: shifts slightly to tab position as incoming card covers it
          const translateY = -fraction * tabOffset;
          const scale = 1 - fraction * 0.025;
          el.style.transform = `translate3d(0, ${translateY}px, 0) scale(${scale})`;
          el.style.opacity = "1";
          el.style.visibility = "visible";
          el.style.pointerEvents = fraction < 0.4 ? "auto" : "none";
        } else if (i === activeIdx + 1) {
          // Incoming card: moves up into the visual stacking zone over active card
          const translateY = (1 - fraction) * 105;
          el.style.transform = `translate3d(0, ${translateY}%, 0) scale(1)`;
          el.style.opacity = "1";
          el.style.visibility = "visible";
          el.style.pointerEvents = fraction > 0.6 ? "auto" : "none";
        } else {
          // Waiting below viewport
          el.style.transform = "translate3d(0, 110%, 0) scale(1)";
          el.style.opacity = "0";
          el.style.visibility = "hidden";
          el.style.pointerEvents = "none";
        }
      }
    };

    updateStack();

    const onScroll = () => {
      if (rafId === null) {
        rafId = requestAnimationFrame(updateStack);
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
      }
    };
  }, [categories]);

  if (!categories || categories.length === 0) {
    return null;
  }

  if (categories.length === 1) {
    return (
      <div className="flex flex-col gap-5 w-full">
        {categories.map((category) => (
          <div key={category.title} className="w-full" data-card-item>
            <TechCategoryCardContent category={category} />
          </div>
        ))}
      </div>
    );
  }

  const SCROLL_STEP = 380;
  const totalTravel = (categories.length - 1) * SCROLL_STEP;
  const totalContainerHeight = 500 + totalTravel + 60;

  return (
    <div
      ref={containerRef}
      data-mobile-tech-stack
      className="relative w-full"
      style={{ minHeight: `${totalContainerHeight}px` }}
    >
      {/* Sticky Stack Stage: stays in visual view while scrolling through section */}
      <div
        ref={stageRef}
        className="sticky top-[72px] sm:top-[80px] w-full pt-6 sm:pt-8 pb-4"
        style={{ minHeight: "500px" }}
      >
        <div className="relative w-full">
          {categories.map((category, index) => {
            const isFirst = index === 0;

            return (
              <div
                key={category.title}
                ref={(el) => {
                  cardRefs.current[index] = el;
                }}
                data-card-item
                className={`w-full will-change-transform ${
                  isFirst
                    ? "relative"
                    : "absolute top-0 left-0 right-0"
                }`}
                style={{
                  zIndex: 10 + index,
                  transform: isFirst
                    ? "none"
                    : "translate3d(0, 105%, 0)",
                  opacity: 1,
                  visibility: "visible",
                  pointerEvents: isFirst ? "auto" : "none",
                }}
              >
                <TechCategoryCardContent category={category} />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
