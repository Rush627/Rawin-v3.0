"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { MOTIF_DESCRIPTION, MOTIF_LABEL, type Motif } from "./motifs";

/**
 * An original editorial diagram for an article (SVG, theme-aware through the Blog palette).
 * Lines draw in once when the figure enters view (one IntersectionObserver, disconnected after
 * it fires); under reduced motion the figure is simply shown complete.
 */
export default function EditorialFigure({ motif, caption }: { motif: Motif; caption?: string }) {
  const ref = useRef<HTMLElement | null>(null);
  const [seen, setSeen] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    // reduced motion: the CSS shows the figure complete, nothing to observe
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (typeof IntersectionObserver === "undefined") {
      const raf = requestAnimationFrame(() => setSeen(true));
      return () => cancelAnimationFrame(raf);
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setSeen(true);
          io.disconnect();
        }
      },
      { rootMargin: "0px 0px -15% 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const description = caption?.trim() || MOTIF_DESCRIPTION[motif];
  return (
    <figure ref={ref} className="editorial-figure" data-seen={seen ? "" : undefined} data-motif={motif}>
      <div className="editorial-figure-plate">
        <svg viewBox="0 0 800 360" role="img" aria-label={description} className="editorial-figure-svg">
          {DRAWINGS[motif]}
        </svg>
      </div>
      <figcaption className="editorial-figure-caption">
        <span className="blog-ice">Diagram</span>
        <span aria-hidden="true">·</span>
        <span>{caption?.trim() || MOTIF_LABEL[motif]}</span>
      </figcaption>
    </figure>
  );
}

/* Shared parts. Classes: .fl = line that draws in, .fn = node that fades in, .ft = label. */
const grid = (
  <g className="fg-grid" aria-hidden="true">
    {Array.from({ length: 9 }, (_, i) => (
      <line key={`v${i}`} x1={80 + i * 80} y1="24" x2={80 + i * 80} y2="336" />
    ))}
    {Array.from({ length: 4 }, (_, i) => (
      <line key={`h${i}`} x1="40" y1={60 + i * 80} x2="760" y2={60 + i * 80} />
    ))}
  </g>
);

