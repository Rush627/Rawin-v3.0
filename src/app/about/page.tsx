import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import {
  MapPin,
  Sparkles,
  ArrowRight,
  Layers,
  Eye,
  Zap,
  Palette,
  Briefcase,
  Target,
  Send,
  Download,
  Terminal,
  Cpu,
  Boxes,
  Compass,
} from "lucide-react";
import RawinEvolution from "@/components/RawinEvolution";
import { TIMELINE } from "@/data/experience";
import { getSiteContent } from "@/lib/site-content";

export const metadata: Metadata = {
  title: "About | Rushan Siddiqui : Full Stack Developer",
  description:
    "Learn about Rushan Siddiqui's background, evolution from static web pages to modern engineering systems, and core development principles.",
};

export const revalidate = 0;

const HOW_I_BUILD_PRINCIPLES = [
  {
    number: "01",
    title: "ARCHITECTURE",
    icon: Layers,
    statement: "Build systems that stay understandable.",
  },
  {
    number: "02",
    title: "EXPERIENCE",
    icon: Eye,
    statement: "Make interfaces feel intentional.",
  },
  {
    number: "03",
    title: "PERFORMANCE",
    icon: Zap,
    statement: "Keep complexity from reaching the user.",
  },
  {
    number: "04",
    title: "CRAFT",
    icon: Palette,
    statement: "Details matter.",
  },
];

const CURRENT_FOCUS_AREAS = [
  {
    title: "WEB APPLICATIONS",
    icon: Terminal,
    description: "Full-stack apps with Next.js, TypeScript, and MongoDB. Focused on clean state and reliable API routes.",
  },
  {
    title: "INTERACTIVE INTERFACES",
    icon: Compass,
    description: "Responsive layouts, micro-interactions, and fluid transitions that make software enjoyable to use.",
  },
  {
    title: "AI INTEGRATION",
    icon: Cpu,
    description: "Streaming responses, edge function workflows, and practical assistant tools inside web apps.",
  },
  {
    title: "MODERN WEB ARCHITECTURE",
    icon: Boxes,
    description: "Modular component systems, Tailwind styling, and maintainable project structures.",
  },
];

