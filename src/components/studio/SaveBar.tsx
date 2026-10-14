"use client";

import { ArrowUpRight, Check } from "lucide-react";
import { Button } from "./fields";
import type { SaveState } from "./useSectionEditor";

const COPY: Record<SaveState, string> = {
  clean: "No unsaved changes",
  dirty: "Unsaved changes",
  saving: "Saving…",
  saved: "Saved",
  invalid: "Fix the highlighted field",
  failed: "Not saved",
};

/**
 * Sticky save bar for an editor. Sits above the phone tab bar (and the iPhone home indicator);
 * on desktop it floats at the bottom of the content column. The status is always worded,
 * never colour-only, and announced politely.
 */
export default function SaveBar({ state, message, onSave, onDiscard, viewHref, changedCount }: {
  state: SaveState;
  message?: string | null;
  onSave: () => void;
  onDiscard: () => void;
  viewHref?: string;
  changedCount?: number;
}) {
  const dirty = state === "dirty" || state === "invalid" || state === "failed";
  const tone =
    state === "failed" || state === "invalid" ? "text-danger" : state === "saved" ? "text-success" : dirty ? "text-warning" : "text-fg-subtle";
  return (
    // phones: only while there is something to report, so the bar never covers a clean form
    <div className={`studio-savebar sticky z-30 mt-8 bottom-[calc(4.75rem+env(safe-area-inset-bottom))] lg:bottom-5 ${state === "clean" ? "max-lg:hidden" : ""}`}>
      <div className="flex items-center gap-3 rounded-2xl border border-line bg-bg-raised/95 backdrop-blur px-3.5 sm:px-4 py-2.5 shadow-[var(--shadow-2)]">
        <div className="flex-1 min-w-0" aria-live="polite">
          <p className={`flex items-center gap-2 text-[13.5px] font-medium ${tone}`}>
            {state === "saved" ? <Check aria-hidden="true" className="w-4 h-4" /> : <span aria-hidden="true" className="w-2 h-2 rounded-full bg-current" />}
            <span>
              {COPY[state]}
              {state === "dirty" && changedCount ? ` · ${changedCount} field${changedCount === 1 ? "" : "s"}` : ""}
            </span>
          </p>
          {message && (state === "failed" || state === "invalid") && <p className="mt-0.5 text-[12.5px] text-fg-muted truncate">{message}</p>}
        </div>
        {viewHref && !dirty && (
          <a href={viewHref} target="_blank" rel="noopener noreferrer" className="hidden sm:inline-flex items-center gap-1.5 min-h-11 px-3 rounded-xl text-[13.5px] text-fg-muted hover:text-fg">
            View on site
            <ArrowUpRight aria-hidden="true" className="w-3.5 h-3.5" />
          </a>
        )}
        {dirty && (
          <Button tone="ghost" onClick={onDiscard}>
            Discard
          </Button>
        )}
        <Button tone="primary" onClick={onSave} busy={state === "saving"} disabled={!dirty}>
          Save
        </Button>
      </div>
    </div>
  );
}
