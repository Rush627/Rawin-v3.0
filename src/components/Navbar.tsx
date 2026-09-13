"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, Bot, ArrowUpRight } from "lucide-react";
import "./GooeyNavEffect.css";

const NAV_ITEMS = [
  { name: "Home", href: "/" },
  { name: "About", href: "/about" },
  { name: "Projects", href: "/projects" },
  { name: "Blog", href: "/blog" },
  { name: "Uses", href: "/uses" },
  { name: "Resume", href: "/resume" },
  { name: "Contact", href: "/contact" },
];

const PARTICLE_COLORS = [
  "#189BAD", // RAWIN Pacific Cyan
  "#71C4FF", // Sky Cyan
  "#FFFFFF", // Pure White
  "#A5F3FC", // Cyan White
  "#38BDF8", // Vibrant Light Cyan
];

function triggerGooeyBurst(container: HTMLElement, centerX: number, centerY: number) {
  const count = 12;
  const maxDist = 48;
  const minDist = 22;
  const baseTime = 560;
  const timeVariance = 100;

  const particles: HTMLElement[] = [];

  for (let i = 0; i < count; i++) {
    const particle = document.createElement("span");
    particle.className = "rawin-nav-gooey-particle";
    particle.style.left = `${centerX}px`;
    particle.style.top = `${centerY}px`;

    const point = document.createElement("span");
    point.className = "rawin-nav-gooey-point";

    const angle = (2 * Math.PI * i) / count + (Math.random() - 0.5) * 0.45;
    const distance = minDist + Math.random() * (maxDist - minDist);
    const startX = Math.cos(angle) * distance;
    const startY = Math.sin(angle) * distance;

    const endAngle = angle + (Math.random() - 0.5) * 0.5;
    const endDist = distance * (0.35 + Math.random() * 0.2);
    const endX = Math.cos(endAngle) * endDist;
    const endY = Math.sin(endAngle) * endDist;

    const rotate = (Math.random() - 0.5) * 140;
    const duration = baseTime + (Math.random() - 0.5) * timeVariance;
    const scale = 0.8 + Math.random() * 0.45;
    const color = PARTICLE_COLORS[Math.floor(Math.random() * PARTICLE_COLORS.length)];

    particle.style.setProperty("--start-x", `${startX.toFixed(1)}px`);
    particle.style.setProperty("--start-y", `${startY.toFixed(1)}px`);
    particle.style.setProperty("--end-x", `${endX.toFixed(1)}px`);
    particle.style.setProperty("--end-y", `${endY.toFixed(1)}px`);
    particle.style.setProperty("--rotate", `${rotate.toFixed(1)}deg`);
    particle.style.setProperty("--time", `${Math.round(duration)}ms`);

    point.style.setProperty("--color", color);
    point.style.setProperty("--scale", scale.toFixed(2));
    point.style.setProperty("--time", `${Math.round(duration)}ms`);

    particle.appendChild(point);
    container.appendChild(particle);
    particles.push(particle);
  }

  // Auto clean-up after animation finishes
  window.setTimeout(() => {
    particles.forEach((p) => {
      if (p.parentNode === container) {
        container.removeChild(p);
      }
    });
  }, baseTime + timeVariance + 80);
}

interface NavbarProps {
  logo?: {
    url?: string;
    alt?: string;
  };
}

