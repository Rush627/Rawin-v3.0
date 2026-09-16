"use client";

import React, { useEffect, useRef, useState } from "react";
import { ExternalLink } from "lucide-react";
import { GithubIcon } from "@/components/SocialIcons";
import type { Project } from "@/lib/projects";

interface MobileSelectedProjectsProps {
  projects: Project[];
}

function MobileProjectCardContent({ project }: { project: Project }) {
  return (
    <article
      data-particle-protected
      className="rounded-2xl p-5 sm:p-7 border border-white/[0.09] flex flex-col gap-5 w-full shadow-[0_-8px_24px_rgba(0,0,0,0.65),0_20px_50px_rgba(0,0,0,0.85),0_0_1px_1px_rgba(255,255,255,0.06)]"
      style={{
        background:
          "linear-gradient(180deg, rgba(22, 22, 34, 0.99) 0%, rgba(16, 16, 25, 0.98) 100%)",
      }}
    >
      {/* Category, Year, and External Links */}
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex items-center gap-2.5">
          <span className="px-2.5 py-1 rounded-md text-[11px] font-mono font-medium bg-pacific-cyan/15 text-pacific-cyan border border-pacific-cyan/20">
            {project.category}
          </span>
          <span className="text-[11px] font-mono text-muted/60">
            {project.year}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {project.githubUrl && (
            <a
              href={project.githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-lg text-muted hover:text-foreground hover:bg-white/5 transition-colors"
              aria-label={`View Source Code for ${project.title}`}
            >
              <GithubIcon className="w-4 h-4" />
            </a>
          )}
          {project.liveUrl && (
            <a
              href={project.liveUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium bg-pacific-cyan/10 text-pacific-cyan hover:bg-pacific-cyan/20 transition-colors"
            >
              <span>Live Preview</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
        </div>
      </div>

      {/* Title & Tagline */}
      <div>
        <h3 className="text-xl sm:text-2xl font-bold text-foreground font-space leading-snug">
          {project.title}
        </h3>
        {project.tagline && (
          <p className="text-sm text-apricot-cream/90 font-medium mt-1">
            {project.tagline}
          </p>
        )}
        <p className="text-xs sm:text-sm text-muted leading-relaxed mt-2.5">
          {project.description}
        </p>
      </div>

      {/* Preview Image with stable aspect ratio reservation */}
      {project.previewImage && project.previewImage !== "/images/profile.png" && (
        <div className="relative w-full aspect-[21/9] sm:aspect-[2.4/1] max-h-56 rounded-xl overflow-hidden border border-white/[0.08] bg-ink-black/60">
          <img
            src={project.previewImage}
            alt={project.title}
            loading="eager"
            decoding="async"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[rgba(16,16,25,0.6)] via-transparent to-transparent pointer-events-none" />
        </div>
      )}

      {/* Challenge & Architecture breakdown */}
      {(project.problem || project.solution) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          {project.problem && (
            <div className="p-3.5 rounded-xl bg-ink-black/60 border border-white/5">
              <span className="text-[10px] font-mono uppercase text-red-400/90 tracking-wider font-semibold">
                The Challenge
              </span>
              <p className="text-xs text-muted/90 mt-1 leading-relaxed">
                {project.problem}
              </p>
            </div>
          )}
          {project.solution && (
            <div className="p-3.5 rounded-xl bg-ink-black/60 border border-white/5">
              <span className="text-[10px] font-mono uppercase text-emerald-400/90 tracking-wider font-semibold">
                The Architecture
              </span>
              <p className="text-xs text-muted/90 mt-1 leading-relaxed">
                {project.solution}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Technologies & Engineering Focus */}
      <div className="pt-3 border-t border-white/[0.06] flex flex-col gap-2.5">
        <div className="flex flex-wrap gap-1.5">
          {project.technologies.map((tech) => (
            <span
              key={tech}
              className="px-2 py-0.5 rounded-md text-[10px] font-mono text-muted/80 bg-white/[0.04] border border-white/[0.06]"
            >
              {tech}
            </span>
          ))}
        </div>

        {project.engineeringFocus && project.engineeringFocus.length > 0 && (
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[10px] font-mono uppercase text-muted/50 tracking-wider">
              Focus:
            </span>
            {project.engineeringFocus.map((focus) => (
              <span
                key={focus}
                className="px-2 py-0.5 rounded-full text-[10px] font-mono text-pacific-cyan bg-pacific-cyan/10 border border-pacific-cyan/20"
              >
                {focus}
              </span>
            ))}
          </div>
        )}
      </div>
    </article>
  );
}

export default function MobileSelectedProjects({
  projects,
}: MobileSelectedProjectsProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [cardMaxHeight, setCardMaxHeight] = useState<number | null>(null);
  const [isReducedMotion, setIsReducedMotion] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setIsReducedMotion(reduced);
  }, []);

  // Measure card heights on mount and resize to ensure the stage fits the tallest card
  useEffect(() => {
    if (isReducedMotion || projects.length <= 1) return;

    const measure = () => {
      let maxH = 0;
      for (let i = 0; i < cardRefs.current.length; i++) {
        const el = cardRefs.current[i];
        if (el) {
          maxH = Math.max(maxH, el.offsetHeight);
        }
      }
      if (maxH > 0) {
        setCardMaxHeight(maxH);
      }
    };

    // Initial measurement after paint
    measure();
    const timer = setTimeout(measure, 150);

    window.addEventListener("resize", measure, { passive: true });
    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", measure);
    };
  }, [projects, isReducedMotion]);

  // High-performance scroll tracking loop: directly updates DOM styles via rAF with zero React re-renders
  useEffect(() => {
    if (isReducedMotion || projects.length <= 1) return;

    const container = containerRef.current;
    if (!container) return;

    let rafId: number | null = null;
    const SCROLL_STEP = 460;
    const totalTravel = (projects.length - 1) * SCROLL_STEP;

    const updateStack = () => {
      rafId = null;
      if (!container) return;

      const rect = container.getBoundingClientRect();
      const STICKY_TOP = window.innerWidth < 640 ? 72 : 80;
      const scrolledIn = STICKY_TOP - rect.top;

      let progress = 0;
      if (scrolledIn <= 0) {
        progress = 0;
      } else if (scrolledIn >= totalTravel) {
        progress = 1;
      } else {
        progress = scrolledIn / totalTravel;
      }

      const step = progress * (projects.length - 1);
      const activeIdx = Math.min(Math.floor(step), projects.length - 2);
      const fraction = step - activeIdx;

      const TAB_OFFSET = window.innerWidth < 640 ? 20 : 24;

      for (let i = 0; i < projects.length; i++) {
        const el = cardRefs.current[i];
        if (!el) continue;

        if (i < activeIdx) {
          // Resting in stacked deck behind: shows visible top tab
          const depth = activeIdx - i;
          const translateY = -depth * TAB_OFFSET;
          const scale = Math.max(0.88, 1 - depth * 0.03);
          el.style.transform = `translate3d(0, ${translateY}px, 0) scale(${scale})`;
          el.style.opacity = `${Math.max(0.5, 1 - depth * 0.15)}`;
          el.style.visibility = "visible";
          el.style.pointerEvents = "none";
        } else if (i === activeIdx) {
          // Active card: shifts slightly to tab position as incoming card covers it
          const translateY = -fraction * TAB_OFFSET;
          const scale = 1 - fraction * 0.03;
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
  }, [projects, isReducedMotion]);

  if (!projects || projects.length === 0) {
    return null;
  }

  // Reduced motion fallback: standard vertical flow without stacking transforms
  if (isReducedMotion || projects.length === 1) {
    return (
      <div className="flex flex-col gap-6 sm:gap-8 w-full">
        {projects.map((project, index) => (
          <div key={project._id || project.slug || index} className="w-full">
            <MobileProjectCardContent project={project} />
          </div>
        ))}
      </div>
    );
  }

  const SCROLL_STEP = 460;
  const totalTravel = (projects.length - 1) * SCROLL_STEP;
  const estimatedCardHeight = cardMaxHeight || 600;
  const totalContainerHeight = estimatedCardHeight + totalTravel + 80;

  return (
    <div
      ref={containerRef}
      data-mobile-projects-stack
      className="relative w-full"
      style={{ minHeight: `${totalContainerHeight}px` }}
    >
      {/* Sticky Stack Stage: stays in visual view while scrolling through section */}
      <div
        className="sticky top-[72px] sm:top-[80px] w-full pt-8 sm:pt-10 pb-4"
        style={{ minHeight: cardMaxHeight ? `${cardMaxHeight + 60}px` : undefined }}
      >
        <div className="relative w-full">
          {projects.map((project, index) => {
            const isFirst = index === 0;

            return (
              <div
                key={project._id || project.slug || index}
                ref={(el) => {
                  cardRefs.current[index] = el;
                }}
                className={`w-full will-change-transform ${
                  isFirst
                    ? "relative"
                    : "absolute top-0 left-0 right-0"
                }`}
                style={{
                  zIndex: 10 + index,
                  transform: isFirst
                    ? "translate3d(0, 0, 0) scale(1)"
                    : "translate3d(0, 110%, 0) scale(1)",
                  opacity: isFirst ? 1 : 0,
                  visibility: isFirst ? "visible" : "hidden",
                  pointerEvents: isFirst ? "auto" : "none",
                }}
              >
                <MobileProjectCardContent project={project} />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
