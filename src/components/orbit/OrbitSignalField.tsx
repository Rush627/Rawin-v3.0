"use client";

import { useEffect, useId, useState, type CSSProperties } from "react";
import type { OrbitState } from "@/components/OrbitMark";
import { chooseTier, fieldPhase, type FieldTier } from "./signalField";

/**
 * Orbit Signal Field: the ambient background of /ai. A fine perspective lattice (an instrument's
 * ground plane) with faint wavefronts around a focal point. It is driven only by Orbit's real
 * request state: at rest it is nearly still; when a message is sent one front leaves the focal
 * point; while Orbit works, fronts propagate, short signals travel inward along a few lattice
 * lines and a narrow column of light rises; when the reply is done it all eases back to rest.
 *
 * Desktop: a wide floor in the lower middle of the conversation area. Phones: a compact canopy
 * at the top, clear of the composer and keyboard. Pure SVG + CSS: motion is transform and opacity
 * only, nothing reacts per token, nothing updates React state per frame.
 * SVG animations run on the main thread in Chrome, so the field only animates while Orbit is
 * working (and for the one-off entrance and send pulse); at rest it is a still frame.
 *
 * Tiers (chosen once on mount from capability hints, see chooseTier): "full", "lite" (fewer moving
 * parts), "still" (static composition, used for reduced motion too). Animations pause while the
 * tab is hidden. Decorative only: aria-hidden, no pointer events, behind every control.
 */

const R = (n: number) => Math.round(n * 10) / 10;

/** Lines from a vanishing point to a far edge, cut where they cross `fromY`. */
function rays(vx: number, vy: number, edgeY: number, xs: number[], fromY: number) {
  return xs.map((x) => {
    const t = (fromY - vy) / (edgeY - vy);
    return { x1: R(vx + (x - vx) * t), y1: R(fromY), x2: x, y2: edgeY };
  });
}

// Desktop floor (viewBox 1200 × 800, anchored to the bottom of the conversation area)
const D = { w: 1200, h: 800, vx: 600, vy: 455, horizon: 520, fx: 600, fy: 620 };
const D_RAYS = rays(D.vx, D.vy, D.h, Array.from({ length: 17 }, (_, i) => -600 + i * 150), D.horizon);
const D_DEPTH = Array.from({ length: 8 }, (_, k) => R(D.horizon + 280 * ((k + 1) / 8) ** 2));
const D_RINGS = [110, 220, 350, 490];
const D_SIGNAL_RAYS = [5, 7, 9, 11]; // indices into D_RAYS that carry travelling signals

// Phone canopy (viewBox 400 × 560, anchored to the top). The screen is a window into a larger
// structure: rays start far above the top edge and the two outer arcs enter from the sides and
// leave through the top, so no line ends inside the viewport; the mask region covers that
// overscan (a mask the size of the viewBox would cut every line at the screen edge).
const M = { w: 400, h: 560, vx: 200, vy: -70, fx: 200, fy: 150 };
const M_OVERSCAN = 400;
const M_RAYS = rays(M.vx, M.vy, 430, Array.from({ length: 11 }, (_, i) => -300 + i * 100), -140);
const M_ARCS = [70, 140, 220, 310, 440, 600];
const M_SIGNAL_RAYS = [3, 7];

/**
 * A short segment on a ray and the translation that carries it to the ray's far end. It starts
 * `from` of the way in (the near end of the desktop floor sits behind the composer) and stops at
 * `to` (on phones, before the header).
 */
function signal(l: { x1: number; y1: number; x2: number; y2: number }, share = 0.07, from = 0.35, to = 1) {
  const dx = l.x1 - l.x2;
  const dy = l.y1 - l.y2;
  const sx = l.x2 + dx * from;
  const sy = l.y2 + dy * from;
  const travel = to - from - share;
  return {
    seg: { x1: R(sx), y1: R(sy), x2: R(sx + dx * share), y2: R(sy + dy * share) },
    style: { "--sf-dx": `${R(dx * travel)}px`, "--sf-dy": `${R(dy * travel)}px` } as CSSProperties,
  };
}

