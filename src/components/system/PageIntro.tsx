import type { ReactNode } from "react";
import MaskText from "./MaskText";

interface PageIntroProps {
  /** Chapter label, e.g. "02 — Projects" */
  index: string;
  eyebrow?: string;
  /** Display lines; use <em> for italic emphasis */
  title: ReactNode[];
  lede?: ReactNode;
  /** Right-hand technical annotations (desktop) — stacks below on smaller screens */
  meta?: { label: string; value: ReactNode }[];
  children?: ReactNode;
  className?: string;
  size?: "xl" | "lg";
  /** Plain text of the title: set it on one line on phones, sized to fit (opt-in, see MaskText) */
  oneLineOnPhone?: string;
  /** Optional desktop artwork beside the title (lg and up; not rendered into the phone layout's flow) */
  aside?: ReactNode;
}

/**
 * Interior-page opener shared by every public route: a running chapter label,
 * an oversized masked headline, a lede and a column of technical annotations.
 */
export default function PageIntro({ index, eyebrow, title, lede, meta, children, className = "", size = "lg", oneLineOnPhone, aside }: PageIntroProps) {
  const lead = meta?.length ? "col-span-12 lg:col-span-9" : aside ? "col-span-12 lg:col-span-7" : "col-span-12";
  return (
    <header
      className={`relative mx-auto w-full max-w-[1600px] px-4 sm:px-6 lg:px-10 pt-[calc(env(safe-area-inset-top)+10.25rem)] sm:pt-[11.25rem] lg:pt-[12.25rem] ${className}`}
    >
      <div className="flex items-center justify-between gap-4 label-mono text-fg-muted mb-8 sm:mb-12">
        <span className="inline-flex items-center gap-3">
          <span className="text-accent">{index}</span>
          {eyebrow && (
            <>
              <span className="h-px w-8 bg-line-strong" />
              <span>{eyebrow}</span>
            </>
          )}
        </span>
        <span aria-hidden="true" className="hidden sm:inline text-fg-subtle">
          RAWIN / v3
        </span>
      </div>

      <div className="grid grid-cols-12 gap-x-4 lg:gap-x-10 gap-y-10">
        <div className={lead}>
          <MaskText
            as="h1"
            immediate
            className={`${size === "xl" ? "display-xl" : "display-lg"} text-fg`}
            lines={title}
            phoneInline={oneLineOnPhone ? { chars: oneLineOnPhone.length } : undefined}
          />
          {lede && (
            <div className="mt-8 sm:mt-10 max-w-[52ch] text-[17px] sm:text-lg leading-relaxed text-fg-muted">{lede}</div>
          )}
        </div>
        {meta && meta.length > 0 && (
          <dl className="col-span-12 lg:col-span-3 lg:self-end grid grid-cols-2 lg:grid-cols-1 gap-x-6 border-t border-line lg:border-t-0">
            {meta.map((m) => (
              <div key={m.label} className="py-3.5 border-b border-line">
                <dt className="label-mono text-fg-subtle">{m.label}</dt>
                <dd className="mt-1.5 text-[15px] text-fg">{m.value}</dd>
              </div>
            ))}
          </dl>
        )}
        {aside && !meta?.length && <div className="hidden lg:flex lg:col-span-5 items-center justify-end min-w-0">{aside}</div>}
      </div>
      {children}
    </header>
  );
}
