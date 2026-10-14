/**
 * Letterform sampling for the particle layer: the text an element actually renders, drawn
 * word by word in its computed font (each word stretched to the width the browser laid it out
 * at), so grains can be seeded on real typography — the hero name's emergence, and field
 * signals that shed grains from a heading's contours. (Keeping grains *off* text is the
 * foreground map's job: particles/foreground.)
 */

const range = typeof document !== "undefined" ? document.createRange() : null;

function fontOf(cs: CSSStyleDeclaration) {
  return cs.font || `${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
}

function transformText(text: string, transform: string) {
  if (transform === "uppercase") return text.toUpperCase();
  if (transform === "lowercase") return text.toLowerCase();
  if (transform === "capitalize") return text.replace(/\b\p{L}/gu, (c) => c.toUpperCase());
  return text;
}

/**
 * Draw the words of `el` (white on transparent) into `ctx` in element-local coordinates
 * at `scale`, offset by `pad` CSS px: each word in its computed font, stretched to the width
 * the browser laid it out at. Returns the number of words drawn.
 */
export function drawText(ctx: CanvasRenderingContext2D, el: Element, rect: DOMRect, scale: number, pad: number) {
  if (!range) return 0;
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  ctx.fillStyle = "#fff";
  ctx.textBaseline = "alphabetic";
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  let drawn = 0;
  for (let node = walker.nextNode() as Text | null; node; node = walker.nextNode() as Text | null) {
    const value = node.nodeValue ?? "";
    if (!value.trim()) continue;
    const parent = node.parentElement;
    if (!parent) continue;
    const cs = getComputedStyle(parent);
    if (cs.visibility === "hidden" || cs.display === "none" || parseFloat(cs.opacity) === 0) continue;
    ctx.font = fontOf(cs);
    const words = /\S+/g;
    for (let m = words.exec(value); m; m = words.exec(value)) {
      range.setStart(node, m.index);
      range.setEnd(node, m.index + m[0].length);
      const rects = range.getClientRects();
      if (!rects.length) continue;
      const r = rects[0];
      if (r.width < 1 || r.height < 1) continue;
      const word = transformText(m[0], cs.textTransform);
      const metrics = ctx.measureText(word);
      if (metrics.width < 0.5) continue;
      const ascent = metrics.fontBoundingBoxAscent || metrics.actualBoundingBoxAscent;
      const descent = metrics.fontBoundingBoxDescent || metrics.actualBoundingBoxDescent;
      // The line box centres the font's em box; place the baseline accordingly
      const baseline = r.top + (r.height - (ascent + descent)) / 2 + ascent;
      const x = (r.left - rect.left + pad) * scale;
      const y = (baseline - rect.top + pad) * scale;
      // Stretch to the laid-out width: absorbs letter-spacing and rounding differences
      ctx.setTransform((scale * r.width) / metrics.width, 0, 0, scale, x, y);
      ctx.fillText(word, 0, 0);
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      drawn++;
    }
  }
  return drawn;
}

/**
 * Points on the rendered letterforms of `el`, element-local CSS px [x0, y0, x1, y1, …], for
 * seeding particles from real typography. Sampled once on a grid sized to yield roughly
 * `target` points, in a shuffled order so any prefix covers every letter. With `edge`, only
 * points on the letters' contours are kept (ink pixels with a blank neighbour), so outline
 * type can shed particles from the very line the eye reads.
 */
export function sampleGlyphPoints(el: Element, target: number, edge = false): Float32Array | null {
  const rect = el.getBoundingClientRect();
  if (rect.width < 4 || rect.height < 4) return null;
  const w = Math.ceil(rect.width);
  const h = Math.ceil(rect.height);
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx || !drawText(ctx, el, rect, 1, 0)) return null;
  const data = ctx.getImageData(0, 0, w, h).data;
  const on = (x: number, y: number) => x >= 0 && y >= 0 && x < w && y < h && data[(y * w + x) * 4 + 3] > 128;
  const keep = edge
    ? (x: number, y: number) => on(x, y) && (!on(x - 2, y) || !on(x + 2, y) || !on(x, y - 2) || !on(x, y + 2))
    : on;
  let ink = 0;
  for (let y = 0; y < h; y += 2) for (let x = 0; x < w; x += 2) if (keep(x, y)) ink++;
  // grid step so that ink / step² ≈ target (ink was counted on every 4th pixel)
  const step = Math.max(1, Math.sqrt((ink * 4) / Math.max(1, target)));
  const pts: number[] = [];
  for (let y = 0; y < h; y += step) {
    for (let x = 0; x < w; x += step) {
      const jx = x + Math.random() * step;
      const jy = y + Math.random() * step;
      const ix = Math.min(w - 1, Math.floor(jx));
      const iy = Math.min(h - 1, Math.floor(jy));
      if (keep(ix, iy)) pts.push(jx, jy);
    }
  }
  if (pts.length < 40) return null;
  const out = new Float32Array(pts);
  for (let i = out.length / 2 - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const ax = out[i * 2];
    const ay = out[i * 2 + 1];
    out[i * 2] = out[j * 2];
    out[i * 2 + 1] = out[j * 2 + 1];
    out[j * 2] = ax;
    out[j * 2 + 1] = ay;
  }
  return out;
}
