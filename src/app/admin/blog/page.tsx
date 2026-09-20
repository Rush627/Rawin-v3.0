import Link from "next/link";
import { redirect } from "next/navigation";
import {
  FileText,
  Plus,
  BookOpen,
  Eye,
  Archive,
  Star,
  Layers,
  ArrowLeft,
} from "lucide-react";
import { getAdminSession } from "@/lib/auth";
import { getAllPostsAdmin } from "@/lib/blog";
import BlogTable from "@/components/admin/BlogTable";

export const metadata = {
  title: "Blog CMS | RAWIN Admin",
  description: "Manage technical articles, drafts, and publication status.",
};

export default async function AdminBlogPage() {
  const session = await getAdminSession();
  if (!session) {
    redirect("/admin/login?redirect=/admin/blog");
  }

  const posts = await getAllPostsAdmin();

  const totalCount = posts.length;
  const publishedCount = posts.filter((p) => p.status === "published").length;
  const draftsCount = posts.filter((p) => p.status === "draft").length;
  const archivedCount = posts.filter((p) => p.status === "archived").length;
  const featuredCount = posts.filter((p) => p.featured && p.status === "published").length;

  return (
    <div className="flex flex-col gap-6 sm:gap-8">
      {/* Smartphone Header (< sm) */}
      <div className="flex sm:hidden flex-col gap-3 pb-5 border-b border-white/[0.08]">
        {/* Dominant Page Heading */}
        <h1 className="text-3xl font-bold tracking-tight text-foreground font-space">
          Blog
        </h1>

        {/* Lower Controls Area */}
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex items-center gap-2 min-w-0">
            <Link
              href="/admin"
              className="p-2 rounded-xl text-muted hover:text-foreground bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] transition-all cursor-pointer shrink-0"
              title="Return to Main Admin Dashboard"
              aria-label="Return to Main Admin Dashboard"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>

            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono font-medium glass-pill text-pacific-cyan border border-pacific-cyan/20 truncate">
              <BookOpen className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">EDITORIAL CMS ACTIVE</span>
            </div>
          </div>

          <Link
            href="/admin/blog/new"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-mono font-semibold bg-pacific-cyan text-ink-black hover:bg-pacific-cyan/90 transition-all shadow-[0_0_20px_rgba(24,155,173,0.35)] cursor-pointer shrink-0 ml-auto"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Article</span>
          </Link>
        </div>
      </div>

      {/* Desktop Header (sm and up) */}
      <div className="hidden sm:flex sm:items-center justify-between gap-4 pb-6 border-b border-white/[0.08]">
        <div className="flex items-center gap-3">
          <Link
            href="/admin"
            className="p-2 rounded-xl text-muted hover:text-foreground bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] transition-all"
            title="Return to Main Admin Dashboard"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-medium glass-pill text-pacific-cyan w-fit mb-1 border border-pacific-cyan/20">
              <BookOpen className="w-3 h-3" />
              <span>EDITORIAL CMS ACTIVE</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground font-space">
              Blog
            </h1>
          </div>
        </div>

        <Link
          href="/admin/blog/new"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-mono font-semibold bg-pacific-cyan text-ink-black hover:bg-pacific-cyan/90 transition-all shadow-[0_0_20px_rgba(24,155,173,0.35)] cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>New Article</span>
        </Link>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 sm:gap-4">
        <div className="glass-card rounded-xl sm:rounded-2xl p-3.5 sm:p-5 border border-white/[0.08] flex flex-col justify-between gap-1.5 sm:gap-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-[11px] font-mono text-muted uppercase">Total Articles</span>
            <FileText className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-pacific-cyan" />
          </div>
          <span className="text-xl sm:text-2xl font-bold font-space text-foreground">{totalCount}</span>
        </div>

        <div className="glass-card rounded-xl sm:rounded-2xl p-3.5 sm:p-5 border border-white/[0.08] flex flex-col justify-between gap-1.5 sm:gap-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-[11px] font-mono text-muted uppercase">Published</span>
            <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400" />
          </div>
          <span className="text-xl sm:text-2xl font-bold font-space text-emerald-400">{publishedCount}</span>
        </div>

        <div className="glass-card rounded-xl sm:rounded-2xl p-3.5 sm:p-5 border border-white/[0.08] flex flex-col justify-between gap-1.5 sm:gap-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-[11px] font-mono text-muted uppercase">Drafts</span>
            <Layers className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400" />
          </div>
          <span className="text-xl sm:text-2xl font-bold font-space text-amber-400">{draftsCount}</span>
        </div>

        <div className="glass-card rounded-xl sm:rounded-2xl p-3.5 sm:p-5 border border-white/[0.08] flex flex-col justify-between gap-1.5 sm:gap-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-[11px] font-mono text-muted uppercase">Archived</span>
            <Archive className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-muted" />
          </div>
          <span className="text-xl sm:text-2xl font-bold font-space text-foreground">{archivedCount}</span>
        </div>

        <div className="glass-card rounded-xl sm:rounded-2xl p-3.5 sm:p-5 border border-white/[0.08] flex flex-col justify-between gap-1.5 sm:gap-2 col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-[11px] font-mono text-muted uppercase">Featured</span>
            <Star className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-apricot-cream" />
          </div>
          <span className="text-xl sm:text-2xl font-bold font-space text-apricot-cream">{featuredCount}</span>
        </div>
      </div>

      {/* Interactive Blog Management Table */}
      <BlogTable posts={posts} />
    </div>
  );
}
