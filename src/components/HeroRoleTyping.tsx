"use client";

import { useState, useEffect } from "react";

const ROLES = [
  "UI/UX Designer",
  "Full Stack Developer",
  "Creative Technologist",
];

const TYPING_SPEED = 50;      // Snappy character typing
const DELETING_SPEED = 28;    // Smooth deletion
const PAUSE_DURATION = 1500;  // Pause when role is fully typed
const DELETE_DELAY = 200;     // Pause before typing next role

export default function HeroRoleTyping() {
  const [roleIndex, setRoleIndex] = useState(0);
  const [currentText, setCurrentText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
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
        timer = setTimeout(() => {
          setIsDeleting(false);
          setRoleIndex((prev) => (prev + 1) % ROLES.length);
        }, DELETE_DELAY);
      }
    }

    return () => clearTimeout(timer);
  }, [currentText, isDeleting, roleIndex]);

  return (
    <div
      className="inline-flex items-center justify-center min-h-[2.5rem] sm:min-h-[3rem]"
      aria-live="polite"
      aria-label={`Role: ${ROLES[roleIndex]}`}
    >
      <span className="text-lg sm:text-2xl md:text-3xl font-medium text-muted/90 font-space tracking-tight">
        {currentText || "\u00A0"}
      </span>
      <span
        className="inline-block w-[2px] sm:w-[2.5px] h-5 sm:h-7 ml-1 bg-pacific-cyan animate-pulse rounded-full"
        aria-hidden="true"
      />
    </div>
  );
}
