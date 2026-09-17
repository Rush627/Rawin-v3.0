import React from "react";
import {
  Wrench,
  Layers,
  Laptop,
  Flame,
  Radio,
  Compass,
} from "lucide-react";
import type { DailyStackItem, DevStackItem, BuildStepItem, ExploringItem } from "@/lib/site-content";

interface MobileUsesViewProps {
  eyebrow: string;
  updateLabel: string;
  pageTitle: string;
  pageDescription: string;
  dailyStack: DailyStackItem[];
  devGroups: { label: string; items: DevStackItem[] }[];
  buildSteps: BuildStepItem[];
  mySetup: {
    mainMachine: { label: string; value: string; description: string };
    fuel: { label: string; value: string; description: string };
    currentStatus: { label: string; value: string; description: string };
  };
  exploringItems: ExploringItem[];
}

export default function MobileUsesView({
  eyebrow,
  updateLabel,
  pageTitle,
  pageDescription,
  dailyStack,
  devGroups,
  buildSteps,
  mySetup,
  exploringItems,
}: MobileUsesViewProps) {
  return (
    <div className="w-full max-w-3xl mx-auto pt-24 sm:pt-28 pb-16 px-4 sm:px-6 flex flex-col gap-12 sm:gap-16">
      
      {/* ─── Section 0: Page Header ─── */}
      <header className="flex flex-col gap-3.5">
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-mono font-medium text-pacific-cyan bg-pacific-cyan/[0.08] border border-pacific-cyan/20">
            <Wrench className="w-3 h-3" />
            <span>{eyebrow}</span>
          </div>
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10px] font-mono text-muted/70 bg-white/[0.03] border border-white/[0.08]">
            {updateLabel}
          </span>
        </div>

        <h1 className="text-[clamp(1.9rem,6vw,2.4rem)] font-bold tracking-tight text-foreground font-space leading-[1.15]">
          {pageTitle}
        </h1>

        <p className="text-[13.5px] sm:text-[14.5px] text-muted/85 leading-relaxed font-sans max-w-lg">
          {pageDescription}
        </p>
      </header>

      {/* ─── Section 1: Daily Stack (Compact Technical Inventory) ─── */}
      <section className="flex flex-col gap-4" aria-label="Daily Stack">
        <div className="flex items-center justify-between pb-2 border-b border-white/[0.08]">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono font-bold text-pacific-cyan bg-pacific-cyan/10 border border-pacific-cyan/20 px-1.5 py-0.5 rounded">
              01
            </span>
            <h2 className="text-base sm:text-lg font-bold font-space text-foreground uppercase tracking-wide">
              Daily Stack
            </h2>
          </div>
          <span className="text-[10px] font-mono text-muted/50 uppercase tracking-wider">
            {dailyStack.length} TOOLS
          </span>
        </div>

        {/* Technical Inventory List */}
        <div className="divide-y divide-white/[0.08] border-y border-white/[0.08] bg-ink-black/40 rounded-xl overflow-hidden px-4">
          {dailyStack.map((tool, idx) => {
            const numStr = idx < 9 ? `0${idx + 1}` : `${idx + 1}`;
            return (
              <div
                key={tool.id || tool.name}
                className="py-3.5 sm:py-4 flex flex-col gap-2 min-h-[95px] justify-center"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-[11px] font-mono font-bold text-pacific-cyan shrink-0">
                      {numStr}
                    </span>
                    <h3 className="text-[14.5px] sm:text-[15.5px] font-bold font-space text-foreground truncate">
                      {tool.name}
                    </h3>
                  </div>
                  <span className="text-[9.5px] font-mono text-muted/70 uppercase tracking-wider px-2 py-0.5 rounded bg-white/[0.03] border border-white/[0.06] shrink-0">
                    {tool.category}
                  </span>
                </div>
                <p className="text-[12.5px] sm:text-[13px] text-muted/80 leading-relaxed font-sans pl-5 sm:pl-6">
                  {tool.description}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* ─── Section 2: Development Stack (Architecture Map) ─── */}
      <section className="flex flex-col gap-5" aria-label="Development Stack">
        <div className="flex items-center justify-between pb-2 border-b border-white/[0.08]">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono font-bold text-pacific-cyan bg-pacific-cyan/10 border border-pacific-cyan/20 px-1.5 py-0.5 rounded">
              02
            </span>
            <h2 className="text-base sm:text-lg font-bold font-space text-foreground uppercase tracking-wide">
              Development Stack
            </h2>
          </div>
          <span className="text-[10px] font-mono text-muted/50 uppercase tracking-wider">
            ARCHITECTURE MAP
          </span>
        </div>

        <div className="flex flex-col gap-5">
          {devGroups.map((group) => (
            <div key={group.label} className="flex flex-col gap-2.5">
              <div className="flex items-center gap-2 pb-1.5 border-b border-white/[0.06]">
                <span className="w-1.5 h-1.5 rounded-full bg-pacific-cyan/80" />
                <h3 className="text-[11px] font-mono uppercase tracking-widest text-pacific-cyan/90 font-semibold">
                  {group.label}
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {group.items.map((tech) => (
                  <div
                    key={tech.name}
                    className="rounded-lg p-3 bg-ink-black/40 border border-white/[0.06] flex flex-col gap-1.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[13.5px] sm:text-[14px] font-bold font-space text-foreground truncate">
                        {tech.name}
                      </span>
                      {tech.category && (
                        <span className="text-[9px] font-mono text-muted/60 px-1.5 py-0.5 rounded bg-white/[0.03] border border-white/[0.05] shrink-0">
                          {tech.category}
                        </span>
                      )}
                    </div>
                    <p className="text-[11.5px] sm:text-[12px] text-muted/75 leading-relaxed font-sans">
                      {tech.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── Section 3: How I Build (Process Timeline) ─── */}
      <section className="flex flex-col gap-4" aria-label="How I Build">
        <div className="flex items-center justify-between pb-2 border-b border-white/[0.08]">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono font-bold text-pacific-cyan bg-pacific-cyan/10 border border-pacific-cyan/20 px-1.5 py-0.5 rounded">
              03
            </span>
            <h2 className="text-base sm:text-lg font-bold font-space text-foreground uppercase tracking-wide">
              How I Build
            </h2>
          </div>
        </div>

        <div className="relative flex flex-col gap-3 pl-5 border-l-2 border-pacific-cyan/25 ml-2 py-1">
          {buildSteps.map((step, idx) => (
            <div
              key={step.id || step.number || step.step || idx}
              className="relative rounded-xl p-3.5 sm:p-4 bg-ink-black/50 border border-white/[0.07] flex flex-col gap-1.5"
            >
              {/* Timeline dot */}
              <div className="absolute -left-[27px] top-4 w-2 h-2 rounded-full bg-ink-black border-2 border-pacific-cyan" />

              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-bold text-pacific-cyan px-1.5 py-0.5 rounded bg-pacific-cyan/10 border border-pacific-cyan/20">
                  {step.number || step.step || `0${idx + 1}`}
                </span>
                <h3 className="text-[14px] sm:text-[15px] font-bold font-space text-foreground">
                  {step.title}
                </h3>
              </div>
              <p className="text-[12px] sm:text-[12.5px] text-muted/80 leading-relaxed font-sans">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── Section 4: My Setup (Workbench Status Modules) ─── */}
      <section className="flex flex-col gap-4" aria-label="My Setup">
        <div className="flex items-center justify-between pb-2 border-b border-white/[0.08]">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono font-bold text-pacific-cyan bg-pacific-cyan/10 border border-pacific-cyan/20 px-1.5 py-0.5 rounded">
              04
            </span>
            <h2 className="text-base sm:text-lg font-bold font-space text-foreground uppercase tracking-wide">
              My Setup
            </h2>
          </div>
          <span className="text-[10px] font-mono text-muted/50 uppercase tracking-wider">
            STATUS
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Module 1: Main Machine */}
          <div className="rounded-xl p-4 bg-ink-black/50 border border-white/[0.07] flex flex-col justify-between gap-2.5 min-h-[110px]">
            <div className="flex items-center gap-1.5 text-pacific-cyan text-[11px] font-mono uppercase tracking-wider">
              <Laptop className="w-3.5 h-3.5" />
              <span>{mySetup.mainMachine.label}</span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-[17px] sm:text-[18px] font-bold font-space text-foreground">
                {mySetup.mainMachine.value}
              </span>
              {mySetup.mainMachine.description && (
                <p className="text-[11.5px] sm:text-[12px] text-muted/70 leading-relaxed font-sans">
                  {mySetup.mainMachine.description}
                </p>
              )}
            </div>
          </div>

          {/* Module 2: Fuel */}
          <div className="rounded-xl p-4 bg-ink-black/50 border border-white/[0.07] border-l-2 border-l-apricot-cream flex flex-col justify-between gap-2.5 min-h-[110px]">
            <div className="flex items-center gap-1.5 text-apricot-cream text-[11px] font-mono uppercase tracking-wider">
              <Flame className="w-3.5 h-3.5" />
              <span>{mySetup.fuel.label}</span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-[14.5px] sm:text-[15.5px] font-bold font-space text-foreground leading-snug">
                {mySetup.fuel.value}
              </span>
              {mySetup.fuel.description && (
                <p className="text-[11.5px] sm:text-[12px] text-muted/70 leading-relaxed font-sans">
                  {mySetup.fuel.description}
                </p>
              )}
            </div>
          </div>

          {/* Module 3: Current Status */}
          <div className="rounded-xl p-4 bg-ink-black/50 border border-white/[0.07] flex flex-col justify-between gap-2.5 min-h-[110px]">
            <div className="flex items-center gap-1.5 text-emerald-400 text-[11px] font-mono uppercase tracking-wider">
              <Radio className="w-3.5 h-3.5" />
              <span>{mySetup.currentStatus.label}</span>
            </div>
            <div className="flex flex-col gap-0.5">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[16px] sm:text-[17px] font-bold font-space text-emerald-300">
                  {mySetup.currentStatus.value}
                </span>
              </div>
              {mySetup.currentStatus.description && (
                <p className="text-[11.5px] sm:text-[12px] text-muted/70 leading-relaxed font-sans">
                  {mySetup.currentStatus.description}
                </p>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ─── Section 5: Currently Exploring (Research Board) ─── */}
      <section className="flex flex-col gap-4" aria-label="Currently Exploring">
        <div className="flex items-center justify-between pb-2 border-b border-white/[0.08]">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono font-bold text-pacific-cyan bg-pacific-cyan/10 border border-pacific-cyan/20 px-1.5 py-0.5 rounded">
              05
            </span>
            <h2 className="text-base sm:text-lg font-bold font-space text-foreground uppercase tracking-wide">
              Currently Exploring
            </h2>
          </div>
          <span className="text-[10px] font-mono text-muted/50 uppercase tracking-wider">
            {exploringItems.length} TOPICS
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {exploringItems.map((topic, idx) => {
            const numStr = idx < 9 ? `0${idx + 1}` : `${idx + 1}`;
            return (
              <div
                key={topic.name}
                className="rounded-xl p-3.5 bg-ink-black/45 border border-white/[0.07] flex flex-col justify-between gap-2"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-[10.5px] font-mono font-bold text-pacific-cyan shrink-0">
                      {numStr}
                    </span>
                    <h3 className="text-[13.5px] sm:text-[14px] font-bold font-space text-foreground truncate">
                      {topic.name}
                    </h3>
                  </div>
                  {topic.category && (
                    <span className="text-[9.5px] font-mono text-apricot-cream/80 bg-apricot-cream/[0.06] border border-apricot-cream/20 px-1.5 py-0.5 rounded shrink-0 uppercase">
                      {topic.category}
                    </span>
                  )}
                </div>
                <p className="text-[11.5px] sm:text-[12px] text-muted/75 leading-relaxed font-sans pl-4">
                  {topic.description}
                </p>
              </div>
            );
          })}
        </div>
      </section>

    </div>
  );
}
