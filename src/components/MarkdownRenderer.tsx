"use client";

import React, { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import Link from "next/link";
import { Check, Copy } from "lucide-react";

interface MarkdownRendererProps {
  content: string;
  className?: string;
  /** Dense variant used inside Rawin Orbit responses */
  compact?: boolean;
  /**
   * Article mode: an editorial figure placed at a natural break in the text (before the second
   * major section, or before the only one; appended when the article has no sections).
   */
  figure?: React.ReactNode;
}

/** Callout markers (GitHub alert syntax, e.g. "> [!NOTE]") the article renderer understands. */
const CALLOUT = /^\s*\[!(NOTE|TIP|IMPORTANT|WARNING|PRINCIPLE|FIELD[ -]NOTE)\]\s*/i;
const CALLOUT_LABEL: Record<string, string> = {
  NOTE: "Note",
  TIP: "Tip",
  IMPORTANT: "Important",
  WARNING: "Caution",
  PRINCIPLE: "Design principle",
  "FIELD NOTE": "Field note",
  "FIELD-NOTE": "Field note",
};

/** URL-safe heading id. */
function slugify(text: string) {
  return (
    text
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 64) || "section"
  );
}

/**
 * Section headings (## and ###) in the source, ignoring fenced code: their source line and a
 * unique id. Computed once per render from the text alone, so ids are stable and the contents
 * list, links and renderer always agree.
 */
function outline(md: string) {
  const byLine = new Map<number, string>();
  const majors: number[] = [];
  const used = new Map<string, number>();
  let fenced = false;
  md.split(/\r?\n/).forEach((line, i) => {
    if (/^\s*(```|~~~)/.test(line)) {
      fenced = !fenced;
      return;
    }
    const m = !fenced && line.match(/^(#{2,3})\s+(.+?)\s*#*\s*$/);
    if (!m) return;
    const base = slugify(m[2].replace(/[*_`[\]]/g, ""));
    const n = used.get(base) ?? 0;
    used.set(base, n + 1);
    byLine.set(i + 1, n ? `${base}-${n + 1}` : base);
    if (m[1] === "##") majors.push(i + 1);
  });
  return { byLine, majors };
}

/** react-markdown passes its hast `node`; keep it off the DOM. */
function attrs<T extends { node?: unknown }>(props: T): Omit<T, "node"> {
  const { node, ...rest } = props;
  void node;
  return rest;
}

function textOf(node: React.ReactNode): string {
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(textOf).join("");
  if (React.isValidElement<{ children?: React.ReactNode }>(node)) return textOf(node.props.children);
  return "";
}

function CodeBlock({ language, children, compact }: { language: string; children: React.ReactNode; compact: boolean }) {
  const [copied, setCopied] = useState(false);
  return (
    <figure className={`group/code relative ${compact ? "my-3" : "article-code"} min-w-0 max-w-full rounded-2xl overflow-hidden border border-line bg-sunken`}>
      <figcaption className="flex items-center justify-between gap-3 px-4 h-10 border-b border-line">
        <span className="flex items-center gap-2 label-mono text-fg-subtle">
          <span aria-hidden="true" className="w-1.5 h-1.5 rounded-full bg-accent" />
          {language || "code"}
        </span>
        <button
          type="button"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(textOf(children).replace(/\n$/, ""));
              setCopied(true);
              window.setTimeout(() => setCopied(false), 1600);
            } catch {
              // clipboard unavailable
            }
          }}
          className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-full label-mono text-fg-subtle hover:text-fg hover:bg-surface-2 transition-colors"
          aria-label={copied ? "Copied" : "Copy code"}
        >
          {copied ? <Check className="w-3 h-3 text-success" /> : <Copy className="w-3 h-3" />}
          <span>{copied ? "Copied" : "Copy"}</span>
        </button>
      </figcaption>
      <pre
        className={`overflow-x-auto font-mono text-fg leading-relaxed ${
          compact ? "p-3 text-[12px]" : "p-5 text-[13px] sm:text-sm"
        }`}
      >
        {children}
      </pre>
    </figure>
  );
}

