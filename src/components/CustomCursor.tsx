"use client";

import { useEffect, useRef } from "react";

export default function CustomCursor() {
  const cursorRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Desktop only: require fine pointer and hover capability; respect reduced motion preference
    const finePointerQuery = window.matchMedia("(hover: hover) and (pointer: fine)");
    const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

    if (!finePointerQuery.matches || reducedMotionQuery.matches) {
      return;
    }

    // Hide native cursor on desktop via scoped document class
    document.documentElement.classList.add("custom-cursor-active");

    let isVisible = false;
    let targetX = -100;
    let targetY = -100;
    let currentX = -100;
    let currentY = -100;
    let prevMouseX = -100;
    let prevMouseY = -100;

    // Default resting angle pointing up-left (-45 degrees)
    let targetAngle = -45;
    let currentAngle = -45;
    let targetScale = 1.0;
    let currentScale = 1.0;
    let rafId: number | null = null;

    // Physics thresholds & interpolation factors
    const MOVEMENT_THRESHOLD = 1.8; // Ignore micro jitter below 1.8px
    const POS_LERP = 0.28;          // Responsive glide with subtle physical lag
    const ROT_LERP = 0.18;          // Smooth rotational inertia
    const SCALE_LERP = 0.20;

    const onPointerMove = (e: PointerEvent) => {
      // Coarse touch pointers should never activate custom cursor
      if (e.pointerType === "touch" || e.pointerType === "pen") return;

      const clientX = e.clientX;
      const clientY = e.clientY;

      if (!isVisible) {
        isVisible = true;
        currentX = clientX;
        currentY = clientY;
        prevMouseX = clientX;
        prevMouseY = clientY;
        if (cursorRef.current) {
          cursorRef.current.style.opacity = "1";
        }
      }

      targetX = clientX;
      targetY = clientY;

      // Calculate directional vector and update angle if displacement exceeds threshold
      const dx = targetX - prevMouseX;
      const dy = targetY - prevMouseY;
      const dist = Math.hypot(dx, dy);

      if (dist >= MOVEMENT_THRESHOLD) {
        targetAngle = Math.atan2(dy, dx) * (180 / Math.PI);
        prevMouseX = targetX;
        prevMouseY = targetY;
      }

      // Check interactive hover target for subtle scale reaction
      const target = e.target as Element | null;
      if (target) {
        const interactive = Boolean(
          target.closest('a, button, [role="button"], input, textarea, select, label, [data-clickable="true"]')
        );
        targetScale = interactive ? 1.22 : 1.0;
      }
    };

    const onPointerLeave = () => {
      isVisible = false;
      if (cursorRef.current) {
        cursorRef.current.style.opacity = "0";
      }
    };

    const onPointerEnter = (e: PointerEvent) => {
      if (e.pointerType === "touch" || e.pointerType === "pen") return;
      isVisible = true;
      targetX = e.clientX;
      targetY = e.clientY;
      currentX = targetX;
      currentY = targetY;
      prevMouseX = targetX;
      prevMouseY = targetY;
      if (cursorRef.current) {
        cursorRef.current.style.opacity = "1";
      }
    };

    // Centralized animation loop with zero React state updates
    const animate = () => {
      if (isVisible && cursorRef.current) {
        // Smooth position glide
        currentX += (targetX - currentX) * POS_LERP;
        currentY += (targetY - currentY) * POS_LERP;

        // Shortest-path angular interpolation with inertia
        let angleDiff = targetAngle - currentAngle;
        while (angleDiff > 180) angleDiff -= 360;
        while (angleDiff < -180) angleDiff += 360;

        currentAngle += angleDiff * ROT_LERP;
        if (currentAngle > 180) currentAngle -= 360;
        if (currentAngle < -180) currentAngle += 360;

        // Smooth scale interpolation
        currentScale += (targetScale - currentScale) * SCALE_LERP;

        // Single composite GPU transform centered on pointer coordinate
        cursorRef.current.style.transform = `translate3d(${currentX - 12}px, ${currentY - 12}px, 0) rotate(${currentAngle}deg) scale(${currentScale})`;
      }

      rafId = requestAnimationFrame(animate);
    };

    window.addEventListener("pointermove", onPointerMove, { passive: true });
    document.documentElement.addEventListener("pointerleave", onPointerLeave);
    document.documentElement.addEventListener("pointerenter", onPointerEnter);

    rafId = requestAnimationFrame(animate);

    return () => {
      document.documentElement.classList.remove("custom-cursor-active");
      window.removeEventListener("pointermove", onPointerMove);
      document.documentElement.removeEventListener("pointerleave", onPointerLeave);
      document.documentElement.removeEventListener("pointerenter", onPointerEnter);
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
      }
    };
  }, []);

  return (
    <div
      ref={cursorRef}
      aria-hidden="true"
      className="fixed top-0 left-0 pointer-events-none z-50 opacity-0 will-change-transform"
      style={{
        mixBlendMode: "difference",
        transition: "opacity 0.2s ease",
      }}
    >
      {/* 
        Refined geometric stealth chevron pointer:
        Soft curved corners and rounded joins (15-25% enlargement for optimal elegance).
        Symmetrical delta profile: tip points along +X axis at angle 0 for seamless rotation.
      */}
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-6 h-6 drop-shadow-[0_1px_3px_rgba(0,0,0,0.6)]"
      >
        <path
          d="M 20.2 11.2 Q 21.8 12 20.2 12.8 L 4.6 19.6 Q 3.6 20.2 4.4 18.8 L 8.5 13.2 Q 9.5 12 8.5 10.8 L 4.4 5.2 Q 3.6 3.8 4.6 4.4 Z"
          fill="#FFFFFF"
          stroke="#101019"
          strokeWidth="0.8"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}
