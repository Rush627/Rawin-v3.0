"use client";

import React, { useState, useTransition, useMemo } from "react";
import {
  Plus,
  Trash2,
  Edit3,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Eye,
  FileText,
  Search,
  Check,
  X,
  BookOpen,
  Calendar,
  Layers,
  ArrowUpDown,
  Filter,
} from "lucide-react";
import NeoToggle from "@/components/NeoToggle";
import RawinSelect, { type RawinSelectOption } from "./RawinSelect";
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
} from "@/app/admin/content/knowledge-actions";

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

const PRIORITIES: { key: OrbitKnowledgePriority; label: string }[] = [
  { key: "high", label: "High" },
  { key: "normal", label: "Normal" },
  { key: "low", label: "Low" },
];

const STATUSES: { key: OrbitKnowledgeStatus; label: string }[] = [
  { key: "current", label: "Current" },
  { key: "historical", label: "Historical" },
];

const CATEGORY_OPTIONS: RawinSelectOption[] = CATEGORIES.map((c) => ({
  value: c.key,
  label: c.label,
}));

const STATUS_OPTIONS: RawinSelectOption[] = STATUSES.map((s) => ({
  value: s.key,
  label: s.label,
}));

const PRIORITY_OPTIONS: RawinSelectOption[] = PRIORITIES.map((p) => ({
  value: p.key,
  label: p.label,
}));

