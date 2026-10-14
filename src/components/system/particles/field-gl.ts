/**
 * WebGL renderer for the RAWIN particle layer: one context, two independent programs.
 *
 * 1. Background field — fully GPU-side and stateless. Every grain lives on one of a set
 *    of streamlines laid over a slowly undulating sheet seen in perspective (the folds of
 *    the sheet compress into the bright, line-like bands), drifting along its line at its
 *    own pace. Position is a pure function of (attributes, time), so the CPU only sets a
 *    few uniforms per frame and never simulates or uploads background particles.
 * 2. Cursor points — positions simulated on the CPU (see CursorField), streamed in as one
 *    small dynamic buffer and drawn as soft additive points.
 *
 * The two are deliberately independent. The background field is atmosphere: it knows
 * nothing about the page's content and runs on underneath the portrait and the hero type
 * (the content covers it). Only the cursor cloud reads the foreground map and parts around
 * visible content (see CursorField, particles/foreground).
 */

export interface FieldRenderer {
  resize(w: number, h: number, dpr: number): void;
  /**
   * Clear, then draw the background field (intensity 0 skips it), confined to `clip`
   * (viewport px: the hero's on-screen box) with a soft fade toward its lower edge.
   */
  beginFrame(
    timeSec: number,
    intensity: number,
    shiftPx: number,
    clip: { top: number; bottom: number } | null,
  ): void;
  /** Draw `count` cursor points from `data` = [x, y, alpha, size] * count in CSS px. */
  drawPoints(data: Float32Array, count: number): void;
  clear(): void;
  dispose(): void;
  lost(): boolean;
}

// ------------------------------------------------------------------ background field
// aP: x = depth of the streamline (0 near … 1 far), y = position along it (0…1),
//     z = per-grain seed, w = kind (0 streamline grain, 1 ambient grain)
const BG_VERT = `
attribute vec4 aP;
uniform vec2 uRes;
uniform float uTime;
uniform float uDpr;
uniform float uShift;
uniform float uIntensity;
uniform vec2 uClip; // visible band (viewport px): top, bottom
varying float vA;

float h1(float n){ return fract(sin(n * 12.9898) * 43758.5453); }

void main(){
  float d = aP.x;
  float seed = aP.z;
  float t = uTime;
  vec2 p;
  float a;
  float size;

  if (aP.w < 0.5) {
    // drift along the line; each grain at its own slow pace, wrapping softly at the ends
    float u = fract(aP.y + t * (0.0035 + 0.0075 * h1(seed * 3.1)));
    float x = u * 2.0 - 1.0;
    float z = d * 3.2;
    float persp = 1.0 / (1.0 + d * 1.85);
    // the sheet: two slow travelling folds + a finer ripple, under a broad envelope
    float env = 0.6 + 0.4 * sin(1.1 * x + 0.6 + t * 0.045);
    float wave =
        0.62 * sin(2.4 * x + 1.7 * z + t * 0.16)
      + 0.38 * sin(1.25 * x - 1.05 * z - t * 0.105 + 1.9)
      + 0.14 * sin(4.3 * x + 0.8 * z + t * 0.23);
    float y = wave * 0.17 * env + (h1(seed * 7.7) - 0.5) * 0.009;
    // perspective: lines converge toward a vanishing region to the upper right
    float sx = 0.5 + x * persp * 0.74 + d * 0.16;
    float sy = 0.36 + (0.56 - y) * persp * 0.86 - (sx - 0.5) * 0.12;
    p = vec2(sx * uRes.x, sy * uRes.y - uShift);
    float edge = smoothstep(0.0, 0.07, u) * smoothstep(1.0, 0.93, u);
    float tw = 0.82 + 0.18 * sin(t * (0.6 + h1(seed) * 0.9) + seed * 40.0);
    a = (0.24 + 0.5 * pow(h1(seed * 13.1), 2.0)) * mix(1.0, 0.5, d) * edge * tw;
    size = (1.0 + 0.9 * h1(seed * 5.3)) * mix(1.3, 0.85, d);
  } else {
    // ambient grains: sparse, very faint, wandering slowly over the whole view
    float ax = fract(aP.x + 0.012 * sin(t * 0.07 + seed * 6.0) + t * 0.0022 * (h1(seed) - 0.5));
    float ay = fract(aP.y + 0.010 * cos(t * 0.06 + seed * 4.0));
    p = vec2(ax * uRes.x, ay * uRes.y - uShift);
    a = 0.05 + 0.13 * pow(h1(seed * 2.3), 3.0);
    a *= 0.75 + 0.25 * sin(t * 0.5 + seed * 30.0);
    size = 0.8 + 0.6 * h1(seed * 9.1);
  }

  // soft edge toward the bottom of the clip region, so the field never ends on a hard line
  vA = a * uIntensity * smoothstep(uClip.y, uClip.y - 140.0, p.y);
  gl_Position = vec4(p / uRes * 2.0 - 1.0, 0.0, 1.0);
  gl_Position.y = -gl_Position.y;
  gl_PointSize = max(1.0, size * uDpr);
}
`;

