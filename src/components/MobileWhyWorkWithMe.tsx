"use client";

import React, { useEffect, useRef, useState } from "react";
import type { ValueProposition } from "@/data/experience";

interface MobileWhyWorkWithMeProps {
  propositions: ValueProposition[];
}

function PrincipleNode({
  prop,
  isLast,
}: {
  prop: ValueProposition;
  isLast: boolean;
}) {
  const nodeRef = useRef<HTMLDivElement>(null);
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    const el = nodeRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          setIsActive(entry.isIntersecting);
        });
      },
      {
        threshold: 0.35,
        rootMargin: "-10% 0px -25% 0px",
      }
    );

    observer.observe(el);

    return () => observer.disconnect();
  }, []);

  return (
    <div ref={nodeRef} className="relative flex items-start gap-4 sm:gap-6 group">
      {/* Left Column: Number Node + Vertical Circuit Line */}
      <div className="flex flex-col items-center shrink-0">
        {/* Node Badge */}
        <div
          className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center font-mono text-xs font-bold border transition-all duration-300 ${
            isActive
              ? "bg-pacific-cyan text-ink-black border-pacific-cyan shadow-[0_0_16px_rgba(24,155,173,0.5)] scale-105"
              : "bg-surface border-white/10 text-muted/80 group-hover:border-pacific-cyan/40"
          }`}
        >
          {prop.metric}
        </div>

        {/* Vertical connection line */}
        {!isLast && (
          <div
            className={`w-[2px] min-h-[72px] sm:min-h-[80px] my-2 transition-colors duration-300 ${
              isActive
                ? "bg-gradient-to-b from-pacific-cyan/80 to-white/10"
                : "bg-white/[0.08]"
            }`}
          />
        )}
      </div>

      {/* Right Content Column */}
      <div
        className={`flex-1 pb-6 transition-all duration-300 ${
          isActive ? "opacity-100" : "opacity-75"
        }`}
      >
        <h4 className="text-base sm:text-lg font-bold text-foreground font-space leading-snug">
          {prop.title}
        </h4>
        <p className="text-xs font-mono text-apricot-cream/90 mt-0.5">
          {prop.tagline}
        </p>
        <p className="text-xs sm:text-sm text-muted mt-2 leading-relaxed max-w-xl">
          {prop.description}
        </p>
      </div>
    </div>
  );
}

export default function MobileWhyWorkWithMe({
  propositions,
}: MobileWhyWorkWithMeProps) {
  if (!propositions || propositions.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-col w-full py-2">
      {propositions.map((prop, idx) => (
        <PrincipleNode
          key={prop.metric || prop.title}
          prop={prop}
          isLast={idx === propositions.length - 1}
        />
      ))}
    </div>
  );
}
