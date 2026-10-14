"use client";

import { useState } from "react";
import RawinSelect from "./RawinSelect";
import { PROJECT_TONES, TONE_LABELS, TONE_SWATCH, type ProjectTone } from "@/lib/project-tone";

const CUSTOM = "__custom__";

/**
 * Category picker backed by the CMS taxonomy. An existing value that is not in the
 * taxonomy stays selectable (older documents remain valid), and a one-off custom
 * category can be typed. Submits a single `category` field.
 */
export function CategoryField({
  categories,
  defaultValue,
  name = "category",
}: {
  categories: string[];
  defaultValue?: string;
  name?: string;
}) {
  const initial = (defaultValue || categories[0] || "Full Stack").trim();
  const known = categories.some((c) => c === initial);
  const [choice, setChoice] = useState(initial || CUSTOM);
  const [custom, setCustom] = useState("");

  const options = [
    ...categories.map((c) => ({ value: c, label: c })),
    ...(!known && initial ? [{ value: initial, label: initial, badge: "Legacy" }] : []),
    { value: CUSTOM, label: "Custom category…" },
  ];
  const value = choice === CUSTOM ? custom.trim() : choice;

  return (
    <div className="flex flex-col gap-2">
      <RawinSelect name={`${name}Choice`} value={choice} onChange={setChoice} options={options} />
      {choice === CUSTOM && (
        <input
          type="text"
          value={custom}
          onChange={(e) => setCustom(e.target.value)}
          maxLength={50}
          placeholder="e.g. Real-Time Systems"
          className="admin-input"
          aria-label="Custom category name"
          required
        />
      )}
      <input type="hidden" name={name} value={value} />
      <p className="text-[12px] text-fg-subtle">Manage the list under Content → Categories.</p>
    </div>
  );
}

/** Visual tone used for placeholder plates, washes and accents of this project. */
export function ToneField({ defaultValue }: { defaultValue?: string }) {
  const [tone, setTone] = useState<string>(defaultValue && (PROJECT_TONES as readonly string[]).includes(defaultValue) ? defaultValue : "");
  const options: { value: string; label: string; swatch?: ProjectTone }[] = [
    { value: "", label: "Automatic" },
    ...PROJECT_TONES.map((t) => ({ value: t, label: TONE_LABELS[t], swatch: t })),
  ];
  return (
    <fieldset>
      <legend className="text-[11px] sm:text-xs font-mono text-fg-muted uppercase mb-2">Visual tone</legend>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => {
          const active = tone === o.value;
          const sw = o.swatch ? TONE_SWATCH[o.swatch] : null;
          return (
            <button
              key={o.value || "auto"}
              type="button"
              onClick={() => setTone(o.value)}
              aria-pressed={active}
              className={`inline-flex items-center gap-2 h-10 pl-1.5 pr-3.5 rounded-full border text-[13px] transition-colors ${
                active ? "border-accent bg-accent/10 text-fg" : "border-line text-fg-muted hover:text-fg hover:border-line-strong"
              }`}
            >
              <span
                aria-hidden="true"
                className="w-7 h-7 rounded-full border border-line"
                style={{
                  background: sw ? `radial-gradient(circle at 70% 25%, ${sw.c}, transparent 55%), radial-gradient(circle at 20% 90%, ${sw.b}, transparent 60%), ${sw.a}` : "var(--spectrum)",
                }}
              />
              {o.label}
            </button>
          );
        })}
      </div>
      <input type="hidden" name="tone" value={tone} />
      <p className="mt-2 text-[12px] text-fg-subtle">Automatic derives a stable tone from the project slug.</p>
    </fieldset>
  );
}
