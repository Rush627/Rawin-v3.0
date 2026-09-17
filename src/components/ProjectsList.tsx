"use client";

import React, { useState } from "react";
import { Filter } from "lucide-react";
import EngineeringDossierCard from "@/components/EngineeringDossierCard";
import type { Project } from "@/lib/projects";

interface ProjectsListProps {
  projects: Project[];
}

const CATEGORIES = ["All", "Full Stack", "Frontend", "Web App", "AI & Cloud"] as const;

export default function ProjectsList({ projects }: ProjectsListProps) {
  const [activeCategory, setActiveCategory] = useState<string>("All");

  const filteredProjects =
    activeCategory === "All"
      ? projects
      : projects.filter((p) => p.category === activeCategory);

  return (
    <div className="flex flex-col gap-6 sm:gap-8 lg:gap-10 w-full">
      {/* Category Filter Rail */}
      <section className="w-full pb-2 border-b border-white/[0.06]">
        <div className="flex items-center gap-2 overflow-x-auto flex-nowrap sm:flex-wrap [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] py-1 -mx-4 px-4 sm:mx-0 sm:px-0">
          <span className="text-xs font-mono text-muted/60 flex items-center gap-1.5 shrink-0 mr-1 select-none">
            <Filter className="w-3 h-3 text-pacific-cyan" />
            <span>FILTER:</span>
          </span>

          {CATEGORIES.map((cat) => {
            const isSelected = activeCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setActiveCategory(cat)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-mono font-medium transition-all duration-200 shrink-0 cursor-pointer select-none ${
                  isSelected
                    ? "bg-pacific-cyan text-ink-black font-semibold shadow-[0_0_12px_rgba(24,155,173,0.35)]"
                    : "glass-card text-muted hover:text-foreground hover:border-pacific-cyan/30"
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </section>

      {/* Projects Engineering Dossier List */}
      <section className="flex flex-col gap-6 sm:gap-8 lg:gap-10 w-full">
        {filteredProjects.length === 0 ? (
          <div className="glass-card rounded-2xl p-8 sm:p-12 text-center border border-white/[0.08] flex flex-col items-center gap-2">
            <p className="text-muted text-xs sm:text-sm font-mono">
              No projects found for the selected category.
            </p>
          </div>
        ) : (
          filteredProjects.map((project, idx) => (
            <EngineeringDossierCard
              key={project._id || project.slug || idx}
              project={project}
              priority={idx === 0}
            />
          ))
        )}
      </section>
    </div>
  );
}

