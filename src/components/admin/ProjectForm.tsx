"use client";

import { useActionState, useState, useEffect } from "react";
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
  ChevronDown,
  FolderGit2,
  Layers,
  ChevronsUpDown,
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

const SECTION_KEYS = ["identity", "caseStudy", "status", "links", "tech"] as const;
type SectionKey = (typeof SECTION_KEYS)[number];

export default function ProjectForm({ initialData, action, isEditing = false }: ProjectFormProps) {
  const [state, formAction, isPending] = useActionState(action, {});

  // Major sections are CLOSED by default per requirements
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});

  // Local state for interactive tag previews and controlled inputs
  const [title, setTitle] = useState(initialData?.title || "");
  const [slug, setSlug] = useState(initialData?.slug || "");
  const [status, setStatus] = useState<ProjectStatus>(initialData?.status || "completed");
  const [featured, setFeatured] = useState<boolean>(initialData?.featured ?? true);
  const [caseStudyAvailable, setCaseStudyAvailable] = useState<boolean>(initialData?.caseStudyAvailable ?? true);

  // Auto-expand section if server validation returns an error targeting that section
  useEffect(() => {
    if (state?.error) {
      const err = state.error.toLowerCase();
      if (err.includes("title") || err.includes("slug") || err.includes("description") || err.includes("category") || err.includes("tagline")) {
        setOpenSections((prev) => ({ ...prev, identity: true }));
      } else if (err.includes("problem") || err.includes("solution") || err.includes("role") || err.includes("outcome") || err.includes("year")) {
        setOpenSections((prev) => ({ ...prev, caseStudy: true }));
      } else if (err.includes("status") || err.includes("order")) {
        setOpenSections((prev) => ({ ...prev, status: true }));
      } else if (err.includes("preview") || err.includes("url") || err.includes("github")) {
        setOpenSections((prev) => ({ ...prev, links: true }));
      } else if (err.includes("technolog") || err.includes("focus")) {
        setOpenSections((prev) => ({ ...prev, tech: true }));
      } else {
        setOpenSections((prev) => ({ ...prev, identity: true }));
      }
    }
  }, [state?.error]);

  const toggleSection = (key: SectionKey) => {
    setOpenSections((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const allOpen = SECTION_KEYS.every((k) => openSections[k]);
  const toggleAll = () => {
    const nextState = !allOpen;
    const updated: Record<string, boolean> = {};
    SECTION_KEYS.forEach((k) => {
      updated[k] = nextState;
    });
    setOpenSections(updated);
  };

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

  return (
    <form id="project-form" action={formAction} className="flex flex-col gap-6 sm:gap-8 max-w-5xl mx-auto w-full">
      {/* Top action bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-white/[0.08]">
        <div className="flex items-center gap-3">
          <Link
            href="/saint-denis/projects"
            className="p-2 rounded-xl text-muted hover:text-foreground bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] transition-all cursor-pointer min-h-[36px] min-w-[36px] flex items-center justify-center"
            title="Return to Projects List"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="flex flex-col min-w-0">
            <h1 className="text-xl sm:text-3xl font-bold tracking-tight text-foreground font-space truncate">
              {isEditing ? `Edit: ${initialData?.title}` : "New Project"}
            </h1>
            <span className="text-[11px] font-mono text-muted/60">
              {isEditing ? "Modify project metadata and case study" : "Publish a new project showcase"}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-2.5 w-full sm:w-auto shrink-0">
          {/* Save Changes -- order-1 on smartphone (anchored left via mr-auto), sm:order-3 on desktop */}
          <button
            id="project-submit-btn"
            type="submit"
            disabled={isPending}
            className="order-1 sm:order-3 mr-auto sm:mr-0 inline-flex items-center justify-center gap-1.5 sm:gap-2 h-9 sm:h-10 px-4 sm:px-6 rounded-xl text-xs font-mono font-semibold bg-pacific-cyan text-ink-black hover:bg-pacific-cyan/90 border border-transparent transition-all shadow-[0_0_20px_rgba(24,155,173,0.35)] disabled:opacity-50 cursor-pointer select-none whitespace-nowrap shrink-0 min-h-[38px]"
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

          {/* Cancel -- order-2 on smartphone (anchored right), sm:order-2 on desktop */}
          <Link
            href="/saint-denis/projects"
            className="order-2 sm:order-2 inline-flex items-center justify-center h-9 sm:h-10 px-3.5 sm:px-5 rounded-xl text-xs font-mono font-medium text-muted hover:text-foreground bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] hover:border-white/20 transition-all cursor-pointer select-none whitespace-nowrap min-h-[38px]"
          >
            Cancel
          </Link>

          {/* Expand All -- order-3 on smartphone (icon-only rightmost), sm:order-1 on desktop */}
          <button
            type="button"
            onClick={toggleAll}
            className="order-3 sm:order-1 inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-2 rounded-xl text-xs font-mono text-muted hover:text-foreground bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.06] transition-colors cursor-pointer min-h-[38px]"
            title={allOpen ? "Collapse all sections" : "Expand all sections"}
            aria-label={allOpen ? "Collapse all sections" : "Expand all sections"}
          >
            <ChevronsUpDown className="w-3.5 h-3.5 text-pacific-cyan" />
            <span className="hidden sm:inline">{allOpen ? "Collapse All" : "Expand All"}</span>
          </button>
        </div>
      </div>

      {/* Error alert */}
      {state?.error && (
        <div className="p-3.5 sm:p-4 rounded-xl bg-red-500/10 border border-red-500/25 flex items-start gap-3">
          <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-red-400 shrink-0 mt-0.5" />
          <p className="text-xs sm:text-sm text-red-300 font-mono">{state.error}</p>
        </div>
      )}

      {/* Primary Accordion Stack */}
      <div className="flex flex-col gap-3 sm:gap-4">
        {/* Accordion 1: Project Identity */}
        <div className="glass-card rounded-xl sm:rounded-2xl border border-white/[0.08] overflow-hidden transition-colors hover:border-white/[0.12]">
          <button
            type="button"
            onClick={() => toggleSection("identity")}
            aria-expanded={Boolean(openSections.identity)}
            aria-controls="section-identity"
            className="w-full p-3.5 sm:p-5 flex items-center justify-between gap-3 text-left hover:bg-white/[0.02] focus-visible:bg-white/[0.03] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-pacific-cyan/50 transition-colors cursor-pointer select-none"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-white/[0.04] border border-white/[0.08] flex items-center justify-center shrink-0">
                <Code2 className="w-4 h-4 text-pacific-cyan" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-xs sm:text-sm font-mono uppercase tracking-wider font-semibold text-foreground truncate">
                  Project Identity
                </span>
                <span className="text-[10px] sm:text-[11px] font-mono text-muted/60 truncate">
                  Title, short name, URL slug, category, tagline, description
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <span className="text-[10px] font-mono text-muted/40 uppercase hidden sm:inline">
                {openSections.identity ? "Collapse" : "Expand"}
              </span>
              <ChevronDown
                className={`w-4 h-4 text-muted transition-transform duration-200 ${
                  openSections.identity ? "rotate-180 text-pacific-cyan" : ""
                }`}
              />
            </div>
          </button>

          <div
            id="section-identity"
            role="region"
            aria-label="Project Identity"
            className={openSections.identity ? "block p-4 sm:p-6 pt-2 sm:pt-2 border-t border-white/[0.06] flex flex-col gap-4" : "hidden"}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] sm:text-xs font-mono text-muted uppercase">
                  Project Title <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  name="title"
                  defaultValue={initialData?.title || ""}
                  onChange={handleTitleChange}
                  placeholder="e.g. RAWIN 3.0 Platform"
                  className="px-3.5 sm:px-4 py-2 sm:py-2.5 min-h-[42px] sm:min-h-[40px] rounded-xl bg-ink-black/60 border border-white/[0.08] focus:border-pacific-cyan text-[16px] sm:text-sm text-foreground outline-none transition-colors"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] sm:text-xs font-mono text-muted uppercase">
                  Short Name <span className="text-muted/50">(Admin Label)</span>
                </label>
                <input
                  type="text"
                  name="shortName"
                  defaultValue={initialData?.shortName || ""}
                  placeholder="e.g. RAWIN 3"
                  className="px-3.5 sm:px-4 py-2 sm:py-2.5 min-h-[42px] sm:min-h-[40px] rounded-xl bg-ink-black/60 border border-white/[0.08] focus:border-pacific-cyan text-[16px] sm:text-sm text-foreground outline-none transition-colors"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] sm:text-xs font-mono text-muted uppercase">
                  URL Slug <span className="text-muted/50">(Unique key)</span>
                </label>
                <input
                  type="text"
                  name="slug"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="e.g. rawin-platform"
                  className="px-3.5 sm:px-4 py-2 sm:py-2.5 min-h-[42px] sm:min-h-[40px] rounded-xl bg-ink-black/60 border border-white/[0.08] focus:border-pacific-cyan text-[16px] sm:text-sm text-foreground font-mono outline-none transition-colors"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] sm:text-xs font-mono text-muted uppercase">Category</label>
                <RawinSelect
                  name="category"
                  defaultValue={initialData?.category || "Full Stack"}
                  options={CATEGORY_OPTIONS}
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] sm:text-xs font-mono text-muted uppercase">Tagline</label>
              <input
                type="text"
                name="tagline"
                defaultValue={initialData?.tagline || ""}
                placeholder="e.g. Personal portfolio and engineering showcase"
                className="px-3.5 sm:px-4 py-2 sm:py-2.5 min-h-[42px] sm:min-h-[40px] rounded-xl bg-ink-black/60 border border-white/[0.08] focus:border-pacific-cyan text-[16px] sm:text-sm text-foreground outline-none transition-colors"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] sm:text-xs font-mono text-muted uppercase">
                Description <span className="text-red-400">*</span>
              </label>
              <textarea
                name="description"
                rows={4}
                defaultValue={initialData?.description || ""}
                placeholder="High-level overview of the system..."
                className="px-3.5 sm:px-4 py-2.5 rounded-xl bg-ink-black/60 border border-white/[0.08] focus:border-pacific-cyan text-[16px] sm:text-sm text-foreground outline-none transition-colors resize-y leading-relaxed"
              />
            </div>
          </div>
        </div>

        {/* Accordion 2: Case Study Details (Optional) */}
        <div className="glass-card rounded-xl sm:rounded-2xl border border-white/[0.08] overflow-hidden transition-colors hover:border-white/[0.12]">
          <button
            type="button"
            onClick={() => toggleSection("caseStudy")}
            aria-expanded={Boolean(openSections.caseStudy)}
            aria-controls="section-case-study"
            className="w-full p-3.5 sm:p-5 flex items-center justify-between gap-3 text-left hover:bg-white/[0.02] focus-visible:bg-white/[0.03] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-pacific-cyan/50 transition-colors cursor-pointer select-none"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-white/[0.04] border border-white/[0.08] flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-4 h-4 text-pacific-cyan" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-xs sm:text-sm font-mono uppercase tracking-wider font-semibold text-foreground truncate">
                  Case Study Details (Optional)
                </span>
                <span className="text-[10px] sm:text-[11px] font-mono text-muted/60 truncate">
                  The challenge, architecture, role, year, and outcome summary
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <span className="text-[10px] font-mono text-muted/40 uppercase hidden sm:inline">
                {openSections.caseStudy ? "Collapse" : "Expand"}
              </span>
              <ChevronDown
                className={`w-4 h-4 text-muted transition-transform duration-200 ${
                  openSections.caseStudy ? "rotate-180 text-pacific-cyan" : ""
                }`}
              />
            </div>
          </button>

          <div
            id="section-case-study"
            role="region"
            aria-label="Case Study Details"
            className={openSections.caseStudy ? "block p-4 sm:p-6 pt-2 sm:pt-2 border-t border-white/[0.06] flex flex-col gap-4" : "hidden"}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] sm:text-xs font-mono text-muted uppercase">The Challenge / Problem</label>
                <textarea
                  name="problem"
                  rows={3}
                  defaultValue={initialData?.problem || ""}
                  placeholder="Architectural obstacles, latency issues, bottlenecks..."
                  className="px-3.5 sm:px-4 py-2.5 rounded-xl bg-ink-black/60 border border-white/[0.08] focus:border-pacific-cyan text-[16px] sm:text-sm text-foreground outline-none transition-colors resize-y leading-relaxed"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] sm:text-xs font-mono text-muted uppercase">The Architecture / Solution</label>
                <textarea
                  name="solution"
                  rows={3}
                  defaultValue={initialData?.solution || ""}
                  placeholder="Engineered component architecture, pipelines, optimizations..."
                  className="px-3.5 sm:px-4 py-2.5 rounded-xl bg-ink-black/60 border border-white/[0.08] focus:border-pacific-cyan text-[16px] sm:text-sm text-foreground outline-none transition-colors resize-y leading-relaxed"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 sm:gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] sm:text-xs font-mono text-muted uppercase">Role</label>
                <input
                  type="text"
                  name="role"
                  defaultValue={initialData?.role || ""}
                  placeholder="e.g. Lead Full Stack Architect"
                  className="px-3.5 sm:px-4 py-2 sm:py-2.5 min-h-[42px] sm:min-h-[40px] rounded-xl bg-ink-black/60 border border-white/[0.08] focus:border-pacific-cyan text-[16px] sm:text-sm text-foreground outline-none transition-colors"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] sm:text-xs font-mono text-muted uppercase">Year</label>
                <input
                  type="text"
                  name="year"
                  defaultValue={initialData?.year || new Date().getFullYear().toString()}
                  placeholder="e.g. 2026"
                  className="px-3.5 sm:px-4 py-2 sm:py-2.5 min-h-[42px] sm:min-h-[40px] rounded-xl bg-ink-black/60 border border-white/[0.08] focus:border-pacific-cyan text-[16px] sm:text-sm text-foreground outline-none transition-colors"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] sm:text-xs font-mono text-muted uppercase">Outcome Summary</label>
                <input
                  type="text"
                  name="outcome"
                  defaultValue={initialData?.outcome || ""}
                  placeholder="e.g. Fast page loads, smooth interactions"
                  className="px-3.5 sm:px-4 py-2 sm:py-2.5 min-h-[42px] sm:min-h-[40px] rounded-xl bg-ink-black/60 border border-white/[0.08] focus:border-pacific-cyan text-[16px] sm:text-sm text-foreground outline-none transition-colors"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Accordion 3: Status & Placement */}
        <div className="glass-card rounded-xl sm:rounded-2xl border border-white/[0.08] overflow-hidden transition-colors hover:border-white/[0.12]">
          <button
            type="button"
            onClick={() => toggleSection("status")}
            aria-expanded={Boolean(openSections.status)}
            aria-controls="section-status"
            className="w-full p-3.5 sm:p-5 flex items-center justify-between gap-3 text-left hover:bg-white/[0.02] focus-visible:bg-white/[0.03] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-pacific-cyan/50 transition-colors cursor-pointer select-none"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-white/[0.04] border border-white/[0.08] flex items-center justify-center shrink-0">
                <FolderGit2 className="w-4 h-4 text-pacific-cyan" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-xs sm:text-sm font-mono uppercase tracking-wider font-semibold text-foreground truncate">
                  Status &amp; Placement
                </span>
                <span className="text-[10px] sm:text-[11px] font-mono text-muted/60 truncate">
                  Development state, sort weight, home featured toggle, case study flag
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <span className="text-[10px] font-mono text-muted/40 uppercase hidden sm:inline">
                {openSections.status ? "Collapse" : "Expand"}
              </span>
              <ChevronDown
                className={`w-4 h-4 text-muted transition-transform duration-200 ${
                  openSections.status ? "rotate-180 text-pacific-cyan" : ""
                }`}
              />
            </div>
          </button>

          <div
            id="section-status"
            role="region"
            aria-label="Status and Placement"
            className={openSections.status ? "block p-4 sm:p-6 pt-2 sm:pt-2 border-t border-white/[0.06] flex flex-col gap-4" : "hidden"}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] sm:text-xs font-mono text-muted uppercase">Development Status</label>
                <RawinSelect
                  name="status"
                  value={status}
                  onChange={(val) => setStatus(val as ProjectStatus)}
                  options={STATUS_OPTIONS}
                  fontMono
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] sm:text-xs font-mono text-muted uppercase">Display Order (Sort weight)</label>
                <RawinNumberInput
                  name="displayOrder"
                  defaultValue={initialData?.displayOrder ?? 1}
                  min={1}
                  max={999}
                />
                <span className="text-[10px] sm:text-[11px] font-mono text-muted/60">Lower numbers appear first (e.g. 1, 2, 3).</span>
              </div>
            </div>

            <div className="pt-2 border-t border-white/[0.06] grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="flex items-center gap-3 cursor-pointer group select-none py-1">
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

              <label className="flex items-center gap-3 cursor-pointer group select-none py-1">
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
        </div>

        {/* Accordion 4: Links & Media */}
        <div className="glass-card rounded-xl sm:rounded-2xl border border-white/[0.08] overflow-hidden transition-colors hover:border-white/[0.12]">
          <button
            type="button"
            onClick={() => toggleSection("links")}
            aria-expanded={Boolean(openSections.links)}
            aria-controls="section-links"
            className="w-full p-3.5 sm:p-5 flex items-center justify-between gap-3 text-left hover:bg-white/[0.02] focus-visible:bg-white/[0.03] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-pacific-cyan/50 transition-colors cursor-pointer select-none"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-white/[0.04] border border-white/[0.08] flex items-center justify-center shrink-0">
                <ExternalLink className="w-4 h-4 text-pacific-cyan" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-xs sm:text-sm font-mono uppercase tracking-wider font-semibold text-foreground truncate">
                  Links &amp; Media
                </span>
                <span className="text-[10px] sm:text-[11px] font-mono text-muted/60 truncate">
                  Live URL, GitHub repository, and GridFS project image preview
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <span className="text-[10px] font-mono text-muted/40 uppercase hidden sm:inline">
                {openSections.links ? "Collapse" : "Expand"}
              </span>
              <ChevronDown
                className={`w-4 h-4 text-muted transition-transform duration-200 ${
                  openSections.links ? "rotate-180 text-pacific-cyan" : ""
                }`}
              />
            </div>
          </button>

          <div
            id="section-links"
            role="region"
            aria-label="Links and Media"
            className={openSections.links ? "block p-4 sm:p-6 pt-2 sm:pt-2 border-t border-white/[0.06] flex flex-col gap-4" : "hidden"}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] sm:text-xs font-mono text-muted uppercase">Live Preview URL</label>
                <input
                  type="url"
                  name="liveUrl"
                  defaultValue={initialData?.liveUrl || ""}
                  placeholder="https://..."
                  className="px-3.5 sm:px-4 py-2 sm:py-2.5 min-h-[42px] sm:min-h-[40px] rounded-xl bg-ink-black/60 border border-white/[0.08] focus:border-pacific-cyan text-[16px] sm:text-sm text-foreground outline-none transition-colors"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] sm:text-xs font-mono text-muted uppercase">GitHub Source URL</label>
                <input
                  type="url"
                  name="githubUrl"
                  defaultValue={initialData?.githubUrl || ""}
                  placeholder="https://github.com/..."
                  className="px-3.5 sm:px-4 py-2 sm:py-2.5 min-h-[42px] sm:min-h-[40px] rounded-xl bg-ink-black/60 border border-white/[0.08] focus:border-pacific-cyan text-[16px] sm:text-sm text-foreground outline-none transition-colors"
                />
              </div>
            </div>

            <ProjectImageUpload
              projectId={isEditing && initialData?._id ? initialData._id : undefined}
              currentImageUrl={initialData?.previewImage || ""}
            />
          </div>
        </div>

        {/* Accordion 5: Technologies & Focus */}
        <div className="glass-card rounded-xl sm:rounded-2xl border border-white/[0.08] overflow-hidden transition-colors hover:border-white/[0.12]">
          <button
            type="button"
            onClick={() => toggleSection("tech")}
            aria-expanded={Boolean(openSections.tech)}
            aria-controls="section-tech"
            className="w-full p-3.5 sm:p-5 flex items-center justify-between gap-3 text-left hover:bg-white/[0.02] focus-visible:bg-white/[0.03] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-pacific-cyan/50 transition-colors cursor-pointer select-none"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-white/[0.04] border border-white/[0.08] flex items-center justify-center shrink-0">
                <Layers className="w-4 h-4 text-pacific-cyan" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-xs sm:text-sm font-mono uppercase tracking-wider font-semibold text-foreground truncate">
                  Technologies &amp; Focus
                </span>
                <span className="text-[10px] sm:text-[11px] font-mono text-muted/60 truncate">
                  Tech stack tags and engineering focus badges
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <span className="text-[10px] font-mono text-muted/40 uppercase hidden sm:inline">
                {openSections.tech ? "Collapse" : "Expand"}
              </span>
              <ChevronDown
                className={`w-4 h-4 text-muted transition-transform duration-200 ${
                  openSections.tech ? "rotate-180 text-pacific-cyan" : ""
                }`}
              />
            </div>
          </button>

          <div
            id="section-tech"
            role="region"
            aria-label="Technologies and Focus"
            className={openSections.tech ? "block p-4 sm:p-6 pt-2 sm:pt-2 border-t border-white/[0.06] flex flex-col gap-4" : "hidden"}
          >
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] sm:text-xs font-mono text-muted uppercase">Technologies (comma separated)</label>
              <input
                type="text"
                name="technologies"
                defaultValue={initialData?.technologies?.join(", ") || ""}
                placeholder="Next.js, TypeScript, Tailwind CSS"
                className="px-3.5 sm:px-4 py-2 sm:py-2.5 min-h-[42px] sm:min-h-[40px] rounded-xl bg-ink-black/60 border border-white/[0.08] focus:border-pacific-cyan text-[16px] sm:text-sm text-foreground outline-none transition-colors"
              />
            </div>

            <div className="flex flex-col gap-1.5 pt-2 border-t border-white/[0.06]">
              <label className="text-[11px] sm:text-xs font-mono text-muted uppercase">Engineering Focus (comma separated)</label>
              <input
                type="text"
                name="engineeringFocus"
                defaultValue={initialData?.engineeringFocus?.join(", ") || ""}
                placeholder="Performance, Scalable Architecture"
                className="px-3.5 sm:px-4 py-2 sm:py-2.5 min-h-[42px] sm:min-h-[40px] rounded-xl bg-ink-black/60 border border-white/[0.08] focus:border-pacific-cyan text-[16px] sm:text-sm text-foreground outline-none transition-colors"
              />
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}
