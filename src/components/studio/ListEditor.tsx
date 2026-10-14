"use client";

import { useId, useRef, useState, type ReactNode } from "react";
import { ArrowDown, ArrowUp, ChevronDown, Plus, Trash2, X } from "lucide-react";

const iconBtn =
  "inline-flex items-center justify-center w-11 h-11 rounded-xl text-fg-muted hover:text-fg hover:bg-surface-2/70 disabled:opacity-30 disabled:pointer-events-none";

interface ListEditorProps<T> {
  label: string;
  items: T[];
  onChange: (items: T[]) => void;
  createItem: () => T;
  itemTitle: (item: T, index: number) => string;
  itemMeta?: (item: T, index: number) => ReactNode;
  renderItem: (item: T, update: (patch: Partial<T>) => void, index: number) => ReactNode;
  max?: number;
  min?: number;
  error?: string;
  addLabel?: string;
  hint?: ReactNode;
}

/**
 * Repeatable structured items: each is a collapsible row with move up/down and remove;
 * adding opens the new row. Changes are local until the editor is saved.
 */
export function ListEditor<T>({ label, items, onChange, createItem, itemTitle, itemMeta, renderItem, max = 50, min = 0, error, addLabel = "Add", hint }: ListEditorProps<T>) {
  const id = useId();
  const [open, setOpen] = useState<number | null>(null);
  const listRef = useRef<HTMLOListElement | null>(null);

  const move = (from: number, to: number) => {
    if (to < 0 || to >= items.length) return;
    const next = [...items];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    onChange(next);
    setOpen((o) => (o === from ? to : o === to ? from : o));
  };
  const remove = (i: number) => {
    onChange(items.filter((_, j) => j !== i));
    setOpen(null);
    // keep keyboard focus inside the list
    requestAnimationFrame(() => listRef.current?.querySelector<HTMLElement>("[data-row-toggle]")?.focus());
  };
  const add = () => {
    onChange([...items, createItem()]);
    setOpen(items.length);
  };

  return (
    <div className="flex flex-col gap-2.5" role="group" aria-labelledby={`${id}-label`}>
      <div className="flex items-end justify-between gap-3">
        <div>
          <p id={`${id}-label`} className="text-[13px] font-medium text-fg">
            {label} <span className="font-mono text-[11px] text-fg-subtle">{items.length}</span>
          </p>
          {hint && <p className="mt-0.5 text-[12.5px] text-fg-subtle">{hint}</p>}
        </div>
      </div>
      {error && (
        <p role="alert" className="text-[12.5px] text-danger">
          {error}
        </p>
      )}
      <ol ref={listRef} className="flex flex-col gap-2">
        {items.map((item, i) => {
          const isOpen = open === i;
          const title = itemTitle(item, i);
          return (
            <li key={i} className={`rounded-xl border bg-bg-raised/60 ${isOpen ? "border-line-strong" : "border-line"}`}>
              <div className="flex items-center gap-1 pl-1 pr-1">
                <button
                  type="button"
                  data-row-toggle
                  aria-expanded={isOpen}
                  onClick={() => setOpen(isOpen ? null : i)}
                  className="flex-1 min-w-0 flex items-center gap-2.5 min-h-12 px-2.5 text-left rounded-lg"
                >
                  <span className="font-mono text-[11px] text-fg-subtle tabular-nums w-5 shrink-0">{String(i + 1).padStart(2, "0")}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[14px] text-fg">{title || <span className="text-fg-subtle">Untitled</span>}</span>
                    {itemMeta && <span className="block truncate text-[12px] text-fg-subtle">{itemMeta(item, i)}</span>}
                  </span>
                  <ChevronDown aria-hidden="true" className={`w-4 h-4 shrink-0 text-fg-muted transition-transform ${isOpen ? "rotate-180" : ""}`} />
                </button>
                <button type="button" className={`${iconBtn} hidden sm:inline-flex`} onClick={() => move(i, i - 1)} disabled={i === 0} aria-label={`Move “${title || `item ${i + 1}`}” up`}>
                  <ArrowUp className="w-4 h-4" />
                </button>
                <button type="button" className={`${iconBtn} hidden sm:inline-flex`} onClick={() => move(i, i + 1)} disabled={i === items.length - 1} aria-label={`Move “${title || `item ${i + 1}`}” down`}>
                  <ArrowDown className="w-4 h-4" />
                </button>
              </div>
              {isOpen && (
                <div className="px-3.5 sm:px-4 pb-4 pt-3 border-t border-line flex flex-col gap-4">
                  {renderItem(item, (patch) => onChange(items.map((it, j) => (j === i ? { ...it, ...patch } : it))), i)}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                    <div className="flex sm:hidden gap-1">
                      <button type="button" className={`${iconBtn} border border-line`} onClick={() => move(i, i - 1)} disabled={i === 0} aria-label="Move up">
                        <ArrowUp className="w-4 h-4" />
                      </button>
                      <button type="button" className={`${iconBtn} border border-line`} onClick={() => move(i, i + 1)} disabled={i === items.length - 1} aria-label="Move down">
                        <ArrowDown className="w-4 h-4" />
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => remove(i)}
                      disabled={items.length <= min}
                      className="ml-auto inline-flex items-center gap-2 min-h-11 px-3 rounded-xl text-[13.5px] text-danger hover:bg-danger/10 disabled:opacity-40"
                    >
                      <Trash2 aria-hidden="true" className="w-4 h-4" />
                      Remove
                    </button>
                  </div>
                </div>
              )}
            </li>
          );
        })}
      </ol>
      {items.length < max && (
        <button
          type="button"
          onClick={add}
          className="self-start inline-flex items-center gap-2 min-h-11 px-3.5 rounded-xl border border-dashed border-line-strong text-[13.5px] text-fg-muted hover:text-fg hover:border-fg-subtle"
        >
          <Plus aria-hidden="true" className="w-4 h-4" />
          {addLabel}
        </button>
      )}
    </div>
  );
}

