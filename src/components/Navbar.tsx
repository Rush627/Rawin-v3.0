"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, Bot, ArrowUpRight } from "lucide-react";

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
    <header className="fixed top-0 left-0 right-0 z-50 flex justify-center px-4 pt-4 md:pt-6 transition-all duration-300">
      <nav
        className={`w-full max-w-6xl flex items-center justify-between px-5 py-3 rounded-2xl transition-all duration-300 ${
          scrolled
            ? "glass-pill shadow-[0_8px_32px_rgba(0,0,0,0.5)] border-white/10"
            : "bg-surface/50 backdrop-blur-md border border-white/5"
        }`}
      >
        {/* Brand Logo with Unified Atmospheric Glow */}
        <Link
          href="/"
          className="relative flex items-center group py-1 px-1.5 rounded-xl transition-all duration-300"
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
            className="relative h-8 w-auto object-contain filter drop-shadow-[0_0_8px_rgba(24,155,173,0.35)] group-hover:drop-shadow-[0_0_14px_rgba(24,155,173,0.6)] group-hover:scale-105 transition-all duration-300"
          />
        </Link>

        {/* Desktop Navigation Links */}
        <div className="hidden lg:flex items-center gap-1">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`relative px-3.5 py-1.5 text-sm font-medium rounded-lg transition-colors duration-200 ${
                  isActive
                    ? "text-pacific-cyan"
                    : "text-muted hover:text-foreground hover:bg-white/[0.04]"
                }`}
              >
                {item.name}
                {isActive && (
                  <motion.div
                    layoutId="activeNavIndicator"
                    className="absolute inset-0 bg-pacific-cyan/10 border border-pacific-cyan/20 rounded-lg -z-10"
                    transition={{ type: "spring", stiffness: 350, damping: 30 }}
                  />
                )}
              </Link>
            );
          })}
        </div>

        {/* Action Button: AI Assistant & Mobile Hamburger */}
        <div className="flex items-center gap-3">
          {/* Orbit Quick Trigger */}
          <Link
            href="/ai"
            className={`hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-all duration-200 border ${
              pathname === "/ai"
                ? "bg-pacific-cyan text-ink-black border-pacific-cyan font-semibold shadow-[0_0_15px_rgba(24,155,173,0.4)]"
                : "glass-card text-muted hover:text-pacific-cyan hover:border-pacific-cyan/40"
            }`}
          >
            <Bot className="w-3.5 h-3.5 text-pacific-cyan" />
            <span>Orbit</span>
          </Link>

          {/* Mobile Menu Toggle Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            aria-label={isOpen ? "Close menu" : "Open menu"}
            className="lg:hidden flex items-center justify-center w-9 h-9 rounded-lg glass-card text-muted hover:text-foreground"
          >
            {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </nav>

      {/* Mobile Drawer Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.98 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="fixed inset-x-4 top-20 z-40 lg:hidden glass-panel rounded-2xl p-6 shadow-2xl border border-white/10"
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
                    className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-base font-medium transition-colors ${
                      isActive
                        ? "bg-pacific-cyan/15 text-pacific-cyan font-semibold"
                        : "text-foreground/80 hover:bg-white/5 hover:text-foreground"
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
                  className="flex items-center justify-between px-3 py-2.5 rounded-xl bg-pacific-cyan/10 border border-pacific-cyan/20 text-pacific-cyan text-base font-medium"
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
        )}
      </AnimatePresence>
    </header>
  );
}