export default function MarkdownRenderer({ content, className = "", compact = false, figure }: MarkdownRendererProps) {
  // Article mode is styled by the article-* classes (globals.css: one place for the reading
  // typography and heading hierarchy); compact mode (Rawin Orbit) keeps its utility classes.
  const body = compact ? "text-[14px] leading-relaxed text-fg" : "article-text";

  // Heading ids and the figure's place, derived from the article's own structure
  const { byLine, majors } = outline(content);
  const lineOf = (node: unknown) => (node as { position?: { start?: { line?: number } } } | undefined)?.position?.start?.line ?? -1;
  const headingId = (node: unknown, children: React.ReactNode) => byLine.get(lineOf(node)) ?? slugify(textOf(children));
  // before the second major section (or the only one); appended when there are none
  const figureLine = figure && !compact ? (majors[1] ?? majors[0] ?? 0) : 0;

  return (
    <div className={`prose-rawin flex flex-col min-w-0 max-w-full ${compact ? "" : "article-prose"} ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: (p) => (
            <h1
              className={
                compact
                  ? "font-display text-xl text-fg mt-3 mb-1.5"
                  : "article-h1 font-display"
              }
              {...attrs(p)}
            />
          ),
          h2: (p) => {
            if (compact) return <h2 className="font-display text-lg text-fg mt-3 mb-1" {...attrs(p)} />;
            const heading = <h2 id={headingId(p.node, p.children)} className="article-h2 font-display" {...attrs(p)} />;
            return figureLine && lineOf(p.node) === figureLine ? (
              <>
                {figure}
                {heading}
              </>
            ) : (
              heading
            );
          },
          h3: (p) =>
            compact ? (
              <h3 className="text-[15px] font-semibold text-fg mt-2.5 mb-1" {...attrs(p)} />
            ) : (
              <h3 id={headingId(p.node, p.children)} className="article-h3" {...attrs(p)} />
            ),
          h4: (p) => (
            <h4 className={compact ? "text-[14px] font-semibold text-fg mt-2 mb-0.5" : "article-h4"} {...attrs(p)} />
          ),
          p: (p) => {
            // a callout's first paragraph starts with its marker: drop the marker from the text
            const kids = React.Children.toArray(p.children);
            if (!compact && typeof kids[0] === "string" && CALLOUT.test(kids[0])) {
              kids[0] = kids[0].replace(CALLOUT, "");
              return <p className={`${body} article-p`}>{kids}</p>;
            }
            return <p className={`${body} ${compact ? "mb-2.5 last:mb-0" : "article-p"}`} {...attrs(p)} />;
          },
          strong: (p) => <strong className="font-semibold text-fg" {...attrs(p)} />,
          em: (p) => <em className="italic" {...attrs(p)} />,
          ul: (p) => (
            <ul
              className={`${body} ${compact ? "mb-2.5 space-y-1 pl-4" : "article-list"} list-none [&>li]:relative [&>li]:before:absolute [&>li]:before:-left-4 [&>li]:before:top-[0.75em] [&>li]:before:w-2 [&>li]:before:h-px [&>li]:before:bg-accent`}
              {...attrs(p)}
            />
          ),
          ol: (p) => (
            <ol
              className={`${body} ${compact ? "mb-2.5 space-y-1 pl-5" : "article-list article-list-ol"} list-decimal marker:font-mono marker:text-[0.8em] marker:text-accent`}
              {...attrs(p)}
            />
          ),
          li: (p) => <li className="pl-1" {...attrs(p)} />,
          blockquote: (p) => {
            if (compact) return <blockquote className="border-l-2 border-accent pl-3 my-3 italic text-fg" {...attrs(p)} />;
            // "> [!NOTE] …" style blocks become labelled callouts; every other quote is a pull quote
            const marker = textOf(p.children).match(CALLOUT);
            if (marker) {
              const key = marker[1].toUpperCase();
              return (
                <aside className="article-callout" data-kind={key.replace(/[ -]/g, "").toLowerCase()} aria-label={CALLOUT_LABEL[key] || "Note"}>
                  <span className="article-callout-label label-mono">{CALLOUT_LABEL[key] || "Note"}</span>
                  {p.children}
                </aside>
              );
            }
            return (
              <blockquote
                className="article-quote font-display italic [&_p]:font-display [&_p]:text-inherit [&_p]:leading-inherit [&_p]:text-fg [&_p]:mb-0"
                {...attrs(p)}
              />
            );
          },
          hr: () =>
            compact ? (
              <hr className="border-line my-3" />
            ) : (
              <div role="separator" className="article-rule flex items-center justify-center gap-3 text-accent" aria-hidden="true">
                <span className="h-px w-16 bg-line-strong" />
                <span className="text-sm">✦</span>
                <span className="h-px w-16 bg-line-strong" />
              </div>
            ),
          a: ({ node, href, children, ...props }) => {
            void node;
            const rawHref = (href || "").trim();
            const lowerHref = rawHref.toLowerCase();

            // Explicitly block dangerous script execution protocols
            const isUnsafe =
              lowerHref.startsWith("javascript:") ||
              lowerHref.startsWith("vbscript:") ||
              lowerHref.startsWith("data:") ||
              lowerHref.startsWith("file:");

            if (isUnsafe) {
              return (
                <span className="text-fg-subtle underline cursor-not-allowed" title="Blocked unsafe link">
                  {children}
                </span>
              );
            }

            const isExternal =
              lowerHref.startsWith("http://") ||
              lowerHref.startsWith("https://") ||
              lowerHref.startsWith("//") ||
              lowerHref.startsWith("mailto:");

            const linkClass =
              "text-fg underline decoration-accent decoration-1 underline-offset-[0.2em] hover:decoration-2 hover:text-accent transition-colors";

            if (isExternal && rawHref) {
              return (
                <a href={rawHref} target="_blank" rel="noopener noreferrer" className={linkClass} {...props}>
                  {children}
                </a>
              );
            }

            return (
              <Link href={rawHref || "#"} className={linkClass} {...props}>
                {children}
              </Link>
            );
          },
          table: (p) => (
            <div className={`overflow-x-auto ${compact ? "my-3" : "my-8"} rounded-2xl border border-line`}>
              <table className="w-full text-left text-[13px] sm:text-sm" {...attrs(p)} />
            </div>
          ),
          thead: (p) => <thead className="bg-surface-2 border-b border-line" {...attrs(p)} />,
          tbody: (p) => <tbody className="divide-y divide-line" {...attrs(p)} />,
          tr: (p) => <tr className="hover:bg-surface-2/60 transition-colors" {...attrs(p)} />,
          th: (p) => <th className="px-4 py-3 label-mono text-fg" {...attrs(p)} />,
          td: (p) => <td className="px-4 py-3 text-fg-muted align-top" {...attrs(p)} />,
          pre: ({ children }) => <>{children}</>,
          code: ({ node, className, children, ...props }: React.ComponentPropsWithoutRef<"code"> & { node?: unknown }) => {
            void node;
            const isCodeBlock = Boolean(className) || (typeof children === "string" && children.includes("\n"));
            if (isCodeBlock) {
              return (
                <CodeBlock language={className ? String(className).replace("language-", "") : ""} compact={compact}>
                  <code className={className} {...props}>
                    {children}
                  </code>
                </CodeBlock>
              );
            }
            return (
              <code
                className="px-1.5 py-0.5 rounded-md bg-surface-2 border border-line text-accent font-mono text-[0.86em] break-words"
                {...props}
              >
                {children}
              </code>
            );
          },
        }}
      >
        {content}
      </ReactMarkdown>
      {figure && !compact && figureLine === 0 && figure}
    </div>
  );
}
