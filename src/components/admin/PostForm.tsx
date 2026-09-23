"use client";

import { useActionState, useState, useEffect } from "react";
import Link from "next/link";
import {
  Save,
  ArrowLeft,
  Loader2,
  AlertCircle,
  FileText,
  Eye,
  Edit3,
  Calendar,
  Tag,
  ChevronDown,
  ChevronsUpDown,
  Check,
} from "lucide-react";
import type { BlogPost, BlogPostStatus } from "@/lib/blog";
import MarkdownRenderer from "@/components/MarkdownRenderer";
import RawinSelect from "./RawinSelect";
import RawinDateTimeInput from "./RawinDateTimeInput";
import BlogCoverUpload from "./BlogCoverUpload";
import { toKolkataDateTimeInput } from "@/lib/dateUtils";

const BLOG_STATUS_OPTIONS = [
  { value: "draft", label: "Draft" },
  { value: "published", label: "Published" },
  { value: "archived", label: "Archived" },
];

interface PostFormProps {
  initialData?: BlogPost | null;
  action: (prevState: { error?: string } | null, formData: FormData) => Promise<{ error?: string }>;
  isEditing?: boolean;
}

const SECTION_KEYS = ["details", "markdown", "publishing", "tags"] as const;
type SectionKey = (typeof SECTION_KEYS)[number];

