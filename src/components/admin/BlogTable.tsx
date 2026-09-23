"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  FileText,
  Star,
  Edit3,
  Trash2,
  Calendar,
  AlertTriangle,
  Loader2,
  Archive,
  Eye,
} from "lucide-react";
import type { BlogPost, BlogPostStatus } from "@/lib/blog";
import { togglePostFeaturedAction, deletePostAction, setPostStatusAction } from "@/app/saint-denis/blog/actions";
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
  const [localPosts, setLocalPosts] = useState<BlogPost[]>(posts);
  const [filter, setFilter] = useState<"all" | BlogPostStatus>("all");
  const [postToDelete, setPostToDelete] = useState<BlogPost | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [changingStatusId, setChangingStatusId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Sync if parent passes updated posts
  useEffect(() => {
    setLocalPosts(posts);
  }, [posts]);

  const filteredPosts = filter === "all"
    ? localPosts
    : localPosts.filter((p) => p.status === filter);

  const handleToggleFeatured = async (post: BlogPost) => {
    if (!post._id) return;
    const prevFeatured = post.featured;
    const targetId = post._id;

    // Optimistic update immediately
    setLocalPosts((prev) =>
      prev.map((p) => (p._id === targetId ? { ...p, featured: !prevFeatured } : p))
    );
    setTogglingId(targetId);

    try {
      await togglePostFeaturedAction(targetId, prevFeatured);
    } catch (err: unknown) {
      // Revert on error
      setLocalPosts((prev) =>
        prev.map((p) => (p._id === targetId ? { ...p, featured: prevFeatured } : p))
      );
      setErrorMessage(err instanceof Error ? err.message : "Failed to toggle featured state.");
    } finally {
      setTogglingId(null);
    }
  };

  const handleStatusChange = async (post: BlogPost, newStatus: BlogPostStatus) => {
    if (!post._id || post.status === newStatus) return;
    const prevStatus = post.status;
    const targetId = post._id;

    // Optimistic update immediately
    setLocalPosts((prev) =>
      prev.map((p) => (p._id === targetId ? { ...p, status: newStatus } : p))
    );
    setChangingStatusId(targetId);

    try {
      await setPostStatusAction(targetId, newStatus);
    } catch (err: unknown) {
      // Revert on error
      setLocalPosts((prev) =>
        prev.map((p) => (p._id === targetId ? { ...p, status: prevStatus } : p))
      );
      setErrorMessage(err instanceof Error ? err.message : "Failed to change status.");
    } finally {
      setChangingStatusId(null);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!postToDelete?._id) return;
    const targetId = postToDelete._id;
    setIsDeleting(true);

    try {
      await deletePostAction(targetId);
      // Optimistically remove from list
      setLocalPosts((prev) => prev.filter((p) => p._id !== targetId));
      setPostToDelete(null);
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : "Failed to delete post.");
    } finally {
      setIsDeleting(false);
    }
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

  // Filter tab labels: full on sm+, abbreviated on xs to avoid truncation at 320px
  const FILTER_TABS: Array<{ key: "all" | BlogPostStatus; full: string; short: string }> = [
    { key: "all", full: "ALL", short: "ALL" },
    { key: "published", full: "PUBLISHED", short: "PUB" },
    { key: "draft", full: "DRAFT", short: "DRAFT" },
    { key: "archived", full: "ARCHIVED", short: "ARCH" },
  ];

  return (
    <div className="flex flex-col gap-5">
      {/* Top Filter Bar */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <div className="w-full sm:w-auto grid grid-cols-4 sm:flex items-center gap-1 p-1 rounded-xl bg-white/[0.03] border border-white/[0.06]">
          {FILTER_TABS.map(({ key, full, short }) => {
            const count = key === "all"
              ? localPosts.length
              : localPosts.filter((p) => p.status === key).length;

            return (
              <button
                key={key}
                onClick={() => setFilter(key)}
                className={`px-1 sm:px-3 py-1.5 rounded-lg text-[10px] sm:text-xs font-mono font-medium transition-all cursor-pointer text-center flex items-center justify-center gap-0.5 sm:gap-1 ${
                  filter === key
                    ? "bg-pacific-cyan text-ink-black font-semibold shadow-sm"
                    : "text-muted hover:text-foreground"
                }`}
              >
                <span className="hidden sm:inline">{full}</span>
                <span className="sm:hidden">{short}</span>
                <span className="text-[9px] sm:text-[10px] opacity-80 shrink-0">({count})</span>
              </button>
            );
          })}
        </div>

        <div className="text-[11px] sm:text-xs font-mono text-muted">
          Showing {filteredPosts.length} of {localPosts.length} articles
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
            href="/saint-denis/blog/new"
            className="px-4 py-2 rounded-xl bg-pacific-cyan text-ink-black text-xs font-mono font-semibold"
          >
            New Article
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
                            disabled={changingStatusId === post._id}
                          />
                        </div>
                      </td>

                      <td className="px-5 py-4 text-center">
                        <button
                          onClick={() => handleToggleFeatured(post)}
                          disabled={togglingId === post._id}
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
                            href={`/saint-denis/blog/${post._id}`}
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

          {/* Smartphone Card List View (< 768px) */}
          {/*
            IMPORTANT: These cards intentionally do NOT use the `glass-card` CSS class.
            `glass-card` applies backdrop-filter: blur(10px) and a hover transform, both of
            which create a CSS stacking context on the card element. This traps absolutely-
            positioned children (the RawinSelect dropdown) inside the card's stacking context,
            preventing the dropdown from rendering above neighboring cards regardless of z-index.
            By using explicit background/border styles without backdrop-filter or transform,
            the dropdown correctly escapes the card and renders above all sibling cards.
          */}
          <div className="flex md:hidden flex-col gap-3">
            {filteredPosts.map((post) => (
              <div
                key={post._id || post.slug}
                className="rounded-xl p-4 border border-white/[0.08] flex flex-col gap-0 bg-[rgba(22,22,34,0.5)] hover:border-white/[0.14] transition-colors"
              >
                {/* Article Title + Slug + Read Time */}
                <div className="flex flex-col min-w-0 pb-3">
                  <h2 className="text-sm font-bold font-space text-foreground leading-snug break-words">
                    {post.title}
                  </h2>
                  <div className="flex items-center gap-2 text-[11px] text-muted flex-wrap mt-1">
                    <span className="font-mono text-pacific-cyan/80 break-all">
                      /{post.slug}
                    </span>
                    <span className="text-white/20">•</span>
                    <span className="shrink-0">{post.readTime}</span>
                  </div>
                </div>

                {/* Status Badge, Featured, Date */}
                <div className="flex items-center justify-between gap-2 flex-wrap text-[11px] font-mono pb-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <StatusBadge status={post.status} />
                    <button
                      type="button"
                      onClick={() => handleToggleFeatured(post)}
                      disabled={togglingId === post._id}
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold transition-all cursor-pointer ${
                        post.featured
                          ? "bg-pacific-cyan/15 text-pacific-cyan border border-pacific-cyan/30"
                          : "bg-white/[0.03] text-muted/50 border border-white/[0.06] hover:text-muted"
                      }`}
                      title={post.featured ? "Remove from featured" : "Feature article"}
                    >
                      <Star className={`w-3 h-3 ${post.featured ? "fill-pacific-cyan" : ""}`} />
                      <span>{post.featured ? "Featured" : "Normal"}</span>
                    </button>
                  </div>

                  <span className="text-[10px] font-mono text-muted/70 flex items-center gap-1 shrink-0">
                    <Calendar className="w-3 h-3 text-muted/50" />
                    <span>{formatDate(post.publishedAt)}</span>
                  </span>
                </div>

                {/* Tags */}
                {post.tags && post.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 pb-3">
                    {post.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-0.5 rounded text-[10px] font-mono bg-white/[0.03] text-muted/80 border border-white/[0.05]"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* Status Selector row -- separate from action buttons */}
                <div className="pt-3 border-t border-white/[0.06] pb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono text-muted/60 uppercase shrink-0">Status</span>
                    <RawinSelect
                      name={`status-mobile-${post._id}`}
                      value={post.status}
                      onChange={(val) => handleStatusChange(post, val as BlogPostStatus)}
                      options={TABLE_STATUS_OPTIONS}
                      size="sm"
                      fontMono
                      disabled={changingStatusId === post._id}
                    />
                  </div>
                </div>

                {/* Action Buttons row -- View, Edit, Delete */}
                <div className="pt-0 border-t border-white/[0.06]">
                  <div className="flex items-center gap-2.5 pt-3">
                    {/* View -- only shown for published articles */}
                    {post.status === "published" ? (
                      <Link
                        href={`/blog/${post.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-muted hover:text-pacific-cyan text-xs font-mono transition-colors min-h-[36px] border border-white/[0.06]"
                        title="View public article"
                        aria-label={`View public article ${post.title}`}
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>View</span>
                      </Link>
                    ) : (
                      // Placeholder to keep Edit/Delete positioned consistently
                      <div className="flex-1" />
                    )}

                    {/* Edit -- primary cyan action */}
                    <Link
                      href={`/saint-denis/blog/${post._id}`}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-pacific-cyan text-ink-black text-xs font-mono font-semibold hover:bg-pacific-cyan/90 transition-all shadow-[0_0_10px_rgba(24,155,173,0.2)] min-h-[36px]"
                      title="Edit article"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </Link>

                    {/* Delete -- destructive */}
                    <button
                      type="button"
                      onClick={() => setPostToDelete(post)}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-mono transition-colors cursor-pointer min-h-[36px] border border-red-500/15"
                      title="Delete article"
                      aria-label={`Delete article ${post.title}`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
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
                disabled={isDeleting}
                className="inline-flex items-center justify-center h-9 px-4 rounded-xl text-xs font-mono font-medium text-muted hover:text-foreground bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] hover:border-white/20 transition-all cursor-pointer select-none"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                disabled={isDeleting}
                className="inline-flex items-center justify-center gap-2 h-9 px-5 rounded-xl text-xs font-mono font-semibold bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/30 transition-all cursor-pointer select-none whitespace-nowrap"
              >
                {isDeleting ? (
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
