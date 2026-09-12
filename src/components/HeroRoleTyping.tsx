"use client";

import { useState, useEffect } from "react";

const ROLES = [
  "UI/UX Designer",
  "Full Stack Developer",
  "Creative Technologist",
];

const TYPING_SPEED = 45;      // Snappy, fast character typing
const DELETING_SPEED = 25;    // Rapid, smooth deletion
const PAUSE_DURATION = 1400;  // Brief readable pause when complete
const DELETE_DELAY = 150;     // Brief pause before next role begins

export default function HeroRoleTyping() {
  const [roleIndex, setRoleIndex] = useState(0);
  const [currentText, setCurrentText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mediaQuery.matches);
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, []);

  useEffect(() => {
    if (reducedMotion) {
      setCurrentText(ROLES[0]);
      return;
    }

    const currentFullRole = ROLES[roleIndex];
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
        setIsDeleting(false);
        setRoleIndex((prev) => (prev + 1) % ROLES.length);
        timer = setTimeout(() => {}, DELETE_DELAY);
      }
    }

    return () => clearTimeout(timer);
  }, [currentText, isDeleting, roleIndex, reducedMotion]);

  return (
    <div
      className="inline-flex items-center justify-center min-h-[2.5rem] sm:min-h-[3rem]"
      aria-live="polite"
      aria-label={`Role: ${ROLES[roleIndex]}`}
    >
      <span className="text-lg sm:text-2xl md:text-3xl font-medium text-muted/90 font-space tracking-tight">
        {reducedMotion ? ROLES[0] : currentText}
      </span>
      {!reducedMotion && (
        <span
          className="inline-block w-[2px] sm:w-[2.5px] h-5 sm:h-7 ml-1 bg-pacific-cyan animate-pulse rounded-full"
          aria-hidden="true"
        />
      )}
    </div>
  );
}
