/**
 * Route loading state: a hairline spectral scan across the top of the viewport and
 * a small orbit mark. Fades in after a short delay so fast navigations never flash.
 */
export default function Loading() {
  return (
    <div aria-hidden="true" className="rawin-loading fixed inset-0 z-30 pointer-events-none">
      <div className="absolute inset-x-0 top-0 h-[2px] overflow-hidden">
        <div className="rawin-loading-scan h-full w-1/3" style={{ background: "var(--spectrum)" }} />
      </div>
      <div className="absolute right-5 bottom-[max(1.25rem,env(safe-area-inset-bottom))] flex items-center gap-2.5 label-mono text-fg-muted">
        <span className="relative inline-block w-4 h-4">
          <span className="absolute inset-0 rounded-full border border-line-strong" />
          <span className="absolute inset-0 rounded-full border border-transparent border-t-accent animate-spin" />
        </span>
        <span>Loading</span>
      </div>
    </div>
  );
}
