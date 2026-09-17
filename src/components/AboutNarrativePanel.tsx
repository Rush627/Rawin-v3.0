import React from "react";

interface AboutNarrativePanelProps {
  eyebrow?: string;
  leadText?: string;
  narrativeText?: string;
  progressionItem1?: string;
  progressionItem2?: string;
  progressionItem3?: string;
  metadataItem1?: string;
  metadataItem2?: string;
  metadataItem3?: string;
  metadataItem4?: string;
}

export default function AboutNarrativePanel({
  eyebrow,
  leadText,
  narrativeText,
  progressionItem1,
  progressionItem2,
  progressionItem3,
  metadataItem1,
  metadataItem2,
  metadataItem3,
  metadataItem4,
}: AboutNarrativePanelProps) {
  const headerEyebrow = eyebrow || "HOW I THINK";
  const primaryStatement =
    leadText ||
    "I build for the web, starting with interfaces and gradually moving deeper into the systems behind them.";
  const secondaryNarrative =
    narrativeText ||
    "What began as an early curiosity with layouts and styling has grown into a disciplined focus on the entire web stack: from accessible, fluid interface design and frontend performance to type-safe APIs and modern application architecture.";

  const step1 = progressionItem1 || "INTERFACE";
  const step2 = progressionItem2 || "PERFORMANCE";
  const step3 = progressionItem3 || "SYSTEMS";

  const metadataList = [
    metadataItem1 || "UI",
    metadataItem2 || "FRONTEND",
    metadataItem3 || "BACKEND",
    metadataItem4 || "ARCHITECTURE",
  ].filter(Boolean);

  return (
    <article
      className="relative w-full rounded-2xl border border-white/[0.08] bg-gradient-to-b from-[#171728]/95 via-[#131322]/90 to-[#101019]/95 p-6 sm:p-8 md:p-10 shadow-[0_4px_30px_rgba(0,0,0,0.3)] overflow-hidden"
      data-particle-protected
    >
      {/* Soft background ambient radial highlight */}
      <div
        className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_top_left,rgba(24,155,173,0.08)_0%,transparent_60%)]"
        aria-hidden="true"
      />

      {/* Subtle corner registration accents */}
      <div
        className="absolute top-3.5 right-3.5 w-2.5 h-2.5 border-t border-r border-pacific-cyan/30 pointer-events-none"
        aria-hidden="true"
      />
      <div
        className="absolute bottom-3.5 left-3.5 w-2.5 h-2.5 border-b border-l border-pacific-cyan/30 pointer-events-none"
        aria-hidden="true"
      />

      <div className="relative z-10 flex flex-col gap-6 sm:gap-7">
        {/* 1. Small Technical Header (No 01, No Engineering Mindset) */}
        <div className="flex items-center gap-2.5 pb-4 sm:pb-5 border-b border-white/[0.06]">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-pacific-cyan shadow-[0_0_8px_rgba(24,155,173,0.7)]" />
          <span className="font-mono text-[11px] sm:text-xs font-semibold tracking-widest text-pacific-cyan uppercase">
            {headerEyebrow}
          </span>
        </div>

        {/* 2. Primary Statement (Visual Centerpiece) */}
        <div className="max-w-3xl">
          <p className="text-lg sm:text-xl md:text-2xl lg:text-[1.625rem] font-medium font-space text-foreground tracking-tight leading-[1.32]">
            {primaryStatement}
          </p>
        </div>

        {/* 3. Engineering Progression (Interface -> Performance -> Systems) */}
        <div className="w-full">
          {/* Desktop & Laptop Horizontal Progression (>= 768px) */}
          <div className="hidden md:flex items-center justify-between gap-4 py-2 px-4 rounded-xl bg-white/[0.02] border border-white/[0.04] max-w-2xl">
            {/* Step 1 */}
            <div className="flex items-center gap-2 shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-pacific-cyan" />
              <span className="font-mono text-xs font-medium tracking-wider text-foreground uppercase">
                {step1}
              </span>
            </div>

            {/* Connecting Track */}
            <div className="flex-1 flex items-center gap-2 px-1">
              <div className="h-px flex-1 bg-gradient-to-r from-pacific-cyan/40 via-white/10 to-white/10" />
              <span className="font-mono text-[11px] text-pacific-cyan/70 select-none">
                →
              </span>
            </div>

            {/* Step 2 */}
            <div className="flex items-center gap-2 shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-pacific-cyan/80" />
              <span className="font-mono text-xs font-medium tracking-wider text-foreground/90 uppercase">
                {step2}
              </span>
            </div>

            {/* Connecting Track */}
            <div className="flex-1 flex items-center gap-2 px-1">
              <div className="h-px flex-1 bg-gradient-to-r from-white/10 via-pacific-cyan/30 to-pacific-cyan/50" />
              <span className="font-mono text-[11px] text-pacific-cyan/70 select-none">
                →
              </span>
            </div>

            {/* Step 3 */}
            <div className="flex items-center gap-2 shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-pacific-cyan" />
              <span className="font-mono text-xs font-medium tracking-wider text-foreground uppercase">
                {step3}
              </span>
            </div>
          </div>

          {/* Smartphone & Tablet Vertical Progression (< 768px) */}
          <div className="flex md:hidden flex-col gap-1.5 py-3 px-4 rounded-xl bg-white/[0.02] border border-white/[0.04] w-fit">
            {/* Step 1 */}
            <div className="flex items-center gap-2.5">
              <span className="w-1.5 h-1.5 rounded-full bg-pacific-cyan shrink-0" />
              <span className="font-mono text-xs font-medium tracking-wider text-foreground uppercase">
                {step1}
              </span>
            </div>

            {/* Vertical Connector */}
            <div className="flex items-center pl-[2px] py-0.5">
              <div className="w-px h-3 bg-gradient-to-b from-pacific-cyan/50 to-white/20 ml-[2px]" />
              <span className="font-mono text-[10px] text-pacific-cyan/60 ml-2.5 select-none">
                ↓
              </span>
            </div>

            {/* Step 2 */}
            <div className="flex items-center gap-2.5">
              <span className="w-1.5 h-1.5 rounded-full bg-pacific-cyan/80 shrink-0" />
              <span className="font-mono text-xs font-medium tracking-wider text-foreground/90 uppercase">
                {step2}
              </span>
            </div>

            {/* Vertical Connector */}
            <div className="flex items-center pl-[2px] py-0.5">
              <div className="w-px h-3 bg-gradient-to-b from-white/20 to-pacific-cyan/50 ml-[2px]" />
              <span className="font-mono text-[10px] text-pacific-cyan/60 ml-2.5 select-none">
                ↓
              </span>
            </div>

            {/* Step 3 */}
            <div className="flex items-center gap-2.5">
              <span className="w-1.5 h-1.5 rounded-full bg-pacific-cyan shrink-0" />
              <span className="font-mono text-xs font-medium tracking-wider text-foreground uppercase">
                {step3}
              </span>
            </div>
          </div>
        </div>

        {/* 4. Supporting Narrative */}
        <div className="max-w-2xl">
          <p className="text-sm sm:text-base text-muted/85 font-sans leading-relaxed">
            {secondaryNarrative}
          </p>
        </div>

        {/* 5. Small Technical Metadata (No Full Stack // Lifecycle) */}
        <div className="pt-4 sm:pt-5 border-t border-white/[0.05] flex items-center flex-wrap gap-2 sm:gap-2.5 text-[11px] sm:text-xs font-mono text-muted/50 tracking-widest uppercase">
          {metadataList.map((item, idx) => (
            <React.Fragment key={idx}>
              {idx > 0 && <span className="text-muted/30 select-none">·</span>}
              <span>{item}</span>
            </React.Fragment>
          ))}
        </div>
      </div>
    </article>
  );
}
