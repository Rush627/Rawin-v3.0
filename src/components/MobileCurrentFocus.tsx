"use client";

import React from "react";
import type { AboutFocusItem } from "@/lib/site-content";
import {
  Terminal,
  Compass,
  Cpu,
  Boxes,
  Layers,
  Eye,
  Zap,
  Palette,
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
  terminal: Terminal,
  compass: Compass,
  cpu: Cpu,
  boxes: Boxes,
  layers: Layers,
  eye: Eye,
  zap: Zap,
  palette: Palette,
  sparkles: Sparkles,
  code: Code,
  globe: Globe,
  history: History,
  folder: FolderGit2,
  server: Server,
  cloud: Cloud,
};

function resolveIcon(name?: string, fallback: LucideIcon = Terminal): LucideIcon {
  if (!name) return fallback;
  return ICON_MAP[name.toLowerCase()] || fallback;
}

export interface MobileFocusItem {
  id?: string;
  title: string;
  description: string;
  icon?: string;
  displayOrder?: number;
}

interface MobileCurrentFocusProps {
  focusAreas: MobileFocusItem[];
}

export default function MobileCurrentFocus({ focusAreas }: MobileCurrentFocusProps) {
  if (!focusAreas || focusAreas.length === 0) {
    return null;
  }

  return (
    <div
      data-particle-protected
      className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 w-full"
    >
      {focusAreas.map((focus, idx) => {
        const Icon = resolveIcon(focus.icon, Terminal);
        const indexBadge = `0${idx + 1}`;

        return (
          <div
            key={focus.title || idx}
            className="glass-card rounded-xl p-4 sm:p-5 border border-white/[0.07] bg-ink-black/75 flex flex-col justify-between gap-3 relative overflow-hidden group hover:border-pacific-cyan/35 transition-all"
          >
            {/* Top row with compact index badge and icon */}
            <div className="flex items-center justify-between">
              <span className="font-mono text-[11px] font-bold text-pacific-cyan px-2 py-0.5 rounded bg-pacific-cyan/10 border border-pacific-cyan/20">
                {indexBadge}
              </span>
              <div className="w-7 h-7 rounded-lg bg-surface border border-white/[0.08] flex items-center justify-center text-pacific-cyan group-hover:border-pacific-cyan/40 transition-colors">
                <Icon className="w-3.5 h-3.5" />
              </div>
            </div>

            {/* Title and concise description */}
            <div className="flex flex-col gap-1">
              <h4 className="text-sm sm:text-base font-bold text-foreground font-space tracking-wide">
                {focus.title}
              </h4>
              <p className="text-xs text-muted/90 leading-relaxed">
                {focus.description}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
