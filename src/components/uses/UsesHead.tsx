import type { ReactNode } from "react";
import MaskText from "@/components/system/MaskText";

/**
 * Section opener for the Uses page: index, eyebrow and hairline on one rule, the display title
 * (one line on phones), and a right-hand annotation column on wide screens so the heading row
 * spans the full grid instead of leaving the right half empty.
 */
export default function UsesHead({
  id,
  index,
  eyebrow,
  lead,
  em,
  note,
  count,
}: {
  id: string;
  index: string;
  eyebrow: string;
  /** Roman part of the title */
  lead: string;
  /** Italic part of the title */
  em: string;
  /** Short annotation shown beside the title on wide screens */
  note?: ReactNode;
  /** Item count shown in the rule, e.g. "06 entries" */
  count?: string;
}) {
  return (
    <header className="uses-head">
      <div className="uses-head-rule label-mono">
        <span className="uses-lav">{index}</span>
        <span aria-hidden="true" className="uses-head-line" />
        <span className="text-fg-muted">{eyebrow}</span>
        {count && <span className="uses-head-count text-fg-subtle">{count}</span>}
      </div>
      <div className="uses-head-body">
        <MaskText
          as="h2"
          id={id}
          className="uses-title text-fg"
          lines={[<span key="a">{lead}</span>, <em key="b" className="italic uses-lav">{em}</em>]}
          phoneInline={{ chars: `${lead} ${em}`.length }}
        />
        {note && <p className="uses-head-note">{note}</p>}
      </div>
    </header>
  );
}
