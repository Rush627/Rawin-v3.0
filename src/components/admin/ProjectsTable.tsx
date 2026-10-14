"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Edit3,
  Trash2,
  Star,
  ExternalLink,
  Code2,
} from "lucide-react";
import { GithubIcon } from "@/components/SocialIcons";
import type { Project, ProjectStatus } from "@/lib/projects";
import { toggleFeaturedAction, deleteProjectAction } from "@/app/saint-denis/projects/actions";
import ConfirmDialog from "@/components/studio/ConfirmDialog";
import { StateBadge } from "@/components/studio/filters";

interface ProjectsTableProps {
  projects: Project[];
}

function StatusPill({ status }: { status: ProjectStatus }) {
  if (status === "completed") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-medium bg-success/10 text-success border border-success/20">
        <span className="w-1.5 h-1.5 rounded-full bg-success" />
        <span>COMPLETED</span>
      </span>
    );
  }
  if (status === "in-progress") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-medium bg-warning/10 text-warning border border-warning/20">
        <span className="w-1.5 h-1.5 rounded-full bg-warning animate-pulse" />
        <span>IN DEVELOPMENT</span>
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-medium bg-accent/10 text-accent border border-accent/20">
      <span className="w-1.5 h-1.5 rounded-full bg-accent" />
      <span>PLANNED</span>
    </span>
  );
}

