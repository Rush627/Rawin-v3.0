"use client";

import React from "react";
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

/**
 * Native CSS Sticky Stacking Smartphone Tech Stack (<1024px)
 * 
 * - ZERO JavaScript scroll listeners
 * - ZERO requestAnimationFrame loops
 * - ZERO getBoundingClientRect calculations
 * - ZERO IntersectionObserver / ResizeObserver
 * - Native browser CSS sticky positioning handles stacking & unstacking
 * - Progressive top offset (calc(4.75rem + index * 0.85rem)) creates clean layered tabs
 * - Fluid natural document scroll flow
 */
export default function MobileTechStack({ categories }: MobileTechStackProps) {
  if (!categories || categories.length === 0) {
    return null;
  }

  return (
    <div
      data-mobile-tech-stack
      className="relative w-full flex flex-col pt-2 pb-10"
    >
      {categories.map((category, index) => {
        const isLast = index === categories.length - 1;
        // Progressive sticky top offset: Card 1 at ~4.75rem (76px), Card 2 at ~5.6rem (90px),
        // Card 3 at ~6.45rem (103px), Card 4 at ~7.3rem (117px).
        // Each card has higher z-index (10 + index), layering over earlier cards while leaving
        // the top rim of earlier cards visible as binder tabs.
        const stickyTop = `calc(4.75rem + ${index * 0.85}rem)`;
        const zIndex = 10 + index;

        return (
          <div
            key={category.title}
            data-card-item
            data-category={category.title}
            className="sticky w-full"
            style={{
              top: stickyTop,
              zIndex,
              marginBottom: isLast ? "0rem" : "5rem",
            }}
          >
            <TechCategoryCardContent category={category} />
          </div>
        );
      })}
    </div>
  );
}
