"use client";

import { useId, useState, type ReactNode, type ButtonHTMLAttributes, type Ref } from "react";
import { ChevronDown, Loader2 } from "lucide-react";

/*
 * RAWIN Studio form primitives. Every control is a native element (or a button with the
 * proper role) with a programmatically associated label, an optional hint and an inline error
 * announced to assistive tech. Styling uses the site tokens only.
 */

const control =
  "w-full min-h-11 rounded-xl bg-surface border border-line-strong px-3.5 py-2.5 text-[15px] text-fg placeholder:text-fg-subtle " +
  "transition-[border-color,box-shadow] hover:border-fg-subtle focus:outline-none focus:border-accent focus:shadow-[0_0_0_3px_color-mix(in_oklab,var(--accent)_18%,transparent)] " +
  "aria-[invalid=true]:border-danger disabled:opacity-60";

interface FieldShellProps {
  id: string;
  label: string;
  hint?: ReactNode;
  error?: string;
  count?: { value: number; max: number };
  children: ReactNode;
  className?: string;
}

/** Label + control + hint/error, wired with ids. */
export function FieldShell({ id, label, hint, error, count, children, className = "" }: FieldShellProps) {
  return (
    <div className={`flex flex-col gap-1.5 min-w-0 ${className}`}>
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={id} className="text-[13px] font-medium text-fg">
          {label}
        </label>
        {count && (
          <span className={`font-mono text-[11px] tabular-nums ${count.value > count.max ? "text-danger" : "text-fg-subtle"}`} aria-hidden="true">
            {count.value}/{count.max}
          </span>
        )}
      </div>
      {children}
      {error ? (
        <p id={`${id}-error`} role="alert" className="text-[12.5px] text-danger">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="text-[12.5px] text-fg-subtle leading-snug">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

function describedBy(id: string, error?: string, hint?: ReactNode) {
  return error ? `${id}-error` : hint ? `${id}-hint` : undefined;
}

interface TextProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  hint?: ReactNode;
  error?: string;
  placeholder?: string;
  maxLength?: number;
  type?: "text" | "email" | "url" | "tel" | "date" | "datetime-local";
  multiline?: boolean;
  rows?: number;
  className?: string;
  inputMode?: "text" | "email" | "url" | "tel" | "numeric";
  autoComplete?: string;
  disabled?: boolean;
}

/** Text input or textarea. Shows a character count when maxLength is set. */
export function TextField({ label, value, onChange, hint, error, placeholder, maxLength, type = "text", multiline, rows = 3, className, inputMode, autoComplete, disabled }: TextProps) {
  const id = useId();
  const shared = {
    id,
    value: value ?? "",
    placeholder,
    disabled,
    "aria-invalid": error ? true : undefined,
    "aria-describedby": describedBy(id, error, hint),
    onChange: (e: { target: { value: string } }) => onChange(e.target.value),
    className: control,
  };
  return (
    <FieldShell id={id} label={label} hint={hint} error={error} className={className} count={maxLength ? { value: (value ?? "").length, max: maxLength } : undefined}>
      {multiline ? (
        <textarea {...shared} rows={rows} className={`${control} resize-y leading-relaxed`} />
      ) : (
        <input {...shared} type={type} inputMode={inputMode} autoComplete={autoComplete ?? "off"} />
      )}
    </FieldShell>
  );
}

/** Number input for precise values (use Slider for a meaningful range). */
export function NumberField({ label, value, onChange, min, max, step = 1, hint, error, className }: {
  label: string; value: number; onChange: (v: number) => void; min?: number; max?: number; step?: number; hint?: ReactNode; error?: string; className?: string;
}) {
  const id = useId();
  return (
    <FieldShell id={id} label={label} hint={hint} error={error} className={className}>
      <input
        id={id}
        type="number"
        inputMode="decimal"
        value={Number.isFinite(value) ? value : ""}
        min={min}
        max={max}
        step={step}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, error, hint)}
        onChange={(e) => onChange(e.target.value === "" ? NaN : Number(e.target.value))}
        className={`${control} tabular-nums`}
      />
    </FieldShell>
  );
}

/** Native select (reliable on phones and with assistive tech). */
export function SelectField<T extends string>({ label, value, onChange, options, hint, error, className }: {
  label: string; value: T; onChange: (v: T) => void; options: { value: T; label: string }[]; hint?: ReactNode; error?: string; className?: string;
}) {
  const id = useId();
  return (
    <FieldShell id={id} label={label} hint={hint} error={error} className={className}>
      <div className="relative">
        <select
          id={id}
          value={value}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy(id, error, hint)}
          onChange={(e) => onChange(e.target.value as T)}
          className={`${control} appearance-none pr-10 cursor-pointer`}
        >
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <ChevronDown aria-hidden="true" className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-fg-muted" />
      </div>
    </FieldShell>
  );
}

