"use client";

import React, { useCallback, useEffect, useId, useMemo, useRef, useState, useTransition } from "react";
import { createPortal } from "react-dom";
import { AlertCircle, BookOpen, CheckCircle2, Edit3, Loader2, Plus, Search, Share2, Trash2, X } from "lucide-react";
import type {
  OrbitKnowledgeItem,
  OrbitKnowledgeCategory,
  OrbitKnowledgePriority,
  OrbitKnowledgeStatus,
} from "@/lib/orbit-knowledge";
import {
  createKnowledgeAction,
  updateKnowledgeAction,
  deleteKnowledgeAction,
  toggleKnowledgeAction,
  type KnowledgeActionState,
} from "@/app/saint-denis/content/knowledge-actions";
import { CategoryFilter, FilterSegment, StateBadge } from "@/components/studio/filters";
import { Button, SelectField, Switch, TextField } from "@/components/studio/fields";
import ConfirmDialog from "@/components/studio/ConfirmDialog";

interface OrbitKnowledgeManagerProps {
  initialItems: OrbitKnowledgeItem[];
}

const CATEGORIES: { key: OrbitKnowledgeCategory; label: string }[] = [
  { key: "profile", label: "Personal / Profile" },
  { key: "education", label: "Education" },
  { key: "skills", label: "Skills" },
  { key: "rawin", label: "RAWIN" },
  { key: "orbit", label: "Rawin Orbit" },
  { key: "custom", label: "Custom Knowledge" },
];

const PRIORITY_OPTIONS: { value: OrbitKnowledgePriority; label: string }[] = [
  { value: "high", label: "High" },
  { value: "normal", label: "Normal" },
  { value: "low", label: "Low" },
];

const STATUS_OPTIONS: { value: OrbitKnowledgeStatus; label: string }[] = [
  { value: "current", label: "Current" },
  { value: "historical", label: "Historical" },
];

const TITLE_MAX = 200;
const CONTENT_MAX = 20000;

type StatusFilter = "all" | OrbitKnowledgeStatus;
type ShareState = { id: string; text: string; tone: "ok" | "error" } | null;

function categoryLabel(key: string) {
  return CATEGORIES.find((c) => c.key === key)?.label || key;
}

function formatDate(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

/**
 * Shares an entry's own words (title and text) through the device share sheet, or copies them
 * when sharing is unavailable. Nothing else leaves the studio: no link, id or other Orbit data.
 */
async function shareEntry(item: OrbitKnowledgeItem): Promise<"shared" | "copied" | "cancelled"> {
  const text = `${item.title}\n\n${item.content}`;
  if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
    try {
      await navigator.share({ title: item.title, text });
      return "shared";
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return "cancelled";
      // share sheet refused (e.g. not allowed here): fall through to copying
    }
  }
  await navigator.clipboard.writeText(text);
  return "copied";
}

