"use client";

import { useState, useEffect, useMemo } from "react";

const DEFAULT_ROLES = [
  "Full Stack Developer",
  "Creative Technologies",
  "UI/UX Designer",
];

const TYPING_SPEED = 50;      // Snappy character typing
const DELETING_SPEED = 28;    // Smooth deletion
const PAUSE_DURATION = 1500;  // Pause when role is fully typed
const DELETE_DELAY = 200;     // Pause before typing next role

interface HeroRoleTypingProps {
  phrases?: string[];
}

export default function HeroRoleTyping({ phrases }: HeroRoleTypingProps = {}) {
  const activeRoles = useMemo(() => {
    return phrases && phrases.length > 0 ? phrases : DEFAULT_ROLES;
  }, [phrases]);

  const [roleIndex, setRoleIndex] = useState(0);
  const [currentText, setCurrentText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (roleIndex >= activeRoles.length) {
      setRoleIndex(0);
      setCurrentText("");
      setIsDeleting(false);
    }
  }, [activeRoles, roleIndex]);

  useEffect(() => {
    const currentFullRole = activeRoles[roleIndex] || activeRoles[0];
    let timer: ReturnType<typeof setTimeout>;

    if (!isDeleting) {
      if (currentText.length < currentFullRole.length) {
        timer = setTimeout(() => {
          setCurrentText(currentFullRole.slice(0, currentText.length + 1));
        }, TYPING_SPEED);
      } else {
        timer = setTimeout(() => {
          setIsDeleting(true);
        }, PAUSE_DURATION);
      }
    } else {
      if (currentText.length > 0) {
        timer = setTimeout(() => {
          setCurrentText(currentFullRole.slice(0, currentText.length - 1));
        }, DELETING_SPEED);
      } else {
        timer = setTimeout(() => {
          setIsDeleting(false);
          setRoleIndex((prev) => (prev + 1) % activeRoles.length);
        }, DELETE_DELAY);
      }
    }

    return () => clearTimeout(timer);
  }, [currentText, isDeleting, roleIndex, activeRoles]);

  return (
    <div
      className="inline-flex items-center justify-center min-h-[2.5rem] sm:min-h-[3rem] select-none"
      aria-live="polite"
      aria-label={`Role: ${activeRoles[roleIndex]}`}
    >
      <span
        suppressHydrationWarning
        className="text-lg sm:text-2xl md:text-3xl font-medium text-muted/90 font-space tracking-tight leading-tight"
      >
        {currentText || "\u00A0"}
      </span>
      <span
        className="inline-block w-[2px] sm:w-[2.5px] h-5 sm:h-7 ml-1 bg-pacific-cyan animate-pulse rounded-full"
        aria-hidden="true"
      />
    </div>
  );
}