function useFieldTier() {
  const [tier, setTier] = useState<FieldTier | null>(null);
  useEffect(() => {
    const mq = (q: string) => (typeof window.matchMedia === "function" ? window.matchMedia(q).matches : false);
    const nav = navigator as Navigator & { deviceMemory?: number; connection?: { saveData?: boolean } };
    const pick = () =>
      setTier(
        chooseTier({
          reducedMotion: mq("(prefers-reduced-motion: reduce)"),
          saveData: Boolean(nav.connection?.saveData),
          cores: typeof nav.hardwareConcurrency === "number" ? nav.hardwareConcurrency : undefined,
          memory: typeof nav.deviceMemory === "number" ? nav.deviceMemory : undefined,
          phone: mq("(pointer: coarse)") || mq("(max-width: 1023px)"),
        })
      );
    pick();
    const reduce = typeof window.matchMedia === "function" ? window.matchMedia("(prefers-reduced-motion: reduce)") : null;
    reduce?.addEventListener?.("change", pick);
    return () => reduce?.removeEventListener?.("change", pick);
  }, []);
  return tier;
}

function usePageHidden() {
  const [hidden, setHidden] = useState(false);
  useEffect(() => {
    const on = () => setHidden(document.visibilityState === "hidden");
    document.addEventListener("visibilitychange", on);
    return () => document.removeEventListener("visibilitychange", on);
  }, []);
  return hidden;
}

