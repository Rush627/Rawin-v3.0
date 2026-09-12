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
    <div className="flex flex-col gap-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/[0.08]">
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
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-mono font-semibold bg-pacific-cyan text-ink-black hover:bg-pacific-cyan/90 transition-all shadow-[0_0_20px_rgba(24,155,173,0.35)] self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>New Article</span>
        </Link>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="glass-card rounded-2xl p-5 border border-white/[0.08] flex flex-col justify-between gap-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono text-muted uppercase">Total Articles</span>
            <FileText className="w-4 h-4 text-pacific-cyan" />
          </div>
          <span className="text-2xl font-bold font-space text-foreground">{totalCount}</span>
          <span className="text-[10px] font-mono text-muted/60">In MongoDB collection</span>
        </div>

        <div className="glass-card rounded-2xl p-5 border border-white/[0.08] flex flex-col justify-between gap-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono text-muted uppercase">Published</span>
            <Eye className="w-4 h-4 text-emerald-400" />
          </div>
          <span className="text-2xl font-bold font-space text-emerald-400">{publishedCount}</span>
          <span className="text-[10px] font-mono text-muted/60">Live on public website</span>
        </div>

        <div className="glass-card rounded-2xl p-5 border border-white/[0.08] flex flex-col justify-between gap-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono text-muted uppercase">Drafts</span>
            <Layers className="w-4 h-4 text-amber-400" />
          </div>
          <span className="text-2xl font-bold font-space text-amber-400">{draftsCount}</span>
          <span className="text-[10px] font-mono text-muted/60">Private in-progress</span>
        </div>

        <div className="glass-card rounded-2xl p-5 border border-white/[0.08] flex flex-col justify-between gap-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono text-muted uppercase">Archived</span>
            <Archive className="w-4 h-4 text-muted" />
          </div>
          <span className="text-2xl font-bold font-space text-foreground">{archivedCount}</span>
          <span className="text-[10px] font-mono text-muted/60">Unlisted history</span>
        </div>

        <div className="glass-card rounded-2xl p-5 border border-white/[0.08] flex flex-col justify-between gap-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono text-muted uppercase">Featured</span>
            <Star className="w-4 h-4 text-apricot-cream" />
          </div>
          <span className="text-2xl font-bold font-space text-apricot-cream">{featuredCount}</span>
          <span className="text-[10px] font-mono text-muted/60">Highlighted articles</span>
        </div>
      </div>

      {/* Interactive Blog Management Table */}
      <BlogTable posts={posts} />
    </div>
  );
}
