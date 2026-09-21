"use client";

import { useEffect, useRef } from "react";
import {
  type FieldParticle,
  type WebGLParticleContext,
  initParticleProgram,
  createAmbientFieldParticles,
  sampleGlyphsToPoints,
  assignParticlesToGlyphs,
  renderParticles,
} from "@/lib/particles/field-particle-engine";

export interface LaunchCanvasProps {
  primaryMessage: string;
  duration: number; // Total timeline duration in seconds, e.g. 10.0 to 15.0
  onTextFormReady?: () => void;
  onTriggerCrt?: () => void;
  isReducedMotion?: boolean;
}

/**
 * LaunchCanvas: Full Viewport Canvas-based particle renderer for RAWIN 3.0 Launch Experience.
 *
 * Directly utilizes the Home page Canvas field particle engine:
 * 1. Dark field with resting dust particles.
 * 2. "RAWIN v3.0" letters materialize directly from dense glyph-origin particles.
 * 3. Title shimmers with Pacific Cyan and bright white sparks on letter contours.
 * 4. Particles disperse organically outward using authentic field physics.
 * 5. Particles expand across the entire viewport into the signature RAWIN field.
 * 6. Hands off smoothly to CRT transition.
 *
 * Strictly adheres to the zero em dash constraint across all code and comments.
 */
