"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  FileText,
  Star,
  Edit3,
  Trash2,
  Calendar,
  Clock,
  AlertTriangle,
  Loader2,
  ExternalLink,
  Archive,
  Send,
  Eye,
} from "lucide-react";
import type { BlogPost, BlogPostStatus } from "@/lib/blog";
import { togglePostFeaturedAction, deletePostAction, setPostStatusAction } from "@/app/admin/blog/actions";
import RawinSelect from "./RawinSelect";

const TABLE_STATUS_OPTIONS = [
  { value: "published", label: "Publish" },
  { value: "draft", label: "Draft" },
  { value: "archived", label: "Archive" },
];

interface BlogTableProps {
  posts: BlogPost[];
}

function StatusBadge({ status }: { status: BlogPostStatus }) {
  if (status === "published") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
        <span>PUBLISHED</span>
      </span>
    );
  }
  if (status === "draft") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
        <span>DRAFT</span>
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-medium bg-white/[0.05] text-muted border border-white/[0.1]">
      <Archive className="w-3 h-3 text-muted" />
      <span>ARCHIVED</span>
    </span>
  );
}

export default function BlogTable({ posts }: BlogTableProps) {
  const [filter, setFilter] = useState<"all" | BlogPostStatus>("all");
  const [postToDelete, setPostToDelete] = useState<BlogPost | null>(null);
  const [isPending, startTransition] = useTransition();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const filteredPosts = filter === "all"
    ? posts
    : posts.filter((p) => p.status === filter);

  const handleToggleFeatured = (post: BlogPost) => {
    if (!post._id) return;
    startTransition(async () => {
      try {
        await togglePostFeaturedAction(post._id!, post.featured);
      } catch (err: unknown) {
        setErrorMessage(err instanceof Error ? err.message : "Failed to toggle featured state.");
      }
    });
  };

  const handleStatusChange = (post: BlogPost, newStatus: BlogPostStatus) => {
    if (!post._id || post.status === newStatus) return;
    startTransition(async () => {
      try {
        await setPostStatusAction(post._id!, newStatus);
      } catch (err: unknown) {
        setErrorMessage(err instanceof Error ? err.message : "Failed to change status.");
      }
    });
  };

  const handleDeleteConfirm = () => {
    if (!postToDelete?._id) return;
    startTransition(async () => {
      try {
        await deletePostAction(postToDelete._id!);
        setPostToDelete(null);
      } catch (err: unknown) {
        setErrorMessage(err instanceof Error ? err.message : "Failed to delete post.");
      }
    });
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "Not set";
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString("en-US", {
        timeZone: "Asia/Kolkata",
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Top Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2 p-1 rounded-xl bg-white/[0.03] border border-white/[0.06] w-fit">
          {(["all", "published", "draft", "archived"] as const).map((tab) => {
            const count = tab === "all"
              ? posts.length
              : posts.filter((p) => p.status === tab).length;

            return (
              <button
                key={tab}
                onClick={() => setFilter(tab)}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-all cursor-pointer ${
                  filter === tab
                    ? "bg-pacific-cyan text-ink-black font-semibold shadow-sm"
                    : "text-muted hover:text-foreground"
                }`}
              >
                {tab.toUpperCase()} ({count})
              </button>
            );
          })}
        </div>

        <div className="text-xs font-mono text-muted">
          Showing {filteredPosts.length} of {posts.length} articles
        </div>
      </div>

      {/* Error alert */}
      {errorMessage && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-xs font-mono flex items-center justify-between gap-3">
          <span>{errorMessage}</span>
          <button onClick={() => setErrorMessage(null)} className="underline cursor-pointer">
            Dismiss
          </button>
        </div>
      )}

      {/* Table / Empty State */}
      {filteredPosts.length === 0 ? (
        <div className="glass-card rounded-2xl p-12 text-center border border-white/[0.08] flex flex-col items-center gap-4">
          <FileText className="w-8 h-8 text-muted/40" />
          <p className="text-muted text-sm font-mono">No articles found in this view.</p>
          <Link
            href="/admin/blog/new"
            className="px-4 py-2 rounded-xl bg-pacific-cyan text-ink-black text-xs font-mono font-semibold"
          >
            New Article
          </Link>
        </div>
      ) : (
        <div className="glass-card rounded-2xl border border-white/[0.08] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-white/[0.02] border-b border-white/[0.06] text-muted/70 uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="px-5 py-3.5">Article</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-center">Featured</th>
                  <th className="px-5 py-3.5">Published Date</th>
                  <th className="px-5 py-3.5">Tags</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {filteredPosts.map((post) => (
                  <tr key={post._id || post.slug} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-5 py-4 max-w-sm">
                      <div className="flex flex-col gap-1">
                        <span className="text-sm font-bold font-space text-foreground line-clamp-1">
                          {post.title}
                        </span>
                        <div className="flex items-center gap-2 text-[11px] text-muted">
                          <span className="font-mono text-pacific-cyan/80">/{post.slug}</span>
                          <span className="text-white/20">•</span>
                          <span>{post.readTime}</span>
                        </div>
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <StatusBadge status={post.status} />
                        <RawinSelect
                          name={`status-${post._id}`}
                          value={post.status}
                          onChange={(val) => handleStatusChange(post, val as BlogPostStatus)}
                          options={TABLE_STATUS_OPTIONS}
                          size="sm"
                          fontMono
                          disabled={isPending}
                        />
                      </div>
                    </td>

                    <td className="px-5 py-4 text-center">
                      <button
                        onClick={() => handleToggleFeatured(post)}
                        disabled={isPending}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-mono font-semibold transition-all cursor-pointer ${
                          post.featured
                            ? "bg-pacific-cyan/15 text-pacific-cyan border border-pacific-cyan/30 hover:bg-pacific-cyan/25"
                            : "bg-white/[0.03] text-muted/50 border border-white/[0.06] hover:text-muted"
                        }`}
                        title={post.featured ? "Remove from featured" : "Feature post"}
                      >
                        <Star className={`w-3 h-3 ${post.featured ? "fill-pacific-cyan" : ""}`} />
                        <span>{post.featured ? "Featured" : "Normal"}</span>
                      </button>
                    </td>

                    <td className="px-5 py-4 text-muted/80 whitespace-nowrap">
                      {formatDate(post.publishedAt)}
                    </td>

                    <td className="px-5 py-4 max-w-xs">
                      <div className="flex flex-wrap gap-1">
                        {post.tags.slice(0, 3).map((tag) => (
                          <span
                            key={tag}
                            className="px-2 py-0.5 rounded text-[10px] bg-white/[0.03] text-muted/80 border border-white/[0.05]"
                          >
                            #{tag}
                          </span>
                        ))}
                        {post.tags.length > 3 && (
                          <span className="text-[10px] text-muted/40 font-mono">
                            +{post.tags.length - 3}
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {post.status === "published" && (
                          <Link
                            href={`/blog/${post.slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-lg bg-white/[0.03] hover:bg-white/[0.06] text-muted hover:text-pacific-cyan transition-colors"
                            title="View public post"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </Link>
                        )}
                        <Link
                          href={`/admin/blog/${post._id}`}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-foreground text-xs font-mono transition-colors"
                          title="Edit post"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Edit</span>
                        </Link>
                        <button
                          onClick={() => setPostToDelete(post)}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-mono transition-colors cursor-pointer"
                          title="Delete post"
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
      )}

      {/* Delete Confirmation Modal */}
      {postToDelete && (
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
                {postToDelete.title}
              </strong>? It will be removed from your blog.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2 border-t border-white/[0.08]">
              <button
                type="button"
                onClick={() => setPostToDelete(null)}
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
                  <span>Delete Post</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
