"use client";

import { useEffect, useRef } from "react";

interface Particle {
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

interface PageProtectedRect {
  pageLeft: number;
  pageTop: number;
  width: number;
  height: number;
}

interface ActiveRect {
  left: number;
  top: number;
  right: number;
  bottom: number;
  pad: number;
}

export default function ParticleField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Detect device capabilities and reduced motion preference
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const isTouch = "ontouchstart" in window || navigator.maxTouchPoints > 0;
    const isSmallPhone = window.innerWidth < 768;

    // Small-screen mobile phones & reduced-motion: Disable particle engine completely for peak performance
    if (prefersReducedMotion || (isTouch && isSmallPhone)) {
      return;
    }

    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);

    let width = (canvas.width = window.innerWidth * dpr);
    let height = (canvas.height = window.innerHeight * dpr);
    canvas.style.width = `${window.innerWidth}px`;
    canvas.style.height = `${window.innerHeight}px`;

    // Choose particle count based on device:
    // Desktop: ~19,000 particles for a dense, fine powdery dust field
    // Touch/Mobile: ~3,500 static particles
    const area = window.innerWidth * window.innerHeight;
    const targetCount = isTouch
      ? Math.min(3500, Math.floor(area / 320))
      : prefersReducedMotion
      ? Math.min(4500, Math.floor(area / 260))
      : Math.min(19000, Math.max(9000, Math.floor(area / 90)));

    const particles: Particle[] = [];

    // Initialize regular anchor positions across the entire viewport
    const cols = Math.ceil(Math.sqrt((targetCount * width) / height));
    const rows = Math.ceil(targetCount / cols);
    const cellW = width / cols;
    const cellH = height / rows;

    for (let i = 0; i < targetCount; i++) {
      const col = i % cols;
      const row = Math.floor(i / cols);

      // Organic jittered distribution
      const ox = (col + Math.random() * 0.92 + 0.04) * cellW;
      const oy = (row + Math.random() * 0.92 + 0.04) * cellH;

      // Microscopic particle sizes (0.75px to 1.8px)
      const sizeRand = Math.random();
      const size = (sizeRand > 0.95 ? 2.0 : sizeRand > 0.72 ? 1.4 : 0.9) * dpr;

      // Base resting opacity against Ink Black (#101019)
      const baseAlpha = 0.06 + Math.random() * 0.10;

      // Subtle chromatic dust tones
      let r = 0.95;
      let g = 0.96;
      let b = 0.98;

      const tintRand = Math.random();
      if (tintRand < 0.12) {
        // Subtle Pacific Cyan (#189BAD)
        r = 0.15;
        g = 0.65;
        b = 0.72;
      } else if (tintRand < 0.18) {
        // Subtle Apricot Cream (#FCD49E)
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

    // -------------------------------------------------------------
    // 1. CONTENT-AWARE PROTECTED REGIONS CACHING
    // -------------------------------------------------------------
    let pageProtectedRects: PageProtectedRect[] = [];

    const updateProtectedRegions = () => {
      const elements = document.querySelectorAll("[data-particle-protected]");
      const scrollY = window.scrollY || window.pageYOffset || 0;
      const scrollX = window.scrollX || window.pageXOffset || 0;
      const newRects: PageProtectedRect[] = [];

      elements.forEach((el) => {
        const rect = el.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          newRects.push({
            pageLeft: rect.left + scrollX,
            pageTop: rect.top + scrollY,
            width: rect.width,
            height: rect.height,
          });
        }
      });

      pageProtectedRects = newRects;
    };

    // Scan initial regions after brief DOM layout stabilization
    const timerInitRegions = setTimeout(updateProtectedRegions, 200);
    const timerSecondScan = setTimeout(updateProtectedRegions, 800);

    // -------------------------------------------------------------
    // 2. HERO NAME SAMPLING & INITIAL BURST CONFIGURATION
    // -------------------------------------------------------------
    let burstActive = false;
    let burstStartTime = 0;
    let burstExploded = false;
    let burstParticleCount = 0;
    let burstHeroCenterX = 0;
    let burstHeroCenterY = 0;

    // Development Mode: sessionStorage condition is disabled so burst plays on every refresh.
    // The user will test and verify visual burst before restoring session suppression.
    const shouldAttemptBurst = !prefersReducedMotion && !isTouch;

    const initHeroBurst = async () => {
      if (!shouldAttemptBurst) return;

      // Wait for font loading to ensure accurate text metrics
      if (document.fonts && document.fonts.ready) {
        try {
          await document.fonts.ready;
        } catch {
          // Continue if font check fails
        }
      }

      // Retry locating #hero-name element across frames until layout stabilizes
      let heroEl: HTMLElement | null = null;
      let rect: DOMRect | null = null;

      for (let attempt = 0; attempt < 20; attempt++) {
        heroEl = document.getElementById("hero-name");
        if (heroEl) {
          rect = heroEl.getBoundingClientRect();
          if (rect.width > 20 && rect.height > 10) {
            break;
          }
        }
        await new Promise((resolve) => requestAnimationFrame(resolve));
      }

      if (!heroEl || !rect || rect.width <= 0 || rect.height <= 0) {
        console.warn("[ParticleField] Hero burst: #hero-name element not found or has 0 dimensions.");
        return;
      }

      // Measure exact DOM baseline for flawless vertical alignment
      let baselineDOM = rect.top + rect.height * 0.76;
      try {
        const span = document.createElement("span");
        span.style.display = "inline-block";
        span.style.width = "0px";
        span.style.height = "0px";
        span.style.verticalAlign = "baseline";
        heroEl.appendChild(span);
        const measuredBaseline = span.getBoundingClientRect().top;
        if (measuredBaseline > rect.top && measuredBaseline < rect.bottom) {
          baselineDOM = measuredBaseline;
        }
        heroEl.removeChild(span);
      } catch {
        // Fallback to proportional estimate if DOM injection fails
      }

      const style = window.getComputedStyle(heroEl);
      const fontSizeNum = parseFloat(style.fontSize) || 48;
      const fontPx = fontSizeNum * dpr;
      const fontWeight = style.fontWeight || "bold";

      // Strip any CSS variables from fontFamily so Canvas 2D parser does not reject it
      let cleanFontFamily = style.fontFamily.replace(/var\([^)]+\),?\s*/g, "").trim();
      if (!cleanFontFamily.includes("Space Grotesk") && !cleanFontFamily.includes("space-grotesk")) {
        cleanFontFamily = `"Space Grotesk", ${cleanFontFamily || "sans-serif"}`;
      }

      // Measure words and individual word bounding rects for 100% kerning and spacing fidelity
      const pad = Math.ceil(36 * dpr);
      const baselineCanvasY = Math.ceil((rect.height * dpr + pad * 2) * 0.65);
      const step = Math.max(1, Math.floor(1.4 * dpr));

      const textContent = heroEl.textContent?.trim() || "Rushan Siddiqui";
      const words = textContent.split(/\s+/);
      const wordItems: { word: string; left: number; width: number }[] = [];

      const textNode = heroEl.firstChild;
      if (textNode && textNode.nodeType === Node.TEXT_NODE) {
        let charIndex = 0;
        for (const w of words) {
          const wStart = textContent.indexOf(w, charIndex);
          if (wStart !== -1) {
            const wEnd = wStart + w.length;
            charIndex = wEnd;
            try {
              const r = document.createRange();
              r.setStart(textNode, wStart);
              r.setEnd(textNode, wEnd);
              const rRect = r.getBoundingClientRect();
              wordItems.push({ word: w, left: rRect.left, width: rRect.width });
            } catch {
              // Fallback
            }
          }
        }
      }

      const rawPoints: { screenX: number; screenY: number }[] = [];

      if (wordItems.length === words.length && wordItems.length > 0) {
        // High-precision per-word rasterization
        for (const item of wordItems) {
          const offW = Math.ceil(item.width * dpr + pad * 2);
          const offH = Math.ceil(rect.height * dpr + pad * 2);
          const c = document.createElement("canvas");
          c.width = offW;
          c.height = offH;
          const ctx = c.getContext("2d", { willReadFrequently: true });
          if (!ctx) continue;

          ctx.font = `${fontWeight} ${fontPx}px ${cleanFontFamily}`;
          if ("letterSpacing" in ctx && style.letterSpacing) {
            (ctx as unknown as { letterSpacing: string }).letterSpacing = style.letterSpacing;
          }
          ctx.textBaseline = "alphabetic";
          ctx.textAlign = "left";
          ctx.fillStyle = "#ffffff";
          ctx.fillText(item.word, pad, baselineCanvasY);

          const idata = ctx.getImageData(0, 0, offW, offH).data;
          const wordDomLeft = item.left * dpr;
          const wordBaseline = baselineDOM * dpr;

          for (let py = 0; py < offH; py += step) {
            for (let px = 0; px < offW; px += step) {
              const a = idata[(py * offW + px) * 4 + 3];
              if (a > 55) {
                const sx = wordDomLeft + (px - pad);
                const sy = wordBaseline + (py - baselineCanvasY);
                rawPoints.push({ screenX: sx, screenY: sy });
              }
            }
          }
        }
      } else {
        // Single-pass fallback
        const offscreenW = Math.ceil(rect.width * dpr + pad * 2);
        const offscreenH = Math.ceil(rect.height * dpr + pad * 2);
        const offscreen = document.createElement("canvas");
        offscreen.width = offscreenW;
        offscreen.height = offscreenH;
        const tctx = offscreen.getContext("2d", { willReadFrequently: true });
        if (tctx) {
          tctx.font = `${fontWeight} ${fontPx}px ${cleanFontFamily}`;
          if ("letterSpacing" in tctx && style.letterSpacing) {
            (tctx as unknown as { letterSpacing: string }).letterSpacing = style.letterSpacing;
          }
          tctx.textBaseline = "alphabetic";
          tctx.textAlign = "left";
          tctx.fillStyle = "#ffffff";
          tctx.fillText(textContent, pad, baselineCanvasY);

          const data = tctx.getImageData(0, 0, offscreenW, offscreenH).data;
          let minX = offscreenW;
          for (let py = 0; py < offscreenH; py += step) {
            for (let px = 0; px < offscreenW; px += step) {
              const alpha = data[(py * offscreenW + px) * 4 + 3];
              if (alpha > 55 && px < minX) minX = px;
            }
          }

          const domLeft = rect.left * dpr;
          const domBaseline = baselineDOM * dpr;
          for (let py = 0; py < offscreenH; py += step) {
            for (let px = 0; px < offscreenW; px += step) {
              const alpha = data[(py * offscreenW + px) * 4 + 3];
              if (alpha > 55) {
                rawPoints.push({
                  screenX: domLeft + (px - minX),
                  screenY: domBaseline + (py - baselineCanvasY),
                });
              }
            }
          }
        }
      }

      if (rawPoints.length === 0) {
        console.warn("[ParticleField] Hero burst: No ink pixels found in rasterization.");
        return;
      }

      burstHeroCenterX = (rect.left + rect.width / 2) * dpr;
      burstHeroCenterY = (rect.top + rect.height / 2) * dpr;

      // Dedicate ~7,500 particles to visibly form the letters
      const burstCount = Math.min(particles.length, Math.max(6500, rawPoints.length * 2));
      burstParticleCount = burstCount;

      for (let i = 0; i < burstCount; i++) {
        const pt = rawPoints[i % rawPoints.length];
        const p = particles[i];

        // Exact sub-pixel contour coordinate aligned to DOM baseline and word boundaries
        const targetX = pt.screenX + (Math.random() - 0.5) * 1.2 * dpr;
        const targetY = pt.screenY + (Math.random() - 0.5) * 1.2 * dpr;

        p.x = targetX;
        p.y = targetY;
        p.letterX = targetX;
        p.letterY = targetY;
        p.vx = 0;
        p.vy = 0;
        p.isBurst = true;

        // Unmistakably bright and crisp opacity during text formation
        p.alpha = 0.96;
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

      burstActive = true;
      burstStartTime = performance.now();
      burstExploded = false;

      // Wake render loop if sleeping
      if (!isAwake) {
        isAwake = true;
        rafId = requestAnimationFrame(loop);
      }
    };

    // Trigger hero burst initialization
    initHeroBurst();

    // -------------------------------------------------------------
    // 3. WEBGL SHADER PIPELINE & GPU BUFFER
    // -------------------------------------------------------------
    let gl: WebGLRenderingContext | null = null;
    let program: WebGLProgram | null = null;
    let positionBuffer: WebGLBuffer | null = null;
    let bufferData: Float32Array | null = null;

    try {
      gl = canvas.getContext("webgl", {
        alpha: true,
        antialias: false,
        depth: false,
        stencil: false,
        powerPreference: "high-performance",
      });

      if (gl) {
        const vsSource = `
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

        const fsSource = `
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

        const createShader = (type: number, source: string) => {
          if (!gl) return null;
          const s = gl.createShader(type);
          if (!s) return null;
          gl.shaderSource(s, source);
          gl.compileShader(s);
          if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
            gl.deleteShader(s);
            return null;
          }
          return s;
        };

        const vs = createShader(gl.VERTEX_SHADER, vsSource);
        const fs = createShader(gl.FRAGMENT_SHADER, fsSource);

        if (vs && fs) {
          program = gl.createProgram();
          if (program) {
            gl.attachShader(program, vs);
            gl.attachShader(program, fs);
            gl.linkProgram(program);
            if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
              program = null;
            }
          }
        }

        if (program) {
          gl.useProgram(program);
          gl.enable(gl.BLEND);
          gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

          // 7 attributes per particle: x, y, size, alpha, r, g, b
          bufferData = new Float32Array(particles.length * 7);
          positionBuffer = gl.createBuffer();
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
          gl.vertexAttribPointer(sizeLoc, 1, gl.FLOAT, false, stride, 2 * Float32Array.BYTES_PER_ELEMENT);

          gl.enableVertexAttribArray(alphaLoc);
          gl.vertexAttribPointer(alphaLoc, 1, gl.FLOAT, false, stride, 3 * Float32Array.BYTES_PER_ELEMENT);

          gl.enableVertexAttribArray(colorLoc);
          gl.vertexAttribPointer(colorLoc, 3, gl.FLOAT, false, stride, 4 * Float32Array.BYTES_PER_ELEMENT);

          const resLoc = gl.getUniformLocation(program, "u_resolution");
          gl.uniform2f(resLoc, width, height);
        }
      }
    } catch {
      gl = null;
    }

    const ctx2d = !gl ? canvas.getContext("2d") : null;

    // -------------------------------------------------------------
    // 4. CURSOR TRACKING & FLUID DYNAMICS
    // -------------------------------------------------------------
    let mouseX = -1000;
    let mouseY = -1000;
    let prevMouseX = -1000;
    let prevMouseY = -1000;
    let mouseVx = 0;
    let mouseVy = 0;
    let smoothVx = 0;
    let smoothVy = 0;
    let lastPointerTime = 0;

    let isAwake = true;
    let rafId: number | null = null;

    const onPointerMove = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      const nx = (e.clientX - rect.left) * dpr;
      const ny = (e.clientY - rect.top) * dpr;

      if (prevMouseX < 0) {
        prevMouseX = nx;
        prevMouseY = ny;
      } else {
        prevMouseX = mouseX;
        prevMouseY = mouseY;
      }

      mouseX = nx;
      mouseY = ny;

      mouseVx = mouseX - prevMouseX;
      mouseVy = mouseY - prevMouseY;
      lastPointerTime = performance.now();

      if (!isAwake) {
        isAwake = true;
        rafId = requestAnimationFrame(loop);
      }
    };

    const onPointerLeave = () => {
      mouseX = -1000;
      mouseY = -1000;
      prevMouseX = -1000;
      prevMouseY = -1000;
      mouseVx = 0;
      mouseVy = 0;
    };

    if (!isTouch && !prefersReducedMotion) {
      window.addEventListener("pointermove", onPointerMove, { passive: true });
      document.addEventListener("mouseleave", onPointerLeave);
      window.addEventListener("scroll", () => {
        if (!isAwake) {
          isAwake = true;
          rafId = requestAnimationFrame(loop);
        }
      }, { passive: true });
    }

    // -------------------------------------------------------------
    // 5. MAIN PHYSICS & RENDERING LOOP
    // -------------------------------------------------------------
    const activeRects: ActiveRect[] = [];

    const loop = () => {
      const now = performance.now();
      const timeSinceMove = now - lastPointerTime;

      // Burst Sequence Progression
      let burstElapsed = 0;
      if (burstActive) {
        burstElapsed = now - burstStartTime;

        // Phase 2: Outward burst starts at 350ms after clear letter hold
        if (burstElapsed >= 350 && !burstExploded) {
          burstExploded = true;
          for (let i = 0; i < burstParticleCount; i++) {
            const p = particles[i];
            const dx = p.x - burstHeroCenterX;
            const dy = (p.y - burstHeroCenterY) * 1.6;
            const angle = Math.atan2(dy, dx) + (Math.random() - 0.5) * 0.55;
            const speed = (4.5 + Math.random() * 11.5) * dpr;
            p.vx = Math.cos(angle) * speed;
            p.vy = Math.sin(angle) * speed;
          }
        }

        // Phase 4: Settle burst into normal interactive field at 2200ms
        if (burstElapsed > 2200) {
          burstActive = false;
        }
      }

      // Smooth cursor velocity
      smoothVx += (mouseVx - smoothVx) * 0.28;
      smoothVy += (mouseVy - smoothVy) * 0.28;

      if (timeSinceMove > 50) {
        mouseVx *= 0.85;
        mouseVy *= 0.85;
      }

      const cursorSpeed = Math.hypot(smoothVx, smoothVy);
      // Soft influence radius around cursor: scales dynamically with velocity
      const influenceRadius = (135 + Math.min(cursorSpeed * 3.0, 95)) * dpr;
      const influenceRadiusSq = influenceRadius * influenceRadius;

      // Trailing wake point for local suction/density clustering
      const trailX = mouseX - smoothVx * 0.75;
      const trailY = mouseY - smoothVy * 0.75;

      // Precalculate active protected regions in viewport space for this frame
      activeRects.length = 0;
      if (!isTouch && !prefersReducedMotion && pageProtectedRects.length > 0) {
        const scrollY = window.scrollY || window.pageYOffset || 0;
        const scrollX = window.scrollX || window.pageXOffset || 0;
        const vTop = scrollY;
        const vBottom = scrollY + window.innerHeight;
        const vLeft = scrollX;
        const vRight = scrollX + window.innerWidth;

        for (let r = 0; r < pageProtectedRects.length; r++) {
          const pr = pageProtectedRects[r];
          // Check intersection with viewport plus buffer
          if (
            pr.pageTop + pr.height >= vTop - 50 &&
            pr.pageTop <= vBottom + 50 &&
            pr.pageLeft + pr.width >= vLeft - 50 &&
            pr.pageLeft <= vRight + 50
          ) {
            const left = (pr.pageLeft - scrollX) * dpr;
            const top = (pr.pageTop - scrollY) * dpr;
            const right = left + pr.width * dpr;
            const bottom = top + pr.height * dpr;
            const pad = Math.min(32 * dpr, Math.max(16 * dpr, pr.height * 0.14 * dpr));
            activeRects.push({ left, top, right, bottom, pad });
          }
        }
      }

      const activeCount = activeRects.length;

      // Check if cursor is currently hovering inside any protected content
      let cursorOverProtected = false;
      if (mouseX > 0 && mouseY > 0) {
        for (let r = 0; r < activeCount; r++) {
          const ar = activeRects[r];
          if (mouseX >= ar.left && mouseX <= ar.right && mouseY >= ar.top && mouseY <= ar.bottom) {
            cursorOverProtected = true;
            break;
          }
        }
      }

      let maxParticleV = 0;
      const count = particles.length;

      for (let i = 0; i < count; i++) {
        const p = particles[i];

        if (!prefersReducedMotion && !isTouch) {
          if (p.isBurst && burstActive) {
            // =======================================================
            // HERO BURST PARTICLES LIFECYCLE
            // =======================================================
            if (burstElapsed < 350) {
              // Phase 1: Hold densely on "Rushan Siddiqui" text with micro-shimmer
              const shimmerX = (Math.random() - 0.5) * 0.3 * dpr;
              const shimmerY = (Math.random() - 0.5) * 0.3 * dpr;
              p.x = (p.letterX || p.x) + shimmerX;
              p.y = (p.letterY || p.y) + shimmerY;
              p.alpha = 0.96;
            } else if (burstElapsed < 850) {
              // Phase 2: Outward explosive spray
              p.vx *= 0.945;
              p.vy *= 0.945;
              p.x += p.vx;
              p.y += p.vy;
              // Maintain high visibility during the outward wave
              p.alpha = Math.max(0.70, p.alpha * 0.995);
            } else {
              // Phase 3: Field expansion and smooth transition to anchor
              const transitionProgress = Math.min(1, (burstElapsed - 850) / 1350);
              const springK = 0.032 * transitionProgress * transitionProgress;

              p.vx += (p.ox - p.x) * springK;
              p.vy += (p.oy - p.y) * springK;
              p.vx *= 0.915;
              p.vy *= 0.915;
              p.x += p.vx;
              p.y += p.vy;

              // Smoothly blend alpha and color back into ambient dust tones
              p.alpha += (p.baseAlpha - p.alpha) * (0.02 + 0.03 * transitionProgress);
            }
          } else {
            // =======================================================
            // AMBIENT & POST-BURST INTERACTIVE PARTICLES
            // =======================================================
            // Cursor Disturbance (Active when cursor is moving)
            if (!burstActive || burstElapsed > 1200) {
              const dx = p.x - mouseX;
              const dy = p.y - mouseY;
              const distSq = dx * dx + dy * dy;

              if (distSq < influenceRadiusSq && distSq > 0) {
                const dist = Math.sqrt(distSq);
                const normDist = dist / influenceRadius;
                const factor = (1 - normDist) * (1 - normDist); // Quadratic falloff

                // 1. Outward physical displacement away from cursor path
                const push = factor * (1.9 * dpr + Math.min(cursorSpeed * 0.08, 3.8 * dpr));
                const nx = dx / dist;
                const ny = dy / dist;
                p.vx += nx * push;
                p.vy += ny * push;

                // 2. Fluid drag force (carries particles in movement direction)
                const drag = factor * 0.32;
                p.vx += smoothVx * drag;
                p.vy += smoothVy * drag;

                // 3. Local Wake Suction (Draws particles slightly toward trailing wake)
                // When cursor is over protected UI, dampen suction to prevent clustering on top of text
                const suctionFactor = cursorOverProtected ? 0.15 : 1.0;
                const tdx = trailX - p.x;
                const tdy = trailY - p.y;
                const tdist = Math.hypot(tdx, tdy);
                const suction = factor * Math.min(cursorSpeed * 0.06, 1.4) * dpr * suctionFactor;
                p.vx += (tdx / (tdist + 0.1)) * suction;
                p.vy += (tdy / (tdist + 0.1)) * suction;

                // 4. Local luminescence boost: disturbed cluster glows softly
                // Keep subdued if cursor is over protected content
                const energyScale = cursorOverProtected ? 0.35 : 1.0;
                const energyBoost = factor * (0.32 + Math.min(cursorSpeed * 0.02, 0.38)) * energyScale;
                p.alpha = Math.min(p.alpha + energyBoost, 0.75);
              }
            }

            // =======================================================
            // CONTENT-AWARE SOFT REPULSION FOR PROTECTED REGIONS
            // =======================================================
            for (let r = 0; r < activeCount; r++) {
              const ar = activeRects[r];
              const pad = ar.pad;

              // Quick AABB rejection with padding
              if (
                p.x < ar.left - pad ||
                p.x > ar.right + pad ||
                p.y < ar.top - pad ||
                p.y > ar.bottom + pad
              ) {
                continue;
              }

              // Clamped point on the rectangle boundary
              const clampedX = Math.max(ar.left, Math.min(p.x, ar.right));
              const clampedY = Math.max(ar.top, Math.min(p.y, ar.bottom));

              const dx = p.x - clampedX;
              const dy = p.y - clampedY;
              const distSq = dx * dx + dy * dy;

              if (distSq < 0.0001) {
                // Particle is inside protected UI: gently guide it toward the nearest edge
                const distLeft = p.x - ar.left;
                const distRight = ar.right - p.x;
                const distTop = p.y - ar.top;
                const distBottom = ar.bottom - p.y;
                const minDist = Math.min(distLeft, distRight, distTop, distBottom);

                let pushX = 0;
                let pushY = 0;
                if (minDist === distLeft) pushX = -1.4 * dpr;
                else if (minDist === distRight) pushX = 1.4 * dpr;
                else if (minDist === distTop) pushY = -1.4 * dpr;
                else pushY = 1.4 * dpr;

                p.vx += pushX;
                p.vy += pushY;
                p.alpha *= 0.88;
              } else {
                const dist = Math.sqrt(distSq);
                if (dist < pad) {
                  // Soft quadratic repulsion falloff outside the boundary
                  const t = 1 - dist / pad;
                  const repel = t * t * (1.8 * dpr);
                  p.vx += (dx / dist) * repel;
                  p.vy += (dy / dist) * repel;
                  p.alpha *= (1 - 0.22 * t);
                }
              }
            }

            // Restoring spring force pulling particle back to anchor (ox, oy)
            const fx = (p.ox - p.x) * 0.032;
            const fy = (p.oy - p.y) * 0.032;
            p.vx += fx;
            p.vy += fy;

            // Viscous air resistance / damping
            p.vx *= 0.89;
            p.vy *= 0.89;

            // Position update
            p.x += p.vx;
            p.y += p.vy;

            // Alpha settles back to resting base opacity
            p.alpha += (p.baseAlpha - p.alpha) * 0.04;
          }

          const speedSq = p.vx * p.vx + p.vy * p.vy;
          if (speedSq > maxParticleV) {
            maxParticleV = speedSq;
          }
        }

        // Write to WebGL GPU buffer
        if (bufferData) {
          const offset = i * 7;
          bufferData[offset] = p.x;
          bufferData[offset + 1] = p.y;
          const speed = Math.hypot(p.vx, p.vy);
          bufferData[offset + 2] = p.size * (1.0 + Math.min(speed * 0.28, 0.9));
          bufferData[offset + 3] = p.alpha;
          bufferData[offset + 4] = p.r;
          bufferData[offset + 5] = p.g;
          bufferData[offset + 6] = p.b;
        }
      }

      // Render via WebGL GPU
      if (gl && program && positionBuffer && bufferData) {
        gl.viewport(0, 0, width, height);
        gl.clearColor(0, 0, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT);

        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
        gl.bufferSubData(gl.ARRAY_BUFFER, 0, bufferData);

        gl.drawArrays(gl.POINTS, 0, count);
      } else if (ctx2d) {
        // 2D Canvas Fallback
        ctx2d.clearRect(0, 0, width, height);
        for (let i = 0; i < count; i++) {
          const p = particles[i];
          ctx2d.fillStyle = `rgba(${Math.round(p.r * 255)}, ${Math.round(p.g * 255)}, ${Math.round(
            p.b * 255
          )}, ${p.alpha.toFixed(3)})`;
          ctx2d.beginPath();
          ctx2d.arc(p.x, p.y, p.size * 0.5, 0, Math.PI * 2);
          ctx2d.fill();
        }
      }

      // Idle sleep check: if burst is done, particles settled, and cursor stationary
      if (
        !burstActive &&
        !isTouch &&
        !prefersReducedMotion &&
        maxParticleV < 0.002 &&
        timeSinceMove > 400 &&
        cursorSpeed < 0.02
      ) {
        isAwake = false;
        rafId = null;
        return;
      }

      // Static single frame for touch or reduced motion
      if (isTouch || prefersReducedMotion) {
        isAwake = false;
        rafId = null;
        return;
      }

      rafId = requestAnimationFrame(loop);
    };

    loop();

    const onResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth * dpr;
      height = canvas.height = window.innerHeight * dpr;
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;

      if (gl && program) {
        gl.viewport(0, 0, width, height);
        const resLoc = gl.getUniformLocation(program, "u_resolution");
        gl.uniform2f(resLoc, width, height);
      }

      const rCols = Math.ceil(Math.sqrt((particles.length * width) / height));
      const rRows = Math.ceil(particles.length / rCols);
      const rCellW = width / rCols;
      const rCellH = height / rRows;

      for (let i = 0; i < particles.length; i++) {
        const col = i % rCols;
        const row = Math.floor(i / rCols);
        const ox = (col + Math.random() * 0.92 + 0.04) * rCellW;
        const oy = (row + Math.random() * 0.92 + 0.04) * rCellH;
        particles[i].ox = ox;
        particles[i].oy = oy;
        if (!particles[i].isBurst) {
          particles[i].x = ox;
          particles[i].y = oy;
          particles[i].vx = 0;
          particles[i].vy = 0;
        }
      }

      updateProtectedRegions();

      if (!isAwake) {
        isAwake = true;
        rafId = requestAnimationFrame(loop);
      }
    };

    window.addEventListener("resize", onResize);

    return () => {
      clearTimeout(timerInitRegions);
      clearTimeout(timerSecondScan);
      window.removeEventListener("resize", onResize);
      if (!isTouch && !prefersReducedMotion) {
        window.removeEventListener("pointermove", onPointerMove);
        document.removeEventListener("mouseleave", onPointerLeave);
      }
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
      }
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="fixed inset-0 pointer-events-none z-0 overflow-hidden hidden md:block"
    />
  );
}
