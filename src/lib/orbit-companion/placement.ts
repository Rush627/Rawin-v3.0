/**
 * Where and how the mobile Orbit companion sits: pure decisions (no DOM), so they are testable.
 *
 * The companion is docked to the bottom-right corner of the viewport and stays available while
 * the visitor reads. What is behind it decides only its size and a small lift:
 *
 *   - nothing behind it                       normal size, in the corner
 *   - ordinary content behind it              compact (text, images, cards, links pass under it)
 *   - a control behind it (button, field,     lifted one or two steps up the edge, compact if
 *     fixed bar, ...)                         needed, so the control stays reachable
 *   - controls at every step                  hidden, until that changes
 *
 * Stability: the current step is kept while it stays clear of controls, the size only grows back
 * after the corner has been clear for a couple of checks, and the steps are tried in a fixed
 * order so the same layout always gives the same answer.
 */

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface Insets {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export type CompanionSize = "normal" | "compact";

export const COMPANION = {
  /** px: normal and compact (the compact form keeps a 44 px touch target) */
  size: { normal: 58, compact: 44 } as Record<CompanionSize, number>,
  /** clearance kept around the companion when checking what is behind it */
  clearance: 6,
  /** distance from the right and bottom edges (plus the safe-area insets) */
  edge: { right: 14, bottom: 18 },
  /** how far each lift step raises it along the edge */
  step: 64,
  /** lift steps tried when a control is behind the corner (0 = the corner itself) */
  steps: 3,
} as const;

/** What a rect covers: ordinary content, and/or a control that must stay reachable. */
export interface Coverage {
  content: boolean;
  control: boolean;
}

export interface Placement {
  step: number;
  size: CompanionSize;
  x: number;
  y: number;
}

/**
 * Top-left corner of the companion at a lift step and size, in viewport coordinates. `lift`
 * (px) raises the whole dock, e.g. beside the footer's links when the footer reaches the corner
 * (see footerLift).
 */
export function dockPosition(step: number, size: CompanionSize, vw: number, vh: number, safe: Insets, lift = 0) {
  const s = COMPANION.size[size];
  return {
    x: vw - safe.right - COMPANION.edge.right - s,
    y: vh - safe.bottom - COMPANION.edge.bottom - s - step * COMPANION.step - lift,
  };
}

/** The rect checked for a step and size: the companion plus its clearance. */
export function dockRect(step: number, size: CompanionSize, vw: number, vh: number, safe: Insets, lift = 0): Rect {
  const s = COMPANION.size[size];
  const { x, y } = dockPosition(step, size, vw, vh, safe, lift);
  const c = COMPANION.clearance;
  return { x: x - c, y: y - c, w: s + 2 * c, h: s + 2 * c };
}

export interface DockInput {
  vw: number;
  vh: number;
  safe: Insets;
  cover: (r: Rect) => Coverage;
  current: { step: number; size: CompanionSize } | null;
  /** the corner has been clear of content for a while: it may grow back (see Settle) */
  mayGrow: boolean;
  /** a lower step has been clear of controls for a while: it may drop back (see Settle) */
  mayDrop: boolean;
  /** how far the dock is raised (px), e.g. by the footer (see footerLift) */
  lift?: number;
}

/** The step and size to use now, or null to hide (only when controls leave no step free). */
export function dock({ vw, vh, safe, cover, current, mayGrow, mayDrop, lift = 0 }: DockInput): Placement | null {
  const fits = (step: number) => dockRect(step, "normal", vw, vh, safe, lift).y + COMPANION.clearance >= safe.top + 72;
  const at = (step: number, size: CompanionSize): Placement => ({ step, size, ...dockPosition(step, size, vw, vh, safe, lift) });
  const tryStep = (step: number): Placement | null => {
    if (!fits(step)) return null;
    const normal = cover(dockRect(step, "normal", vw, vh, safe, lift));
    if (!normal.control && !normal.content) {
      // clear: normal size, but grow back only once it has been clear for a while
      const growing = current && current.step === step && current.size === "compact" && !mayGrow;
      return at(step, growing ? "compact" : "normal");
    }
    if (!normal.control) return at(step, "compact"); // ordinary content behind: compact
    const compact = cover(dockRect(step, "compact", vw, vh, safe, lift));
    return compact.control ? null : at(step, "compact");
  };
  // 1. back down toward the corner, once lower steps have been clear for a while
  if (current && mayDrop) {
    for (let step = 0; step < current.step; step++) {
      const p = tryStep(step);
      if (p) return p;
    }
  }
  // 2. stay on the current step while it is clear of controls
  if (current) {
    const p = tryStep(current.step);
    if (p) return p;
  }
  // 3. the lowest step clear of controls, else hide
  for (let step = 0; step < COMPANION.steps; step++) {
    const p = tryStep(step);
    if (p) return p;
  }
  return null;
}

/**
 * How far to raise the dock when the footer reaches it (pure geometry, measured by the caller):
 * the companion's centre lines up with the footer's links block ("Elsewhere") while that block is
 * on screen, and its bottom always stays `gap` px above the footer's decorative wordmark. The
 * lift grows with the footer as it scrolls in and returns to 0 as it leaves, so the companion
 * rides up beside the links and comes back down to the corner. Never lifts into the header area.
 */
export function footerLift(input: {
  vh: number;
  safe: Insets;
  /** the companion's normal size (px) */
  size: number;
  /** the links block (viewport rect), when the footer has one */
  anchor: { top: number; bottom: number } | null;
  /** top of the decorative wordmark (viewport px), when present */
  floorTop: number | null;
  gap?: number;
}): number {
  const { vh, safe, size, anchor, floorTop, gap = 14 } = input;
  const normalTop = vh - safe.bottom - COMPANION.edge.bottom - size;
  const highest = safe.top + 80; // never climbs into the header's area
  let top = normalTop;
  if (anchor) {
    const centre = (anchor.top + anchor.bottom) / 2;
    // only while the links block is on screen (beside it, not above the viewport)
    if (centre - size / 2 >= highest && centre <= vh) top = Math.min(top, centre - size / 2);
  }
  if (floorTop !== null && floorTop < vh) top = Math.min(top, floorTop - gap - size);
  top = Math.max(top, highest);
  return Math.max(0, Math.round(normalTop - top));
}

/**
 * Grid sample points over a rect (4 x 4 and the centre): enough to catch any text line, control
 * or card edge behind the companion, at a fixed small cost per check.
 */
export function samplePoints(r: Rect): Array<{ x: number; y: number }> {
  const pts: Array<{ x: number; y: number }> = [{ x: r.x + r.w / 2, y: r.y + r.h / 2 }];
  for (let i = 0; i < 4; i++) {
    for (let j = 0; j < 4; j++) pts.push({ x: r.x + ((i + 0.5) * r.w) / 4, y: r.y + ((j + 0.5) * r.h) / 4 });
  }
  return pts;
}

/**
 * Hysteresis: shrinking and lifting are immediate (something arrived behind the companion);
 * growing back and dropping back down wait for `needed` consecutive checks that would allow
 * them, so content passing the corner during a scroll does not make it pulse or hop.
 */
export class Settle {
  private count = 0;
  private needed: number;
  constructor(needed = 2) {
    this.needed = needed;
  }
  /** Feed whether the change would be possible now; returns whether it may happen. */
  next(possibleNow: boolean): boolean {
    this.count = possibleNow ? this.count + 1 : 0;
    return this.count >= this.needed;
  }
  reset() {
    this.count = 0;
  }
}
