"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  FileText,
  Star,
  Edit3,
  Trash2,
  Calendar,
  Archive,
  Eye,
  ChevronDown,
  Loader2,
} from "lucide-react";
import type { BlogPost, BlogPostStatus } from "@/lib/blog";
import { togglePostFeaturedAction, deletePostAction, setPostStatusAction } from "@/app/saint-denis/blog/actions";
import RawinSelect from "./RawinSelect";
import ConfirmDialog from "@/components/studio/ConfirmDialog";
import { FilterSegment } from "@/components/studio/filters";

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
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-medium bg-success/10 text-success border border-success/20">
        <span className="w-1.5 h-1.5 rounded-full bg-success" />
        <span>PUBLISHED</span>
      </span>
    );
  }
  if (status === "draft") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-medium bg-warning/10 text-warning border border-warning/20">
        <span className="w-1.5 h-1.5 rounded-full bg-warning" />
        <span>DRAFT</span>
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-medium bg-surface-2 text-fg-muted border border-line">
      <Archive className="w-3 h-3 text-fg-muted" />
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

    // The new status is shown only once the server has saved it (the control shows it is busy)
    setChangingStatusId(targetId);

    try {
      await setPostStatusAction(targetId, newStatus);
      setLocalPosts((prev) =>
        prev.map((p) => (p._id === targetId ? { ...p, status: newStatus } : p))
      );
    } catch (err: unknown) {
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

  // Filter labels: full from 640px, abbreviated on phones so four fit at 320px
  const FILTER_TABS: Array<{ key: "all" | BlogPostStatus; full: string; short: string }> = [
    { key: "all", full: "All", short: "All" },
    { key: "published", full: "Published", short: "Pub." },
    { key: "draft", full: "Draft", short: "Draft" },
    { key: "archived", full: "Archived", short: "Arch." },
  ];

  return (
    <div className="flex flex-col gap-5">
      {/* Status filter: one shared segmented control (short labels on phones) */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <FilterSegment
          label="Show articles"
          value={filter}
          onChange={setFilter}
          stretch
          options={FILTER_TABS.map(({ key, full, short }) => ({
            value: key,
            label: full,
            short,
            count: key === "all" ? localPosts.length : localPosts.filter((p) => p.status === key).length,
          }))}
        />

        <p className="text-[12.5px] text-fg-muted" aria-live="polite">
          Showing {filteredPosts.length} of {localPosts.length} articles
        </p>
      </div>

      {/* Error alert */}
      {errorMessage && (
        <div className="p-4 rounded-xl bg-danger/10 border border-danger/20 text-danger text-xs font-mono flex items-center justify-between gap-3">
          <span>{errorMessage}</span>
          <button onClick={() => setErrorMessage(null)} className="underline cursor-pointer">
            Dismiss
          </button>
        </div>
      )}

      {/* Table / Empty State */}
      {filteredPosts.length === 0 ? (
        <div className="glass-card rounded-2xl p-12 text-center border border-line flex flex-col items-center gap-4">
          <FileText className="w-8 h-8 text-fg-muted/40" />
          <p className="text-fg-muted text-sm font-mono">No articles found in this view.</p>
          <Link
            href="/saint-denis/blog/new"
            className="px-4 py-2 rounded-xl bg-accent text-accent-fg text-xs font-mono font-semibold"
          >
            New Article
          </Link>
        </div>
      ) : (
        <>
          {/* Desktop table (>= 768px). Fixed column layout: each column has a set width and the
              article column takes the rest; below the minimum width the table scrolls inside its
              own frame with Actions pinned, so Delete is never cut off. The status control is a
              native select, so its menu is never clipped by the scrolling frame. */}
          <div className="hidden md:block rounded-2xl border border-line bg-surface overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[920px] table-fixed text-left text-[13px]">
                <caption className="sr-only">Journal articles</caption>
                <colgroup>
                  <col />
                  <col className="w-[156px]" />
                  <col className="w-[108px]" />
                  <col className="w-[120px]" />
                  <col className="w-[160px]" />
                  <col className="w-[184px]" />
                </colgroup>
                <thead className="border-b border-line bg-surface-2">
                  <tr className="label-mono text-fg-subtle">
                    <th scope="col" className="px-4 py-3 font-normal">Article</th>
                    <th scope="col" className="px-4 py-3 font-normal">Status</th>
                    <th scope="col" className="px-4 py-3 font-normal">Featured</th>
                    <th scope="col" className="px-4 py-3 font-normal">Published</th>
                    <th scope="col" className="px-4 py-3 font-normal">Tags</th>
                    <th scope="col" className="sticky right-0 px-4 py-3 font-normal text-right bg-surface-2">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {filteredPosts.map((post) => {
                    const changing = changingStatusId === post._id;
                    const shownTags = post.tags.slice(0, 2);
                    const moreTags = post.tags.slice(2);
                    return (
                      <tr key={post._id || post.slug} className="group hover:bg-surface-2/60 transition-colors">
                        <td className="px-4 py-3.5">
                          <p className="font-medium text-[14.5px] leading-snug text-fg line-clamp-2 break-words" title={post.title}>
                            {post.title}
                          </p>
                          <p className="mt-0.5 flex items-center gap-1.5 min-w-0 text-[12px] text-fg-subtle">
                            <span className="font-mono truncate" title={`/${post.slug}`}>
                              /{post.slug}
                            </span>
                            {post.readTime && (
                              <>
                                <span aria-hidden="true">·</span>
                                <span className="shrink-0 whitespace-nowrap">{post.readTime}</span>
                              </>
                            )}
                          </p>
                        </td>

                        <td className="px-4 py-3.5">
                          <div className="relative">
                            <select
                              value={post.status}
                              disabled={changing}
                              onChange={(e) => handleStatusChange(post, e.target.value as BlogPostStatus)}
                              aria-label={`Status of ${post.title}`}
                              aria-busy={changing || undefined}
                              className={`w-full appearance-none h-9 pl-6 pr-8 rounded-lg border bg-surface text-[13px] outline-none focus-visible:border-accent disabled:opacity-60 disabled:cursor-wait ${
                                post.status === "published"
                                  ? "border-success/30 text-success"
                                  : post.status === "draft"
                                    ? "border-warning/35 text-warning"
                                    : "border-line text-fg-muted"
                              }`}
                            >
                              <option value="published">Published</option>
                              <option value="draft">Draft</option>
                              <option value="archived">Archived</option>
                            </select>
                            <span aria-hidden="true" className={`pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full ${
                              post.status === "published" ? "bg-success" : post.status === "draft" ? "bg-warning" : "bg-fg-subtle"
                            }`} />
                            {changing ? (
                              <Loader2 aria-hidden="true" className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 animate-spin text-fg-muted" />
                            ) : (
                              <ChevronDown aria-hidden="true" className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-fg-muted" />
                            )}
                          </div>
                        </td>

                        <td className="px-4 py-3.5">
                          <button
                            type="button"
                            onClick={() => handleToggleFeatured(post)}
                            disabled={togglingId === post._id}
                            aria-pressed={post.featured}
                            aria-label={`Feature ${post.title}`}
                            title={post.featured ? "Featured: select to remove" : "Not featured: select to feature"}
                            className={`inline-flex items-center gap-1.5 h-8 min-w-[5.75rem] px-2.5 rounded-lg border text-[12.5px] transition-colors disabled:opacity-60 disabled:cursor-wait ${
                              post.featured
                                ? "border-accent/30 bg-accent/10 text-accent hover:bg-accent/15"
                                : "border-line text-fg-subtle hover:text-fg hover:border-line-strong"
                            }`}
                          >
                            <Star aria-hidden="true" className={`w-3.5 h-3.5 ${post.featured ? "fill-current" : ""}`} />
                            {post.featured ? "Featured" : "Off"}
                          </button>
                        </td>

                        <td className="px-4 py-3.5 whitespace-nowrap tabular-nums text-fg-muted">
                          {post.publishedAt ? formatDate(post.publishedAt) : <span className="text-fg-subtle">Not set</span>}
                        </td>

                        <td className="px-4 py-3.5">
                          {post.tags.length === 0 ? (
                            <span className="text-fg-subtle">
                              <span aria-hidden="true">—</span>
                              <span className="sr-only">No tags</span>
                            </span>
                          ) : (
                            <div className="flex flex-wrap items-center gap-1 max-h-[3.5rem] overflow-hidden" title={post.tags.map((t) => `#${t}`).join("  ")}>
                              {shownTags.map((tag) => (
                                <span key={tag} className="max-w-full truncate px-1.5 h-6 leading-6 rounded-md border border-line bg-surface-2 text-[12px] text-fg-muted">
                                  #{tag}
                                </span>
                              ))}
                              {moreTags.length > 0 && (
                                <span className="px-1.5 h-6 leading-6 text-[12px] text-fg-subtle tabular-nums">
                                  +{moreTags.length}
                                  <span className="sr-only"> more: {moreTags.join(", ")}</span>
                                </span>
                              )}
                            </div>
                          )}
                        </td>

                        <td className="sticky right-0 px-4 py-3.5 bg-surface group-hover:bg-[color-mix(in_oklab,var(--surface-2)_60%,var(--surface))] transition-colors">
                          <div className="flex items-center justify-end gap-1.5">
                            {post.status === "published" && (
                              <Link
                                href={`/blog/${post.slug}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center justify-center w-9 h-9 rounded-lg text-fg-muted hover:text-fg hover:bg-surface-2"
                                aria-label={`View ${post.title} on the site (opens in a new tab)`}
                                title="View on the site"
                              >
                                <Eye aria-hidden="true" className="w-4 h-4" />
                              </Link>
                            )}
                            <Link
                              href={`/saint-denis/blog/${post._id}`}
                              className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg border border-line bg-surface text-fg text-[13px] hover:border-line-strong"
                              aria-label={`Edit ${post.title}`}
                            >
                              <Edit3 aria-hidden="true" className="w-3.5 h-3.5" />
                              Edit
                            </Link>
                            <button
                              type="button"
                              onClick={() => setPostToDelete(post)}
                              className="inline-flex items-center justify-center w-9 h-9 rounded-lg border border-danger/30 bg-surface text-danger hover:bg-danger/10"
                              aria-label={`Delete ${post.title}`}
                              title="Delete article"
                            >
                              <Trash2 aria-hidden="true" className="w-4 h-4" />
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
                className="rounded-xl p-4 border border-line flex flex-col gap-0 bg-surface-2/60 hover:border-line-strong transition-colors"
              >
                {/* Article Title + Slug + Read Time */}
                <div className="flex flex-col min-w-0 pb-3">
                  <h2 className="text-sm font-bold font-sans text-fg leading-snug break-words">
                    {post.title}
                  </h2>
                  <div className="flex items-center gap-2 text-[11px] text-fg-muted flex-wrap mt-1">
                    <span className="font-mono text-accent/80 break-all">
                      /{post.slug}
                    </span>
                    <span className="text-fg-subtle">•</span>
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
                          ? "bg-accent/15 text-accent border border-accent/30"
                          : "bg-surface-2/60 text-fg-muted/50 border border-line hover:text-fg-muted"
                      }`}
                      title={post.featured ? "Remove from featured" : "Feature article"}
                    >
                      <Star className={`w-3 h-3 ${post.featured ? "fill-accent" : ""}`} />
                      <span>{post.featured ? "Featured" : "Normal"}</span>
                    </button>
                  </div>

                  <span className="text-[10px] font-mono text-fg-muted/70 flex items-center gap-1 shrink-0">
                    <Calendar className="w-3 h-3 text-fg-muted/50" />
                    <span>{formatDate(post.publishedAt)}</span>
                  </span>
                </div>

                {/* Tags */}
                {post.tags && post.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 pb-3">
                    {post.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-0.5 rounded text-[10px] font-mono bg-surface-2/60 text-fg-muted/80 border border-line"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* Status Selector row -- separate from action buttons */}
                <div className="pt-3 border-t border-line pb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono text-fg-muted/60 uppercase shrink-0">Status</span>
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
                <div className="pt-0 border-t border-line">
                  <div className="flex items-center gap-2.5 pt-3">
                    {/* View -- only shown for published articles */}
                    {post.status === "published" ? (
                      <Link
                        href={`/blog/${post.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-surface-2 hover:bg-surface-2 text-fg-muted hover:text-accent text-xs font-mono transition-colors min-h-[36px] border border-line"
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
                      className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-accent text-accent-fg text-xs font-mono font-semibold hover:bg-accent/90 transition-all min-h-[36px]"
                      title="Edit article"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </Link>

                    {/* Delete -- destructive */}
                    <button
                      type="button"
                      onClick={() => setPostToDelete(post)}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-danger/10 hover:bg-danger/20 text-danger text-xs font-mono transition-colors cursor-pointer min-h-[36px] border border-danger/15"
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

      <ConfirmDialog
        open={Boolean(postToDelete)}
        title={`Delete “${postToDelete?.title ?? ""}”?`}
        confirmLabel="Delete article"
        destructive
        busy={isDeleting}
        onCancel={() => setPostToDelete(null)}
        onConfirm={handleDeleteConfirm}
      >
        The article is removed from the site immediately, together with its cover image. This cannot be undone.
      </ConfirmDialog>
    </div>
  );
}
