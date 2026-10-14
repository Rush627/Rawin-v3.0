/**
 * A tab opened on an older build asks for script chunks that a newer deployment (or a
 * local rebuild) has replaced. Client navigation then fails with a ChunkLoadError, which
 * is not a server fault and cannot be fixed by re-rendering: only a full page load fetches
 * the current build. These helpers detect that case and reload at most once per minute.
 */
const KEY = "rawin-stale-build-reload";

export function isStaleBuildError(error: unknown): boolean {
  const e = error as { name?: string; message?: string } | null;
  if (!e) return false;
  if (e.name === "ChunkLoadError") return true;
  const m = String(e.message || "");
  return /Loading (CSS )?chunk [\w-]+ failed|Failed to fetch dynamically imported module|Importing a module script failed/i.test(m);
}

/** Reload once; returns false (and does nothing) if a reload already happened recently. */
export function reloadForNewBuild(): boolean {
  try {
    const last = Number(sessionStorage.getItem(KEY) || 0);
    if (Date.now() - last < 60_000) return false;
    sessionStorage.setItem(KEY, String(Date.now()));
  } catch {
    // storage unavailable: still reload once (this render)
  }
  window.location.reload();
  return true;
}
