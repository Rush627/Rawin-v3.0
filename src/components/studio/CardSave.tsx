"use client";

import { Check } from "lucide-react";
import { Button } from "./fields";
import type { SaveState } from "./useSectionEditor";

const COPY: Record<SaveState, string> = {
  clean: "",
  dirty: "Unsaved changes",
  saving: "Saving…",
  saved: "Saved",
  invalid: "Fix the highlighted field",
  failed: "Not saved",
};

/** Inline save row for small settings cards (several on one page, so not sticky). */
export default function CardSave({ state, message, onSave, onDiscard, saveLabel = "Save" }: {
  state: SaveState;
  message?: string | null;
  onSave: () => void;
  onDiscard?: () => void;
  saveLabel?: string;
}) {
  const dirty = state === "dirty" || state === "invalid" || state === "failed";
  return (
    <div className="flex flex-wrap items-center justify-end gap-2 pt-2 border-t border-line">
      <p aria-live="polite" className={`mr-auto flex items-center gap-1.5 text-[13px] ${state === "failed" || state === "invalid" ? "text-danger" : state === "saved" ? "text-success" : "text-fg-muted"}`}>
        {state === "saved" && <Check aria-hidden="true" className="w-4 h-4" />}
        {(state === "failed" || state === "invalid") && message ? message : COPY[state]}
      </p>
      {dirty && onDiscard && (
        <Button tone="ghost" onClick={onDiscard}>
          Discard
        </Button>
      )}
      <Button tone="primary" onClick={onSave} busy={state === "saving"} disabled={!dirty}>
        {saveLabel}
      </Button>
    </div>
  );
}
