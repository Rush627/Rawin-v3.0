import Link from "next/link";
import { Code2, ArrowRight } from "lucide-react";
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
    <div className="w-full max-w-6xl mx-auto pt-28 pb-16 px-4 sm:px-6 flex flex-col gap-14">
      {/* Page Header */}
      <section className="flex flex-col gap-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono font-medium glass-pill text-pacific-cyan w-fit border border-pacific-cyan/20">
          <Code2 className="w-3.5 h-3.5" />
          <span>Selected Work</span>
        </div>
        <h1 className="text-3xl sm:text-5xl md:text-6xl font-bold tracking-tight text-foreground font-space">
          Featured <span className="text-pacific-cyan">Projects</span>
        </h1>
        <p className="text-base sm:text-lg text-muted max-w-2xl leading-relaxed">
          Selected web applications, tools, and experiments I&apos;ve built.
        </p>
      </section>

      {/* Dynamic Projects with Category Filter */}
      <ProjectsList projects={projects} />

      {/* CTA strip */}
      <section className="glass-panel rounded-2xl p-8 border border-white/[0.08] text-center flex flex-col items-center gap-4">
        <h3 className="text-xl sm:text-2xl font-bold text-foreground font-space">
          Have an engineering challenge or project idea?
        </h3>
        <p className="text-sm text-muted max-w-md">
          I&apos;m open to discussing new projects, full-stack development, or collaborating on ideas.
        </p>
        <Link
          href="/contact"
          className="flex items-center gap-2 px-6 py-3 rounded-xl bg-pacific-cyan text-ink-black font-semibold text-sm hover:bg-pacific-cyan/90 transition-all shadow-[0_0_20px_rgba(24,155,173,0.35)] mt-2"
        >
          <span>Let&apos;s Build Together</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </section>
    </div>
  );
}