export default function OrbitKnowledgeManager({ initialItems }: OrbitKnowledgeManagerProps) {
  const [items, setItems] = useState<OrbitKnowledgeItem[]>(initialItems);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<KnowledgeActionState | null>(null);

  // Form Modal / Drawer State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<OrbitKnowledgeItem | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Form field state
  const [formCategory, setFormCategory] = useState<OrbitKnowledgeCategory>("profile");
  const [formTitle, setFormTitle] = useState("");
  const [formContent, setFormContent] = useState("");
  const [formPriority, setFormPriority] = useState<OrbitKnowledgePriority>("normal");
  const [formStatus, setFormStatus] = useState<OrbitKnowledgeStatus>("current");
  const [formEnabled, setFormEnabled] = useState(true);
  const [showPreview, setShowPreview] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      if (selectedCategory !== "all" && item.category !== selectedCategory) {
        return false;
      }
      if (statusFilter !== "all" && item.status !== statusFilter) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = item.title.toLowerCase().includes(q);
        const matchesContent = item.content.toLowerCase().includes(q);
        if (!matchesTitle && !matchesContent) return false;
      }
      return true;
    });
  }, [items, selectedCategory, statusFilter, searchQuery]);

  const openCreateForm = () => {
    setEditingItem(null);
    setFormCategory("profile");
    setFormTitle("");
    setFormContent("");
    setFormPriority("normal");
    setFormStatus("current");
    setFormEnabled(true);
    setShowPreview(false);
    setIsFormOpen(true);
    setFeedback(null);
  };

  const openEditForm = (item: OrbitKnowledgeItem) => {
    setEditingItem(item);
    setFormCategory(item.category);
    setFormTitle(item.title);
    setFormContent(item.content);
    setFormPriority(item.priority);
    setFormStatus(item.status);
    setFormEnabled(item.enabled);
    setShowPreview(false);
    setIsFormOpen(true);
    setFeedback(null);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingItem(null);
    setShowPreview(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) {
      setFeedback({ error: "Title is required." });
      return;
    }
    if (!formContent.trim()) {
      setFeedback({ error: "Content is required." });
      return;
    }

    const formData = new FormData();
    formData.append("category", formCategory);
    formData.append("title", formTitle.trim());
    formData.append("content", formContent.trim());
    formData.append("priority", formPriority);
    formData.append("status", formStatus);
    formData.append("enabled", formEnabled ? "true" : "false");

    startTransition(async () => {
      if (editingItem) {
        const result = await updateKnowledgeAction(editingItem._id, null, formData);
        if (result.success && result.item) {
          setItems((prev) =>
            prev.map((i) => (i._id === editingItem._id ? result.item! : i))
          );
          setFeedback({ success: true, message: result.message });
          closeForm();
        } else {
          setFeedback({ error: result.error || "Update failed." });
        }
      } else {
        const result = await createKnowledgeAction(null, formData);
        if (result.success && result.item) {
          setItems((prev) => [result.item!, ...prev]);
          setFeedback({ success: true, message: result.message });
          closeForm();
        } else {
          setFeedback({ error: result.error || "Creation failed." });
        }
      }
    });
  };

  const handleToggle = async (item: OrbitKnowledgeItem) => {
    const nextState = !item.enabled;
    setTogglingId(item._id);

    // Optimistic local update
    setItems((prev) =>
      prev.map((i) => (i._id === item._id ? { ...i, enabled: nextState } : i))
    );

    const result = await toggleKnowledgeAction(item._id, nextState);
    setTogglingId(null);

    if (!result.success) {
      // Rollback on failure
      setItems((prev) =>
        prev.map((i) => (i._id === item._id ? { ...i, enabled: item.enabled } : i))
      );
      setFeedback({ error: result.error || "Failed to toggle status." });
    }
  };

  const handleDelete = async (id: string) => {
    startTransition(async () => {
      const result = await deleteKnowledgeAction(id);
      if (result.success) {
        setItems((prev) => prev.filter((i) => i._id !== id));
        setDeleteConfirmId(null);
        setFeedback({ success: true, message: "Entry deleted successfully." });
      } else {
        setFeedback({ error: result.error || "Failed to delete item." });
      }
    });
  };

  const formatDate = (iso: string) => {
    try {
      const d = new Date(iso);
      return d.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return iso;
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Top Banner & Action Header */}
      <div className="glass-card rounded-2xl p-6 sm:p-8 border border-white/[0.08] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-pacific-cyan/10 border border-pacific-cyan/20 text-pacific-cyan">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold font-space text-foreground">
              Orbit Knowledge Base
            </h2>
            <p className="text-xs font-mono text-muted mt-0.5">
              Authoritative manual facts supplied directly to Rawin Orbit.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={openCreateForm}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-pacific-cyan hover:bg-pacific-cyan/90 text-ink-black text-xs font-mono font-semibold transition-all shadow-[0_0_15px_rgba(24,155,173,0.3)] cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add Knowledge Item</span>
        </button>
      </div>

      {/* Status / Feedback Notifications */}
      {feedback?.success && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-between gap-3 text-emerald-300 text-xs font-mono">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{feedback.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-emerald-400/70 hover:text-emerald-300 underline cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {feedback?.error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/25 flex items-center justify-between gap-3 text-red-300 text-xs font-mono">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{feedback.error}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-red-400/70 hover:text-red-300 underline cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Category Pills & Filters */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2 p-1.5 rounded-xl bg-white/[0.02] border border-white/[0.06]">
          <button
            type="button"
            onClick={() => setSelectedCategory("all")}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all cursor-pointer ${
              selectedCategory === "all"
                ? "bg-white/[0.12] text-foreground font-semibold"
                : "text-muted hover:text-foreground hover:bg-white/[0.04]"
            }`}
          >
            All Categories ({items.length})
          </button>
          {CATEGORIES.map((cat) => {
            const count = items.filter((i) => i.category === cat.key).length;
            const isSel = selectedCategory === cat.key;
            return (
              <button
                key={cat.key}
                type="button"
                onClick={() => setSelectedCategory(cat.key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all cursor-pointer ${
                  isSel
                    ? "bg-pacific-cyan/15 text-pacific-cyan border border-pacific-cyan/30 font-semibold"
                    : "text-muted hover:text-foreground hover:bg-white/[0.04]"
                }`}
              >
                {cat.label} ({count})
              </button>
            );
          })}
        </div>

        {/* Search & Status Filter Row */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-3.5 h-3.5 text-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search knowledge title or content..."
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-ink-black/60 border border-white/[0.08] focus:border-pacific-cyan text-xs text-foreground outline-none transition-colors"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono text-muted uppercase">Status:</span>
            <div className="inline-flex items-center rounded-lg bg-white/[0.03] border border-white/[0.06] p-0.5">
              <button
                type="button"
                onClick={() => setStatusFilter("all")}
                className={`px-2.5 py-1 text-[11px] font-mono rounded-md transition-colors cursor-pointer ${
                  statusFilter === "all" ? "bg-white/[0.1] text-foreground" : "text-muted hover:text-foreground"
                }`}
              >
                All
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter("current")}
                className={`px-2.5 py-1 text-[11px] font-mono rounded-md transition-colors cursor-pointer ${
                  statusFilter === "current" ? "bg-emerald-500/20 text-emerald-400 font-medium" : "text-muted hover:text-foreground"
                }`}
              >
                Current
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter("historical")}
                className={`px-2.5 py-1 text-[11px] font-mono rounded-md transition-colors cursor-pointer ${
                  statusFilter === "historical" ? "bg-amber-500/20 text-amber-400 font-medium" : "text-muted hover:text-foreground"
                }`}
              >
                Historical
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Items List */}
      <div className="flex flex-col gap-3">
        {filteredItems.length === 0 ? (
          <div className="p-12 rounded-2xl bg-white/[0.02] border border-white/[0.06] flex flex-col items-center justify-center text-center gap-2">
            <BookOpen className="w-8 h-8 text-muted/40 mb-1" />
            <p className="text-sm font-space text-foreground">No knowledge records found.</p>
            <p className="text-xs font-mono text-muted">
              {items.length === 0
                ? "Click 'Add Knowledge Item' above to provide authoritative facts to Rawin Orbit."
                : "No entries match the active search or category filters."}
            </p>
          </div>
        ) : (
          filteredItems.map((item) => {
            const isDeleting = deleteConfirmId === item._id;
            const isToggling = togglingId === item._id;
            const catLabel =
              CATEGORIES.find((c) => c.key === item.category)?.label || item.category;

            return (
              <div
                key={item._id}
                className={`p-5 rounded-2xl border transition-all ${
                  item.enabled
                    ? "bg-white/[0.02] border-white/[0.08] hover:border-white/[0.14]"
                    : "bg-white/[0.01] border-white/[0.04] opacity-60"
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  {/* Left Metadata & Content */}
                  <div className="flex-1 flex flex-col gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-white/[0.06] text-muted border border-white/[0.08]">
                        {catLabel}
                      </span>

                      <span
                        className={`text-[11px] font-mono px-2 py-0.5 rounded-md border font-medium ${
                          item.status === "current"
                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                            : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                        }`}
                      >
                        {item.status === "current" ? "Current" : "Historical"}
                      </span>

                      <span
                        className={`text-[11px] font-mono px-2 py-0.5 rounded-md border ${
                          item.priority === "high"
                            ? "bg-rose-500/10 text-rose-400 border-rose-500/20"
                            : item.priority === "low"
                            ? "bg-white/[0.03] text-muted border-white/[0.06]"
                            : "bg-pacific-cyan/10 text-pacific-cyan border-pacific-cyan/20"
                        }`}
                      >
                        Priority: {item.priority}
                      </span>

                      {!item.enabled && (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-zinc-500/10 text-zinc-400 border border-zinc-500/20">
                          Disabled
                        </span>
                      )}
                    </div>

                    <h3 className="text-base font-bold font-space text-foreground">
                      {item.title}
                    </h3>

                    <p className="text-xs font-mono text-muted/90 whitespace-pre-wrap leading-relaxed max-h-28 overflow-hidden text-ellipsis line-clamp-3">
                      {item.content}
                    </p>

                    <div className="flex items-center gap-2 pt-1 text-[10px] font-mono text-muted/60">
                      <Calendar className="w-3 h-3" />
                      <span>Updated: {formatDate(item.updatedAt)}</span>
                    </div>
                  </div>

                  {/* Right Actions */}
                  <div className="flex items-center gap-2 self-end sm:self-start shrink-0">
                    {/* Enable / Disable Switch */}
                    <div className="flex items-center gap-2 mr-2">
                      <span className="text-[11px] font-mono text-muted hidden sm:inline">
                        {item.enabled ? "Active" : "Off"}
                      </span>
                      <NeoToggle
                        checked={item.enabled}
                        onChange={() => handleToggle(item)}
                        disabled={isToggling}
                      />
                    </div>

                    {/* Edit Button */}
                    <button
                      type="button"
                      onClick={() => openEditForm(item)}
                      aria-label="Edit knowledge entry"
                      className="p-2 rounded-xl text-muted hover:text-foreground bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] transition-colors cursor-pointer"
                      title="Edit entry"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>

                    {/* Delete with Confirmation */}
                    {isDeleting ? (
                      <div className="flex items-center gap-1 bg-red-500/10 p-1 rounded-xl border border-red-500/30">
                        <button
                          type="button"
                          onClick={() => handleDelete(item._id)}
                          disabled={isPending}
                          className="px-2 py-1 rounded-lg bg-red-500 hover:bg-red-600 text-white text-xs font-mono transition-colors cursor-pointer"
                        >
                          Confirm
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteConfirmId(null)}
                          className="p-1 text-muted hover:text-foreground cursor-pointer"
                          aria-label="Cancel deletion"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setDeleteConfirmId(item._id)}
                        aria-label="Delete knowledge entry"
                        className="p-2 rounded-xl text-muted hover:text-red-400 bg-white/[0.04] hover:bg-red-500/10 border border-white/[0.08] hover:border-red-500/20 transition-colors cursor-pointer"
                        title="Delete entry"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Create / Edit Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-black/80 backdrop-blur-md">
          <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-ink-black border border-white/[0.12] p-6 sm:p-8 flex flex-col gap-6 shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-white/[0.08]">
              <div className="flex items-center gap-2.5">
                <BookOpen className="w-5 h-5 text-pacific-cyan" />
                <h3 className="text-lg font-bold font-space text-foreground">
                  {editingItem ? "Edit Knowledge Entry" : "New Knowledge Entry"}
                </h3>
              </div>
              <button
                type="button"
                onClick={closeForm}
                className="p-1.5 rounded-lg text-muted hover:text-foreground hover:bg-white/[0.06] transition-colors cursor-pointer"
                aria-label="Close dialog"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSave} className="flex flex-col gap-5">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Category */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-mono text-muted uppercase">Category</label>
                  <RawinSelect
                    name="category"
                    value={formCategory}
                    onChange={(val) => setFormCategory(val as OrbitKnowledgeCategory)}
                    options={CATEGORY_OPTIONS}
                  />
                </div>

                {/* Status */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-mono text-muted uppercase">Status</label>
                  <RawinSelect
                    name="status"
                    value={formStatus}
                    onChange={(val) => setFormStatus(val as OrbitKnowledgeStatus)}
                    options={STATUS_OPTIONS}
                  />
                </div>

                {/* Priority */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-mono text-muted uppercase">Priority</label>
                  <RawinSelect
                    name="priority"
                    value={formPriority}
                    onChange={(val) => setFormPriority(val as OrbitKnowledgePriority)}
                    options={PRIORITY_OPTIONS}
                  />
                </div>
              </div>

              {/* Title */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-mono text-muted uppercase">
                  Title / Subject <span className="text-pacific-cyan">*</span>
                </label>
                <input
                  type="text"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="e.g. Master's Degree in Computer Science, or RAWIN Architecture"
                  maxLength={200}
                  required
                  className="px-4 py-2.5 rounded-xl bg-ink-black/60 border border-white/[0.08] focus:border-pacific-cyan text-sm text-foreground outline-none transition-colors"
                />
              </div>

              {/* Content (Markdown) */}
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-mono text-muted uppercase">
                    Knowledge Content (Markdown) <span className="text-pacific-cyan">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowPreview(!showPreview)}
                    className="inline-flex items-center gap-1 text-[11px] font-mono text-pacific-cyan hover:underline cursor-pointer"
                  >
                    <Eye className="w-3 h-3" />
                    <span>{showPreview ? "Edit Source" : "Preview"}</span>
                  </button>
                </div>

                {showPreview ? (
                  <div className="min-h-[160px] p-4 rounded-xl bg-white/[0.02] border border-white/[0.08] text-xs font-mono text-foreground whitespace-pre-wrap leading-relaxed">
                    {formContent ? formContent : <span className="text-muted italic">No content entered.</span>}
                  </div>
                ) : (
                  <textarea
                    rows={8}
                    value={formContent}
                    onChange={(e) => setFormContent(e.target.value)}
                    placeholder="Enter authoritative factual context. Markdown bullet points, key facts, dates, technologies, or notes..."
                    required
                    maxLength={20000}
                    className="px-4 py-3 rounded-xl bg-ink-black/60 border border-white/[0.08] focus:border-pacific-cyan text-xs font-mono text-foreground outline-none transition-colors resize-y leading-relaxed"
                  />
                )}
                <span className="text-[10px] font-mono text-muted/60 self-end">
                  {formContent.length} / 20,000 chars
                </span>
              </div>

              {/* Enabled Switch */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                <div className="flex flex-col">
                  <span className="text-xs font-mono text-foreground font-medium">
                    Enable for Orbit Inquiries
                  </span>
                  <span className="text-[10px] font-mono text-muted">
                    When disabled, this entry will not be supplied to Orbit.
                  </span>
                </div>
                <NeoToggle
                  checked={formEnabled}
                  onChange={(c) => setFormEnabled(c)}
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-2 border-t border-white/[0.06]">
                <button
                  type="button"
                  onClick={closeForm}
                  className="px-4 py-2 rounded-xl text-xs font-mono text-muted hover:text-foreground bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending || !formTitle.trim() || !formContent.trim()}
                  className="flex items-center gap-2 px-5 py-2 rounded-xl bg-pacific-cyan hover:bg-pacific-cyan/90 text-ink-black text-xs font-mono font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-[0_0_15px_rgba(24,155,173,0.3)] cursor-pointer"
                >
                  {isPending ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Check className="w-3.5 h-3.5" />
                  )}
                  <span>{editingItem ? "Update Entry" : "Create Entry"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
