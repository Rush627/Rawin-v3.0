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
import { CategoryField, ToneField } from "./ProjectPresentationFields";
import { DEFAULT_PROJECT_CATEGORIES } from "@/lib/taxonomy";

const STATUS_OPTIONS = [
  { value: "completed", label: "Completed" },
  { value: "in-progress", label: "In Development" },
  { value: "planned", label: "Planned" },
];

interface ProjectFormProps {
  initialData?: Project | null;
  action: (prevState: { error?: string } | null, formData: FormData) => Promise<{ error?: string }>;
  isEditing?: boolean;
  /** CMS project taxonomy (Content → Categories) */
  categories?: string[];
}

const SECTION_KEYS = ["identity", "caseStudy", "status", "links", "tech"] as const;
type SectionKey = (typeof SECTION_KEYS)[number];

export default function ProjectForm({ initialData, action, isEditing = false, categories = DEFAULT_PROJECT_CATEGORIES }: ProjectFormProps) {
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-line">
        <div className="flex items-center gap-3">
          <Link
            href="/saint-denis/projects"
            className="p-2 rounded-xl text-fg-muted hover:text-fg bg-surface-2 hover:bg-surface-2 border border-line transition-all cursor-pointer min-h-[36px] min-w-[36px] flex items-center justify-center"
            title="Return to Projects List"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="flex flex-col min-w-0">
            <h1 className="text-xl sm:text-3xl font-bold tracking-tight text-fg font-sans truncate">
              {isEditing ? `Edit: ${initialData?.title}` : "New Project"}
            </h1>
            <span className="text-[11px] font-mono text-fg-muted/60">
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
            className="order-1 sm:order-3 mr-auto sm:mr-0 inline-flex items-center justify-center gap-1.5 sm:gap-2 h-9 sm:h-10 px-4 sm:px-6 rounded-xl text-xs font-mono font-semibold bg-accent text-accent-fg hover:bg-accent/90 border border-transparent transition-all disabled:opacity-50 cursor-pointer select-none whitespace-nowrap shrink-0 min-h-[38px]"
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
            className="order-2 sm:order-2 inline-flex items-center justify-center h-9 sm:h-10 px-3.5 sm:px-5 rounded-xl text-xs font-mono font-medium text-fg-muted hover:text-fg bg-surface-2 hover:bg-surface-2 border border-line hover:border-line-strong transition-all cursor-pointer select-none whitespace-nowrap min-h-[38px]"
          >
            Cancel
          </Link>

          {/* Expand All -- order-3 on smartphone (icon-only rightmost), sm:order-1 on desktop */}
          <button
            type="button"
            onClick={toggleAll}
            className="order-3 sm:order-1 inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-2 rounded-xl text-xs font-mono text-fg-muted hover:text-fg bg-surface-2/60 hover:bg-surface-2 border border-line transition-colors cursor-pointer min-h-[38px]"
            title={allOpen ? "Collapse all sections" : "Expand all sections"}
            aria-label={allOpen ? "Collapse all sections" : "Expand all sections"}
          >
            <ChevronsUpDown className="w-3.5 h-3.5 text-accent" />
            <span className="hidden sm:inline">{allOpen ? "Collapse All" : "Expand All"}</span>
          </button>
        </div>
      </div>

      {/* Error alert */}
      {state?.error && (
        <div className="p-3.5 sm:p-4 rounded-xl bg-danger/10 border border-danger/25 flex items-start gap-3">
          <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-danger shrink-0 mt-0.5" />
          <p className="text-xs sm:text-sm text-danger font-mono">{state.error}</p>
        </div>
      )}

      {/* Primary Accordion Stack */}
      <div className="flex flex-col gap-3 sm:gap-4">
        {/* Accordion 1: Project Identity */}
        <div className="glass-card rounded-xl sm:rounded-2xl border border-line overflow-hidden transition-colors hover:border-line-strong">
          <button
            type="button"
            onClick={() => toggleSection("identity")}
            aria-expanded={Boolean(openSections.identity)}
            aria-controls="section-identity"
            className="w-full p-3.5 sm:p-5 flex items-center justify-between gap-3 text-left hover:bg-surface-2/60 focus-visible:bg-surface-2/60 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent/50 transition-colors cursor-pointer select-none"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-surface-2 border border-line flex items-center justify-center shrink-0">
                <Code2 className="w-4 h-4 text-accent" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-xs sm:text-sm font-mono uppercase tracking-wider font-semibold text-fg truncate">
                  Project Identity
                </span>
                <span className="text-[10px] sm:text-[11px] font-mono text-fg-muted/60 truncate">
                  Title, short name, URL slug, category, tagline, description
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <span className="text-[10px] font-mono text-fg-muted/40 uppercase hidden sm:inline">
                {openSections.identity ? "Collapse" : "Expand"}
              </span>
              <ChevronDown
                className={`w-4 h-4 text-fg-muted transition-transform duration-200 ${
                  openSections.identity ? "rotate-180 text-accent" : ""
                }`}
              />
            </div>
          </button>

          <div
            id="section-identity"
            role="region"
            aria-label="Project Identity"
            className={openSections.identity ? "block p-4 sm:p-6 pt-2 sm:pt-2 border-t border-line flex flex-col gap-4" : "hidden"}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="pf-title" className="text-[11px] sm:text-xs font-mono text-fg-muted uppercase">
                  Project Title <span className="text-danger">*</span>
                </label>
                <input id="pf-title"
                  type="text"
                  name="title"
                  defaultValue={initialData?.title || ""}
                  onChange={handleTitleChange}
                  placeholder="e.g. RAWIN 3.0 Platform"
                  className="px-3.5 sm:px-4 py-2 sm:py-2.5 min-h-[42px] sm:min-h-[40px] rounded-xl bg-surface border border-line focus:border-accent text-[16px] sm:text-sm text-fg outline-none transition-colors"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="pf-shortName" className="text-[11px] sm:text-xs font-mono text-fg-muted uppercase">
                  Short Name <span className="text-fg-muted/50">(Admin Label)</span>
                </label>
                <input id="pf-shortName"
                  type="text"
                  name="shortName"
                  defaultValue={initialData?.shortName || ""}
                  placeholder="e.g. RAWIN 3"
                  className="px-3.5 sm:px-4 py-2 sm:py-2.5 min-h-[42px] sm:min-h-[40px] rounded-xl bg-surface border border-line focus:border-accent text-[16px] sm:text-sm text-fg outline-none transition-colors"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="pf-slug" className="text-[11px] sm:text-xs font-mono text-fg-muted uppercase">
                  URL Slug <span className="text-fg-muted/50">(Unique key)</span>
                </label>
                <input id="pf-slug"
                  type="text"
                  name="slug"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="e.g. rawin-platform"
                  className="px-3.5 sm:px-4 py-2 sm:py-2.5 min-h-[42px] sm:min-h-[40px] rounded-xl bg-surface border border-line focus:border-accent text-[16px] sm:text-sm text-fg font-mono outline-none transition-colors"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="pf-tagline" className="text-[11px] sm:text-xs font-mono text-fg-muted uppercase">Category</label>
                <CategoryField categories={categories} defaultValue={initialData?.category || "Full Stack"} />
              </div>
            </div>

            <ToneField defaultValue={initialData?.tone} />

            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] sm:text-xs font-mono text-fg-muted uppercase">Tagline</label>
              <input id="pf-tagline"
                type="text"
                name="tagline"
                defaultValue={initialData?.tagline || ""}
                placeholder="e.g. Personal portfolio and engineering showcase"
                className="px-3.5 sm:px-4 py-2 sm:py-2.5 min-h-[42px] sm:min-h-[40px] rounded-xl bg-surface border border-line focus:border-accent text-[16px] sm:text-sm text-fg outline-none transition-colors"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="pf-description" className="text-[11px] sm:text-xs font-mono text-fg-muted uppercase">
                Description <span className="text-danger">*</span>
              </label>
              <textarea id="pf-description"
                name="description"
                rows={4}
                defaultValue={initialData?.description || ""}
                placeholder="High-level overview of the system..."
                className="px-3.5 sm:px-4 py-2.5 rounded-xl bg-surface border border-line focus:border-accent text-[16px] sm:text-sm text-fg outline-none transition-colors resize-y leading-relaxed"
              />
            </div>
          </div>
        </div>

        {/* Accordion 2: Case Study Details (Optional) */}
        <div className="glass-card rounded-xl sm:rounded-2xl border border-line overflow-hidden transition-colors hover:border-line-strong">
          <button
            type="button"
            onClick={() => toggleSection("caseStudy")}
            aria-expanded={Boolean(openSections.caseStudy)}
            aria-controls="section-case-study"
            className="w-full p-3.5 sm:p-5 flex items-center justify-between gap-3 text-left hover:bg-surface-2/60 focus-visible:bg-surface-2/60 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent/50 transition-colors cursor-pointer select-none"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-surface-2 border border-line flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-4 h-4 text-accent" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-xs sm:text-sm font-mono uppercase tracking-wider font-semibold text-fg truncate">
                  Case Study Details (Optional)
                </span>
                <span className="text-[10px] sm:text-[11px] font-mono text-fg-muted/60 truncate">
                  The challenge, architecture, role, year, and outcome summary
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <span className="text-[10px] font-mono text-fg-muted/40 uppercase hidden sm:inline">
                {openSections.caseStudy ? "Collapse" : "Expand"}
              </span>
              <ChevronDown
                className={`w-4 h-4 text-fg-muted transition-transform duration-200 ${
                  openSections.caseStudy ? "rotate-180 text-accent" : ""
                }`}
              />
            </div>
          </button>

          <div
            id="section-case-study"
            role="region"
            aria-label="Case Study Details"
            className={openSections.caseStudy ? "block p-4 sm:p-6 pt-2 sm:pt-2 border-t border-line flex flex-col gap-4" : "hidden"}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="pf-problem" className="text-[11px] sm:text-xs font-mono text-fg-muted uppercase">The Challenge / Problem</label>
                <textarea id="pf-problem"
                  name="problem"
                  rows={3}
                  defaultValue={initialData?.problem || ""}
                  placeholder="Architectural obstacles, latency issues, bottlenecks..."
                  className="px-3.5 sm:px-4 py-2.5 rounded-xl bg-surface border border-line focus:border-accent text-[16px] sm:text-sm text-fg outline-none transition-colors resize-y leading-relaxed"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="pf-solution" className="text-[11px] sm:text-xs font-mono text-fg-muted uppercase">The Architecture / Solution</label>
                <textarea id="pf-solution"
                  name="solution"
                  rows={3}
                  defaultValue={initialData?.solution || ""}
                  placeholder="Engineered component architecture, pipelines, optimizations..."
                  className="px-3.5 sm:px-4 py-2.5 rounded-xl bg-surface border border-line focus:border-accent text-[16px] sm:text-sm text-fg outline-none transition-colors resize-y leading-relaxed"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 sm:gap-4">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="pf-role" className="text-[11px] sm:text-xs font-mono text-fg-muted uppercase">Role</label>
                <input id="pf-role"
                  type="text"
                  name="role"
                  defaultValue={initialData?.role || ""}
                  placeholder="e.g. Lead Full Stack Architect"
                  className="px-3.5 sm:px-4 py-2 sm:py-2.5 min-h-[42px] sm:min-h-[40px] rounded-xl bg-surface border border-line focus:border-accent text-[16px] sm:text-sm text-fg outline-none transition-colors"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="pf-year" className="text-[11px] sm:text-xs font-mono text-fg-muted uppercase">Year</label>
                <input id="pf-year"
                  type="text"
                  name="year"
                  defaultValue={initialData?.year || new Date().getFullYear().toString()}
                  placeholder="e.g. 2026"
                  className="px-3.5 sm:px-4 py-2 sm:py-2.5 min-h-[42px] sm:min-h-[40px] rounded-xl bg-surface border border-line focus:border-accent text-[16px] sm:text-sm text-fg outline-none transition-colors"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="pf-outcome" className="text-[11px] sm:text-xs font-mono text-fg-muted uppercase">Outcome Summary</label>
                <input id="pf-outcome"
                  type="text"
                  name="outcome"
                  defaultValue={initialData?.outcome || ""}
                  placeholder="e.g. Fast page loads, smooth interactions"
                  className="px-3.5 sm:px-4 py-2 sm:py-2.5 min-h-[42px] sm:min-h-[40px] rounded-xl bg-surface border border-line focus:border-accent text-[16px] sm:text-sm text-fg outline-none transition-colors"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Accordion 3: Status & Placement */}
        <div className="glass-card rounded-xl sm:rounded-2xl border border-line overflow-hidden transition-colors hover:border-line-strong">
          <button
            type="button"
            onClick={() => toggleSection("status")}
            aria-expanded={Boolean(openSections.status)}
            aria-controls="section-status"
            className="w-full p-3.5 sm:p-5 flex items-center justify-between gap-3 text-left hover:bg-surface-2/60 focus-visible:bg-surface-2/60 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent/50 transition-colors cursor-pointer select-none"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-surface-2 border border-line flex items-center justify-center shrink-0">
                <FolderGit2 className="w-4 h-4 text-accent" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-xs sm:text-sm font-mono uppercase tracking-wider font-semibold text-fg truncate">
                  Status &amp; Placement
                </span>
                <span className="text-[10px] sm:text-[11px] font-mono text-fg-muted/60 truncate">
                  Development state, sort weight, home featured toggle, case study flag
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <span className="text-[10px] font-mono text-fg-muted/40 uppercase hidden sm:inline">
                {openSections.status ? "Collapse" : "Expand"}
              </span>
              <ChevronDown
                className={`w-4 h-4 text-fg-muted transition-transform duration-200 ${
                  openSections.status ? "rotate-180 text-accent" : ""
                }`}
              />
            </div>
          </button>

          <div
            id="section-status"
            role="region"
            aria-label="Status and Placement"
            className={openSections.status ? "block p-4 sm:p-6 pt-2 sm:pt-2 border-t border-line flex flex-col gap-4" : "hidden"}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="pf-status" className="text-[11px] sm:text-xs font-mono text-fg-muted uppercase">Development Status</label>
                <RawinSelect id="pf-status"
                  name="status"
                  value={status}
                  onChange={(val) => setStatus(val as ProjectStatus)}
                  options={STATUS_OPTIONS}
                  fontMono
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="pf-displayOrder" className="text-[11px] sm:text-xs font-mono text-fg-muted uppercase">Display Order (Sort weight)</label>
                <RawinNumberInput
                  id="pf-displayOrder"
                  name="displayOrder"
                  defaultValue={initialData?.displayOrder ?? 1}
                  min={1}
                  max={999}
                />
                <span className="text-[10px] sm:text-[11px] font-mono text-fg-muted/60">Lower numbers appear first (e.g. 1, 2, 3).</span>
              </div>
            </div>

            <div className="pt-2 border-t border-line grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="flex items-center gap-3 cursor-pointer group select-none py-1">
                <div className="relative flex items-center justify-center">
                  <input id="pf-featured"
                    type="checkbox"
                    name="featured"
                    checked={featured}
                    onChange={(e) => setFeatured(e.target.checked)}
                    className="peer sr-only"
                  />
                  <div
                    className={`w-4 h-4 rounded-[5px] border transition-all flex items-center justify-center ${
                      featured
                        ? "bg-accent border-accent text-accent-fg "
                        : "bg-surface border-line-strong group-hover:border-line-strong"
                    } peer-focus-visible:ring-2 peer-focus-visible:ring-accent/50 peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-bg`}
                  >
                    <Check
                      className={`w-3 h-3 stroke-[3] transition-opacity duration-150 ${
                        featured ? "opacity-100" : "opacity-0"
                      }`}
                    />
                  </div>
                </div>
                <span className="text-xs font-mono font-medium text-fg/90 group-hover:text-fg transition-colors">
                  Feature on Home Page
                </span>
              </label>

              <label htmlFor="pf-caseStudyAvailable" className="flex items-center gap-3 cursor-pointer group select-none py-1">
                <div className="relative flex items-center justify-center">
                  <input id="pf-caseStudyAvailable"
                    type="checkbox"
                    name="caseStudyAvailable"
                    checked={caseStudyAvailable}
                    onChange={(e) => setCaseStudyAvailable(e.target.checked)}
                    className="peer sr-only"
                  />
                  <div
                    className={`w-4 h-4 rounded-[5px] border transition-all flex items-center justify-center ${
                      caseStudyAvailable
                        ? "bg-accent border-accent text-accent-fg "
                        : "bg-surface border-line-strong group-hover:border-line-strong"
                    } peer-focus-visible:ring-2 peer-focus-visible:ring-accent/50 peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-bg`}
                  >
                    <Check
                      className={`w-3 h-3 stroke-[3] transition-opacity duration-150 ${
                        caseStudyAvailable ? "opacity-100" : "opacity-0"
                      }`}
                    />
                  </div>
                </div>
                <span className="text-xs font-mono font-medium text-fg/90 group-hover:text-fg transition-colors">
                  Case Study Available
                </span>
              </label>
            </div>
          </div>
        </div>

        {/* Accordion 4: Links & Media */}
        <div className="glass-card rounded-xl sm:rounded-2xl border border-line overflow-hidden transition-colors hover:border-line-strong">
          <button
            type="button"
            onClick={() => toggleSection("links")}
            aria-expanded={Boolean(openSections.links)}
            aria-controls="section-links"
            className="w-full p-3.5 sm:p-5 flex items-center justify-between gap-3 text-left hover:bg-surface-2/60 focus-visible:bg-surface-2/60 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent/50 transition-colors cursor-pointer select-none"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-surface-2 border border-line flex items-center justify-center shrink-0">
                <ExternalLink className="w-4 h-4 text-accent" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-xs sm:text-sm font-mono uppercase tracking-wider font-semibold text-fg truncate">
                  Links &amp; Media
                </span>
                <span className="text-[10px] sm:text-[11px] font-mono text-fg-muted/60 truncate">
                  Live URL, GitHub repository, and GridFS project image preview
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <span className="text-[10px] font-mono text-fg-muted/40 uppercase hidden sm:inline">
                {openSections.links ? "Collapse" : "Expand"}
              </span>
              <ChevronDown
                className={`w-4 h-4 text-fg-muted transition-transform duration-200 ${
                  openSections.links ? "rotate-180 text-accent" : ""
                }`}
              />
            </div>
          </button>

          <div
            id="section-links"
            role="region"
            aria-label="Links and Media"
            className={openSections.links ? "block p-4 sm:p-6 pt-2 sm:pt-2 border-t border-line flex flex-col gap-4" : "hidden"}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="pf-liveUrl" className="text-[11px] sm:text-xs font-mono text-fg-muted uppercase">Live Preview URL</label>
                <input id="pf-liveUrl"
                  type="url"
                  name="liveUrl"
                  defaultValue={initialData?.liveUrl || ""}
                  placeholder="https://..."
                  className="px-3.5 sm:px-4 py-2 sm:py-2.5 min-h-[42px] sm:min-h-[40px] rounded-xl bg-surface border border-line focus:border-accent text-[16px] sm:text-sm text-fg outline-none transition-colors"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="pf-githubUrl" className="text-[11px] sm:text-xs font-mono text-fg-muted uppercase">GitHub Source URL</label>
                <input id="pf-githubUrl"
                  type="url"
                  name="githubUrl"
                  defaultValue={initialData?.githubUrl || ""}
                  placeholder="https://github.com/..."
                  className="px-3.5 sm:px-4 py-2 sm:py-2.5 min-h-[42px] sm:min-h-[40px] rounded-xl bg-surface border border-line focus:border-accent text-[16px] sm:text-sm text-fg outline-none transition-colors"
                />
              </div>
            </div>

            <ProjectImageUpload
              projectId={isEditing && initialData?._id ? initialData._id : undefined}
              currentImageUrl={initialData?.previewImage || ""}
              project={initialData ? { tone: initialData.tone, slug: initialData.slug, title: initialData.title } : undefined}
            />
          </div>
        </div>

        {/* Accordion 5: Technologies & Focus */}
        <div className="glass-card rounded-xl sm:rounded-2xl border border-line overflow-hidden transition-colors hover:border-line-strong">
          <button
            type="button"
            onClick={() => toggleSection("tech")}
            aria-expanded={Boolean(openSections.tech)}
            aria-controls="section-tech"
            className="w-full p-3.5 sm:p-5 flex items-center justify-between gap-3 text-left hover:bg-surface-2/60 focus-visible:bg-surface-2/60 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent/50 transition-colors cursor-pointer select-none"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-surface-2 border border-line flex items-center justify-center shrink-0">
                <Layers className="w-4 h-4 text-accent" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-xs sm:text-sm font-mono uppercase tracking-wider font-semibold text-fg truncate">
                  Technologies &amp; Focus
                </span>
                <span className="text-[10px] sm:text-[11px] font-mono text-fg-muted/60 truncate">
                  Tech stack tags and engineering focus badges
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <span className="text-[10px] font-mono text-fg-muted/40 uppercase hidden sm:inline">
                {openSections.tech ? "Collapse" : "Expand"}
              </span>
              <ChevronDown
                className={`w-4 h-4 text-fg-muted transition-transform duration-200 ${
                  openSections.tech ? "rotate-180 text-accent" : ""
                }`}
              />
            </div>
          </button>

          <div
            id="section-tech"
            role="region"
            aria-label="Technologies and Focus"
            className={openSections.tech ? "block p-4 sm:p-6 pt-2 sm:pt-2 border-t border-line flex flex-col gap-4" : "hidden"}
          >
            <div className="flex flex-col gap-1.5">
              <label htmlFor="pf-technologies" className="text-[11px] sm:text-xs font-mono text-fg-muted uppercase">Technologies (comma separated)</label>
              <input id="pf-technologies"
                type="text"
                name="technologies"
                defaultValue={initialData?.technologies?.join(", ") || ""}
                placeholder="Next.js, TypeScript, Tailwind CSS"
                className="px-3.5 sm:px-4 py-2 sm:py-2.5 min-h-[42px] sm:min-h-[40px] rounded-xl bg-surface border border-line focus:border-accent text-[16px] sm:text-sm text-fg outline-none transition-colors"
              />
            </div>

            <div className="flex flex-col gap-1.5 pt-2 border-t border-line">
              <label htmlFor="pf-engineeringFocus" className="text-[11px] sm:text-xs font-mono text-fg-muted uppercase">Engineering Focus (comma separated)</label>
              <input id="pf-engineeringFocus"
                type="text"
                name="engineeringFocus"
                defaultValue={initialData?.engineeringFocus?.join(", ") || ""}
                placeholder="Performance, Scalable Architecture"
                className="px-3.5 sm:px-4 py-2 sm:py-2.5 min-h-[42px] sm:min-h-[40px] rounded-xl bg-surface border border-line focus:border-accent text-[16px] sm:text-sm text-fg outline-none transition-colors"
              />
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}
