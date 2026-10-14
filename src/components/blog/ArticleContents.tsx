"use client";

import { useEffect, useState } from "react";

interface Entry {
  id: string;
  text: string;
  level: 2 | 3;
}

/**
 * Article contents, built from the headings actually rendered in the article body (so it can
 * never disagree with the content), with the current section highlighted by one
 * IntersectionObserver. Renders nothing for articles without sections.
 *
 * variant "rail": the desktop sticky list. variant "inline": a collapsible list for phones and
 * tablets (a native <details>, so it works with keyboards and screen readers out of the box).
 */
export default function ArticleContents({ bodyId, variant }: { bodyId: string; variant: "rail" | "inline" }) {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [active, setActive] = useState<string | null>(null);

  useEffect(() => {
    const body = document.getElementById(bodyId);
    if (!body) return;
    const heads = Array.from(body.querySelectorAll<HTMLElement>("h2[id], h3[id]"));
    const raf = requestAnimationFrame(() =>
      setEntries(heads.map((h) => ({ id: h.id, text: h.textContent?.trim() || "", level: h.tagName === "H2" ? 2 : 3 })))
    );
    if (!heads.length || typeof IntersectionObserver === "undefined") return () => cancelAnimationFrame(raf);
    const io = new IntersectionObserver(
      () => {
        // the last heading that has passed the reading line is the current section
        const line = window.innerHeight * 0.3;
        let current: string | null = null;
        for (const h of heads) if (h.getBoundingClientRect().top <= line) current = h.id;
        setActive((prev) => (prev === (current ?? heads[0].id) ? prev : (current ?? heads[0].id)));
      },
      { rootMargin: "0px 0px -70% 0px", threshold: [0, 1] }
    );
    heads.forEach((h) => io.observe(h));
    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
    };
  }, [bodyId]);

  if (entries.filter((e) => e.level === 2).length < 2) return null;

  const list = (
    <ol className="article-toc-list">
      {entries.map((e) => (
        <li key={e.id} data-level={e.level}>
          <a href={`#${e.id}`} aria-current={active === e.id ? "location" : undefined}>
            {e.text}
          </a>
        </li>
      ))}
    </ol>
  );

  if (variant === "inline") {
    return (
      <details className="article-toc article-toc-inline">
        <summary>
          <span className="label-mono">In this entry</span>
          <span className="label-mono text-fg-subtle">{entries.filter((e) => e.level === 2).length} sections</span>
        </summary>
        <nav aria-label="Article contents">{list}</nav>
      </details>
    );
  }
  return (
    <nav aria-label="Article contents" className="article-toc article-toc-rail">
      <p className="label-mono text-fg-subtle">In this entry</p>
      {list}
    </nav>
  );
}
