/**
 * Foreground map: one picture of where visible content is, for the cursor-reactive particle
 * field (the homepage's ambient field deliberately ignores it).
 *
 * Instead of each system guessing at a few elements, the visible page is rasterised (at half
 * resolution, off screen) into a coverage image of its foreground — every visible text run,
 * SVG geometry, image / video / canvas, card, panel, frosted surface and control — and turned
 * into a signed distance field (negative inside content, positive outside, in CSS px). Each
 * texel also carries the class of the nearest content, so a label and a photograph can answer
 * differently:
 *
 *   TEXT     small type (< 22px): each line run as a compact block the height of its line,
 *            so a paragraph is one ragged shape and grains never sit between its lines
 *   GLYPH    display type (and anything marked data-field-surface="glyph"): the letterforms
 *            themselves, so grains part around the contours of the letters
 *   SURFACE  images, cards, panels, frosted glass, diagrams: the visible box with the radii the
 *            browser draws (or a clipping frame's), SVG shapes with their real strokes and fills
 *   CONTROL  buttons and links that paint a surface (the pill, not a rectangle around it)
 *   LINE     decorative geometry: thin painted rules (timeline rails, label rules), small round
 *            nodes, anything marked data-field-line (an SVG so marked contributes its paths):
 *            grains flow along it and keep it clear, but it is never treated as a solid body
 *
 * Coverage is decided by what is painted, not by registration: a text node, an SVG shape, a
 * medium, or a box with a visible background, border or backdrop filter. Nesting needs no
 * precedence rules — the union of a card and its text is the card. `data-field-ignore` opts a
 * subtree out (purely atmospheric decoration); `data-field-surface="image"|"control"` forces a
 * box for an element whose surface is not otherwise painted, and `data-field-surface="disc"`
 * makes a circular composition (a dial and its ring of ticks) one round body.
 *
 * Content that moves with the page goes into a "flow" layer (built with a margin above and
 * below the viewport and shifted by the scroll distance since it was built); fixed and
 * currently-stuck sticky content (the floating navigation, the pinned closing story) goes into
 * a "pinned" layer that stays put. The distance transform runs in a worker; the main thread
 * only walks the DOM and draws, on a throttled cadence driven by the particle layer's own loop.
 */

export const FG_TEXT = 0;
export const FG_GLYPH = 1;
export const FG_SURFACE = 2;
export const FG_CONTROL = 3;
/** Decorative geometry (rules, timeline rails, nodes): grains flow along it, never erase it. */
export const FG_LINE = 4;

/** Texels per CSS px. */
export const FG_SCALE = 0.5;
const S = FG_SCALE;
/** The distance field is exact within ±FG_PAD CSS px of content and clamped beyond it. */
export const FG_PAD = 40;
/** Type at least this large (px) is mapped glyph by glyph; smaller type as line blocks. */
const DISPLAY_TEXT_PX = 22;
/** SVGs no larger than this (px) are icons: their strokes count as small type. */
const ICON_MAX = 48;
/** A square-cornered painted box this wide (share of the viewport) and this large (share of its
 *  area) is a full-bleed backdrop (a section band), not a surface. Rounded cards of any size
 *  are surfaces: the Uses workbench console fills most of a laptop screen. */
const BACKDROP_WIDTH = 0.9;
const BACKDROP_AREA = 0.45;
/** Content fading below this effective opacity releases the field. */
const MIN_OPACITY = 0.3;
/** Flow layer margin above and below the viewport, as a share of its height. */
const MARGIN = 0.25;
/** Thinnest stroke mapped (CSS px): hairlines still get a body grains can feel. */
const MIN_STROKE = 2;

export interface FgLayer {
  w: number;
  h: number;
  /** viewport y (CSS px) of the top row when built, and the scroll position then */
  oy: number;
  scroll: number;
  pinned: boolean;
  empty: boolean;
  /** distance (CSS px, positive outside, clamped ±FG_PAD) and class of the nearest content */
  d: Float32Array | null;
  lab: Uint8Array | null;
  /** 8×8-texel tiles with no content within FG_PAD (1): samples there return at once */
  far: Uint8Array | null;
  tw: number;
}

/** Result of the last `sample` call: outward unit normal and class of the nearest content. */
export const fgHit = { nx: 0, ny: -1, label: FG_TEXT };

// ------------------------------------------------------------------ distance transform
/**
 * Coverage (RGBA, class by colour) → signed distance + nearest class + GPU bytes. Pure and
 * self-contained: it is also the body of the worker (serialised with toString).
 */
