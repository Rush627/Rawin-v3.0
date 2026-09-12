"use client";

import React, { useRef, useCallback, useEffect } from "react";

interface ResumeCard3DProps {
  children: React.ReactNode;
  className?: string;
  maxTilt?: number;
  elevateY?: number;
  scale?: number;
  glow?: boolean;
}

export default function ResumeCard3D({
  children,
  className = "",
  maxTilt = 1.2,
  elevateY = -4,
  scale = 1.005,
  glow = false,
}: ResumeCard3DProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const canHoverRef = useRef<boolean>(false);
  const reducedMotionRef = useRef<boolean>(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
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
    }
  }, []);

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!canHoverRef.current || reducedMotionRef.current) return;
      if (e.pointerType !== "mouse") return;

      const card = cardRef.current;
      if (!card) return;

      const rect = card.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;

      const x = (e.clientX - rect.left) / rect.width;
      const y = (e.clientY - rect.top) / rect.height;

      const rotX = ((0.5 - y) * 2 * maxTilt).toFixed(2);
      const rotY = ((x - 0.5) * 2 * maxTilt).toFixed(2);

      card.style.transform = `perspective(1000px) translateY(${elevateY}px) scale(${scale}) rotateX(${rotX}deg) rotateY(${rotY}deg)`;
      card.style.transition = "transform 0.12s cubic-bezier(0.2, 0, 0, 1), box-shadow 0.25s ease, border-color 0.25s ease";
      card.style.boxShadow = glow
        ? "0 16px 36px -10px rgba(0, 0, 0, 0.5), 0 0 24px -4px rgba(24, 155, 173, 0.12)"
        : "0 14px 28px -8px rgba(0, 0, 0, 0.45), 0 0 16px -4px rgba(24, 155, 173, 0.05)";
    },
    [maxTilt, elevateY, scale, glow]
  );

  const handlePointerLeave = useCallback(() => {
    const card = cardRef.current;
    if (!card) return;

    card.style.transform = "perspective(1000px) translateY(0px) scale(1) rotateX(0deg) rotateY(0deg)";
    card.style.transition = "transform 0.35s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.35s ease, border-color 0.35s ease";
    card.style.boxShadow = "none";
  }, []);

  return (
    <div
      ref={cardRef}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      className={`relative will-change-transform transition-[transform,box-shadow,border-color] duration-300 ${className}`}
      style={{
        transformStyle: "preserve-3d",
        transform: "perspective(1000px) translateY(0px) scale(1) rotateX(0deg) rotateY(0deg)",
      }}
    >
      {children}
    </div>
  );
}
