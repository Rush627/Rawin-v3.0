"use client";

import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import Link from "next/link";

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export default function MarkdownRenderer({ content, className = "" }: MarkdownRendererProps) {
  return (
    <div className={`prose-rawin flex flex-col min-w-0 max-w-full ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ node, ...props }) => (
            <h1 className="text-2xl sm:text-3xl font-bold font-space text-foreground mt-8 mb-4 tracking-tight" {...props} />
          ),
          h2: ({ node, ...props }) => (
            <h2 className="text-xl sm:text-2xl font-bold font-space text-foreground mt-7 mb-3 tracking-tight border-b border-white/[0.06] pb-2" {...props} />
          ),
          h3: ({ node, ...props }) => (
            <h3 className="text-lg sm:text-xl font-bold font-space text-foreground mt-6 mb-2 tracking-tight" {...props} />
          ),
          h4: ({ node, ...props }) => (
            <h4 className="text-base sm:text-lg font-bold font-space text-foreground mt-4 mb-2 tracking-tight" {...props} />
          ),
          p: ({ node, ...props }) => (
            <p className="text-sm sm:text-base text-muted/90 leading-relaxed mb-4" {...props} />
          ),
          ul: ({ node, ...props }) => (
            <ul className="list-disc list-outside ml-5 space-y-1.5 mb-4 text-sm sm:text-base text-muted/90" {...props} />
          ),
          ol: ({ node, ...props }) => (
            <ol className="list-decimal list-outside ml-5 space-y-1.5 mb-4 text-sm sm:text-base text-muted/90" {...props} />
          ),
          li: ({ node, ...props }) => (
            <li className="leading-relaxed" {...props} />
          ),
          blockquote: ({ node, ...props }) => (
            <blockquote className="border-l-2 border-apricot-cream/70 pl-4 py-1.5 my-5 text-sm sm:text-base italic text-foreground/80 bg-white/[0.02] rounded-r-xl" {...props} />
          ),
          hr: ({ node, ...props }) => (
            <hr className="border-white/[0.08] my-8" {...props} />
          ),
          a: ({ node, href, children, ...props }) => {
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
                <span className="text-muted/60 underline cursor-not-allowed" title="Blocked unsafe link">
                  {children}
                </span>
              );
            }

            const isExternal =
              lowerHref.startsWith("http://") ||
              lowerHref.startsWith("https://") ||
              lowerHref.startsWith("//") ||
              lowerHref.startsWith("mailto:");

            if (isExternal && rawHref) {
              return (
                <a
                  href={rawHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-pacific-cyan hover:underline transition-colors"
                  {...props}
                >
                  {children}
                </a>
              );
            }

            return (
              <Link
                href={rawHref || "#"}
                className="text-pacific-cyan hover:underline transition-colors"
                {...props}
              >
                {children}
              </Link>
            );
          },
          table: ({ node, ...props }) => (
            <div className="overflow-x-auto my-6 rounded-xl border border-white/[0.08]">
              <table className="w-full text-left text-xs sm:text-sm font-mono" {...props} />
            </div>
          ),
          thead: ({ node, ...props }) => (
            <thead className="bg-white/[0.03] border-b border-white/[0.08] text-muted uppercase text-[11px] tracking-wider" {...props} />
          ),
          tbody: ({ node, ...props }) => (
            <tbody className="divide-y divide-white/[0.04]" {...props} />
          ),
          tr: ({ node, ...props }) => (
            <tr className="hover:bg-white/[0.01] transition-colors" {...props} />
          ),
          th: ({ node, ...props }) => (
            <th className="px-4 py-3 font-semibold text-foreground" {...props} />
          ),
          td: ({ node, ...props }) => (
            <td className="px-4 py-3 text-muted/90" {...props} />
          ),
          code: ({ node, className, children, ...props }: any) => {
            const isCodeBlock = Boolean(className) || (typeof children === "string" && children.includes("\n"));
            if (isCodeBlock) {
              return (
                <div className="my-5 rounded-xl overflow-hidden border border-white/[0.08] bg-ink-black/80 shadow-lg">
                  <div className="flex items-center justify-between px-4 py-2 border-b border-white/[0.06] bg-white/[0.02] text-[11px] font-mono text-muted/60">
                    <span>{className ? className.replace("language-", "") : "code"}</span>
                  </div>
                  <pre className="p-4 overflow-x-auto text-xs sm:text-sm font-mono leading-relaxed text-foreground/90">
                    <code className={className} {...props}>
                      {children}
                    </code>
                  </pre>
                </div>
              );
            }
            return (
              <code className="px-1.5 py-0.5 rounded bg-white/[0.06] text-pacific-cyan text-xs font-mono border border-white/[0.08] break-words" {...props}>
                {children}
              </code>
            );
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