export default function PostForm({ initialData, action, isEditing = false }: PostFormProps) {
  const [state, formAction, isPending] = useActionState(action, {});

  // Collapsible accordion sections closed by default
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});

  // Local state for interactive editing and live Markdown preview
  const [previewContent, setPreviewContent] = useState(initialData?.content || "");
  const [status, setStatus] = useState<BlogPostStatus>(initialData?.status || "draft");
  const [featured, setFeatured] = useState<boolean>(initialData?.featured ?? false);
  const [activeTab, setActiveTab] = useState<"write" | "preview">("write");

  // Auto-expand relevant section if server action returns an error
  useEffect(() => {
    if (state?.error) {
      const err = state.error.toLowerCase();
      if (err.includes("title") || err.includes("slug") || err.includes("excerpt") || err.includes("readtime")) {
        setOpenSections((prev) => ({ ...prev, details: true }));
      } else if (err.includes("content") || err.includes("markdown")) {
        setOpenSections((prev) => ({ ...prev, markdown: true }));
      } else if (err.includes("status") || err.includes("publishedat") || err.includes("date") || err.includes("feature")) {
        setOpenSections((prev) => ({ ...prev, publishing: true }));
      } else if (err.includes("tag") || err.includes("cover")) {
        setOpenSections((prev) => ({ ...prev, tags: true }));
      } else {
        setOpenSections((prev) => ({ ...prev, details: true }));
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

  const handleTabSwitch = (tab: "write" | "preview") => {
    if (tab === "preview") {
      const form = document.getElementById("post-form") as HTMLFormElement | null;
      const contentEl = form?.elements.namedItem("content") as HTMLTextAreaElement | null;
      if (contentEl) {
        setPreviewContent(contentEl.value);
      }
    }
    setActiveTab(tab);
  };

  // Format date for date-time input in Asia/Kolkata timezone (IST, UTC+05:30)
  const getDefaultDateInput = () => {
    if (initialData?.publishedAt) {
      return toKolkataDateTimeInput(initialData.publishedAt);
    }
    return toKolkataDateTimeInput(new Date());
  };

  return (
    <form id="post-form" action={formAction} className="flex flex-col gap-6 sm:gap-8 max-w-5xl mx-auto w-full min-w-0">
      {/* Top action bar */}
      <div className="flex flex-col gap-3 pb-5 border-b border-white/[0.08] sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        {/* Back + Title */}
        <div className="flex items-center gap-3 min-w-0">
          <Link
            href="/saint-denis/blog"
            className="p-2 rounded-xl text-muted hover:text-foreground bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] transition-all cursor-pointer min-h-[36px] min-w-[36px] flex items-center justify-center shrink-0"
            title="Return to Blog Posts List"
            aria-label="Return to Blog Posts List"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="flex flex-col min-w-0">
            <h1 className="text-xl sm:text-3xl font-bold tracking-tight text-foreground font-space truncate">
              {isEditing ? `Edit: ${initialData?.title}` : "Write New Article"}
            </h1>
            <span className="text-[11px] font-mono text-muted/60">
              {isEditing ? "Update article content and publication settings" : "Draft and publish a new article"}
            </span>
          </div>
        </div>

        {/* Action buttons: Save (primary, leftmost), Cancel, Expand All (rightmost) */}
        <div className="flex items-center gap-2 sm:gap-2.5 w-full sm:w-auto shrink-0">
          {/* Save Changes -- primary action, leftmost on mobile via mr-auto */}
          <button
            id="post-submit-btn"
            type="submit"
            disabled={isPending}
            className="mr-auto sm:mr-0 inline-flex items-center justify-center gap-1.5 sm:gap-2 h-9 sm:h-10 px-4 sm:px-6 rounded-xl text-xs font-mono font-semibold bg-pacific-cyan text-ink-black hover:bg-pacific-cyan/90 border border-transparent transition-all shadow-[0_0_20px_rgba(24,155,173,0.35)] disabled:opacity-50 cursor-pointer select-none whitespace-nowrap shrink-0 min-h-[38px]"
          >
            {isPending ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Save className="w-3.5 h-3.5" />
                <span>{isEditing ? "Save Changes" : status === "published" ? "Publish Article" : "Save Draft"}</span>
              </>
            )}
          </button>

          {/* Cancel */}
          <Link
            href="/saint-denis/blog"
            className="inline-flex items-center justify-center h-9 sm:h-10 px-3.5 sm:px-5 rounded-xl text-xs font-mono font-medium text-muted hover:text-foreground bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] hover:border-white/20 transition-all cursor-pointer select-none whitespace-nowrap min-h-[38px]"
          >
            Cancel
          </Link>

          {/* Expand All -- icon-only on mobile, text on desktop */}
          <button
            type="button"
            onClick={toggleAll}
            className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-2 rounded-xl text-xs font-mono text-muted hover:text-foreground bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.06] transition-colors cursor-pointer min-h-[38px]"
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
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/25 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          <p className="text-xs sm:text-sm text-red-300 font-mono">{state.error}</p>
        </div>
      )}

      {/* Primary Accordion Stack */}
      <div className="flex flex-col gap-3 sm:gap-4">
        {/* Accordion 1: Article Details */}
        <div className="glass-card rounded-xl sm:rounded-2xl border border-white/[0.08] overflow-hidden transition-colors hover:border-white/[0.12]">
          <button
            type="button"
            onClick={() => toggleSection("details")}
            aria-expanded={Boolean(openSections.details)}
            aria-controls="section-details"
            className="w-full p-3.5 sm:p-5 flex items-center justify-between gap-3 text-left hover:bg-white/[0.02] focus-visible:bg-white/[0.03] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-pacific-cyan/50 transition-colors cursor-pointer select-none"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-white/[0.04] border border-white/[0.08] flex items-center justify-center shrink-0">
                <FileText className="w-4 h-4 text-pacific-cyan" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-xs sm:text-sm font-mono uppercase tracking-wider font-semibold text-foreground truncate">
                  Article Details
                </span>
                <span className="text-[10px] sm:text-[11px] font-mono text-muted/60 truncate">
                  Title, URL slug, read time, excerpt, and author
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <span className="text-[10px] font-mono text-muted/40 uppercase hidden sm:inline">
                {openSections.details ? "Collapse" : "Expand"}
              </span>
              <ChevronDown
                className={`w-4 h-4 text-muted transition-transform duration-200 ${
                  openSections.details ? "rotate-180 text-pacific-cyan" : ""
                }`}
              />
            </div>
          </button>

          <div
            id="section-details"
            role="region"
            aria-label="Article Details"
            className={openSections.details ? "flex flex-col gap-4 p-4 sm:p-6 pt-2 sm:pt-2 border-t border-white/[0.06]" : "hidden"}
          >
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] sm:text-xs font-mono text-muted uppercase">
                Article Title <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                name="title"
                required
                defaultValue={initialData?.title || ""}
                placeholder="e.g. Modern Web Architecture Patterns"
                className="px-3.5 sm:px-4 py-2 sm:py-2.5 min-h-[42px] sm:min-h-[40px] rounded-xl bg-ink-black/60 border border-white/[0.08] focus:border-pacific-cyan text-[16px] sm:text-sm text-foreground outline-none transition-colors w-full"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] sm:text-xs font-mono text-muted uppercase">
                  URL Slug <span className="text-muted/50">(Unique key)</span>
                </label>
                <input
                  type="text"
                  name="slug"
                  defaultValue={initialData?.slug || ""}
                  placeholder="e.g. modern-web-architecture-patterns"
                  className="px-3.5 sm:px-4 py-2 sm:py-2.5 min-h-[42px] sm:min-h-[40px] rounded-xl bg-ink-black/60 border border-white/[0.08] focus:border-pacific-cyan text-[16px] sm:text-sm text-foreground font-mono outline-none transition-colors w-full"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] sm:text-xs font-mono text-muted uppercase">Read Time</label>
                <input
                  type="text"
                  name="readTime"
                  defaultValue={initialData?.readTime || "5 min read"}
                  placeholder="e.g. 5 min read"
                  className="px-3.5 sm:px-4 py-2 sm:py-2.5 min-h-[42px] sm:min-h-[40px] rounded-xl bg-ink-black/60 border border-white/[0.08] focus:border-pacific-cyan text-[16px] sm:text-sm text-foreground outline-none transition-colors w-full"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] sm:text-xs font-mono text-muted uppercase">
                Excerpt <span className="text-muted/50">(Shown in listings and meta)</span>
              </label>
              <textarea
                name="excerpt"
                rows={3}
                defaultValue={initialData?.excerpt || ""}
                placeholder="Brief summary of the article..."
                className="px-3.5 sm:px-4 py-2.5 rounded-xl bg-ink-black/60 border border-white/[0.08] focus:border-pacific-cyan text-[16px] sm:text-sm text-foreground outline-none transition-colors resize-y min-h-[80px] w-full"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] sm:text-xs font-mono text-muted uppercase">
                Author
              </label>
              <input
                type="text"
                name="author"
                defaultValue={initialData?.author || ""}
                placeholder="e.g. Rushan Siddiqui"
                className="px-3.5 sm:px-4 py-2 sm:py-2.5 min-h-[42px] sm:min-h-[40px] rounded-xl bg-ink-black/60 border border-white/[0.08] focus:border-pacific-cyan text-[16px] sm:text-sm text-foreground outline-none transition-colors w-full"
              />
            </div>
          </div>
        </div>

        {/* Accordion 2: Markdown Content */}
        <div className="glass-card rounded-xl sm:rounded-2xl border border-white/[0.08] overflow-hidden transition-colors hover:border-white/[0.12]">
          <button
            type="button"
            onClick={() => toggleSection("markdown")}
            aria-expanded={Boolean(openSections.markdown)}
            aria-controls="section-markdown"
            className="w-full p-3.5 sm:p-5 flex items-center justify-between gap-3 text-left hover:bg-white/[0.02] focus-visible:bg-white/[0.03] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-pacific-cyan/50 transition-colors cursor-pointer select-none"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-white/[0.04] border border-white/[0.08] flex items-center justify-center shrink-0">
                <Edit3 className="w-4 h-4 text-pacific-cyan" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-xs sm:text-sm font-mono uppercase tracking-wider font-semibold text-foreground truncate">
                  Markdown Content
                </span>
                <span className="text-[10px] sm:text-[11px] font-mono text-muted/60 truncate">
                  Write and preview the article body
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <span className="text-[10px] font-mono text-muted/40 uppercase hidden sm:inline">
                {openSections.markdown ? "Collapse" : "Expand"}
              </span>
              <ChevronDown
                className={`w-4 h-4 text-muted transition-transform duration-200 ${
                  openSections.markdown ? "rotate-180 text-pacific-cyan" : ""
                }`}
              />
            </div>
          </button>

          <div
            id="section-markdown"
            role="region"
            aria-label="Markdown Content"
            className={openSections.markdown ? "flex flex-col gap-4 p-4 sm:p-6 pt-2 sm:pt-2 border-t border-white/[0.06]" : "hidden"}
          >
            {/* Write / Preview toggle */}
            <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-mono uppercase tracking-wider text-muted">Editor</span>
                <span className="text-red-400 text-xs">*</span>
              </div>

              <div className="flex items-center gap-1 p-1 rounded-lg bg-white/[0.04] border border-white/[0.06]">
                <button
                  type="button"
                  onClick={() => handleTabSwitch("write")}
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-mono font-medium transition-all cursor-pointer ${
                    activeTab === "write"
                      ? "bg-pacific-cyan text-ink-black font-semibold"
                      : "text-muted hover:text-foreground"
                  }`}
                >
                  <Edit3 className="w-3 h-3" />
                  <span>Write</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleTabSwitch("preview")}
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-mono font-medium transition-all cursor-pointer ${
                    activeTab === "preview"
                      ? "bg-pacific-cyan text-ink-black font-semibold"
                      : "text-muted hover:text-foreground"
                  }`}
                >
                  <Eye className="w-3 h-3" />
                  <span>Preview</span>
                </button>
              </div>
            </div>

            <div className={activeTab === "write" ? "flex flex-col gap-2" : "sr-only"}>
              <textarea
                name="content"
                required
                rows={16}
                defaultValue={initialData?.content || ""}
                placeholder={"# Article Title\n\nWrite your thoughts in Markdown here...\n\n## Section Header\n\nCode blocks, lists, and quotes are supported."}
                className="w-full px-3.5 sm:px-4 py-3 rounded-xl bg-ink-black/70 border border-white/[0.08] focus:border-pacific-cyan text-[16px] sm:text-sm text-foreground font-mono leading-relaxed outline-none transition-colors resize-y min-h-[340px]"
              />
            </div>

            <div className={activeTab === "preview" ? "p-4 sm:p-6 rounded-xl bg-ink-black/40 border border-white/[0.06] min-h-[340px] overflow-y-auto max-h-[600px]" : "hidden"}>
              {previewContent.trim() ? (
                <MarkdownRenderer content={previewContent} />
              ) : (
                <p className="text-muted/50 font-mono text-xs italic">Nothing to preview. Switch to Write tab to draft content.</p>
              )}
            </div>
          </div>
        </div>

        {/* Accordion 3: Publishing Controls */}
        <div className="glass-card rounded-xl sm:rounded-2xl border border-white/[0.08] overflow-hidden transition-colors hover:border-white/[0.12]">
          <button
            type="button"
            onClick={() => toggleSection("publishing")}
            aria-expanded={Boolean(openSections.publishing)}
            aria-controls="section-publishing"
            className="w-full p-3.5 sm:p-5 flex items-center justify-between gap-3 text-left hover:bg-white/[0.02] focus-visible:bg-white/[0.03] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-pacific-cyan/50 transition-colors cursor-pointer select-none"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-white/[0.04] border border-white/[0.08] flex items-center justify-center shrink-0">
                <Calendar className="w-4 h-4 text-pacific-cyan" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-xs sm:text-sm font-mono uppercase tracking-wider font-semibold text-foreground truncate">
                  Publishing Controls
                </span>
                <span className="text-[10px] sm:text-[11px] font-mono text-muted/60 truncate">
                  Status, publish date, and featured placement
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <span className="text-[10px] font-mono text-muted/40 uppercase hidden sm:inline">
                {openSections.publishing ? "Collapse" : "Expand"}
              </span>
              <ChevronDown
                className={`w-4 h-4 text-muted transition-transform duration-200 ${
                  openSections.publishing ? "rotate-180 text-pacific-cyan" : ""
                }`}
              />
            </div>
          </button>

          <div
            id="section-publishing"
            role="region"
            aria-label="Publishing Controls"
            className={openSections.publishing ? "flex flex-col gap-4 p-4 sm:p-6 pt-2 sm:pt-2 border-t border-white/[0.06]" : "hidden"}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] sm:text-xs font-mono text-muted uppercase">Publication Status</label>
                <RawinSelect
                  name="status"
                  value={status}
                  onChange={(val) => setStatus(val as BlogPostStatus)}
                  options={BLOG_STATUS_OPTIONS}
                  fontMono
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] sm:text-xs font-mono text-muted uppercase">
                  Published Date &amp; Time
                </label>
                <RawinDateTimeInput
                  name="publishedAt"
                  defaultValue={getDefaultDateInput()}
                />
                <span className="text-[10px] sm:text-[11px] font-mono text-muted/60">
                  IST (Asia/Kolkata, UTC+05:30)
                </span>
              </div>
            </div>

            <div className="pt-3 border-t border-white/[0.08]">
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
                  Feature in Selected Articles
                </span>
              </label>
            </div>
          </div>
        </div>

        {/* Accordion 4: Tags & Cover Image */}
        <div className="glass-card rounded-xl sm:rounded-2xl border border-white/[0.08] overflow-hidden transition-colors hover:border-white/[0.12]">
          <button
            type="button"
            onClick={() => toggleSection("tags")}
            aria-expanded={Boolean(openSections.tags)}
            aria-controls="section-tags"
            className="w-full p-3.5 sm:p-5 flex items-center justify-between gap-3 text-left hover:bg-white/[0.02] focus-visible:bg-white/[0.03] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-pacific-cyan/50 transition-colors cursor-pointer select-none"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-white/[0.04] border border-white/[0.08] flex items-center justify-center shrink-0">
                <Tag className="w-4 h-4 text-pacific-cyan" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-xs sm:text-sm font-mono uppercase tracking-wider font-semibold text-foreground truncate">
                  Tags &amp; Cover Image
                </span>
                <span className="text-[10px] sm:text-[11px] font-mono text-muted/60 truncate">
                  Tags, cover image, replacement, and removal
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <span className="text-[10px] font-mono text-muted/40 uppercase hidden sm:inline">
                {openSections.tags ? "Collapse" : "Expand"}
              </span>
              <ChevronDown
                className={`w-4 h-4 text-muted transition-transform duration-200 ${
                  openSections.tags ? "rotate-180 text-pacific-cyan" : ""
                }`}
              />
            </div>
          </button>

          <div
            id="section-tags"
            role="region"
            aria-label="Tags and Cover Image"
            className={openSections.tags ? "flex flex-col gap-4 p-4 sm:p-6 pt-2 sm:pt-2 border-t border-white/[0.06]" : "hidden"}
          >
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] sm:text-xs font-mono text-muted uppercase">Tags (comma separated)</label>
              <input
                type="text"
                name="tags"
                defaultValue={initialData?.tags.join(", ") || ""}
                placeholder="Next.js, TypeScript, Architecture"
                className="px-3.5 sm:px-4 py-2 sm:py-2.5 min-h-[42px] sm:min-h-[40px] rounded-xl bg-ink-black/60 border border-white/[0.08] focus:border-pacific-cyan text-[16px] sm:text-sm text-foreground outline-none transition-colors w-full"
              />
            </div>

            <BlogCoverUpload
              postId={isEditing && initialData?._id ? initialData._id : undefined}
              currentCoverUrl={initialData?.coverImage || ""}
            />
          </div>
        </div>
      </div>
    </form>
  );
}
