import Link from "next/link";
import type { ReactNode } from "react";
import { ChevronLeft } from "lucide-react";

/** Page heading for every studio screen: optional back link, title, one-line description, actions. */
export default function StudioHeader({ eyebrow, title, description, actions, back }: {
  eyebrow?: string;
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
  back?: { href: string; label: string };
}) {
  return (
    <header className="mb-7 sm:mb-9">
      {back && (
        <Link href={back.href} className="inline-flex items-center gap-1 min-h-11 -ml-1.5 pr-2 text-[13.5px] text-fg-muted hover:text-fg">
          <ChevronLeft aria-hidden="true" className="w-4 h-4" />
          {back.label}
        </Link>
      )}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div className="min-w-0">
          {eyebrow && <p className="label-mono text-fg-subtle mb-2">{eyebrow}</p>}
          <h1 className="font-display text-[clamp(2rem,4.2vw,2.9rem)] leading-[1] tracking-[-0.02em] text-fg">{title}</h1>
          {description && <p className="mt-2.5 text-[15px] text-fg-muted max-w-[62ch] leading-relaxed">{description}</p>}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2 shrink-0">{actions}</div>}
      </div>
    </header>
  );
}