function computeField(px: Uint8ClampedArray, w: number, h: number, scale: number, pad: number) {
  const n = w * h;
  const INF = 1e9;
  const out = new Float32Array(n);
  const inn = new Float32Array(n);
  const lab = new Uint8Array(n);
  let ink = 0;
  for (let i = 0, j = 0; i < n; i++, j += 4) {
    if (px[j + 3] > 96) {
      ink++;
      out[i] = 0;
      inn[i] = INF;
      const r = px[j];
      const g = px[j + 1];
      const b = px[j + 2];
      lab[i] = r > 140 && g > 140 && b > 140 ? 3 : r > 140 && b > 140 && g < 100 ? 4 : r >= g && r >= b ? 0 : g >= b ? 1 : 2;
    } else {
      out[i] = INF;
      inn[i] = 0;
      lab[i] = 0;
    }
  }
  if (ink === 0) return null;
  const D = Math.SQRT2;
  // two-pass chamfer (1, √2); the outside pass carries the class of the nearest ink along
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = y * w + x;
      let v = out[i];
      if (v !== 0) {
        let k = -1;
        if (x > 0 && out[i - 1] + 1 < v) { v = out[i - 1] + 1; k = i - 1; }
        if (y > 0) {
          if (out[i - w] + 1 < v) { v = out[i - w] + 1; k = i - w; }
          if (x > 0 && out[i - w - 1] + D < v) { v = out[i - w - 1] + D; k = i - w - 1; }
          if (x < w - 1 && out[i - w + 1] + D < v) { v = out[i - w + 1] + D; k = i - w + 1; }
        }
        if (k >= 0) { out[i] = v; lab[i] = lab[k]; }
      }
      let u = inn[i];
      if (u !== 0) {
        if (x > 0) u = Math.min(u, inn[i - 1] + 1);
        if (y > 0) {
          u = Math.min(u, inn[i - w] + 1);
          if (x > 0) u = Math.min(u, inn[i - w - 1] + D);
          if (x < w - 1) u = Math.min(u, inn[i - w + 1] + D);
        }
        inn[i] = u;
      }
    }
  }
  for (let y = h - 1; y >= 0; y--) {
    for (let x = w - 1; x >= 0; x--) {
      const i = y * w + x;
      let v = out[i];
      if (v !== 0) {
        let k = -1;
        if (x < w - 1 && out[i + 1] + 1 < v) { v = out[i + 1] + 1; k = i + 1; }
        if (y < h - 1) {
          if (out[i + w] + 1 < v) { v = out[i + w] + 1; k = i + w; }
          if (x < w - 1 && out[i + w + 1] + D < v) { v = out[i + w + 1] + D; k = i + w + 1; }
          if (x > 0 && out[i + w - 1] + D < v) { v = out[i + w - 1] + D; k = i + w - 1; }
        }
        if (k >= 0) { out[i] = v; lab[i] = lab[k]; }
      }
      let u = inn[i];
      if (u !== 0) {
        if (x < w - 1) u = Math.min(u, inn[i + 1] + 1);
        if (y < h - 1) {
          u = Math.min(u, inn[i + w] + 1);
          if (x < w - 1) u = Math.min(u, inn[i + w + 1] + D);
          if (x > 0) u = Math.min(u, inn[i + w - 1] + D);
        }
        inn[i] = u;
      }
    }
  }
  const d = new Float32Array(n);
  const tw = Math.ceil(w / 8);
  const far = new Uint8Array(tw * Math.ceil(h / 8)).fill(1);
  for (let i = 0; i < n; i++) {
    // the contour lies half a texel between an ink texel and its blank neighbour
    const t = out[i] > 0 ? out[i] - 0.5 : 0.5 - inn[i];
    const v = Math.max(-pad, Math.min(pad, t / scale));
    d[i] = v;
    if (v < pad - 0.01) {
      // a tile is "far" only if no texel a sample in it reads (bilinear + gradient: one texel
      // before, two after) is near
      const x = i % w;
      const y = (i - x) / w;
      const x0 = Math.max(0, x - 2) >> 3;
      const x1 = Math.min(w - 1, x + 1) >> 3;
      const y0 = Math.max(0, y - 2) >> 3;
      const y1 = Math.min(h - 1, y + 1) >> 3;
      far[y0 * tw + x0] = 0;
      far[y0 * tw + x1] = 0;
      far[y1 * tw + x0] = 0;
      far[y1 * tw + x1] = 0;
    }
  }
  return { d, lab, far, tw };
}

const WORKER_SRC = `const computeField = ${computeField.toString()};
self.onmessage = (e) => {
  const { id, jobs } = e.data;
  const results = [];
  const transfer = [];
  for (const j of jobs) {
    const r = j ? computeField(new Uint8ClampedArray(j.px), j.w, j.h, j.scale, j.pad) : null;
    results.push(r);
    if (r) transfer.push(r.d.buffer, r.lab.buffer, r.far.buffer);
  }
  self.postMessage({ id, results }, transfer);
};`;

// ------------------------------------------------------------------ painting helpers
function alphaOf(color: string) {
  if (!color || color === "none" || color === "transparent") return 0;
  if (color.startsWith("url(")) return 1;
  const slash = color.match(/\/\s*([\d.]+)(%?)\s*\)\s*$/);
  if (slash) return parseFloat(slash[1]) / (slash[2] ? 100 : 1);
  const rgba = color.match(/^rgba\(([^)]+)\)/);
  if (rgba) {
    const parts = rgba[1].split(",");
    return parts.length >= 4 ? parseFloat(parts[3]) : 1;
  }
  return 1;
}

function maxRadius(cs: CSSStyleDeclaration) {
  return Math.max(parseFloat(cs.borderTopLeftRadius) || 0, parseFloat(cs.borderTopRightRadius) || 0, parseFloat(cs.borderBottomRightRadius) || 0, parseFloat(cs.borderBottomLeftRadius) || 0);
}

