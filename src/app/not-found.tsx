import Link from "next/link";
import { ArrowLeft, Compass } from "lucide-react";

export default function NotFound() {
  return (
    <div className="w-full min-h-[65vh] flex flex-col items-center justify-center text-center px-4 pt-28 pb-16">
      <div className="glass-panel p-8 sm:p-12 rounded-3xl border border-white/[0.08] max-w-lg flex flex-col items-center gap-6 shadow-2xl">
        <div className="w-14 h-14 rounded-2xl bg-pacific-cyan/10 border border-pacific-cyan/20 flex items-center justify-center text-pacific-cyan shadow-[0_0_20px_rgba(24,155,173,0.3)]">
          <Compass className="w-7 h-7" />
        </div>

        <div className="flex flex-col gap-2">
          <span className="text-xs font-mono text-pacific-cyan uppercase tracking-wider font-semibold">
            Error 404 • Page Not Found
          </span>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground font-space">
            Out of Orbit
          </h1>
          <p className="text-sm text-muted leading-relaxed max-w-sm mt-1">
            The page or route you are attempting to access does not exist or has been refactored in RAWIN 3.0.
          </p>
        </div>

        <Link
          href="/"
          className="flex items-center gap-2 px-6 py-3 rounded-xl bg-pacific-cyan text-ink-black font-semibold text-sm hover:bg-pacific-cyan/90 transition-all shadow-[0_0_20px_rgba(24,155,173,0.3)] mt-2"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Safety</span>
        </Link>
      </div>
    </div>
  );
}