/** On/off setting: a button with role="switch". */
export function Switch({ label, checked, onChange, hint, disabled }: { label: string; checked: boolean; onChange: (v: boolean) => void; hint?: ReactNode; disabled?: boolean }) {
  const id = useId();
  return (
    <div className="flex items-start justify-between gap-4 py-1">
      <div className="min-w-0">
        <span id={`${id}-label`} className="block text-[14px] text-fg">
          {label}
        </span>
        {hint && (
          <span id={`${id}-hint`} className="block mt-0.5 text-[12.5px] text-fg-subtle leading-snug">
            {hint}
          </span>
        )}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-labelledby={`${id}-label`}
        aria-describedby={hint ? `${id}-hint` : undefined}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`relative shrink-0 mt-0.5 w-12 h-7 rounded-full border transition-colors disabled:opacity-50 ${
          checked ? "bg-accent border-accent" : "bg-surface-2 border-line-strong"
        }`}
      >
        <span
          aria-hidden="true"
          className={`absolute top-1/2 -translate-y-1/2 w-5 h-5 rounded-full shadow-[var(--shadow-1)] transition-[left,background-color] ${
            checked ? "left-[24px] bg-accent-fg" : "left-[3px] bg-fg-muted"
          }`}
        />
        <span className="sr-only">{checked ? "On" : "Off"}</span>
      </button>
    </div>
  );
}

/** A small set of mutually exclusive options (radio group). */
export function Segmented<T extends string>({ label, value, onChange, options, hint }: {
  label: string; value: T; onChange: (v: T) => void; options: { value: T; label: string; tone?: string }[]; hint?: ReactNode;
}) {
  const id = useId();
  return (
    <fieldset className="flex flex-col gap-1.5 min-w-0" aria-describedby={hint ? `${id}-hint` : undefined}>
      <legend className="text-[13px] font-medium text-fg mb-1.5">{label}</legend>
      <div className="flex flex-wrap gap-1.5 p-1 rounded-2xl bg-surface-2/70 border border-line w-full sm:w-fit">
        {options.map((o) => {
          const active = o.value === value;
          return (
            <label
              key={o.value}
              className={`relative flex-1 sm:flex-none inline-flex items-center justify-center gap-2 min-h-10 px-3.5 rounded-xl text-[13.5px] cursor-pointer transition-colors has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-accent ${
                active ? "bg-surface text-fg shadow-[var(--shadow-1)] border border-line" : "text-fg-muted hover:text-fg border border-transparent"
              }`}
            >
              <input type="radio" name={id} value={o.value} checked={active} onChange={() => onChange(o.value)} className="sr-only" />
              {o.tone && <span aria-hidden="true" className={`w-2 h-2 rounded-full bg-current ${o.tone}`} />}
              {o.label}
            </label>
          );
        })}
      </div>
      {hint && (
        <p id={`${id}-hint`} className="text-[12.5px] text-fg-subtle">
          {hint}
        </p>
      )}
    </fieldset>
  );
}

