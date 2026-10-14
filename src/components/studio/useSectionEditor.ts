"use client";

import { useCallback, useEffect, useId, useState } from "react";
import { updateSectionAction } from "@/app/saint-denis/content/actions";
import type { EditableSection } from "@/lib/cms/section-payload";
import { changedEntries, changedKeys, type EditorValues } from "@/lib/cms/serialize";
import { useUnsavedChanges } from "./UnsavedChanges";

export type SaveState = "clean" | "dirty" | "saving" | "saved" | "invalid" | "failed";

/**
 * State for one editor bound to one content section. Saves send only the changed keys; the
 * state becomes "saved" only after the server confirms the write. On failure the edits stay
 * in place for a retry, and an error the server attributes to a key is shown on that field.
 */
export function useSectionEditor<T extends EditorValues>(section: EditableSection, initial: T) {
  const key = useId();
  const { setDirty } = useUnsavedChanges();
  const [base, setBase] = useState<T>(initial);
  const [values, setValues] = useState<T>(initial);
  const [phase, setPhase] = useState<"idle" | "saving" | "saved" | "invalid" | "failed">("idle");
  const [message, setMessage] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const changed = changedKeys(base, values);
  const dirty = changed.length > 0;

  useEffect(() => {
    setDirty(key, dirty);
  }, [key, dirty, setDirty]);
  useEffect(() => () => setDirty(key, false), [key, setDirty]);

  const set = useCallback(<K extends keyof T>(field: K, value: T[K]) => {
    setValues((v) => ({ ...v, [field]: value }));
    setErrors((e) => {
      if (!e[field as string]) return e;
      const next = { ...e };
      delete next[field as string];
      return next;
    });
    setPhase((p) => (p === "saved" ? "idle" : p));
  }, []);

  const discard = useCallback(() => {
    setValues(base);
    setErrors({});
    setPhase("idle");
    setMessage(null);
  }, [base]);

  const save = useCallback(async () => {
    const entries = changedEntries(base, values);
    if (!entries.length) return;
    setPhase("saving");
    setMessage(null);
    const fd = new FormData();
    for (const [k, v] of entries) fd.append(k, v);
    try {
      const res = await updateSectionAction(section, null, fd);
      if (res?.success) {
        setBase(values);
        setErrors({});
        setPhase("saved");
        setMessage(null);
        return;
      }
      if (res?.field) {
        setErrors({ [res.field]: res.error || "Check this field." });
        setPhase("invalid");
        setMessage(res.error || null);
      } else {
        setPhase("failed");
        setMessage(res?.error || "The changes could not be saved.");
      }
    } catch {
      setPhase("failed");
      setMessage("The server could not be reached. Your changes are still here; try again.");
    }
  }, [base, section, values]);

  const state: SaveState =
    phase === "saving" ? "saving" : phase === "invalid" ? "invalid" : phase === "failed" ? "failed" : dirty ? "dirty" : phase === "saved" ? "saved" : "clean";

  return { values, set, setValues, save, discard, dirty, changed, state, message, errors };
}
