/**
 * Admin editor → server contract. Editors hold plain values (strings, booleans, arrays,
 * objects); a save submits one FormData entry per *changed* key in the format the server's
 * buildSectionPayload() parses: strings as-is, booleans as "true"/"false", everything else as
 * JSON. Unchanged keys are not sent, so a save never rewrites fields nobody touched.
 * Pure (tested against buildSectionPayload in tests/cms-payload.test.ts).
 */

export type EditorValue = unknown;
export type EditorValues = Record<string, unknown>;

/** Stable structural comparison (key order of objects ignored). */
export function sameValue(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (typeof a !== typeof b || a === null || b === null) return false;
  if (Array.isArray(a)) {
    return Array.isArray(b) && a.length === b.length && a.every((v, i) => sameValue(v, b[i]));
  }
  if (typeof a === "object") {
    const ao = a as Record<string, unknown>;
    const bo = b as Record<string, unknown>;
    const keys = new Set([...Object.keys(ao), ...Object.keys(bo)]);
    for (const k of keys) {
      if (ao[k] === undefined && bo[k] === undefined) continue;
      if (!sameValue(ao[k], bo[k])) return false;
    }
    return true;
  }
  return false;
}

/** Keys whose value differs from the initial snapshot. */
export function changedKeys(initial: EditorValues, current: EditorValues): string[] {
  return Object.keys(current).filter((k) => !sameValue(initial[k], current[k]));
}

/** The wire form of one value. */
export function serializeValue(value: EditorValue): string {
  if (typeof value === "string") return value;
  if (typeof value === "boolean") return value ? "true" : "false";
  if (typeof value === "number") return String(value);
  if (value === null || value === undefined) return "";
  return JSON.stringify(value);
}

/** Entries to submit for a save: only the changed keys. */
export function changedEntries(initial: EditorValues, current: EditorValues): [string, string][] {
  return changedKeys(initial, current).map((k) => [k, serializeValue(current[k])]);
}
