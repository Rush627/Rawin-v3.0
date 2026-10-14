import type { ReactNode } from "react";
import MaskText from "./MaskText";

interface SectionHeadProps {
  index?: string;
  eyebrow: string;
  /** Lines of the display heading; use <em> for italic emphasis */
  title: ReactNode[];
  aside?: ReactNode;
  className?: string;
  size?: "lg" | "md";
  id?: string;
  /** Plain text of the title: set it on one line on phones, sized to fit (see MaskText) */
  oneLineOnPhone?: string;
}

/** Editorial section opener: indexed eyebrow, masked display title, optional aside. */
export default function SectionHead({ index, eyebrow, title, aside, className = "", size = "md", id, oneLineOnPhone }: SectionHeadProps) {
  return (
    <header id={id} className={`grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 lg:gap-10 items-end ${className}`}>
      <div className="lg:col-span-8">
        <div className="flex items-center gap-3 mb-4 sm:mb-6 lg:mb-8">
          {index && <span className="font-mono text-[11px] text-accent">{index}</span>}
          <span className="h-px w-8 bg-line-strong" />
          <span className="label-mono text-fg-muted">{eyebrow}</span>
        </div>
        <MaskText
          as="h2"
          className={`${size === "lg" ? "display-lg" : "display-md"} text-fg`}
          lines={title}
          phoneInline={oneLineOnPhone ? { chars: oneLineOnPhone.length } : undefined}
        />
      </div>
      {aside && <div className="lg:col-span-4 lg:pb-3 type-lede">{aside}</div>}
    </header>
  );
}
