"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { useReducedMotionSafe } from "@/lib/useReducedMotionSafe";
import { ArrowUpRight } from "lucide-react";
import Wordmark from "./Wordmark";
import OrbitSignal from "./OrbitSignal";
import ThemeToggle from "@/components/theme/ThemeToggle";
import { NAV_ITEMS, getLenis, isActivePath } from "./nav-items";
import { EASE_EDITORIAL, LAYOUT_SPRING } from "@/lib/motion";
import { getActiveSocialLinks } from "@/components/SocialIcons";
import type { ContactSocials } from "@/lib/site-content";
import { haptic } from "@/lib/haptics";

interface SiteHeaderProps {
  brandMode?: "wordmark" | "logo";
  /** theme logo variants (used when brandMode is "logo") */
  logos?: { light?: { url?: string; alt?: string }; dark?: { url?: string; alt?: string } };
  email?: string;
  socials?: Partial<ContactSocials>;
}

export function OrbitGlyph({ className = "" }: { className?: string }) {
  return (
    <span aria-hidden="true" className={`orbit-glyph relative inline-block rounded-full ${className}`}>
      <span className="absolute inset-[18%] rounded-full orbit-glyph-core" />
    </span>
  );
}

export default function SiteHeader({ brandMode = "wordmark", logos, email, socials }: SiteHeaderProps) {
  const pathname = usePathname() || "/";
  const reduced = useReducedMotionSafe();
  const [open, setOpen] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);

  // Hide on scroll down, reveal on scroll up
  useEffect(() => {
    let last = window.scrollY;
    let raf: number | null = null;
    const onScroll = () => {
      if (raf !== null) return;
      raf = requestAnimationFrame(() => {
        raf = null;
        const y = window.scrollY;
        setScrolled(y > 24);
        if (Math.abs(y - last) > 6) {
          setHidden(y > last && y > 160);
          last = y;
        }
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (raf !== null) cancelAnimationFrame(raf);
    };
  }, []);

  // Close the menu on navigation (adjusting state during render, not in an effect)
  const [menuPath, setMenuPath] = useState(pathname);
  if (menuPath !== pathname) {
    setMenuPath(pathname);
    setOpen(false);
  }

  // Menu: scroll lock, Escape, focus management
  useEffect(() => {
    if (!open) return;
    const lenis = getLenis();
    lenis?.stop?.();
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
      if (e.key === "Tab" && panelRef.current) {
        // The toggle (now an X) stays reachable inside the trap so the menu can always be closed
        const focusables = [
          ...(menuButtonRef.current ? [menuButtonRef.current] : []),
          ...Array.from(panelRef.current.querySelectorAll<HTMLElement>("a[href], button:not([disabled])")),
        ];
        if (!focusables.length) return;
        const first = focusables[0];
        const lastEl = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          lastEl.focus();
        } else if (!e.shiftKey && document.activeElement === lastEl) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    const t = window.setTimeout(() => panelRef.current?.querySelector<HTMLElement>("a[href]")?.focus(), 80);
    const button = menuButtonRef.current;
    return () => {
      document.body.style.overflow = prevOverflow;
      lenis?.start?.();
      document.removeEventListener("keydown", onKey);
      window.clearTimeout(t);
      button?.focus();
    };
  }, [open]);

  if (pathname.startsWith("/saint-denis") || pathname === "/ai" || pathname.startsWith("/ai/")) {
    return null;
  }

  const socialLinks = getActiveSocialLinks(socials as ContactSocials | undefined);
  const isOrbit = isActivePath(pathname, "/ai");
  const isReading = pathname.startsWith("/blog/");
  // Contact on phones leads straight into the inquiry: no Orbit row there (tablets keep it)
  const quietOnPhones = pathname === "/contact";

  return (
    <>
      <motion.header
        className="fixed inset-x-0 top-0 z-[60] pointer-events-none"
        initial={false}
        animate={{ y: hidden && !open ? "-130%" : "0%" }}
        transition={{ duration: reduced ? 0 : 0.5, ease: EASE_EDITORIAL }}
      >
        <div className="px-3 sm:px-6 lg:px-10 pt-[max(0.75rem,env(safe-area-inset-top))]">
          <div
            data-scrolled={scrolled || open ? "true" : undefined}
            className="rawin-navbar pointer-events-auto mx-auto flex items-center justify-between gap-2 sm:gap-4"
          >
            {/* Brand */}
            <Link
              href="/"
              aria-label="RAWIN — Home"
              className="relative inline-flex items-center h-11 pl-4 pr-2 rounded-full shrink-0"
            >
              <Wordmark mode={brandMode} logos={logos} withMark={false} />
            </Link>

            {/* Desktop index */}
            <nav aria-label="Primary" className="hidden lg:flex items-center gap-0.5">
              {NAV_ITEMS.map((item) => {
                const active = isActivePath(pathname, item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={`relative inline-flex items-center h-9 px-3.5 xl:px-4 rounded-full text-[13px] font-medium transition-colors ${
                      active ? "text-inverse-fg" : "text-fg-muted hover:text-fg"
                    }`}
                  >
                    {active && (
                      <motion.span
                        layoutId="rawin-nav-active"
                        className="absolute inset-0 rounded-full bg-inverse"
                        transition={reduced ? { duration: 0 } : LAYOUT_SPRING}
                      />
                    )}
                    <span className="relative">{item.name}</span>
                  </Link>
                );
              })}
            </nav>

            {/* Actions */}
            <div className="relative flex items-center gap-1 sm:gap-1.5 shrink-0">
              <Link
                href="/ai"
                aria-label="Open Rawin Orbit assistant"
                className={`group hidden lg:inline-flex items-center gap-2 h-10 pl-1.5 pr-3.5 rounded-full text-[13px] font-medium transition-colors ${
                  isOrbit ? "bg-inverse text-inverse-fg" : "text-fg hover:bg-fg/5"
                }`}
              >
                <OrbitGlyph className="w-7 h-7" />
                <span>Orbit</span>
              </Link>
              <span aria-hidden="true" className="hidden lg:block w-px h-5 bg-line" />
              <ThemeToggle />
              <button
                ref={menuButtonRef}
                type="button"
                onClick={() => {
                  haptic.impact();
                  setOpen((v) => !v);
                }}
                aria-expanded={open}
                aria-controls="rawin-menu"
                aria-label={open ? "Close menu" : "Open menu"}
                data-open={open ? "true" : undefined}
                className="menu-toggle lg:hidden relative inline-flex items-center justify-center w-11 h-11 rounded-full bg-inverse text-inverse-fg touch-manipulation"
              >
                <span aria-hidden="true" className="menu-toggle-lines">
                  <span />
                  <span />
                  <span />
                </span>
              </button>
            </div>
          </div>
          {/* Phones: Orbit lives in its own quiet row below the bar, only while at the top.
              Not on reading pages (blog articles): the reader goes straight to the article;
              not on phone-width Contact, where the inquiry form comes first. */}
          {!isOrbit && !isReading && (
            <div
              className={`lg:hidden ${quietOnPhones ? "max-md:hidden " : ""}flex justify-center transition-[opacity,transform,margin] duration-500 ${
                scrolled || open ? "opacity-0 -translate-y-2 pointer-events-none mt-0 h-0" : "opacity-100 mt-6 pointer-events-auto"
              }`}
              inert={scrolled || open}
            >
              <OrbitSignal variant="bar" />
            </div>
          )}
        </div>
      </motion.header>

      {/* Tablet / phone index */}
      <AnimatePresence>
        {open && (
          <motion.div
            id="rawin-menu"
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label="Site menu"
            className="fixed inset-0 z-[55] lg:hidden bg-bg overflow-y-auto overscroll-contain"
            initial={reduced ? { opacity: 0 } : { clipPath: "inset(0 0 100% 0)" }}
            animate={reduced ? { opacity: 1 } : { clipPath: "inset(0 0 0% 0)" }}
            exit={reduced ? { opacity: 0 } : { clipPath: "inset(0 0 100% 0)" }}
            transition={{ duration: reduced ? 0.15 : 0.7, ease: EASE_EDITORIAL }}
          >
            {/* One screen: rows are sized from the real available height (see .mobile-menu-row), so
                the index, email and social links all fit without scrolling. The atmosphere lives
                inside the content wrapper, so it always spans the full content height (it used to
                cover only the first screen, leaving a plain band where the content ran longer). */}
            <div
              className="mobile-menu relative min-h-full flex flex-col px-5 sm:px-10 pt-[calc(max(0.75rem,env(safe-area-inset-top))+4.4rem)] pb-[max(1rem,env(safe-area-inset-bottom))]"
              style={{ "--menu-items": NAV_ITEMS.length } as React.CSSProperties}
            >
              <div aria-hidden="true" className="rawin-atmosphere !absolute" />
              <p className="relative label-mono text-fg-subtle mb-2 sm:mb-6">Index</p>
              <ul className="relative flex flex-col sm:grid sm:grid-cols-2 sm:gap-x-10">
                {NAV_ITEMS.map((item, i) => {
                  const active = isActivePath(pathname, item.href);
                  return (
                    <motion.li
                      key={item.href}
                      initial={reduced ? false : { opacity: 0, y: 40 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.7, ease: EASE_EDITORIAL, delay: reduced ? 0 : 0.15 + i * 0.05 }}
                      className="border-b border-line"
                    >
                      <Link
                        href={item.href}
                        onClick={() => {
                          haptic.selection();
                          setOpen(false);
                        }}
                        aria-current={active ? "page" : undefined}
                        className="mobile-menu-row group flex items-baseline justify-between gap-4"
                      >
                        <span className="flex items-baseline gap-4">
                          <span className="font-mono text-[11px] text-fg-subtle w-6">{String(i + 1).padStart(2, "0")}</span>
                          <span
                            className={`mobile-menu-label font-display leading-[0.95] tracking-[-0.02em] ${
                              active ? "italic text-accent" : "text-fg"
                            }`}
                          >
                            {item.name}
                          </span>
                        </span>
                        <ArrowUpRight className="w-5 h-5 text-fg-subtle transition-transform group-active:translate-x-0.5" />
                      </Link>
                    </motion.li>
                  );
                })}
              </ul>

              <motion.div
                className="relative mt-auto pt-4 sm:pt-10 grid grid-cols-1 min-[420px]:grid-cols-2 gap-3 sm:gap-6 text-sm"
                initial={reduced ? false : { opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: reduced ? 0 : 0.55, duration: 0.5 }}
              >
                <div className="flex flex-col gap-1 sm:gap-2">
                  <span className="label-mono text-fg-subtle">Write</span>
                  {email && (
                    <a href={`mailto:${email}`} className="text-fg [overflow-wrap:anywhere] link-draw w-fit inline-flex items-center min-h-8">
                      {email}
                    </a>
                  )}
                </div>
                <div className="flex flex-col gap-1 sm:gap-2">
                  <span className="label-mono text-fg-subtle">Elsewhere</span>
                  <div className="flex flex-wrap gap-x-5 gap-y-1">
                    {socialLinks.map((s) => (
                      <a key={s.id} href={s.url} target="_blank" rel="noopener noreferrer" className="text-fg link-draw inline-flex items-center min-h-8">
                        {s.name}
                      </a>
                    ))}
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
