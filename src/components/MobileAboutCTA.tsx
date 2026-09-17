"use client";

import React from "react";
import Link from "next/link";
import { Download, Send } from "lucide-react";

interface MobileAboutCTAProps {
  eyebrow?: string;
  heading?: string;
  description?: string;
  resumeText?: string;
  contactText?: string;
}

export default function MobileAboutCTA({
  eyebrow = "LET'S BUILD TOGETHER",
  heading = "Have something worth building?",
  description = "Open to full-time roles, freelance projects, and collaborations.",
  resumeText = "View Resume",
  contactText = "Get in Touch",
}: MobileAboutCTAProps) {
  return (
    <section
      data-particle-protected
      className="relative w-full rounded-2xl p-6 sm:p-8 border border-white/[0.08] bg-gradient-to-b from-surface/90 via-ink-black/95 to-surface/80 overflow-hidden"
    >
      {/* Subtle oversized typographic background watermark */}
      <div
        aria-hidden="true"
        className="absolute -bottom-4 -right-2 text-7xl sm:text-8xl font-black font-space text-white/[0.03] select-none pointer-events-none tracking-tighter leading-none"
      >
        RAWIN
      </div>

      <div className="relative z-10 flex flex-col gap-4">
        {/* Eyebrow, Heading, Description */}
        <div className="flex flex-col gap-2">
          <span className="text-xs font-mono font-semibold tracking-wider text-pacific-cyan uppercase">
            {eyebrow}
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground font-space leading-tight">
            {heading}
          </h2>
          <p className="text-xs sm:text-sm text-muted leading-relaxed max-w-sm">
            {description}
          </p>
        </div>

        {/* Action Buttons: Touch-friendly with clear hierarchy */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-3 border-t border-white/[0.06] mt-1">
          <Link
            href="/resume"
            className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-pacific-cyan text-ink-black font-semibold text-xs sm:text-sm hover:bg-pacific-cyan/90 transition-all shadow-[0_0_20px_rgba(24,155,173,0.3)] min-h-[44px] text-center"
          >
            <Download className="w-4 h-4 shrink-0" />
            <span>{resumeText}</span>
          </Link>
          <Link
            href="/contact"
            className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl glass-card text-foreground font-medium text-xs sm:text-sm hover:border-pacific-cyan/40 transition-colors border border-white/10 min-h-[44px] text-center"
          >
            <Send className="w-4 h-4 text-pacific-cyan shrink-0" />
            <span>{contactText}</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
