"use client";

import React, { useRef, useCallback, useEffect } from "react";
import "./BorderGlow.css";

interface BorderGlowProps {
  children: React.ReactNode;
  className?: string;
  edgeSensitivity?: number;
  glowColor?: string;
  backgroundColor?: string;
  borderRadius?: number;
  glowRadius?: number;
  glowIntensity?: number;
  coneSpread?: number;
  animated?: boolean;
  colors?: string[];
  fillOpacity?: number;
}

function parseHSL(hslStr: string): { h: number; s: number; l: number } {
  const match = hslStr.match(/([\d.]+)\s*[,%]?\s*([\d.]+)%?\s*[,%]?\s*([\d.]+)%?/);
  if (!match) return { h: 187, s: 76, l: 50 };
  return {
    h: parseFloat(match[1]),
    s: parseFloat(match[2]),
    l: parseFloat(match[3]),
  };
}

function buildGlowVars(glowColor: string, intensity: number): Record<string, string> {
  const { h, s, l } = parseHSL(glowColor);
  const base = `${h}deg ${s}% ${l}%`;
  const opacities = [100, 60, 50, 40, 30, 20, 10];
  const keys = ["", "-60", "-50", "-40", "-30", "-20", "-10"];
  const vars: Record<string, string> = {};
  for (let i = 0; i < opacities.length; i++) {
    vars[`--glow-color${keys[i]}`] = `hsl(${base} / ${Math.min(
      opacities[i] * intensity,
      100
    ).toFixed(1)}%)`;
  }
  return vars;
}

const GRADIENT_POSITIONS = [
  "80% 55%",
  "69% 34%",
  "8% 6%",
  "41% 38%",
  "86% 85%",
  "82% 18%",
  "51% 4%",
];

const GRADIENT_KEYS = [
  "--gradient-one",
  "--gradient-two",
  "--gradient-three",
  "--gradient-four",
  "--gradient-five",
  "--gradient-six",
  "--gradient-seven",
];

const COLOR_MAP = [0, 1, 2, 0, 1, 2, 1];

function buildGradientVars(colors: string[]): Record<string, string> {
  const vars: Record<string, string> = {};
  for (let i = 0; i < 7; i++) {
    const c = colors[Math.min(COLOR_MAP[i], colors.length - 1)];
    vars[GRADIENT_KEYS[i]] = `radial-gradient(at ${GRADIENT_POSITIONS[i]}, ${c} 0px, transparent 50%)`;
  }
  vars["--gradient-base"] = `linear-gradient(${colors[0]} 0 100%)`;
  return vars;
}

function easeOutCubic(x: number): number {
  return 1 - Math.pow(1 - x, 3);
}

function easeInCubic(x: number): number {
  return x * x * x;
}

interface AnimateOptions {
  start?: number;
  end?: number;
  duration?: number;
  delay?: number;
  ease?: (x: number) => number;
  onUpdate: (val: number) => void;
  onEnd?: () => void;
}

function animateValue({
  start = 0,
  end = 100,
  duration = 1000,
  delay = 0,
  ease = easeOutCubic,
  onUpdate,
  onEnd,
}: AnimateOptions) {
  const t0 = performance.now() + delay;
  function tick() {
    const elapsed = performance.now() - t0;
    const t = Math.min(elapsed / duration, 1);
    onUpdate(start + (end - start) * ease(t));
    if (t < 1) requestAnimationFrame(tick);
    else if (onEnd) onEnd();
  }
  setTimeout(() => requestAnimationFrame(tick), delay);
}

interface CachedRect {
  left: number;
  top: number;
  width: number;
  height: number;
  cx: number;
  cy: number;
}

