"use client";

import { useId, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";

export interface FilterOption<T extends string> {
  value: T;
  label: string;
  /** Shorter label used below 640px when the full one would not fit */
  short?: string;
  /** Real count of matching records, shown beside the label */
  count?: number;
}

/**
 * Compact single-choice filter (a radio group styled as a segmented control). Used for
 * mutually exclusive filters and view modes. `stretch` makes the options share the full width
 * on phones; from 640px it sizes to its content.
 */
export function FilterSegment<T extends string>({
  label,
  value,
  onChange,
  options,
  stretch = false,
  showLabel = false,
  className = "",
}: {
  label: string;
  value: T;
  onChange: (v: T) => void;
  options: FilterOption<T>[];
  stretch?: boolean;
  /** Show the group label beside the control (it is always announced) */
  showLabel?: boolean;
  className?: string;
}) {
  const name = useId();
  return (
    <fieldset className={`min-w-0 ${showLabel ? "flex flex-col gap-1.5" : ""} ${className}`}>
      <legend className={showLabel ? "label-mono text-fg-subtle mb-1.5" : "sr-only"}>{label}</legend>
      <div
        className={`p-1 rounded-xl bg-surface-2/70 border border-line gap-1 ${
          stretch ? "grid w-full sm:inline-flex sm:w-auto" : "inline-flex max-w-full"
        }`}
        style={stretch ? { gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` } : undefined}
      >
        {options.map((o) => {
          const active = o.value === value;
          return (
            <label
              key={o.value}
              className={`relative inline-flex items-center justify-center gap-1.5 min-h-9 px-2 sm:px-3 rounded-lg text-[13px] whitespace-nowrap cursor-pointer select-none transition-colors has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-1 has-[:focus-visible]:outline-accent ${
                active ? "bg-surface text-fg font-medium border border-line shadow-[var(--shadow-1)]" : "text-fg-muted hover:text-fg border border-transparent"
              }`}
            >
              <input type="radio" name={name} value={o.value} checked={active} onChange={() => onChange(o.value)} className="sr-only" />
              {o.short ? (
                <>
                  <span aria-hidden="true" className="sm:hidden">{o.short}</span>
                  <span className="sr-only sm:not-sr-only">{o.label}</span>
                </>
              ) : (
                o.label
              )}
              {typeof o.count === "number" && (
                <span className={`tabular-nums text-[11.5px] ${active ? "text-fg-muted" : "text-fg-subtle"}`}>{o.count}</span>
              )}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

/**
 * Single-choice category filter. From 640px the categories are wrapping chips (a radio group);
 * on phones the same choice is a full-width native select, so long names are never clipped and
 * the picker is the platform's own.
 */
export function CategoryFilter<T extends string>({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: T;
  onChange: (v: T) => void;
  options: FilterOption<T>[];
}) {
  const id = useId();
  const text = (o: FilterOption<T>) => (typeof o.count === "number" ? `${o.label} (${o.count})` : o.label);
  return (
    <div className="min-w-0">
      {/* Phones: one select */}
      <div className="sm:hidden flex flex-col gap-1.5">
        <label htmlFor={`${id}-select`} className="label-mono text-fg-subtle">
          {label}
        </label>
        <div className="relative">
          <select
            id={`${id}-select`}
            value={value}
            onChange={(e) => onChange(e.target.value as T)}
            className="w-full appearance-none min-h-11 pl-3.5 pr-10 rounded-xl bg-surface border border-line text-[15px] text-fg focus:border-accent outline-none"
          >
            {options.map((o) => (
              <option key={o.value} value={o.value}>
                {text(o)}
              </option>
            ))}
          </select>
          <ChevronDown aria-hidden="true" className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-fg-muted" />
        </div>
      </div>

      {/* Tablet and desktop: wrapping chips */}
      <fieldset className="hidden sm:block min-w-0">
        <legend className="sr-only">{label}</legend>
        <div className="flex flex-wrap gap-1.5">
          {options.map((o) => {
            const active = o.value === value;
            return (
              <label
                key={o.value}
                className={`inline-flex items-center gap-1.5 min-h-9 px-3 rounded-full border text-[13px] whitespace-nowrap cursor-pointer select-none transition-colors has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-1 has-[:focus-visible]:outline-accent ${
                  active ? "border-fg bg-fg text-bg" : "border-line text-fg-muted hover:text-fg hover:border-line-strong"
                }`}
              >
                <input type="radio" name={`${id}-chips`} value={o.value} checked={active} onChange={() => onChange(o.value)} className="sr-only" />
                {o.label}
                {typeof o.count === "number" && <span className={`tabular-nums text-[11.5px] ${active ? "opacity-70" : "text-fg-subtle"}`}>{o.count}</span>}
              </label>
            );
          })}
        </div>
      </fieldset>
    </div>
  );
}

/** Non-interactive state label. Tone is always paired with text, never colour alone. */
export function StateBadge({ tone = "neutral", children, title }: { tone?: "success" | "warning" | "accent" | "danger" | "neutral"; children: ReactNode; title?: string }) {
  const tones = {
    success: "text-success bg-success/10 border-success/20",
    warning: "text-warning bg-warning/10 border-warning/25",
    accent: "text-accent bg-accent/10 border-accent/20",
    danger: "text-danger bg-danger/10 border-danger/20",
    neutral: "text-fg-muted bg-surface-2 border-line",
  } as const;
  return (
    <span title={title} className={`inline-flex items-center gap-1.5 h-6 px-2 rounded-md border text-[12px] font-medium whitespace-nowrap ${tones[tone]}`}>
      {tone !== "neutral" && <span aria-hidden="true" className="w-1.5 h-1.5 rounded-full bg-current" />}
      {children}
    </span>
  );
}
