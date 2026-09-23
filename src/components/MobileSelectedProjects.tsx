"use client";

import React from "react";
import Image from "next/image";
import { ExternalLink } from "lucide-react";
import { GithubIcon } from "@/components/SocialIcons";
import { StatusBadge } from "@/components/EngineeringDossierCard";
import type { Project } from "@/lib/projects";

interface MobileSelectedProjectsProps {
  projects: Project[];
}

function MobileProjectCardContent({
  project,
  priority = false,
}: {
  project: Project;
  priority?: boolean;
}) {
  return (
    <article
      data-particle-protected
      className="relative w-full rounded-2xl border border-white/[0.08] bg-gradient-to-b from-[#161626]/98 via-[#131322]/95 to-[#101019]/98 p-4 sm:p-5.5 md:p-7 shadow-[0_-8px_24px_rgba(0,0,0,0.7),0_20px_50px_rgba(0,0,0,0.85),0_0_1px_1px_rgba(255,255,255,0.06)] flex flex-col gap-3 sm:gap-4 overflow-hidden transition-colors hover:border-pacific-cyan/25"
    >
      {/* Subtle ambient radial highlight */}
      <div
        className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_top_right,rgba(24,155,173,0.06)_0%,transparent_60%)]"
        aria-hidden="true"
      />

      {/* Subtle technical corner markers matching Projects page card */}
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

      <div className="relative z-10 flex flex-col gap-3 sm:gap-3.5">
        {/* Zone 1: Metadata Row (Category / Status / Year) */}
        <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-white/[0.06] flex-wrap">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-md text-[10px] sm:text-[11px] font-mono font-medium bg-pacific-cyan/15 text-pacific-cyan border border-pacific-cyan/25 uppercase tracking-wider shrink-0">
              {project.category}
            </span>
            <StatusBadge status={project.status} />
          </div>
          {project.year && (
            <span className="text-xs font-mono text-muted/60 tracking-wider shrink-0">
              {project.year}
            </span>
          )}
        </div>

        {/* Technical dossier body with subtle connecting guide line */}
        <div className="border-l border-pacific-cyan/20 pl-3 sm:pl-4 ml-0.5 flex flex-col gap-2.5 sm:gap-3">
          {/* Zone 2: Title & Tagline */}
          <div className="flex flex-col gap-0.5">
            <h3 className="text-lg sm:text-2xl font-bold text-foreground font-space tracking-tight leading-snug">
              {project.title}
            </h3>
            {project.tagline && (
              <p className="text-xs sm:text-sm text-apricot-cream/90 font-medium leading-snug">
                {project.tagline}
              </p>
            )}
          </div>

          {/* Zone 3: Concise Description */}
          <p className="text-xs sm:text-sm text-muted/90 leading-relaxed font-sans line-clamp-3">
            {project.description}
          </p>

          {/* Zone 4: Project Preview Window Image */}
          {project.previewImage && project.previewImage !== "/images/profile.png" && (
            <div className="relative w-full aspect-[16/9] max-h-[220px] sm:max-h-[260px] md:max-h-[380px] rounded-xl overflow-hidden border border-white/[0.08] bg-ink-black/60 my-0.5 group">
              <Image
                src={project.previewImage}
                alt={project.title}
                fill
                unoptimized
                priority={priority}
                loading={priority ? undefined : "lazy"}
                className="object-cover"
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 90vw, 600px"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[rgba(16,16,25,0.65)] via-transparent to-transparent pointer-events-none" />
            </div>
          )}

          {/* Zone 5: Action Buttons */}
          {(project.githubUrl || project.liveUrl) && (
            <div className="flex items-center justify-between gap-3 pt-0.5">
              {project.githubUrl ? (
                <a
                  href={project.githubUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl glass-card text-xs font-mono text-muted hover:text-foreground hover:border-pacific-cyan/30 transition-colors"
                  aria-label={`View ${project.title} source code on GitHub`}
                >
                  <GithubIcon className="w-3.5 h-3.5" />
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
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-mono font-medium bg-pacific-cyan text-ink-black hover:bg-pacific-cyan/90 transition-all shadow-[0_0_12px_rgba(24,155,173,0.3)] ml-auto"
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

export default function MobileSelectedProjects({
  projects,
}: MobileSelectedProjectsProps) {
  const safeProjects = Array.isArray(projects) ? projects : [];

  if (safeProjects.length === 0) {
    return null;
  }

  // Single project presentation
  if (safeProjects.length === 1) {
    return (
      <div className="flex flex-col gap-6 w-full" data-card-item>
        <MobileProjectCardContent project={safeProjects[0]} priority={true} />
      </div>
    );
  }

  return (
    <div
      data-mobile-projects-stack
      className="relative w-full flex flex-col"
    >
      {safeProjects.map((project, index) => {
        const isLast = index === safeProjects.length - 1;
        // Native CSS transforms and sticky stacking on mobile
        // Staggered top preserves physical tabs for layered depth on smartphone screens
        const stickyTop = `calc(4.5rem + ${index * 0.85}rem)`;
        const zIndex = 10 + index;

        return (
          <div
            key={project._id || project.slug || index}
            data-card-item
            style={{
              top: stickyTop,
              zIndex: zIndex,
              transform: "translate3d(0, 0, 0)",
            }}
            className={`sticky w-full will-change-transform ${
              isLast ? "mb-0" : "mb-10 sm:mb-14"
            }`}
          >
            <MobileProjectCardContent
              project={project}
              priority={index === 0}
            />
          </div>
        );
      })}
    </div>
  );
}