// ------------------------------------------------------------------ cursor points
const PT_VERT = `
attribute vec4 aQ; // x, y (CSS px), alpha, size (CSS px)
uniform vec2 uRes;
uniform float uDpr;
varying float vA;
void main(){
  vA = aQ.z;
  gl_Position = vec4(aQ.xy / uRes * 2.0 - 1.0, 0.0, 1.0);
  gl_Position.y = -gl_Position.y;
  gl_PointSize = max(1.0, aQ.w * uDpr);
}
`;

// Soft round grain; premultiplied silver. Additive blending makes dense regions brighter.
const FRAG = `
precision mediump float;
uniform vec3 uColor;
varying float vA;
void main(){
  vec2 c = gl_PointCoord - 0.5;
  float m = smoothstep(0.5, 0.18, length(c));
  float a = vA * m;
  gl_FragColor = vec4(uColor * a, a);
}
`;

function compile(gl: WebGLRenderingContext, type: number, src: string) {
  const s = gl.createShader(type);
  if (!s) return null;
  gl.shaderSource(s, src);
  gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
    console.warn("[RAWIN field] shader:", gl.getShaderInfoLog(s) || "compile failed");
    gl.deleteShader(s);
    return null;
  }
  return s;
}

function program(gl: WebGLRenderingContext, vert: string, frag: string) {
  const vs = compile(gl, gl.VERTEX_SHADER, vert);
  const fs = compile(gl, gl.FRAGMENT_SHADER, frag);
  if (!vs || !fs) return null;
  const p = gl.createProgram();
  if (!p) return null;
  gl.attachShader(p, vs);
  gl.attachShader(p, fs);
  gl.linkProgram(p);
  gl.deleteShader(vs);
  gl.deleteShader(fs);
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) return null;
  return p;
}

/** Streamline + ambient grain attributes for `count` background particles. */
function backgroundAttributes(count: number, lines: number) {
  const data = new Float32Array(count * 4);
  const ambient = Math.round(count * 0.08);
  const onLines = count - ambient;
  for (let i = 0; i < onLines; i++) {
    const line = i % lines;
    // far lines are packed closer (they compress anyway); slight per-grain depth jitter
    const d = Math.pow((line + 0.5) / lines, 0.85) + (Math.random() - 0.5) * (0.35 / lines);
    data[i * 4] = Math.min(1, Math.max(0, d));
    data[i * 4 + 1] = Math.random();
    data[i * 4 + 2] = Math.random() * 1000;
    data[i * 4 + 3] = 0;
  }
  for (let i = onLines; i < count; i++) {
    data[i * 4] = Math.random();
    data[i * 4 + 1] = Math.random();
    data[i * 4 + 2] = Math.random() * 1000;
    data[i * 4 + 3] = 1;
  }
  return data;
}

