"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { Briefcase } from "lucide-react";
import type { TimelineItem } from "@/data/experience";

interface EngineeringJourneyCircuitProps {
  items: TimelineItem[];
}

interface CircuitPoint {
  x: number;
  y: number;
}

export default function EngineeringJourneyCircuit({ items }: EngineeringJourneyCircuitProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const terminalRefs = useRef<(HTMLDivElement | null)[]>([]);
  const pathRef = useRef<SVGPathElement>(null);
  const [pathD, setPathD] = useState<string>("");
  const [cornerPoints, setCornerPoints] = useState<CircuitPoint[]>([]);
  const [totalPathLength, setTotalPathLength] = useState<number>(0);
  const [activeNodes, setActiveNodes] = useState<boolean[]>([true, false, false]);
  const [isDesktop, setIsDesktop] = useState(false);

  // Desktop capability check (>= 1024px, hover capability, no reduced motion)
  useEffect(() => {
    const checkDesktop = () => {
      const isWide = window.innerWidth >= 1024;
      const canHover = window.matchMedia("(hover: hover)").matches;
      const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      return isWide && canHover && !reducedMotion;
    };

    setIsDesktop(checkDesktop());

    const handleResize = () => {
      setIsDesktop(checkDesktop());
    };

    window.addEventListener("resize", handleResize, { passive: true });
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Measure terminal positions and build orthogonal circuit path
  const measureAndBuildCircuit = useCallback(() => {
    const container = containerRef.current;
    if (!container || !isDesktop) return;

    const cRect = container.getBoundingClientRect();
    const pts: CircuitPoint[] = [];

    for (let i = 0; i < items.length; i++) {
      const el = terminalRefs.current[i];
      if (el) {
        const r = el.getBoundingClientRect();
        pts.push({
          x: r.left - cRect.left + r.width / 2,
          y: r.top - cRect.top + r.height / 2,
        });
      }
    }

    if (pts.length < 2) return;

    // Build 90-degree orthogonal circuit trace
    // pt0 (Card 1 right) -> step across and down -> pt1 (Card 2 left)
    // pt1 (Card 2 left) -> step across and down -> pt2 (Card 3 right)
    let d = `M ${pts[0].x} ${pts[0].y}`;
    const corners: CircuitPoint[] = [];

    for (let i = 0; i < pts.length - 1; i++) {
      const pCurrent = pts[i];
      const pNext = pts[i + 1];

      // Route orthogonal circuit path:
      // Halfway X between the terminals, bend vertically, then bend horizontally to next terminal
      const midX = (pCurrent.x + pNext.x) / 2;

      // 1st corner
      corners.push({ x: midX, y: pCurrent.y });
      // 2nd corner
      corners.push({ x: midX, y: pNext.y });

      d += ` H ${midX} V ${pNext.y} H ${pNext.x}`;
    }

    setPathD(d);
    setCornerPoints(corners);

    if (pathRef.current) {
      const len = pathRef.current.getTotalLength();
      setTotalPathLength(len);
      pathRef.current.style.strokeDasharray = `${len}`;
      pathRef.current.style.strokeDashoffset = `${len}`;
    }
  }, [items.length, isDesktop]);

  // Handle ResizeObserver to update circuit geometry when layout changes
  useEffect(() => {
    if (!isDesktop) return;

    measureAndBuildCircuit();

    const container = containerRef.current;
    if (!container) return;

    const ro = new ResizeObserver(() => {
      measureAndBuildCircuit();
    });
    ro.observe(container);

    return () => ro.disconnect();
  }, [isDesktop, measureAndBuildCircuit]);

  // Update total path length once path is rendered
  useEffect(() => {
    if (!pathRef.current || !pathD) return;
    const len = pathRef.current.getTotalLength();
    setTotalPathLength(len);
    pathRef.current.style.strokeDasharray = `${len}`;
  }, [pathD]);

  // Section-level scroll progress loop using requestAnimationFrame
  useEffect(() => {
    if (!isDesktop) return;

    let ticking = false;
    const container = containerRef.current;
    if (!container) return;

    const onScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          ticking = false;
          if (!container || !pathRef.current || totalPathLength <= 0) return;

          const rect = container.getBoundingClientRect();
          const windowHeight = window.innerHeight;

          // Progress runs from when section is 75% down viewport to 25% down viewport
          const start = windowHeight * 0.75;
          const end = windowHeight * 0.25 - rect.height;
          const totalDist = start - end;

          const current = start - rect.top;
          const progress = Math.max(0, Math.min(1, current / totalDist));

          // Reveal circuit line via strokeDashoffset
          const offset = totalPathLength * (1 - progress);
          pathRef.current.style.strokeDashoffset = `${offset}`;

          // Activate terminals as circuit reaches them
          // Node 0 is always active when section appears
          // Node 1 activates at ~40% progress
          // Node 2 activates at ~80% progress
          const n0 = progress >= 0.05;
          const n1 = progress >= 0.45;
          const n2 = progress >= 0.85;

          setActiveNodes((prev) => {
            if (prev[0] === n0 && prev[1] === n1 && prev[2] === n2) return prev;
            return [n0, n1, n2];
          });
        });
        ticking = true;
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    // Initial call
    onScroll();

    return () => window.removeEventListener("scroll", onScroll);
  }, [isDesktop, totalPathLength]);

  // Mobile / Tablet fallback layout: clean vertical timeline with border
  if (!isDesktop) {
    return (
      <div className="relative flex flex-col gap-8 sm:gap-10 border-l border-white/[0.08] ml-2 sm:ml-4 pl-6 sm:pl-8">
        {items.map((item) => (
          <div key={item.period} className="relative flex flex-col gap-3 group">
            {/* Node indicator */}
            <div className="absolute -left-[31px] sm:-left-[39px] top-1.5 w-3.5 h-3.5 rounded-full bg-ink-black border-2 border-pacific-cyan/60 group-hover:border-pacific-cyan group-hover:shadow-[0_0_10px_rgba(24,155,173,0.5)] transition-all" />

            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-mono font-semibold px-2.5 py-0.5 rounded-full bg-pacific-cyan/10 text-pacific-cyan border border-pacific-cyan/20">
                {item.period}
              </span>
              <span className="text-xs font-mono text-muted/70">{item.companyOrContext}</span>
            </div>

            <h3 className="text-lg sm:text-xl font-bold text-foreground font-space">{item.role}</h3>
            <p className="text-sm text-muted leading-relaxed">{item.description}</p>

            <ul className="flex flex-col gap-1.5 pt-1">
              {item.highlights.map((highlight, hIdx) => (
                <li key={hIdx} className="flex items-start gap-2 text-xs sm:text-sm text-muted/80">
                  <span className="w-1.5 h-1.5 rounded-full bg-pacific-cyan/60 shrink-0 mt-2" />
                  <span>{highlight}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    );
  }

  // Desktop Circuit Layout
  return (
    <div ref={containerRef} className="relative w-full py-6">
      {/* Background Circuit SVG Overlay */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none z-0 overflow-visible"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="circuit-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#189BAD" stopOpacity="0.9" />
            <stop offset="50%" stopColor="#38BDF8" stopOpacity="1" />
            <stop offset="100%" stopColor="#189BAD" stopOpacity="0.9" />
          </linearGradient>
          <filter id="circuit-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor="#189BAD" floodOpacity="0.6" />
          </filter>
        </defs>

        {pathD && (
          <>
            {/* Background passive trace track */}
            <path
              d={pathD}
              fill="none"
              stroke="rgba(255, 255, 255, 0.08)"
              strokeWidth="2"
              strokeDasharray="6 4"
            />

            {/* Corner vias / solder junctions */}
            {cornerPoints.map((corner, cIdx) => (
              <circle
                key={cIdx}
                cx={corner.x}
                cy={corner.y}
                r="3.5"
                fill="#101019"
                stroke="rgba(24, 155, 173, 0.4)"
                strokeWidth="1.5"
              />
            ))}

            {/* Active illuminated foreground trace */}
            <path
              ref={pathRef}
              d={pathD}
              fill="none"
              stroke="url(#circuit-grad)"
              strokeWidth="2.5"
              filter="url(#circuit-glow)"
              style={{
                strokeLinecap: "round",
                strokeLinejoin: "round",
                transition: "stroke-dashoffset 0.1s linear",
              }}
            />
          </>
        )}
      </svg>

      {/* Staggered Milestone Cards */}
      <div className="relative z-10 flex flex-col gap-20 w-full">
        {items.map((item, idx) => {
          // Staggered positioning:
          // 0 -> Left column
          // 1 -> Right column
          // 2 -> Left column
          const isLeft = idx % 2 === 0;
          const isActive = activeNodes[idx];
          const badgeNumber = `0${idx + 1}`;

          return (
            <div
              key={item.period}
              className={`relative flex items-center w-full ${
                isLeft ? "justify-start" : "justify-end"
              }`}
            >
              <div
                className={`relative w-full max-w-[500px] glass-card rounded-2xl p-6 sm:p-8 border transition-all duration-500 ${
                  isActive
                    ? "border-pacific-cyan/40 bg-ink-black/85 shadow-[0_12px_32px_rgba(0,0,0,0.6),0_0_24px_rgba(24,155,173,0.12)]"
                    : "border-white/[0.08] bg-ink-black/70 hover:border-white/[0.16]"
                }`}
              >
                {/* Milestone Node Terminal Pad */}
                <div
                  ref={(el) => {
                    terminalRefs.current[idx] = el;
                  }}
                  className={`absolute top-8 ${
                    isLeft ? "-right-4 translate-x-1/2" : "-left-4 -translate-x-1/2"
                  } w-8 h-8 rounded-full bg-ink-black border-2 flex items-center justify-center transition-all duration-500 ${
                    isActive
                      ? "border-pacific-cyan shadow-[0_0_16px_rgba(24,155,173,0.8)]"
                      : "border-white/20"
                  }`}
                  aria-hidden="true"
                >
                  <div
                    className={`w-3 h-3 rounded-full transition-colors duration-500 ${
                      isActive ? "bg-pacific-cyan animate-pulse" : "bg-white/20"
                    }`}
                  />
                </div>

                {/* Card Header */}
                <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-pacific-cyan px-2 py-0.5 rounded-md bg-pacific-cyan/15 border border-pacific-cyan/25">
                      {badgeNumber}
                    </span>
                    <span className="text-xs font-mono font-semibold text-muted">
                      {item.period}
                    </span>
                  </div>
                  <span className="text-xs font-mono text-muted/70">{item.companyOrContext}</span>
                </div>

                {/* Title & Description */}
                <h3 className="text-xl font-bold text-foreground font-space mb-2">
                  {item.role}
                </h3>
                <p className="text-sm text-muted leading-relaxed mb-4">
                  {item.description}
                </p>

                {/* Highlights List */}
                <ul className="flex flex-col gap-2 pt-2 border-t border-white/[0.06]">
                  {item.highlights.map((highlight, hIdx) => (
                    <li
                      key={hIdx}
                      className="flex items-start gap-2.5 text-xs sm:text-sm text-muted/80"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-pacific-cyan/60 shrink-0 mt-2" />
                      <span>{highlight}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
