"use client";

import OrbitCore, { OrbitCoreState } from "@/components/OrbitCore";

export type OrbitState = OrbitCoreState;

interface OrbitMarkProps {
  state?: OrbitState;
  size?: "sm" | "md" | "lg" | "hero";
  className?: string;
}

export default function OrbitMark({
  state = "idle",
  size = "md",
  className = "",
}: OrbitMarkProps) {
  return <OrbitCore state={state} size={size} className={className} />;
}

