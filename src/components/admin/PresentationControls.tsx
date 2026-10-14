"use client";

import { useState } from "react";
import { ArrowDown, ArrowUp, Plus, X } from "lucide-react";

/* --------------------------------------------------------------------------
   Shared admin control primitives for presentation settings.
   Each control renders the hidden field that updateSectionAction expects.
   -------------------------------------------------------------------------- */

export function AdminSwitch({
  checked,
  onChange,
  label,
  description,
  name,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  description?: string;
  name?: string;
}) {
  return (
    <label className="group flex items-start justify-between gap-6 py-4 border-b border-line last:border-b-0 cursor-pointer">
      <span className="min-w-0">
        <span className="block text-[15px] text-fg">{label}</span>
        {description && <span className="block mt-1 text-[13px] text-fg-muted leading-snug">{description}</span>}
      </span>
      <span className="relative shrink-0 mt-0.5">
        <input
          type="checkbox"
          role="switch"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="peer sr-only"
          aria-checked={checked}
        />
        <span className="block w-11 h-6 rounded-full bg-sunken border border-line-strong transition-colors peer-checked:bg-accent peer-checked:border-accent peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-[var(--focus)]" />
        <span className="absolute top-1 left-1 w-4 h-4 rounded-full bg-fg-subtle transition-transform duration-300 peer-checked:translate-x-5 peer-checked:bg-accent-fg" />
      </span>
      {name && <input type="hidden" name={name} value={checked ? "true" : "false"} />}
    </label>
  );
}

export function SegmentedChoice<T extends string>({
  value,
  onChange,
  options,
  label,
  name,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string; hint?: string }[];
  label: string;
  name?: string;
}) {
  return (
    <fieldset>
      <legend className="label-mono text-fg-subtle mb-2.5">{label}</legend>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {options.map((o) => {
          const active = value === o.value;
          return (
            <button
              key={o.value}
              type="button"
              onClick={() => onChange(o.value)}
              aria-pressed={active}
              className={`text-left rounded-2xl border px-4 py-3.5 transition-colors ${
                active ? "border-accent bg-accent/10" : "border-line hover:border-line-strong bg-surface"
              }`}
            >
              <span className="flex items-center gap-2.5 text-[15px] text-fg">
                <span className={`w-3.5 h-3.5 rounded-full border ${active ? "border-accent bg-accent" : "border-line-strong"}`} />
                {o.label}
              </span>
              {o.hint && <span className="block mt-1 pl-6 text-[13px] text-fg-muted">{o.hint}</span>}
            </button>
          );
        })}
      </div>
      {name && <input type="hidden" name={name} value={value} />}
    </fieldset>
  );
}

/** Ordered, de-duplicated string list editor (categories). */
export function CategoryListEditor({
  label,
  description,
  name,
  items,
  onChange,
  inUse = [],
}: {
  label: string;
  description?: string;
  name: string;
  items: string[];
  onChange: (next: string[]) => void;
  /** Values currently used by documents — shown so editors don't orphan them by accident */
  inUse?: string[];
}) {
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const lower = new Set(items.map((i) => i.toLowerCase()));
  const orphaned = inUse.filter((v) => v && !lower.has(v.toLowerCase()));

  const add = (raw: string) => {
    const v = raw.trim();
    if (!v) return;
    if (v.length > 50) return setError("Keep categories under 50 characters.");
    if (/[—–]/.test(v)) return setError("Use a hyphen or middle dot (·) instead of a dash.");
    if (lower.has(v.toLowerCase())) return setError(`"${v}" is already in the list.`);
    if (items.length >= 40) return setError("A list can hold up to 40 categories.");
    setError(null);
    onChange([...items, v]);
    setDraft("");
  };

  const move = (i: number, d: -1 | 1) => {
    const j = i + d;
    if (j < 0 || j >= items.length) return;
    const next = [...items];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };

  return (
    <section className="rounded-[24px] border border-line bg-surface p-5 sm:p-7">
      <input type="hidden" name={name} value={JSON.stringify(items)} />
      <header className="flex flex-wrap items-baseline justify-between gap-3">
        <h3 className="font-display text-[1.7rem] leading-none text-fg">{label}</h3>
        <span className="label-mono text-fg-subtle">{items.length} / 40</span>
      </header>
      {description && <p className="mt-2 text-[13.5px] text-fg-muted leading-relaxed max-w-[60ch]">{description}</p>}

      <ol className="mt-5 border-t border-line">
        {items.map((item, i) => (
          <li key={item} className="flex items-center gap-3 py-2.5 border-b border-line">
            <span className="font-mono text-[11px] text-fg-subtle w-6">{String(i + 1).padStart(2, "0")}</span>
            <span className="flex-1 min-w-0 truncate text-[15px] text-fg">{item}</span>
            <span className="flex items-center gap-1">
              <button type="button" onClick={() => move(i, -1)} disabled={i === 0} className="w-8 h-8 inline-flex items-center justify-center rounded-full text-fg-muted hover:text-fg hover:bg-surface-2 disabled:opacity-30" aria-label={`Move ${item} up`}>
                <ArrowUp className="w-3.5 h-3.5" />
              </button>
              <button type="button" onClick={() => move(i, 1)} disabled={i === items.length - 1} className="w-8 h-8 inline-flex items-center justify-center rounded-full text-fg-muted hover:text-fg hover:bg-surface-2 disabled:opacity-30" aria-label={`Move ${item} down`}>
                <ArrowDown className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => items.length > 1 && onChange(items.filter((_, k) => k !== i))}
                disabled={items.length <= 1}
                className="w-8 h-8 inline-flex items-center justify-center rounded-full text-fg-muted hover:text-danger hover:bg-danger/10 disabled:opacity-30"
                aria-label={`Remove ${item}`}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </span>
          </li>
        ))}
      </ol>

      <div className="mt-4 flex gap-2">
        <label htmlFor={`${name}-new`} className="sr-only">
          New category
        </label>
        <input
          id={`${name}-new`}
          type="text"
          value={draft}
          onChange={(e) => {
            setDraft(e.target.value);
            setError(null);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add(draft);
            }
          }}
          placeholder="Add a category, e.g. Real-Time Systems"
          className="admin-input flex-1"
          maxLength={50}
        />
        <button type="button" onClick={() => add(draft)} className="btn btn-primary btn-sm shrink-0">
          <Plus className="w-3.5 h-3.5" />
          <span>Add</span>
        </button>
      </div>
      {error && <p className="mt-2 text-[13px] text-danger" role="alert">{error}</p>}

      {orphaned.length > 0 && (
        <div className="mt-5 rounded-2xl border border-warning/40 bg-warning/10 p-4">
          <p className="text-[13px] text-fg">
            Still used by existing entries but not in this list. They keep working and remain filterable;
            add them back to manage their order.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {orphaned.map((v) => (
              <button key={v} type="button" onClick={() => add(v)} className="inline-flex items-center gap-1.5 h-8 px-3 rounded-full border border-line-strong text-[13px] text-fg hover:border-fg">
                <Plus className="w-3 h-3" />
                {v}
              </button>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
