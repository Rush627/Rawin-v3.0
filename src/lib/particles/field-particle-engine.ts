// RAWIN 3.0 Field Particle Engine
// Reusable WebGL and 2D Canvas engine for high-density particle fields and glyph-origin bursts.
// Strictly adheres to the zero em dash constraint across all code and comments.

export interface FieldParticle {
  x: number;
  y: number;
  ox: number;
  oy: number;
  vx: number;
  vy: number;
  size: number;
  baseAlpha: number;
  alpha: number;
  r: number;
  g: number;
  b: number;
  letterX?: number;
  letterY?: number;
  isBurst?: boolean;
}

export interface GlyphPoint {
  x: number;
  y: number;
}

export interface WebGLParticleContext {
  gl: WebGLRenderingContext;
  program: WebGLProgram;
  positionBuffer: WebGLBuffer;
  bufferData: Float32Array;
  resLoc: WebGLUniformLocation | null;
}

export const PARTICLE_VS_SOURCE = `
  attribute vec2 a_position;
  attribute float a_size;
  attribute float a_alpha;
  attribute vec3 a_color;
  uniform vec2 u_resolution;
  varying float v_alpha;
  varying vec3 v_color;
  void main() {
    vec2 zeroToOne = a_position / u_resolution;
    vec2 clipSpace = (zeroToOne * 2.0 - 1.0) * vec2(1.0, -1.0);
    gl_Position = vec4(clipSpace, 0.0, 1.0);
    gl_PointSize = a_size;
    v_alpha = a_alpha;
    v_color = a_color;
  }
`;

export const PARTICLE_FS_SOURCE = `
  precision mediump float;
  varying float v_alpha;
  varying vec3 v_color;
  void main() {
    vec2 coord = gl_PointCoord - vec2(0.5);
    float dist = length(coord);
    if (dist > 0.5) discard;
    float soft = smoothstep(0.5, 0.05, dist);
    gl_FragColor = vec4(v_color, v_alpha * soft);
  }
`;

export function createShader(
  gl: WebGLRenderingContext,
  type: number,
  source: string
): WebGLShader | null {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

export function initParticleProgram(
  canvas: HTMLCanvasElement,
  particleCount: number,
  width: number,
  height: number
): WebGLParticleContext | null {
  try {
    const gl = canvas.getContext("webgl", {
      alpha: true,
      antialias: false,
      depth: false,
      stencil: false,
      powerPreference: "high-performance",
    });

    if (!gl) return null;

    const vs = createShader(gl, gl.VERTEX_SHADER, PARTICLE_VS_SOURCE);
    const fs = createShader(gl, gl.FRAGMENT_SHADER, PARTICLE_FS_SOURCE);
    if (!vs || !fs) return null;

    const program = gl.createProgram();
    if (!program) return null;

    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      return null;
    }

    gl.useProgram(program);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    // 7 float attributes per particle: x, y, size, alpha, r, g, b
    const bufferData = new Float32Array(particleCount * 7);
    const positionBuffer = gl.createBuffer();
    if (!positionBuffer) return null;

    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, bufferData.byteLength, gl.DYNAMIC_DRAW);

    const stride = 7 * Float32Array.BYTES_PER_ELEMENT;

    const posLoc = gl.getAttribLocation(program, "a_position");
    const sizeLoc = gl.getAttribLocation(program, "a_size");
    const alphaLoc = gl.getAttribLocation(program, "a_alpha");
    const colorLoc = gl.getAttribLocation(program, "a_color");

    gl.enableVertexAttribArray(posLoc);
    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, stride, 0);

    gl.enableVertexAttribArray(sizeLoc);
    gl.vertexAttribPointer(
      sizeLoc,
      1,
      gl.FLOAT,
      false,
      stride,
      2 * Float32Array.BYTES_PER_ELEMENT
    );

    gl.enableVertexAttribArray(alphaLoc);
    gl.vertexAttribPointer(
      alphaLoc,
      1,
      gl.FLOAT,
      false,
      stride,
      3 * Float32Array.BYTES_PER_ELEMENT
    );

    gl.enableVertexAttribArray(colorLoc);
    gl.vertexAttribPointer(
      colorLoc,
      3,
      gl.FLOAT,
      false,
      stride,
      4 * Float32Array.BYTES_PER_ELEMENT
    );

    const resLoc = gl.getUniformLocation(program, "u_resolution");
    gl.uniform2f(resLoc, width, height);

    return { gl, program, positionBuffer, bufferData, resLoc };
  } catch {
    return null;
  }
}