/** A list of short strings (phrases, skills, highlights): one input per entry. */
export function StringListEditor({ label, items, onChange, max = 30, maxLength, placeholder, error, hint, addLabel = "Add" }: {
  label: string; items: string[]; onChange: (items: string[]) => void; max?: number; maxLength?: number; placeholder?: string; error?: string; hint?: ReactNode; addLabel?: string;
}) {
  const id = useId();
  const inputs = useRef<(HTMLInputElement | null)[]>([]);
  const add = () => {
    onChange([...items, ""]);
    requestAnimationFrame(() => inputs.current[items.length]?.focus());
  };
  return (
    <div className="flex flex-col gap-2" role="group" aria-labelledby={`${id}-label`}>
      <p id={`${id}-label`} className="text-[13px] font-medium text-fg">
        {label} <span className="font-mono text-[11px] text-fg-subtle">{items.filter((s) => s.trim()).length}</span>
      </p>
      {hint && <p className="-mt-1 text-[12.5px] text-fg-subtle">{hint}</p>}
      {error && (
        <p role="alert" className="text-[12.5px] text-danger">
          {error}
        </p>
      )}
      <ul className="flex flex-col gap-1.5">
        {items.map((value, i) => (
          <li key={i} className="flex items-center gap-1.5">
            <input
              ref={(el) => {
                inputs.current[i] = el;
              }}
              value={value}
              maxLength={maxLength}
              placeholder={placeholder}
              aria-label={`${label} ${i + 1}`}
              onChange={(e) => onChange(items.map((s, j) => (j === i ? e.target.value : s)))}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  if (items.length < max) add();
                }
              }}
              className="flex-1 min-w-0 min-h-11 rounded-xl bg-surface border border-line-strong px-3.5 text-[15px] text-fg placeholder:text-fg-subtle focus:outline-none focus:border-accent focus:shadow-[0_0_0_3px_color-mix(in_oklab,var(--accent)_18%,transparent)]"
            />
            <button
              type="button"
              className={iconBtn}
              aria-label={`Remove ${label.toLowerCase()} ${i + 1}${value ? ` (${value})` : ""}`}
              onClick={() => onChange(items.filter((_, j) => j !== i))}
            >
              <X className="w-4 h-4" />
            </button>
          </li>
        ))}
      </ul>
      {items.length < max && (
        <button
          type="button"
          onClick={add}
          className="self-start inline-flex items-center gap-2 min-h-11 px-3.5 rounded-xl border border-dashed border-line-strong text-[13.5px] text-fg-muted hover:text-fg hover:border-fg-subtle"
        >
          <Plus aria-hidden="true" className="w-4 h-4" />
          {addLabel}
        </button>
      )}
    </div>
  );
}
