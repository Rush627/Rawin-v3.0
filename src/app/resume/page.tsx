import type { Metadata } from "next";
import Link from "next/link";
import {
  Mail,
  MapPin,
  ExternalLink,
  Sparkles,
  Download,
  Code2,
  Server,
  Database,
  Layers,
  GraduationCap,
  Briefcase,
  ArrowUpRight,
} from "lucide-react";
import { getSiteContent } from "@/lib/site-content";
import ResumeCard3D from "@/components/ResumeCard3D";

export const metadata: Metadata = {
  title: "Resume & Curriculum Vitae | Rushan Siddiqui",
  description: "Professional resume and engineering profile of Rushan Siddiqui: Full Stack Developer.",
};

export const revalidate = 0;

export default async function ResumePage() {
  const content = await getSiteContent();
  const resume = content.resume;
  const global = content.global;

  const titleParts = (resume.title || global.brandName || "Rushan Siddiqui").split(" ");
  const firstName = titleParts[0] || "Rushan";
  const restName = titleParts.slice(1).join(" ");

  const cleanSummary =
    resume.summary && !resume.summary.includes("over 4 years")
      ? resume.summary
      : "Full stack developer focused on building fast, reliable web applications with Next.js, TypeScript, and modern backend systems. Passionate about interface craft, performance, and writing clean, maintainable code.";

  const skillsList = [...(resume.skills || [])].sort(
    (a, b) => (a.displayOrder || 0) - (b.displayOrder || 0)
  );

  const experienceList = [...(resume.experience || [])].sort(
    (a, b) => (a.displayOrder || 0) - (b.displayOrder || 0)
  );

  const educationList = [...(resume.education || [])].sort(
    (a, b) => (a.displayOrder || 0) - (b.displayOrder || 0)
  );

  const contactLocation = content.contact?.location || resume.contact?.location || global.location || "Jaunpur, Uttar Pradesh, India";
  const contactEmail = content.contact?.email || resume.contact?.email || global.contactEmail || "rushansiddiqui5262@gmail.com";
  const contactWebsite = resume.contact?.website || "https://rawin.dev";

  const statusIndicator = resume.status?.indicator || "green";
  const statusTextColorClass =
    statusIndicator === "orange"
      ? "text-amber-400"
      : statusIndicator === "cyan"
      ? "text-pacific-cyan"
      : statusIndicator === "gray"
      ? "text-zinc-400"
      : "text-emerald-400";

  const statusDotClass =
    statusIndicator === "orange"
      ? "bg-amber-400"
      : statusIndicator === "cyan"
      ? "bg-pacific-cyan"
      : statusIndicator === "gray"
      ? "bg-zinc-400"
      : "bg-emerald-400";

  // Helper icon selector for skill groups
  const getSkillIcon = (title: string) => {
    const t = title.toLowerCase();
    if (t.includes("front") || t.includes("ui") || t.includes("web")) return <Code2 className="w-4 h-4 text-pacific-cyan" />;
    if (t.includes("back") || t.includes("api") || t.includes("server")) return <Server className="w-4 h-4 text-pacific-cyan" />;
    if (t.includes("data") || t.includes("infra") || t.includes("cloud") || t.includes("db")) return <Database className="w-4 h-4 text-pacific-cyan" />;
    return <Layers className="w-4 h-4 text-pacific-cyan" />;
  };

  return (
    <div className="relative w-full min-h-screen">
      {/* Top ambient backdrop prevents content from visibly colliding behind floating navbar */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed top-0 inset-x-0 h-32 bg-gradient-to-b from-ink-black via-ink-black/90 to-transparent z-30"
      />

      <div className="w-full max-w-4xl lg:max-w-5xl mx-auto pt-36 sm:pt-40 md:pt-44 pb-24 px-5 sm:px-6 lg:px-8 flex flex-col gap-14 sm:gap-16">
        {/* RESUME HERO */}
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-8 pb-10 border-b border-white/[0.08]">
          <div className="flex flex-col gap-4 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono font-medium glass-pill text-pacific-cyan w-fit border border-pacific-cyan/20">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{resume.eyebrow || "Curriculum Vitae"}</span>
            </div>
            <h1 className="text-3xl sm:text-5xl md:text-6xl font-bold tracking-tight text-foreground font-space leading-tight break-words">
              {firstName} {restName && <span className="text-pacific-cyan">{restName}</span>}
            </h1>
            <p className="text-base sm:text-lg text-muted/90 font-medium font-sans">
              {resume.subtitle || "Full Stack Developer · Web Craftsman"}
            </p>
          </div>

          <div className="flex flex-col w-full md:w-auto items-start md:items-end gap-3.5 shrink-0">
            {/* Live Working Status aligned with action group */}
            <div className="inline-flex items-center gap-1.5 text-xs font-sans font-medium self-start md:self-end select-none">
              <span className={`w-2 h-2 rounded-full ${statusDotClass} shrink-0`} />
              <span className={statusTextColorClass}>
                {resume.status?.text || "Available for hire"}
              </span>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center w-full md:w-auto gap-3">
              <Link
                href="/contact"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-pacific-cyan text-ink-black font-semibold text-sm hover:bg-pacific-cyan/90 transition-all shadow-[0_0_20px_rgba(24,155,173,0.3)] min-h-[46px] w-full sm:w-auto"
              >
                <Mail className="w-4 h-4" />
                <span>{resume.ctaText || "Hire Me"}</span>
              </Link>

              {resume.pdf && (
                <a
                  href="/api/resume/download"
                  download
                  className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-foreground border border-white/[0.1] font-semibold text-sm transition-all hover:border-pacific-cyan/40 min-h-[46px] w-full sm:w-auto"
                  aria-label="Download Resume PDF"
                >
                  <Download className="w-4 h-4 text-pacific-cyan" />
                  <span>Download Resume</span>
                </a>
              )}
            </div>
          </div>
        </header>

        {/* RESUME METADATA */}
        <section aria-label="Contact Information" className="scroll-mt-28">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {/* Location */}
            <ResumeCard3D elevateY={-2} className="h-full">
              <div className="px-4 py-3 rounded-xl bg-ink-black/40 border border-white/[0.07] hover:border-white/[0.14] transition-colors flex flex-col justify-center gap-1 h-full min-w-0">
                <div className="flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-wider text-muted/60">
                  <MapPin className="w-3.5 h-3.5 text-pacific-cyan shrink-0" />
                  <span>Location</span>
                </div>
                <div className="text-sm font-medium font-sans text-foreground/90 break-words">
                  {contactLocation}
                </div>
              </div>
            </ResumeCard3D>

            {/* Email */}
            <ResumeCard3D elevateY={-2} className="h-full">
              <div className="px-4 py-3 rounded-xl bg-ink-black/40 border border-white/[0.07] hover:border-white/[0.14] transition-colors flex flex-col justify-center gap-1 h-full min-w-0">
                <div className="flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-wider text-muted/60">
                  <Mail className="w-3.5 h-3.5 text-pacific-cyan shrink-0" />
                  <span>Email</span>
                </div>
                <a
                  href={`mailto:${contactEmail}`}
                  className="text-sm font-medium font-sans text-foreground/90 hover:text-pacific-cyan [overflow-wrap:anywhere] transition-colors inline-block"
                  aria-label={`Email ${contactEmail}`}
                >
                  {contactEmail}
                </a>
              </div>
            </ResumeCard3D>

            {/* Website */}
            <ResumeCard3D elevateY={-2} className="h-full sm:col-span-2 lg:col-span-1">
              <div className="px-4 py-3 rounded-xl bg-ink-black/40 border border-white/[0.07] hover:border-white/[0.14] transition-colors flex flex-col justify-center gap-1 h-full min-w-0">
                <div className="flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-wider text-muted/60">
                  <ExternalLink className="w-3.5 h-3.5 text-pacific-cyan shrink-0" />
                  <span>Website</span>
                </div>
                <a
                  href={contactWebsite.startsWith("http") ? contactWebsite : `https://${contactWebsite}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-medium font-sans text-foreground/90 hover:text-pacific-cyan [overflow-wrap:anywhere] transition-colors inline-flex items-center gap-1"
                  aria-label={`Open website ${contactWebsite}`}
                >
                  <span>{contactWebsite.replace(/^https?:\/\//, "")}</span>
                  <ArrowUpRight className="w-3 h-3 text-muted/50 shrink-0" />
                </a>
              </div>
            </ResumeCard3D>
          </div>
        </section>

        {/* SUMMARY */}
        <section aria-label="Executive Summary" className="flex flex-col gap-4 scroll-mt-28">
          <h2 className="text-xs uppercase font-mono tracking-widest text-pacific-cyan font-bold">
            Summary
          </h2>
          <div className="p-6 sm:p-7 rounded-2xl bg-ink-black/40 border border-white/[0.06] backdrop-blur-sm">
            <p className="text-base sm:text-lg text-muted/90 leading-relaxed font-sans max-w-3xl">
              {cleanSummary}
            </p>
          </div>
        </section>

        {/* TECHNICAL SKILLS */}
        <section aria-label="Technical Skills" className="flex flex-col gap-6 scroll-mt-28">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-xs uppercase font-mono tracking-widest text-pacific-cyan font-bold">
              Technical Skills
            </h2>
            <span className="text-xs font-mono text-muted/50">Core Capabilities</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
            {skillsList.map((group, idx) => (
              <ResumeCard3D key={group.id || idx} elevateY={-4} className="h-full">
                <div className="p-5 sm:p-6 rounded-2xl bg-ink-black/40 border border-white/[0.07] hover:border-white/[0.14] transition-colors flex flex-col gap-4 h-full">
                  <div className="flex items-center justify-between gap-2 border-b border-white/[0.06] pb-3">
                    <span className="text-xs font-mono text-pacific-cyan uppercase font-semibold tracking-wider">
                      {group.title}
                    </span>
                    {getSkillIcon(group.title)}
                  </div>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {group.skills.map((skill, sIdx) => (
                      <span
                        key={sIdx}
                        className="px-3 py-1 rounded-lg bg-white/[0.03] border border-white/[0.07] text-xs sm:text-sm font-space text-foreground/90 hover:border-pacific-cyan/30 hover:text-foreground transition-colors"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              </ResumeCard3D>
            ))}
          </div>
        </section>

        {/* EXPERIENCE */}
        <section aria-label="Professional Experience" className="flex flex-col gap-8 scroll-mt-28">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-xs uppercase font-mono tracking-widest text-pacific-cyan font-bold flex items-center gap-2">
              <Briefcase className="w-3.5 h-3.5" />
              <span>Experience</span>
            </h2>
            <span className="text-xs font-mono text-muted/50">Engineering Timeline</span>
          </div>

          <div className="relative pl-6 sm:pl-8 border-l-2 border-white/[0.08] flex flex-col gap-8 ml-2 sm:ml-4">
            {experienceList.map((item, idx) => {
              const dateDisplay = item.current
                ? `${item.startDate} -> Present`
                : item.endDate
                ? `${item.startDate} -> ${item.endDate}`
                : item.startDate;

              return (
                <div key={item.id || idx} className="relative group">
                  {/* Timeline node */}
                  {item.current ? (
                    <span className="absolute -left-[31px] sm:-left-[39px] top-4 w-3.5 h-3.5 rounded-full bg-pacific-cyan ring-4 ring-pacific-cyan/20 shadow-[0_0_12px_rgba(24,155,173,0.5)]" />
                  ) : (
                    <span className="absolute -left-[30px] sm:-left-[38px] top-4 w-3 h-3 rounded-full bg-white/30 border-2 border-ink-black" />
                  )}

                  <ResumeCard3D elevateY={-3} glow={item.current}>
                    <div
                      className={`p-6 sm:p-7 rounded-2xl border transition-all flex flex-col gap-4 ${
                        item.current
                          ? "bg-ink-black/50 border-pacific-cyan/30 shadow-[0_0_24px_rgba(24,155,173,0.06)]"
                          : "bg-ink-black/40 border-white/[0.07] hover:border-white/[0.14]"
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-2.5">
                          <h3 className="text-lg sm:text-xl font-bold text-foreground font-space">
                            {item.role}
                          </h3>
                          {item.current && (
                            <span className="px-2.5 py-0.5 rounded-full bg-pacific-cyan/10 border border-pacific-cyan/30 text-pacific-cyan text-[11px] font-mono font-medium">
                              Current Role
                            </span>
                          )}
                        </div>
                        <span
                          className={`text-xs font-mono font-semibold shrink-0 ${
                            item.current ? "text-pacific-cyan" : "text-muted/70"
                          }`}
                        >
                          {dateDisplay}
                        </span>
                      </div>

                      <p className="text-xs sm:text-sm text-muted/70 font-mono">
                        {item.organization}
                        {item.location ? ` · ${item.location}` : ""}
                      </p>

                      <ul className="flex flex-col gap-2.5 pt-2 text-xs sm:text-sm text-muted/90 leading-relaxed">
                        {item.bullets.map((bullet, bIdx) => (
                          <li key={bIdx} className="flex items-start gap-2.5">
                            <span className="text-pacific-cyan font-bold mt-0.5 shrink-0">·</span>
                            <span className="break-words">{bullet}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </ResumeCard3D>
                </div>
              );
            })}
          </div>
        </section>

        {/* EDUCATION */}
        <section aria-label="Education" className="flex flex-col gap-6 scroll-mt-28">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-xs uppercase font-mono tracking-widest text-pacific-cyan font-bold flex items-center gap-2">
              <GraduationCap className="w-3.5 h-3.5" />
              <span>Education</span>
            </h2>
            <span className="text-xs font-mono text-muted/50">Academic Foundation</span>
          </div>

          <div className="flex flex-col gap-4">
            {educationList.map((edu, idx) => {
              const dateDisplay =
                edu.startDate && edu.endDate
                  ? `${edu.startDate} -> ${edu.endDate}`
                  : edu.endDate || edu.startDate || "";

              return (
                <ResumeCard3D key={edu.id || idx} elevateY={-3}>
                  <div className="p-6 sm:p-7 rounded-2xl bg-ink-black/40 border border-white/[0.07] hover:border-white/[0.14] transition-colors flex flex-col gap-3">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                      <div className="flex flex-col gap-1">
                        <h3 className="text-base sm:text-lg font-bold text-foreground font-space">
                          {edu.degree}
                        </h3>
                        <p className="text-xs sm:text-sm text-muted/80 font-mono">
                          {edu.institution}
                          {edu.location ? ` · ${edu.location}` : ""}
                        </p>
                      </div>
                      {dateDisplay && (
                        <span className="text-xs font-mono text-muted/70 shrink-0">
                          {dateDisplay}
                        </span>
                      )}
                    </div>
                    {edu.description && (
                      <p className="text-xs sm:text-sm text-muted/70 font-sans leading-relaxed pt-1 border-t border-white/[0.04]">
                        {edu.description}
                      </p>
                    )}
                  </div>
                </ResumeCard3D>
              );
            })}
          </div>
        </section>

        {/* RESUME BOTTOM CTA */}
        <section aria-label="Collaborate" className="scroll-mt-28">
          <ResumeCard3D elevateY={-4} glow>
            <div className="p-6 sm:p-8 rounded-2xl bg-white/[0.02] border border-white/[0.08] hover:border-pacific-cyan/30 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-6">
              <div className="flex flex-col gap-1.5 max-w-xl">
                <h3 className="text-lg sm:text-xl font-bold text-foreground font-space">
                  {resume.cta?.heading || "Interested in working together?"}
                </h3>
                <p className="text-xs sm:text-sm text-muted leading-relaxed">
                  {resume.cta?.description ||
                    "Open to full-time roles, freelance engineering, and product collaborations."}
                </p>
              </div>
              <Link
                href="/contact"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-pacific-cyan text-ink-black font-semibold text-sm hover:bg-pacific-cyan/90 transition-all shadow-[0_0_20px_rgba(24,155,173,0.3)] shrink-0 min-h-[44px]"
              >
                <Mail className="w-4 h-4" />
                <span>{resume.cta?.buttonText || "Get in Touch"}</span>
              </Link>
            </div>
          </ResumeCard3D>
        </section>
      </div>
    </div>
  );
}
