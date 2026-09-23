"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { usePathname } from "next/navigation";
import { Lightbulb, Sparkles } from "lucide-react";

const TORCH_MESSAGES = [
  "Darkness in your life? Well, I can't change that, but you can light up this page!",
  "Feeling lost in the dark? Click here to reveal the light!",
  "Need a little illumination? Tap this button to brighten things up!",
  "Unveil the hidden details! Activate the torch mode here.",
  "Experiencing a power outage? Not on this page! Click for light.",
  "Out of power? Nah, we've got built-in brightness.",
  "This isn’t a horror movie, turn the light on, brave soul!",
  "Sometimes, you’ve got to make your own light. Click here.",
  "This site’s got secrets. Torch mode might reveal a few.",
  "Dim vibes? Let there be light, literally.",
  "Behind every dark page is a bright click. Try it.",
];

export default function TorchSpotlight() {
  const [isDesktop, setIsDesktop] = useState<boolean>(false);
  const [isActive, setIsActive] = useState<boolean>(false);
  const [message, setMessage] = useState<string>("");
  const [showMessage, setShowMessage] = useState<boolean>(false);

  const overlayRef = useRef<HTMLDivElement>(null);
  const posRef = useRef<{ x: number; y: number }>({ x: -1000, y: -1000 });
  const rafRef = useRef<number | null>(null);

  const [isButtonHovered, setIsButtonHovered] = useState<boolean>(false);

  // Robust device detection: Torch is strictly desktop/laptop only (>= 1024px and non-touch-only)
  useEffect(() => {
    const checkDesktop = () => {
      // Must be desktop breakpoint >= 1024px
      if (typeof window === "undefined" || window.innerWidth < 1024) {
        return false;
      }
      // Must not be a pure touch interface
      const isTouchOnly = window.matchMedia("(hover: none) and (pointer: coarse)").matches;
      if (isTouchOnly) {
        return false;
      }
      return true;
    };

    const isCurrentDesktop = checkDesktop();
    setIsDesktop(isCurrentDesktop);

    if (!isCurrentDesktop) return;

    // Desktop initialization (matching finalized fe6b4ba desktop build)
    const saved = localStorage.getItem("rawin_torch_active");
    if (saved === "true") {
      setIsActive(true);
    }

    const randomMsg = TORCH_MESSAGES[Math.floor(Math.random() * TORCH_MESSAGES.length)];
    setMessage(randomMsg);
    setShowMessage(true);
    const timer = setTimeout(() => setShowMessage(false), 7000);

    const handleResize = () => {
      setIsDesktop(checkDesktop());
    };

    window.addEventListener("resize", handleResize, { passive: true });

    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  // Sync state with localStorage
  const toggleTorch = () => {
    const next = !isActive;
    setIsActive(next);
    try {
      localStorage.setItem("rawin_torch_active", String(next));
    } catch {
      // Storage unavailable
    }
  };

  const showRandomMessage = useCallback(() => {
    const randomMsg = TORCH_MESSAGES[Math.floor(Math.random() * TORCH_MESSAGES.length)];
    setMessage(randomMsg);
    setShowMessage(true);
  }, []);

  const hideMessage = useCallback(() => {
    setShowMessage(false);
  }, []);

  // Update pointer coordinates using requestAnimationFrame (60 FPS desktop mouse tracker)
  useEffect(() => {
    if (!isDesktop || !isActive) return;

    const onPointerMove = (e: PointerEvent) => {
      posRef.current.x = e.clientX;
      posRef.current.y = e.clientY;

      if (rafRef.current === null) {
        rafRef.current = requestAnimationFrame(() => {
          if (overlayRef.current) {
            overlayRef.current.style.setProperty("--torch-x", `${posRef.current.x}px`);
            overlayRef.current.style.setProperty("--torch-y", `${posRef.current.y}px`);
          }
          rafRef.current = null;
        });
      }
    };

    window.addEventListener("pointermove", onPointerMove, { passive: true });

    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [isDesktop, isActive]);

  const pathname = usePathname();

  // Completely removed from smartphones, tablets, and touch interfaces
  if (!isDesktop) {
    return null;
  }

  // Intentionally hide on admin routes and AI experience only
  if (
    pathname.startsWith("/saint-denis") ||
    pathname === "/ai" ||
    pathname.startsWith("/ai/")
  ) {
    return null;
  }

  return (
    <>
      {/* 60 FPS Spotlight Overlay with Radial Mask (Non-blocking, native scroll intact) */}
      <div
        ref={overlayRef}
        aria-hidden="true"
        className={`fixed inset-0 pointer-events-none z-40 transition-opacity duration-500 ${
          isActive ? "opacity-100" : "opacity-0"
        }`}
        style={{
          background: `radial-gradient(circle 38vmax at var(--torch-x, 50vw) var(--torch-y, 50vh), rgba(24, 155, 173, 0.12) 0%, rgba(255, 255, 255, 0.04) 25%, rgba(16, 16, 25, 0.88) 75%)`,
        }}
      />

      {/* Layer 3 (z-[45]): Torch Button Surface and Message Bubble (sits below custom cursor at z-50) */}
      <div className="fixed bottom-6 right-6 z-[45] flex flex-col items-end gap-3 pointer-events-none">
        {/* Message Bubble */}
        <div
          className={`glass-panel max-w-xs px-4 py-3 rounded-xl shadow-2xl transition-all duration-300 transform ${
            showMessage
              ? "opacity-100 translate-y-0 scale-100 pointer-events-auto"
              : "opacity-0 translate-y-3 scale-95 pointer-events-none"
          }`}
        >
          <div className="flex items-start gap-2">
            <Sparkles className="w-4 h-4 text-pacific-cyan shrink-0 mt-0.5" />
            <p className="text-xs text-foreground/90 font-mono leading-relaxed">{message}</p>
          </div>
        </div>

        {/* Toggle Button Surface */}
        <button
          onClick={toggleTorch}
          onMouseEnter={() => {
            setIsButtonHovered(true);
            showRandomMessage();
          }}
          onMouseLeave={() => {
            setIsButtonHovered(false);
            hideMessage();
          }}
          aria-label={isActive ? "Disable Torch Mode" : "Enable Torch Mode"}
          title={isActive ? "Torch Mode Active" : "Light up the page"}
          className={`group relative flex items-center justify-center w-12 h-12 rounded-full border transition-all duration-300 shadow-xl cursor-pointer pointer-events-auto ${
            isActive
              ? "bg-pacific-cyan/20 border-pacific-cyan text-pacific-cyan shadow-[0_0_20px_rgba(24,155,173,0.4)]"
              : "bg-surface/80 border-surface-border text-muted hover:text-foreground hover:border-pacific-cyan/50 hover:bg-surface"
          }`}
        >
          {/* Invisible sizing anchor for button geometry */}
          <div className="w-5 h-5 pointer-events-none opacity-0" aria-hidden="true" />
        </button>
      </div>

      {/* Layer 1 (z-[65]): Torch Lightbulb Icon Overlay (sits above custom cursor at z-50) */}
      <div className="fixed bottom-6 right-6 z-[65] pointer-events-none">
        <div className="w-12 h-12 flex items-center justify-center relative pointer-events-none">
          <Lightbulb
            className={`w-5 h-5 transition-transform duration-300 ${
              isButtonHovered ? "scale-110 text-foreground" : "text-muted"
            } ${
              isActive ? "fill-pacific-cyan/40 text-pacific-cyan animate-pulse" : ""
            }`}
          />
          {isActive && (
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-pacific-cyan opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-pacific-cyan" />
            </span>
          )}
        </div>
      </div>
    </>
  );
}
