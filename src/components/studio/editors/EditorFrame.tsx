"use client";

import type { ReactNode } from "react";
import SaveBar from "../SaveBar";
import type { SaveState } from "../useSectionEditor";
import { CONTENT_ICON_IDS } from "@/lib/cms/icons";

/** Icon choices for content items (the ids the public pages know how to draw). */
export const ICON_OPTIONS = [{ value: "", label: "No icon" }, ...CONTENT_ICON_IDS.map((id) => ({ value: id, label: id.charAt(0).toUpperCase() + id.slice(1) }))];

/** Groups of fields followed by the editor's sticky save bar. */
export default function EditorFrame({ children, state, message, onSave, onDiscard, viewHref, changedCount }: {
  children: ReactNode;
  state: SaveState;
  message?: string | null;
  onSave: () => void;
  onDiscard: () => void;
  viewHref?: string;
  changedCount?: number;
}) {
  return (
    <form
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        onSave();
      }}
      className="flex flex-col gap-4"
    >
      {children}
      <SaveBar state={state} message={message} onSave={onSave} onDiscard={onDiscard} viewHref={viewHref} changedCount={changedCount} />
    </form>
  );
}
