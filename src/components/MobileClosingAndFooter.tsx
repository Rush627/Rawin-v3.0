"use client";

import React, { useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useReducedMotion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import { getActiveSocialLinks } from "@/components/SocialIcons";
import type { GlobalContent, ContactContent } from "@/lib/site-content";

interface MobileClosingAndFooterProps {
  content?: Partial<GlobalContent>;
  contact?: Partial<ContactContent>;
  logo?: {
    url?: string;
    alt?: string;
  };
  footerCopyright?: string;
  currentYear?: number;
}

export default function MobileClosingAndFooter({
  content,
  contact,
  logo,
  footerCopyright,
  currentYear,
}: MobileClosingAndFooterProps) {
  const pathname = usePathname();
  const isExcludedStory = pathname === "/blog" || pathname === "/contact";
  const shouldReduceMotion = useReducedMotion();

  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const badgeRef = useRef<HTMLDivElement | null>(null);
  const timeToRef = useRef<HTMLDivElement | null>(null);
  const levelUpRef = useRef<HTMLDivElement | null>(null);
  const eyebrowRef = useRef<HTMLDivElement | null>(null);
  const impossibleRef = useRef<HTMLDivElement | null>(null);
  const ctaRef = useRef<HTMLDivElement | null>(null);

  // High-performance scroll tracking loop operating strictly outside React render cycle
  useEffect(() => {
    if (shouldReduceMotion || typeof window === "undefined") return;

    let rafId: number | null = null;

    const updateStory = () => {
      const container = scrollContainerRef.current;
      if (!container) return;

      const rect = container.getBoundingClientRect();
      const viewportH = window.innerHeight || document.documentElement.clientHeight || 800;
      const totalScroll = rect.height - viewportH;
      if (totalScroll <= 0) return;

      const currentScroll = -rect.top;
      const p = Math.max(0, Math.min(1, currentScroll / totalScroll));

      // ---------------------------------------------------------------
      // SCENE 1: ONE LAST THING / TIME TO (left) + LEVEL UP (right)
      // Dominant 0% - 22%
      // Transitions 22% - 50%
      // ---------------------------------------------------------------
      if (badgeRef.current && timeToRef.current && levelUpRef.current) {
        if (p <= 0.2) {
          badgeRef.current.style.opacity = "1";
          badgeRef.current.style.transform = "translate3d(0, 0, 0)";
          timeToRef.current.style.opacity = "1";
          timeToRef.current.style.transform = "translate3d(0, 0, 0)";
          levelUpRef.current.style.opacity = "1";
          levelUpRef.current.style.transform = "translate3d(0, 0, 0)";
        } else if (p > 0.2 && p <= 0.5) {
          const t = (p - 0.2) / 0.3;
          const badgeOp = Math.max(0, 1 - t * 2);
          badgeRef.current.style.opacity = badgeOp.toFixed(4);
          badgeRef.current.style.transform = `translate3d(0, ${(-25 * t).toFixed(2)}px, 0)`;

          // TIME TO slides left
          const xLeft = -100 * t;
          const opLeft = t > 0.6 ? Math.max(0, 1 - (t - 0.6) / 0.4) : 1;
          timeToRef.current.style.opacity = opLeft.toFixed(4);
          timeToRef.current.style.transform = `translate3d(${xLeft.toFixed(2)}vw, 0, 0)`;

          // LEVEL UP slides right
          const xRight = 100 * t;
          const opRight = t > 0.6 ? Math.max(0, 1 - (t - 0.6) / 0.4) : 1;
          levelUpRef.current.style.opacity = opRight.toFixed(4);
          levelUpRef.current.style.transform = `translate3d(${xRight.toFixed(2)}vw, 0, 0)`;
        } else {
          badgeRef.current.style.opacity = "0";
          timeToRef.current.style.opacity = "0";
          levelUpRef.current.style.opacity = "0";
        }
      }

      // ---------------------------------------------------------------
      // SCENE 2: HAVE A PROJECT IN MIND? +
      //          LET'S MAKE SOMETHING IMPOSSIBLE TO IGNORE.
      // Enters 44% - 66%, Dominant 66% - 82%
      // ---------------------------------------------------------------
      if (eyebrowRef.current && impossibleRef.current) {
        if (p < 0.42) {
          eyebrowRef.current.style.opacity = "0";
          eyebrowRef.current.style.transform = "translate3d(0, 30px, 0)";
          impossibleRef.current.style.opacity = "0";
          impossibleRef.current.style.transform = "translate3d(0, 45px, 0) scale(0.95)";
        } else if (p >= 0.42 && p <= 0.66) {
          const t = (p - 0.42) / 0.24;
          const op = t;
          const yEye = 30 * (1 - t);
          const yImp = 45 * (1 - t);
          const sc = 0.95 + 0.05 * t;

          eyebrowRef.current.style.opacity = op.toFixed(4);
          eyebrowRef.current.style.transform = `translate3d(0, ${yEye.toFixed(2)}px, 0)`;

          impossibleRef.current.style.opacity = op.toFixed(4);
          impossibleRef.current.style.transform = `translate3d(0, ${yImp.toFixed(2)}px, 0) scale(${sc.toFixed(4)})`;
        } else if (p > 0.66 && p <= 0.82) {
          eyebrowRef.current.style.opacity = "1";
          eyebrowRef.current.style.transform = "translate3d(0, 0, 0)";
          impossibleRef.current.style.opacity = "1";
          impossibleRef.current.style.transform = "translate3d(0, 0, 0) scale(1)";
        } else {
          // Subtle lift as CTA settles into center
          const t = Math.min(1, (p - 0.82) / 0.18);
          const yLift = -20 * t;
          eyebrowRef.current.style.opacity = (1 - 0.1 * t).toFixed(4);
          eyebrowRef.current.style.transform = `translate3d(0, ${yLift.toFixed(2)}px, 0)`;

          impossibleRef.current.style.opacity = (1 - 0.1 * t).toFixed(4);
          impossibleRef.current.style.transform = `translate3d(0, ${yLift.toFixed(2)}px, 0) scale(1)`;
        }
      }

      // ---------------------------------------------------------------
      // SCENE 3: COMPACT PILL CTA
      // Enters 70% - 90%
      // ---------------------------------------------------------------
      if (ctaRef.current) {
        if (p < 0.68) {
          ctaRef.current.style.opacity = "0";
          ctaRef.current.style.transform = "translate3d(0, 35px, 0) scale(0.96)";
          ctaRef.current.style.pointerEvents = "none";
        } else {
          const t = Math.min(1, (p - 0.68) / 0.22);
          const yCta = 35 * (1 - t);
          const scCta = 0.96 + 0.04 * t;

          ctaRef.current.style.opacity = t.toFixed(4);
          ctaRef.current.style.transform = `translate3d(0, ${yCta.toFixed(2)}px, 0) scale(${scCta.toFixed(4)})`;
          ctaRef.current.style.pointerEvents = t > 0.4 ? "auto" : "none";
        }
      }
    };

    const onScroll = () => {
      if (rafId === null) {
        rafId = requestAnimationFrame(() => {
          updateStory();
          rafId = null;
        });
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    updateStory();

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
      }
    };
  }, [shouldReduceMotion]);

  const emailAddress =
    contact?.email || content?.contactEmail || "rushansiddiqui5262@gmail.com";
  const activeSocialLinks = getActiveSocialLinks(
    contact?.socials || {
      github: "https://github.com/rush627",
      linkedin: "https://www.linkedin.com/in/rushan-s-8ab3b3338",
      twitter: "https://x.com/sidd_rushan__",
    }
  );

  const resolvedCopyright =
    footerCopyright ||
    content?.footerCopyright ||
    "RAWIN. All rights reserved. Designed & built by Rushan Siddiqui.";
  const year = currentYear ?? 2026;
  const copyrightText = `© ${year} ${resolvedCopyright}`;

  const DEFAULT_BULLET_NOTIFICATION =
    "BUILDING WITH INTENT • CRAFTING DIGITAL EXPERIENCES • ALWAYS LEARNING";
  const rawBulletNotification =
    content?.footerBulletNotification?.trim() || DEFAULT_BULLET_NOTIFICATION;
  const bulletItems: string[] = rawBulletNotification
    .split(/[•·]/)
    .map((s: string) => s.trim())
    .filter(Boolean);
  const notificationPhrases: string[] =
    bulletItems.length > 0 ? bulletItems : [rawBulletNotification];

  return (
    <footer className="w-full relative z-10">
      {/* ------------------------------------------------------------- */}
      {/* NEXT STUDIO INSPIRED CLOSING ANIMATION SCENE (Mobile / Tablet)*/}
      {/* ------------------------------------------------------------- */}
      {!isExcludedStory && (
        shouldReduceMotion ? (
        // Static fallback for reduced motion preference
        <div className="w-full py-16 px-5 sm:px-8 flex flex-col gap-10">
          <div className="flex flex-col">
            <div className="flex items-center gap-2 mb-3">
              <span className="w-2 h-2 rounded-full bg-pacific-cyan" />
              <span className="text-xs font-mono tracking-widest text-pacific-cyan uppercase font-semibold">
                ONE LAST THING
              </span>
            </div>
            <span className="text-[clamp(3rem,13vw,6rem)] font-black font-space tracking-tight text-foreground uppercase leading-[0.88]">
              TIME TO
            </span>
            <span className="footer-outline-text text-[clamp(3rem,13vw,6rem)] font-black font-space tracking-tight uppercase leading-[0.88] -mt-1 sm:-mt-3">
              LEVEL UP
            </span>
          </div>

          <div className="flex flex-col">
            <span className="text-xs font-mono tracking-widest text-pacific-cyan uppercase font-semibold mb-2">
              HAVE A PROJECT IN MIND?
            </span>
            <span className="text-[clamp(2.4rem,10vw,5rem)] font-black font-space tracking-tight text-foreground uppercase leading-[0.9]">
              LET&apos;S MAKE SOMETHING IMPOSSIBLE
            </span>
            <span className="footer-outline-text text-[clamp(2.4rem,10vw,5rem)] font-black font-space tracking-tight uppercase leading-[0.9] -mt-1 sm:-mt-2">
              TO IGNORE.
            </span>
          </div>

          {/* Pill-Shaped Start A Conversation CTA */}
          <Link
            href="/contact"
            className="w-full max-w-md mx-auto rounded-full border border-white/15 bg-surface/80 hover:border-pacific-cyan/50 hover:bg-surface transition-all duration-300 px-5 py-3.5 flex items-center justify-between gap-3 shadow-[0_8px_32px_rgba(0,0,0,0.4)]"
            aria-label="Start a conversation"
          >
            <div className="flex flex-col min-w-0">
              <span className="text-[10px] font-mono uppercase tracking-widest text-pacific-cyan font-semibold">
                START A CONVERSATION
              </span>
              <span className="text-xs sm:text-sm font-semibold font-space text-foreground truncate">
                {emailAddress}
              </span>
            </div>
            <div className="w-9 h-9 rounded-full bg-pacific-cyan/15 border border-pacific-cyan/30 flex items-center justify-center shrink-0 text-pacific-cyan">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </Link>
        </div>
      ) : (
        // Cinematic Scroll-Driven Viewport Scene
        <div ref={scrollContainerRef} className="relative h-story-mobile w-full">
          <div className="sticky top-0 h-stage-full w-full flex flex-col justify-center px-4 sm:px-6 overflow-hidden">
            {/* Ambient Background Shift */}
            <div
              aria-hidden="true"
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[340px] sm:w-[500px] h-[340px] sm:h-[500px] rounded-full bg-pacific-cyan/5 blur-[100px] pointer-events-none -z-10"
            />

            <div className="max-w-xl mx-auto w-full flex flex-col gap-6 relative z-10">
              {/* Center Stage: Overlapping Grid for Cross-Dissolving Cinematic Scenes */}
              <div className="grid grid-cols-1 grid-rows-1 [&>*]:col-start-1 [&>*]:row-start-1 items-center">
                {/* --------------------------------------------------- */}
                {/* SCENE 1: ONE LAST THING / TIME TO LEVEL UP          */}
                {/* --------------------------------------------------- */}
                <div className="flex flex-col select-none pointer-events-none w-full">
                  <div
                    ref={badgeRef}
                    className="flex items-center gap-2 mb-3 will-change-transform opacity-100"
                  >
                    <span className="w-2 h-2 rounded-full bg-pacific-cyan animate-pulse" />
                    <span className="text-xs font-mono tracking-widest text-pacific-cyan uppercase font-semibold">
                      ONE LAST THING
                    </span>
                  </div>

                  <div className="flex flex-col overflow-visible">
                    <div ref={timeToRef} className="will-change-transform">
                      <span className="text-[clamp(3.2rem,14vw,6.5rem)] font-black font-space tracking-tight text-foreground uppercase leading-[0.88] drop-shadow-sm whitespace-nowrap">
                        TIME TO
                      </span>
                    </div>
                    <div
                      ref={levelUpRef}
                      className="will-change-transform -mt-1 sm:-mt-3"
                    >
                      <span className="footer-outline-text text-[clamp(3.2rem,14vw,6.5rem)] font-black font-space tracking-tight uppercase leading-[0.88] whitespace-nowrap">
                        LEVEL UP
                      </span>
                    </div>
                  </div>
                </div>

                {/* --------------------------------------------------- */}
                {/* SCENE 2: HAVE A PROJECT IN MIND? +                  */}
                {/*          LET'S MAKE SOMETHING IMPOSSIBLE TO IGNORE. */}
                {/* --------------------------------------------------- */}
                <div className="flex flex-col select-none pointer-events-none w-full">
                  <div
                    ref={eyebrowRef}
                    className="flex items-center gap-2 mb-2 will-change-transform opacity-0"
                  >
                    <span className="text-xs font-mono tracking-widest text-pacific-cyan uppercase font-semibold">
                      HAVE A PROJECT IN MIND?
                    </span>
                  </div>

                  <div
                    ref={impossibleRef}
                    className="flex flex-col will-change-transform opacity-0"
                  >
                    <span className="text-[clamp(2.4rem,10.5vw,5.5rem)] font-black font-space tracking-tight text-foreground uppercase leading-[0.9] drop-shadow-sm">
                      LET&apos;S MAKE
                    </span>
                    <span className="text-[clamp(2.4rem,10.5vw,5.5rem)] font-black font-space tracking-tight text-foreground uppercase leading-[0.9] drop-shadow-sm">
                      SOMETHING IMPOSSIBLE
                    </span>
                    <span className="footer-outline-text text-[clamp(2.4rem,10.5vw,5.5rem)] font-black font-space tracking-tight uppercase leading-[0.9] -mt-1 sm:-mt-2">
                      TO IGNORE.
                    </span>
                  </div>
                </div>
              </div>

              {/* ----------------------------------------------------- */}
              {/* SCENE 3: REFINED COMPACT PILL CTA                     */}
              {/* ----------------------------------------------------- */}
              <div
                ref={ctaRef}
                className="w-full will-change-transform opacity-0 pointer-events-none pt-2"
              >
                <Link
                  href="/contact"
                  className="w-full max-w-md mx-auto rounded-full border border-white/15 bg-surface/90 hover:border-pacific-cyan/50 hover:bg-surface transition-all duration-300 px-5 py-3 sm:px-6 sm:py-3.5 flex items-center justify-between gap-3 shadow-[0_8px_32px_rgba(0,0,0,0.4)] group cursor-pointer block"
                  aria-label="Start a conversation: Navigate to Contact page"
                >
                  <div className="flex flex-col min-w-0">
                    <span className="text-[10px] font-mono uppercase tracking-widest text-pacific-cyan font-semibold group-hover:text-pacific-cyan/90 transition-colors">
                      START A CONVERSATION
                    </span>
                    <span className="text-xs sm:text-sm font-semibold font-space text-foreground truncate">
                      {emailAddress}
                    </span>
                  </div>
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-pacific-cyan/15 border border-pacific-cyan/30 flex items-center justify-center shrink-0 text-pacific-cyan group-hover:bg-pacific-cyan group-hover:text-ink-black group-hover:border-pacific-cyan group-hover:scale-105 transition-all duration-300 shadow-sm">
                    <ArrowUpRight className="w-4 h-4 sm:w-4.5 sm:h-4.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </div>
                </Link>
              </div>
            </div>
          </div>
        </div>
      ))}

      {/* ------------------------------------------------------------- */}
      {/* MOBILE & TABLET FOOTER: REFINED MINIMAL CLOSING STATEMENT    */}
      {/* ------------------------------------------------------------- */}
      <div className={`bg-ink-black/95 ${isExcludedStory ? "pt-6 sm:pt-8 border-t border-white/[0.08]" : "pt-0"} pb-[env(safe-area-inset-bottom,0px)] relative z-20 flex flex-col w-full overflow-x-clip`}>
        {/* Continuous Marquee / Notification Strip */}
        <div
          className="w-full overflow-hidden border-y border-white/[0.08] bg-[#0c0c14] py-2.5 sm:py-3 select-none"
          aria-hidden="true"
        >
          <div className="flex w-max animate-ticker">
            {/* Track 1 */}
            <div className="flex items-center shrink-0">
              {[1, 2, 3, 4].map((repeatIdx: number) => (
                <span key={`t1-${repeatIdx}`} className="inline-flex items-center">
                  {notificationPhrases.map((phrase: string, pIdx: number) => (
                    <React.Fragment key={`p1-${repeatIdx}-${pIdx}`}>
                      <span className="text-pacific-cyan font-bold mx-3 sm:mx-4 text-xs select-none">•</span>
                      <span className="text-[11px] sm:text-xs font-mono tracking-widest text-muted/90 uppercase font-medium whitespace-nowrap">
                        {phrase}
                      </span>
                    </React.Fragment>
                  ))}
                </span>
              ))}
            </div>
            {/* Track 2 (duplicate for seamless -50% loop) */}
            <div className="flex items-center shrink-0">
              {[1, 2, 3, 4].map((repeatIdx: number) => (
                <span key={`t2-${repeatIdx}`} className="inline-flex items-center">
                  {notificationPhrases.map((phrase: string, pIdx: number) => (
                    <React.Fragment key={`p2-${repeatIdx}-${pIdx}`}>
                      <span className="text-pacific-cyan font-bold mx-3 sm:mx-4 text-xs select-none">•</span>
                      <span className="text-[11px] sm:text-xs font-mono tracking-widest text-muted/90 uppercase font-medium whitespace-nowrap">
                        {phrase}
                      </span>
                    </React.Fragment>
                  ))}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Compact Social Channels (Above Copyright) */}
        <div className="flex items-center justify-center gap-5 text-muted/60 pt-7 sm:pt-9 mb-3.5">
          {activeSocialLinks.map((social) => {
            const Icon = social.icon;
            return (
              <a
                key={social.id}
                href={social.url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`${social.name} Profile`}
                className="p-1.5 rounded-lg hover:text-foreground hover:bg-white/[0.04] transition-colors"
              >
                <Icon className="w-4 h-4" />
              </a>
            );
          })}
        </div>

        {/* Dynamic CMS Copyright Text (Guaranteed Single Line across 375px+ phones) */}
        <div className="w-full flex justify-center px-2 sm:px-4 mb-2 sm:mb-3">
          <p className="text-[clamp(9.5px,2.65vw,12px)] font-sans text-muted/70 tracking-tight whitespace-nowrap text-center select-none">
            {copyrightText}
          </p>
        </div>

        {/* Giant Outlined RAWIN Typography Signature (Spans full width, intentionally clipped at bottom) */}
        <div
          className="w-full overflow-hidden select-none flex justify-center items-start pointer-events-none mt-1 sm:mt-2 h-[clamp(2.5rem,10.8vw,6.2rem)]"
          aria-hidden="true"
        >
          <span
            className="font-space font-black tracking-[0.03em] sm:tracking-[0.05em] text-[clamp(5.2rem,23vw,12rem)] leading-[0.76] text-center block whitespace-nowrap"
            aria-label="RAWIN"
          >
            <span className="rawin-outline-raw">RAW</span>
            <span className="rawin-outline-in">IN</span>
          </span>
        </div>
      </div>
    </footer>
  );
}