export default async function AboutPage() {
  const siteContent = await getSiteContent();
  const aboutContent = siteContent.about;

  return (
    <div className="w-full max-w-4xl mx-auto pt-28 pb-20 px-4 sm:px-6 flex flex-col gap-20">
      {/* SECTION 1: IDENTITY / INTRODUCTION */}
      <section className="flex flex-col gap-8" data-particle-protected>
        {/* Eyebrow */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono font-medium glass-pill text-pacific-cyan w-fit border border-pacific-cyan/20">
          <Sparkles className="w-3.5 h-3.5" />
          <span>{aboutContent.eyebrow}</span>
        </div>

        {/* Profile Card Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
          <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden border border-pacific-cyan/40 p-1 bg-surface shrink-0 shadow-xl">
            <Image
              src={siteContent.assets?.profilePhoto?.url || "/images/profile.png"}
              alt={siteContent.assets?.profilePhoto?.alt || "Rushan Siddiqui"}
              width={112}
              height={112}
              priority
              unoptimized
              className="w-full h-full object-cover rounded-xl"
            />
          </div>
          <div>
            <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-foreground font-space">
              {aboutContent.title}
            </h1>
            <p className="text-base sm:text-lg text-muted/90 font-medium mt-1">
              {aboutContent.subtitle}
            </p>
            <div className="flex items-center gap-2 text-xs text-muted/70 font-mono mt-2">
              <MapPin className="w-3.5 h-3.5 text-pacific-cyan" />
              <span>{siteContent.contact?.location || siteContent.global.location}</span>
            </div>
          </div>
        </div>

        {/* Concise Narrative */}
        <div className="glass-panel rounded-2xl p-6 sm:p-8 border border-white/[0.06] flex flex-col gap-4 text-muted font-sans text-base sm:text-lg leading-relaxed">
          <p className="text-foreground font-medium">
            {aboutContent.leadText}
          </p>
          <p className="text-muted/90 text-sm sm:text-base">
            {aboutContent.narrativeText}
          </p>
        </div>
      </section>

      {/* SECTION 2: RAWIN EVOLUTION */}
      <RawinEvolution />

      {/* SECTION 3: HOW I BUILD */}
      <section className="flex flex-col gap-8 w-full" data-particle-protected>
        <div className="flex flex-col gap-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono font-medium glass-pill text-pacific-cyan w-fit border border-pacific-cyan/20">
            <Layers className="w-3.5 h-3.5" />
            <span>HOW I BUILD</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-foreground font-space">
            A few principles I keep close.
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
          {HOW_I_BUILD_PRINCIPLES.map((principle) => {
            const Icon = principle.icon;
            return (
              <div
                key={principle.number}
                className="glass-card rounded-2xl p-6 border border-white/[0.06] flex flex-col justify-between gap-4 group"
              >
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-pacific-cyan/10 border border-pacific-cyan/20 flex items-center justify-center text-pacific-cyan group-hover:border-pacific-cyan/50 transition-colors">
                    <Icon className="w-5 h-5 transition-transform group-hover:scale-110" />
                  </div>
                  <span className="font-mono text-xs font-bold text-muted/50">
                    {principle.number}
                  </span>
                </div>

                <div className="flex flex-col gap-1.5">
                  <h3 className="text-lg font-bold text-foreground font-space tracking-wide">
                    {principle.title}
                  </h3>
                  <p className="text-sm text-muted/90 leading-relaxed">
                    &quot;{principle.statement}&quot;
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* SECTION 4: ENGINEERING JOURNEY */}
      <section className="flex flex-col gap-8 w-full" data-particle-protected>
        <div className="flex flex-col gap-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono font-medium glass-pill text-pacific-cyan w-fit border border-pacific-cyan/20">
            <Briefcase className="w-3.5 h-3.5" />
            <span>ENGINEERING JOURNEY</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-foreground font-space">
            {aboutContent.journeyHeading}
          </h2>
          <p className="text-sm sm:text-base text-muted max-w-2xl leading-relaxed">
            {aboutContent.journeyDescription}
          </p>
        </div>

        <div className="relative flex flex-col gap-8 sm:gap-10 border-l border-white/[0.08] ml-2 sm:ml-4 pl-6 sm:pl-8">
          {TIMELINE.map((item) => (
            <div
              key={item.period}
              className="relative flex flex-col gap-3 group"
            >
              {/* Node indicator */}
              <div className="absolute -left-[31px] sm:-left-[39px] top-1.5 w-3.5 h-3.5 rounded-full bg-ink-black border-2 border-pacific-cyan/60 group-hover:border-pacific-cyan group-hover:shadow-[0_0_10px_rgba(24,155,173,0.5)] transition-all" />

              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-mono font-semibold px-2.5 py-0.5 rounded-full bg-pacific-cyan/10 text-pacific-cyan border border-pacific-cyan/20">
                  {item.period}
                </span>
                <span className="text-xs font-mono text-muted/70">
                  {item.companyOrContext}
                </span>
              </div>

              <h3 className="text-lg sm:text-xl font-bold text-foreground font-space">
                {item.role}
              </h3>

              <p className="text-sm text-muted leading-relaxed">
                {item.description}
              </p>

              <ul className="flex flex-col gap-1.5 pt-1">
                {item.highlights.map((highlight, hIdx) => (
                  <li
                    key={hIdx}
                    className="flex items-start gap-2 text-xs sm:text-sm text-muted/80"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-pacific-cyan/60 shrink-0 mt-2" />
                    <span>{highlight}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* SECTION 5: CURRENT FOCUS */}
      <section className="flex flex-col gap-8 w-full" data-particle-protected>
        <div className="flex flex-col gap-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono font-medium glass-pill text-pacific-cyan w-fit border border-pacific-cyan/20">
            <Target className="w-3.5 h-3.5" />
            <span>CURRENT FOCUS</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-foreground font-space">
            What I&apos;m building toward.
          </h2>
          <p className="text-sm sm:text-base text-muted max-w-2xl leading-relaxed">
            Exploring where thoughtful interface design and modern engineering can meet.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
          {CURRENT_FOCUS_AREAS.map((focus) => {
            const Icon = focus.icon;
            return (
              <div
                key={focus.title}
                className="glass-card rounded-2xl p-6 border border-white/[0.06] flex flex-col gap-3 group"
              >
                <div className="w-10 h-10 rounded-xl bg-surface border border-white/[0.08] flex items-center justify-center text-pacific-cyan group-hover:border-pacific-cyan/40 transition-colors">
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-foreground font-space tracking-wide">
                  {focus.title}
                </h3>
                <p className="text-xs sm:text-sm text-muted leading-relaxed">
                  {focus.description}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* SECTION 6: CTA */}
      <section
        className="glass-card rounded-2xl p-8 sm:p-10 border border-white/[0.08] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6"
        data-particle-protected
      >
        <div className="flex flex-col gap-2">
          <span className="text-xs font-mono font-semibold tracking-wider text-pacific-cyan uppercase">
            LET&apos;S BUILD TOGETHER
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground font-space">
            Have something worth building?
          </h2>
          <p className="text-sm text-muted">
            Open to full-time roles, freelance projects, and collaborations.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <Link
            href="/resume"
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-pacific-cyan text-ink-black font-semibold text-sm hover:bg-pacific-cyan/90 transition-all shadow-[0_0_20px_rgba(24,155,173,0.3)]"
          >
            <Download className="w-4 h-4" />
            <span>View Resume</span>
          </Link>
          <Link
            href="/contact"
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl glass-card text-foreground font-medium text-sm hover:border-pacific-cyan/40 transition-colors"
          >
            <Send className="w-4 h-4 text-pacific-cyan" />
            <span>Get in Touch</span>
          </Link>
        </div>
      </section>

      {/* Section link to projects */}
      <div className="flex justify-center -mt-6">
        <Link
          href="/projects"
          className="inline-flex items-center gap-2 text-sm font-mono text-muted hover:text-pacific-cyan transition-colors"
        >
          <span>View Case Studies</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
