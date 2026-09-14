"use client";

export type OrbitState =
  | "idle"
  | "user_sent"
  | "generating"
  | "streaming"
  | "complete"
  | "error";

interface OrbitMarkProps {
  state?: OrbitState;
  size?: "sm" | "md" | "lg";
  className?: string;
  active?: boolean;
}

export default function OrbitMark({
  state = "idle",
  size = "sm",
  className = "",
  active = false,
}: OrbitMarkProps) {
  const isActive = active || state === "generating" || state === "streaming";
  const isError = state === "error";

  const sizeClass = {
    sm: "w-4 h-4",
    md: "w-5 h-5",
    lg: "w-7 h-7",
  }[size];

  return (
    <div
      className={`inline-flex items-center justify-center shrink-0 ${sizeClass} ${className}`}
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full"
      >
        <circle
          cx="12"
          cy="12"
          r="3.5"
          fill={isError ? "#f87171" : "#189BAD"}
          className={isActive ? "animate-pulse" : ""}
        />
        <circle
          cx="12"
          cy="12"
          r="7.5"
          stroke={isError ? "#f87171" : "#189BAD"}
          strokeWidth="1.5"
          strokeDasharray="2.5 2.5"
          opacity={isActive ? 0.9 : 0.45}
        />
        <circle
          cx="12"
          cy="12"
          r="10"
          stroke={isError ? "#f87171" : "#4FD1E1"}
          strokeWidth="1"
          opacity={isActive ? 0.7 : 0.25}
        />
      </svg>
    </div>
  );
}
