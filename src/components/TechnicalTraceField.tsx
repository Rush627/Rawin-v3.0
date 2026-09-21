"use client";

import React from "react";

/**
 * Desktop-only Technical Trace Field.
 * A subtle, restrained technical background element inspired by precision grid systems,
 * architectural technical lines, and abstract trace geometry.
 * Strictly decorative with no textual content, buttons, or metadata.
 * Appears only on desktop (>= 1024px) in the space above the footer.
 */
export default function TechnicalTraceField() {
  return (
    <div
      aria-hidden="true"
      className="w-full relative py-4 flex items-center justify-center select-none pointer-events-none overflow-hidden"
    >
      <svg
        viewBox="0 0 1200 130"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full max-w-5xl h-28 lg:h-32 opacity-75"
      >
        <defs>
          {/* Subtle cyan accent gradient for technical trace */}
          <linearGradient id="traceCyanAccent" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#189BAD" stopOpacity="0" />
            <stop offset="25%" stopColor="#189BAD" stopOpacity="0.2" />
            <stop offset="50%" stopColor="#189BAD" stopOpacity="0.45" />
            <stop offset="75%" stopColor="#189BAD" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#189BAD" stopOpacity="0" />
          </linearGradient>

          {/* Neutral muted baseline gradient fading into dark background at edges */}
          <linearGradient id="traceNeutralFade" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#F5F7FA" stopOpacity="0" />
            <stop offset="15%" stopColor="#F5F7FA" stopOpacity="0.1" />
            <stop offset="50%" stopColor="#F5F7FA" stopOpacity="0.15" />
            <stop offset="85%" stopColor="#F5F7FA" stopOpacity="0.1" />
            <stop offset="100%" stopColor="#F5F7FA" stopOpacity="0" />
          </linearGradient>

          {/* Secondary dashed line gradient */}
          <linearGradient id="traceDashedFade" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="5%" stopColor="#A1A1AA" stopOpacity="0" />
            <stop offset="25%" stopColor="#A1A1AA" stopOpacity="0.08" />
            <stop offset="75%" stopColor="#A1A1AA" stopOpacity="0.08" />
            <stop offset="95%" stopColor="#A1A1AA" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* ─── Layer 1: Faint Precision Grid Coordinates ─── */}
        <g stroke="#FFFFFF" strokeOpacity="0.03" strokeWidth="0.75">
          <line x1="240" y1="20" x2="240" y2="110" />
          <line x1="360" y1="20" x2="360" y2="110" />
          <line x1="480" y1="20" x2="480" y2="110" />
          <line x1="600" y1="20" x2="600" y2="110" />
          <line x1="720" y1="20" x2="720" y2="110" />
          <line x1="840" y1="20" x2="840" y2="110" />
          <line x1="960" y1="20" x2="960" y2="110" />
          <line x1="180" y1="40" x2="1020" y2="40" />
          <line x1="180" y1="70" x2="1020" y2="70" />
          <line x1="180" y1="100" x2="1020" y2="100" />
        </g>

        {/* ─── Layer 2: Precision Crosshairs ─── */}
        <g stroke="#F5F7FA" strokeOpacity="0.16" strokeWidth="0.75">
          {/* Crosshair 1 */}
          <line x1="358" y1="40" x2="362" y2="40" />
          <line x1="360" y1="38" x2="360" y2="42" />

          {/* Crosshair 2 */}
          <line x1="478" y1="70" x2="482" y2="70" />
          <line x1="480" y1="68" x2="480" y2="72" />

          {/* Crosshair 3 */}
          <line x1="718" y1="40" x2="722" y2="40" />
          <line x1="720" y1="38" x2="720" y2="42" />

          {/* Crosshair 4 */}
          <line x1="838" y1="100" x2="842" y2="100" />
          <line x1="840" y1="98" x2="840" y2="102" />
        </g>

        {/* ─── Layer 3: Technical Trace Lines (Asymmetric Routing) ─── */}
        {/* Trace Route A (Upper angled path) */}
        <path
          d="M 60 40 H 320 L 350 70 H 680 L 710 100 H 980 L 1000 80 H 1140"
          stroke="url(#traceNeutralFade)"
          strokeWidth="1"
          fill="none"
        />

        {/* Trace Route B (Lower secondary stepped path) */}
        <path
          d="M 120 100 H 280 L 300 120 H 560 L 590 90 H 820 L 850 60 H 1080"
          stroke="url(#traceDashedFade)"
          strokeWidth="0.85"
          strokeDasharray="4 6"
          fill="none"
        />

        {/* Trace Route C (Short connector) */}
        <path
          d="M 400 40 H 520 L 540 60 H 660"
          stroke="#F5F7FA"
          strokeOpacity="0.06"
          strokeWidth="0.75"
          fill="none"
        />

        {/* Trace Route D (Restrained Pacific Cyan accent route) */}
        <path
          d="M 220 70 H 440 L 460 50 H 620 L 650 80 H 880"
          stroke="url(#traceCyanAccent)"
          strokeWidth="1.1"
          fill="none"
          className="technical-trace-accent"
        />

        {/* ─── Layer 4: Minimal Geometric Junction Nodes ─── */}
        {/* Solid micro nodes */}
        <circle cx="320" cy="40" r="1.75" fill="#F5F7FA" fillOpacity="0.35" />
        <circle cx="350" cy="70" r="1.75" fill="#F5F7FA" fillOpacity="0.35" />
        <circle cx="680" cy="70" r="1.75" fill="#189BAD" fillOpacity="0.5" />
        <circle cx="710" cy="100" r="1.75" fill="#F5F7FA" fillOpacity="0.35" />
        <circle cx="440" cy="70" r="1.5" fill="#189BAD" fillOpacity="0.6" />
        <circle cx="460" cy="50" r="1.5" fill="#189BAD" fillOpacity="0.6" />
        <circle cx="560" cy="120" r="1.5" fill="#F5F7FA" fillOpacity="0.25" />

        {/* Delicate ring nodes at branch turns */}
        <circle cx="620" cy="50" r="2.5" fill="none" stroke="#189BAD" strokeWidth="0.75" strokeOpacity="0.45" />
        <circle cx="850" cy="60" r="2.5" fill="none" stroke="#F5F7FA" strokeWidth="0.75" strokeOpacity="0.25" />

        {/* Single subtle traveling indicator along accent trace */}
        <g className="technical-trace-beacon">
          <circle cx="520" cy="50" r="1.5" fill="#189BAD" fillOpacity="0.8" />
        </g>
      </svg>
    </div>
  );
}
