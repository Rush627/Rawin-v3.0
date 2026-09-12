import Image from "next/image";
import Link from "next/link";
import { ExternalLink, Check, Sparkles, History, ArrowUpRight } from "lucide-react";
import { EVOLUTION_MILESTONES, type EvolutionMilestone } from "@/data/evolution";

export default function RawinEvolution() {
  return (
    <section className="flex flex-col gap-10 w-full" data-particle-protected>
      {/* Section Header */}
      <div className="flex flex-col gap-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono font-medium glass-pill text-pacific-cyan w-fit border border-pacific-cyan/20">
          <History className="w-3.5 h-3.5" />
          <span>A RECORD OF THE BUILD</span>
        </div>
        <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-foreground font-space">
          From a first HTML page to a full engineering platform.
        </h2>
        <p className="text-sm sm:text-base text-muted max-w-2xl leading-relaxed">
          RAWIN has evolved alongside the way I build for the web.
        </p>
      </div>

      {/* Evolution Timeline List with Integrated Circuit Infrastructure */}
      <div className="relative flex flex-col gap-12 sm:gap-16">
        {/* Continuous Connecting Circuit Spine - Mobile (Straight clean vertical circuit wire) */}
        <div 
          className="absolute left-4 top-4 bottom-8 w-[2px] bg-gradient-to-b from-pacific-cyan/70 via-pacific-cyan/40 to-emerald-400/80 block sm:hidden pointer-events-none -z-10 shadow-[0_0_8px_rgba(24,155,173,0.35)]"
          aria-hidden="true"
        />

        {/* Continuous Connecting Circuit Spine - Desktop / Tablet (Main engineering bus) */}
        <div 
          className="absolute left-6 top-6 bottom-8 w-[2px] bg-gradient-to-b from-pacific-cyan/60 via-pacific-cyan/35 to-emerald-400/80 hidden sm:block pointer-events-none -z-10 shadow-[0_0_10px_rgba(24,155,173,0.3)]"
          aria-hidden="true"
        />

        {EVOLUTION_MILESTONES.map((milestone, idx) => {
          const isCurrent = milestone.status === "current";
          const isFirst = idx === 0;
          const isLast = idx === EVOLUTION_MILESTONES.length - 1;

          return (
            <div
              key={milestone.year}
              className="relative flex flex-col sm:flex-row items-start gap-6 sm:gap-10 group"
              data-particle-protected
            >
              {/* Desktop Technical Circuit Trace entering card from Node */}
              <div 
                aria-hidden="true"
                className="absolute left-6 top-6 w-10 sm:w-16 h-[2px] bg-gradient-to-r from-pacific-cyan/70 to-pacific-cyan/30 hidden sm:block pointer-events-none -z-10 shadow-[0_0_6px_rgba(24,155,173,0.3)]"
              >
                {/* Circuit solder pad junction */}
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-pacific-cyan border border-pacific-cyan/80 shadow-[0_0_6px_rgba(24,155,173,0.6)]" />
              </div>

              {/* Timeline Node Column with Solder Pad Junctions */}
              <div className="relative flex sm:flex-col items-center gap-3 sm:gap-2 shrink-0">
                {/* Mobile top terminal node */}
                <div 
                  aria-hidden="true"
                  className="absolute -top-2 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-pacific-cyan/80 border border-pacific-cyan block sm:hidden pointer-events-none"
                />

                {/* Node Dot / Processor Core */}
                <div
                  className={`relative w-8 h-8 sm:w-12 sm:h-12 rounded-full border flex items-center justify-center transition-all duration-300 z-10 ${
                    isCurrent
                      ? "bg-ink-black border-emerald-400 text-emerald-400 shadow-[0_0_20px_rgba(34,197,94,0.35)] ring-2 ring-emerald-500/20"
                      : "bg-ink-black border-pacific-cyan/40 text-pacific-cyan group-hover:border-pacific-cyan group-hover:shadow-[0_0_15px_rgba(24,155,173,0.3)] ring-1 ring-white/5"
                  }`}
                >
                  {isCurrent ? (
                    <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400 animate-pulse motion-reduce:animate-none" />
                  ) : (
                    <span className="font-mono text-xs sm:text-sm font-bold">
                      0{idx + 1}
                    </span>
                  )}

                  {/* Micro circuit pad accent */}
                  <div 
                    aria-hidden="true"
                    className={`absolute -right-1 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full hidden sm:block ${
                      isCurrent ? "bg-emerald-400" : "bg-pacific-cyan/80"
                    }`}
                  />
                </div>

                {/* Mobile bottom terminal node */}
                <div 
                  aria-hidden="true"
                  className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-pacific-cyan/80 border border-pacific-cyan block sm:hidden pointer-events-none"
                />

                {/* Year Label */}
                <span
                  className={`font-space font-bold text-xl sm:text-2xl tracking-tight ${
                    isCurrent ? "text-emerald-400" : "text-foreground group-hover:text-pacific-cyan transition-colors"
                  }`}
                >
                  {milestone.year}
                </span>
              </div>

              {/* Milestone Card Content with Circuit Paths Traveling Behind */}
              <div className="relative w-full">
                {/* SVG Circuit Routing Wire Traveling Behind Card */}
                <svg
                  aria-hidden="true"
                  className="absolute -left-6 sm:-left-10 top-0 w-[calc(100%+24px)] sm:w-[calc(100%+40px)] h-full pointer-events-none -z-10 overflow-visible opacity-35 sm:opacity-45"
                >
                  {/* Subtle technical circuit trace with PCB orthogonal bend */}
                  <path
                    d={`M 10 24 L 40 24 Q 48 24 48 32 L 48 ${idx === 0 ? "70" : idx === 1 ? "80" : "60"} Q 48 ${idx === 0 ? "78" : idx === 1 ? "88" : "68"} 56 ${idx === 0 ? "78" : idx === 1 ? "88" : "68"} L 120 ${idx === 0 ? "78" : idx === 1 ? "88" : "68"}`}
                    fill="none"
                    stroke={isCurrent ? "rgba(52,211,153,0.5)" : "rgba(24,155,173,0.4)"}
                    strokeWidth="1.5"
                    strokeDasharray="4 2"
                  />
                  <circle cx="10" cy="24" r="2.5" fill="#101019" stroke={isCurrent ? "#34d399" : "#189bad"} strokeWidth="1.5" />
                  <circle cx="120" cy={idx === 0 ? 78 : idx === 1 ? 88 : 68} r="2" fill={isCurrent ? "#34d399" : "#189bad"} />
                  {!isLast && (
                    <path
                      d="M 48 80 L 48 140 Q 48 148 40 148 L 10 148"
                      fill="none"
                      stroke="rgba(24,155,173,0.3)"
                      strokeWidth="1.5"
                      strokeDasharray="3 3"
                    />
                  )}
                </svg>

                <div
                  className={`relative w-full rounded-2xl border transition-all duration-300 overflow-hidden flex flex-col lg:flex-row z-10 ${
                    isCurrent
                      ? "bg-surface-card/90 border-emerald-500/30 shadow-[0_0_30px_rgba(34,197,94,0.1)]"
                      : "glass-card border-white/[0.08] hover:border-pacific-cyan/30"
                  }`}
                >
                  {/* Visual Website Preview Column */}
                  <div className="w-full lg:w-1/2 p-4 sm:p-5 flex flex-col justify-center bg-black/40 border-b lg:border-b-0 lg:border-r border-white/[0.06]">
                    {/* Browser Window Mockup Frame */}
                    <div className="rounded-xl overflow-hidden border border-white/[0.1] bg-ink-black/80 shadow-2xl flex flex-col">
                      {/* Browser Chrome Header */}
                      <div className="px-3 py-2 bg-surface/90 border-b border-white/[0.08] flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
                          <span className="w-2.5 h-2.5 rounded-full bg-amber-500/60" />
                          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/60" />
                        </div>
                        <span className="text-[11px] font-mono text-muted/70 truncate max-w-[200px]">
                          {milestone.domain}
                        </span>
                        <div className="w-8" />
                      </div>

                      {/* Screenshot Image Container */}
                      <div className="relative aspect-[16/10] w-full bg-ink-black overflow-hidden group/img">
                        <Image
                          src={milestone.preview}
                          alt={`${milestone.title} - ${milestone.year} preview`}
                          fill
                          unoptimized
                          sizes="(max-width: 768px) 100vw, 500px"
                          className="object-cover object-top transition-transform duration-500 group-hover/img:scale-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-ink-black/60 via-transparent to-transparent opacity-60" />
                      </div>
                    </div>
                  </div>

                  {/* Milestone Information Column */}
                  <div className="w-full lg:w-1/2 p-6 sm:p-8 flex flex-col justify-between gap-6">
                    <div className="flex flex-col gap-3">
                      {/* Top Status & Progression Badges */}
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <span className="text-xs font-mono font-semibold tracking-wider text-pacific-cyan uppercase">
                          {milestone.label}
                        </span>
                        <span className="text-xs font-mono text-apricot-cream/90 italic">
                          &quot;{milestone.progression}&quot;
                        </span>
                      </div>

                      {/* Milestone Title */}
                      <h3 className="text-xl sm:text-2xl font-bold text-foreground font-space">
                        {milestone.title}
                      </h3>

                      {/* Milestone Description */}
                      <p className="text-sm text-muted leading-relaxed">
                        {milestone.description}
                      </p>

                      {/* Technology Stack Pills */}
                      <div className="flex flex-wrap gap-2 pt-2">
                        {milestone.technologies.map((tech) => (
                          <span
                            key={tech}
                            className="px-2.5 py-1 rounded-md text-xs font-mono bg-white/[0.04] text-foreground/90 border border-white/[0.08]"
                          >
                            {tech}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Milestone Action / CTA */}
                    <div className="pt-4 border-t border-white/[0.06] flex items-center justify-between">
                      {milestone.url ? (
                        <a
                          href={milestone.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-mono font-semibold bg-pacific-cyan/10 text-pacific-cyan border border-pacific-cyan/30 hover:bg-pacific-cyan hover:text-ink-black transition-all group/btn"
                          aria-label={`View the ${milestone.year} ${milestone.title} live website in a new tab`}
                        >
                          <span>{milestone.ctaText}</span>
                          <ArrowUpRight className="w-3.5 h-3.5 transition-transform group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5" />
                        </a>
                      ) : (
                        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-mono font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                          <span className="relative flex h-2 w-2">
                            <span className="animate-ping motion-reduce:animate-none absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                          </span>
                          <span>{milestone.ctaText}</span>
                        </div>
                      )}

                      <span className="text-[11px] font-mono text-muted/60">
                        {milestone.year} Milestone
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
