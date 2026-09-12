"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ExternalLink,
  Filter,
  CheckCircle2,
  Clock,
  Hammer,
} from "lucide-react";
import { GithubIcon } from "@/components/SocialIcons";
import type { Project, ProjectStatus } from "@/lib/projects";

interface ProjectsListProps {
  projects: Project[];
}

const CATEGORIES = ["All", "Full Stack", "Frontend", "Web App", "AI & Cloud"] as const;

function StatusBadge({ status }: { status: ProjectStatus }) {
  if (status === "completed") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
        <span>COMPLETED</span>
      </span>
    );
  }
  if (status === "in-progress") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
        <span>IN DEVELOPMENT</span>
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-medium bg-pacific-cyan/10 text-pacific-cyan border border-pacific-cyan/20">
      <span className="w-1.5 h-1.5 rounded-full bg-pacific-cyan" />
      <span>PLANNED</span>
    </span>
  );
}

export default function ProjectsList({ projects }: ProjectsListProps) {
  const [activeCategory, setActiveCategory] = useState<string>("All");

  const filteredProjects =
    activeCategory === "All"
      ? projects
      : projects.filter((p) => p.category === activeCategory);

  return (
    <>
      {/* Category Filter Pills */}
      <section className="flex flex-wrap items-center gap-2 pb-2 border-b border-white/[0.06]">
        <span className="text-xs font-mono text-muted/60 flex items-center gap-1.5 mr-2">
          <Filter className="w-3 h-3" />
          <span>Filter:</span>
        </span>
        {CATEGORIES.map((cat) => {
          const isSelected = activeCategory === cat;
          return (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 cursor-pointer ${
                isSelected
                  ? "bg-pacific-cyan text-ink-black font-semibold shadow-[0_0_15px_rgba(24,155,173,0.35)]"
                  : "glass-card text-muted hover:text-foreground hover:border-pacific-cyan/30"
              }`}
            >
              {cat}
            </button>
          );
        })}
      </section>

      {/* Projects List */}
      <section className="flex flex-col gap-10">
        {filteredProjects.length === 0 ? (
          <div className="glass-card rounded-2xl p-12 text-center border border-white/[0.08] flex flex-col items-center gap-3">
            <p className="text-muted text-sm font-mono">No projects found for the selected category.</p>
          </div>
        ) : (
          filteredProjects.map((project) => (
            <article
              key={project._id || project.slug}
              className="glass-card rounded-2xl p-6 sm:p-8 md:p-10 border border-white/[0.08] hover:border-pacific-cyan/30 flex flex-col gap-6"
            >
              {/* Header row */}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="px-3 py-1 rounded-md text-xs font-mono font-medium bg-pacific-cyan/15 text-pacific-cyan border border-pacific-cyan/20">
                    {project.category}
                  </span>
                  <StatusBadge status={project.status} />
                  {project.year && (
                    <span className="text-xs font-mono text-muted/60">{project.year}</span>
                  )}
                  {project.role && (
                    <>
                      <span className="text-white/20">•</span>
                      <span className="text-xs text-muted/80 font-mono">{project.role}</span>
                    </>
                  )}
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

              {/* Title & Tagline */}
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold text-foreground font-space">
                  {project.title}
                </h2>
                {project.tagline && (
                  <p className="text-base text-apricot-cream/90 font-medium mt-1">
                    {project.tagline}
                  </p>
                )}
                <p className="text-sm sm:text-base text-muted leading-relaxed mt-3 max-w-3xl">
                  {project.description}
                </p>
              </div>

              {/* Preview Image if uploaded */}
              {project.previewImage && project.previewImage !== "/images/profile.png" && (
                <div className="relative w-full aspect-[21/9] sm:aspect-[2.4/1] max-h-72 rounded-xl overflow-hidden border border-white/[0.08] bg-ink-black/60">
                  <Image
                    src={project.previewImage}
                    alt={project.title}
                    fill
                    unoptimized
                    className="object-cover transition-transform duration-500 hover:scale-[1.01]"
                    sizes="(max-width: 768px) 100vw, 1100px"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[rgba(16,16,25,0.7)] via-transparent to-transparent pointer-events-none" />
                </div>
              )}

              {/* Challenge & Solution Cards */}
              {(project.problem || project.solution) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  {project.problem && (
                    <div className="p-4 sm:p-5 rounded-xl bg-ink-black/50 border border-white/5 flex flex-col gap-2">
                      <span className="text-xs font-mono uppercase text-red-400 font-semibold tracking-wider">
                        The Problem
                      </span>
                      <p className="text-xs sm:text-sm text-muted/90 leading-relaxed">
                        {project.problem}
                      </p>
                    </div>
                  )}
                  {project.solution && (
                    <div className="p-4 sm:p-5 rounded-xl bg-ink-black/50 border border-white/5 flex flex-col gap-2">
                      <span className="text-xs font-mono uppercase text-emerald-400 font-semibold tracking-wider">
                        The Architectural Solution
                      </span>
                      <p className="text-xs sm:text-sm text-muted/90 leading-relaxed">
                        {project.solution}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Outcome Callout */}
              {project.outcome && (
                <div className="p-4 rounded-xl bg-pacific-cyan/[0.06] border border-pacific-cyan/20 flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-pacific-cyan shrink-0 mt-0.5" />
                  <div>
                    <span className="text-xs font-mono text-pacific-cyan uppercase font-bold tracking-wider">
                      Measurable Outcome:
                    </span>
                    <p className="text-xs sm:text-sm text-foreground/90 mt-0.5">
                      {project.outcome}
                    </p>
                  </div>
                </div>
              )}

              {/* Tech Tags */}
              {project.technologies.length > 0 && (
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
                </div>
              )}
            </article>
          ))
        )}
      </section>
    </>
  );
}
