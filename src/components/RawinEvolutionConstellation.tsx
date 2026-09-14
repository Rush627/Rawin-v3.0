"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";

interface Point {
  x: number;
  y: number;
}

interface StarPosition {
  point: Point;
  t: number;
  dist: number;
}

interface SplineSegment {
  start: Point;
  end: Point;
  c1: Point;
  c2: Point;
  totalLength: number;
  stars: StarPosition[];
}

interface ConstellationData {
  width: number;
  height: number;
  isMobile: boolean;
  seg0: SplineSegment;
  seg1: SplineSegment;
}

interface RawinEvolutionConstellationProps {
  containerRef: React.RefObject<HTMLDivElement | null>;
  milestoneRefs: React.RefObject<(HTMLDivElement | null)[]>;
  onActiveMilestoneChange?: (activeIdx: number) => void;
}

// Crisp, geometric 8-point star SVG path centered at (0, 0)
function get8PointStarPath(R: number): string {
  const r = R * 0.36;
  const pts: string[] = [];
  for (let k = 0; k < 16; k++) {
    const angle = (k * Math.PI) / 8 - Math.PI / 2;
    const rad = k % 2 === 0 ? R : r;
    const x = Math.round(Math.cos(angle) * rad * 100) / 100;
    const y = Math.round(Math.sin(angle) * rad * 100) / 100;
    pts.push(`${x},${y}`);
  }
  return `M ${pts.join(" L ")} Z`;
}

// Desktop parameters are locked and unchanged
const DESKTOP_STAR_RADIUS = 5.5;
const DESKTOP_STAR_COUNT = 11;
const DESKTOP_STAR_PATH = get8PointStarPath(DESKTOP_STAR_RADIUS);

// Mobile parameters: compact, subtle geometric stars
const MOBILE_STAR_RADIUS = 4.2;
const MOBILE_STAR_COUNT = 7;
const MOBILE_STAR_PATH = get8PointStarPath(MOBILE_STAR_RADIUS);

function evalCubicBezier(p0: Point, c1: Point, c2: Point, p1: Point, t: number): Point {
  const mt = 1 - t;
  const mt2 = mt * mt;
  const t2 = t * t;
  return {
    x: mt2 * mt * p0.x + 3 * mt2 * t * c1.x + 3 * mt * t2 * c2.x + t2 * t * p1.x,
    y: mt2 * mt * p0.y + 3 * mt2 * t * c1.y + 3 * mt * t2 * c2.y + t2 * t * p1.y,
  };
}

// Compute arc-length parameterized points along cubic Bezier for uniform star spacing
function buildSplineSegment(
  p0: Point,
  c1: Point,
  c2: Point,
  p1: Point,
  starCount: number
): SplineSegment {
  const SAMPLES = 120;
  const samplePoints: Point[] = [];
  const cumulativeDist: number[] = [0];
  let totalLength = 0;

  for (let i = 0; i <= SAMPLES; i++) {
    const pt = evalCubicBezier(p0, c1, c2, p1, i / SAMPLES);
    samplePoints.push(pt);
    if (i > 0) {
      const prev = samplePoints[i - 1];
      totalLength += Math.hypot(pt.x - prev.x, pt.y - prev.y);
      cumulativeDist.push(totalLength);
    }
  }

  function getPointAtDist(d: number): { point: Point; t: number } {
    if (d <= 0) return { point: samplePoints[0], t: 0 };
    if (d >= totalLength) return { point: samplePoints[SAMPLES], t: 1 };

    let low = 0;
    let high = SAMPLES;
    while (low <= high) {
      const mid = (low + high) >> 1;
      if (cumulativeDist[mid] < d) low = mid + 1;
      else high = mid - 1;
    }
    const idx = Math.max(1, low);
    const d0 = cumulativeDist[idx - 1];
    const d1 = cumulativeDist[idx];
    const frac = (d - d0) / (d1 - d0 || 1);
    const t = (idx - 1 + frac) / SAMPLES;
    return {
      point: {
        x: samplePoints[idx - 1].x + (samplePoints[idx].x - samplePoints[idx - 1].x) * frac,
        y: samplePoints[idx - 1].y + (samplePoints[idx].y - samplePoints[idx - 1].y) * frac,
      },
      t,
    };
  }

  // Sample stars at exact, equal distances along the path
  const stars: StarPosition[] = [];
  for (let i = 0; i < starCount; i++) {
    const targetDist = ((i + 1) / (starCount + 1)) * totalLength;
    const { point, t } = getPointAtDist(targetDist);
    stars.push({ point, t, dist: targetDist });
  }

  return { start: p0, end: p1, c1, c2, totalLength, stars };
}

