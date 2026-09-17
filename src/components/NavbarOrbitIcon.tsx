"use client";

interface NavbarOrbitIconProps {
  className?: string;
}

export default function NavbarOrbitIcon({
  className = "w-3.5 h-3.5 text-pacific-cyan shrink-0",
}: NavbarOrbitIconProps) {
  return (
    <span className="rawin-orbit-bot-wrapper">
      {/* 
        Exact Lucide Bot SVG geometry with targeted eye elements and bounce animation 
      */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={`rawin-orbit-bot ${className}`}
        aria-hidden="true"
      >
        <path d="M12 8V4H8" />
        <rect width="16" height="12" x="4" y="8" rx="2" />
        <path d="M2 14h2" />
        <path d="M20 14h2" />
        <path d="M15 13v2" className="rawin-orbit-bot-eye rawin-orbit-bot-eye-right" />
        <path d="M9 13v2" className="rawin-orbit-bot-eye rawin-orbit-bot-eye-left" />
      </svg>

      {/* 
        Subtle micro thought bubble floating from the robot head
      */}
      <span
        className="rawin-orbit-thought-bubble pointer-events-none select-none"
        aria-hidden="true"
      >
        <span className="rawin-orbit-bubble-dot-2" />
        <span className="rawin-orbit-bubble-dot-1" />
        <span className="rawin-orbit-bubble-pill">
          <span className="rawin-orbit-thought-dot" />
          <span className="rawin-orbit-thought-dot" />
          <span className="rawin-orbit-thought-dot" />
        </span>
      </span>
    </span>
  );
}