const DRAWINGS: Record<Motif, ReactNode> = {
  /* Perceived performance: what a metric records (top) versus how the wait feels (bottom). */
  "render-timeline": (
    <>
      {grid}
      <text className="ft ft-label" x="40" y="44">What the report records</text>
      <line className="fl fl-axis" x1="40" y1="120" x2="760" y2="120" style={{ "--i": 0 } as React.CSSProperties} />
      {[
        { x: 110, t: "request" },
        { x: 290, t: "first paint" },
        { x: 470, t: "content" },
        { x: 650, t: "interactive" },
      ].map((m, i) => (
        <g key={m.t} className="fn" style={{ "--i": i + 1 } as React.CSSProperties}>
          <line className="fg-tick" x1={m.x} y1="104" x2={m.x} y2="136" />
          <circle className="fg-node-ice" cx={m.x} cy="120" r="5" />
          <text className="ft" x={m.x} y="160" textAnchor="middle">
            {m.t}
          </text>
        </g>
      ))}
      <text className="ft ft-label" x="40" y="226">How the wait feels</text>
      <path
        className="fl fl-accent"
        style={{ "--i": 2 } as React.CSSProperties}
        d="M40 300 C 120 300, 150 252, 210 252 S 300 292, 360 272 S 450 238, 520 236 S 640 252, 760 248"
      />
      <path
        className="fl fl-warm"
        style={{ "--i": 3 } as React.CSSProperties}
        d="M290 172 L290 258 M470 172 L470 230"
        strokeDasharray="3 6"
      />
      <circle className="fn fg-node-accent" style={{ "--i": 4 } as React.CSSProperties} cx="290" cy="266" r="6" />
      <circle className="fn fg-node-accent" style={{ "--i": 5 } as React.CSSProperties} cx="470" cy="238" r="6" />
      <text className="ft ft-warm" x="300" y="324">feels responsive</text>
    </>
  ),

  /* Interaction craft: action, feedback, state, and back to the next action. */
  "interaction-loop": (
    <>
      {grid}
      <ellipse className="fl fl-faint" style={{ "--i": 0 } as React.CSSProperties} cx="400" cy="180" rx="250" ry="112" />
      <path
        className="fl fl-accent"
        style={{ "--i": 1 } as React.CSSProperties}
        d="M158.5 151 A 250 112 0 0 1 464.7 71.8"
        markerEnd="url(#fig-arrow)"
      />
      <path
        className="fl fl-ice"
        style={{ "--i": 2 } as React.CSSProperties}
        d="M576.8 100.8 A 250 112 0 0 1 576.8 259.2"
        markerEnd="url(#fig-arrow)"
      />
      <path
        className="fl fl-warm"
        style={{ "--i": 3 } as React.CSSProperties}
        d="M464.7 288.2 A 250 112 0 0 1 158.5 209"
        markerEnd="url(#fig-arrow)"
      />
      <defs>
        <marker id="fig-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path d="M0 0 L10 5 L0 10" className="fg-arrow" />
        </marker>
      </defs>
      {[
        { x: 150, y: 180, t: "action", c: "fg-node-accent", lx: 108, ly: 185, a: "end" },
        { x: 525, y: 83, t: "feedback", c: "fg-node-ice", lx: 525, ly: 50, a: "middle" },
        { x: 525, y: 277, t: "new state", c: "fg-node-warm", lx: 525, ly: 320, a: "middle" },
      ].map((n, i) => (
        <g key={n.t} className="fn" style={{ "--i": i + 2 } as React.CSSProperties}>
          <circle className="fg-halo" cx={n.x} cy={n.y} r="20" />
          <circle className={n.c} cx={n.x} cy={n.y} r="7" />
          <text className="ft" x={n.lx} y={n.ly} textAnchor={n.a as "end" | "middle"}>
            {n.t}
          </text>
        </g>
      ))}
      <g className="fn" style={{ "--i": 5 } as React.CSSProperties}>
        <circle className="fg-ripple" cx="150" cy="180" r="32" />
        <circle className="fg-ripple" cx="150" cy="180" r="46" />
      </g>
    </>
  ),

  /* Growing architecture: independent modules around a shared core. */
  "system-map": (
    <>
      {grid}
      {[
        { x: 100, y: 70, t: "content" },
        { x: 100, y: 230, t: "routes" },
        { x: 600, y: 70, t: "components" },
        { x: 600, y: 230, t: "cache" },
      ].map((b, i) => (
        <g key={b.t} className="fn" style={{ "--i": i } as React.CSSProperties}>
          <rect className="fg-box" x={b.x} y={b.y} width="120" height="60" rx="10" />
          <text className="ft" x={b.x + 60} y={b.y + 35} textAnchor="middle">
            {b.t}
          </text>
        </g>
      ))}
      {[
        "M220 100 C 300 100, 320 160, 360 168",
        "M220 260 C 300 260, 320 200, 360 192",
        "M600 100 C 520 100, 480 160, 440 168",
        "M600 260 C 520 260, 480 200, 440 192",
      ].map((d, i) => (
        <path key={d} className={`fl ${i % 2 ? "fl-ice" : "fl-accent"}`} style={{ "--i": i + 1 } as React.CSSProperties} d={d} />
      ))}
      <g className="fn" style={{ "--i": 3 } as React.CSSProperties}>
        <circle className="fg-halo" cx="400" cy="180" r="44" />
        <circle className="fg-core" cx="400" cy="180" r="26" />
        <text className="ft ft-label" x="400" y="184" textAnchor="middle">
          core
        </text>
      </g>
      <g className="fn" style={{ "--i": 6 } as React.CSSProperties}>
        <rect className="fg-box fg-box-dashed" x="336" y="276" width="128" height="48" rx="10" />
        <text className="ft ft-warm" x="400" y="305" textAnchor="middle">
          next module
        </text>
        <path className="fg-tick" d="M400 226 L400 276" strokeDasharray="3 5" />
      </g>
    </>
  ),

  /* Generic: signal paths through a contour field. */
  "signal-field": (
    <>
      {[0, 1, 2, 3, 4].map((k) => (
        <path
          key={k}
          className="fl fl-faint"
          style={{ "--i": k * 0.5 } as React.CSSProperties}
          d={`M40 ${100 + k * 40} C 200 ${60 + k * 40}, 300 ${170 + k * 34}, 420 ${130 + k * 38} S 640 ${80 + k * 44}, 760 ${120 + k * 40}`}
        />
      ))}
      <path className="fl fl-accent" style={{ "--i": 1 } as React.CSSProperties} d="M80 260 L240 196 L380 230 L520 140 L700 168" />
      {[
        [80, 260],
        [240, 196],
        [380, 230],
        [520, 140],
        [700, 168],
      ].map(([x, y], i) => (
        <circle key={x} className={`fn ${i === 3 ? "fg-node-warm" : "fg-node-ice"}`} style={{ "--i": i + 1 } as React.CSSProperties} cx={x} cy={y} r="6" />
      ))}
    </>
  ),
};
