"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";
import { X, ArrowUpRight } from "lucide-react";
import NavbarOrbitIcon from "@/components/NavbarOrbitIcon";
import "./NavbarOrbitEffect.css";

const NAV_ITEMS = [
  { name: "Home", href: "/" },
  { name: "About", href: "/about" },
  { name: "Projects", href: "/projects" },
  { name: "Blog", href: "/blog" },
  { name: "Uses", href: "/uses" },
  { name: "Resume", href: "/resume" },
  { name: "Contact", href: "/contact" },
];

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
    <>
      {/* Layer 1 (z-[40]): Navbar Glass Surface, Glows, Active Nav Pill & Button Backgrounds (below Custom Cursor at z-50) */}
      <div
        aria-hidden="true"
        className="fixed top-0 left-0 right-0 z-[40] flex justify-center px-4 pt-[max(1rem,env(safe-area-inset-top))] md:pt-6 transition-all duration-300 pointer-events-none select-none"
      >
        <div
          className={`w-full max-w-6xl flex items-center justify-between px-4 sm:px-5 py-2.5 sm:py-3 rounded-2xl transition-all duration-300 pointer-events-none ${
            scrolled
              ? "glass-pill shadow-[0_8px_32px_rgba(0,0,0,0.5)] border-white/10"
              : "bg-surface/50 backdrop-blur-md border border-white/5"
          }`}
        >
          {/* Logo Sizing Anchor (sits below cursor at z-50) */}
          <div className="relative flex items-center py-1 px-1.5 shrink-0">
            {/* Sizing anchor */}
            <div className="invisible h-7 sm:h-8 w-[115px]" />
          </div>

          {/* Center spacer maintaining flex layout structure */}
          <div className="hidden lg:block w-0 h-0 pointer-events-none" aria-hidden="true" />

          {/* Action Controls Background Track (sits below cursor at z-50) */}
          <div className="flex items-center gap-2 sm:gap-3 pointer-events-none">
            <div
              className={`inline-flex items-center gap-1.5 lg:gap-2 px-2.5 sm:px-3 lg:px-3.5 py-1.5 lg:py-2 text-xs lg:text-[13px] font-medium rounded-lg transition-all duration-200 border shrink-0 ${
                pathname === "/ai"
                  ? "bg-pacific-cyan border-pacific-cyan shadow-[0_0_15px_rgba(24,155,173,0.4)]"
                  : "glass-card hover:border-pacific-cyan/40"
              }`}
            >
              <div className="invisible w-3.5 h-3.5 lg:w-4 lg:h-4" />
              <span className="invisible">Orbit</span>
            </div>
            {/* Mobile hamburger sizing anchor */}
            <div className="lg:hidden min-w-[44px] min-h-[44px] w-11 h-11 rounded-lg invisible shrink-0" />
          </div>
        </div>
      </div>

      {/* Layer 3 (z-[60]): Navbar Interactive Content (rendered above Custom Cursor at z-50) */}
      <header className="fixed top-0 left-0 right-0 z-[60] flex justify-center px-4 pt-[max(1rem,env(safe-area-inset-top))] md:pt-6 transition-all duration-300 pointer-events-none">
        <nav
          className="w-full max-w-6xl flex items-center justify-between px-4 sm:px-5 py-2.5 sm:py-3 rounded-2xl transition-all duration-300 pointer-events-auto relative"
        >
        {/* Brand Logo with Subtle Contour Glow */}
        <Link
          href="/"
          className="relative flex items-center group py-1 px-1.5 rounded-xl transition-all duration-300 shrink-0"
          aria-label="RAWIN Home"
        >
          <Image
            src={logoSrc}
            alt={logoAlt}
            width={115}
            height={40}
            priority
            unoptimized
            style={{ mixBlendMode: "screen" }}
            className="relative h-7 sm:h-8 w-auto object-contain filter drop-shadow-[0_0_3.5px_rgba(24,155,173,0.35)] group-hover:drop-shadow-[0_0_6px_rgba(24,155,173,0.5)] group-hover:scale-105 transition-all duration-300 mix-blend-screen"
          />
        </Link>

        {/* Desktop Navigation Links */}
        <LayoutGroup id="rawin-navbar-nav-group">
          <div className="hidden lg:flex items-center gap-1 relative z-20">
            {NAV_ITEMS.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`relative inline-flex items-center justify-center px-3.5 py-1.5 text-sm font-medium rounded-lg transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pacific-cyan/60 ${
                    isActive
                      ? "text-ink-black font-semibold"
                      : "text-muted hover:text-foreground hover:bg-white/[0.04]"
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="rawin-desktop-nav-active-pill"
                      className="absolute inset-0 bg-white rounded-lg shadow-[0_2px_12px_rgba(255,255,255,0.25)] z-0"
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                  )}
                  <span className="relative z-10 select-none">{item.name}</span>
                </Link>
              );
            })}
          </div>
        </LayoutGroup>

        {/* Action Controls: RAWIN ORBIT & Mobile Hamburger */}
        <div className="flex items-center gap-2 sm:gap-3 pointer-events-auto">
          {/* RAWIN ORBIT Quick Trigger - ALWAYS visible on mobile & desktop */}
          <Link
            href="/ai"
            className={`inline-flex items-center gap-1.5 lg:gap-2 px-2.5 sm:px-3 lg:px-3.5 py-1.5 lg:py-2 text-xs lg:text-[13px] font-medium rounded-lg transition-all duration-200 border border-transparent shrink-0 active:scale-95 ${
              pathname === "/ai"
                ? "text-ink-black font-semibold"
                : "text-muted hover:text-pacific-cyan"
            }`}
            aria-label="RAWIN Orbit AI Assistant"
          >
            <NavbarOrbitIcon className="w-3.5 h-3.5 lg:w-4 lg:h-4 text-pacific-cyan shrink-0" />
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
            <div className="w-5 h-5 relative flex items-center justify-center pointer-events-none">
              <span
                className={`absolute h-0.5 w-4 bg-current rounded-full transition-all duration-300 ease-out ${
                  isOpen ? "rotate-45 translate-y-0" : "-translate-y-1.5"
                }`}
              />
              <span
                className={`absolute h-0.5 w-4 bg-current rounded-full transition-all duration-200 ease-out ${
                  isOpen ? "opacity-0 scale-x-0" : "opacity-100 scale-x-100"
                }`}
              />
              <span
                className={`absolute h-0.5 w-4 bg-current rounded-full transition-all duration-300 ease-out ${
                  isOpen ? "-rotate-45 translate-y-0" : "translate-y-1.5"
                }`}
              />
            </div>
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
                <div className="flex items-center justify-between pb-3 mb-1 border-b border-white/5">
                  <span className="text-xs uppercase tracking-wider text-muted/60 font-mono">
                    Navigation
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    aria-label="Close menu"
                    className="flex items-center justify-center min-w-[44px] min-h-[44px] w-11 h-11 rounded-lg glass-card text-muted hover:text-foreground active:scale-95 transition-transform touch-manipulation cursor-pointer shrink-0"
                    style={{ touchAction: "manipulation" }}
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
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
                      <NavbarOrbitIcon className="w-3.5 h-3.5 lg:w-4 lg:h-4 text-pacific-cyan shrink-0" />
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
  </>
  );
}
