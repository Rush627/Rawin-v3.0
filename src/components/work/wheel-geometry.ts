/**
 * Geometry for the phone project wheel (ProjectArchive). Pure functions, no DOM: everything is
 * derived from the number of projects in the collection and the stage's size, so the wheel
 * follows whatever the CMS returns (0, 1, 2 … many projects) with no fixed counts.
 *
 * Projects ride an elliptical wheel seen in perspective. A project's position relative to the
 * dial (d = index - dial position) is an angle on the wheel; the wheel's hub lies off to the
 * left, so the selected project sits at the rim's front-most point (right of centre, full size,
 * facing the viewer) and its neighbours travel up and down the rim, swinging left, back and
 * turning with it. The spine is the inner ring of the same wheel; each project's node rides it,
 * and the ring is sized so the spine enters and leaves through the screen's left edge.
 */

export const STEP_DEG = 30; // angle between neighbouring projects
/**
 * Wheel proportions (relative to the stage). A smaller step on a larger ellipse keeps the
 * spacing between neighbours nearly even all the way round, so every panel keeps a clear gap
 * to the next instead of bunching up towards the top and bottom of the rim.
 */
export const RX_RATIO = 0.55;
export const RY_RATIO = 0.66;
export const DEPTH = 300;
export const MAX_D = 2.4; // beyond this a project is fully faded at the back of the wheel
/** Keyframe samples per project step: enough that the path between keyframes reads as an arc */
export const SAMPLES_PER_STEP = 6;

export interface WheelGeometry {
  /** stage width and height (px) */
  W: number;
  H: number;
  /** panel width (px) */
  cw: number;
}

export interface WheelPose {
  x: number;
  y: number;
  z: number;
  rz: number;
  ry: number;
  s: number;
  opacity: number;
  /** spine node position */
  mx: number;
  my: number;
}

/**
 * Inner-ring radius, derived from the stage: the ring reaches the stage's left edge (x = 0) a
 * little before it would leave through the top or bottom, so on any phone the spine visibly
 * sweeps in from, and back out to, the screen's left edge.
 */
function ringRadius(mxF: number, g: WheelGeometry) {
  const cy = g.H * 0.52;
  const Ry = g.H * RY_RATIO;
  const tEdge = Math.asin(Math.min(0.98, (cy * 0.9) / Ry)); // angle where the ring nears the top edge
  return Math.max(70, (mxF * 1.08) / (1 - Math.cos(tEdge)));
}

export function wheelPose(d: number, g: WheelGeometry, reduced: boolean): WheelPose {
  const dc = Math.max(-MAX_D, Math.min(MAX_D, d));
  const ad = Math.abs(dc);
  const opacity = Math.max(0, Math.min(1, 1.05 - 0.45 * ad));
  const cy = g.H * 0.52;
  const xF = g.W / 2 + 10; // the rim's front-most point (the focal position)
  const mxF = xF - g.cw / 2 - 16; // node position at the focal point, just left of the panel
  if (reduced) {
    // same order and selection, no wheel: panels simply slide
    const y = cy + dc * g.H * 0.46;
    return { x: xF, y, z: 0, rz: 0, ry: 0, s: 1, opacity, mx: mxF, my: y };
  }
  const t = (dc * STEP_DEG * Math.PI) / 180;
  const Rx = g.W * RX_RATIO;
  const Ry = g.H * RY_RATIO;
  const x = xF - Rx + Rx * Math.cos(t);
  const y = cy + Ry * Math.sin(t);
  const z = (Math.cos(t) - 1) * DEPTH;
  const deg = dc * STEP_DEG;
  // inner ring for the spine nodes
  const Rm = ringRadius(mxF, g);
  const mx = mxF - Rm + Rm * Math.cos(t);
  return {
    x,
    y,
    z,
    rz: deg * 0.22, // panels lean with the rim, like spokes
    ry: -ad * 9, // and turn away as they travel to the back
    s: 1 - 0.1 * Math.min(ad, 2),
    opacity,
    mx,
    my: y,
  };
}

/**
 * Spine path: the inner ring the nodes ride. It runs past the last node positions until it has
 * left the stage through its left edge, so it reads as a line passing through the screen.
 */
export function spinePath(g: WheelGeometry, reduced: boolean): string {
  const xF = g.W / 2 + 10;
  const mxF = xF - g.cw / 2 - 16;
  const cy = g.H * 0.52;
  if (reduced) return `M${mxF.toFixed(1)} -20 L${mxF.toFixed(1)} ${(g.H + 20).toFixed(1)}`;
  const Rm = ringRadius(mxF, g);
  const Ry = g.H * RY_RATIO;
  const pts: string[] = [];
  const span = 150; // degrees either side of the focal point: well past the left edge
  for (let k = 0; k <= 60; k++) {
    const deg = -span + (2 * span * k) / 60;
    const t = (deg * Math.PI) / 180;
    const x = mxF - Rm + Rm * Math.cos(t);
    const y = cy + Ry * Math.sin(t);
    pts.push(`${k ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`);
  }
  return pts.join(" ");
}

/**
 * Keyframes for project `i` of `n` across the whole scroll range (offset 0 = first project
 * selected, 1 = last). Always at least two frames, so a single project still yields a valid
 * (static) animation.
 */
export function wheelKeyframes(i: number, n: number, g: WheelGeometry, reduced: boolean) {
  const samples = Math.max(1, (n - 1) * SAMPLES_PER_STEP);
  const card: Keyframe[] = [];
  const node: Keyframe[] = [];
  for (let k = 0; k <= samples; k++) {
    const offset = k / samples;
    const p = n > 1 ? offset * (n - 1) : 0;
    const w = wheelPose(i - p, g, reduced);
    card.push({
      offset,
      transform: `translate3d(${w.x.toFixed(1)}px, ${w.y.toFixed(1)}px, ${w.z.toFixed(1)}px) translate(-50%, -50%) rotateY(${w.ry.toFixed(2)}deg) rotateZ(${w.rz.toFixed(2)}deg) scale(${w.s.toFixed(3)})`,
      opacity: w.opacity,
    });
    node.push({
      offset,
      transform: `translate3d(${w.mx.toFixed(1)}px, ${w.my.toFixed(1)}px, 0) translate(-50%, -50%)`,
      opacity: Math.max(0.15, w.opacity),
    });
  }
  return { card, node };
}

/** Selected project for a scroll progress (0..1, clamped), always a valid index (or 0). */
export function indexForProgress(progress: number, n: number): number {
  if (n < 2) return 0;
  const pr = Math.max(0, Math.min(1, Number.isFinite(progress) ? progress : 0));
  return Math.max(0, Math.min(n - 1, Math.round(pr * (n - 1))));
}

/** Scroll progress (0..1) at which project `i` is selected, clamped to a valid project. */
export function progressForIndex(i: number, n: number): number {
  if (n < 2) return 0;
  const target = Math.max(0, Math.min(n - 1, Math.round(i)));
  return target / (n - 1);
}