export default function RawinEvolutionConstellation({
  containerRef,
  milestoneRefs,
  onActiveMilestoneChange,
}: RawinEvolutionConstellationProps) {
  const [constellation, setConstellation] = useState<ConstellationData | null>(null);
  const [scrollProgress, setScrollProgress] = useState({ seg0: 0, seg1: 0 });
  const [isReducedMotion, setIsReducedMotion] = useState(false);

  // Cached scroll trigger positions to avoid getBoundingClientRect during scroll
  const triggerCacheRef = useRef<{
    t0: number;
    t1: number;
    t2: number;
  }>({ t0: 0, t1: 0, t2: 0 });

  const activeMilestoneRef = useRef<number>(0);

  // Reduced motion detection
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
    setIsReducedMotion(mql.matches);

    const handler = (e: MediaQueryListEvent) => setIsReducedMotion(e.matches);
    mql.addEventListener?.("change", handler);
    return () => mql.removeEventListener?.("change", handler);
  }, []);

  // Measure card geometry and compute single-spline paths
  const updateLayout = useCallback(() => {
    const container = containerRef.current;
    const cards = milestoneRefs.current;
    if (!container || !cards || cards.length < 3) return;

    const card0 = cards[0];
    const card1 = cards[1];
    const card2 = cards[2];
    if (!card0 || !card1 || !card2) return;

    const containerRect = container.getBoundingClientRect();
    const c0Rect = card0.getBoundingClientRect();
    const c1Rect = card1.getBoundingClientRect();
    const c2Rect = card2.getBoundingClientRect();

    const isMobile = window.innerWidth <= 768;
    const width = Math.max(1, containerRect.width);
    const height = Math.max(1, containerRect.height);

    const starCount = isMobile ? MOBILE_STAR_COUNT : DESKTOP_STAR_COUNT;

    // Segment 0: 2022 Card to 2023 Card
    let s0_start: Point;
    let s0_end: Point;
    let s0_c1: Point;
    let s0_c2: Point;

    if (isMobile) {
      // Mobile: Departure from bottom-right of 2022, sweeping outward into the open side space, then down into top-left of 2023
      s0_start = {
        x: c0Rect.left - containerRect.left + c0Rect.width * 0.72,
        y: c0Rect.top - containerRect.top + c0Rect.height + 8,
      };
      s0_end = {
        x: c1Rect.left - containerRect.left + c1Rect.width * 0.28,
        y: c1Rect.top - containerRect.top - 8,
      };
      const dy0 = s0_end.y - s0_start.y;
      s0_c1 = { x: s0_start.x + 36, y: s0_start.y + dy0 * 0.38 };
      s0_c2 = { x: s0_end.x - 36, y: s0_end.y - dy0 * 0.38 };
    } else {
      // Desktop (Locked): Single smooth diagonal curve from bottom-right of 2022 to top-left of 2023
      s0_start = {
        x: c0Rect.left - containerRect.left + c0Rect.width * 0.85,
        y: c0Rect.top - containerRect.top + c0Rect.height + 10,
      };
      s0_end = {
        x: c1Rect.left - containerRect.left + c1Rect.width * 0.15,
        y: c1Rect.top - containerRect.top - 10,
      };
      const dx0 = s0_end.x - s0_start.x;
      const dy0 = s0_end.y - s0_start.y;
      s0_c1 = { x: s0_start.x + dx0 * 0.25, y: s0_start.y + dy0 * 0.45 };
      s0_c2 = { x: s0_end.x - dx0 * 0.25, y: s0_end.y - dy0 * 0.45 };
    }

    const seg0 = buildSplineSegment(s0_start, s0_c1, s0_c2, s0_end, starCount);

    // Segment 1: 2023 Card to 2026 Card
    let s1_start: Point;
    let s1_end: Point;
    let s1_c1: Point;
    let s1_c2: Point;

    if (isMobile) {
      // Mobile: Opposite curve departing bottom-left of 2023, sweeping outward into left space, then down into top-right of 2026
      s1_start = {
        x: c1Rect.left - containerRect.left + c1Rect.width * 0.28,
        y: c1Rect.top - containerRect.top + c1Rect.height + 8,
      };
      s1_end = {
        x: c2Rect.left - containerRect.left + c2Rect.width * 0.72,
        y: c2Rect.top - containerRect.top - 8,
      };
      const dy1 = s1_end.y - s1_start.y;
      s1_c1 = { x: s1_start.x - 36, y: s1_start.y + dy1 * 0.38 };
      s1_c2 = { x: s1_end.x + 36, y: s1_end.y - dy1 * 0.38 };
    } else {
      // Desktop (Locked): Single smooth diagonal curve from bottom-left of 2023 back across to top-right of 2026
      s1_start = {
        x: c1Rect.left - containerRect.left + c1Rect.width * 0.15,
        y: c1Rect.top - containerRect.top + c1Rect.height + 10,
      };
      s1_end = {
        x: c2Rect.left - containerRect.left + c2Rect.width * 0.85,
        y: c2Rect.top - containerRect.top - 10,
      };
      const dx1 = s1_end.x - s1_start.x;
      const dy1 = s1_end.y - s1_start.y;
      s1_c1 = { x: s1_start.x + dx1 * 0.25, y: s1_start.y + dy1 * 0.45 };
      s1_c2 = { x: s1_end.x - dx1 * 0.25, y: s1_end.y - dy1 * 0.45 };
    }

    const seg1 = buildSplineSegment(s1_start, s1_c1, s1_c2, s1_end, starCount);

    setConstellation({
      width,
      height,
      isMobile,
      seg0,
      seg1,
    });

    // Cache scroll trigger thresholds relative to window scroll
    const scrollY = window.scrollY || window.pageYOffset;
    const triggerOffset = window.innerHeight * 0.65;
    triggerCacheRef.current = {
      t0: c0Rect.top + scrollY - triggerOffset,
      t1: c1Rect.top + scrollY - triggerOffset,
      t2: c2Rect.top + scrollY - triggerOffset,
    };
  }, [containerRef, milestoneRefs]);

  // Set up resize observer on container and milestone cards
  useEffect(() => {
    updateLayout();

    const container = containerRef.current;
    if (!container) return;

    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== "undefined") {
      resizeObserver = new ResizeObserver(() => {
        updateLayout();
      });
      resizeObserver.observe(container);
      milestoneRefs.current?.forEach((card) => {
        if (card) resizeObserver?.observe(card);
      });
    }

    window.addEventListener("resize", updateLayout, { passive: true });

    return () => {
      resizeObserver?.disconnect();
      window.removeEventListener("resize", updateLayout);
    };
  }, [updateLayout, containerRef, milestoneRefs]);

  // Scroll listener for smooth, continuous progress mapping
  useEffect(() => {
    if (isReducedMotion) {
      setScrollProgress({ seg0: 1, seg1: 1 });
      onActiveMilestoneChange?.(2);
      return;
    }

    let ticking = false;

    const onScroll = () => {
      if (ticking) return;
      ticking = true;

      window.requestAnimationFrame(() => {
        ticking = false;
        const scrollY = window.scrollY || window.pageYOffset;
        const { t0, t1, t2 } = triggerCacheRef.current;

        const span0 = Math.max(1, t1 - t0);
        const span1 = Math.max(1, t2 - t1);

        const seg0 = Math.max(0, Math.min(1, (scrollY - t0) / span0));
        const seg1 = Math.max(0, Math.min(1, (scrollY - t1) / span1));

        setScrollProgress({ seg0, seg1 });

        // Milestone activation states
        let newActive = 0;
        if (seg1 >= 0.90) {
          newActive = 2;
        } else if (seg0 >= 0.90) {
          newActive = 1;
        } else {
          newActive = 0;
        }

        if (activeMilestoneRef.current !== newActive) {
          activeMilestoneRef.current = newActive;
          onActiveMilestoneChange?.(newActive);
        }
      });
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    return () => {
      window.removeEventListener("scroll", onScroll);
    };
  }, [isReducedMotion, onActiveMilestoneChange]);

  if (!constellation) return null;

  const starPath = constellation.isMobile ? MOBILE_STAR_PATH : DESKTOP_STAR_PATH;

  // Render a single spline star sequence
  const renderSegmentStars = (
    seg: SplineSegment,
    progress: number,
    baseColor: string,
    keyPrefix: string
  ) => {
    // Current revealed distance along the spline
    const currentLength = isReducedMotion ? seg.totalLength : progress * seg.totalLength;

    return (
      <g key={keyPrefix}>
        {seg.stars.map((star, idx) => {
          // If reduced motion is active, show all stars statically
          if (isReducedMotion) {
            return (
              <path
                key={`${keyPrefix}_${idx}`}
                d={starPath}
                fill={baseColor}
                opacity={0.85}
                transform={`translate(${star.point.x.toFixed(1)}, ${star.point.y.toFixed(1)})`}
              />
            );
          }

          // Transition window: star emerges as current length approaches its distance
          const revealWindow = 14;
          const startReveal = star.dist - revealWindow;

          if (currentLength < startReveal) {
            return null;
          }

          let scale = 1;
          let opacity = 0.9;

          if (currentLength < star.dist) {
            const u = (currentLength - startReveal) / revealWindow;
            scale = 0.3 + 0.7 * u;
            opacity = u * 0.9;
          }

          return (
            <path
              key={`${keyPrefix}_${idx}`}
              d={starPath}
              fill={baseColor}
              opacity={opacity}
              transform={`translate(${star.point.x.toFixed(1)}, ${star.point.y.toFixed(1)}) scale(${scale.toFixed(2)})`}
              style={{
                filter: "drop-shadow(0 0 2px rgba(24, 155, 173, 0.4))",
                transition: "opacity 80ms ease-out",
              }}
            />
          );
        })}

        {/* Lead Spark: active point at the front of the trail while drawing */}
        {!isReducedMotion && progress > 0.02 && progress < 0.98 && (
          (() => {
            const headPt = evalCubicBezier(seg.start, seg.c1, seg.c2, seg.end, progress);
            return (
              <path
                d={starPath}
                fill="#A5F3FC"
                transform={`translate(${headPt.x.toFixed(1)}, ${headPt.y.toFixed(1)}) scale(1.15)`}
                style={{
                  filter: "drop-shadow(0 0 4px rgba(86, 216, 232, 0.8))",
                }}
              />
            );
          })()
        )}
      </g>
    );
  };

  return (
    <svg
      aria-hidden="true"
      className="absolute inset-0 w-full h-full pointer-events-none overflow-hidden z-0 select-none"
      viewBox={`0 0 ${constellation.width} ${constellation.height}`}
      style={{ width: "100%", height: "100%" }}
    >
      {/* Segment 0 Stars: 2022 to 2023 */}
      {renderSegmentStars(constellation.seg0, scrollProgress.seg0, "#189BAD", "seg0")}

      {/* Segment 1 Stars: 2023 to 2026 */}
      {renderSegmentStars(constellation.seg1, scrollProgress.seg1, "#56D8E8", "seg1")}
    </svg>
  );
}
