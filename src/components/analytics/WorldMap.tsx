"use client";

import { memo, useCallback, useEffect, useMemo, useRef } from "react";
import { WORLD_GRID } from "@/lib/analytics/world-grid";
import { countryName } from "@/lib/analytics/countries";
import { decodeGrid, intensityLevel, outline, type Grid } from "@/lib/analytics/map-geometry";

/** Country outlines, built once per country per page. */
const outlines = new Map<string, string>();
function outlineOf(grid: Grid, code: string): string {
  let d = outlines.get(code);
  if (d === undefined) {
    d = grid.paths.has(code) ? outline(grid, code) : "";
    outlines.set(code, d);
  }
  return d;
}

/**
 * The static layer (every country's cells and the boundaries). It renders again only when the
 * report's counts change, never on hover.
 */
const Cells = memo(function Cells({ grid, counts }: { grid: Grid; counts: Map<string, number> }) {
  const max = Math.max(0, ...counts.values());
  return (
    <>
      {[...grid.paths.entries()].map(([code, d]) => (
        <path key={code} d={d} className="an-cell" data-level={intensityLevel(counts.get(code) || 0, max)} />
      ))}
      <path d={grid.borders} className="an-borders" />
    </>
  );
});

/**
 * Hover is handled outside React state: a pointer move only rewrites the outline's `d` and the
 * tooltip's attributes and position, at most once per frame. No re-render, and no element or
 * text node is added or removed while the pointer moves (the dark theme's particle layer
 * re-maps the page on every DOM mutation, which made hovering the map stutter).
 */
export default function WorldMap({
  counts,
  you,
  focus,
  picked,
  onPick,
  label,
}: {
  /** visitors per country code: the same report as the ranking and the figures */
  counts: Map<string, number>;
  /** the current visitor's country, only when the platform reported it */
  you: string | null;
  /** a country highlighted from the ranking list (hover or keyboard focus) */
  focus: string | null;
  /** the country chosen by tap or click (shown in a caption under the map) */
  picked: string | null;
  onPick: (code: string | null) => void;
  label: string;
}) {
  const grid = useMemo(() => decodeGrid(), []);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const outlineRef = useRef<SVGPathElement | null>(null);
  const tipRef = useRef<HTMLDivElement | null>(null);
  // a mouse or pen hover, in grid units (touch never hovers: a tap picks instead)
  const hover = useRef<{ code: string; x: number; y: number } | null>(null);
  const frame = useRef(0);
  const live = useRef({ counts, focus, picked });
  const { cols, rows } = WORLD_GRID;

  const paint = useCallback(() => {
    frame.current = 0;
    const { counts: c, focus: f, picked: p } = live.current;
    const h = hover.current;
    const o = outlineRef.current;
    if (o) {
      const active = h?.code ?? f ?? p;
      const d = active ? outlineOf(grid, active) : "";
      if (o.getAttribute("d") !== d) o.setAttribute("d", d);
    }
    const tip = tipRef.current;
    if (!tip) return;
    // the floating label: at the pointer while hovering, else at the country's centre for a
    // ranking hover/focus. Percent positions + a translate proportional to the position keep it
    // inside the map at both edges without measuring anything.
    const code = h?.code ?? f;
    const at = h ?? (f ? grid.centres.get(f) : undefined);
    if (!code || !at) {
      tip.removeAttribute("data-on");
      return;
    }
    tip.dataset.name = countryName(code);
    tip.dataset.count = visitorsText(c.get(code) || 0);
    tip.style.left = `${(at.x / WORLD_GRID.cols) * 100}%`;
    tip.style.top = `${(at.y / WORLD_GRID.rows) * 100}%`;
    tip.style.transform = `translate(${-(at.x / WORLD_GRID.cols) * 100}%, ${at.y / WORLD_GRID.rows < 0.3 ? "16px" : "calc(-100% - 14px)"})`;
    tip.setAttribute("data-on", "");
  }, [grid]);

  // ranking focus, a pick or new figures: repaint once after React commits
  useEffect(() => {
    live.current = { counts, focus, picked };
    paint();
  }, [counts, focus, picked, paint]);
  useEffect(() => () => cancelAnimationFrame(frame.current), []);

  const schedule = () => {
    if (!frame.current) frame.current = requestAnimationFrame(paint);
  };
  const locate = (e: React.PointerEvent<SVGSVGElement>) => {
    const svg = svgRef.current;
    if (!svg) return null;
    const r = svg.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) * cols;
    const y = ((e.clientY - r.top) / r.height) * rows;
    const col = Math.floor(x);
    const row = Math.floor(y);
    const code = col >= 0 && col < cols && row >= 0 && row < rows ? grid.cells[row * cols + col] : "";
    return { code, x, y };
  };
  const onMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (e.pointerType === "touch") return;
    const at = locate(e);
    hover.current = at?.code ? { code: at.code, x: at.x, y: at.y } : null;
    schedule();
  };
  const onLeave = () => {
    hover.current = null;
    schedule();
  };
  const onClick = (e: React.PointerEvent<SVGSVGElement>) => {
    const code = locate(e)?.code || null;
    onPick(code && code !== picked ? code : null);
  };

  const youCells = you ? grid.paths.get(you) : undefined;
  return (
    <div className="an-map relative">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${cols} ${rows}`}
        className="w-full h-auto block touch-pan-x touch-pan-y cursor-pointer"
        role="img"
        aria-label={label}
        onPointerMove={onMove}
        onPointerLeave={onLeave}
        onPointerUp={onClick}
      >
        <Cells grid={grid} counts={counts} />
        {you && youCells && (
          <>
            <path d={youCells} className="an-cell-you" />
            <path d={outlineOf(grid, you)} className="an-you-outline" />
          </>
        )}
        <path ref={outlineRef} className="an-outline" />
      </svg>
      {/* always mounted; its text lives in attributes (shown by CSS), so hovering adds no nodes */}
      <div ref={tipRef} className="an-tip pointer-events-none absolute z-10" aria-hidden="true" data-field-ignore="" />
    </div>
  );
}

export const visitorsText = (v: number) => `${v.toLocaleString("en-IN")} visitor${v === 1 ? "" : "s"}`;