export default function OrbitSignalField({ state, pulse }: { state: OrbitState; pulse: number }) {
  const tier = useFieldTier();
  const hidden = usePageHidden();
  const uid = useId().replace(/:/g, "");
  const phase = fieldPhase(state);
  const moving = tier === "full" || tier === "lite";

  return (
    <div
      aria-hidden="true"
      className="orbit-signal-field"
      data-phase={phase}
      data-tier={tier ?? "pending"}
      data-paused={hidden ? "true" : undefined}
    >
      {/* ---------------------------------------------------------------- desktop floor */}
      <svg className="sf-desktop" viewBox={`0 0 ${D.w} ${D.h}`} preserveAspectRatio="xMidYMax slice" focusable="false">
        <defs>
          <radialGradient id={`${uid}-dfade`} cx={D.fx} cy={D.fy - 40} r="620" gradientUnits="userSpaceOnUse" gradientTransform={`translate(${D.fx} ${D.fy - 40}) scale(1 0.62) translate(${-D.fx} ${-(D.fy - 40)})`}>
            <stop offset="0" stopColor="#fff" />
            <stop offset="0.55" stopColor="#fff" stopOpacity="0.55" />
            <stop offset="1" stopColor="#fff" stopOpacity="0" />
          </radialGradient>
          <mask id={`${uid}-dmask`} maskUnits="userSpaceOnUse" x="0" y="0" width={D.w} height={D.h}>
            <rect width={D.w} height={D.h} fill={`url(#${uid}-dfade)`} />
          </mask>
          <radialGradient id={`${uid}-dglow`} cx="0.5" cy="0.5" r="0.5">
            <stop offset="0" style={{ stopColor: "var(--accent)", stopOpacity: 0.55 }} />
            <stop offset="0.45" style={{ stopColor: "var(--ember)", stopOpacity: 0.16 }} />
            <stop offset="1" style={{ stopColor: "var(--accent)", stopOpacity: 0 }} />
          </radialGradient>
          <linearGradient id={`${uid}-dcol`} x1="0" y1="1" x2="0" y2="0">
            <stop offset="0" style={{ stopColor: "var(--accent)", stopOpacity: 0.5 }} />
            <stop offset="0.6" style={{ stopColor: "var(--fg)", stopOpacity: 0.12 }} />
            <stop offset="1" style={{ stopColor: "var(--fg)", stopOpacity: 0 }} />
          </linearGradient>
          <linearGradient id={`${uid}-dhz`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" style={{ stopColor: "var(--fg)", stopOpacity: 0 }} />
            <stop offset="0.5" style={{ stopColor: "var(--fg)", stopOpacity: 1 }} />
            <stop offset="1" style={{ stopColor: "var(--fg)", stopOpacity: 0 }} />
          </linearGradient>
        </defs>

        <ellipse className="sf-glow" cx={D.fx} cy={D.fy} rx="430" ry="150" fill={`url(#${uid}-dglow)`} />
        <rect className="sf-column" x={D.fx - 1} y="300" width="2" height={D.fy - 300} fill={`url(#${uid}-dcol)`} style={{ transformOrigin: `${D.fx}px ${D.fy}px` }} />

        <g className="sf-lattice" mask={`url(#${uid}-dmask)`}>
          {D_RAYS.map((l, i) => (
            <line key={`r${i}`} className="sf-line" {...l} />
          ))}
          {D_DEPTH.map((y, i) => (
            <line key={`d${i}`} className="sf-line" x1="0" x2={D.w} y1={y} y2={y} />
          ))}
          {D_RINGS.map((r, i) => (
            <ellipse key={`c${i}`} className="sf-ring" cx={D.fx} cy={D.fy} rx={r} ry={R(r * 0.26)} />
          ))}
        </g>
        {/* outside the masked group: animating inside a mask would re-rasterise the whole lattice */}
        {moving && (
          <g className="sf-signals">
            {D_SIGNAL_RAYS.map((idx, i) => {
              // a short segment carried from the near edge towards the horizon (transform only)
              const { seg, style } = signal(D_RAYS[idx]);
              return <line key={`s${i}`} className="sf-signal" data-i={i} {...seg} style={style} />;
            })}
          </g>
        )}
        <line className="sf-horizon" x1="120" x2={D.w - 120} y1={D.horizon} y2={D.horizon} stroke={`url(#${uid}-dhz)`} style={{ transformOrigin: `${D.w / 2}px ${D.horizon}px` }} />

        {moving && (
          <g className="sf-fronts" style={{ transformOrigin: `${D.fx}px ${D.fy}px` }}>
            {[0, 1, 2].map((i) => (
              <ellipse key={i} className="sf-front" data-i={i} cx={D.fx} cy={D.fy} rx="490" ry="128" style={{ transformOrigin: `${D.fx}px ${D.fy}px` }} />
            ))}
          </g>
        )}
        {moving && pulse > 0 && <ellipse key={`p${pulse}`} className="sf-pulse" cx={D.fx} cy={D.fy} rx="490" ry="128" style={{ transformOrigin: `${D.fx}px ${D.fy}px` }} />}
      </svg>

      {/* ---------------------------------------------------------------- phone canopy */}
      <svg className="sf-phone" viewBox={`0 0 ${M.w} ${M.h}`} preserveAspectRatio="xMidYMin slice" focusable="false">
        <defs>
          <linearGradient id={`${uid}-mfade`} gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2={M.h}>
            <stop offset="0" stopColor="#fff" />
            <stop offset="0.45" stopColor="#fff" stopOpacity="0.7" />
            <stop offset="0.8" stopColor="#fff" stopOpacity="0" />
          </linearGradient>
          <mask id={`${uid}-mmask`} maskUnits="userSpaceOnUse" x={-M_OVERSCAN} y={-M_OVERSCAN} width={M.w + 2 * M_OVERSCAN} height={M.h + 2 * M_OVERSCAN}>
            <rect x={-M_OVERSCAN} y={-M_OVERSCAN} width={M.w + 2 * M_OVERSCAN} height={M.h + 2 * M_OVERSCAN} fill={`url(#${uid}-mfade)`} />
          </mask>
          <radialGradient id={`${uid}-mglow`} cx="0.5" cy="0.5" r="0.5">
            <stop offset="0" style={{ stopColor: "var(--accent)", stopOpacity: 0.5 }} />
            <stop offset="0.5" style={{ stopColor: "var(--ember)", stopOpacity: 0.14 }} />
            <stop offset="1" style={{ stopColor: "var(--accent)", stopOpacity: 0 }} />
          </radialGradient>
        </defs>

        <ellipse className="sf-glow" cx={M.fx} cy={M.fy - 30} rx="230" ry="150" fill={`url(#${uid}-mglow)`} />
        <g className="sf-lattice" mask={`url(#${uid}-mmask)`}>
          {M_RAYS.map((l, i) => (
            <line key={`r${i}`} className="sf-line" {...l} />
          ))}
          {M_ARCS.map((r, i) => (
            <ellipse key={`a${i}`} className="sf-ring" cx={M.fx} cy={M.fy} rx={r} ry={R(r * 0.42)} />
          ))}
        </g>
        {moving && (
          <g className="sf-signals">
            {M_SIGNAL_RAYS.map((idx, i) => {
              const { seg, style } = signal(M_RAYS[idx], 0.059, 0.221, 0.53);
              return <line key={`s${i}`} className="sf-signal" data-i={i} {...seg} style={style} />;
            })}
          </g>
        )}
        {moving && (
          <g className="sf-fronts">
            {[0, 1].map((i) => (
              <ellipse key={i} className="sf-front" data-i={i} cx={M.fx} cy={M.fy} rx="310" ry="130" style={{ transformOrigin: `${M.fx}px ${M.fy}px` }} />
            ))}
          </g>
        )}
        {moving && pulse > 0 && <ellipse key={`p${pulse}`} className="sf-pulse" cx={M.fx} cy={M.fy} rx="310" ry="130" style={{ transformOrigin: `${M.fx}px ${M.fy}px` }} />}
      </svg>
    </div>
  );
}