function radiusPx(value: string, w: number, h: number) {
  // "12px", "50%", or elliptical "40px 20px": a circle of the smaller semi-axis is close enough
  const parts = value.split(/\s+/).filter(Boolean);
  const one = (p: string, base: number) => (p.endsWith("%") ? (parseFloat(p) / 100) * base : parseFloat(p) || 0);
  if (!parts.length) return 0;
  const rx = one(parts[0], w);
  const ry = parts.length > 1 ? one(parts[1], h) : parts[0].endsWith("%") ? one(parts[0], h) : rx;
  return Math.min(rx, ry);
}

/** The radii the browser draws: CSS scales all corners down together when they overlap. */
export function radiiOf(cs: CSSStyleDeclaration, w: number, h: number): [number, number, number, number] {
  const tl = radiusPx(cs.borderTopLeftRadius, w, h);
  const tr = radiusPx(cs.borderTopRightRadius, w, h);
  const br = radiusPx(cs.borderBottomRightRadius, w, h);
  const bl = radiusPx(cs.borderBottomLeftRadius, w, h);
  const f = Math.min(1, w / (tl + tr || 1), w / (bl + br || 1), h / (tl + bl || 1), h / (tr + br || 1));
  return [tl * f, tr * f, br * f, bl * f];
}

function paintsSurface(cs: CSSStyleDeclaration) {
  if (alphaOf(cs.backgroundColor) >= 0.06) return true;
  if (cs.backgroundImage.includes("url(")) return true;
  const bf = cs.backdropFilter || (cs as CSSStyleDeclaration & { webkitBackdropFilter?: string }).webkitBackdropFilter;
  if (bf && bf !== "none") return true;
  // a full outline (one rule under a list item is a divider, not a surface)
  const sides = ["Top", "Right", "Bottom", "Left"] as const;
  return sides.every((s) => {
    const k = s as "Top";
    return (
      parseFloat(cs[`border${k}Width`]) >= 0.5 &&
      cs[`border${k}Style`] !== "none" &&
      alphaOf(cs[`border${k}Color`]) >= 0.08
    );
  });
}

const CONTROL_TAGS = new Set(["A", "BUTTON", "INPUT", "SELECT", "TEXTAREA", "SUMMARY"]);
const MEDIA_TAGS = new Set(["IMG", "VIDEO", "CANVAS", "PICTURE", "IFRAME", "OBJECT", "EMBED"]);
const SKIP_TAGS = new Set(["SCRIPT", "STYLE", "NOSCRIPT", "TEMPLATE", "LINK", "META", "HEAD", "TITLE", "BR", "WBR", "SOURCE", "TRACK"]);
const SVG_SHAPES = "path,circle,ellipse,line,rect,polyline,polygon,text";
const SVG_SKIP = "defs,clipPath,mask,symbol,pattern,marker,[data-field-ignore]";

const COLORS = ["rgb(255,0,0)", "rgb(0,255,0)", "rgb(0,0,255)", "rgb(255,255,255)", "rgb(255,0,255)"];

const paths = new WeakMap<Element, { key: string; path: Path2D }>();

function shapePath(el: SVGGeometryElement): Path2D | null {
  const tag = el.tagName.toLowerCase();
  let key = "";
  if (tag === "path") key = el.getAttribute("d") || "";
  else if (tag === "polyline" || tag === "polygon") key = el.getAttribute("points") || "";
  else if (tag === "circle") {
    const c = el as SVGCircleElement;
    key = `${c.cx.baseVal.value},${c.cy.baseVal.value},${c.r.baseVal.value}`;
  } else if (tag === "ellipse") {
    const e = el as SVGEllipseElement;
    key = `${e.cx.baseVal.value},${e.cy.baseVal.value},${e.rx.baseVal.value},${e.ry.baseVal.value}`;
  } else if (tag === "line") {
    const l = el as SVGLineElement;
    key = `${l.x1.baseVal.value},${l.y1.baseVal.value},${l.x2.baseVal.value},${l.y2.baseVal.value}`;
  } else if (tag === "rect") {
    const r = el as SVGRectElement;
    key = `${r.x.baseVal.value},${r.y.baseVal.value},${r.width.baseVal.value},${r.height.baseVal.value},${r.rx.baseVal.value}`;
  }
  if (!key) return null;
  const hit = paths.get(el);
  if (hit && hit.key === key) return hit.path;
  const p = new Path2D();
  const n = key.split(/[\s,]+/).map(Number);
  if (tag === "path") p.addPath(new Path2D(key));
  else if (tag === "polyline" || tag === "polygon") {
    for (let i = 0; i + 1 < n.length; i += 2) {
      if (i === 0) p.moveTo(n[0], n[1]);
      else p.lineTo(n[i], n[i + 1]);
    }
    if (tag === "polygon") p.closePath();
  } else if (tag === "circle") p.arc(n[0], n[1], n[2], 0, Math.PI * 2);
  else if (tag === "ellipse") p.ellipse(n[0], n[1], n[2], n[3], 0, 0, Math.PI * 2);
  else if (tag === "line") {
    p.moveTo(n[0], n[1]);
    p.lineTo(n[2], n[3]);
  } else if (tag === "rect") {
    if (n[4] > 0) p.roundRect(n[0], n[1], n[2], n[3], n[4]);
    else p.rect(n[0], n[1], n[2], n[3]);
  }
  paths.set(el, { key, path: p });
  return p;
}

