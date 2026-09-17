import React from "react";
import Link from "next/link";
import {
  Mail,
  MapPin,
  ExternalLink,
  Download,
  Code2,
  Server,
  Database,
  Layers,
  ArrowUpRight,
} from "lucide-react";
import type {
  ResumeContent,
  GlobalContent,
  ResumeSkillGroup,
  ResumeExperienceItem,
  ResumeEducationItem,
} from "@/lib/site-content";
import ResumeTimelineItem from "@/components/ResumeTimelineItem";

interface ResumeDesktopViewProps {
  resume: ResumeContent;
  global: GlobalContent;
  contactLocation: string;
  contactEmail: string;
  contactWebsite: string;
  statusTextColorClass: string;
  statusDotClass: string;
  skillsList: ResumeSkillGroup[];
  experienceList: ResumeExperienceItem[];
  educationList: ResumeEducationItem[];
  cleanSummary: string;
}

// Icon helper for skill categories
function getSkillIcon(title: string) {
  const t = title.toLowerCase();
  if (t.includes("front") || t.includes("ui") || t.includes("web")) {
    return <Code2 className="w-3.5 h-3.5 text-pacific-cyan" />;
  }
  if (t.includes("back") || t.includes("api") || t.includes("server")) {
    return <Server className="w-3.5 h-3.5 text-pacific-cyan" />;
  }
  if (t.includes("data") || t.includes("infra") || t.includes("cloud") || t.includes("db")) {
    return <Database className="w-3.5 h-3.5 text-pacific-cyan" />;
  }
  return <Layers className="w-3.5 h-3.5 text-pacific-cyan" />;
}

