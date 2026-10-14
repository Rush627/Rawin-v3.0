"use client";

import { useId } from "react";
import { useTheme } from "./ThemeProvider";

interface ThemeToggleProps {
  className?: string;
  /** Show the textual state next to the glyph */
  withLabel?: boolean;
}

/**
 * Eclipse toggle: a disc whose crescent shadow slides across to switch
 * between Pearl (light) and Nocturne (dark). Pure SVG + CSS transitions.
 */
export default function ThemeToggle({ className = "", withLabel = false }: ThemeToggleProps) {
  const { resolved, toggle } = useTheme();
  const isDark = resolved === "dark";
  const maskId = `rawin-eclipse-${useId().replace(/:/g, "")}`;

  return (
    <button
      type="button"
      onClick={(e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        toggle({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 });
      }}
      aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
      title={isDark ? "Light theme" : "Dark theme"}
      className={`group inline-flex items-center gap-2.5 min-h-11 min-w-11 justify-center rounded-full text-fg transition-colors ${className}`}
    >
      <svg viewBox="0 0 24 24" className="w-[18px] h-[18px] shrink-0 overflow-visible" aria-hidden="true">
        <defs>
          <mask id={maskId}>
            <rect x="-4" y="-4" width="32" height="32" fill="white" />
            <circle
              cx={isDark ? 16.5 : 30}
              cy={isDark ? 7.5 : -6}
              r="7"
              fill="black"
              style={{ transition: "cx 0.6s cubic-bezier(0.2,0.7,0.1,1), cy 0.6s cubic-bezier(0.2,0.7,0.1,1)" }}
            />
          </mask>
        </defs>
        <circle
          cx="12"
          cy="12"
          r={isDark ? 8 : 5}
          fill="currentColor"
          mask={`url(#${maskId})`}
          style={{ transition: "r 0.6s cubic-bezier(0.2,0.7,0.1,1)" }}
        />
        <g
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          style={{
            transformOrigin: "12px 12px",
            transform: isDark ? "rotate(-45deg) scale(0)" : "rotate(0deg) scale(1)",
            opacity: isDark ? 0 : 1,
            transition: "transform 0.6s cubic-bezier(0.2,0.7,0.1,1), opacity 0.4s ease",
          }}
        >
          <line x1="12" y1="1.8" x2="12" y2="3.6" />
          <line x1="12" y1="20.4" x2="12" y2="22.2" />
          <line x1="1.8" y1="12" x2="3.6" y2="12" />
          <line x1="20.4" y1="12" x2="22.2" y2="12" />
          <line x1="4.8" y1="4.8" x2="6" y2="6" />
          <line x1="18" y1="18" x2="19.2" y2="19.2" />
          <line x1="4.8" y1="19.2" x2="6" y2="18" />
          <line x1="18" y1="6" x2="19.2" y2="4.8" />
        </g>
      </svg>
      {withLabel && (
        <span className="label-mono text-fg-muted group-hover:text-fg transition-colors">
          {isDark ? "Nocturne" : "Pearl"}
        </span>
      )}
    </button>
  );
}