function transformText(text: string, transform: string) {
  if (transform === "uppercase") return text.toUpperCase();
  if (transform === "lowercase") return text.toLowerCase();
  if (transform === "capitalize") return text.replace(/\b\p{L}/gu, (c) => c.toUpperCase());
  return text;
}

// ------------------------------------------------------------------ the map
export interface ForegroundMap {
  flow: FgLayer;
  pinned: FgLayer;
  /** increments whenever a new map is in place */
  version: number;
  /** ask for a rebuild at the next opportunity */
  invalidate(): void;
  /** build if one is due (call from the animation loop); returns true when one started.
   *  `maxAge`: rebuild at least this often (ms) even without a known change */
  tick(now: number, maxAge?: number): boolean;
  /** signed distance (CSS px) from a viewport point to the nearest content; see fgHit */
  sample(x: number, y: number): number;
  /** current scroll position, read once per frame by the caller */
  setScroll(y: number): void;
  ready(): boolean;
  dispose(): void;
}

function emptyLayer(pinned: boolean): FgLayer {
  return { w: 0, h: 0, oy: 0, scroll: 0, pinned, empty: true, d: null, lab: null, far: null, tw: 0 };
}

export function createForegroundMap(onUpdate: () => void, minInterval = 110, defaultMaxAge = 700): ForegroundMap {
  const flow = emptyLayer(false);
  const pinned = emptyLayer(true);
  let scrollY = 0;
  let dirty = true;
  let inFlight = false;
  let lastBuild = -1e9;
  let jobId = 0;
  let disposed = false;
  let worker: Worker | null = null;
  let workerUrl = "";
  const range = document.createRange();

  const canvases = [document.createElement("canvas"), document.createElement("canvas")];
  const ctxs = canvases.map((c) => c.getContext("2d", { willReadFrequently: true }));

  // pending layer geometry, applied when the distance field returns
  let pendingGeom: { oy: number; scroll: number; w: number; h: number }[] = [];

  const apply = (results: (ReturnType<typeof computeField> | null)[]) => {
    [flow, pinned].forEach((L, i) => {
      const r = results[i];
      const g = pendingGeom[i];
      L.w = g.w;
      L.h = g.h;
      L.oy = g.oy;
      L.scroll = g.scroll;
      L.empty = !r;
      L.d = r ? r.d : null;
      L.lab = r ? r.lab : null;
      L.far = r ? r.far : null;
      L.tw = r ? r.tw : 0;
    });
    map.version++;
    inFlight = false;
    onUpdate();
  };

  try {
    workerUrl = URL.createObjectURL(new Blob([WORKER_SRC], { type: "text/javascript" }));
    worker = new Worker(workerUrl);
    worker.onmessage = (e: MessageEvent<{ id: number; results: (ReturnType<typeof computeField> | null)[] }>) => {
      if (disposed || e.data.id !== jobId) return;
      apply(e.data.results);
    };
    worker.onerror = () => {
      worker?.terminate();
      worker = null;
      inFlight = false;
      dirty = true;
    };
  } catch {
    worker = null;
  }

  // ---------------------------------------------------------------- rasterising
  let vw = 0;
  let vh = 0;
  let margin = 0;
  let used = [false, false];

  interface Ctx {
    op: number;
    cl: number;
    ct: number;
    cr: number;
    cb: number;
    pinned: boolean;
    glyph: boolean;
    /** nearest ancestor clipping on both axes (a rounded frame lends its corners) */
    frame: Element | null;
    frameRect: DOMRect | null;
  }

  const target = (pinnedLayer: boolean) => {
    const i = pinnedLayer ? 1 : 0;
    const ctx = ctxs[i];
    if (!ctx) return null;
    used[i] = true;
    // viewport CSS px → layer texels (the flow layer starts `margin` above the viewport)
    ctx.setTransform(S, 0, 0, S, 0, (pinnedLayer ? 0 : margin) * S);
    return ctx;
  };

  const withClip = (ctx: CanvasRenderingContext2D, c: Ctx, l: number, t: number, r: number, b: number, draw: () => void) => {
    const clipped = l < c.cl || t < c.ct || r > c.cr || b > c.cb;
    if (clipped) {
      ctx.save();
      ctx.beginPath();
      ctx.rect(c.cl, c.ct, c.cr - c.cl, c.cb - c.ct);
      ctx.clip();
    }
    draw();
    if (clipped) ctx.restore();
  };

  const box = (el: Element, cs: CSSStyleDeclaration, rect: DOMRect, c: Ctx, label: number) => {
    const ctx = target(c.pinned);
    if (!ctx) return;
    let r = rect;
    let radii = radiiOf(cs, rect.width, rect.height);
    // a square element filling a rounded clipping frame takes the frame's corners
    if (c.frame && c.frameRect && radii.every((v) => v < 0.5)) {
      const f = c.frameRect;
      if (rect.left <= f.left + 2 && rect.right >= f.right - 2 && rect.top <= f.top + 2 && rect.bottom >= f.bottom - 2) {
        r = f;
        radii = radiiOf(getComputedStyle(c.frame), f.width, f.height);
      }
    }
    ctx.fillStyle = COLORS[label];
    withClip(ctx, c, r.left, r.top, r.right, r.bottom, () => {
      ctx.beginPath();
      if (radii.some((v) => v > 0.5)) ctx.roundRect(r.left, r.top, r.width, r.height, [radii[0], radii[1], radii[2], radii[3]]);
      else ctx.rect(r.left, r.top, r.width, r.height);
      ctx.fill();
    });
  };

  const textNode = (node: Text, cs: CSSStyleDeclaration, c: Ctx) => {
    const value = node.nodeValue ?? "";
    if (!value.trim()) return;
    const fs = parseFloat(cs.fontSize) || 16;
    const display = c.glyph || fs >= DISPLAY_TEXT_PX;
    const ctx = target(c.pinned);
    if (!ctx) return;
    const top = c.pinned ? 0 : -margin;
    const bottom = c.pinned ? vh : vh + margin;
    if (!display) {
      // small type: each line run as a block the height of its line (paragraphs read as one shape)
      range.selectNodeContents(node);
      const rects = range.getClientRects();
      const lhRaw = parseFloat(cs.lineHeight);
      const lh = Math.min(Number.isFinite(lhRaw) ? lhRaw : fs * 1.25, fs * 1.7);
      ctx.fillStyle = COLORS[FG_TEXT];
      for (let k = 0; k < rects.length; k++) {
        const r = rects[k];
        if (r.width < 1 || r.height < 1 || r.bottom < top || r.top > bottom) continue;
        const ey = Math.max(0, (lh - r.height) / 2);
        const ex = fs * 0.12;
        withClip(ctx, c, r.left - ex, r.top - ey, r.right + ex, r.bottom + ey, () => {
          ctx.fillRect(r.left - ex, r.top - ey, r.width + ex * 2, r.height + ey * 2);
        });
      }
      return;
    }
    // display type: the letterforms, word by word, each stretched to its laid-out width
    ctx.fillStyle = COLORS[FG_GLYPH];
    ctx.strokeStyle = COLORS[FG_GLYPH];
    ctx.lineJoin = "round";
    ctx.font = cs.font || `${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
    ctx.textBaseline = "alphabetic";
    ctx.textAlign = "left";
    const words = /\S+/g;
    for (let m = words.exec(value); m; m = words.exec(value)) {
      range.setStart(node, m.index);
      range.setEnd(node, m.index + m[0].length);
      const rects = range.getClientRects();
      if (!rects.length) continue;
      const r = rects[0];
      if (r.width < 1 || r.height < 1 || r.bottom < top || r.top > bottom) continue;
      const word = transformText(m[0], cs.textTransform);
      const metrics = ctx.measureText(word);
      if (metrics.width < 0.5) continue;
      const ascent = metrics.fontBoundingBoxAscent || metrics.actualBoundingBoxAscent;
      const descent = metrics.fontBoundingBoxDescent || metrics.actualBoundingBoxDescent;
      // the run's box is the font's em box after any transform (a scaled heading): match both axes
      const sx = r.width / metrics.width;
      const sy = Math.abs(sx - 1) > 0.08 && ascent + descent > 0 ? r.height / (ascent + descent) : 1;
      const baseline = r.top + (r.height - (ascent + descent) * sy) / 2 + ascent * sy;
      withClip(ctx, c, r.left, r.top, r.right, r.bottom, () => {
        ctx.save();
        ctx.translate(r.left, baseline);
        ctx.scale(sx, sy);
        ctx.fillText(word, 0, 0);
        // a slight embolden closes hairline gaps and small counters
        ctx.lineWidth = Math.min(Math.max(1.5, fs * 0.05), 4) / Math.max(0.2, sy);
        ctx.strokeText(word, 0, 0);
        ctx.restore();
      });
    }
  };

  const svg = (root: SVGSVGElement, rect: DOMRect, c: Ctx) => {
    const ctx = target(c.pinned);
    if (!ctx) return;
    const icon = rect.width <= ICON_MAX && rect.height <= ICON_MAX;
    const shapes = root.querySelectorAll<SVGGraphicsElement>(SVG_SHAPES);
    const base = c.pinned ? 0 : margin;
    for (let i = 0; i < shapes.length; i++) {
      const el = shapes[i];
      if (el.closest(SVG_SKIP)) continue;
      const cs = getComputedStyle(el);
      if (cs.display === "none" || cs.visibility !== "visible") continue;
      let op = c.op;
      for (let a: Element | null = el; a && a !== root; a = a.parentElement) {
        op *= parseFloat(getComputedStyle(a).opacity) || 0;
        if (op < MIN_OPACITY) break;
      }
      if (op < MIN_OPACITY) continue;
      const m = el.getScreenCTM();
      if (!m) continue;
      const k = Math.sqrt(Math.abs(m.a * m.d - m.b * m.c)) || 1;
      const isText = el.tagName.toLowerCase() === "text";
      ctx.save();
      // clip in viewport px, then draw in the shape's user space
      ctx.setTransform(S, 0, 0, S, 0, base * S);
      ctx.beginPath();
      ctx.rect(c.cl, c.ct, c.cr - c.cl, c.cb - c.ct);
      ctx.clip();
      ctx.setTransform(m.a * S, m.b * S, m.c * S, m.d * S, m.e * S, (m.f + base) * S);
      if (isText) {
        const text = el.textContent?.trim();
        if (text) {
          const fs = parseFloat(cs.fontSize) || 16;
          const label = el.closest("[data-field-surface='glyph']") || fs * k >= DISPLAY_TEXT_PX ? FG_GLYPH : FG_TEXT;
          const t = el as SVGTextElement;
          const x = t.x.baseVal.numberOfItems ? t.x.baseVal.getItem(0).value : 0;
          const y = t.y.baseVal.numberOfItems ? t.y.baseVal.getItem(0).value : 0;
          ctx.font = `${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
          const anchor = cs.textAnchor || el.getAttribute("text-anchor");
          ctx.textAlign = anchor === "middle" ? "center" : anchor === "end" ? "right" : "left";
          ctx.textBaseline = "alphabetic";
          ctx.fillStyle = COLORS[label];
          ctx.strokeStyle = COLORS[label];
          const word = transformText(text, cs.textTransform);
          // letter-spacing (tracked caps) is not applied by fillText: stretch to the real width
          let sx = 1;
          try {
            const real = t.getComputedTextLength();
            const drawn = ctx.measureText(word).width;
            if (real > 0 && drawn > 0) sx = real / drawn;
          } catch {}
          ctx.translate(x, y);
          ctx.scale(sx, 1);
          if (label === FG_TEXT) {
            // small SVG type: a compact block, like small HTML type
            const mt = ctx.measureText(word);
            const w = mt.width;
            const x0 = ctx.textAlign === "center" ? -w / 2 : ctx.textAlign === "right" ? -w : 0;
            ctx.fillRect(x0 - fs * 0.12, -mt.actualBoundingBoxAscent - fs * 0.2, w + fs * 0.24, mt.actualBoundingBoxAscent + mt.actualBoundingBoxDescent + fs * 0.4);
          } else {
            ctx.fillText(word, 0, 0);
            ctx.lineWidth = Math.min(Math.max(1.5 / k, fs * 0.05), 4 / k);
            ctx.strokeText(word, 0, 0);
          }
        }
      } else {
        const p = shapePath(el as unknown as SVGGeometryElement);
        if (p && el.closest("[data-field-surface='glyph']")) {
          // letterforms drawn as outlines (e.g. the footer wordmark): mapped like display type,
          // whole glyphs whatever their own fill or stroke
          ctx.fillStyle = COLORS[FG_GLYPH];
          ctx.strokeStyle = COLORS[FG_GLYPH];
          ctx.lineJoin = "round";
          ctx.fill(p);
          ctx.lineWidth = 4 / k;
          ctx.stroke(p);
        } else if (p) {
          // fine-line graphics marked data-field-line answer as geometry (curves, connected paths)
          const label = root.hasAttribute("data-field-line") ? FG_LINE : icon ? FG_TEXT : FG_SURFACE;
          ctx.fillStyle = COLORS[label];
          ctx.strokeStyle = COLORS[label];
          ctx.lineCap = "round";
          ctx.lineJoin = "round";
          if (alphaOf(cs.fill) * (parseFloat(cs.fillOpacity) || 0) >= 0.04) ctx.fill(p, cs.fillRule === "evenodd" ? "evenodd" : "nonzero");
          if (alphaOf(cs.stroke) * (parseFloat(cs.strokeOpacity) || 0) >= 0.04) {
            const sw = parseFloat(cs.strokeWidth) || 1;
            const nonScaling = cs.vectorEffect === "non-scaling-stroke";
            ctx.lineWidth = Math.max(nonScaling ? sw / k : sw, MIN_STROKE / k);
            ctx.stroke(p);
          }
        }
      }
      ctx.restore();
    }
  };

  /** A thin painted rule (≤ 3px across, ≥ 12px long) or a small round painted node (≤ 24px). */
  const lineLike = (cs: CSSStyleDeclaration, rect: DOMRect) => {
    const thin = Math.min(rect.width, rect.height);
    const long = Math.max(rect.width, rect.height);
    if (long < 3) return false;
    if (thin <= 3) return long >= 12 && (alphaOf(cs.backgroundColor) >= 0.06 || cs.backgroundImage !== "none");
    return long <= 24 && thin >= long * 0.7 && maxRadius(cs) >= thin * 0.4 && paintsSurface(cs);
  };

  /** Decorative geometry: a rule drawn at least 2px across, a node as a circle. */
  const geometry = (cs: CSSStyleDeclaration, rect: DOMRect, c: Ctx) => {
    const ctx = target(c.pinned);
    if (!ctx) return;
    ctx.fillStyle = COLORS[FG_LINE];
    const thin = Math.min(rect.width, rect.height);
    withClip(ctx, c, rect.left - 2, rect.top - 2, rect.right + 2, rect.bottom + 2, () => {
      ctx.beginPath();
      if (thin > 3) {
        const r = Math.max(2.5, thin / 2);
        ctx.arc(rect.left + rect.width / 2, rect.top + rect.height / 2, r, 0, Math.PI * 2);
      } else if (rect.width < rect.height) {
        const x = rect.left + rect.width / 2;
        ctx.rect(x - 1, rect.top, 2, rect.height);
      } else {
        const y = rect.top + rect.height / 2;
        ctx.rect(rect.left, y - 1, rect.width, 2);
      }
      ctx.fill();
    });
  };

  const isStuck = (el: Element, cs: CSSStyleDeclaration, rect: DOMRect) => {
    const top = parseFloat(cs.top);
    if (!Number.isFinite(top)) return false;
    const parent = el.parentElement?.getBoundingClientRect();
    return Math.abs(rect.top - top) < 1.5 && !!parent && parent.top < rect.top - 1 && parent.bottom > rect.bottom + 1;
  };

  const visit = (el: Element, c: Ctx) => {
    const tag = el.tagName.toUpperCase();
    if (SKIP_TAGS.has(tag) || el.hasAttribute("data-field-ignore") || el.hasAttribute("data-custom-cursor")) return;
    const cs = getComputedStyle(el);
    if (cs.display === "none" || cs.visibility === "hidden" || cs.visibility === "collapse") return;
    const op = c.op * (parseFloat(cs.opacity) || 0);
    if (op < MIN_OPACITY) return;
    const contents = cs.display === "contents";
    const rect = contents ? null : el.getBoundingClientRect();
    const pin = c.pinned || cs.position === "fixed" || (cs.position === "sticky" && !!rect && isStuck(el, cs, rect));
    if (rect && rect.width + rect.height > 0) {
      const top = pin ? 0 : -margin;
      const bottom = pin ? vh : vh + margin;
      if (rect.bottom < top || rect.top > bottom || rect.right < 0 || rect.left > vw) return;
    }
    let { cl, ct, cr, cb, frame, frameRect } = c;
    // (replaced elements carry overflow: clip from the UA sheet; they never frame anything)
    if (rect && el !== document.body && el !== document.documentElement && !MEDIA_TAGS.has(tag)) {
      const ox = cs.overflowX !== "visible";
      const oy = cs.overflowY !== "visible";
      if (ox) {
        cl = Math.max(cl, rect.left);
        cr = Math.min(cr, rect.right);
      }
      if (oy) {
        ct = Math.max(ct, rect.top);
        cb = Math.min(cb, rect.bottom);
      }
      if (ox && oy) {
        frame = el;
        frameRect = rect;
      }
      if (cr - cl < 1 || cb - ct < 1) return;
    }
    const surf = el.getAttribute("data-field-surface");
    const next: Ctx = { op, cl, ct, cr, cb, pinned: pin, glyph: c.glyph || surf === "glyph", frame, frameRect };

    if (rect && el !== document.body && !(el instanceof SVGSVGElement) && (surf === "line" || el.hasAttribute("data-field-line") || lineLike(cs, rect))) {
      geometry(cs, rect, next);
    } else if (rect && rect.width >= 2 && rect.height >= 2) {
      if (surf === "disc") {
        const ctx = target(next.pinned);
        if (ctx) {
          ctx.fillStyle = COLORS[FG_SURFACE];
          withClip(ctx, next, rect.left, rect.top, rect.right, rect.bottom, () => {
            ctx.beginPath();
            ctx.ellipse(rect.left + rect.width / 2, rect.top + rect.height / 2, rect.width / 2, rect.height / 2, 0, 0, Math.PI * 2);
            ctx.fill();
          });
        }
      }
      if (el instanceof SVGSVGElement) {
        svg(el, rect, next);
        return;
      }
      const area = rect.width * rect.height;
      if (surf === "image" || surf === "control") box(el, cs, rect, next, surf === "control" ? FG_CONTROL : FG_SURFACE);
      else if (MEDIA_TAGS.has(tag)) {
        // full-screen fixed canvases are overlays (effects), not content
        if (!(cs.position === "fixed" && area > vw * vh * 0.8)) box(el, cs, rect, next, FG_SURFACE);
      } else if (
        el !== document.body &&
        el !== document.documentElement &&
        tag !== "MAIN" &&
        !(rect.width >= vw * BACKDROP_WIDTH && area > vw * vh * BACKDROP_AREA && maxRadius(cs) < 4) &&
        paintsSurface(cs)
      ) {
        const control = CONTROL_TAGS.has(tag) || el.classList.contains("btn") || el.getAttribute("role") === "button";
        box(el, cs, rect, next, control ? FG_CONTROL : FG_SURFACE);
      }
    }

    for (let n = el.firstChild; n; n = n.nextSibling) {
      if (n.nodeType === 3) textNode(n as Text, cs, next);
      else if (n.nodeType === 1) visit(n as Element, next);
    }
  };

  const build = () => {
    vw = window.innerWidth;
    vh = window.innerHeight;
    margin = Math.round(vh * MARGIN);
    const dims = [
      { w: Math.ceil(vw * S), h: Math.ceil((vh + margin * 2) * S) },
      { w: Math.ceil(vw * S), h: Math.ceil(vh * S) },
    ];
    for (let i = 0; i < 2; i++) {
      const cv = canvases[i];
      if (cv.width !== dims[i].w || cv.height !== dims[i].h) {
        cv.width = dims[i].w;
        cv.height = dims[i].h;
      }
      const ctx = ctxs[i];
      ctx?.setTransform(1, 0, 0, 1, 0, 0);
      ctx?.clearRect(0, 0, cv.width, cv.height);
    }
    used = [false, false];
    const scroll = window.scrollY;
    visit(document.body, {
      op: 1,
      cl: -1e5,
      ct: -1e5,
      cr: 1e5,
      cb: 1e5,
      pinned: false,
      glyph: false,
      frame: null,
      frameRect: null,
    });
    pendingGeom = [
      { oy: -margin, scroll, w: dims[0].w, h: dims[0].h },
      { oy: 0, scroll, w: dims[1].w, h: dims[1].h },
    ];
    const jobs = canvases.map((cv, i) => {
      const ctx = ctxs[i];
      if (!used[i] || !ctx) return null;
      const img = ctx.getImageData(0, 0, cv.width, cv.height);
      return { px: img.data.buffer, w: cv.width, h: cv.height, scale: S, pad: FG_PAD };
    });
    jobId++;
    inFlight = true;
    if (worker) {
      worker.postMessage(
        { id: jobId, jobs },
        jobs.filter(Boolean).map((j) => (j as { px: ArrayBuffer }).px),
      );
    } else {
      apply(jobs.map((j) => (j ? computeField(new Uint8ClampedArray(j.px), j.w, j.h, j.scale, j.pad) : null)));
    }
  };

  // ---------------------------------------------------------------- sampling
  const layerAt = (L: FgLayer, x: number, y: number) => {
    const D = L.d as Float32Array;
    const fx = x * S - 0.5;
    const fy = (y - (L.pinned ? L.oy : L.oy - (scrollY - L.scroll))) * S - 0.5;
    if (fx < 1 || fy < 1 || fx >= L.w - 2 || fy >= L.h - 2) return FG_PAD;
    const ix = fx | 0;
    const iy = fy | 0;
    if ((L.far as Uint8Array)[(iy >> 3) * L.tw + (ix >> 3)]) return FG_PAD;
    const tx = fx - ix;
    const ty = fy - iy;
    const i = iy * L.w + ix;
    const w = L.w;
    const d00 = D[i];
    const d10 = D[i + 1];
    const d01 = D[i + w];
    const d11 = D[i + w + 1];
    const d = d00 + (d10 - d00) * tx + (d01 - d00) * ty + (d00 - d10 - d01 + d11) * tx * ty;
    if (d >= FG_PAD - 0.01) return FG_PAD;
    fgHit.label = (L.lab as Uint8Array)[i + (tx > 0.5 ? 1 : 0) + (ty > 0.5 ? w : 0)];
    // the normal only matters inside the widest response band
    if (d > 26) return d;
    const gx = D[i + 1] - D[i - 1] + D[i + w + 1] - D[i + w - 1];
    const gy = D[i + w] - D[i - w] + D[i + w + 1] - D[i - w + 1];
    const g = Math.hypot(gx, gy);
    if (g > 1e-4) {
      fgHit.nx = gx / g;
      fgHit.ny = gy / g;
    } else {
      fgHit.nx = 0;
      fgHit.ny = -1;
    }
    return d;
  };

  const map: ForegroundMap = {
    flow,
    pinned,
    version: 0,
    invalidate() {
      dirty = true;
    },
    tick(now, maxAge = defaultMaxAge) {
      if (disposed || inFlight) return false;
      if (now - lastBuild > maxAge) dirty = true;
      if (!dirty || now - lastBuild < minInterval) return false;
      dirty = false;
      lastBuild = now;
      build();
      return true;
    },
    sample(x, y) {
      let best = FG_PAD;
      let nx = 0;
      let ny = -1;
      let label: number = FG_TEXT;
      if (!flow.empty) {
        const d = layerAt(flow, x, y);
        if (d < best) {
          best = d;
          nx = fgHit.nx;
          ny = fgHit.ny;
          label = fgHit.label;
        }
      }
      if (!pinned.empty) {
        const d = layerAt(pinned, x, y);
        if (d < best) {
          best = d;
          nx = fgHit.nx;
          ny = fgHit.ny;
          label = fgHit.label;
        }
      }
      fgHit.nx = nx;
      fgHit.ny = ny;
      fgHit.label = label;
      return best;
    },
    setScroll(y) {
      scrollY = y;
    },
    ready: () => map.version > 0,
    dispose() {
      disposed = true;
      worker?.terminate();
      worker = null;
      if (workerUrl) URL.revokeObjectURL(workerUrl);
      canvases.forEach((cv) => {
        cv.width = 0;
        cv.height = 0;
      });
    },
  };
  return map;
}