/** Range slider for genuine stepped ranges, with the value spoken and shown. */
export function Slider({ label, value, onChange, min, max, step, format }: {
  label: string; value: number; onChange: (v: number) => void; min: number; max: number; step: number; format: (v: number) => string;
}) {
  const id = useId();
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between">
        <label htmlFor={id} className="text-[13px] font-medium text-fg">
          {label}
        </label>
        <output htmlFor={id} className="font-mono text-[12.5px] text-fg-muted tabular-nums">
          {format(value)}
        </output>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        aria-valuetext={format(value)}
        onChange={(e) => onChange(Number(e.target.value))}
        className="studio-range w-full"
      />
    </div>
  );
}

type ButtonTone = "primary" | "secondary" | "ghost" | "danger";
const tones: Record<ButtonTone, string> = {
  primary: "bg-fg text-bg hover:opacity-90 border border-fg",
  secondary: "bg-surface text-fg border border-line-strong hover:border-fg-subtle",
  ghost: "text-fg-muted hover:text-fg hover:bg-surface-2/70 border border-transparent",
  danger: "bg-danger text-white border border-danger hover:opacity-90",
};

export function Button({ tone = "secondary", busy, children, className = "", ref, ...rest }: ButtonHTMLAttributes<HTMLButtonElement> & { tone?: ButtonTone; busy?: boolean; ref?: Ref<HTMLButtonElement> }) {
  return (
    <button
      ref={ref}
      type="button"
      {...rest}
      disabled={rest.disabled || busy}
      aria-busy={busy || undefined}
      className={`inline-flex items-center justify-center gap-2 min-h-11 px-4 rounded-xl text-[14px] font-medium transition-[opacity,background-color,border-color,color] disabled:opacity-50 disabled:cursor-not-allowed ${tones[tone]} ${className}`}
    >
      {busy && <Loader2 aria-hidden="true" className="w-4 h-4 animate-spin" />}
      {children}
    </button>
  );
}

/**
 * A titled group of fields that can be collapsed. Open state is local (not persisted), so
 * server and client always render the same markup.
 */
export function Group({ title, description, defaultOpen = true, children, actions, badge }: {
  title: string; description?: ReactNode; defaultOpen?: boolean; children: ReactNode; actions?: ReactNode; badge?: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const id = useId();
  return (
    <section className="rounded-2xl border border-line bg-surface/70" aria-labelledby={`${id}-title`}>
      <div className="flex items-center gap-3 px-4 sm:px-5">
        <button
          type="button"
          aria-expanded={open}
          aria-controls={`${id}-panel`}
          onClick={() => setOpen((o) => !o)}
          className="flex-1 min-w-0 flex items-center gap-3 min-h-14 py-3 text-left"
        >
          <ChevronDown aria-hidden="true" className={`w-4 h-4 shrink-0 text-fg-muted transition-transform ${open ? "" : "-rotate-90"}`} />
          <span className="min-w-0">
            <span id={`${id}-title`} className="flex items-center gap-2 text-[15px] font-semibold text-fg">
              {title}
              {badge}
            </span>
            {description && <span className="block mt-0.5 text-[12.5px] text-fg-subtle font-normal">{description}</span>}
          </span>
        </button>
        {actions}
      </div>
      <div id={`${id}-panel`} hidden={!open} className="px-4 sm:px-5 pb-5 pt-1 border-t border-line">
        <div className="pt-4 flex flex-col gap-5">{children}</div>
      </div>
    </section>
  );
}

/** Two columns from tablet up, one on phones. */
export function FieldGrid({ children, cols = 2 }: { children: ReactNode; cols?: 2 | 3 }) {
  return <div className={`grid grid-cols-1 gap-4 sm:gap-5 ${cols === 3 ? "md:grid-cols-3" : "md:grid-cols-2"}`}>{children}</div>;
}

/** Status text that does not rely on colour alone (it always carries a word). */
export function StatusLine({ tone, children }: { tone: "ok" | "warn" | "error" | "muted"; children: ReactNode }) {
  const map = { ok: "text-success", warn: "text-warning", error: "text-danger", muted: "text-fg-subtle" };
  return (
    <span className={`inline-flex items-center gap-2 text-[13px] ${map[tone]}`}>
      <span aria-hidden="true" className="w-1.5 h-1.5 rounded-full bg-current" />
      <span className="text-fg-muted">{children}</span>
    </span>
  );
}
