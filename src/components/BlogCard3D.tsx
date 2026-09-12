"use client";

import { useRef, useCallback, useEffect } from "react";

interface BlogCard3DProps {
  children: React.ReactNode;
  className?: string;
  isFeatured?: boolean;
}

export default function BlogCard3D({
  children,
  className = "",
  isFeatured = false,
}: BlogCard3DProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const canHoverRef = useRef<boolean>(false);
  const reducedMotionRef = useRef<boolean>(false);

  useEffect(() => {
    // Detect fine pointer capability and user motion preference once on mount
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
      // Ignore touch / coarse pointers and reduced motion
      if (!canHoverRef.current || reducedMotionRef.current) return;
      if (e.pointerType !== "mouse") return;

      const card = cardRef.current;
      if (!card) return;

      const rect = card.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width; // 0 to 1
      const y = (e.clientY - rect.top) / rect.height; // 0 to 1

      // Subtle max rotation: ±1.2deg for featured, ±1.5deg for regular
      const maxRot = isFeatured ? 1.1 : 1.4;
      const rotX = ((0.5 - y) * 2 * maxRot).toFixed(2);
      const rotY = ((x - 0.5) * 2 * maxRot).toFixed(2);
      const translateY = isFeatured ? -6 : -5;
      const scale = isFeatured ? 1.008 : 1.01;

      card.style.transform = `perspective(1200px) translateY(${translateY}px) scale(${scale}) rotateX(${rotX}deg) rotateY(${rotY}deg)`;
      card.style.transition = "transform 0.12s cubic-bezier(0.2, 0, 0, 1), box-shadow 0.25s ease";
      card.style.boxShadow = isFeatured
        ? "0 20px 40px -12px rgba(0, 0, 0, 0.55), 0 0 28px -4px rgba(0, 229, 255, 0.07)"
        : "0 16px 32px -10px rgba(0, 0, 0, 0.5), 0 0 22px -4px rgba(0, 229, 255, 0.05)";
    },
    [isFeatured]
  );

  const handlePointerLeave = useCallback(() => {
    const card = cardRef.current;
    if (!card) return;

    // Smooth reset on cursor exit
    card.style.transform = "perspective(1200px) translateY(0px) scale(1) rotateX(0deg) rotateY(0deg)";
    card.style.transition = "transform 0.35s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.35s ease";
    card.style.boxShadow = "none";
  }, []);

  return (
    <div
      ref={cardRef}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      className={`relative will-change-transform rounded-2xl transition-[transform,box-shadow] duration-300 focus-within:ring-1 focus-within:ring-pacific-cyan/40 active:scale-[0.99] sm:active:scale-100 ${className}`}
      style={{
        transformStyle: "preserve-3d",
        transform: "perspective(1200px) translateY(0px) scale(1) rotateX(0deg) rotateY(0deg)",
      }}
    >
      {children}
    </div>
  );
}
