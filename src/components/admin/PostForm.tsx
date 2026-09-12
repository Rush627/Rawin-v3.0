"use client";

import { useActionState, useState } from "react";
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
  Clock,
  Tag,
  CheckCircle2,
  Sparkles,
  Check,
} from "lucide-react";
import type { BlogPost, BlogPostStatus } from "@/lib/blog";
import MarkdownRenderer from "@/components/MarkdownRenderer";
import RawinSelect from "./RawinSelect";
import RawinDateTimeInput from "./RawinDateTimeInput";
import BlogCoverUpload from "./BlogCoverUpload";
import { toKolkataDateTimeInput } from "@/lib/dateUtils";

const BLOG_STATUS_OPTIONS = [
  { value: "draft", label: "Draft (Private, not public)" },
  { value: "published", label: "Published (Live to readers)" },
  { value: "archived", label: "Archived (Unlisted)" },
];

interface PostFormProps {
  initialData?: BlogPost | null;
  action: (prevState: { error?: string } | null, formData: FormData) => Promise<{ error?: string }>;
  isEditing?: boolean;
}

export default function PostForm({ initialData, action, isEditing = false }: PostFormProps) {
  const [state, formAction, isPending] = useActionState(action, {});

  // Local state for interactive editing and live Markdown preview
  const [previewContent, setPreviewContent] = useState(initialData?.content || "");
  const [status, setStatus] = useState<BlogPostStatus>(initialData?.status || "draft");
  const [featured, setFeatured] = useState<boolean>(initialData?.featured ?? false);
  const [activeTab, setActiveTab] = useState<"write" | "preview">("write");

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

  function slugify(text: string): string {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/[\s_-]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  // Format date for date-time input in Asia/Kolkata timezone (IST, UTC+05:30)
  const getDefaultDateInput = () => {
    if (initialData?.publishedAt) {
      return toKolkataDateTimeInput(initialData.publishedAt);
    }
    return toKolkataDateTimeInput(new Date());
  };

  return (
    <form id="post-form" action={formAction} className="flex flex-col gap-8">
      {/* Top action bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/[0.08]">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/blog"
            className="p-2 rounded-xl text-muted hover:text-foreground bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] transition-all"
            title="Return to Blog Posts List"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground font-space">
              {isEditing ? `Edit: ${initialData?.title}` : "Write New Article"}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-3 self-end sm:self-auto">
          <Link
            href="/admin/blog"
            className="inline-flex items-center justify-center h-10 px-5 rounded-xl text-xs font-mono font-medium text-muted hover:text-foreground bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] hover:border-white/20 transition-all cursor-pointer select-none whitespace-nowrap"
          >
            Cancel
          </Link>
          <button
            id="post-submit-btn"
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
                <span>{isEditing ? "Save Changes" : status === "published" ? "Publish Article" : "Save Draft"}</span>
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

      {/* Form sections grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Columns: Title, Excerpt, and Markdown Editor */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          {/* Identity Card */}
          <div className="glass-card rounded-2xl p-6 sm:p-8 border border-white/[0.08] flex flex-col gap-5">
            <h2 className="text-sm font-mono uppercase tracking-wider text-pacific-cyan flex items-center gap-2">
              <FileText className="w-4 h-4" />
              <span>Article Details</span>
            </h2>

            <div className="flex flex-col gap-2">
              <label className="text-xs font-mono text-muted uppercase">
                Article Title <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                name="title"
                required
                defaultValue={initialData?.title || ""}
                placeholder="e.g. Building Fast Web Applications with Next.js and TypeScript"
                className="px-4 py-2.5 rounded-xl bg-ink-black/60 border border-white/[0.08] focus:border-pacific-cyan text-sm text-foreground outline-none transition-colors"
              />
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
                  placeholder="e.g. building-fast-web-applications"
                  className="px-4 py-2.5 rounded-xl bg-ink-black/60 border border-white/[0.08] focus:border-pacific-cyan text-sm text-foreground font-mono outline-none transition-colors"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs font-mono text-muted uppercase">Read Time</label>
                <input
                  type="text"
                  name="readTime"
                  defaultValue={initialData?.readTime || "5 min read"}
                  placeholder="e.g. 5 min read"
                  className="px-4 py-2.5 rounded-xl bg-ink-black/60 border border-white/[0.08] focus:border-pacific-cyan text-sm text-foreground outline-none transition-colors"
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs font-mono text-muted uppercase">
                Excerpt / Summary <span className="text-muted/50">(Shown in listings & SEO)</span>
              </label>
              <textarea
                name="excerpt"
                rows={3}
                defaultValue={initialData?.excerpt || ""}
                placeholder="Brief summary of the article..."
                className="px-4 py-2.5 rounded-xl bg-ink-black/60 border border-white/[0.08] focus:border-pacific-cyan text-sm text-foreground outline-none transition-colors resize-y"
              />
            </div>
          </div>

          {/* Markdown Content Editor Card */}
          <div className="glass-card rounded-2xl p-6 sm:p-8 border border-white/[0.08] flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
              <div className="flex items-center gap-2">
                <span className="text-sm font-mono uppercase tracking-wider text-pacific-cyan">Markdown Content</span>
                <span className="text-red-400 text-xs">*</span>
              </div>

              {/* Write vs Preview tab toggle */}
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
                rows={18}
                defaultValue={initialData?.content || ""}
                placeholder="# Article Title&#10;&#10;Write your technical thoughts in Markdown here...&#10;&#10;## Section Header&#10;&#10;Code blocks, lists, and quotes are supported."
                className="w-full px-4 py-3 rounded-xl bg-ink-black/70 border border-white/[0.08] focus:border-pacific-cyan text-xs sm:text-sm text-foreground font-mono leading-relaxed outline-none transition-colors resize-y min-h-[380px]"
              />
              <span className="text-[11px] font-mono text-muted/60">
                Full GitHub-Flavored Markdown supported: headers (#), bold (**), lists (-), code blocks (```), blockquotes (&gt;), tables.
              </span>
            </div>

            <div className={activeTab === "preview" ? "p-6 rounded-xl bg-ink-black/40 border border-white/[0.06] min-h-[380px] overflow-y-auto max-h-[600px]" : "hidden"}>
              {previewContent.trim() ? (
                <MarkdownRenderer content={previewContent} />
              ) : (
                <p className="text-muted/50 font-mono text-xs italic">Nothing to preview yet. Switch to the Write tab to start drafting.</p>
              )}
            </div>
          </div>
        </div>

        {/* Right 1 Column: Publishing, Meta, Image, Tags */}
        <div className="flex flex-col gap-6">
          {/* Card 3: Status & Visibility */}
          <div className="glass-card rounded-2xl p-6 sm:p-8 border border-white/[0.08] flex flex-col gap-5">
            <h2 className="text-sm font-mono uppercase tracking-wider text-pacific-cyan">Publishing Controls</h2>

            <div className="flex flex-col gap-2">
              <label className="text-xs font-mono text-muted uppercase">Publication Status</label>
              <RawinSelect
                name="status"
                value={status}
                onChange={(val) => setStatus(val as BlogPostStatus)}
                options={BLOG_STATUS_OPTIONS}
                fontMono
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs font-mono text-muted uppercase">
                Published Date &amp; Time <span className="text-pacific-cyan text-[10px] ml-1 font-normal">IST (UTC+05:30)</span>
              </label>
              <RawinDateTimeInput
                name="publishedAt"
                defaultValue={getDefaultDateInput()}
              />
              <span className="text-[11px] font-mono text-muted/60">
                Asia/Kolkata timezone. Defaults to current IST time for new articles.
              </span>
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
                  Feature in Selected Articles
                </span>
              </label>
            </div>
          </div>

          {/* Card 4: Tags & Classification */}
          <div className="glass-card rounded-2xl p-6 sm:p-8 border border-white/[0.08] flex flex-col gap-4">
            <h2 className="text-sm font-mono uppercase tracking-wider text-pacific-cyan">Tags</h2>

            <div className="flex flex-col gap-2">
              <label className="text-xs font-mono text-muted uppercase">Tags (comma separated)</label>
              <input
                type="text"
                name="tags"
                defaultValue={initialData?.tags.join(", ") || ""}
                placeholder="Next.js, TypeScript, Architecture"
                className="px-4 py-2.5 rounded-xl bg-ink-black/60 border border-white/[0.08] focus:border-pacific-cyan text-sm text-foreground outline-none transition-colors"
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
