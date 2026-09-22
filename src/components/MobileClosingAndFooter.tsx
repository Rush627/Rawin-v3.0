"use client";

import React from "react";
import { usePathname } from "next/navigation";
import type { GlobalContent, ContactContent } from "@/lib/site-content";
import MobileClosingSection from "@/components/MobileClosingSection";
import MobileFooter from "@/components/MobileFooter";

export interface MobileClosingAndFooterProps {
  content?: Partial<GlobalContent>;
  contact?: Partial<ContactContent>;
  logo?: {
    url?: string;
    alt?: string;
  };
  footerCopyright?: string;
  currentYear?: number;
}

/**
 * @deprecated Use MobileClosingSection and MobileFooter directly.
 * Maintained as a clean composite wrapper to ensure zero regressions across legacy consumers.
 */
export default function MobileClosingAndFooter({
  content,
  contact,
  logo,
  footerCopyright,
  currentYear,
}: MobileClosingAndFooterProps) {
  const pathname = usePathname();
  const isExcludedStory = pathname === "/blog" || pathname === "/contact";
  const emailAddress =
    contact?.email || content?.contactEmail || "rushansiddiqui5262@gmail.com";

  return (
    <div className="w-full flex flex-col">
      {!isExcludedStory && <MobileClosingSection emailAddress={emailAddress} />}
      <MobileFooter
        content={content}
        contact={contact}
        logo={logo}
        footerCopyright={footerCopyright}
        currentYear={currentYear}
        hasTopBorder={isExcludedStory}
      />
    </div>
  );
}
