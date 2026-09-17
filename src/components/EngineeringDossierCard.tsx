"use client";

import React, { useState } from "react";
import Image from "next/image";
import { ExternalLink, CheckCircle2 } from "lucide-react";
import { GithubIcon } from "@/components/SocialIcons";
import type { Project, ProjectStatus } from "@/lib/projects";

interface EngineeringDossierCardProps {
  project: Project;
  priority?: boolean;
}

function StatusBadge({ status }: { status: ProjectStatus }) {
  if (status === "completed") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] sm:text-[11px] font-mono font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
        <span>COMPLETED</span>
      </span>
    );
  }
  if (status === "in-progress") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] sm:text-[11px] font-mono font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20 shrink-0">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
        <span>IN DEVELOPMENT</span>
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] sm:text-[11px] font-mono font-medium bg-pacific-cyan/10 text-pacific-cyan border border-pacific-cyan/20 shrink-0">
      <span className="w-1.5 h-1.5 rounded-full bg-pacific-cyan" />
      <span>PLANNED</span>
    </span>
  );
}

export default function EngineeringDossierCard({
  project,
  priority = false,
}: EngineeringDossierCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const hasCaseStudy = Boolean(
    project.caseStudyAvailable ||
      project.problem ||
      project.solution ||
      project.outcome ||
      (project.technologies && project.technologies.length > 0)
  );

  const cardId = project.slug || project._id || "project";

  return (
    <article
      className="relative w-full rounded-2xl border border-white/[0.08] bg-gradient-to-b from-[#161626]/95 via-[#131322]/90 to-[#101019]/95 p-4 sm:p-5.5 lg:p-6.5 shadow-[0_4px_24px_rgba(0,0,0,0.28)] flex flex-col gap-3 sm:gap-4 overflow-hidden transition-colors hover:border-pacific-cyan/25"
      data-particle-protected
    >
      {/* Subtle ambient radial highlight */}
      <div
        className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_top_right,rgba(24,155,173,0.06)_0%,transparent_60%)]"
        aria-hidden="true"
      />

      {/* Subtle technical corner markers */}
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

      <div className="relative z-10 flex flex-col gap-3 sm:gap-4">
        {/* Zone 1: Metadata Row (Category / Status / Year) */}
        <div className="flex items-center justify-between gap-2.5 pb-2.5 sm:pb-3 border-b border-white/[0.06] flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2.5 py-0.5 rounded-md text-[10px] sm:text-[11px] font-mono font-medium bg-pacific-cyan/15 text-pacific-cyan border border-pacific-cyan/25 uppercase tracking-wider shrink-0">
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
        <div className="border-l border-pacific-cyan/20 pl-3 sm:pl-4.5 ml-0.5 flex flex-col gap-3 sm:gap-3.5">
          {/* Zone 2: Role */}
          {project.role && (
            <div className="text-[10px] sm:text-xs font-mono text-muted/75 tracking-wider uppercase">
              {project.role}
            </div>
          )}

          {/* Zone 3: Title & Tagline */}
          <div className="flex flex-col gap-1">
            <h2 className="text-lg sm:text-2xl lg:text-[1.625rem] font-bold text-foreground font-space tracking-tight leading-snug">
              {project.title}
            </h2>
            {project.tagline && (
              <p className="text-xs sm:text-sm lg:text-[0.9375rem] text-apricot-cream/90 font-medium leading-snug">
                {project.tagline}
              </p>
            )}
          </div>

          {/* Zone 4: Project Preview Window Image */}
          {project.previewImage && project.previewImage !== "/images/profile.png" && (
            <div className="relative w-full aspect-[16/9] max-h-[320px] lg:max-h-[360px] rounded-xl overflow-hidden border border-white/[0.08] bg-ink-black/60 my-0.5 group">
              <Image
                src={project.previewImage}
                alt={project.title}
                fill
                unoptimized
                priority={priority}
                loading={priority ? undefined : "lazy"}
                className="object-cover transition-transform duration-500 group-hover:scale-[1.01]"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 90vw, 1000px"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[rgba(16,16,25,0.65)] via-transparent to-transparent pointer-events-none" />
            </div>
          )}

          {/* Zone 5: Description */}
          <p className="text-xs sm:text-sm lg:text-[0.9375rem] text-muted/90 leading-relaxed font-sans max-w-3xl">
            {project.description}
          </p>

          {/* Zone 6: Action Buttons */}
          {(project.githubUrl || project.liveUrl) && (
            <div className="flex items-center justify-between gap-3 pt-0.5">
              {project.githubUrl ? (
                <a
                  href={project.githubUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl glass-card text-xs font-mono text-muted hover:text-foreground hover:border-pacific-cyan/30 transition-colors"
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
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-mono font-medium bg-pacific-cyan text-ink-black hover:bg-pacific-cyan/90 transition-all shadow-[0_0_12px_rgba(24,155,173,0.3)] ml-auto"
                  aria-label={`Open live preview for ${project.title}`}
                >
                  <span>Live Preview ↗</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
            </div>
          )}
        </div>

        {/* Zone 7: Dossier Case Study Footer */}
        {hasCaseStudy && (
          <div className="pt-2.5 sm:pt-3 border-t border-white/[0.06] flex flex-col">
            <button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              aria-expanded={isExpanded}
              aria-controls={`case-study-${cardId}`}
              id={`case-study-toggle-${cardId}`}
              className="w-full flex items-center justify-between py-1 text-xs font-mono text-pacific-cyan hover:text-pacific-cyan/80 transition-colors cursor-pointer select-none"
            >
              <span className="font-semibold tracking-wider uppercase">
                {isExpanded ? "Hide Case Study" : "View Case Study"}
              </span>
              <span className="text-base font-bold leading-none select-none">
                {isExpanded ? "-" : "+"}
              </span>
            </button>

            {isExpanded && (
              <div
                id={`case-study-${cardId}`}
                role="region"
                aria-labelledby={`case-study-toggle-${cardId}`}
                className="flex flex-col gap-3 pt-3 mt-1 motion-safe:transition-all"
              >
                {/* The Problem */}
                {project.problem && (
                  <div className="p-3 sm:p-3.5 rounded-xl bg-ink-black/60 border border-white/5 flex flex-col gap-1.5">
                    <span className="text-[10px] sm:text-[11px] font-mono uppercase text-red-400 font-semibold tracking-wider">
                      The Problem
                    </span>
                    <p className="text-xs sm:text-sm text-muted/90 leading-relaxed font-sans">
                      {project.problem}
                    </p>
                  </div>
                )}

                {/* The Architectural Solution */}
                {project.solution && (
                  <div className="p-3 sm:p-3.5 rounded-xl bg-ink-black/60 border border-white/5 flex flex-col gap-1.5">
                    <span className="text-[10px] sm:text-[11px] font-mono uppercase text-emerald-400 font-semibold tracking-wider">
                      The Architectural Solution
                    </span>
                    <p className="text-xs sm:text-sm text-muted/90 leading-relaxed font-sans">
                      {project.solution}
                    </p>
                  </div>
                )}

                {/* Measurable Outcome */}
                {project.outcome && (
                  <div className="p-3 sm:p-3.5 rounded-xl bg-pacific-cyan/[0.06] border border-pacific-cyan/20 flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-pacific-cyan shrink-0 mt-0.5" />
                    <div>
                      <span className="text-[10px] sm:text-[11px] font-mono text-pacific-cyan uppercase font-bold tracking-wider">
                        Measurable Outcome:
                      </span>
                      <p className="text-xs sm:text-sm text-foreground/90 mt-0.5 leading-relaxed">
                        {project.outcome}
                      </p>
                    </div>
                  </div>
                )}

                {/* Tech Stack */}
                {project.technologies && project.technologies.length > 0 && (
                  <div className="flex flex-col gap-2 pt-2 border-t border-white/[0.04]">
                    <span className="text-[10px] sm:text-[11px] font-mono text-muted/60 uppercase tracking-wider">
                      Tech Stack
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {project.technologies.map((tech) => (
                        <span
                          key={tech}
                          className="px-2.5 py-0.5 rounded-md text-[10px] sm:text-[11px] font-mono text-muted/85 bg-white/[0.03] border border-white/[0.06]"
                        >
                          {tech}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </article>
  );
}

