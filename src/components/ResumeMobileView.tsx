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

interface ResumeMobileViewProps {
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

export default function ResumeMobileView({
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
}: ResumeMobileViewProps) {
  const fullName = resume.title || global.brandName || "Rushan Siddiqui";
  const subtitle = resume.subtitle || "Full Stack Developer · Web Craftsman";

  return (
    <div className="w-full max-w-xl md:max-w-3xl mx-auto pt-32 sm:pt-36 pb-16 px-4 sm:px-6 md:px-8 flex flex-col gap-10">
      
      {/* ─── Mobile Hero / Profile ─── */}
      <header className="flex flex-col gap-4 pb-6 border-b border-white/[0.08]">
        <div className="flex items-center justify-between gap-3">
          <span className="inline-flex items-center px-2.5 py-1 rounded text-[11px] font-mono font-medium text-pacific-cyan bg-pacific-cyan/[0.08] border border-pacific-cyan/20">
            {resume.eyebrow || "RESUME / PROFILE · 2026"}
          </span>

          {/* Live Status Badge */}
          <div className="inline-flex items-center gap-1.5 text-[11px] font-mono select-none px-2.5 py-1 rounded bg-white/[0.03] border border-white/[0.06]">
            <span className={`w-2 h-2 rounded-full ${statusDotClass} shrink-0 animate-pulse`} />
            <span className={statusTextColorClass}>
              {resume.status?.text || "Available for hire"}
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground font-space leading-tight break-words">
            {fullName}
          </h1>
          <p className="text-sm text-muted/90 font-medium font-sans">
            {subtitle}
          </p>
        </div>

        {/* Action Buttons: 2-column on mobile, inline row on tablet */}
        <div className="grid grid-cols-2 md:flex md:flex-row md:items-center gap-2.5 pt-2">
          <Link
            href="/contact"
            className="inline-flex items-center justify-center gap-2 px-3 md:px-5 py-2.5 rounded-lg bg-pacific-cyan text-ink-black font-semibold text-xs font-mono uppercase tracking-wider hover:bg-pacific-cyan/90 transition-all min-h-[42px] text-center md:w-auto"
          >
            <Mail className="w-3.5 h-3.5 shrink-0" />
            <span>{resume.ctaText || "Hire Me"}</span>
          </Link>

          {resume.pdf ? (
            <a
              href={resume.pdf.url || "/api/resume/download"}
              download
              className="inline-flex items-center justify-center gap-1.5 px-3 md:px-5 py-2.5 rounded-lg bg-white/[0.04] text-foreground border border-white/[0.08] hover:border-pacific-cyan/40 font-semibold text-xs font-mono uppercase tracking-wider transition-all min-h-[42px] text-center md:w-auto"
              aria-label="Download Resume PDF"
            >
              <Download className="w-3.5 h-3.5 text-pacific-cyan shrink-0" />
              <span>Download</span>
            </a>
          ) : (
            <div />
          )}
        </div>
      </header>

      {/* ─── Mobile Contact Metadata ─── */}
      <section aria-label="Contact Information" className="flex flex-col gap-2.5">
        <div className="flex flex-col gap-2 p-3.5 rounded-xl bg-ink-black/40 border border-white/[0.06] text-xs font-sans">
          {/* Location */}
          <div className="flex items-center gap-2.5 text-muted/80">
            <MapPin className="w-3.5 h-3.5 text-pacific-cyan shrink-0" />
            <span className="text-foreground/90 truncate">{contactLocation}</span>
          </div>

          {/* Email */}
          <div className="flex items-center gap-2.5 text-muted/80 pt-1.5 border-t border-white/[0.04]">
            <Mail className="w-3.5 h-3.5 text-pacific-cyan shrink-0" />
            <a
              href={`mailto:${contactEmail}`}
              className="text-foreground/90 hover:text-pacific-cyan transition-colors truncate"
              aria-label={`Email ${contactEmail}`}
            >
              {contactEmail}
            </a>
          </div>

          {/* Website */}
          <div className="flex items-center gap-2.5 text-muted/80 pt-1.5 border-t border-white/[0.04]">
            <ExternalLink className="w-3.5 h-3.5 text-pacific-cyan shrink-0" />
            <a
              href={contactWebsite.startsWith("http") ? contactWebsite : `https://${contactWebsite}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-foreground/90 hover:text-pacific-cyan inline-flex items-center gap-1 transition-colors truncate"
              aria-label={`Open website ${contactWebsite}`}
            >
              <span>{contactWebsite.replace(/^https?:\/\//, "")}</span>
              <ArrowUpRight className="w-3 h-3 text-muted/40 shrink-0" />
            </a>
          </div>
        </div>
      </section>

      {/* ─── Mobile Summary ─── */}
      <section aria-label="Summary" className="flex flex-col gap-2.5">
        <div className="flex items-center gap-2 pb-2 border-b border-white/[0.06]">
          <span className="text-[10px] font-mono font-bold text-pacific-cyan bg-pacific-cyan/10 border border-pacific-cyan/20 px-1.5 py-0.5 rounded">
            01
          </span>
          <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-muted/60">
            Summary
          </h2>
        </div>
        <div className="p-4 rounded-xl bg-ink-black/30 border border-white/[0.05]">
          <p className="text-sm text-foreground/90 leading-relaxed font-sans">
            {cleanSummary}
          </p>
        </div>
      </section>

      {/* ─── Mobile Experience (Natural Vertical Career Feed) ─── */}
      <section aria-label="Experience" className="flex flex-col gap-3">
        <div className="flex items-center justify-between pb-2 border-b border-white/[0.06]">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono font-bold text-pacific-cyan bg-pacific-cyan/10 border border-pacific-cyan/20 px-1.5 py-0.5 rounded">
              02
            </span>
            <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-muted/60">
              Experience
            </h2>
          </div>
          <span className="text-[10px] font-mono text-muted/40 uppercase">
            {experienceList.length} Roles
          </span>
        </div>

        {/* Natural document flow feed with left guide rail */}
        <div className="relative flex flex-col gap-6 pt-1">
          {/* Continuous vertical timeline line on exact 7px horizontal axis */}
          <div
            aria-hidden="true"
            className="absolute left-[7px] top-5 bottom-5 w-[1px] bg-white/[0.08] pointer-events-none"
          />

          {experienceList.map((item, idx) => (
            <ResumeTimelineItem
              key={item.id || idx}
              item={item}
              variant="mobile"
            />
          ))}
        </div>
      </section>

      {/* ─── Mobile Technical Skills ─── */}
      <section aria-label="Technical Skills" className="flex flex-col gap-3">
        <div className="flex items-center justify-between pb-2 border-b border-white/[0.06]">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono font-bold text-pacific-cyan bg-pacific-cyan/10 border border-pacific-cyan/20 px-1.5 py-0.5 rounded">
              03
            </span>
            <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-muted/60">
              Technical Skills
            </h2>
          </div>
          <span className="text-[10px] font-mono text-muted/40 uppercase">
            {skillsList.length} Categories
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {skillsList.map((group, idx) => (
            <div
              key={group.id || idx}
              className="p-3.5 rounded-xl bg-ink-black/40 border border-white/[0.06] flex flex-col gap-2.5"
            >
              <div className="flex items-center justify-between pb-1.5 border-b border-white/[0.04]">
                <span className="text-[11px] font-mono uppercase font-bold text-pacific-cyan tracking-wider">
                  {group.title}
                </span>
                {getSkillIcon(group.title)}
              </div>

              <div className="flex flex-wrap gap-1.5">
                {group.skills.map((skill, sIdx) => (
                  <span
                    key={sIdx}
                    className="px-2 py-1 rounded bg-white/[0.03] border border-white/[0.06] text-[11px] font-space text-foreground/90"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── Mobile Education ─── */}
      <section aria-label="Education" className="flex flex-col gap-3">
        <div className="flex items-center justify-between pb-2 border-b border-white/[0.06]">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono font-bold text-pacific-cyan bg-pacific-cyan/10 border border-pacific-cyan/20 px-1.5 py-0.5 rounded">
              04
            </span>
            <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-muted/60">
              Education
            </h2>
          </div>
          <span className="text-[10px] font-mono text-muted/40 uppercase">
            Academic Record
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {educationList.map((edu, idx) => {
            const dateDisplay =
              edu.startDate && edu.endDate
                ? `${edu.startDate} -> ${edu.endDate}`
                : edu.endDate || edu.startDate || "";

            return (
              <div
                key={edu.id || idx}
                className="p-4 rounded-xl bg-ink-black/40 border border-white/[0.06] flex flex-col gap-2"
              >
                <div className="flex flex-col gap-0.5">
                  {dateDisplay && (
                    <span className="text-[11px] font-mono text-pacific-cyan font-bold">
                      {dateDisplay}
                    </span>
                  )}
                  <h3 className="text-sm font-bold text-foreground font-space leading-snug">
                    {edu.degree}
                  </h3>
                  <p className="text-[11px] font-mono text-muted/70">
                    {edu.institution}
                    {edu.location ? ` · ${edu.location}` : ""}
                  </p>
                </div>

                {edu.description && (
                  <p className="text-xs text-muted/80 font-sans leading-relaxed pt-1.5 border-t border-white/[0.04]">
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