export function createAmbientFieldParticles(
  targetCount: number,
  width: number,
  height: number,
  dpr: number
): FieldParticle[] {
  const particles: FieldParticle[] = [];
  const cols = Math.ceil(Math.sqrt((targetCount * width) / height));
  const rows = Math.ceil(targetCount / cols);
  const cellW = width / cols;
  const cellH = height / rows;

  for (let i = 0; i < targetCount; i++) {
    const col = i % cols;
    const row = Math.floor(i / cols);

    const ox = (col + Math.random() * 0.92 + 0.04) * cellW;
    const oy = (row + Math.random() * 0.92 + 0.04) * cellH;

    const sizeRand = Math.random();
    const size = (sizeRand > 0.95 ? 2.0 : sizeRand > 0.72 ? 1.4 : 0.9) * dpr;
    const baseAlpha = 0.06 + Math.random() * 0.10;

    // Palette: 82% dust tone, 12% Pacific Cyan, 6% Apricot Cream
    let r = 0.95;
    let g = 0.96;
    let b = 0.98;

    const tintRand = Math.random();
    if (tintRand < 0.12) {
      // Pacific Cyan (#189BAD)
      r = 0.15;
      g = 0.65;
      b = 0.72;
    } else if (tintRand < 0.18) {
      // Apricot Cream (#FCD49E)
      r = 0.98;
      g = 0.83;
      b = 0.64;
    }

    particles.push({
      x: ox,
      y: oy,
      ox,
      oy,
      vx: 0,
      vy: 0,
      size,
      baseAlpha,
      alpha: baseAlpha,
      r,
      g,
      b,
    });
  }

  return particles;
}

/**
 * Samples glyph pixels from rendered text into high-density coordinates.
 * Renders into an offscreen canvas and extracts exact alpha > 55 pixel coordinates.
 */
