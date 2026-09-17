"use client";

import React from "react";
import type { AboutPrincipleItem } from "@/lib/site-content";
import {
  Layers,
  Eye,
  Zap,
  Palette,
  Terminal,
  Cpu,
  Boxes,
  Compass,
  Sparkles,
  Code,
  Globe,
  History,
  FolderGit2,
  Server,
  Cloud,
  type LucideIcon,
} from "lucide-react";

const ICON_MAP: Record<string, LucideIcon> = {
  layers: Layers,
  eye: Eye,
  zap: Zap,
  palette: Palette,
  terminal: Terminal,
  cpu: Cpu,
  boxes: Boxes,
  compass: Compass,
  sparkles: Sparkles,
  code: Code,
  globe: Globe,
  history: History,
  folder: FolderGit2,
  server: Server,
  cloud: Cloud,
};

function resolveIcon(name?: string, fallback: LucideIcon = Zap): LucideIcon {
  if (!name) return fallback;
  return ICON_MAP[name.toLowerCase()] || fallback;
}

export interface MobilePrincipleItem {
  id?: string;
  number?: string;
  title: string;
  statement: string;
  icon?: string;
  displayOrder?: number;
}

interface MobileHowIBuildProps {
  principles: MobilePrincipleItem[];
}

export default function MobileHowIBuild({ principles }: MobileHowIBuildProps) {
  if (!principles || principles.length === 0) {
    return null;
  }

  return (
    <div
      data-particle-protected
      className="glass-panel rounded-2xl p-5 sm:p-7 border border-white/[0.07] w-full relative overflow-hidden bg-gradient-to-b from-surface/80 via-ink-black/90 to-surface/70"
    >
      {/* Editorial principles vertical stack */}
      <div className="flex flex-col relative before:absolute before:top-3 before:bottom-3 before:left-[11px] sm:before:left-[13px] before:w-[1px] before:bg-gradient-to-b before:from-pacific-cyan/50 before:via-pacific-cyan/20 before:to-white/[0.06]">
        {principles.map((principle, idx) => {
          const Icon = resolveIcon(principle.icon, Layers);
          const isLast = idx === principles.length - 1;
          const displayIndex = principle.number || `0${idx + 1}`;

          return (
            <div
              key={principle.number || idx}
              className={`relative pl-8 sm:pl-10 ${isLast ? "" : "pb-6 sm:pb-7"}`}
            >
              {/* Circular node on vertical rail */}
              <div
                className="absolute left-[5px] sm:left-[7px] top-1 w-3.5 h-3.5 rounded-full bg-ink-black border-2 border-pacific-cyan/70 shadow-[0_0_8px_rgba(24,155,173,0.35)] flex items-center justify-center z-10"
                aria-hidden="true"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-pacific-cyan" />
              </div>

              {/* Principle Item Content */}
              <div className="flex flex-col gap-1.5">
                {/* Index, Icon and Title header */}
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-pacific-cyan px-2 py-0.5 rounded bg-pacific-cyan/10 border border-pacific-cyan/20">
                    {displayIndex}
                  </span>
                  <div className="flex items-center gap-1.5 text-foreground font-space font-bold text-sm sm:text-base tracking-wide uppercase">
                    <Icon className="w-4 h-4 text-pacific-cyan shrink-0" />
                    <span>{principle.title}</span>
                  </div>
                </div>

                {/* Principle Statement Quote */}
                <p className="text-xs sm:text-sm text-muted/90 italic leading-relaxed pl-0.5">
                  &quot;{principle.statement}&quot;
                </p>
              </div>

              {/* Subtle divider between principles */}
              {!isLast && (
                <div className="mt-5 border-b border-white/[0.05]" aria-hidden="true" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
