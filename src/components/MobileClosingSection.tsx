"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowUpRight } from "lucide-react";

export interface MobileClosingSectionProps {
  emailAddress?: string;
}

/**
 * RAWIN 3.0 — Dedicated Smartphone Closing Section (<1024px)
 * 
 * FINAL TYPOGRAPHY REDESIGN:
 * - 100% COMPLETELY STATIC: Zero scroll listeners, zero rAF, zero observers, zero animation
 * - Completely removed: "ONE LAST THING" and "TIME TO LEVEL UP"
 * - Begins directly with: "HAVE A PROJECT IN MIND?"
 * - Editorial asymmetric headline:
 *     LET'S MAKE
 *         IMPOSSIBLE
 *     TO IGNORE. (Pacific Cyan outline overlapping subtly)
 * - NO card, NO panel, NO glass container behind the headline (continuous page background)
 * - Refined CTA pill with generous left inset (pl-8 sm:pl-10) and comfortable breathing room
 * - CMS dynamic email connection preserved
 */
export default function MobileClosingSection({
  emailAddress = "rushansiddiqui5262@gmail.com",
}: MobileClosingSectionProps) {
  const pathname = usePathname();

  // Lightweight debug marker (only active when ?ios-debug=1 is in query parameters)
  useEffect(() => {
    if (typeof window !== "undefined" && window.location.search.includes("ios-debug=1")) {
      console.log("[IOS_DEBUG] MOBILE_CLOSING_MOUNT", {
        pathname,
        emailAddress,
        architecture: "static-editorial-typography",
        timestamp: Date.now(),
      });
    }
  }, [pathname, emailAddress]);

  return (
    <section
      id="mobile-closing-section"
      className="relative w-full pt-14 sm:pt-20 pb-16 sm:pb-20 px-5 sm:px-8 bg-ink-black select-none overflow-hidden"
      aria-label="Closing Call To Action"
    >
      {/* Ambient Subtle Background Cyan Glow (Continuous on page canvas) */}
      <div
        aria-hidden="true"
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] sm:w-[420px] h-[300px] sm:h-[420px] rounded-full bg-pacific-cyan/5 blur-[90px] pointer-events-none -z-10"
      />

      <div className="max-w-xl mx-auto w-full flex flex-col">
        {/* ========================================================= */}
        {/* EYEBROW: HAVE A PROJECT IN MIND?                          */}
        {/* Left-aligned, small, uppercase, letter-spaced             */}
        {/* ========================================================= */}
        <div className="flex items-center gap-2 mb-4 sm:mb-5">
          <span className="w-1.5 h-1.5 rounded-full bg-pacific-cyan shadow-[0_0_6px_rgba(0,240,255,0.8)]" />
          <span className="text-xs font-mono tracking-widest text-pacific-cyan uppercase font-semibold">
            HAVE A PROJECT IN MIND?
          </span>
        </div>

        {/* ========================================================= */}
        {/* EDITORIAL HEADLINE: Staggered Asymmetric Composition       */}
        {/* Line 1: LET'S MAKE (Left aligned, solid white)            */}
        {/* Line 2: SOMETHING (Offset right, solid white - z-10)      */}
        {/* Line 3: IMPOSSIBLE (Offset further right, solid - z-10)    */}
        {/* Line 4: TO IGNORE. (Offset back left, cyan outline - z-0)  */}
        {/* ========================================================= */}
        <div className="flex flex-col w-full relative">
          {/* Line 1: LET'S MAKE (Starts toward left, solid white) */}
          <span className="text-[clamp(2.35rem,10.2vw,4.4rem)] font-black font-space tracking-tight text-foreground uppercase leading-[0.88] whitespace-nowrap">
            LET&apos;S MAKE
          </span>

          {/* Line 2: SOMETHING (Shifts slightly to the right, solid white: z-10) */}
          <span className="relative z-10 text-[clamp(2.45rem,10.6vw,4.6rem)] font-black font-space tracking-tight text-foreground uppercase leading-[0.88] pl-5 sm:pl-9 self-start whitespace-nowrap">
            SOMETHING
          </span>

          {/* Line 3: IMPOSSIBLE (Foreground visual anchor, solid white: z-10) */}
          <span className="relative z-10 text-[clamp(2.55rem,11.2vw,4.8rem)] font-black font-space tracking-tight text-foreground uppercase leading-[0.88] pl-8 sm:pl-14 self-start whitespace-nowrap">
            IMPOSSIBLE
          </span>

          {/* Line 4: TO IGNORE. (Moves back toward left, cyan outline layered BEHIND foreground: z-0) */}
          <span className="footer-outline-text relative z-0 text-[clamp(2.5rem,10.8vw,4.7rem)] font-black font-space tracking-tight uppercase leading-[0.88] -mt-2.5 sm:-mt-4 pl-1 sm:pl-2 whitespace-nowrap">
            TO IGNORE.
          </span>
        </div>

        {/* ========================================================= */}
        {/* CTA PILL: START A CONVERSATION + CMS EMAIL                */}
        {/* Sits comfortably below the headline with clear breathing  */}
        {/* ========================================================= */}
        <div className="pt-8 sm:pt-12 w-full">
          <Link
            href="/contact"
            className="group relative w-full rounded-full border border-white/15 bg-gradient-to-r from-surface/90 via-[#12121a]/95 to-surface/90 hover:border-pacific-cyan/50 hover:shadow-[0_0_25px_rgba(0,240,255,0.15)] transition-all duration-300 pl-8 sm:pl-10 pr-4 sm:pr-5 py-3.5 sm:py-4 flex items-center justify-between gap-4 shadow-[0_8px_32px_rgba(0,0,0,0.45)] cursor-pointer touch-manipulation active:scale-[0.98]"
            aria-label={`Start a conversation with ${emailAddress}`}
          >
            <div className="flex flex-col min-w-0 pr-2">
              <span className="text-[10px] sm:text-xs font-mono uppercase tracking-widest text-pacific-cyan font-semibold flex items-center gap-1.5">
                START A CONVERSATION
              </span>
              <span className="text-sm sm:text-base font-semibold font-space text-foreground truncate mt-0.5">
                {emailAddress}
              </span>
            </div>
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-pacific-cyan/15 border border-pacific-cyan/30 flex items-center justify-center shrink-0 text-pacific-cyan group-hover:bg-pacific-cyan group-hover:text-ink-black group-hover:border-pacific-cyan transition-all duration-300">
              <ArrowUpRight className="w-4 h-4 sm:w-4.5 sm:h-4.5 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </div>
          </Link>
        </div>
      </div>
    </section>
  );
}