export default function Navbar({ logo }: NavbarProps = {}) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const desktopNavRef = useRef<HTMLDivElement>(null);
  const gooeyContainerRef = useRef<HTMLDivElement>(null);

  const handleDesktopNavClick = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
      if (pathname === href) return;
      if (
        typeof window !== "undefined" &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches
      ) {
        return;
      }
      if (!desktopNavRef.current || !gooeyContainerRef.current) return;

      const containerRect = desktopNavRef.current.getBoundingClientRect();
      const linkRect = e.currentTarget.getBoundingClientRect();
      const centerX = linkRect.left + linkRect.width / 2 - containerRect.left;
      const centerY = linkRect.top + linkRect.height / 2 - containerRect.top;

      triggerGooeyBurst(gooeyContainerRef.current, centerX, centerY);
    },
    [pathname]
  );

  // Detect scroll to adjust navbar background elevation
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close mobile drawer on route change
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  if (pathname.startsWith("/admin") || pathname === "/ai" || pathname.startsWith("/ai/")) {
    return null;
  }

  const logoSrc = logo?.url || "/images/logo.png";
  const logoAlt = logo?.alt || "RAWIN Logo";

  return (
    <header className="fixed top-0 left-0 right-0 z-50 flex justify-center px-4 pt-[max(1rem,env(safe-area-inset-top))] md:pt-6 transition-all duration-300 pointer-events-none">
      <nav
        className={`w-full max-w-6xl flex items-center justify-between px-4 sm:px-5 py-2.5 sm:py-3 rounded-2xl transition-all duration-300 pointer-events-auto ${
          scrolled
            ? "glass-pill shadow-[0_8px_32px_rgba(0,0,0,0.5)] border-white/10"
            : "bg-surface/50 backdrop-blur-md border border-white/5"
        }`}
      >
        {/* Brand Logo with Unified Atmospheric Glow */}
        <Link
          href="/"
          className="relative flex items-center group py-1 px-1.5 rounded-xl transition-all duration-300 shrink-0"
          aria-label="RAWIN Home"
        >
          {/* Subtle Ambient Radial Back-Glow */}
          <div
            aria-hidden="true"
            className="absolute inset-0 rounded-xl bg-pacific-cyan/20 blur-lg opacity-40 group-hover:opacity-80 group-hover:scale-110 transition-all duration-500 pointer-events-none -z-10"
          />
          {/* Soft inner core aura */}
          <div
            aria-hidden="true"
            className="absolute inset-1 rounded-lg bg-gradient-to-r from-pacific-cyan/15 via-apricot-cream/10 to-pacific-cyan/15 blur-sm opacity-50 group-hover:opacity-90 transition-opacity duration-300 pointer-events-none -z-10"
          />
          <Image
            src={logoSrc}
            alt={logoAlt}
            width={115}
            height={40}
            priority
            unoptimized
            className="relative h-7 sm:h-8 w-auto object-contain filter drop-shadow-[0_0_8px_rgba(24,155,173,0.35)] group-hover:drop-shadow-[0_0_14px_rgba(24,155,173,0.6)] group-hover:scale-105 transition-all duration-300"
          />
        </Link>

        {/* Desktop Navigation Links with Scoped Gooey Click Transition */}
        <div ref={desktopNavRef} className="hidden lg:flex items-center gap-1 relative">
          {/* Scoped Gooey Particle Layer */}
          <div
            ref={gooeyContainerRef}
            className="rawin-nav-gooey-effect"
            aria-hidden="true"
          />

          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={(e) => handleDesktopNavClick(e, item.href)}
                className={`relative px-3.5 py-1.5 text-sm font-medium rounded-lg transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pacific-cyan/60 ${
                  isActive
                    ? "text-ink-black font-semibold"
                    : "text-muted hover:text-foreground hover:bg-white/[0.04]"
                }`}
              >
                <span className="relative z-10">{item.name}</span>
                {isActive && (
                  <motion.div
                    layoutId="activeNavIndicator"
                    className="absolute inset-0 bg-white rounded-lg shadow-[0_2px_12px_rgba(255,255,255,0.25)] z-0"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
              </Link>
            );
          })}
        </div>

        {/* Action Controls: RAWIN ORBIT & Mobile Hamburger */}
        <div className="flex items-center gap-2 sm:gap-3 pointer-events-auto">
          {/* RAWIN ORBIT Quick Trigger - ALWAYS visible on mobile & desktop */}
          <Link
            href="/ai"
            className={`inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-medium rounded-lg transition-all duration-200 border shrink-0 ${
              pathname === "/ai"
                ? "bg-pacific-cyan text-ink-black border-pacific-cyan font-semibold shadow-[0_0_15px_rgba(24,155,173,0.4)]"
                : "glass-card text-muted hover:text-pacific-cyan hover:border-pacific-cyan/40 active:scale-95"
            }`}
            aria-label="RAWIN Orbit AI Assistant"
          >
            <Bot className="w-3.5 h-3.5 text-pacific-cyan shrink-0" />
            <span>Orbit</span>
          </Link>

          {/* Mobile Menu Toggle Button with certified 44x44px touch target */}
          <button
            type="button"
            onClick={() => setIsOpen((prev) => !prev)}
            aria-label={isOpen ? "Close menu" : "Open menu"}
            aria-expanded={isOpen}
            className="lg:hidden flex items-center justify-center min-w-[44px] min-h-[44px] w-11 h-11 rounded-lg glass-card text-muted hover:text-foreground active:scale-95 transition-transform touch-manipulation cursor-pointer shrink-0"
            style={{ touchAction: "manipulation" }}
          >
            {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </nav>

      {/* Mobile Drawer Menu */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Tap-outside backdrop to dismiss */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="fixed inset-0 bg-ink-black/60 backdrop-blur-sm z-30 lg:hidden pointer-events-auto"
              onClick={() => setIsOpen(false)}
              aria-hidden="true"
            />

            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.98 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="fixed inset-x-4 top-[max(4.75rem,calc(env(safe-area-inset-top)+3.75rem))] z-40 lg:hidden glass-panel rounded-2xl p-6 shadow-2xl border border-white/10 pointer-events-auto"
            >
              <div className="flex flex-col gap-2">
                <span className="text-xs uppercase tracking-wider text-muted/60 font-mono px-3 mb-1">
                  Navigation
                </span>
                {NAV_ITEMS.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setIsOpen(false)}
                      className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-base font-medium transition-colors ${
                        isActive
                          ? "bg-pacific-cyan/15 text-pacific-cyan font-semibold"
                          : "text-foreground/80 hover:bg-white/5 hover:text-foreground active:bg-white/10"
                      }`}
                    >
                      <span>{item.name}</span>
                      <ArrowUpRight className="w-4 h-4 text-muted/40" />
                    </Link>
                  );
                })}

                <div className="pt-3 mt-2 border-t border-white/5">
                  <Link
                    href="/ai"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center justify-between px-3 py-2.5 rounded-xl bg-pacific-cyan/10 border border-pacific-cyan/20 text-pacific-cyan text-base font-medium active:bg-pacific-cyan/20"
                  >
                    <div className="flex items-center gap-2">
                      <Bot className="w-4 h-4" />
                      <span>Orbit</span>
                    </div>
                    <ArrowUpRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </header>
  );
}
