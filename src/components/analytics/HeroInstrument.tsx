import HeroMotion from "./HeroMotion";
import "./analytics.css";

/**
 * The Analytics hero's companion artwork: a quiet precision instrument (two tilted
 * trajectories, a measuring ring with a partial dial, a sparse coordinate grid, a few anchor
 * points). Pure SVG drawn on the server in the theme's own ink: no data, no numbers, no client
 * JavaScript beyond a visibility gate. Motion is limited to one slow glint along a trajectory and
 * one point on the ring, both CSS; both stop under prefers-reduced-motion and pause while the
 * hero is off screen. Desktop only.
 *
 * Two stacked drawings with the same viewBox: the static instrument, and a motion layer holding
 * only the glint and the moving point on its own compositor layer. An animation inside an SVG
 * repaints that whole SVG every frame; in one drawing that meant re-rasterising the masked dot
 * grid 60 times a second (measured: ~4 s of raster per 2 s of scrolling over the hero). Split,
 * the instrument is rasterised once and each frame repaints two strokes and a dot.
 */

const W = 600;
const H = 440;
const CX = 330;
const CY = 220;
const R = 150; // measuring ring
const r2 = (v: number) => Math.round(v * 100) / 100;

/** A point on an ellipse (rx, ry) rotated by `tilt` degrees around the centre. */
function onEllipse(rx: number, ry: number, tilt: number, deg: number) {
  const t = (deg * Math.PI) / 180;
  const a = (tilt * Math.PI) / 180;
  const x = rx * Math.cos(t);
  const y = ry * Math.sin(t);
  return { x: r2(CX + x * Math.cos(a) - y * Math.sin(a)), y: r2(CY + x * Math.sin(a) + y * Math.cos(a)) };
}

// a full dial: 120 ticks every 3° (0° … 357°), a major tick every 30°; 360° is not repeated,
// so the closing seam has the same spacing as every other step and no doubled tick
const TICK_STEP = 3;
const TICKS = Array.from({ length: 360 / TICK_STEP }, (_, i) => i * TICK_STEP).map((deg) => {
  const major = deg % 30 === 0;
  const t = (deg * Math.PI) / 180;
  const r0 = R + (major ? 14 : 19);
  const r1 = R + 26;
  return { major, x1: r2(CX + r0 * Math.cos(t)), y1: r2(CY + r0 * Math.sin(t)), x2: r2(CX + r1 * Math.cos(t)), y2: r2(CY + r1 * Math.sin(t)) };
});

const A = { rx: 252, ry: 78, tilt: -16 };
const B = { rx: 206, ry: 120, tilt: 24 };
const nodes = [
  { ...onEllipse(A.rx, A.ry, A.tilt, 202), accent: false },
  { ...onEllipse(A.rx, A.ry, A.tilt, 334), accent: false },
  { ...onEllipse(B.rx, B.ry, B.tilt, 112), accent: true },
  { ...onEllipse(B.rx, B.ry, B.tilt, 252), accent: false },
];

export default function HeroInstrument() {
  return (
    <HeroMotion>
    <svg viewBox={`0 0 ${W} ${H}`} className="an-hero-art" aria-hidden="true" focusable="false">
      <defs>
        <pattern id="an-hero-dots" width="24" height="24" patternUnits="userSpaceOnUse" x="6" y="4">
          <circle cx="12" cy="12" r="0.9" fill="currentColor" />
        </pattern>
        <radialGradient id="an-hero-fade" cx={CX / W} cy={CY / H} r="0.62">
          <stop offset="0" stopColor="#fff" stopOpacity="1" />
          <stop offset="0.7" stopColor="#fff" stopOpacity="0.35" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </radialGradient>
        <mask id="an-hero-mask">
          <rect width={W} height={H} fill="url(#an-hero-fade)" />
        </mask>
      </defs>

      {/* coordinate field */}
      <g mask="url(#an-hero-mask)">
        <rect width={W} height={H} fill="url(#an-hero-dots)" className="an-hero-grid" />
        <path d={`M24 ${CY}H${W - 8}M${CX} 10V${H - 10}`} className="an-hero-axis" />
      </g>

      {/* trajectories */}
      <ellipse cx={CX} cy={CY} rx={B.rx} ry={B.ry} transform={`rotate(${B.tilt} ${CX} ${CY})`} className="an-hero-orbit an-hero-orbit-b" />
      <ellipse cx={CX} cy={CY} rx={A.rx} ry={A.ry} transform={`rotate(${A.tilt} ${CX} ${CY})`} className="an-hero-orbit" />

      {/* measuring ring and dial */}
      <circle cx={CX} cy={CY} r={R} className="an-hero-ring" />
      <circle cx={CX} cy={CY} r={62} className="an-hero-orbit an-hero-orbit-b" />
      <g className="an-hero-ticks">
        {TICKS.map((t, i) => (
          <line key={i} x1={t.x1} y1={t.y1} x2={t.x2} y2={t.y2} data-major={t.major || undefined} />
        ))}
      </g>

      {/* one faint link between two anchors, through the instrument's centre */}
      <path d={`M${nodes[0].x} ${nodes[0].y}L${CX} ${CY}L${nodes[2].x} ${nodes[2].y}`} className="an-hero-link" />
      {nodes.map((p, i) => (
        <g key={i}>
          {p.accent && <circle cx={p.x} cy={p.y} r={7} className="an-hero-halo" />}
          <circle cx={p.x} cy={p.y} r={p.accent ? 2.6 : 2} className={p.accent ? "an-hero-node an-hero-node-accent" : "an-hero-node"} />
        </g>
      ))}

      {/* centre */}
      <circle cx={CX} cy={CY} r={9} className="an-hero-core-ring" />
      <circle cx={CX} cy={CY} r={2.4} className="an-hero-node" />

    </svg>
    {/* motion layer: the glint and the one moving point (a slow circuit of the measuring ring) */}
    <svg viewBox={`0 0 ${W} ${H}`} className="an-hero-art an-hero-motion-layer" aria-hidden="true" focusable="false">
      <ellipse cx={CX} cy={CY} rx={A.rx} ry={A.ry} transform={`rotate(${A.tilt} ${CX} ${CY})`} pathLength={100} className="an-hero-glint" />
      <g className="an-hero-sweep" style={{ transformOrigin: `${CX}px ${CY}px` }}>
        <circle cx={CX + R} cy={CY} r={6} className="an-hero-halo" />
        <circle cx={CX + R} cy={CY} r={2.4} className="an-hero-node an-hero-node-bright" />
      </g>
    </svg>
    </HeroMotion>
  );
}