export default function ProjectsTable({ projects }: ProjectsTableProps) {
  const [localProjects, setLocalProjects] = useState<Project[]>(projects);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    setLocalProjects(projects);
  }, [projects]);

  const handleToggleFeatured = async (project: Project) => {
    if (!project._id || togglingId) return;
    const targetId = project._id;
    const prevFeatured = project.featured;
    const nextFeatured = !prevFeatured;

    // Instant optimistic update
    setLocalProjects((prev) =>
      prev.map((p) => (p._id === targetId ? { ...p, featured: nextFeatured } : p))
    );
    setTogglingId(targetId);

    try {
      await toggleFeaturedAction(targetId, prevFeatured);
    } catch {
      // Rollback on failure
      setLocalProjects((prev) =>
        prev.map((p) => (p._id === targetId ? { ...p, featured: prevFeatured } : p))
      );
      setErrorMessage("Failed to update featured status.");
    } finally {
      setTogglingId(null);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!projectToDelete?._id || isDeleting) return;
    const targetId = projectToDelete._id;
    const previousProjects = localProjects;
    setIsDeleting(true);

    // Instant optimistic removal from UI
    setLocalProjects((prev) => prev.filter((p) => p._id !== targetId));
    setProjectToDelete(null);

    try {
      await deleteProjectAction(targetId);
    } catch {
      // Rollback on failure
      setLocalProjects(previousProjects);
      setErrorMessage("Failed to delete project.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {errorMessage && (
        <div className="p-4 rounded-xl bg-danger/10 border border-danger/25 flex items-center justify-between gap-3 text-danger text-xs font-mono">
          <span>{errorMessage}</span>
          <button onClick={() => setErrorMessage(null)} className="underline cursor-pointer">
            Dismiss
          </button>
        </div>
      )}

      {localProjects.length === 0 ? (
        <div className="glass-card rounded-2xl p-12 text-center border border-line flex flex-col items-center gap-4">
          <Code2 className="w-8 h-8 text-fg-muted/40" />
          <p className="text-fg-muted text-sm font-mono">No projects found.</p>
          <Link
            href="/saint-denis/projects/new"
            className="px-4 py-2 rounded-xl bg-accent text-accent-fg text-xs font-mono font-semibold"
          >
            Create Project
          </Link>
        </div>
      ) : (
        <>
          {/* Desktop table (>= 768px). Fixed column layout: every column has a set width and the
              project column takes the rest, so badges and actions never squeeze each other. Below
              the table's minimum width it scrolls inside its own frame, with Actions pinned. */}
          <div className="hidden md:block rounded-2xl border border-line bg-surface overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[920px] table-fixed text-left text-[13px]">
                <caption className="sr-only">Projects, in display order</caption>
                <colgroup>
                  <col className="w-[60px]" />
                  <col />
                  <col className="w-[136px]" />
                  <col className="w-[148px]" />
                  <col className="w-[116px]" />
                  <col className="w-[96px]" />
                  <col className="w-[180px]" />
                </colgroup>
                <thead className="border-b border-line bg-surface-2">
                  <tr className="label-mono text-fg-subtle">
                    <th scope="col" className="px-4 py-3 font-normal text-right">Order</th>
                    <th scope="col" className="px-4 py-3 font-normal">Project</th>
                    <th scope="col" className="px-4 py-3 font-normal">Category</th>
                    <th scope="col" className="px-4 py-3 font-normal">Status</th>
                    <th scope="col" className="px-4 py-3 font-normal">Featured</th>
                    <th scope="col" className="px-3 py-3 font-normal">Links</th>
                    <th scope="col" className="sticky right-0 px-4 py-3 font-normal text-right bg-surface-2">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {localProjects.map((project) => {
                    const toggling = togglingId === project._id;
                    return (
                      <tr key={project._id || project.slug} className="group hover:bg-surface-2/60 transition-colors">
                        <td className="px-4 py-3.5 text-right font-mono text-[12.5px] tabular-nums text-fg-muted">
                          {String(project.displayOrder ?? "").padStart(2, "0")}
                        </td>

                        <td className="px-4 py-3.5">
                          <p className="font-medium text-[14.5px] leading-snug text-fg line-clamp-2 break-words" title={project.title}>
                            {project.title}
                          </p>
                          {/* a div: the global `p { text-wrap: pretty }` would override truncate */}
                          <div className="mt-0.5 font-mono text-[12px] text-fg-subtle truncate" title={`/${project.slug}${project.shortName ? ` · ${project.shortName}` : ""}`}>
                            /{project.slug}
                            {project.shortName && <span> · {project.shortName}</span>}
                          </div>
                        </td>

                        <td className="px-4 py-3.5">
                          {project.category ? (
                            <span className="inline-block max-w-full px-2 py-1 rounded-md border border-line bg-surface-2 text-[12.5px] leading-tight text-fg-muted break-words">
                              {project.category}
                            </span>
                          ) : (
                            <span className="text-fg-subtle">
                              <span aria-hidden="true">—</span>
                              <span className="sr-only">No category</span>
                            </span>
                          )}
                        </td>

                        <td className="px-4 py-3.5">
                          {project.status === "completed" ? (
                            <StateBadge tone="success">Completed</StateBadge>
                          ) : project.status === "in-progress" ? (
                            <StateBadge tone="warning">In development</StateBadge>
                          ) : (
                            <StateBadge tone="accent">Planned</StateBadge>
                          )}
                        </td>

                        <td className="px-4 py-3.5">
                          <button
                            type="button"
                            onClick={() => handleToggleFeatured(project)}
                            disabled={toggling}
                            aria-pressed={project.featured}
                            aria-label={`Feature ${project.title} on the home page`}
                            title={project.featured ? "Featured on the home page: select to remove" : "Not featured: select to feature on the home page"}
                            className={`inline-flex items-center gap-1.5 h-8 min-w-[5.75rem] px-2.5 rounded-lg border text-[12.5px] transition-colors disabled:opacity-60 disabled:cursor-wait ${
                              project.featured
                                ? "border-accent/30 bg-accent/10 text-accent hover:bg-accent/15"
                                : "border-line text-fg-subtle hover:text-fg hover:border-line-strong"
                            }`}
                          >
                            <Star aria-hidden="true" className={`w-3.5 h-3.5 ${project.featured ? "fill-current" : ""}`} />
                            {project.featured ? "Featured" : "Off"}
                          </button>
                        </td>

                        <td className="px-3 py-3.5">
                          <div className="flex items-center gap-1">
                            {project.githubUrl ? (
                              <a
                                href={project.githubUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center justify-center w-9 h-9 rounded-lg text-fg-muted hover:text-fg hover:bg-surface-2"
                                title="Source code on GitHub"
                                aria-label={`${project.title}: source code on GitHub (opens in a new tab)`}
                              >
                                <GithubIcon className="w-4 h-4" />
                              </a>
                            ) : (
                              <span className="inline-flex items-center justify-center w-9 h-9 text-fg-subtle/70" title="No source link">
                                <span aria-hidden="true">—</span>
                                <span className="sr-only">No source link</span>
                              </span>
                            )}
                            {project.liveUrl ? (
                              <a
                                href={project.liveUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center justify-center w-9 h-9 rounded-lg text-fg-muted hover:text-fg hover:bg-surface-2"
                                title="Live site"
                                aria-label={`${project.title}: live site (opens in a new tab)`}
                              >
                                <ExternalLink className="w-4 h-4" />
                              </a>
                            ) : (
                              <span className="inline-flex items-center justify-center w-9 h-9 text-fg-subtle/70" title="No live link">
                                <span aria-hidden="true">—</span>
                                <span className="sr-only">No live link</span>
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="sticky right-0 px-4 py-3.5 bg-surface group-hover:bg-[color-mix(in_oklab,var(--surface-2)_60%,var(--surface))] transition-colors">
                          <div className="flex items-center justify-end gap-2">
                            <Link
                              href={`/saint-denis/projects/${project._id}`}
                              className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg border border-line bg-surface text-fg text-[13px] hover:border-line-strong"
                              aria-label={`Edit ${project.title}`}
                            >
                              <Edit3 aria-hidden="true" className="w-3.5 h-3.5" />
                              Edit
                            </Link>
                            <button
                              type="button"
                              onClick={() => setProjectToDelete(project)}
                              className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg border border-danger/30 bg-surface text-danger text-[13px] hover:bg-danger/10"
                              aria-label={`Delete ${project.title}`}
                            >
                              <Trash2 aria-hidden="true" className="w-3.5 h-3.5" />
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Smartphone Card List View (< 768px) */}
          <div className="flex md:hidden flex-col gap-3">
            {localProjects.map((project) => (
              <div
                key={project._id || project.slug}
                className="glass-card rounded-xl p-3.5 sm:p-4 border border-line flex flex-col gap-3 hover:border-line-strong transition-colors"
              >
                {/* Header Row: Title, Short Name, Slug, Edit Button */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex flex-col min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="text-sm font-bold font-sans text-fg leading-snug">
                        {project.title}
                      </h2>
                      {project.shortName && (
                        <span className="text-[10px] font-mono text-accent/80 bg-accent/[0.08] border border-accent/20 px-1.5 py-0.5 rounded shrink-0">
                          {project.shortName}
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] font-mono text-fg-muted/60 truncate mt-0.5">
                      /{project.slug}
                    </span>
                  </div>

                  <Link
                    href={`/saint-denis/projects/${project._id}`}
                    className="shrink-0 inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-accent text-accent-fg text-xs font-mono font-semibold hover:bg-accent/90 transition-all min-h-[34px]"
                    title="Edit project"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Edit</span>
                  </Link>
                </div>

                {/* Metadata Row: Category, Status, Order, Year */}
                <div className="flex items-center gap-2 flex-wrap text-[11px] font-mono">
                  <span className="px-2 py-0.5 rounded-md bg-surface-2 text-fg-muted/90 border border-line">
                    {project.category}
                  </span>
                  <StatusPill status={project.status} />
                  <span className="text-fg-muted/50 text-[10px]">
                    #{project.displayOrder}
                  </span>
                  {project.year && (
                    <span className="text-fg-muted/50 text-[10px]">
                      · {project.year}
                    </span>
                  )}
                </div>

                {/* Footer Actions: Featured Toggle, External Links, Delete */}
                <div className="pt-2.5 border-t border-line flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      type="button"
                      onClick={() => handleToggleFeatured(project)}
                      disabled={togglingId === project._id}
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-mono font-semibold transition-all cursor-pointer min-h-[30px] ${
                        project.featured
                          ? "bg-accent/15 text-accent border border-accent/30 hover:bg-accent/25"
                          : "bg-surface-2/60 text-fg-muted/50 border border-line hover:text-fg-muted"
                      }`}
                      title={project.featured ? "Remove from Home featured section" : "Feature on Home page"}
                    >
                      <Star className={`w-3 h-3 ${project.featured ? "fill-accent" : ""}`} />
                      <span>{project.featured ? "Featured" : "Hidden"}</span>
                    </button>

                    {project.githubUrl && (
                      <a
                        href={project.githubUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 rounded-lg text-fg-muted hover:text-fg bg-surface-2/60 border border-line hover:border-line-strong transition-colors min-h-11 min-w-11 flex items-center justify-center"
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
                        className="p-1.5 rounded-lg text-accent hover:text-accent/80 bg-accent/10 border border-accent/20 transition-colors min-h-11 min-w-11 flex items-center justify-center"
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
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-danger/10 hover:bg-danger/20 text-danger text-xs font-mono transition-colors cursor-pointer min-h-[30px]"
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

      <ConfirmDialog
        open={Boolean(projectToDelete)}
        title={`Delete “${projectToDelete?.title ?? ""}”?`}
        confirmLabel="Delete project"
        destructive busy={isDeleting}
        onCancel={() => setProjectToDelete(null)}
        onConfirm={handleDeleteConfirm}
      >
        The project is removed from the site immediately, together with its preview image. This cannot be undone.
      </ConfirmDialog>
    </div>
  );
}
