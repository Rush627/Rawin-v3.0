import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

/**
 * A small, living invitation to Rawin Orbit: a quiet core with one point in slow orbit.
 * Pure CSS motion (no extra GPU context); static under reduced motion.
 * - "bar":  compact row tucked under the phone navbar
 * - "hero": inline signal for the desktop hero meta row
 */
export default function OrbitSignal({ variant = "hero", className = "" }: { variant?: "bar" | "hero"; className?: string }) {
  const bar = variant === "bar";
  return (
    <Link
      href="/ai"
      aria-label="Ask Rawin Orbit, the site's AI assistant"
      className={`orbit-signal group inline-flex items-center gap-2.5 rounded-full transition-colors ${
        bar
          ? "h-9 pl-2 pr-3.5 border border-line bg-surface/70 backdrop-blur-md text-[12.5px] text-fg-muted"
          : "h-8 pl-1.5 pr-3 hover:bg-fg/5 text-[12px] text-fg-muted normal-case tracking-normal font-sans"
      } ${className}`}
    >
      <span aria-hidden="true" className="orbit-signal-mark">
        <span className="orbit-signal-core" />
        <span className="orbit-signal-path">
          <span className="orbit-signal-moon" />
        </span>
      </span>
      <span>
        <span className="text-fg font-medium">Orbit</span>
        <span className="mx-1.5 text-fg-subtle">·</span>
        <span className="group-hover:text-fg transition-colors">Ask about the work</span>
      </span>
      <ArrowUpRight className="w-3.5 h-3.5 text-fg-subtle transition-transform duration-500 group-hover:rotate-45 group-hover:text-accent" />
    </Link>
  );
}