export default function OrbitKnowledgeManager({ initialItems }: OrbitKnowledgeManagerProps) {
  const headingId = useId();
  const [items, setItems] = useState<OrbitKnowledgeItem[]>(initialItems);
  const [category, setCategory] = useState<string>("all");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [feedback, setFeedback] = useState<KnowledgeActionState | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [toDelete, setToDelete] = useState<OrbitKnowledgeItem | null>(null);
  const [deleting, startDelete] = useTransition();
  const [share, setShare] = useState<ShareState>(null);
  const [editor, setEditor] = useState<{ item: OrbitKnowledgeItem | null } | null>(null);

  // Each facet counts against the other active filters, so every number is what you would get.
  const q = query.trim().toLowerCase();
  const matchesQuery = useCallback(
    (i: OrbitKnowledgeItem) => !q || i.title.toLowerCase().includes(q) || i.content.toLowerCase().includes(q),
    [q]
  );
  const filtered = useMemo(
    () => items.filter((i) => (category === "all" || i.category === category) && (statusFilter === "all" || i.status === statusFilter) && matchesQuery(i)),
    [items, category, statusFilter, matchesQuery]
  );
  const categoryOptions = useMemo(() => {
    const pool = items.filter((i) => (statusFilter === "all" || i.status === statusFilter) && matchesQuery(i));
    const known = CATEGORIES.map((c) => ({ value: c.key as string, label: c.label, count: pool.filter((i) => i.category === c.key).length }));
    const extra = Array.from(new Set(items.map((i) => i.category).filter((c) => !CATEGORIES.some((k) => k.key === c)))).map((c) => ({
      value: c as string,
      label: c,
      count: pool.filter((i) => i.category === c).length,
    }));
    return [{ value: "all", label: "All categories", count: pool.length }, ...known, ...extra];
  }, [items, statusFilter, matchesQuery]);
  const statusOptions = useMemo(() => {
    const pool = items.filter((i) => (category === "all" || i.category === category) && matchesQuery(i));
    return [
      { value: "all" as const, label: "All", count: pool.length },
      { value: "current" as const, label: "Current", count: pool.filter((i) => i.status === "current").length },
      { value: "historical" as const, label: "Historical", count: pool.filter((i) => i.status === "historical").length },
    ];
  }, [items, category, matchesQuery]);
  const filtersActive = category !== "all" || statusFilter !== "all" || q !== "";

  const handleToggle = async (item: OrbitKnowledgeItem) => {
    if (togglingId) return;
    const next = !item.enabled;
    setTogglingId(item._id);
    try {
      // shown as changed only once the server has saved it
      const result = await toggleKnowledgeAction(item._id, next);
      if (result.success) {
        setItems((prev) => prev.map((i) => (i._id === item._id ? { ...i, enabled: next } : i)));
      } else {
        setFeedback({ error: result.error || "The change was not saved." });
      }
    } catch {
      setFeedback({ error: "The change was not saved. Check the connection and try again." });
    } finally {
      setTogglingId(null);
    }
  };

  const handleDelete = () => {
    if (!toDelete) return;
    const id = toDelete._id;
    startDelete(async () => {
      const result = await deleteKnowledgeAction(id);
      if (result.success) {
        setItems((prev) => prev.filter((i) => i._id !== id));
        setToDelete(null);
        setFeedback({ success: true, message: "Entry deleted." });
      } else {
        setToDelete(null);
        setFeedback({ error: result.error || "The entry was not deleted." });
      }
    });
  };

  const handleShare = async (item: OrbitKnowledgeItem) => {
    try {
      const outcome = await shareEntry(item);
      if (outcome === "copied") setShare({ id: item._id, text: "Copied", tone: "ok" });
      else setShare(null);
    } catch {
      setShare({ id: item._id, text: "Could not copy", tone: "error" });
    }
  };
  useEffect(() => {
    if (!share) return;
    const t = window.setTimeout(() => setShare(null), 2400);
    return () => window.clearTimeout(t);
  }, [share]);

  const onSaved = (item: OrbitKnowledgeItem, created: boolean, message?: string) => {
    setItems((prev) => (created ? [item, ...prev] : prev.map((i) => (i._id === item._id ? item : i))));
    setFeedback({ success: true, message: message || (created ? "Entry added." : "Entry updated.") });
    setEditor(null);
  };

  return (
    <section aria-labelledby={headingId} className="rounded-2xl border border-line bg-surface/70">
      {/* Heading and primary action */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 px-4 sm:px-6 pt-5 sm:pt-6">
        <div className="min-w-0">
          <h2 id={headingId} className="text-[17px] font-semibold text-fg">
            Knowledge base
          </h2>
          <p className="mt-1 text-[13.5px] text-fg-muted max-w-[60ch]">Verified facts and directives Orbit answers from first.</p>
        </div>
        <Button tone="primary" onClick={() => { setFeedback(null); setEditor({ item: null }); }} className="w-full sm:w-auto shrink-0">
          <Plus aria-hidden="true" className="w-4 h-4" />
          Add knowledge item
        </Button>
      </div>

      {/* Search and filters */}
      <div className="px-4 sm:px-6 pt-5 flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="relative flex-1 sm:max-w-[420px]">
            <label htmlFor={`${headingId}-search`} className="sr-only">
              Search knowledge titles and text
            </label>
            <Search aria-hidden="true" className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-fg-muted" />
            <input
              id={`${headingId}-search`}
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search titles and text"
              className="w-full min-h-11 pl-10 pr-11 rounded-xl bg-surface border border-line focus:border-accent text-[15px] sm:text-[14px] text-fg outline-none [&::-webkit-search-cancel-button]:appearance-none"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="absolute right-1 top-1/2 -translate-y-1/2 inline-flex items-center justify-center w-9 h-9 rounded-lg text-fg-muted hover:text-fg"
                aria-label="Clear search"
              >
                <X aria-hidden="true" className="w-4 h-4" />
              </button>
            )}
          </div>
          <FilterSegment label="Time period" value={statusFilter} onChange={setStatusFilter} options={statusOptions} stretch className="sm:ml-auto" />
        </div>
        <CategoryFilter label="Category" value={category} onChange={setCategory} options={categoryOptions} />
      </div>

      {/* Result count and messages */}
      <div className="px-4 sm:px-6 pt-4 pb-3 flex flex-col gap-2">
        <p className="text-[12.5px] text-fg-subtle" aria-live="polite">
          {filtersActive ? `Showing ${filtered.length} of ${items.length} entries` : `${items.length} ${items.length === 1 ? "entry" : "entries"}`}
        </p>
        {feedback?.success && (
          <div role="status" className="flex items-center justify-between gap-3 px-3 py-2 rounded-xl bg-success/10 border border-success/25 text-success text-[13px]">
            <span className="inline-flex items-center gap-2">
              <CheckCircle2 aria-hidden="true" className="w-4 h-4 shrink-0" />
              {feedback.message}
            </span>
            <button type="button" onClick={() => setFeedback(null)} className="shrink-0 inline-flex items-center justify-center w-9 h-9 -my-1 rounded-lg" aria-label="Dismiss message">
              <X aria-hidden="true" className="w-4 h-4" />
            </button>
          </div>
        )}
        {feedback?.error && (
          <div role="alert" className="flex items-center justify-between gap-3 px-3 py-2 rounded-xl bg-danger/10 border border-danger/25 text-danger text-[13px]">
            <span className="inline-flex items-center gap-2">
              <AlertCircle aria-hidden="true" className="w-4 h-4 shrink-0" />
              {feedback.error}
            </span>
            <button type="button" onClick={() => setFeedback(null)} className="shrink-0 inline-flex items-center justify-center w-9 h-9 -my-1 rounded-lg" aria-label="Dismiss message">
              <X aria-hidden="true" className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Entries */}
      {filtered.length === 0 ? (
        <div className="mx-4 sm:mx-6 mb-6 px-6 py-10 rounded-xl border border-dashed border-line flex flex-col items-center text-center gap-2">
          <BookOpen aria-hidden="true" className="w-6 h-6 text-fg-subtle" />
          <p className="text-[14.5px] text-fg">{items.length === 0 ? "No knowledge entries yet" : "No entries match these filters"}</p>
          <p className="text-[13px] text-fg-muted max-w-[44ch]">
            {items.length === 0 ? "Add the facts Orbit should treat as authoritative." : "Try another category or time period, or clear the search."}
          </p>
          {items.length > 0 && (
            <button
              type="button"
              onClick={() => { setQuery(""); setCategory("all"); setStatusFilter("all"); }}
              className="mt-1 inline-flex items-center min-h-11 px-3 text-[13.5px] text-fg underline underline-offset-4"
            >
              Clear filters
            </button>
          )}
        </div>
      ) : (
        <ul className="border-t border-line divide-y divide-line">
          {filtered.map((item) => {
            const toggling = togglingId === item._id;
            const shareNote = share?.id === item._id ? share : null;
            return (
              <li key={item._id} className="px-4 sm:px-6 py-4 sm:py-5 grid gap-3 md:grid-cols-[minmax(0,1fr)_auto] md:gap-6">
                <div className={`min-w-0 ${item.enabled ? "" : "opacity-60"}`}>
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <h3 className="text-[15px] font-medium leading-snug text-fg break-words">{item.title}</h3>
                    {item.priority === "high" && <StateBadge tone="danger">High priority</StateBadge>}
                  </div>
                  <p className="mt-1.5 text-[13.5px] leading-relaxed text-fg-muted line-clamp-2 break-words whitespace-pre-line">{item.content}</p>
                  <p className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[12.5px] text-fg-subtle">
                    <span className="text-fg-muted">{categoryLabel(item.category)}</span>
                    <span aria-hidden="true">·</span>
                    <span className="inline-flex items-center gap-1.5">
                      <span aria-hidden="true" className={`w-1.5 h-1.5 rounded-full ${item.status === "current" ? "bg-success" : "bg-warning"}`} />
                      {item.status === "current" ? "Current" : "Historical"}
                    </span>
                    {item.priority === "low" && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span>Low priority</span>
                      </>
                    )}
                    <span aria-hidden="true">·</span>
                    <span>Updated {formatDate(item.updatedAt)}</span>
                  </p>
                </div>

                {/* Actions: an "in use" switch, then Share, Edit and Delete; all visible without hover */}
                <div className="flex items-center justify-between md:justify-end gap-2 md:self-start">
                  <button
                    type="button"
                    role="switch"
                    aria-checked={item.enabled}
                    aria-label={`Orbit uses “${item.title}”`}
                    aria-busy={toggling || undefined}
                    disabled={toggling}
                    onClick={() => handleToggle(item)}
                    className="inline-flex items-center gap-2.5 min-h-11 pl-1 pr-2 rounded-xl text-[13px] text-fg-muted hover:text-fg disabled:cursor-wait"
                  >
                    <span aria-hidden="true" className={`relative inline-block w-10 h-6 rounded-full border transition-colors ${item.enabled ? "bg-accent border-accent" : "bg-surface-2 border-line-strong"}`}>
                      <span className={`absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full transition-[left] ${item.enabled ? "left-[19px] bg-accent-fg" : "left-[3px] bg-fg-muted"}`} />
                    </span>
                    <span className="w-[4.5rem] text-left">
                      {toggling ? <Loader2 aria-hidden="true" className="w-3.5 h-3.5 animate-spin" /> : item.enabled ? "In use" : "Off"}
                    </span>
                  </button>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleShare(item)}
                      className="inline-flex items-center justify-center gap-1.5 min-w-11 h-11 px-2.5 rounded-xl text-fg-muted hover:text-fg hover:bg-surface-2"
                      aria-label={`Share “${item.title}”`}
                      title="Share or copy this entry's text"
                    >
                      <Share2 aria-hidden="true" className="w-4 h-4" />
                      {shareNote && <span className={`text-[12.5px] ${shareNote.tone === "ok" ? "text-success" : "text-danger"}`}>{shareNote.text}</span>}
                    </button>
                    <button
                      type="button"
                      onClick={() => { setFeedback(null); setEditor({ item }); }}
                      className="inline-flex items-center justify-center w-11 h-11 rounded-xl text-fg-muted hover:text-fg hover:bg-surface-2"
                      aria-label={`Edit “${item.title}”`}
                      title="Edit"
                    >
                      <Edit3 aria-hidden="true" className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setToDelete(item)}
                      className="inline-flex items-center justify-center w-11 h-11 rounded-xl text-danger hover:bg-danger/10"
                      aria-label={`Delete “${item.title}”`}
                      title="Delete"
                    >
                      <Trash2 aria-hidden="true" className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
      <p className="sr-only" aria-live="polite">
        {share?.tone === "ok" ? "Entry text copied to the clipboard" : share?.tone === "error" ? "The entry could not be copied" : ""}
      </p>

      {editor && <KnowledgeEditor item={editor.item} onClose={() => setEditor(null)} onSaved={onSaved} />}

      <ConfirmDialog
        open={Boolean(toDelete)}
        title={`Delete “${toDelete?.title ?? ""}”?`}
        confirmLabel="Delete entry"
        destructive
        busy={deleting}
        onCancel={() => setToDelete(null)}
        onConfirm={handleDelete}
      >
        Orbit stops using this fact immediately. This cannot be undone; to keep it but stop Orbit using it, switch it off instead.
      </ConfirmDialog>
    </section>
  );
}

/**
 * Create / edit dialog: a bottom sheet on phones, a centred dialog from 640px. Focus moves into
 * it and returns to the opener; Escape closes it unless a save is running; fields keep their
 * values when a save fails.
 */
function KnowledgeEditor({
  item,
  onClose,
  onSaved,
}: {
  item: OrbitKnowledgeItem | null;
  onClose: () => void;
  onSaved: (item: OrbitKnowledgeItem, created: boolean, message?: string) => void;
}) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement | null>(null);
  const [category, setCategory] = useState<OrbitKnowledgeCategory>(item?.category ?? "profile");
  const [title, setTitle] = useState(item?.title ?? "");
  const [content, setContent] = useState(item?.content ?? "");
  const [priority, setPriority] = useState<OrbitKnowledgePriority>(item?.priority ?? "normal");
  const [status, setStatus] = useState<OrbitKnowledgeStatus>(item?.status ?? "current");
  const [enabled, setEnabled] = useState(item?.enabled ?? true);
  const [error, setError] = useState<{ field?: "title" | "content"; text: string } | null>(null);
  const [pending, startTransition] = useTransition();
  const pendingRef = useRef(false);
  useEffect(() => {
    pendingRef.current = pending;
  }, [pending]);

  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    panelRef.current?.querySelector<HTMLElement>("input, textarea, select")?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !pendingRef.current) onClose();
      if (e.key === "Tab" && panelRef.current) {
        const f = Array.from(panelRef.current.querySelectorAll<HTMLElement>("button:not([disabled]), input, textarea, select")).filter((el) => el.offsetParent !== null);
        if (!f.length) return;
        if (e.shiftKey && document.activeElement === f[0]) {
          e.preventDefault();
          f[f.length - 1].focus();
        } else if (!e.shiftKey && document.activeElement === f[f.length - 1]) {
          e.preventDefault();
          f[0].focus();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
      opener?.focus?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return setError({ field: "title", text: "Add a title." });
    if (title.trim().length > TITLE_MAX) return setError({ field: "title", text: `Keep the title under ${TITLE_MAX} characters.` });
    if (!content.trim()) return setError({ field: "content", text: "Add the knowledge text." });
    if (content.trim().length > CONTENT_MAX) return setError({ field: "content", text: "The text is longer than 20,000 characters." });
    setError(null);

    const fd = new FormData();
    fd.append("category", category);
    fd.append("title", title.trim());
    fd.append("content", content.trim());
    fd.append("priority", priority);
    fd.append("status", status);
    fd.append("enabled", enabled ? "true" : "false");

    startTransition(async () => {
      try {
        const result = item ? await updateKnowledgeAction(item._id, null, fd) : await createKnowledgeAction(null, fd);
        if (result.success && result.item) onSaved(result.item, !item, result.message);
        else setError({ text: result.error || "Not saved. Your changes are still here." });
      } catch {
        setError({ text: "Not saved: the connection failed. Your changes are still here." });
      }
    });
  };

  // portalled to <body> (like ConfirmDialog) so it sits above the phone tab bar
  return createPortal(
    <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center sm:p-4" data-admin-portal="true">
      <div aria-hidden="true" className="absolute inset-0 bg-black/45" onClick={() => !pending && onClose()} />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative w-full sm:max-w-2xl max-h-[92dvh] sm:max-h-[88dvh] flex flex-col rounded-t-3xl sm:rounded-2xl border border-line-strong bg-bg shadow-[var(--shadow-3)] overflow-hidden"
      >
        <div className="flex items-center justify-between gap-3 px-4 sm:px-6 h-14 sm:h-16 border-b border-line shrink-0">
          <h3 id={titleId} className="text-[16px] font-semibold text-fg">
            {item ? "Edit knowledge entry" : "New knowledge entry"}
          </h3>
          <button type="button" onClick={onClose} disabled={pending} className="inline-flex items-center justify-center w-11 h-11 -mr-2 rounded-xl text-fg-muted hover:text-fg" aria-label="Close">
            <X aria-hidden="true" className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={save} className="flex flex-col flex-1 min-h-0" noValidate>
          <div className="flex-1 overflow-y-auto overscroll-contain px-4 sm:px-6 py-5 flex flex-col gap-4">
            <TextField label="Title" value={title} onChange={setTitle} maxLength={TITLE_MAX} placeholder="e.g. Master of Science in Computer Science" error={error?.field === "title" ? error.text : undefined} />
            <TextField
              label="Knowledge text"
              value={content}
              onChange={setContent}
              multiline
              rows={7}
              maxLength={CONTENT_MAX}
              hint="Plain facts, dates and notes. Markdown lists are fine."
              error={error?.field === "content" ? error.text : undefined}
            />
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <SelectField label="Category" value={category} onChange={setCategory} options={CATEGORIES.map((c) => ({ value: c.key, label: c.label }))} />
              <SelectField label="Time period" value={status} onChange={setStatus} options={STATUS_OPTIONS} />
              <SelectField label="Priority" value={priority} onChange={setPriority} options={PRIORITY_OPTIONS} />
            </div>
            <Switch label="Orbit uses this entry" hint="Switch off to keep the entry without Orbit answering from it." checked={enabled} onChange={setEnabled} />
            {error && !error.field && (
              <p role="alert" className="flex items-center gap-2 text-[13px] text-danger">
                <AlertCircle aria-hidden="true" className="w-4 h-4 shrink-0" />
                {error.text}
              </p>
            )}
          </div>

          <div className="flex items-center justify-end gap-2 px-4 sm:px-6 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] border-t border-line bg-bg-raised shrink-0">
            <Button type="button" onClick={onClose} disabled={pending}>
              Cancel
            </Button>
            <Button type="submit" tone="primary" busy={pending}>
              {item ? "Save changes" : "Add entry"}
            </Button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