export default function ResumeDesktopView({
  resume,
  global,
  contactLocation,
  contactEmail,
  contactWebsite,
  statusTextColorClass,
  statusDotClass,
  skillsList,
  experienceList,
  educationList,
  cleanSummary,
}: ResumeDesktopViewProps) {
  const fullName = resume.title || global.brandName || "Rushan Siddiqui";
  const subtitle = resume.subtitle || "Full Stack Developer · Web Craftsman";

  return (
    <div className="w-full max-w-5xl mx-auto pt-32 sm:pt-36 md:pt-40 pb-28 px-6 lg:px-8 flex flex-col gap-20">
      
      {/* ─── 01: Profile Header ─── */}
      <header className="flex flex-col gap-6 pb-8 border-b border-white/[0.08]">
        <div className="flex items-center justify-between gap-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md text-xs font-mono font-medium text-pacific-cyan bg-pacific-cyan/[0.08] border border-pacific-cyan/20">
            <span>RESUME / PROFILE · 2026</span>
          </div>

          {/* Live Status */}
          <div className="inline-flex items-center gap-2 text-xs font-mono select-none px-3 py-1 rounded-md bg-white/[0.02] border border-white/[0.06]">
            <span className={`w-2 h-2 rounded-full ${statusDotClass} shrink-0 animate-pulse`} />
            <span className={statusTextColorClass}>
              {resume.status?.text || "Available for hire"}
            </span>
          </div>
        </div>

        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="flex flex-col gap-2 max-w-2xl">
            <h1 className="text-4xl lg:text-5xl font-bold tracking-tight text-foreground font-space leading-tight">
              {fullName}
            </h1>
            <p className="text-base lg:text-lg text-muted/90 font-medium font-sans">
              {subtitle}
            </p>
          </div>

          {/* Compact Action Row */}
          <div className="flex items-center gap-3 shrink-0">
            <Link
              href="/contact"
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-pacific-cyan text-ink-black font-semibold text-xs font-mono uppercase tracking-wider hover:bg-pacific-cyan/90 transition-all shadow-[0_0_15px_rgba(24,155,173,0.25)] min-h-[42px]"
            >
              <Mail className="w-3.5 h-3.5" />
              <span>{resume.ctaText || "Hire Me"}</span>
            </Link>

            {resume.pdf && (
              <a
                href="/api/resume/download"
                download
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-white/[0.03] hover:bg-white/[0.07] text-foreground border border-white/[0.08] hover:border-pacific-cyan/40 font-semibold text-xs font-mono uppercase tracking-wider transition-all min-h-[42px]"
                aria-label="Download Resume PDF"
              >
                <Download className="w-3.5 h-3.5 text-pacific-cyan" />
                <span>Download Resume</span>
              </a>
            )}
          </div>
        </div>
      </header>

      {/* ─── 02: Contact Metadata Strip ─── */}
      <section aria-label="Contact Information" className="scroll-mt-28">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 py-4 px-6 rounded-xl bg-ink-black/40 border border-white/[0.07] divide-y md:divide-y-0 md:divide-x divide-white/[0.06]">
          {/* Location */}
          <div className="flex flex-col gap-1 min-w-0 pr-4">
            <span className="text-[10px] font-mono text-muted/50 uppercase tracking-widest flex items-center gap-1.5">
              <MapPin className="w-3 h-3 text-pacific-cyan shrink-0" />
              <span>Location</span>
            </span>
            <span className="text-xs font-medium font-sans text-foreground/90 truncate">
              {contactLocation}
            </span>
          </div>

          {/* Email */}
          <div className="flex flex-col gap-1 min-w-0 pt-3 md:pt-0 md:px-4">
            <span className="text-[10px] font-mono text-muted/50 uppercase tracking-widest flex items-center gap-1.5">
              <Mail className="w-3 h-3 text-pacific-cyan shrink-0" />
              <span>Email</span>
            </span>
            <a
              href={`mailto:${contactEmail}`}
              className="text-xs font-medium font-sans text-foreground/90 hover:text-pacific-cyan transition-colors truncate"
              aria-label={`Email ${contactEmail}`}
            >
              {contactEmail}
            </a>
          </div>

          {/* Website */}
          <div className="flex flex-col gap-1 min-w-0 pt-3 md:pt-0 md:pl-4">
            <span className="text-[10px] font-mono text-muted/50 uppercase tracking-widest flex items-center gap-1.5">
              <ExternalLink className="w-3 h-3 text-pacific-cyan shrink-0" />
              <span>Website</span>
            </span>
            <a
              href={contactWebsite.startsWith("http") ? contactWebsite : `https://${contactWebsite}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-medium font-sans text-foreground/90 hover:text-pacific-cyan inline-flex items-center gap-1 transition-colors truncate"
              aria-label={`Open website ${contactWebsite}`}
            >
              <span>{contactWebsite.replace(/^https?:\/\//, "")}</span>
              <ArrowUpRight className="w-3 h-3 text-muted/40 shrink-0" />
            </a>
          </div>
        </div>
      </section>

      {/* ─── 03: Summary ─── */}
      <section aria-label="Summary" className="flex flex-col gap-4 scroll-mt-28">
        <div className="flex items-center gap-2.5 pb-3 border-b border-white/[0.08]">
          <span className="text-xs font-mono font-bold text-pacific-cyan bg-pacific-cyan/10 border border-pacific-cyan/20 px-2 py-0.5 rounded">
            01
          </span>
          <h2 className="text-lg font-bold font-space text-foreground uppercase tracking-wide">
            Summary
          </h2>
        </div>

        <div className="p-6 lg:p-7 rounded-xl bg-ink-black/30 border border-white/[0.06]">
          <p className="text-base lg:text-lg text-foreground/90 leading-relaxed font-sans max-w-4xl">
            {cleanSummary}
          </p>
        </div>
      </section>

      {/* ─── 04: Experience ─── */}
      <section aria-label="Professional Experience" className="flex flex-col gap-6 scroll-mt-28">
        <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
          <div className="flex items-center gap-2.5">
            <span className="text-xs font-mono font-bold text-pacific-cyan bg-pacific-cyan/10 border border-pacific-cyan/20 px-2 py-0.5 rounded">
              02
            </span>
            <h2 className="text-lg font-bold font-space text-foreground uppercase tracking-wide">
              Experience
            </h2>
          </div>
          <span className="text-[10px] font-mono text-muted/50 uppercase tracking-widest">
            CAREER TIMELINE · {experienceList.length} POSITIONS
          </span>
        </div>

        {/* Editorial Vertical Timeline */}
        <div className="relative flex flex-col gap-10 pt-2">
          {/* Continuous vertical timeline line on exact 11px horizontal axis */}
          <div
            aria-hidden="true"
            className="absolute left-[11px] top-6 bottom-6 w-[1px] bg-white/[0.1] pointer-events-none"
          />

          {experienceList.map((item, idx) => (
            <ResumeTimelineItem
              key={item.id || idx}
              item={item}
              variant="desktop"
            />
          ))}
        </div>
      </section>

      {/* ─── 05: Technical Skills ─── */}
      <section aria-label="Technical Skills" className="flex flex-col gap-6 scroll-mt-28">
        <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
          <div className="flex items-center gap-2.5">
            <span className="text-xs font-mono font-bold text-pacific-cyan bg-pacific-cyan/10 border border-pacific-cyan/20 px-2 py-0.5 rounded">
              03
            </span>
            <h2 className="text-lg font-bold font-space text-foreground uppercase tracking-wide">
              Technical Skills
            </h2>
          </div>
          <span className="text-[10px] font-mono text-muted/50 uppercase tracking-widest">
            CORE CAPABILITIES · {skillsList.length} CATEGORIES
          </span>
        </div>

        {/* Structured Technical Skills Map */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {skillsList.map((group, idx) => {
            const numStr = idx < 9 ? `0${idx + 1}` : `${idx + 1}`;
            return (
              <div
                key={group.id || idx}
                className="p-5 rounded-xl bg-ink-black/40 border border-white/[0.06] hover:border-pacific-cyan/30 transition-all duration-200 flex flex-col justify-between gap-4"
              >
                <div className="flex items-center justify-between pb-2 border-b border-white/[0.06]">
                  <span className="text-xs font-mono uppercase font-bold text-pacific-cyan tracking-wider">
                    {numStr} / {group.title}
                  </span>
                  {getSkillIcon(group.title)}
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {group.skills.map((skill, sIdx) => (
                    <span
                      key={sIdx}
                      className="px-2.5 py-1 rounded-md bg-white/[0.03] border border-white/[0.06] text-xs font-space text-foreground/90 hover:border-pacific-cyan/30 transition-colors"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ─── 06: Education ─── */}
      <section aria-label="Education" className="flex flex-col gap-6 scroll-mt-28">
        <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
          <div className="flex items-center gap-2.5">
            <span className="text-xs font-mono font-bold text-pacific-cyan bg-pacific-cyan/10 border border-pacific-cyan/20 px-2 py-0.5 rounded">
              04
            </span>
            <h2 className="text-lg font-bold font-space text-foreground uppercase tracking-wide">
              Education
            </h2>
          </div>
          <span className="text-[10px] font-mono text-muted/50 uppercase tracking-widest">
            ACADEMIC RECORD
          </span>
        </div>

        <div className="flex flex-col gap-4">
          {educationList.map((edu, idx) => {
            const dateDisplay =
              edu.startDate && edu.endDate
                ? `${edu.startDate} -> ${edu.endDate}`
                : edu.endDate || edu.startDate || "";

            return (
              <div
                key={edu.id || idx}
                className="p-6 rounded-xl bg-ink-black/40 border border-white/[0.07] hover:border-pacific-cyan/30 transition-all duration-200 flex flex-col gap-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                  <div className="flex flex-col gap-1">
                    <h3 className="text-base lg:text-lg font-bold text-foreground font-space">
                      {edu.degree}
                    </h3>
                    <p className="text-xs font-mono text-muted/70">
                      {edu.institution}
                      {edu.location ? ` · ${edu.location}` : ""}
                    </p>
                  </div>
                  {dateDisplay && (
                    <span className="text-xs font-mono text-pacific-cyan font-bold shrink-0">
                      {dateDisplay}
                    </span>
                  )}
                </div>

                {edu.description && (
                  <p className="text-xs sm:text-sm text-muted/80 font-sans leading-relaxed pt-2 border-t border-white/[0.04]">
                    {edu.description}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </section>

    </div>
  );
}
