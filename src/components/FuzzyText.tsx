"use client";

import React, { useEffect, useRef, useState } from "react";

export interface FuzzyTextProps {
  children: React.ReactNode;
  fontSize?: string | number;
  fontWeight?: string | number;
  fontFamily?: string;
  color?: string;
  enableHover?: boolean;
  baseIntensity?: number;
  hoverIntensity?: number;
  fuzzRange?: number;
  fps?: number;
  direction?: "horizontal" | "vertical" | "both";
  transitionDuration?: number;
  clickEffect?: boolean;
  glitchMode?: boolean;
  glitchInterval?: number;
  glitchDuration?: number;
  gradient?: string[] | null;
  letterSpacing?: number;
  className?: string;
}

export default function FuzzyText({
  children,
  fontSize = "clamp(3rem, 12vw, 9rem)",
  fontWeight = 900,
  fontFamily = "var(--font-space-grotesk), sans-serif",
  color = "#F5F7FA",
  enableHover = true,
  baseIntensity = 0.18,
  hoverIntensity = 0.5,
  fuzzRange = 30,
  fps = 60,
  direction = "horizontal",
  transitionDuration = 8,
  clickEffect = false,
  glitchMode = false,
  glitchInterval = 2000,
  glitchDuration = 200,
  gradient = null,
  letterSpacing = 0,
  className = "",
}: FuzzyTextProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const textContent = React.Children.toArray(children).join("");
  const [isReducedMotion, setIsReducedMotion] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setIsReducedMotion(motionQuery.matches);

    const handleMotion = (e: MediaQueryListEvent) => setIsReducedMotion(e.matches);
    motionQuery.addEventListener?.("change", handleMotion);
    return () => motionQuery.removeEventListener?.("change", handleMotion);
  }, []);

  useEffect(() => {
    let animationFrameId: number;
    let isCancelled = false;
    let glitchTimeoutId: NodeJS.Timeout;
    let glitchEndTimeoutId: NodeJS.Timeout;
    let clickTimeoutId: NodeJS.Timeout;
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Detect fine pointer for interactive hover
    const canHover =
      typeof window !== "undefined"
        ? window.matchMedia("(hover: hover) and (pointer: fine)").matches
        : false;
    const effectiveHover = enableHover && canHover && !isReducedMotion;

    const init = async () => {
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const computedFontFamily =
        fontFamily === "inherit"
          ? window.getComputedStyle(canvas).fontFamily || "sans-serif"
          : fontFamily;

      const fontSizeStr = typeof fontSize === "number" ? `${fontSize}px` : fontSize;
      const fontString = `${fontWeight} ${fontSizeStr} ${computedFontFamily}`;

      try {
        await document.fonts.load(fontString);
      } catch {
        await document.fonts.ready;
      }
      if (isCancelled) return;

      let numericFontSize: number;
      if (typeof fontSize === "number") {
        numericFontSize = fontSize;
      } else {
        const temp = document.createElement("span");
        temp.style.fontSize = fontSize;
        temp.style.position = "absolute";
        temp.style.visibility = "hidden";
        document.body.appendChild(temp);
        const computedSize = window.getComputedStyle(temp).fontSize;
        numericFontSize = parseFloat(computedSize) || 72;
        document.body.removeChild(temp);
      }

      const text = textContent;

      const offscreen = document.createElement("canvas");
      const offCtx = offscreen.getContext("2d");
      if (!offCtx) return;

      offCtx.font = `${fontWeight} ${fontSizeStr} ${computedFontFamily}`;
      offCtx.textBaseline = "alphabetic";

      let totalWidth = 0;
      if (letterSpacing !== 0) {
        for (const char of text) {
          totalWidth += offCtx.measureText(char).width + letterSpacing;
        }
        totalWidth -= letterSpacing;
      } else {
        totalWidth = offCtx.measureText(text).width;
      }

      const metrics = offCtx.measureText(text);
      const actualLeft = metrics.actualBoundingBoxLeft ?? 0;
      const actualRight =
        letterSpacing !== 0 ? totalWidth : (metrics.actualBoundingBoxRight ?? metrics.width);
      const actualAscent = metrics.actualBoundingBoxAscent ?? numericFontSize;
      const actualDescent = metrics.actualBoundingBoxDescent ?? numericFontSize * 0.2;

      const textBoundingWidth = Math.ceil(
        letterSpacing !== 0 ? totalWidth : actualLeft + actualRight
      );
      const tightHeight = Math.ceil(actualAscent + actualDescent);

      const extraWidthBuffer = 10;
      const offscreenWidth = textBoundingWidth + extraWidthBuffer;

      offscreen.width = offscreenWidth;
      offscreen.height = tightHeight;

      const xOffset = extraWidthBuffer / 2;
      offCtx.font = `${fontWeight} ${fontSizeStr} ${computedFontFamily}`;
      offCtx.textBaseline = "alphabetic";

      if (gradient && Array.isArray(gradient) && gradient.length >= 2) {
        const grad = offCtx.createLinearGradient(0, 0, offscreenWidth, 0);
        gradient.forEach((c, i) => grad.addColorStop(i / (gradient.length - 1), c));
        offCtx.fillStyle = grad;
      } else {
        offCtx.fillStyle = color;
      }

      if (letterSpacing !== 0) {
        let xPos = xOffset;
        for (const char of text) {
          offCtx.fillText(char, xPos, actualAscent);
          xPos += offCtx.measureText(char).width + letterSpacing;
        }
      } else {
        offCtx.fillText(text, xOffset - actualLeft, actualAscent);
      }

      const effectiveFuzz = isReducedMotion ? 0 : fuzzRange;
      const horizontalMargin = effectiveFuzz + 20;
      const verticalMargin = 4;
      canvas.width = offscreenWidth + horizontalMargin * 2;
      canvas.height = tightHeight + verticalMargin * 2;
      ctx.translate(horizontalMargin, verticalMargin);

      // If reduced motion is requested, render static crisp text once and return
      if (isReducedMotion) {
        ctx.drawImage(offscreen, 0, 0);
        return;
      }

      const interactiveLeft = horizontalMargin + xOffset;
      const interactiveTop = verticalMargin;
      const interactiveRight = interactiveLeft + textBoundingWidth;
      const interactiveBottom = interactiveTop + tightHeight;

      let isHovering = false;
      let isClicking = false;
      let isGlitching = false;
      let currentIntensity = baseIntensity;
      let targetIntensity = baseIntensity;
      let lastFrameTime = 0;
      const frameDuration = 1000 / fps;

      const startGlitchLoop = () => {
        if (!glitchMode || isCancelled) return;
        glitchTimeoutId = setTimeout(() => {
          if (isCancelled) return;
          isGlitching = true;
          glitchEndTimeoutId = setTimeout(() => {
            isGlitching = false;
            startGlitchLoop();
          }, glitchDuration);
        }, glitchInterval);
      };

      if (glitchMode) startGlitchLoop();

      const run = (timestamp: number) => {
        if (isCancelled) return;

        if (timestamp - lastFrameTime < frameDuration) {
          animationFrameId = window.requestAnimationFrame(run);
          return;
        }
        lastFrameTime = timestamp;

        ctx.clearRect(
          -effectiveFuzz - 20,
          -effectiveFuzz - 10,
          offscreenWidth + 2 * (effectiveFuzz + 20),
          tightHeight + 2 * (effectiveFuzz + 10)
        );

        if (isClicking) {
          targetIntensity = 1;
        } else if (isGlitching) {
          targetIntensity = 1;
        } else if (isHovering) {
          targetIntensity = hoverIntensity;
        } else {
          targetIntensity = baseIntensity;
        }

        if (transitionDuration > 0) {
          const step = 1 / (transitionDuration / frameDuration);
          if (currentIntensity < targetIntensity) {
            currentIntensity = Math.min(currentIntensity + step, targetIntensity);
          } else if (currentIntensity > targetIntensity) {
            currentIntensity = Math.max(currentIntensity - step, targetIntensity);
          }
        } else {
          currentIntensity = targetIntensity;
        }

        if (direction === "horizontal") {
          for (let j = 0; j < tightHeight; j++) {
            const dx = Math.floor(currentIntensity * (Math.random() - 0.5) * effectiveFuzz);
            ctx.drawImage(offscreen, 0, j, offscreenWidth, 1, dx, j, offscreenWidth, 1);
          }
        } else if (direction === "vertical") {
          for (let i = 0; i < offscreenWidth; i++) {
            const dy = Math.floor(currentIntensity * (Math.random() - 0.5) * effectiveFuzz);
            ctx.drawImage(offscreen, i, 0, 1, tightHeight, i, dy, 1, tightHeight);
          }
        } else {
          for (let j = 0; j < tightHeight; j++) {
            const dx = Math.floor(currentIntensity * (Math.random() - 0.5) * effectiveFuzz);
            ctx.drawImage(offscreen, 0, j, offscreenWidth, 1, dx, j, offscreenWidth, 1);
          }
          const tempData = ctx.getImageData(
            0,
            0,
            offscreenWidth + effectiveFuzz,
            tightHeight + effectiveFuzz
          );
          ctx.clearRect(
            -effectiveFuzz - 20,
            -effectiveFuzz - 10,
            offscreenWidth + 2 * (effectiveFuzz + 20),
            tightHeight + 2 * (effectiveFuzz + 10)
          );
          ctx.putImageData(tempData, 0, 0);
          for (let i = 0; i < offscreenWidth + effectiveFuzz; i++) {
            const dy = Math.floor(currentIntensity * (Math.random() - 0.5) * effectiveFuzz * 0.5);
            const colData = ctx.getImageData(i, 0, 1, tightHeight + effectiveFuzz);
            ctx.clearRect(i, -effectiveFuzz, 1, tightHeight + 2 * effectiveFuzz);
            ctx.putImageData(colData, i, dy);
          }
        }
        animationFrameId = window.requestAnimationFrame(run);
      };

      animationFrameId = window.requestAnimationFrame(run);

      const isInsideTextArea = (x: number, y: number) => {
        return (
          x >= interactiveLeft &&
          x <= interactiveRight &&
          y >= interactiveTop &&
          y <= interactiveBottom
        );
      };

      const handleMouseMove = (e: MouseEvent) => {
        if (!effectiveHover) return;
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        isHovering = isInsideTextArea(x, y);
      };

      const handleMouseLeave = () => {
        isHovering = false;
      };

      const handleClick = () => {
        if (!clickEffect) return;
        isClicking = true;
        clearTimeout(clickTimeoutId);
        clickTimeoutId = setTimeout(() => {
          isClicking = false;
        }, 150);
      };

      if (effectiveHover) {
        canvas.addEventListener("mousemove", handleMouseMove);
        canvas.addEventListener("mouseleave", handleMouseLeave);
      }

      if (clickEffect) {
        canvas.addEventListener("click", handleClick);
      }

      const cleanup = () => {
        window.cancelAnimationFrame(animationFrameId);
        clearTimeout(glitchTimeoutId);
        clearTimeout(glitchEndTimeoutId);
        clearTimeout(clickTimeoutId);
        if (effectiveHover) {
          canvas.removeEventListener("mousemove", handleMouseMove);
          canvas.removeEventListener("mouseleave", handleMouseLeave);
        }
        if (clickEffect) {
          canvas.removeEventListener("click", handleClick);
        }
      };

      (canvas as any).cleanupFuzzyText = cleanup;
    };

    init();

    return () => {
      isCancelled = true;
      window.cancelAnimationFrame(animationFrameId);
      clearTimeout(glitchTimeoutId);
      clearTimeout(glitchEndTimeoutId);
      clearTimeout(clickTimeoutId);
      if (canvas && (canvas as any).cleanupFuzzyText) {
        (canvas as any).cleanupFuzzyText();
      }
    };
  }, [
    textContent,
    fontSize,
    fontWeight,
    fontFamily,
    color,
    enableHover,
    baseIntensity,
    hoverIntensity,
    fuzzRange,
    fps,
    direction,
    transitionDuration,
    clickEffect,
    glitchMode,
    glitchInterval,
    glitchDuration,
    gradient,
    letterSpacing,
    isReducedMotion,
  ]);

  return (
    <div className={`relative inline-flex items-center justify-center ${className}`}>
      {/* Accessible textual equivalent for screen readers */}
      <span className="sr-only">{textContent}</span>
      {/* Visual canvas animation */}
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        className="max-w-full h-auto pointer-events-auto"
      />
    </div>
  );
}
