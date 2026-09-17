import { Code2 } from "lucide-react";
import ProjectsList from "@/components/ProjectsList";
import { getProjects } from "@/lib/projects";

export const metadata = {
  title: "Featured Projects | RAWIN 3.0",
  description: "Selected web applications, tools, and experiments built by Rushan Siddiqui.",
};

// Revalidate page dynamically
export const revalidate = 0;

export default async function ProjectsPage() {
  const projects = await getProjects();

  return (
    <div className="w-full max-w-6xl mx-auto pt-24 sm:pt-28 pb-16 px-4 sm:px-6 flex flex-col gap-8 sm:gap-10">
      {/* Page Header */}
      <section className="flex flex-col gap-3 sm:gap-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono font-medium glass-pill text-pacific-cyan w-fit border border-pacific-cyan/20">
          <Code2 className="w-3.5 h-3.5" />
          <span>Selected Work</span>
        </div>
        <h1 className="text-2xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-foreground font-space">
          Featured <span className="text-pacific-cyan">Projects</span>
        </h1>
        <p className="text-sm sm:text-base lg:text-lg text-muted max-w-xs sm:max-w-md lg:max-w-2xl leading-relaxed">
          Selected web applications, tools, and experiments I&apos;ve built.
        </p>
      </section>

      {/* Engineering Dossier Projects List */}
      <div className="w-full">
        <ProjectsList projects={projects} />
      </div>
    </div>
  );
}

