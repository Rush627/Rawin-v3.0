"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { ArrowUp, Mail, Phone } from "lucide-react";
import { GithubIcon, LinkedinIcon, TwitterIcon, InstagramIcon } from "@/components/SocialIcons";

import type { GlobalContent, ContactContent } from "@/lib/site-content";

interface FooterProps {
  content?: Partial<GlobalContent>;
  contact?: Partial<ContactContent>;
  logo?: {
    url?: string;
    alt?: string;
  };
  footerCopyright?: string;
  currentYear?: number;
}

export default function Footer({
  content,
  contact,
  logo,
  footerCopyright,
  currentYear,
}: FooterProps = {}) {
  const pathname = usePathname();

  const scrollToTop = () => {
    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const lenis =
      typeof window !== "undefined"
        ? (window as unknown as {
            __lenis?: {
              scrollTo: (
                target: number | HTMLElement,
                options?: { immediate?: boolean; force?: boolean }
              ) => void;
            };
          }).__lenis
        : null;

    if (lenis) {
      lenis.scrollTo(0, { immediate: prefersReducedMotion, force: true });
    }

    if (typeof window !== "undefined") {
      window.scrollTo({
        top: 0,
        behavior: prefersReducedMotion ? "auto" : "smooth",
      });
    }
  };

  if (pathname.startsWith("/admin") || pathname === "/ai" || pathname.startsWith("/ai/")) {
    return null;
  }

  const resolvedCopyright =
    footerCopyright ||
    content?.footerCopyright ||
    "RAWIN. All rights reserved. Designed & built by Rushan Siddiqui.";
  const year = currentYear ?? new Date().getFullYear();
  const copyrightText = `© ${year} ${resolvedCopyright}`;
  const footerPhone =
    contact?.showPhoneNumber && contact?.phone && contact.phone.trim().length > 0
      ? contact.phone.trim()
      : null;

  return (
    <footer className="relative z-20 w-full border-t border-white/[0.06] bg-ink-black/80 backdrop-blur-lg pt-16 pb-12 px-6 mt-24">
      <div className="max-w-6xl mx-auto flex flex-col gap-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          {/* Brand Col */}
          <div className="md:col-span-2 flex flex-col gap-4">
            {/* Brand Logo (Clean, no glow) */}
            <Link
              href="/"
              className="inline-flex items-center group py-1 px-1.5 rounded-xl transition-opacity hover:opacity-85 w-fit"
              aria-label="RAWIN Home"
            >
              <Image
                src={logo?.url || "/images/logo.png"}
                alt={logo?.alt || "RAWIN Logo"}
                width={120}
                height={42}
                unoptimized
                className="h-9 w-auto object-contain transition-transform duration-200 group-hover:scale-105"
              />
            </Link>
            <p className="text-sm text-muted max-w-sm leading-relaxed">
              {content?.shortBio || (
                <>
                  Built by <strong className="text-foreground">Rushan Siddiqui</strong>. Full Stack Developer building clean interfaces, thoughtful user experiences, and modern web applications.
                </>
              )}
            </p>
            <div className="flex items-center gap-2 mt-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                {content?.availabilityStatus || "Open to opportunities"}
              </span>
            </div>
          </div>

          {/* Quick Links */}
          <div className="flex flex-col gap-3">
            <h4 className="text-xs uppercase tracking-wider text-muted/60 font-mono">Navigation</h4>
            <div className="flex flex-col gap-2 text-sm text-muted">
              <Link href="/" className="hover:text-pacific-cyan transition-colors">Home</Link>
              <Link href="/about" className="hover:text-pacific-cyan transition-colors">About</Link>
              <Link href="/projects" className="hover:text-pacific-cyan transition-colors">Projects</Link>
              <Link href="/blog" className="hover:text-pacific-cyan transition-colors">Blog</Link>
              <Link href="/uses" className="hover:text-pacific-cyan transition-colors">Uses</Link>
              <Link href="/resume" className="hover:text-pacific-cyan transition-colors">Resume</Link>
              <Link href="/contact" className="hover:text-pacific-cyan transition-colors">Contact</Link>
            </div>
          </div>

          {/* Socials & Connect */}
          <div className="flex flex-col gap-3">
            <h4 className="text-xs uppercase tracking-wider text-muted/60 font-mono">Connect</h4>
            <div className="flex flex-col gap-2 text-sm text-muted">
              {/* Direct Email */}
              <a
                href={`mailto:${contact?.email || content?.contactEmail || "rushansiddiqui5262@gmail.com"}`}
                aria-label={`Email ${contact?.email || content?.contactEmail || "rushansiddiqui5262@gmail.com"}`}
                className="flex items-center gap-2 hover:text-pacific-cyan transition-colors"
              >
                <Mail className="w-4 h-4 shrink-0 text-pacific-cyan" />
                <span className="break-all">{contact?.email || content?.contactEmail || "rushansiddiqui5262@gmail.com"}</span>
              </a>

              {/* Phone (Only when showPhoneNumber is ON) */}
              {footerPhone && (
                <a
                  href={`tel:${footerPhone.replace(/[^+\d]/g, "")}`}
                  aria-label={`Call ${footerPhone}`}
                  className="flex items-center gap-2 hover:text-pacific-cyan transition-colors"
                >
                  <Phone className="w-4 h-4 shrink-0 text-pacific-cyan" />
                  <span className="font-mono text-xs">{footerPhone}</span>
                </a>
              )}

              {/* GitHub */}
              {(contact?.socials?.github ?? "https://github.com/rush627").trim().length > 0 && (
                <a
                  href={contact?.socials?.github ?? "https://github.com/rush627"}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Visit Rushan Siddiqui on GitHub"
                  className="flex items-center gap-2 hover:text-pacific-cyan transition-colors"
                >
                  <GithubIcon className="w-4 h-4" />
                  <span>GitHub</span>
                </a>
              )}

              {/* LinkedIn */}
              {(contact?.socials?.linkedin ?? "https://www.linkedin.com/in/rushan-s-8ab3b3338").trim().length > 0 && (
                <a
                  href={contact?.socials?.linkedin ?? "https://www.linkedin.com/in/rushan-s-8ab3b3338"}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Visit Rushan Siddiqui on LinkedIn"
                  className="flex items-center gap-2 hover:text-pacific-cyan transition-colors"
                >
                  <LinkedinIcon className="w-4 h-4" />
                  <span>LinkedIn</span>
                </a>
              )}

              {/* X / Twitter */}
              {(contact?.socials?.twitter ?? "https://x.com/sidd_rushan__").trim().length > 0 && (
                <a
                  href={contact?.socials?.twitter ?? "https://x.com/sidd_rushan__"}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Visit Rushan Siddiqui on X / Twitter"
                  className="flex items-center gap-2 hover:text-pacific-cyan transition-colors"
                >
                  <TwitterIcon className="w-4 h-4" />
                  <span>X / Twitter</span>
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-8 border-t border-white/[0.06] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted sm:pr-16">
          <p>{copyrightText}</p>
          <button
            type="button"
            onClick={scrollToTop}
            aria-label="Back to top"
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg glass-card hover:text-foreground hover:border-pacific-cyan/40 transition-colors cursor-pointer relative z-30 shadow-md active:scale-95"
          >
            <span>Back to top</span>
            <ArrowUp className="w-3.5 h-3.5 text-pacific-cyan" />
          </button>
        </div>
      </div>
    </footer>
  );
}
