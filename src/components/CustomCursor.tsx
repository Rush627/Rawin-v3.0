"use client";

import { useEffect, useRef } from "react";

export default function CustomCursor() {
  const cursorRef = useRef<HTMLDivElement | null>(null);
  const innerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    // Only enable on desktop/laptop with fine pointer and hover capabilities
    if (typeof window === "undefined") return;

    const finePointerQuery = window.matchMedia("(hover: hover) and (pointer: fine)");
    const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

    if (!finePointerQuery.matches || reducedMotionQuery.matches) {
      return;
    }

    // Add active class to document root to hide native cursor on desktop
    document.documentElement.classList.add("custom-cursor-active");

    let isVisible = false;
    let targetX = 0;
    let targetY = 0;
    let currentX = 0;
    let currentY = 0;
    let isHoveringInteractive = false;
    let rafId: number | null = null;

    const onPointerMove = (e: PointerEvent) => {
      // Coarse touch pointers should never activate custom cursor
      if (e.pointerType === "touch" || e.pointerType === "pen") {
        return;
      }

      targetX = e.clientX;
      targetY = e.clientY;

      if (!isVisible) {
        isVisible = true;
        currentX = targetX;
        currentY = targetY;
        if (cursorRef.current) {
          cursorRef.current.style.opacity = "1";
        }
      }

      // Check if target is an interactive clickable element
      const target = e.target as HTMLElement | null;
      if (target) {
        const interactive = Boolean(
          target.closest(
            'a, button, [role="button"], input, textarea, select, label, [data-clickable="true"]'
          )
        );
        if (interactive !== isHoveringInteractive) {
          isHoveringInteractive = interactive;
          if (innerRef.current) {
            innerRef.current.style.transform = interactive
              ? "scale(1.15)"
              : "scale(1)";
          }
        }
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
      if (cursorRef.current) {
        cursorRef.current.style.opacity = "1";
      }
    };

    // Smooth physics loop using slight weighted lerp interpolation
    const lerpFactor = 0.22;
    const animate = () => {
      if (isVisible) {
        currentX += (targetX - currentX) * lerpFactor;
        currentY += (targetY - currentY) * lerpFactor;

        if (cursorRef.current) {
          cursorRef.current.style.transform = `translate3d(${currentX}px, ${currentY}px, 0)`;
        }
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
      className="fixed top-0 left-0 pointer-events-none z-[45] opacity-0 will-change-transform"
      style={{
        mixBlendMode: "difference",
        transition: "opacity 0.2s ease",
      }}
    >
      <div
        ref={innerRef}
        className="w-5 h-6 transition-transform duration-150 ease-out origin-top-left"
      >
        {/* Mac-style arrow pointer with classic silhouette and apex at (0,0) */}
        <svg
          width="18"
          height="22"
          viewBox="0 0 16 20"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-4 h-5 drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]"
        >
          <path
            d="M0.5 0.5L0.5 15.5L4.5 11.5L7.8 19L9.8 18.1L6.5 10.8L11.5 10.8L0.5 0.5Z"
            fill="#FFFFFF"
            stroke="#101019"
            strokeWidth="0.8"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    </div>
  );
}
