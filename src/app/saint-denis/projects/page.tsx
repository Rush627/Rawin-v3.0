import Link from "next/link";
import { redirect } from "next/navigation";
import { Plus, FolderGit2, Star, CheckCircle2, Clock, ArrowLeft } from "lucide-react";
import { getAdminSession } from "@/lib/auth";
import { getProjects } from "@/lib/projects";
import ProjectsTable from "@/components/admin/ProjectsTable";

export const metadata = {
  title: "Projects CMS | RAWIN Admin",
};

export const revalidate = 0;

export default async function AdminProjectsPage() {
  const session = await getAdminSession();
  if (!session) {
    redirect("/saint-denis/login?redirect=/saint-denis/projects");
  }

  const projects = await getProjects();

  const totalCount = projects.length;
  const featuredCount = projects.filter((p) => p.featured).length;
  const completedCount = projects.filter((p) => p.status === "completed").length;
  const inProgressCount = projects.filter((p) => p.status === "in-progress").length;

  return (
    <div className="flex flex-col gap-6 sm:gap-8">
      {/* Smartphone Header (< sm) */}
      <div className="flex sm:hidden flex-col gap-3 pb-5 border-b border-white/[0.08]">
        {/* Dominant Page Heading */}
        <h1 className="text-3xl font-bold tracking-tight text-foreground font-space">
          Projects
        </h1>

        {/* Lower Controls Area */}
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex items-center gap-2 min-w-0">
            <Link
              href="/saint-denis"
              className="p-2 rounded-xl text-muted hover:text-foreground bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] transition-all cursor-pointer shrink-0"
              title="Return to Main Admin Dashboard"
              aria-label="Return to Main Admin Dashboard"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>

            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono font-medium glass-pill text-pacific-cyan border border-pacific-cyan/20 truncate">
              <FolderGit2 className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">PORTFOLIO CMS ACTIVE</span>
            </div>
          </div>

          <Link
            href="/saint-denis/projects/new"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-mono font-semibold bg-pacific-cyan text-ink-black hover:bg-pacific-cyan/90 transition-all shadow-[0_0_20px_rgba(24,155,173,0.35)] cursor-pointer shrink-0 ml-auto"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Project</span>
          </Link>
        </div>
      </div>

      {/* Desktop Header (sm and up) */}
      <div className="hidden sm:flex sm:items-center justify-between gap-4 pb-6 border-b border-white/[0.08]">
        <div className="flex items-center gap-3">
          <Link
            href="/saint-denis"
            className="p-2 rounded-xl text-muted hover:text-foreground bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] transition-all cursor-pointer"
            title="Return to Main Admin Dashboard"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="flex flex-col gap-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono font-medium glass-pill text-pacific-cyan w-fit border border-pacific-cyan/20">
              <FolderGit2 className="w-3.5 h-3.5" />
              <span>PORTFOLIO CMS ACTIVE</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground font-space">
              Projects
            </h1>
          </div>
        </div>

        <Link
          href="/saint-denis/projects/new"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-mono font-semibold bg-pacific-cyan text-ink-black hover:bg-pacific-cyan/90 transition-all shadow-[0_0_20px_rgba(24,155,173,0.35)] w-fit self-center cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>New Project</span>
        </Link>
      </div>

      {/* Overview Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <div className="glass-card rounded-xl sm:rounded-2xl p-3.5 sm:p-5 border border-white/[0.08] flex flex-col gap-1">
          <span className="text-[10px] sm:text-xs font-mono text-muted uppercase">Total Projects</span>
          <div className="flex items-center justify-between">
            <span className="text-xl sm:text-2xl font-bold font-space text-foreground">{totalCount}</span>
            <FolderGit2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-pacific-cyan" />
          </div>
          <span className="text-[10px] sm:text-[11px] font-mono text-muted/60 truncate">In MongoDB collection</span>
        </div>

        <div className="glass-card rounded-xl sm:rounded-2xl p-3.5 sm:p-5 border border-white/[0.08] flex flex-col gap-1">
          <span className="text-[10px] sm:text-xs font-mono text-muted uppercase">Featured on Home</span>
          <div className="flex items-center justify-between">
            <span className="text-xl sm:text-2xl font-bold font-space text-foreground">{featuredCount}</span>
            <Star className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400" />
          </div>
          <span className="text-[10px] sm:text-[11px] font-mono text-muted/60 truncate">Shown in Selected Work</span>
        </div>

        <div className="glass-card rounded-xl sm:rounded-2xl p-3.5 sm:p-5 border border-white/[0.08] flex flex-col gap-1">
          <span className="text-[10px] sm:text-xs font-mono text-muted uppercase">Completed</span>
          <div className="flex items-center justify-between">
            <span className="text-xl sm:text-2xl font-bold font-space text-foreground">{completedCount}</span>
            <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400" />
          </div>
          <span className="text-[10px] sm:text-[11px] font-mono text-muted/60 truncate">Live production work</span>
        </div>

        <div className="glass-card rounded-xl sm:rounded-2xl p-3.5 sm:p-5 border border-white/[0.08] flex flex-col gap-1">
          <span className="text-[10px] sm:text-xs font-mono text-muted uppercase">In Development</span>
          <div className="flex items-center justify-between">
            <span className="text-xl sm:text-2xl font-bold font-space text-foreground">{inProgressCount}</span>
            <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400" />
          </div>
          <span className="text-[10px] sm:text-[11px] font-mono text-muted/60 truncate">Active engineering</span>
        </div>
      </div>

      {/* Projects Table */}
      <ProjectsTable projects={projects} />
    </div>
  );
}
