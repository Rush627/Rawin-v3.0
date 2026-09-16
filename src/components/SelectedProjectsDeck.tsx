"use client";

import React, { useEffect, useRef } from "react";
import { ExternalLink } from "lucide-react";
import { GithubIcon } from "@/components/SocialIcons";
import type { Project } from "@/lib/projects";

interface SelectedProjectsDeckProps {
  projects: Project[];
}

function ProjectCard({ project }: { project: Project }) {
  return (
    <article
      data-particle-protected
      className="rawin-deck-card rounded-2xl p-6 sm:p-8 md:p-10 border border-white/[0.08] flex flex-col gap-6 w-full shadow-[0_24px_60px_-12px_rgba(0,0,0,0.85),0_0_1px_1px_rgba(255,255,255,0.05)]"
      style={{
        background: "linear-gradient(180deg, rgba(22, 22, 34, 0.98) 0%, rgba(16, 16, 25, 0.97) 100%)",
        transition: "none",
      }}
    >
      {/* Header row */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="px-3 py-1 rounded-md text-xs font-mono font-medium bg-pacific-cyan/15 text-pacific-cyan border border-pacific-cyan/20">
            {project.category}
          </span>
          <span className="text-xs font-mono text-muted/60">{project.year}</span>
        </div>
        <div className="flex items-center gap-3">
          {project.githubUrl && (
            <a
              href={project.githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-lg text-muted hover:text-foreground hover:bg-white/5 transition-colors"
              aria-label="View Source Code"
            >
              <GithubIcon className="w-4 h-4" />
            </a>
          )}
          {project.liveUrl && (
            <a
              href={project.liveUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-pacific-cyan/10 text-pacific-cyan hover:bg-pacific-cyan/20 transition-colors"
            >
              <span>Live Preview</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
        </div>
      </div>

      {/* Title and description */}
      <div>
        <h3 className="text-2xl sm:text-3xl font-bold text-foreground font-space">
          {project.title}
        </h3>
        {project.tagline && (
          <p className="text-base text-apricot-cream/90 font-medium mt-1">
            {project.tagline}
          </p>
        )}
        <p className="text-sm sm:text-base text-muted leading-relaxed mt-3 max-w-3xl">
          {project.description}
        </p>
      </div>

      {/* Preview Image: reliable direct image render without proxy failure */}
      {project.previewImage && project.previewImage !== "/images/profile.png" && (
        <div className="relative w-full aspect-[21/9] sm:aspect-[2.4/1] max-h-64 sm:max-h-72 rounded-xl overflow-hidden border border-white/[0.08] bg-ink-black/60">
          <img
            src={project.previewImage}
            alt={project.title}
            loading="eager"
            decoding="async"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[rgba(16,16,25,0.7)] via-transparent to-transparent pointer-events-none" />
        </div>
      )}

      {/* Problem vs Solution breakdown */}
      {(project.problem || project.solution) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          {project.problem && (
            <div className="p-4 rounded-xl bg-ink-black/60 border border-white/5">
              <span className="text-xs font-mono uppercase text-red-400/90 tracking-wider">The Challenge</span>
              <p className="text-xs sm:text-sm text-muted/90 mt-1.5 leading-relaxed">{project.problem}</p>
            </div>
          )}
          {project.solution && (
            <div className="p-4 rounded-xl bg-ink-black/60 border border-white/5">
              <span className="text-xs font-mono uppercase text-emerald-400/90 tracking-wider">The Architecture</span>
              <p className="text-xs sm:text-sm text-muted/90 mt-1.5 leading-relaxed">{project.solution}</p>
            </div>
          )}
        </div>
      )}

      {/* Outcome and Engineering Focus Row */}
      <div className="pt-4 border-t border-white/[0.06] flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap gap-2">
          {project.technologies.map((tech) => (
            <span
              key={tech}
              className="px-2.5 py-1 rounded-md text-xs font-mono text-muted/80 bg-white/[0.04] border border-white/[0.06]"
            >
              {tech}
            </span>
          ))}
        </div>

        {project.engineeringFocus && project.engineeringFocus.length > 0 && (
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            <span className="text-[10px] font-mono uppercase text-muted/50 tracking-wider">
              Engineering Focus:
            </span>
            {project.engineeringFocus.map((focus) => (
              <span
                key={focus}
                className="px-2.5 py-0.5 rounded-full text-xs font-mono text-pacific-cyan bg-pacific-cyan/10 border border-pacific-cyan/20"
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

export default function SelectedProjectsDeck({ projects }: SelectedProjectsDeckProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    if (projects.length <= 1) return;

    const checkDesktop = () => {
      const isWide = window.innerWidth >= 1024;
      const canHover = window.matchMedia("(hover: hover)").matches;
      const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      return isWide && canHover && !reducedMotion;
    };

    if (!checkDesktop()) return;

    const container = containerRef.current;
    if (!container) return;

    const STICKY_TOP = 96; // 6rem (top-24)
    const BUFFER = 160;
    const CARD_STEP = 750;
    const TOTAL_ANIM_RANGE = (projects.length - 1) * CARD_STEP;

    let rafId: number | null = null;

    const updateDeck = () => {
      rafId = null;
      if (!container) return;

      const rect = container.getBoundingClientRect();
      const scrolledIn = STICKY_TOP - rect.top;

      let progress = 0;
      if (scrolledIn <= BUFFER) {
        progress = 0;
      } else if (scrolledIn >= BUFFER + TOTAL_ANIM_RANGE) {
        progress = 1;
      } else {
        progress = (scrolledIn - BUFFER) / TOTAL_ANIM_RANGE;
      }

      const step = progress * (projects.length - 1);
      const activeIdx = Math.floor(step);
      const fraction = step - activeIdx;

      for (let i = 0; i < projects.length; i++) {
        const el = cardRefs.current[i];
        if (!el) continue;

        if (i < activeIdx) {
          // Stable resting card in the stacked deck behind
          const depth = activeIdx - i;
          const scale = Math.max(0.88, 1 - depth * 0.04);
          const translateY = -depth * 20;
          el.style.transform = `translate3d(0, ${translateY}px, 0) scale(${scale})`;
          el.style.opacity = `${Math.max(0.4, 1 - depth * 0.2)}`;
          el.style.visibility = "visible";
          el.style.pointerEvents = "none";
        } else if (i === activeIdx) {
          // Active front card: gently scales down as the incoming card slides over
          const scale = 1 - fraction * 0.04;
          const translateY = -fraction * 20;
          el.style.transform = `translate3d(0, ${translateY}px, 0) scale(${scale})`;
          el.style.opacity = "1";
          el.style.visibility = "visible";
          el.style.pointerEvents = fraction < 0.3 ? "auto" : "none";
        } else if (i === activeIdx + 1) {
          // Incoming card: smooth cubic ease-out moving up from below
          const ease = 1 - Math.pow(1 - fraction, 2.5);
          const translateY = (1 - ease) * 110;
          el.style.transform = `translate3d(0, ${translateY}%, 0) scale(1)`;
          el.style.opacity = "1";
          el.style.visibility = "visible";
          el.style.pointerEvents = fraction > 0.8 ? "auto" : "none";
        } else {
          // Waiting below viewport
          el.style.transform = "translate3d(0, 115%, 0) scale(1)";
          el.style.opacity = "0";
          el.style.visibility = "hidden";
          el.style.pointerEvents = "none";
        }
      }
    };

    updateDeck();

    const onScroll = () => {
      if (rafId === null) {
        rafId = requestAnimationFrame(updateDeck);
      }
    };

    const onResize = () => {
      if (!checkDesktop()) {
        for (let i = 0; i < projects.length; i++) {
          const el = cardRefs.current[i];
          if (el) {
            el.style.transform = "";
            el.style.opacity = "";
            el.style.visibility = "";
            el.style.pointerEvents = "";
          }
        }
        return;
      }
      updateDeck();
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize, { passive: true });

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
      }
    };
  }, [projects.length]);

  // If single project or empty, render standard flow
  if (projects.length <= 1) {
    return (
      <div className="flex flex-col gap-12">
        {projects.map((project) => (
          <ProjectCard key={project._id || project.slug} project={project} />
        ))}
      </div>
    );
  }

  // Calculate total height: buffer at start (160px) + buffer at end (160px) + 750px per card transition + 100vh
  const totalScrollHeight = 320 + (projects.length - 1) * 750 + 900;

  return (
    <>
      <style>{`
        @media (max-width: 1023px) {
          .rawin-deck-container {
            height: auto !important;
          }
          .rawin-deck-sticky {
            position: static !important;
          }
          .rawin-deck-grid {
            display: flex !important;
            flex-direction: column !important;
            gap: 3rem !important;
          }
          .rawin-deck-card-wrapper {
            position: relative !important;
            transform: none !important;
            opacity: 1 !important;
            visibility: visible !important;
            pointer-events: auto !important;
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .rawin-deck-container {
            height: auto !important;
          }
          .rawin-deck-sticky {
            position: static !important;
          }
          .rawin-deck-grid {
            display: flex !important;
            flex-direction: column !important;
            gap: 3rem !important;
          }
          .rawin-deck-card-wrapper {
            position: relative !important;
            transform: none !important;
            opacity: 1 !important;
            visibility: visible !important;
            pointer-events: auto !important;
          }
        }
      `}</style>

      <div
        ref={containerRef}
        className="rawin-deck-container relative w-full"
        style={{ height: `${totalScrollHeight}px` }}
      >
        <div className="rawin-deck-sticky sticky top-24 w-full">
          <div
            className="rawin-deck-grid relative w-full max-w-5xl mx-auto"
            style={{
              display: "grid",
              gridTemplateColumns: "1fr",
            }}
          >
            {projects.map((project, idx) => (
              <div
                key={project._id || project.slug}
                ref={(el) => {
                  cardRefs.current[idx] = el;
                }}
                style={{
                  gridArea: "1 / 1 / 2 / 2",
                  zIndex: 10 + idx * 10,
                  transformOrigin: "center top",
                  transform:
                    idx === 0
                      ? "translate3d(0, 0, 0) scale(1)"
                      : "translate3d(0, 115%, 0) scale(1)",
                  opacity: idx === 0 ? 1 : 0,
                  visibility: idx === 0 ? "visible" : "hidden",
                  transition: "none",
                }}
                className="rawin-deck-card-wrapper w-full"
              >
                <ProjectCard project={project} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
