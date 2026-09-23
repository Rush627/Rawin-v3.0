import React from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Send } from "lucide-react";
import type { HomeContent, SiteAssets } from "@/lib/site-content";
import MobileHeroRole from "@/components/MobileHeroRole";

interface MobileHeroProps {
  homeContent: HomeContent;
  assets?: SiteAssets;
}

/**
 * MobileHero
 *
 * Dedicated, visually refined smartphone Hero component designed for maximum
 * iOS Safari / Chrome compositing stability and performance:
 * - 0 JS scroll listeners or requestAnimationFrame loops
 * - 0 heavy GPU blurs (no blur-[120px], no glass backdrop-filter)
 * - 0 continuous CSS keyframe animations (no animate-ping)
 * - Clean profile image with query string sanitization for Next/Image local optimization
 * - Responsive 128px - 144px profile circle focal point
 * - Compact premium availability pill
 * - Preserved existing typing animation fed by CMS heroTypingPhrases
 * - Vertically stacked primary and secondary CTA buttons
 * - Refined 2x2 capability section with subtle Pacific Cyan L-shaped corner accents
 * - 100% connected to existing CMS / MongoDB data pipeline via props
 */
export default function MobileHero({ homeContent, assets }: MobileHeroProps) {
  const rawProfileUrl = assets?.profilePhoto?.url || "/images/profile.png";
  // Strip cache-busting query strings so Next/Image optimizer processes local API route cleanly
  const profileUrl = rawProfileUrl.startsWith("/api/")
    ? rawProfileUrl.split("?")[0]
    : rawProfileUrl;
  const profileAlt =
    assets?.profilePhoto?.alt || "Rushan Siddiqui : Full Stack Developer";

  return (
    <section
      id="mobile-hero"
      aria-label="Introduction"
      className="relative flex flex-col items-center text-center pt-1 sm:pt-3 pb-6 w-full"
    >
      {/* 1. Status Pill Badge - Compact, subtle, elegant status indicator */}
      <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[9px] sm:text-[10px] font-mono font-medium text-muted/80 bg-[#12121a] border border-white/[0.08] max-w-[90vw] overflow-hidden mb-2.5">
        <span
          className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0"
          aria-hidden="true"
        />
        <span className="truncate">{homeContent.heroStatus}</span>
        <span className="text-white/20 shrink-0 text-[8px]">•</span>
        <span className="text-pacific-cyan font-medium shrink-0">
          {homeContent.heroBadge}
        </span>
      </div>

      {/* 2. Integrated Profile Portrait - Responsive 128px - 144px circular focal point */}
      <div className="relative mt-4 mb-4 sm:mt-5 sm:mb-5">
        <div className="w-32 h-32 sm:w-[136px] sm:h-[136px] md:w-36 md:h-36 rounded-full overflow-hidden p-1 bg-gradient-to-b from-pacific-cyan/35 via-white/[0.08] to-pacific-cyan/20 border border-pacific-cyan/40 shadow-lg mx-auto bg-surface">
          <Image
            src={profileUrl}
            alt={profileAlt}
            width={144}
            height={144}
            priority
            sizes="(max-width: 640px) 128px, 144px"
            className="w-full h-full object-cover rounded-full bg-surface"
          />
        </div>
      </div>

      {/* 3. Confident Typography & CMS Name & Lightweight Typing Role */}
      <div className="flex flex-col items-center gap-1 sm:gap-1.5 w-full max-w-xl md:max-w-2xl mx-auto px-1">
        <h1 className="text-[clamp(1.25rem,6.1vw,2.15rem)] sm:text-4xl font-bold tracking-tight text-foreground font-space leading-[1.15] whitespace-nowrap text-center">
          {homeContent.heroTitlePrefix}{" "}
          <span className="text-pacific-cyan" id="mobile-hero-name">
            {homeContent.heroName}
          </span>
        </h1>
        <MobileHeroRole phrases={homeContent.heroTypingPhrases} />
      </div>

      {/* 4. Bio Statement - Comfortable typography and wider readable line length */}
      <p className="mt-4 sm:mt-5 md:mt-6 w-full max-w-[348px] min-[400px]:max-w-[370px] sm:max-w-[400px] md:max-w-xl text-xs sm:text-sm md:text-base text-muted/80 leading-relaxed font-sans mx-auto px-1">
        {homeContent.heroBio}
      </p>

      {/* 5. Primary & Secondary CTAs - Compact on mobile, balanced horizontal row on tablet */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-center gap-3 sm:gap-3.5 md:gap-4 mt-5 sm:mt-6 md:mt-7 w-full max-w-[270px] min-[390px]:max-w-[290px] sm:max-w-[310px] md:max-w-none mx-auto">
        <Link
          href="/projects"
          className="w-full md:w-auto justify-center inline-flex items-center gap-2 px-5 md:px-7 py-2.5 md:py-3 rounded-xl bg-pacific-cyan text-ink-black font-semibold text-xs sm:text-sm hover:bg-pacific-cyan/90 active:scale-[0.99] transition-all text-center min-h-[42px] sm:min-h-[44px] shadow-sm"
        >
          <span className="truncate">{homeContent.heroPrimaryCtaText}</span>
          <ArrowRight className="w-4 h-4 shrink-0" />
        </Link>
        <Link
          href="/contact"
          className="w-full md:w-auto justify-center inline-flex items-center gap-2 px-5 md:px-7 py-2.5 md:py-3 rounded-xl bg-[#141420] border border-white/10 text-foreground font-medium text-xs sm:text-sm hover:border-pacific-cyan/40 active:scale-[0.99] transition-all text-center min-h-[42px] sm:min-h-[44px]"
        >
          <span className="truncate">{homeContent.heroSecondaryCtaText}</span>
          <Send className="w-3.5 h-3.5 text-pacific-cyan shrink-0" />
        </Link>
      </div>

      {/* Subtle quiet separator with generous breathing space before capabilities */}
      <div
        className="w-full max-w-[280px] min-[400px]:max-w-[320px] sm:max-w-[360px] md:max-w-2xl mx-auto mt-8 mb-7 sm:mt-10 sm:mb-8 md:mt-12 md:mb-10 border-t border-white/[0.07]"
        aria-hidden="true"
      />

      {/* 6. Capabilities Section - 2x2 grid on mobile, sleek 4-column bar on tablet */}
      <div className="w-full max-w-[348px] min-[400px]:max-w-[364px] sm:max-w-[380px] md:max-w-2xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-3.5 md:gap-3">
          {/* Item 1: Next.js & React */}
          <div className="relative py-3 sm:py-3.5 px-3 flex flex-col items-center justify-center text-center select-none">
            <span
              className="absolute top-0 left-0 w-2.5 h-2.5 border-t border-l border-pacific-cyan/70 pointer-events-none"
              aria-hidden="true"
            />
            <span
              className="absolute bottom-0 right-0 w-2.5 h-2.5 border-b border-r border-pacific-cyan/70 pointer-events-none"
              aria-hidden="true"
            />
            <span className="text-xs sm:text-sm font-bold text-foreground font-space tracking-tight">
              Next.js
            </span>
            <span className="text-[10px] sm:text-[11px] text-muted/70 font-mono uppercase tracking-wider mt-0.5">
              &amp; React
            </span>
          </div>

          {/* Item 2: Full Stack Development */}
          <div className="relative py-3 sm:py-3.5 px-3 flex flex-col items-center justify-center text-center select-none">
            <span
              className="absolute top-0 left-0 w-2.5 h-2.5 border-t border-l border-pacific-cyan/70 pointer-events-none"
              aria-hidden="true"
            />
            <span
              className="absolute bottom-0 right-0 w-2.5 h-2.5 border-b border-r border-pacific-cyan/70 pointer-events-none"
              aria-hidden="true"
            />
            <span className="text-xs sm:text-sm font-bold text-pacific-cyan font-space tracking-tight">
              Full Stack
            </span>
            <span className="text-[10px] sm:text-[11px] text-muted/70 font-mono uppercase tracking-wider mt-0.5">
              Development
            </span>
          </div>

          {/* Item 3: Modern Web Systems */}
          <div className="relative py-3 sm:py-3.5 px-3 flex flex-col items-center justify-center text-center select-none">
            <span
              className="absolute top-0 left-0 w-2.5 h-2.5 border-t border-l border-pacific-cyan/70 pointer-events-none"
              aria-hidden="true"
            />
            <span
              className="absolute bottom-0 right-0 w-2.5 h-2.5 border-b border-r border-pacific-cyan/70 pointer-events-none"
              aria-hidden="true"
            />
            <span className="text-xs sm:text-sm font-bold text-apricot-cream font-space tracking-tight">
              Modern
            </span>
            <span className="text-[10px] sm:text-[11px] text-muted/70 font-mono uppercase tracking-wider mt-0.5">
              Web Systems
            </span>
          </div>

          {/* Item 4: Interaction & Motion */}
          <div className="relative py-3 sm:py-3.5 px-3 flex flex-col items-center justify-center text-center select-none">
            <span
              className="absolute top-0 left-0 w-2.5 h-2.5 border-t border-l border-pacific-cyan/70 pointer-events-none"
              aria-hidden="true"
            />
            <span
              className="absolute bottom-0 right-0 w-2.5 h-2.5 border-b border-r border-pacific-cyan/70 pointer-events-none"
              aria-hidden="true"
            />
            <span className="text-xs sm:text-sm font-bold text-foreground font-space tracking-tight">
              Interaction
            </span>
            <span className="text-[10px] sm:text-[11px] text-muted/70 font-mono uppercase tracking-wider mt-0.5">
              &amp; Motion
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
