"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useReducedMotion } from "framer-motion";
import { ArrowUp, ArrowUpRight } from "lucide-react";
import {
  GithubIcon,
  LinkedinIcon,
  TwitterIcon,
} from "@/components/SocialIcons";

import type { GlobalContent, ContactContent } from "@/lib/site-content";

interface FooterProps {
  content?: Partial<GlobalContent>;
  contact?: Partial<ContactContent>;
  logo?: {
    url?: string;
    alt?: string;
  };
  footerCopyright?: string;
  currentYear?: number;
}

export default function Footer({
  content,
  contact,
  logo,
  footerCopyright,
  currentYear,
}: FooterProps = {}) {
  const pathname = usePathname();
  const shouldReduceMotion = useReducedMotion();

  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const state1Ref = useRef<HTMLDivElement | null>(null);
  const state2Ref = useRef<HTMLDivElement | null>(null);
  const ctaRef = useRef<HTMLDivElement | null>(null);
  const glowRef = useRef<HTMLDivElement | null>(null);

  const scrollToTop = () => {
    if (typeof window === "undefined") return;

    const lenis = (
      window as unknown as {
        __lenis?: {
          scrollTo: (
            target: number | HTMLElement,
            options?: { immediate?: boolean; lock?: boolean; force?: boolean }
          ) => void;
        };
      }
    ).__lenis;

    if (lenis && typeof lenis.scrollTo === "function") {
      lenis.scrollTo(0, { immediate: false });
      return;
    }

    try {
      window.scrollTo({
        top: 0,
        left: 0,
        behavior: "smooth",
      });
    } catch {
      window.scrollTo(0, 0);
    }

    if (document.documentElement && document.documentElement.scrollTop > 0) {
      document.documentElement.scrollTop = 0;
    }
    if (document.body && document.body.scrollTop > 0) {
      document.body.scrollTop = 0;
    }
  };

  // High-performance scroll tracking loop operating outside React render cycle
  useEffect(() => {
    if (shouldReduceMotion || typeof window === "undefined") return;

    let rafId: number | null = null;

    const updateStory = () => {
      const container = scrollContainerRef.current;
      if (!container) return;

      const rect = container.getBoundingClientRect();
      const totalScroll = rect.height - window.innerHeight;
      if (totalScroll <= 0) return;

      // Normalized progress: 0 when container top hits viewport top, 1 when container ends
      const currentScroll = -rect.top;
      const p = Math.max(0, Math.min(1, currentScroll / totalScroll));

      // -------------------------------------------------------------
      // STATE 1: ONE LAST THING / TELL ME WHAT'S NEXT.
      // Dominant 0% - 28%, then translates up and fades out by 50%
      // -------------------------------------------------------------
      if (state1Ref.current) {
        let opacity = 1;
        let y = 0;
        let scale = 1;

        if (p > 0.28) {
          const t = Math.min(1, (p - 0.28) / 0.22);
          opacity = 1 - t;
          y = -50 * t;
          scale = 1 - 0.05 * t;
        }

        state1Ref.current.style.opacity = opacity.toFixed(4);
        state1Ref.current.style.transform = `translate3d(0, ${y.toFixed(2)}px, 0) scale(${scale.toFixed(4)})`;
      }

      // -------------------------------------------------------------
      // STATE 2: LET'S MAKE SOMETHING IMPOSSIBLE TO IGNORE.
      // Enters 32% - 54%, dominant 54% - 78%, subtle lift as CTA reveals
      // -------------------------------------------------------------
      if (state2Ref.current) {
        let opacity = 0;
        let y = 60;
        let scale = 0.95;

        if (p >= 0.32 && p <= 0.54) {
          const t = (p - 0.32) / 0.22;
          opacity = t;
          y = 60 * (1 - t);
          scale = 0.95 + 0.05 * t;
        } else if (p > 0.54 && p <= 0.78) {
          opacity = 1;
          y = 0;
          scale = 1;
        } else if (p > 0.78) {
          const t = Math.min(1, (p - 0.78) / 0.16);
          opacity = 1 - 0.12 * t;
          y = -25 * t;
          scale = 1;
        }

        state2Ref.current.style.opacity = opacity.toFixed(4);
        state2Ref.current.style.transform = `translate3d(0, ${y.toFixed(2)}px, 0) scale(${scale.toFixed(4)})`;
      }

      // -------------------------------------------------------------
      // STATE 3: LARGE CTA STRIP (Bridging directly to /contact)
      // Enters smoothly 62% - 82%, becomes fully interactive
      // -------------------------------------------------------------
      if (ctaRef.current) {
        let opacity = 0;
        let y = 40;

        if (p >= 0.62) {
          const t = Math.min(1, (p - 0.62) / 0.2);
          opacity = t;
          y = 40 * (1 - t);
        }

        ctaRef.current.style.opacity = opacity.toFixed(4);
        ctaRef.current.style.transform = `translate3d(0, ${y.toFixed(2)}px, 0)`;
        ctaRef.current.style.pointerEvents = opacity > 0.3 ? "auto" : "none";
      }

      // -------------------------------------------------------------
      // AMBIENT GLOW SURFACE SHIFT
      // -------------------------------------------------------------
      if (glowRef.current) {
        let glowOpacity = 0.15;
        if (p >= 0.2 && p <= 0.55) {
          glowOpacity = 0.15 + ((p - 0.2) / 0.35) * 0.35;
        } else if (p > 0.55) {
          glowOpacity = Math.max(0.2, 0.5 - ((p - 0.55) / 0.45) * 0.25);
        }
        glowRef.current.style.opacity = glowOpacity.toFixed(4);
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

  // Route Exception 1: Admin and AI Orbit have no footer
  if (
    pathname.startsWith("/admin") ||
    pathname === "/ai" ||
    pathname.startsWith("/ai/")
  ) {
    return null;
  }

  const resolvedCopyright =
    footerCopyright ||
    content?.footerCopyright ||
    "RAWIN. All rights reserved. Designed & built by Rushan Siddiqui.";
  const year = currentYear ?? 2026;
  const copyrightText = `© ${year} ${resolvedCopyright}`;

  // Route Exception 2: Contact page renders only the sleek minimal bottom strip
  if (pathname === "/contact") {
    return (
      <footer className="relative z-20 w-full border-t border-white/[0.06] bg-ink-black py-8 px-6 mt-16">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted sm:pr-16">
          <p>{copyrightText}</p>
          <button
            type="button"
            onClick={scrollToTop}
            aria-label="Back to top"
            className="flex items-center gap-1.5 px-3.5 py-2 min-h-[40px] rounded-lg glass-card hover:text-foreground hover:border-pacific-cyan/40 transition-colors cursor-pointer relative z-30 shadow-md active:scale-95 touch-manipulation"
            style={{ touchAction: "manipulation" }}
          >
            <span>Back to top</span>
            <ArrowUp className="w-3.5 h-3.5 text-pacific-cyan" />
          </button>
        </div>
      </footer>
    );
  }

  // Dynamic CMS email and social channels
  const emailAddress =
    contact?.email || content?.contactEmail || "rushansiddiqui5262@gmail.com";
  const githubUrl = contact?.socials?.github ?? "https://github.com/rush627";
  const linkedinUrl =
    contact?.socials?.linkedin ??
    "https://www.linkedin.com/in/rushan-s-8ab3b3338";
  const twitterUrl =
    contact?.socials?.twitter ?? "https://x.com/sidd_rushan__";

  return (
    <footer className="relative z-20 w-full border-t border-white/[0.06] bg-ink-black mt-28 md:mt-36 overflow-x-clip">
      {/* ------------------------------------------------------------- */}
      {/* SCROLL-DRIVEN CLOSING STORY CONTAINER                         */}
      {/* ------------------------------------------------------------- */}
      {shouldReduceMotion ? (
        // Reduced Motion Fallback: Stable, accessible, non-animated layout
        <div className="max-w-6xl mx-auto px-4 sm:px-6 md:px-8 pt-20 pb-16 flex flex-col gap-16">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-pacific-cyan" />
              <span className="text-xs sm:text-sm font-mono tracking-widest text-pacific-cyan uppercase font-semibold">
                ONE LAST THING
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-5xl sm:text-7xl md:text-8xl font-black font-space tracking-tight text-foreground uppercase leading-[0.9]">
                LET&apos;S MAKE
              </span>
              <span className="text-5xl sm:text-7xl md:text-8xl font-black font-space tracking-tight text-foreground uppercase leading-[0.9]">
                SOMETHING IMPOSSIBLE
              </span>
              <span className="footer-outline-text text-5xl sm:text-7xl md:text-8xl font-black font-space tracking-tight uppercase leading-[0.9] -mt-2 sm:-mt-4">
                TO IGNORE.
              </span>
            </div>
          </div>

          <Link
            href="/contact"
            aria-label="Start a conversation - Navigate to Contact page"
            className="group relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 p-6 sm:p-8 md:p-10 rounded-2xl sm:rounded-3xl bg-surface/60 border border-white/10 hover:border-pacific-cyan/40 hover:bg-surface/90 transition-all duration-300 shadow-[0_8px_32px_rgba(0,0,0,0.36)] block overflow-hidden cursor-pointer"
          >
            <div className="flex flex-col gap-1.5 sm:gap-2">
              <span className="text-xs font-mono uppercase tracking-widest text-muted/70 group-hover:text-pacific-cyan transition-colors">
                START A CONVERSATION
              </span>
              <span className="text-lg xs:text-xl sm:text-2xl md:text-3xl lg:text-4xl font-semibold font-space text-foreground tracking-tight break-all sm:break-normal">
                {emailAddress}
              </span>
            </div>
            <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-white/[0.04] border border-white/15 flex items-center justify-center shrink-0 text-pacific-cyan group-hover:bg-pacific-cyan group-hover:text-ink-black group-hover:border-pacific-cyan group-hover:scale-105 transition-all duration-300 shadow-md self-end sm:self-auto">
              <ArrowUpRight className="w-5 h-5 sm:w-7 sm:h-7" />
            </div>
          </Link>
        </div>
      ) : (
        // Standard Scroll-Driven Closing Scene (Pinned / Sticky viewport)
        <div ref={scrollContainerRef} className="relative h-[210vh] w-full">
          <div className="sticky top-0 h-screen w-full flex flex-col justify-center px-4 sm:px-6 md:px-8 overflow-hidden">
            {/* Ambient Background Shift */}
            <div
              ref={glowRef}
              aria-hidden="true"
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] md:w-[1000px] h-[500px] rounded-full bg-pacific-cyan/5 blur-[120px] pointer-events-none -z-10 will-change-transform opacity-15"
            />

            <div className="max-w-6xl mx-auto w-full flex flex-col gap-8 md:gap-12 relative z-10">
              {/* Center Stage: Overlapping Grid for Smooth Cross-Dissolve & Translation */}
              <div className="grid grid-cols-1 grid-rows-1 [&>*]:col-start-1 [&>*]:row-start-1 items-center">
                {/* ------------------------------------------------------- */}
                {/* STATE 1: ONE LAST THING / TELL ME WHAT'S NEXT.          */}
                {/* ------------------------------------------------------- */}
                <div
                  ref={state1Ref}
                  className="flex flex-col select-none pointer-events-none will-change-transform opacity-100"
                >
                  <div className="flex items-center gap-2 mb-4 md:mb-6">
                    <span className="w-2 h-2 rounded-full bg-pacific-cyan animate-pulse" />
                    <span className="text-xs sm:text-sm font-mono tracking-widest text-pacific-cyan uppercase font-semibold">
                      ONE LAST THING
                    </span>
                  </div>

                  {/* Desktop Layout */}
                  <div className="hidden sm:flex flex-col">
                    <span className="text-6xl sm:text-7xl md:text-8xl lg:text-9xl font-black font-space tracking-tight text-foreground uppercase leading-[0.88] drop-shadow-sm">
                      TELL ME
                    </span>
                    <span className="footer-outline-text text-6xl sm:text-7xl md:text-8xl lg:text-9xl font-black font-space tracking-tight uppercase leading-[0.88] -mt-3 sm:-mt-5 md:-mt-8">
                      WHAT&apos;S NEXT.
                    </span>
                  </div>

                  {/* Mobile Layout */}
                  <div className="flex sm:hidden flex-col">
                    <span className="text-4xl xs:text-5xl font-black font-space tracking-tight text-foreground uppercase leading-[0.9]">
                      TELL ME
                    </span>
                    <span className="footer-outline-text text-4xl xs:text-5xl font-black font-space tracking-tight uppercase leading-[0.9] -mt-1">
                      WHAT&apos;S
                    </span>
                    <span className="footer-outline-text text-4xl xs:text-5xl font-black font-space tracking-tight uppercase leading-[0.9] -mt-1">
                      NEXT.
                    </span>
                  </div>
                </div>

                {/* ------------------------------------------------------- */}
                {/* STATE 2: LET'S MAKE SOMETHING IMPOSSIBLE TO IGNORE.     */}
                {/* ------------------------------------------------------- */}
                <div
                  ref={state2Ref}
                  className="flex flex-col select-none pointer-events-none will-change-transform opacity-0"
                >
                  {/* Desktop Layout */}
                  <div className="hidden sm:flex flex-col">
                    <span className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black font-space tracking-tight text-foreground uppercase leading-[0.88] drop-shadow-sm">
                      LET&apos;S MAKE
                    </span>
                    <span className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black font-space tracking-tight text-foreground uppercase leading-[0.88] drop-shadow-sm">
                      SOMETHING IMPOSSIBLE
                    </span>
                    <span className="footer-outline-text text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black font-space tracking-tight uppercase leading-[0.88] -mt-2 sm:-mt-4 md:-mt-6">
                      TO IGNORE.
                    </span>
                  </div>

                  {/* Mobile Layout */}
                  <div className="flex sm:hidden flex-col">
                    <span className="text-3xl xs:text-4xl font-black font-space tracking-tight text-foreground uppercase leading-[0.95]">
                      LET&apos;S MAKE
                    </span>
                    <span className="text-3xl xs:text-4xl font-black font-space tracking-tight text-foreground uppercase leading-[0.95]">
                      SOMETHING
                    </span>
                    <span className="text-3xl xs:text-4xl font-black font-space tracking-tight text-foreground uppercase leading-[0.95]">
                      IMPOSSIBLE
                    </span>
                    <span className="footer-outline-text text-3xl xs:text-4xl font-black font-space tracking-tight uppercase leading-[0.95] -mt-1">
                      TO IGNORE.
                    </span>
                  </div>
                </div>
              </div>

              {/* ------------------------------------------------------- */}
              {/* STATE 3: LARGE CTA STRIP (Bridging directly to /contact)*/}
              {/* ------------------------------------------------------- */}
              <div
                ref={ctaRef}
                className="will-change-transform opacity-0 pointer-events-none"
              >
                <Link
                  href="/contact"
                  aria-label="Start a conversation - Navigate to Contact page"
                  className="group relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 p-6 sm:p-8 md:p-10 rounded-2xl sm:rounded-3xl bg-surface/60 border border-white/10 hover:border-pacific-cyan/40 hover:bg-surface/90 transition-all duration-300 shadow-[0_8px_32px_rgba(0,0,0,0.36)] hover:shadow-[0_12px_40px_rgba(24,155,173,0.14)] block overflow-hidden cursor-pointer"
                >
                  {/* Subtle accent hover aura */}
                  <div
                    aria-hidden="true"
                    className="absolute -right-16 -top-16 w-48 h-48 rounded-full bg-pacific-cyan/10 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                  />

                  <div className="flex flex-col gap-1.5 sm:gap-2">
                    <span className="text-xs font-mono uppercase tracking-widest text-muted/70 group-hover:text-pacific-cyan transition-colors">
                      START A CONVERSATION
                    </span>
                    <span className="text-lg xs:text-xl sm:text-2xl md:text-3xl lg:text-4xl font-semibold font-space text-foreground tracking-tight break-all sm:break-normal">
                      {emailAddress}
                    </span>
                  </div>

                  {/* Circular Action Button */}
                  <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-white/[0.04] border border-white/15 flex items-center justify-center shrink-0 text-pacific-cyan group-hover:bg-pacific-cyan group-hover:text-ink-black group-hover:border-pacific-cyan group-hover:scale-105 transition-all duration-300 shadow-md self-end sm:self-auto">
                    <ArrowUpRight className="w-5 h-5 sm:w-7 sm:h-7 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </div>
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* SIMPLIFIED EDITORIAL BOTTOM NAVIGATION                        */}
      {/* ------------------------------------------------------------- */}
      <div className="w-full border-t border-white/[0.06] bg-ink-black pt-12 pb-8 px-4 sm:px-6 md:px-8 relative z-20">
        <div className="max-w-6xl mx-auto flex flex-col gap-10">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 md:gap-12">
            {/* Brand Col */}
            <div className="md:col-span-2 flex flex-col gap-3">
              <Link
                href="/"
                className="inline-flex items-center group py-1 px-1.5 rounded-xl transition-opacity hover:opacity-85 w-fit"
                aria-label="RAWIN Home"
              >
                <Image
                  src={logo?.url || "/images/logo.png"}
                  alt={logo?.alt || "RAWIN Logo"}
                  width={120}
                  height={42}
                  unoptimized
                  priority={false}
                  className="h-8 sm:h-9 w-auto object-contain transition-transform duration-200 group-hover:scale-105"
                />
              </Link>
              <div className="flex items-center gap-2 mt-1">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  {content?.availabilityStatus || "Open to opportunities"}
                </span>
              </div>
            </div>

            {/* Navigation Group */}
            <div className="flex flex-col gap-3">
              <h4 className="text-xs uppercase tracking-widest text-muted/60 font-mono">
                NAVIGATION
              </h4>
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm text-muted">
                <Link href="/" className="hover:text-pacific-cyan transition-colors">
                  Home
                </Link>
                <Link href="/about" className="hover:text-pacific-cyan transition-colors">
                  About
                </Link>
                <Link href="/projects" className="hover:text-pacific-cyan transition-colors">
                  Projects
                </Link>
                <Link href="/blog" className="hover:text-pacific-cyan transition-colors">
                  Blog
                </Link>
                <Link href="/uses" className="hover:text-pacific-cyan transition-colors">
                  Uses
                </Link>
                <Link href="/resume" className="hover:text-pacific-cyan transition-colors">
                  Resume
                </Link>
                <Link href="/contact" className="hover:text-pacific-cyan transition-colors col-span-2">
                  Contact
                </Link>
              </div>
            </div>

            {/* Connect Group */}
            <div className="flex flex-col gap-3">
              <h4 className="text-xs uppercase tracking-widest text-muted/60 font-mono">
                CONNECT
              </h4>
              <div className="flex flex-col gap-2.5 text-sm text-muted">
                {githubUrl.trim().length > 0 && (
                  <a
                    href={githubUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Visit Rushan Siddiqui on GitHub"
                    className="flex items-center gap-2 hover:text-pacific-cyan transition-colors w-fit"
                  >
                    <GithubIcon className="w-4 h-4" />
                    <span>GitHub</span>
                  </a>
                )}
                {linkedinUrl.trim().length > 0 && (
                  <a
                    href={linkedinUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Visit Rushan Siddiqui on LinkedIn"
                    className="flex items-center gap-2 hover:text-pacific-cyan transition-colors w-fit"
                  >
                    <LinkedinIcon className="w-4 h-4" />
                    <span>LinkedIn</span>
                  </a>
                )}
                {twitterUrl.trim().length > 0 && (
                  <a
                    href={twitterUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Visit Rushan Siddiqui on X"
                    className="flex items-center gap-2 hover:text-pacific-cyan transition-colors w-fit"
                  >
                    <TwitterIcon className="w-4 h-4" />
                    <span>X / Twitter</span>
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Bottom Copyright & Back to Top */}
          <div className="pt-8 border-t border-white/[0.06] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted sm:pr-16">
            <p>{copyrightText}</p>
            <button
              type="button"
              onClick={scrollToTop}
              aria-label="Back to top"
              className="flex items-center gap-1.5 px-3.5 py-2 min-h-[40px] rounded-lg glass-card hover:text-foreground hover:border-pacific-cyan/40 transition-colors cursor-pointer relative z-30 shadow-md active:scale-95 touch-manipulation"
              style={{ touchAction: "manipulation" }}
            >
              <span>Back to top</span>
              <ArrowUp className="w-3.5 h-3.5 text-pacific-cyan" />
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}
