"use client";

import React, { useEffect, useRef } from "react";
import Image from "next/image";
import { ExternalLink } from "lucide-react";
import { GithubIcon } from "@/components/SocialIcons";
import { StatusBadge } from "@/components/EngineeringDossierCard";
import type { Project } from "@/lib/projects";

interface SelectedProjectsDeckProps {
  projects: Project[];
}

function ProjectCard({
  project,
  priority = false,
}: {
  project: Project;
  priority?: boolean;
}) {
  return (
    <article
      data-particle-protected
      className="relative w-full rounded-2xl border border-white/[0.08] bg-gradient-to-b from-[#161626]/98 via-[#131322]/95 to-[#101019]/98 p-6 sm:p-7 md:p-8 shadow-[0_24px_60px_-12px_rgba(0,0,0,0.85),0_0_1px_1px_rgba(255,255,255,0.05)] flex flex-col gap-4 sm:gap-5 overflow-hidden transition-colors hover:border-pacific-cyan/25"
    >
      {/* Subtle ambient radial highlight matching Projects page */}
      <div
        className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_top_right,rgba(24,155,173,0.06)_0%,transparent_60%)]"
        aria-hidden="true"
      />

      {/* Subtle technical corner markers matching Projects page */}
      <div
        className="absolute top-2.5 left-2.5 w-2 h-2 border-t border-l border-pacific-cyan/35 pointer-events-none"
        aria-hidden="true"
      />
      <div
        className="absolute top-2.5 right-2.5 w-2 h-2 border-t border-r border-pacific-cyan/35 pointer-events-none"
        aria-hidden="true"
      />
      <div
        className="absolute bottom-2.5 left-2.5 w-2 h-2 border-b border-l border-pacific-cyan/35 pointer-events-none"
        aria-hidden="true"
      />
      <div
        className="absolute bottom-2.5 right-2.5 w-2 h-2 border-b border-r border-pacific-cyan/35 pointer-events-none"
        aria-hidden="true"
      />

      <div className="relative z-10 flex flex-col gap-4">
        {/* Zone 1: Metadata Row (Category / Status / Year) */}
        <div className="flex items-center justify-between gap-3 pb-3 border-b border-white/[0.06] flex-wrap">
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="px-2.5 py-0.5 rounded-md text-xs font-mono font-medium bg-pacific-cyan/15 text-pacific-cyan border border-pacific-cyan/25 uppercase tracking-wider shrink-0">
              {project.category}
            </span>
            <StatusBadge status={project.status} />
          </div>
          {project.year && (
            <span className="text-xs font-mono text-muted/60 tracking-wider ml-auto shrink-0">
              {project.year}
            </span>
          )}
        </div>

        {/* Technical dossier body with subtle connecting guide line */}
        <div className="border-l border-pacific-cyan/20 pl-4 sm:pl-5 ml-0.5 flex flex-col gap-3.5">
          {/* Zone 2: Title & Tagline */}
          <div className="flex flex-col gap-1">
            <h3 className="text-2xl sm:text-3xl font-bold text-foreground font-space tracking-tight leading-snug">
              {project.title}
            </h3>
            {project.tagline && (
              <p className="text-sm sm:text-base text-apricot-cream/90 font-medium leading-snug">
                {project.tagline}
              </p>
            )}
          </div>

          {/* Zone 3: Project Preview Window Image */}
          {project.previewImage && project.previewImage !== "/images/profile.png" && (
            <div className="relative w-full aspect-[16/9] max-h-[280px] md:max-h-[320px] rounded-xl overflow-hidden border border-white/[0.08] bg-ink-black/60 my-0.5 group">
              <Image
                src={project.previewImage}
                alt={project.title}
                fill
                unoptimized
                priority={priority}
                loading={priority ? undefined : "lazy"}
                className="object-cover transition-transform duration-500 group-hover:scale-[1.01]"
                sizes="(max-width: 1280px) 90vw, 1000px"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[rgba(16,16,25,0.65)] via-transparent to-transparent pointer-events-none" />
            </div>
          )}

          {/* Zone 4: Description */}
          <p className="text-sm sm:text-base text-muted/90 leading-relaxed font-sans max-w-3xl">
            {project.description}
          </p>

          {/* Zone 5: Action Buttons */}
          {(project.githubUrl || project.liveUrl) && (
            <div className="flex items-center justify-between gap-4 pt-1">
              {project.githubUrl ? (
                <a
                  href={project.githubUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl glass-card text-xs font-mono text-muted hover:text-foreground hover:border-pacific-cyan/30 transition-colors"
                  aria-label={`View ${project.title} source code on GitHub`}
                >
                  <GithubIcon className="w-4 h-4" />
                  <span>GitHub ↗</span>
                </a>
              ) : (
                <div />
              )}

              {project.liveUrl && (
                <a
                  href={project.liveUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-mono font-medium bg-pacific-cyan text-ink-black hover:bg-pacific-cyan/90 transition-all shadow-[0_0_15px_rgba(24,155,173,0.35)] ml-auto"
                  aria-label={`Open live preview for ${project.title}`}
                >
                  <span>Live Preview ↗</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
            </div>
          )}
        </div>
      </div>
    </article>
  );
}

export default function SelectedProjectsDeck({ projects }: SelectedProjectsDeckProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);

  const safeProjects = Array.isArray(projects) ? projects : [];

  useEffect(() => {
    if (safeProjects.length <= 1) return;

    // Strict desktop check: only activate on desktop viewports (>= 1024px)
    const checkDesktop = () => {
      if (typeof window === "undefined") return false;
      const isWide = window.innerWidth >= 1024;
      const canHover = window.matchMedia("(hover: hover)").matches;
      const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      return isWide && canHover && !reducedMotion;
    };

    if (!checkDesktop()) return;

    const container = containerRef.current;
    if (!container) return;

    const STICKY_TOP = 96; // 6rem (top-24)
    const BUFFER = 120;
    const CARD_STEP = 650;
    const TOTAL_ANIM_RANGE = (safeProjects.length - 1) * CARD_STEP;

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

      const step = progress * (safeProjects.length - 1);
      const activeIdx = Math.min(Math.floor(step), safeProjects.length - 2);
      const fraction = step - activeIdx;

      for (let i = 0; i < safeProjects.length; i++) {
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
        for (let i = 0; i < safeProjects.length; i++) {
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
  }, [safeProjects.length]);

  // If single project or empty, render standard flow
  if (safeProjects.length <= 1) {
    return (
      <div className="flex flex-col gap-12">
        {safeProjects.map((project, idx) => (
          <ProjectCard key={project._id || project.slug} project={project} priority={idx === 0} />
        ))}
      </div>
    );
  }

  // Calculate total height: buffer at start (120px) + buffer at end (120px) + 650px per card transition + 800px
  const totalScrollHeight = 240 + (safeProjects.length - 1) * 650 + 800;

  return (
    <>
      <style>{`
        .rawin-deck-card-wrapper {
          will-change: transform;
        }
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
            {safeProjects.map((project, idx) => (
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
                <ProjectCard project={project} priority={idx === 0} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
