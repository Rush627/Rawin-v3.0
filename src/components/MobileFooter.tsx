"use client";

import React from "react";
import { getActiveSocialLinks } from "@/components/SocialIcons";
import type { GlobalContent, ContactContent } from "@/lib/site-content";

export interface MobileFooterProps {
  content?: Partial<GlobalContent>;
  contact?: Partial<ContactContent>;
  logo?: {
    url?: string;
    alt?: string;
  };
  footerCopyright?: string;
  currentYear?: number;
  hasTopBorder?: boolean;
}

/**
 * Shared Smartphone & Tablet Footer (<1024px)
 * Displays the continuous technical ticker strip, social icons, CMS copyright,
 * and the iconic oversized outlined RAWIN signature.
 */
export default function MobileFooter({
  content,
  contact,
  footerCopyright,
  currentYear,
  hasTopBorder = false,
}: MobileFooterProps) {
  const activeSocialLinks = getActiveSocialLinks(
    contact?.socials || {
      github: "https://github.com/rush627",
      linkedin: "https://www.linkedin.com/in/rushan-s-8ab3b3338",
      twitter: "https://x.com/sidd_rushan__",
    }
  );

  const resolvedCopyright =
    footerCopyright ||
    content?.footerCopyright ||
    "RAWIN. All rights reserved. Designed & built by Rushan Siddiqui.";
  const year = currentYear ?? 2026;
  const copyrightText = `© ${year} ${resolvedCopyright}`;

  const DEFAULT_BULLET_NOTIFICATION =
    "BUILDING WITH INTENT • CRAFTING DIGITAL EXPERIENCES • ALWAYS LEARNING";
  const rawBulletNotification =
    content?.footerBulletNotification?.trim() || DEFAULT_BULLET_NOTIFICATION;
  const bulletItems: string[] = rawBulletNotification
    .split(/[•·]/)
    .map((s: string) => s.trim())
    .filter(Boolean);
  const notificationPhrases: string[] =
    bulletItems.length > 0 ? bulletItems : [rawBulletNotification];

  return (
    <footer
      id="mobile-footer"
      className={`bg-ink-black/95 ${
        hasTopBorder ? "pt-6 sm:pt-8 border-t border-white/[0.08]" : "pt-0"
      } pb-0 relative z-20 flex flex-col w-full overflow-x-clip`}
    >
      {/* Continuous Marquee / Notification Strip */}
      <div
        className="w-full overflow-hidden border-y border-white/[0.08] bg-[#0c0c14] py-2.5 sm:py-3 select-none"
        aria-hidden="true"
      >
        <div className="flex w-max animate-ticker">
          {/* Track 1 */}
          <div className="flex items-center shrink-0">
            {[1, 2, 3, 4].map((repeatIdx: number) => (
              <span key={`t1-${repeatIdx}`} className="inline-flex items-center">
                {notificationPhrases.map((phrase: string, pIdx: number) => (
                  <React.Fragment key={`p1-${repeatIdx}-${pIdx}`}>
                    <span className="text-pacific-cyan font-bold mx-3 sm:mx-4 text-xs select-none">
                      •
                    </span>
                    <span className="text-[11px] sm:text-xs font-mono tracking-widest text-muted/90 uppercase font-medium whitespace-nowrap">
                      {phrase}
                    </span>
                  </React.Fragment>
                ))}
              </span>
            ))}
          </div>
          {/* Track 2 (duplicate for seamless loop) */}
          <div className="flex items-center shrink-0">
            {[1, 2, 3, 4].map((repeatIdx: number) => (
              <span key={`t2-${repeatIdx}`} className="inline-flex items-center">
                {notificationPhrases.map((phrase: string, pIdx: number) => (
                  <React.Fragment key={`p2-${repeatIdx}-${pIdx}`}>
                    <span className="text-pacific-cyan font-bold mx-3 sm:mx-4 text-xs select-none">
                      •
                    </span>
                    <span className="text-[11px] sm:text-xs font-mono tracking-widest text-muted/90 uppercase font-medium whitespace-nowrap">
                      {phrase}
                    </span>
                  </React.Fragment>
                ))}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Compact Social Channels (Above Copyright) */}
      <div className="flex items-center justify-center gap-5 text-muted/60 pt-7 sm:pt-9 mb-3.5">
        {activeSocialLinks.map((social) => {
          const Icon = social.icon;
          return (
            <a
              key={social.id}
              href={social.url}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`${social.name} Profile`}
              className="p-1.5 rounded-lg hover:text-foreground hover:bg-white/[0.04] transition-colors"
            >
              <Icon className="w-4 h-4" />
            </a>
          );
        })}
      </div>

      {/* Dynamic CMS Copyright Text */}
      <div className="w-full flex justify-center px-2 sm:px-4 mb-2 sm:mb-3">
        <p className="text-[clamp(9.5px,2.65vw,12px)] font-sans text-muted/70 tracking-tight whitespace-nowrap text-center select-none">
          {copyrightText}
        </p>
      </div>

      {/* Giant Outlined RAWIN Typography Signature */}
      <div
        className="w-full overflow-hidden select-none flex justify-center items-start pointer-events-none mt-1 sm:mt-2 h-[calc(clamp(2.5rem,10.8vw,6.2rem)+env(safe-area-inset-bottom,0px))]"
        aria-hidden="true"
      >
        <span
          className="font-space font-black tracking-[0.03em] sm:tracking-[0.05em] text-[clamp(5.2rem,23vw,12rem)] leading-[0.76] text-center block whitespace-nowrap"
          aria-label="RAWIN"
        >
          <span className="rawin-outline-raw">RAW</span>
          <span className="rawin-outline-in">IN</span>
        </span>
      </div>
    </footer>
  );
}