export default function BorderGlow({
  children,
  className = "",
  edgeSensitivity = 28,
  glowColor = "187 76 50",
  backgroundColor = "#101019",
  borderRadius = 20,
  glowRadius = 30,
  glowIntensity = 0.65,
  coneSpread = 22,
  animated = false,
  colors = ["#189BAD", "#38BDF8", "#8DE8F2"],
  fillOpacity = 0.06,
}: BorderGlowProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const canHoverRef = useRef<boolean>(false);
  const reducedMotionRef = useRef<boolean>(false);
  const isHoveredRef = useRef<boolean>(false);
  const cachedRectRef = useRef<CachedRect | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const hoverQuery = window.matchMedia("(hover: hover) and (pointer: fine)");
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

    canHoverRef.current = hoverQuery.matches;
    reducedMotionRef.current = motionQuery.matches;

    const handleHoverChange = (e: MediaQueryListEvent) => {
      canHoverRef.current = e.matches;
    };
    const handleMotionChange = (e: MediaQueryListEvent) => {
      reducedMotionRef.current = e.matches;
    };

    hoverQuery.addEventListener?.("change", handleHoverChange);
    motionQuery.addEventListener?.("change", handleMotionChange);

    return () => {
      hoverQuery.removeEventListener?.("change", handleHoverChange);
      motionQuery.removeEventListener?.("change", handleMotionChange);
    };
  }, []);

  const updateCachedRect = useCallback(() => {
    const card = cardRef.current;
    if (!card) return;
    const r = card.getBoundingClientRect();
    cachedRectRef.current = {
      left: r.left,
      top: r.top,
      width: r.width,
      height: r.height,
      cx: r.width / 2,
      cy: r.height / 2,
    };
  }, []);

  // Update cached rect on resize if currently hovered
  useEffect(() => {
    const card = cardRef.current;
    if (!card || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(() => {
      if (isHoveredRef.current) {
        updateCachedRect();
      }
    });
    ro.observe(card);
    return () => ro.disconnect();
  }, [updateCachedRect]);

  const handlePointerEnter = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!canHoverRef.current) return;
      if (e.pointerType && e.pointerType !== "mouse") return;
      isHoveredRef.current = true;
      updateCachedRect();
      window.addEventListener("scroll", updateCachedRect, { passive: true });
    },
    [updateCachedRect]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!canHoverRef.current || !isHoveredRef.current) return;
      if (e.pointerType && e.pointerType !== "mouse") return;

      const card = cardRef.current;
      if (!card) return;

      let rect = cachedRectRef.current;
      if (!rect) {
        updateCachedRect();
        rect = cachedRectRef.current;
        if (!rect) return;
      }

      // High-performance arithmetic: ZERO synchronous reflows or getBoundingClientRect()
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const dx = x - rect.cx;
      const dy = y - rect.cy;

      let kx = Infinity;
      let ky = Infinity;
      if (dx !== 0) kx = rect.cx / Math.abs(dx);
      if (dy !== 0) ky = rect.cy / Math.abs(dy);
      const edge = Math.min(Math.max(1 / Math.min(kx, ky), 0), 1);

      let angle = 0;
      if (dx !== 0 || dy !== 0) {
        let degrees = Math.atan2(dy, dx) * (180 / Math.PI) + 90;
        if (degrees < 0) degrees += 360;
        angle = degrees;
      }

      card.style.setProperty("--edge-proximity", `${(edge * 100).toFixed(1)}`);
      card.style.setProperty("--cursor-angle", `${angle.toFixed(1)}deg`);
    },
    [updateCachedRect]
  );

  const handlePointerLeave = useCallback(() => {
    isHoveredRef.current = false;
    cachedRectRef.current = null;
    window.removeEventListener("scroll", updateCachedRect);

    const card = cardRef.current;
    if (!card) return;
    card.style.setProperty("--edge-proximity", "0");
  }, [updateCachedRect]);

  useEffect(() => {
    return () => {
      window.removeEventListener("scroll", updateCachedRect);
    };
  }, [updateCachedRect]);

  useEffect(() => {
    if (!animated || !cardRef.current || reducedMotionRef.current || !canHoverRef.current) return;
    const card = cardRef.current;
    const angleStart = 110;
    const angleEnd = 465;
    card.classList.add("sweep-active");
    card.style.setProperty("--cursor-angle", `${angleStart}deg`);

    animateValue({
      duration: 500,
      onUpdate: (v) => card.style.setProperty("--edge-proximity", v.toFixed(1)),
    });
    animateValue({
      ease: easeInCubic,
      duration: 1500,
      end: 50,
      onUpdate: (v) => {
        card.style.setProperty(
          "--cursor-angle",
          `${((angleEnd - angleStart) * (v / 100) + angleStart).toFixed(1)}deg`
        );
      },
    });
    animateValue({
      ease: easeOutCubic,
      delay: 1500,
      duration: 2250,
      start: 50,
      end: 100,
      onUpdate: (v) => {
        card.style.setProperty(
          "--cursor-angle",
          `${((angleEnd - angleStart) * (v / 100) + angleStart).toFixed(1)}deg`
        );
      },
    });
    animateValue({
      ease: easeInCubic,
      delay: 2500,
      duration: 1500,
      start: 100,
      end: 0,
      onUpdate: (v) => card.style.setProperty("--edge-proximity", v.toFixed(1)),
      onEnd: () => card.classList.remove("sweep-active"),
    });
  }, [animated]);

  const glowVars = buildGlowVars(glowColor, glowIntensity);

  return (
    <div
      ref={cardRef}
      onPointerEnter={handlePointerEnter}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      className={`border-glow-card ${className}`}
      style={
        {
          "--card-bg": backgroundColor,
          "--edge-sensitivity": edgeSensitivity,
          "--border-radius": `${borderRadius}px`,
          "--glow-padding": `${glowRadius}px`,
          "--cone-spread": coneSpread,
          "--fill-opacity": fillOpacity,
          ...glowVars,
          ...buildGradientVars(colors),
        } as React.CSSProperties
      }
    >
      <span className="edge-light" aria-hidden="true" />
      <div className="border-glow-inner">{children}</div>
    </div>
  );
}
