"use client";

import React, { useState, useEffect } from "react";

interface MobileHeroRoleProps {
  roles?: string[];
  phrases?: string[];
}

const DEFAULT_ROLES = [
  "Full Stack Developer",
  "Creative Technologies",
  "UI/UX Designer",
];

/**
 * MobileHeroRole
 *
 * Lightweight, zero-layout-shift typing controller for smartphone Hero:
 * - Single managed setTimeout loop (cleans up reliably on unmount)
 * - Conservative cadence to minimize React state updates & CPU work
 * - Fixed height container (prevents any vertical layout shift as phrases change)
 * - Zero scroll listeners, zero requestAnimationFrame, zero Framer Motion
 */
export default function MobileHeroRole({
  roles,
  phrases,
}: MobileHeroRoleProps) {
  const sourceList =
    phrases && phrases.length > 0
      ? phrases
      : roles && roles.length > 0
      ? roles
      : DEFAULT_ROLES;
  const activeRoles = sourceList;
  const [roleIndex, setRoleIndex] = useState(0);
  const [currentText, setCurrentText] = useState(activeRoles[0]);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const currentRole = activeRoles[roleIndex] || activeRoles[0];
    let timer: ReturnType<typeof setTimeout>;

    // Conservative typing cadence to protect iOS compositor
    const TYPING_DELAY = 65;
    const DELETING_DELAY = 35;
    const PAUSE_TYPED = 2000;
    const PAUSE_CLEARED = 350;

    if (!isDeleting) {
      if (currentText.length < currentRole.length) {
        timer = setTimeout(() => {
          setCurrentText(currentRole.slice(0, currentText.length + 1));
        }, TYPING_DELAY);
      } else {
        timer = setTimeout(() => {
          setIsDeleting(true);
        }, PAUSE_TYPED);
      }
    } else {
      if (currentText.length > 0) {
        timer = setTimeout(() => {
          setCurrentText(currentRole.slice(0, currentText.length - 1));
        }, DELETING_DELAY);
      } else {
        timer = setTimeout(() => {
          setIsDeleting(false);
          setRoleIndex((prev) => (prev + 1) % activeRoles.length);
        }, PAUSE_CLEARED);
      }
    }

    return () => clearTimeout(timer);
  }, [currentText, isDeleting, roleIndex, activeRoles]);

  return (
    <div
      className="h-7 sm:h-8 flex items-center justify-center select-none"
      aria-live="polite"
      aria-label={`Role: ${activeRoles[roleIndex]}`}
    >
      <span className="text-sm sm:text-lg font-medium text-muted/90 font-space tracking-tight">
        {currentText}
      </span>
      <span
        className="inline-block w-[1.5px] h-3.5 sm:h-4 ml-1 bg-pacific-cyan rounded-full"
        aria-hidden="true"
      />
    </div>
  );
}
