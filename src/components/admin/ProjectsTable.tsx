"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  Edit3,
  Trash2,
  Star,
  ExternalLink,
  Code2,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import { GithubIcon } from "@/components/SocialIcons";
import type { Project, ProjectStatus } from "@/lib/projects";
import { toggleFeaturedAction, deleteProjectAction } from "@/app/admin/projects/actions";

interface ProjectsTableProps {
  projects: Project[];
}

function StatusPill({ status }: { status: ProjectStatus }) {
  if (status === "completed") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
        <span>COMPLETED</span>
      </span>
    );
  }
  if (status === "in-progress") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
        <span>IN DEVELOPMENT</span>
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-medium bg-pacific-cyan/10 text-pacific-cyan border border-pacific-cyan/20">
      <span className="w-1.5 h-1.5 rounded-full bg-pacific-cyan" />
      <span>PLANNED</span>
    </span>
  );
}

export default function ProjectsTable({ projects }: ProjectsTableProps) {
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
  const [isPending, startTransition] = useTransition();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleToggleFeatured = (project: Project) => {
    if (!project._id) return;
    startTransition(async () => {
      try {
        await toggleFeaturedAction(project._id!, project.featured);
      } catch (err: unknown) {
        setErrorMessage("Failed to update featured status.");
      }
    });
  };

  const handleDeleteConfirm = () => {
    if (!projectToDelete?._id) return;
    startTransition(async () => {
      try {
        await deleteProjectAction(projectToDelete._id!);
        setProjectToDelete(null);
      } catch (err: unknown) {
        setErrorMessage("Failed to delete project.");
      }
    });
  };

  return (
    <div className="flex flex-col gap-6">
      {errorMessage && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/25 flex items-center justify-between gap-3 text-red-300 text-xs font-mono">
          <span>{errorMessage}</span>
          <button onClick={() => setErrorMessage(null)} className="underline cursor-pointer">
            Dismiss
          </button>
        </div>
      )}

      {projects.length === 0 ? (
        <div className="glass-card rounded-2xl p-12 text-center border border-white/[0.08] flex flex-col items-center gap-4">
          <Code2 className="w-8 h-8 text-muted/40" />
          <p className="text-muted text-sm font-mono">No projects found.</p>
          <Link
            href="/admin/projects/new"
            className="px-4 py-2 rounded-xl bg-pacific-cyan text-ink-black text-xs font-mono font-semibold"
          >
            Create Project
          </Link>
        </div>
      ) : (
        <>
          {/* Desktop Table View (>= 768px) */}
          <div className="hidden md:block glass-card rounded-2xl border border-white/[0.08] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-white/[0.02] border-b border-white/[0.06] text-muted/70 uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="px-5 py-3.5 w-16">Order</th>
                    <th className="px-5 py-3.5">Project</th>
                    <th className="px-5 py-3.5">Category</th>
                    <th className="px-5 py-3.5">Status</th>
                    <th className="px-5 py-3.5 text-center">Featured</th>
                    <th className="px-5 py-3.5">Links</th>
                    <th className="px-5 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {projects.map((project) => (
                    <tr key={project._id || project.slug} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-5 py-4 text-muted/60 font-mono">
                        #{project.displayOrder}
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-sm font-bold font-space text-foreground">
                            {project.title}
                          </span>
                          <div className="flex items-center gap-2 text-[11px] text-muted">
                            <span className="font-mono text-pacific-cyan/80">/{project.slug}</span>
                            {project.shortName && (
                              <span className="text-muted/40 font-mono">[{project.shortName}]</span>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <span className="px-2.5 py-1 rounded-md text-[11px] font-mono font-medium bg-white/[0.04] text-muted/90 border border-white/[0.06]">
                          {project.category}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <StatusPill status={project.status} />
                      </td>

                      <td className="px-5 py-4 text-center">
                        <button
                          onClick={() => handleToggleFeatured(project)}
                          disabled={isPending}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-mono font-semibold transition-all cursor-pointer ${
                            project.featured
                              ? "bg-pacific-cyan/15 text-pacific-cyan border border-pacific-cyan/30 hover:bg-pacific-cyan/25"
                              : "bg-white/[0.03] text-muted/50 border border-white/[0.06] hover:text-muted"
                          }`}
                          title={project.featured ? "Remove from Home featured section" : "Feature on Home page"}
                        >
                          <Star className={`w-3 h-3 ${project.featured ? "fill-pacific-cyan" : ""}`} />
                          <span>{project.featured ? "Featured" : "Hidden"}</span>
                        </button>
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          {project.githubUrl ? (
                            <a
                              href={project.githubUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1 rounded text-muted hover:text-foreground transition-colors"
                              title="GitHub source link"
                            >
                              <GithubIcon className="w-3.5 h-3.5" />
                            </a>
                          ) : (
                            <span className="text-muted/30 text-[10px]">no gh</span>
                          )}
                          {project.liveUrl ? (
                            <a
                              href={project.liveUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1 rounded text-pacific-cyan hover:text-pacific-cyan/80 transition-colors"
                              title="Live URL"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          ) : (
                            <span className="text-muted/30 text-[10px]">no url</span>
                          )}
                        </div>
                      </td>

                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/admin/projects/${project._id}`}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-foreground text-xs font-mono transition-colors"
                            title="Edit project"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Edit</span>
                          </Link>
                          <button
                            onClick={() => setProjectToDelete(project)}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-mono transition-colors cursor-pointer"
                            title="Delete project"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Smartphone Card List View (< 768px) */}
          <div className="flex md:hidden flex-col gap-3">
            {projects.map((project) => (
              <div
                key={project._id || project.slug}
                className="glass-card rounded-xl p-3.5 sm:p-4 border border-white/[0.08] flex flex-col gap-3 hover:border-white/[0.14] transition-colors"
              >
                {/* Header Row: Title, Short Name, Slug, Edit Button */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex flex-col min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="text-sm font-bold font-space text-foreground leading-snug">
                        {project.title}
                      </h2>
                      {project.shortName && (
                        <span className="text-[10px] font-mono text-pacific-cyan/80 bg-pacific-cyan/[0.08] border border-pacific-cyan/20 px-1.5 py-0.5 rounded shrink-0">
                          {project.shortName}
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] font-mono text-muted/60 truncate mt-0.5">
                      /{project.slug}
                    </span>
                  </div>

                  <Link
                    href={`/admin/projects/${project._id}`}
                    className="shrink-0 inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-pacific-cyan text-ink-black text-xs font-mono font-semibold hover:bg-pacific-cyan/90 transition-all shadow-[0_0_10px_rgba(24,155,173,0.25)] min-h-[34px]"
                    title="Edit project"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Edit</span>
                  </Link>
                </div>

                {/* Metadata Row: Category, Status, Order, Year */}
                <div className="flex items-center gap-2 flex-wrap text-[11px] font-mono">
                  <span className="px-2 py-0.5 rounded-md bg-white/[0.04] text-muted/90 border border-white/[0.06]">
                    {project.category}
                  </span>
                  <StatusPill status={project.status} />
                  <span className="text-muted/50 text-[10px]">
                    #{project.displayOrder}
                  </span>
                  {project.year && (
                    <span className="text-muted/50 text-[10px]">
                      · {project.year}
                    </span>
                  )}
                </div>

                {/* Footer Actions: Featured Toggle, External Links, Delete */}
                <div className="pt-2.5 border-t border-white/[0.06] flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      type="button"
                      onClick={() => handleToggleFeatured(project)}
                      disabled={isPending}
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-mono font-semibold transition-all cursor-pointer min-h-[30px] ${
                        project.featured
                          ? "bg-pacific-cyan/15 text-pacific-cyan border border-pacific-cyan/30 hover:bg-pacific-cyan/25"
                          : "bg-white/[0.03] text-muted/50 border border-white/[0.06] hover:text-muted"
                      }`}
                      title={project.featured ? "Remove from Home featured section" : "Feature on Home page"}
                    >
                      <Star className={`w-3 h-3 ${project.featured ? "fill-pacific-cyan" : ""}`} />
                      <span>{project.featured ? "Featured" : "Hidden"}</span>
                    </button>

                    {project.githubUrl && (
                      <a
                        href={project.githubUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 rounded-lg text-muted hover:text-foreground bg-white/[0.03] border border-white/[0.06] hover:border-white/20 transition-colors min-h-[30px] min-w-[30px] flex items-center justify-center"
                        title="GitHub source link"
                        aria-label={`${project.title} GitHub repository`}
                      >
                        <GithubIcon className="w-3.5 h-3.5" />
                      </a>
                    )}

                    {project.liveUrl && (
                      <a
                        href={project.liveUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 rounded-lg text-pacific-cyan hover:text-pacific-cyan/80 bg-pacific-cyan/10 border border-pacific-cyan/20 transition-colors min-h-[30px] min-w-[30px] flex items-center justify-center"
                        title="Live preview URL"
                        aria-label={`${project.title} live preview`}
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => setProjectToDelete(project)}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-mono transition-colors cursor-pointer min-h-[30px]"
                    title="Delete project"
                    aria-label={`Delete ${project.title}`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Delete Confirmation Modal */}
      {projectToDelete && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-black/80 backdrop-blur-md animate-in fade-in duration-200"
        >
          <div className="glass-card rounded-2xl max-w-md w-full p-6 sm:p-8 border border-white/[0.12] flex flex-col gap-6 shadow-2xl">
            <div className="flex items-center gap-3 text-red-400">
              <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/20">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold font-space text-foreground">Confirm Deletion</h3>
                <span className="text-xs font-mono text-muted">This cannot be undone</span>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-muted leading-relaxed">
              Are you sure you want to delete{" "}
              <strong className="text-foreground font-semibold font-space">
                {projectToDelete.title}
              </strong>? It will be removed from your portfolio.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2 border-t border-white/[0.08]">
              <button
                type="button"
                onClick={() => setProjectToDelete(null)}
                disabled={isPending}
                className="inline-flex items-center justify-center h-9 px-4 rounded-xl text-xs font-mono font-medium text-muted hover:text-foreground bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] hover:border-white/20 transition-all cursor-pointer select-none"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                disabled={isPending}
                className="inline-flex items-center justify-center gap-2 h-9 px-5 rounded-xl text-xs font-mono font-semibold bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/30 transition-all cursor-pointer select-none whitespace-nowrap"
              >
                {isPending ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Project</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