export function sampleGlyphsToPoints(options: {
  text: string;
  fontPx: number;
  fontWeight?: string;
  fontFamily?: string;
  letterSpacing?: string;
  dpr: number;
  targetCenterX: number;
  targetCenterY: number;
  maxSafeWidth?: number;
  isMobile?: boolean;
}): GlyphPoint[] {
  const {
    text,
    fontPx,
    fontWeight = "bold",
    fontFamily = '"Space Grotesk", sans-serif',
    letterSpacing = "-0.03em",
    dpr,
    targetCenterX,
    targetCenterY,
    maxSafeWidth,
    isMobile = false,
  } = options;

  if (typeof document === "undefined") return [];

  const offscreen = document.createElement("canvas");
  const ctx = offscreen.getContext("2d", { willReadFrequently: true });
  if (!ctx) return [];

  // Initial measurement
  ctx.font = `${fontWeight} ${fontPx}px ${fontFamily}`;
  if ("letterSpacing" in ctx && letterSpacing) {
    (ctx as unknown as { letterSpacing: string }).letterSpacing = letterSpacing;
  }

  const metrics = ctx.measureText(text);
  const textW = Math.ceil(metrics.width);
  const textH = Math.ceil(fontPx * 1.4);
  // Generous padding ensures wide glyph contours and letter spacing never touch canvas boundaries
  const pad = Math.ceil(48 * dpr);

  const canvasW = textW + pad * 2;
  const canvasH = textH + pad * 2;

  offscreen.width = canvasW;
  offscreen.height = canvasH;

  // Re-apply context font after canvas resize
  ctx.font = `${fontWeight} ${fontPx}px ${fontFamily}`;
  if ("letterSpacing" in ctx && letterSpacing) {
    (ctx as unknown as { letterSpacing: string }).letterSpacing = letterSpacing;
  }
  ctx.textBaseline = "middle";
  ctx.textAlign = "center";
  ctx.fillStyle = "#ffffff";

  const renderCenterX = canvasW / 2;
  const renderCenterY = canvasH / 2;
  ctx.fillText(text, renderCenterX, renderCenterY);

  const imgData = ctx.getImageData(0, 0, canvasW, canvasH);
  const data = imgData.data;

  // Find tight bounding box of ink pixels
  let minX = canvasW;
  let maxX = 0;
  let minY = canvasH;
  let maxY = 0;

  for (let y = 0; y < canvasH; y++) {
    for (let x = 0; x < canvasW; x++) {
      const alpha = data[(y * canvasW + x) * 4 + 3];
      if (alpha > 55) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }

  if (maxX <= minX || maxY <= minY) {
    return [];
  }

  const inkWidth = maxX - minX;
  const inkCenterX = (minX + maxX) / 2;
  const inkCenterY = (minY + maxY) / 2;

  // Dynamic responsive fitting against available canvas width
  // Ensures entire title fits comfortably within safe margins without clipping
  const safeWidth = maxSafeWidth ?? (targetCenterX * 2 * 0.88);
  const scale = inkWidth > safeWidth && safeWidth > 0 ? safeWidth / inkWidth : 1.0;

  // Sampling density step:
  // On mobile devices, preserve the existing verified step.
  // On desktop/laptop screens, use adaptive step so points comfortably match particle count.
  const step = isMobile
    ? Math.max(1, Math.floor(1.0 * dpr))
    : Math.max(2, Math.round(1.25 * dpr));

  const rawPoints: GlyphPoint[] = [];

  for (let y = minY; y <= maxY; y += step) {
    for (let x = minX; x <= maxX; x += step) {
      const alpha = data[(y * canvasW + x) * 4 + 3];
      if (alpha > 35) {
        const screenX = targetCenterX + (x - inkCenterX) * scale;
        const screenY = targetCenterY + (y - inkCenterY) * scale;
        rawPoints.push({ x: screenX, y: screenY });
      }
    }
  }

  return rawPoints;
}

/**
 * Assigns high-density particles to exact glyph pixel points.
 */
export function assignParticlesToGlyphs(
  particles: FieldParticle[],
  glyphPoints: GlyphPoint[],
  dpr: number,
  allocatedCount?: number,
  initialAlpha: number = 0.0
): number {
  if (glyphPoints.length === 0 || particles.length === 0) return 0;

  const count = Math.min(
    particles.length,
    allocatedCount ?? Math.max(8000, glyphPoints.length * 2)
  );

  for (let i = 0; i < count; i++) {
    // When allocated particles exceed or equal points, cycle through points.
    // When particles are fewer than points, sample uniformly across the entire array
    // so no portion of any glyph (R through 0) is ever truncated.
    const ptIndex =
      glyphPoints.length <= count
        ? i % glyphPoints.length
        : Math.floor((i * glyphPoints.length) / count);
    const pt = glyphPoints[ptIndex];
    const p = particles[i];

    // Sub-pixel jitter adhering closely to glyph contours
    const targetX = pt.x + (Math.random() - 0.5) * 0.8 * dpr;
    const targetY = pt.y + (Math.random() - 0.5) * 0.8 * dpr;

    p.x = targetX;
    p.y = targetY;
    p.letterX = targetX;
    p.letterY = targetY;
    p.vx = 0;
    p.vy = 0;
    p.isBurst = true;

    // Configurable initial opacity (starts at 0.0 for smooth materialization)
    p.alpha = initialAlpha;
    p.size = (Math.random() > 0.6 ? 2.4 : 1.7) * dpr;

    // Vibrant Pacific Cyan (#189BAD) and bright white letter sparks
    if (Math.random() < 0.78) {
      p.r = 0.09;
      p.g = 0.61;
      p.b = 0.68;
    } else {
      p.r = 1.0;
      p.g = 1.0;
      p.b = 1.0;
    }
  }

  return count;
}

/**
 * Renders particles via WebGL or 2D canvas fallback.
 */
export function renderParticles(
  glContext: WebGLParticleContext | null,
  ctx2d: CanvasRenderingContext2D | null,
  particles: FieldParticle[],
  width: number,
  height: number
): void {
  const count = particles.length;

  if (glContext) {
    const { gl, program, positionBuffer, bufferData } = glContext;

    for (let i = 0; i < count; i++) {
      const p = particles[i];
      const offset = i * 7;
      const speed = Math.hypot(p.vx, p.vy);

      bufferData[offset] = p.x;
      bufferData[offset + 1] = p.y;
      bufferData[offset + 2] = p.size * (1.0 + Math.min(speed * 0.28, 0.9));
      bufferData[offset + 3] = p.alpha;
      bufferData[offset + 4] = p.r;
      bufferData[offset + 5] = p.g;
      bufferData[offset + 6] = p.b;
    }

    gl.viewport(0, 0, width, height);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, bufferData);

    gl.drawArrays(gl.POINTS, 0, count);
  } else if (ctx2d) {
    ctx2d.clearRect(0, 0, width, height);
    for (let i = 0; i < count; i++) {
      const p = particles[i];
      ctx2d.fillStyle = `rgba(${Math.round(p.r * 255)}, ${Math.round(
        p.g * 255
      )}, ${Math.round(p.b * 255)}, ${p.alpha.toFixed(3)})`;
      ctx2d.beginPath();
      ctx2d.arc(p.x, p.y, p.size * 0.5, 0, Math.PI * 2);
      ctx2d.fill();
    }
  }
}