export function createFieldRenderer(canvas: HTMLCanvasElement, backgroundCount: number): FieldRenderer | null {
  const gl = canvas.getContext("webgl", { alpha: true, premultipliedAlpha: true, antialias: false, depth: false, stencil: false }) as WebGLRenderingContext | null;
  if (!gl) return null;
  const bg = program(gl, BG_VERT, FRAG);
  const pt = program(gl, PT_VERT, FRAG);
  if (!bg || !pt) {
    gl.getExtension("WEBGL_lose_context")?.loseContext();
    return null;
  }
  let isLost = false;
  canvas.addEventListener("webglcontextlost", (e) => {
    e.preventDefault();
    isLost = true;
  });

  const bgBuf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, bgBuf);
  gl.bufferData(gl.ARRAY_BUFFER, backgroundAttributes(backgroundCount, 72), gl.STATIC_DRAW);
  const ptBuf = gl.createBuffer();
  let ptCapacity = 0;

  const U = (p: WebGLProgram, n: string) => gl.getUniformLocation(p, n);
  const bgU = {
    res: U(bg, "uRes"),
    time: U(bg, "uTime"),
    dpr: U(bg, "uDpr"),
    shift: U(bg, "uShift"),
    intensity: U(bg, "uIntensity"),
    color: U(bg, "uColor"),
    clip: U(bg, "uClip"),
  };
  const ptU = { res: U(pt, "uRes"), dpr: U(pt, "uDpr"), color: U(pt, "uColor") };
  const aP = gl.getAttribLocation(bg, "aP");
  const aQ = gl.getAttribLocation(pt, "aQ");

  let W = 1;
  let H = 1;
  let DPR = 1;

  gl.disable(gl.DEPTH_TEST);
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.ONE, gl.ONE);
  gl.clearColor(0, 0, 0, 0);

  return {
    resize(w, h, dpr) {
      W = w;
      H = h;
      DPR = dpr;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      gl.viewport(0, 0, canvas.width, canvas.height);
    },
    beginFrame(time, intensity, shift, clip) {
      gl.clear(gl.COLOR_BUFFER_BIT);
      if (intensity <= 0.001 || !clip || clip.bottom <= 0 || clip.top >= H) return;
      const top = Math.max(0, clip.top);
      const bottom = Math.min(H, clip.bottom);
      gl.enable(gl.SCISSOR_TEST);
      gl.scissor(0, Math.round((H - bottom) * DPR), canvas.width, Math.round((bottom - top) * DPR));
      gl.useProgram(bg);
      gl.uniform2f(bgU.res, W, H);
      gl.uniform1f(bgU.time, time);
      gl.uniform1f(bgU.dpr, DPR);
      gl.uniform1f(bgU.shift, shift);
      gl.uniform1f(bgU.intensity, intensity);
      gl.uniform3f(bgU.color, 0.86, 0.875, 0.905);
      gl.uniform2f(bgU.clip, clip.top, clip.bottom);
      gl.bindBuffer(gl.ARRAY_BUFFER, bgBuf);
      gl.enableVertexAttribArray(aP);
      gl.vertexAttribPointer(aP, 4, gl.FLOAT, false, 0, 0);
      gl.drawArrays(gl.POINTS, 0, backgroundCount);
      gl.disableVertexAttribArray(aP);
      gl.disable(gl.SCISSOR_TEST);
    },
    drawPoints(data, count) {
      if (count <= 0) return;
      gl.useProgram(pt);
      gl.uniform2f(ptU.res, W, H);
      gl.uniform1f(ptU.dpr, DPR);
      gl.uniform3f(ptU.color, 0.93, 0.94, 0.96);
      gl.bindBuffer(gl.ARRAY_BUFFER, ptBuf);
      if (data.length > ptCapacity) {
        gl.bufferData(gl.ARRAY_BUFFER, data.byteLength, gl.DYNAMIC_DRAW);
        ptCapacity = data.length;
      }
      gl.bufferSubData(gl.ARRAY_BUFFER, 0, data.subarray(0, count * 4));
      gl.enableVertexAttribArray(aQ);
      gl.vertexAttribPointer(aQ, 4, gl.FLOAT, false, 0, 0);
      gl.drawArrays(gl.POINTS, 0, count);
      gl.disableVertexAttribArray(aQ);
    },
    clear() {
      gl.clear(gl.COLOR_BUFFER_BIT);
    },
    dispose() {
      gl.deleteBuffer(bgBuf);
      gl.deleteBuffer(ptBuf);
      gl.deleteProgram(bg);
      gl.deleteProgram(pt);
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    },
    lost: () => isLost || gl.isContextLost(),
  };
}
