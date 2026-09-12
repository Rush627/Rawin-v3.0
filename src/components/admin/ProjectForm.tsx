"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import {
  Save,
  ArrowLeft,
  Loader2,
  AlertCircle,
  ExternalLink,
  Code2,
  CheckCircle2,
  Check,
} from "lucide-react";
import type { Project, ProjectStatus } from "@/lib/projects";
import RawinSelect from "./RawinSelect";
import RawinNumberInput from "./RawinNumberInput";
import ProjectImageUpload from "./ProjectImageUpload";

const CATEGORY_OPTIONS = [
  { value: "Full Stack", label: "Full Stack" },
  { value: "Frontend", label: "Frontend" },
  { value: "AI & Cloud", label: "AI & Cloud" },
  { value: "Web App", label: "Web App" },
];

const STATUS_OPTIONS = [
  { value: "completed", label: "Completed" },
  { value: "in-progress", label: "In Development" },
  { value: "planned", label: "Planned" },
];

interface ProjectFormProps {
  initialData?: Project | null;
  action: (prevState: { error?: string } | null, formData: FormData) => Promise<{ error?: string }>;
  isEditing?: boolean;
}

export default function ProjectForm({ initialData, action, isEditing = false }: ProjectFormProps) {
  const [state, formAction, isPending] = useActionState(action, {});

  // Local state for interactive tag previews
  const [title, setTitle] = useState(initialData?.title || "");
  const [slug, setSlug] = useState(initialData?.slug || "");
  const [techInput, setTechInput] = useState(initialData?.technologies.join(", ") || "");
  const [focusInput, setFocusInput] = useState(initialData?.engineeringFocus?.join(", ") || "");
  const [status, setStatus] = useState<ProjectStatus>(initialData?.status || "completed");
  const [featured, setFeatured] = useState<boolean>(initialData?.featured ?? true);
  const [caseStudyAvailable, setCaseStudyAvailable] = useState<boolean>(initialData?.caseStudyAvailable ?? true);

  // Auto-generate slug from title if not explicitly modified
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setTitle(val);
    if (!isEditing && !slug) {
      setSlug(
        val
          .toLowerCase()
          .trim()
          .replace(/[^\w\s-]/g, "")
          .replace(/[\s_-]+/g, "-")
      );
    }
  };

  const parsedTech = techInput
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);

  const parsedFocus = focusInput
    .split(",")
    .map((f) => f.trim())
    .filter(Boolean);

  return (
    <form id="project-form" action={formAction} className="flex flex-col gap-8">
      {/* Top action bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/[0.08]">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/projects"
            className="p-2 rounded-xl text-muted hover:text-foreground bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] transition-all"
            title="Return to Projects List"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground font-space">
              {isEditing ? `Edit: ${initialData?.title}` : "New Project"}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-3 self-end sm:self-auto">
          <Link
            href="/admin/projects"
            className="inline-flex items-center justify-center h-10 px-5 rounded-xl text-xs font-mono font-medium text-muted hover:text-foreground bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] hover:border-white/20 transition-all cursor-pointer select-none whitespace-nowrap"
          >
            Cancel
          </Link>
          <button
            id="project-submit-btn"
            type="submit"
            disabled={isPending}
            className="inline-flex items-center justify-center gap-2 h-10 px-6 rounded-xl text-xs font-mono font-semibold bg-pacific-cyan text-ink-black hover:bg-pacific-cyan/90 border border-transparent transition-all shadow-[0_0_20px_rgba(24,155,173,0.35)] disabled:opacity-50 cursor-pointer select-none whitespace-nowrap shrink-0"
          >
            {isPending ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Save className="w-3.5 h-3.5" />
                <span>{isEditing ? "Save Changes" : "Publish Project"}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Error alert */}
      {state?.error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/25 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          <p className="text-xs sm:text-sm text-red-300 font-mono">{state.error}</p>
        </div>
      )}

      {/* Form sections */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Columns: Core Content */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          {/* Card 1: Identity & Hierarchy */}
          <div className="glass-card rounded-2xl p-6 sm:p-8 border border-white/[0.08] flex flex-col gap-5">
            <h2 className="text-sm font-mono uppercase tracking-wider text-pacific-cyan flex items-center gap-2">
              <Code2 className="w-4 h-4" />
              <span>Project Identity</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-xs font-mono text-muted uppercase">
                  Project Title <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  name="title"
                  required
                  defaultValue={initialData?.title || ""}
                  placeholder="e.g. RAWIN 3.0 Platform"
                  className="px-4 py-2.5 rounded-xl bg-ink-black/60 border border-white/[0.08] focus:border-pacific-cyan text-sm text-foreground outline-none transition-colors"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs font-mono text-muted uppercase">
                  Short Name <span className="text-muted/50">(Admin Label)</span>
                </label>
                <input
                  type="text"
                  name="shortName"
                  defaultValue={initialData?.shortName || ""}
                  placeholder="e.g. RAWIN 3"
                  className="px-4 py-2.5 rounded-xl bg-ink-black/60 border border-white/[0.08] focus:border-pacific-cyan text-sm text-foreground outline-none transition-colors"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-xs font-mono text-muted uppercase">
                  URL Slug <span className="text-muted/50">(Unique key)</span>
                </label>
                <input
                  type="text"
                  name="slug"
                  defaultValue={initialData?.slug || ""}
                  placeholder="e.g. rawin-platform"
                  className="px-4 py-2.5 rounded-xl bg-ink-black/60 border border-white/[0.08] focus:border-pacific-cyan text-sm text-foreground font-mono outline-none transition-colors"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs font-mono text-muted uppercase">Category</label>
                <RawinSelect
                  name="category"
                  defaultValue={initialData?.category || "Full Stack"}
                  options={CATEGORY_OPTIONS}
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs font-mono text-muted uppercase">Tagline</label>
              <input
                type="text"
                name="tagline"
                defaultValue={initialData?.tagline || ""}
                placeholder="e.g. Personal portfolio and engineering showcase"
                className="px-4 py-2.5 rounded-xl bg-ink-black/60 border border-white/[0.08] focus:border-pacific-cyan text-sm text-foreground outline-none transition-colors"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs font-mono text-muted uppercase">
                Description <span className="text-red-400">*</span>
              </label>
              <textarea
                name="description"
                rows={4}
                required
                defaultValue={initialData?.description || ""}
                placeholder="High-level engineering overview of the system..."
                className="px-4 py-2.5 rounded-xl bg-ink-black/60 border border-white/[0.08] focus:border-pacific-cyan text-sm text-foreground outline-none transition-colors resize-y"
              />
            </div>
          </div>

          {/* Card 2: Deep Case Study Attributes */}
          <div className="glass-card rounded-2xl p-6 sm:p-8 border border-white/[0.08] flex flex-col gap-5">
            <h2 className="text-sm font-mono uppercase tracking-wider text-pacific-cyan flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>Case Study Details (Optional)</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-xs font-mono text-muted uppercase">The Challenge / Problem</label>
                <textarea
                  name="problem"
                  rows={3}
                  defaultValue={initialData?.problem || ""}
                  placeholder="Architectural obstacles, latency issues, bottlenecks..."
                  className="px-4 py-2.5 rounded-xl bg-ink-black/60 border border-white/[0.08] focus:border-pacific-cyan text-sm text-foreground outline-none transition-colors resize-y"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs font-mono text-muted uppercase">The Architecture / Solution</label>
                <textarea
                  name="solution"
                  rows={3}
                  defaultValue={initialData?.solution || ""}
                  placeholder="Engineered component architecture, pipelines, optimizations..."
                  className="px-4 py-2.5 rounded-xl bg-ink-black/60 border border-white/[0.08] focus:border-pacific-cyan text-sm text-foreground outline-none transition-colors resize-y"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-xs font-mono text-muted uppercase">Role</label>
                <input
                  type="text"
                  name="role"
                  defaultValue={initialData?.role || ""}
                  placeholder="e.g. Lead Full Stack Architect"
                  className="px-4 py-2.5 rounded-xl bg-ink-black/60 border border-white/[0.08] focus:border-pacific-cyan text-sm text-foreground outline-none transition-colors"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs font-mono text-muted uppercase">Year</label>
                <input
                  type="text"
                  name="year"
                  defaultValue={initialData?.year || new Date().getFullYear().toString()}
                  placeholder="e.g. 2026"
                  className="px-4 py-2.5 rounded-xl bg-ink-black/60 border border-white/[0.08] focus:border-pacific-cyan text-sm text-foreground outline-none transition-colors"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs font-mono text-muted uppercase">Outcome Summary</label>
                <input
                  type="text"
                  name="outcome"
                  defaultValue={initialData?.outcome || ""}
                  placeholder="e.g. Fast page loads, smooth interactions"
                  className="px-4 py-2.5 rounded-xl bg-ink-black/60 border border-white/[0.08] focus:border-pacific-cyan text-sm text-foreground outline-none transition-colors"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right 1 Column: Meta, Links, Settings */}
        <div className="flex flex-col gap-6">
          {/* Card 3: Publishing & Visibility */}
          <div className="glass-card rounded-2xl p-6 sm:p-8 border border-white/[0.08] flex flex-col gap-5">
            <h2 className="text-sm font-mono uppercase tracking-wider text-pacific-cyan">Status &amp; Placement</h2>

            <div className="flex flex-col gap-2">
              <label className="text-xs font-mono text-muted uppercase">Development Status</label>
              <RawinSelect
                name="status"
                value={status}
                onChange={(val) => setStatus(val as ProjectStatus)}
                options={STATUS_OPTIONS}
                fontMono
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs font-mono text-muted uppercase">Display Order (Sort weight)</label>
              <RawinNumberInput
                name="displayOrder"
                defaultValue={initialData?.displayOrder ?? 1}
                min={1}
                max={999}
              />
              <span className="text-[11px] font-mono text-muted/60">Lower numbers appear first (e.g. 1, 2, 3).</span>
            </div>

            <div className="pt-3 border-t border-white/[0.08] flex flex-col gap-3">
              <label className="flex items-center gap-3 cursor-pointer group select-none">
                <div className="relative flex items-center justify-center">
                  <input
                    type="checkbox"
                    name="featured"
                    checked={featured}
                    onChange={(e) => setFeatured(e.target.checked)}
                    className="peer sr-only"
                  />
                  <div
                    className={`w-4 h-4 rounded-[5px] border transition-all flex items-center justify-center ${
                      featured
                        ? "bg-pacific-cyan border-pacific-cyan text-ink-black shadow-[0_0_10px_rgba(24,155,173,0.35)]"
                        : "bg-ink-black/70 border-white/[0.18] group-hover:border-white/30"
                    } peer-focus-visible:ring-2 peer-focus-visible:ring-pacific-cyan/50 peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-ink-black`}
                  >
                    <Check
                      className={`w-3 h-3 stroke-[3] transition-opacity duration-150 ${
                        featured ? "opacity-100" : "opacity-0"
                      }`}
                    />
                  </div>
                </div>
                <span className="text-xs font-mono font-medium text-foreground/90 group-hover:text-foreground transition-colors">
                  Feature on Home Page
                </span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer group select-none">
                <div className="relative flex items-center justify-center">
                  <input
                    type="checkbox"
                    name="caseStudyAvailable"
                    checked={caseStudyAvailable}
                    onChange={(e) => setCaseStudyAvailable(e.target.checked)}
                    className="peer sr-only"
                  />
                  <div
                    className={`w-4 h-4 rounded-[5px] border transition-all flex items-center justify-center ${
                      caseStudyAvailable
                        ? "bg-pacific-cyan border-pacific-cyan text-ink-black shadow-[0_0_10px_rgba(24,155,173,0.35)]"
                        : "bg-ink-black/70 border-white/[0.18] group-hover:border-white/30"
                    } peer-focus-visible:ring-2 peer-focus-visible:ring-pacific-cyan/50 peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-ink-black`}
                  >
                    <Check
                      className={`w-3 h-3 stroke-[3] transition-opacity duration-150 ${
                        caseStudyAvailable ? "opacity-100" : "opacity-0"
                      }`}
                    />
                  </div>
                </div>
                <span className="text-xs font-mono font-medium text-foreground/90 group-hover:text-foreground transition-colors">
                  Case Study Available
                </span>
              </label>
            </div>
          </div>

          {/* Card 4: Links & Image */}
          <div className="glass-card rounded-2xl p-6 sm:p-8 border border-white/[0.08] flex flex-col gap-4">
            <h2 className="text-sm font-mono uppercase tracking-wider text-pacific-cyan">Links &amp; Media</h2>

            <div className="flex flex-col gap-2">
              <label className="text-xs font-mono text-muted uppercase">Live Preview URL</label>
              <input
                type="url"
                name="liveUrl"
                defaultValue={initialData?.liveUrl || ""}
                placeholder="https://..."
                className="px-4 py-2.5 rounded-xl bg-ink-black/60 border border-white/[0.08] focus:border-pacific-cyan text-sm text-foreground outline-none transition-colors"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs font-mono text-muted uppercase">GitHub Source URL</label>
              <input
                type="url"
                name="githubUrl"
                defaultValue={initialData?.githubUrl || ""}
                placeholder="https://github.com/..."
                className="px-4 py-2.5 rounded-xl bg-ink-black/60 border border-white/[0.08] focus:border-pacific-cyan text-sm text-foreground outline-none transition-colors"
              />
            </div>

            <ProjectImageUpload
              projectId={isEditing && initialData?._id ? initialData._id : undefined}
              currentImageUrl={initialData?.previewImage || ""}
            />
          </div>

          {/* Card 5: Technologies & Focus Tags */}
          <div className="glass-card rounded-2xl p-6 sm:p-8 border border-white/[0.08] flex flex-col gap-4">
            <h2 className="text-sm font-mono uppercase tracking-wider text-pacific-cyan">Technologies &amp; Focus</h2>

            <div className="flex flex-col gap-2">
              <label className="text-xs font-mono text-muted uppercase">Technologies (comma separated)</label>
              <input
                type="text"
                name="technologies"
                defaultValue={initialData?.technologies.join(", ") || ""}
                placeholder="Next.js, TypeScript, Tailwind CSS"
                className="px-4 py-2.5 rounded-xl bg-ink-black/60 border border-white/[0.08] focus:border-pacific-cyan text-sm text-foreground outline-none transition-colors"
              />
            </div>

            <div className="flex flex-col gap-2 pt-2 border-t border-white/[0.08]">
              <label className="text-xs font-mono text-muted uppercase">Engineering Focus (comma separated)</label>
              <input
                type="text"
                name="engineeringFocus"
                defaultValue={initialData?.engineeringFocus?.join(", ") || ""}
                placeholder="Performance, Scalable Architecture"
                className="px-4 py-2.5 rounded-xl bg-ink-black/60 border border-white/[0.08] focus:border-pacific-cyan text-sm text-foreground outline-none transition-colors"
              />
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}