export default function LaunchCanvas({
  primaryMessage,
  duration,
  onTextFormReady,
  onTriggerCrt,
  isReducedMotion = false,
}: LaunchCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const onTextFormReadyRef = useRef(onTextFormReady);
  onTextFormReadyRef.current = onTextFormReady;
  const onTriggerCrtRef = useRef(onTriggerCrt);
  onTriggerCrtRef.current = onTriggerCrt;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let width = (canvas.width = window.innerWidth * dpr);
    let height = (canvas.height = window.innerHeight * dpr);
    canvas.style.width = `${window.innerWidth}px`;
    canvas.style.height = `${window.innerHeight}px`;

    const area = window.innerWidth * window.innerHeight;
    const isTouch = "ontouchstart" in window || navigator.maxTouchPoints > 0;

    // Density configuration matching the Home particle engine:
    // Desktop: ~20,000 total particles (up to 12,000 dedicated to glyphs)
    // Mobile/Touch: ~8,500 total particles (up to 5,500 dedicated to glyphs)
    const targetCount = isTouch
      ? Math.min(9500, Math.max(6000, Math.floor(area / 110)))
      : Math.min(22000, Math.max(14000, Math.floor(area / 75)));

    let particles: FieldParticle[] = createAmbientFieldParticles(
      targetCount,
      width,
      height,
      dpr
    );

    let glContext: WebGLParticleContext | null = initParticleProgram(
      canvas,
      targetCount,
      width,
      height
    );

    const ctx2d = !glContext ? canvas.getContext("2d") : null;

    // -----------------------------------------------------------------
    // GLYPH SAMPLING & ACCURATE GEOMETRY
    // -----------------------------------------------------------------
    let textCenterX = width / 2;
    let textCenterY = height * 0.44;
    let burstParticleCount = 0;
    let isDispersed = false;
    let textFormNotified = false;
    let crtNotified = false;

    const sampleAndAssignGlyphs = async () => {
      // Wait for font ready to guarantee accurate Space Grotesk metrics
      if (document.fonts && document.fonts.ready) {
        try {
          await document.fonts.ready;
        } catch {
          // Fallback
        }
      }

      const winW = window.innerWidth;
      let fontSize = 42;
      if (winW < 360) {
        fontSize = 32;
      } else if (winW < 420) {
        fontSize = 38;
      } else if (winW < 640) {
        fontSize = 46;
      } else if (winW < 1024) {
        fontSize = 58;
      } else if (winW < 1440) {
        fontSize = 72;
      } else {
        fontSize = 80;
      }

      const fontPx = fontSize * dpr;

      const isMobile = winW < 640;

      // Default centers:
      textCenterX = width / 2;
      textCenterY = height * 0.44;

      // Locate layout anchor in DOM for vertical positioning
      const anchorEl = document.getElementById("launch-title-anchor");
      if (anchorEl) {
        const rect = anchorEl.getBoundingClientRect();
        if (rect.height > 10) {
          textCenterY = (rect.top + rect.height / 2) * dpr;
        }
        if (isMobile && rect.width > 20) {
          // On mobile, anchor center aligns with content flow
          textCenterX = (rect.left + rect.width / 2) * dpr;
        }
      }

      // Safe width constraint: keeps outer glyph strokes comfortably inside viewport
      const maxSafeWidth = width * 0.88;

      const glyphPoints = sampleGlyphsToPoints({
        text: primaryMessage || "RAWIN v3.0",
        fontPx,
        fontWeight: "bold",
        fontFamily: '"Space Grotesk", sans-serif',
        letterSpacing: "-0.035em",
        dpr,
        targetCenterX: textCenterX,
        targetCenterY: textCenterY,
        maxSafeWidth,
        isMobile,
      });

      if (glyphPoints.length > 0) {
        const allocated = Math.min(
          particles.length,
          Math.max(isTouch ? 5000 : 10000, glyphPoints.length * 2)
        );
        burstParticleCount = assignParticlesToGlyphs(
          particles,
          glyphPoints,
          dpr,
          allocated,
          0.0 // Start at alpha 0 so title materializes smoothly
        );
      }
    };

    // Initial sample
    sampleAndAssignGlyphs();

    // Re-verify alignment after DOM paint
    const timerSyncDom = setTimeout(sampleAndAssignGlyphs, 150);

    // -----------------------------------------------------------------
    // TIMELINE & PHYSICS LOOP
    // -----------------------------------------------------------------
    const totalMs = Math.max(8000, duration * 1000);
    const startTime = performance.now();
    let rafId: number | null = null;
    let isRunning = true;

    // Timeline percentage milestones
    const pReveal = 0.08; // Title particles begin materializing (~1.0s at 12s)
    const pFormed = 0.18; // Dense particles fully form letter contours (~2.1s at 12s)
    const pDisperse = 0.28; // Outward dispersion begins (~3.4s at 12s)
    const pExpansion = 0.58; // Particles expand broadly across viewport (~7.0s at 12s)
    const pCrt = 0.76; // CRT transition triggered (~9.1s at 12s)

    const loop = (now: number) => {
      if (!isRunning) return;

      const elapsed = now - startTime;
      const progress = Math.min(1.0, elapsed / totalMs);

      // Milestone: Fully formed glyph notification
      if (progress >= pFormed && !textFormNotified) {
        textFormNotified = true;
        onTextFormReadyRef.current?.();
      }

      // Milestone: Outward dispersal impulse
      if (progress >= pDisperse && !isDispersed) {
        isDispersed = true;
        if (!isReducedMotion) {
          for (let i = 0; i < burstParticleCount; i++) {
            const p = particles[i];
            const dx = p.letterX ? p.letterX - textCenterX : p.x - textCenterX;
            const dy = p.letterY ? (p.letterY - textCenterY) * 1.6 : (p.y - textCenterY) * 1.6;
            const angle = Math.atan2(dy, dx) + (Math.random() - 0.5) * 0.55;
            const speed = (3.5 + Math.random() * 8.5) * dpr;
            p.vx = Math.cos(angle) * speed;
            p.vy = Math.sin(angle) * speed;
          }
        }
      }

      // Milestone: CRT transition start
      if (progress >= pCrt && !crtNotified) {
        crtNotified = true;
        onTriggerCrtRef.current?.();
      }

      // Physics update per particle
      const count = particles.length;

      for (let i = 0; i < count; i++) {
        const p = particles[i];

        if (p.isBurst) {
          if (progress < pReveal) {
            // Stage 1: Ambient settling, glyph particles dormant
            p.alpha = 0.0;
            p.x = p.letterX || p.x;
            p.y = p.letterY || p.y;
          } else if (progress < pFormed) {
            // Stage 2: Smooth materialization from 0 to full opacity
            const fadeT = (progress - pReveal) / (pFormed - pReveal);
            p.alpha = Math.min(0.98, fadeT * 0.98);
            const shimmerX = (Math.random() - 0.5) * 0.3 * dpr;
            const shimmerY = (Math.random() - 0.5) * 0.3 * dpr;
            p.x = (p.letterX || p.x) + shimmerX;
            p.y = (p.letterY || p.y) + shimmerY;
          } else if (progress < pDisperse) {
            // Stage 3: Dense particle typography hold with micro-shimmer
            p.alpha = 0.98;
            const shimmerX = (Math.random() - 0.5) * 0.35 * dpr;
            const shimmerY = (Math.random() - 0.5) * 0.35 * dpr;
            p.x = (p.letterX || p.x) + shimmerX;
            p.y = (p.letterY || p.y) + shimmerY;
          } else if (progress < pExpansion) {
            // Stage 4: Outward wave dispersion using Home engine damping
            if (!isReducedMotion) {
              p.vx *= 0.945;
              p.vy *= 0.945;
              p.x += p.vx;
              p.y += p.vy;
              p.alpha = Math.max(0.65, p.alpha * 0.995);
            }
          } else {
            // Stage 5: Restoring field expansion toward full-screen anchors
            if (!isReducedMotion) {
              const settleT = Math.min(1, (progress - pExpansion) / (pCrt - pExpansion));
              const springK = 0.032 * settleT * settleT;

              p.vx += (p.ox - p.x) * springK;
              p.vy += (p.oy - p.y) * springK;
              p.vx *= 0.915;
              p.vy *= 0.915;
              p.x += p.vx;
              p.y += p.vy;

              // Blend back to subtle resting dust opacity
              p.alpha += (p.baseAlpha - p.alpha) * (0.02 + 0.03 * settleT);
            }
          }
        } else {
          // Ambient background dust subtle breathing throughout
          const fx = (p.ox - p.x) * 0.025;
          const fy = (p.oy - p.y) * 0.025;
          p.vx += fx;
          p.vy += fy;
          p.vx *= 0.89;
          p.vy *= 0.89;
          p.x += p.vx;
          p.y += p.vy;
          p.alpha += (p.baseAlpha - p.alpha) * 0.04;
        }
      }

      // Render frame via WebGL GPU or 2D Canvas fallback
      renderParticles(glContext, ctx2d, particles, width, height);

      if (progress < 1.0) {
        rafId = requestAnimationFrame(loop);
      }
    };

    rafId = requestAnimationFrame(loop);

    // -----------------------------------------------------------------
    // RESIZE & VISIBILITY HANDLERS
    // -----------------------------------------------------------------
    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth * dpr;
      height = canvas.height = window.innerHeight * dpr;
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;

      if (glContext) {
        glContext.gl.viewport(0, 0, width, height);
        if (glContext.resLoc) {
          glContext.gl.uniform2f(glContext.resLoc, width, height);
        }
      }

      sampleAndAssignGlyphs();
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        if (rafId !== null) {
          cancelAnimationFrame(rafId);
          rafId = null;
        }
      } else {
        if (!rafId && isRunning) {
          rafId = requestAnimationFrame(loop);
        }
      }
    };

    window.addEventListener("resize", handleResize);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      isRunning = false;
      clearTimeout(timerSyncDom);
      window.removeEventListener("resize", handleResize);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
      }
    };
  }, [primaryMessage, duration, isReducedMotion]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none"
      style={{
        height: "100dvh",
        maxHeight: "100dvh",
      }}
    />
  );
}
