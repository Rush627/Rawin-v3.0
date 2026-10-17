import Link from "next/link";
import { ArrowDown, ArrowUpRight } from "lucide-react";
import { getSiteContent, publicSiteClosed } from "@/lib/site-content";
import { AVAILABILITY_RESUME_INDICATOR } from "@/lib/cms/fields";
import MaskText from "@/components/system/MaskText";
import Reveal from "@/components/system/Reveal";
import { pageMetadata } from "@/lib/page-metadata";

export function generateMetadata() {
  return pageMetadata("resume", "/resume");
}

export const revalidate = 3600;

const STATUS_TONE: Record<string, string> = {
  orange: "text-warning",
  cyan: "text-accent",
  gray: "text-fg-subtle",
  green: "text-success",
};

/** Site wording rule: present "Engineer/Engineering" titles as "Developer". */
function cleanRole(role: string) {
  return role.replace(/\bEngineer\b/g, "Developer").replace(/\bEngineering\b/g, "Developer");
}

function dateRange(start?: string, end?: string, current?: boolean) {
  if (current) return `${start || ""} — Present`;
  if (start && end) return `${start} — ${end}`;
  return end || start || "";
}

function yearOf(value?: string) {
  const m = String(value || "").match(/\d{4}/);
  return m ? Number(m[0]) : null;
}

/** "Jaunpur, Uttar Pradesh, India" → "Jaunpur, India" */
function shortPlace(location: string) {
  const parts = location.split(",").map((p) => p.trim()).filter(Boolean);
  return parts.length > 2 ? `${parts[0]}, ${parts[parts.length - 1]}` : location;
}

const pad = (n: number) => String(n).padStart(2, "0");

/**
 * Resume — an editorial dossier.
 *
 * Hero: the name with its subtitle, beside a profile plate whose values all come from the
 * resume itself (status, current role, base, first year in the record) and which carries the
 * two actions. On wide desktops a contents column sits between them on the same baseline (a
 * fine axis with a node per section), so the middle of the hero is navigation, not leftover
 * space; narrower screens get the same index as a ruled strip under the hero. Each section is a ruled row: a numbered
 * heading in the left quarter (sticky on desktop), the record in the rest. Experience,
 * education and the closing call share one timeline rail that runs across the rules and ends
 * in an open marker: the next entry. On phones the rail becomes a spine down the left edge.
 *
 * Every word on the page is CMS content (resume section), apart from the fixed field names
 * of the contact list. Motion: the name and closing heading rise once, entries fade in once,
 * and the rail draws with the scroll where the browser supports scroll-driven animation.
 */
export default async function ResumePage() {
  // maintenance, offline or unreadable content: the layout shows the maintenance screen
  if (await publicSiteClosed()) return null;

  const content = await getSiteContent();
  const resume = content.resume;
  const global = content.global;

  const summary = resume.summary;
  const skills = [...(resume.skills || [])].sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
  const experience = [...(resume.experience || [])].sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
  const education = [...(resume.education || [])].sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));

  // contact identity and availability are canonical site-wide facts (Contact, Settings)
  const location = content.contact.location;
  const email = content.contact.email;
  const website = resume.contact?.website || "";
  const websiteHref = website.startsWith("http") ? website : `https://${website}`;
  const fullName = resume.title || global.brandName || "Rushan Siddiqui";
  const status = { text: content.availability.label, indicator: AVAILABILITY_RESUME_INDICATOR[content.availability.state] };
  const statusTone = STATUS_TONE[status.indicator] || "text-success";
  const pdfHref = resume.pdf ? resume.pdf.url || "/api/resume/download" : null;

  // plate values: read from the record, never invented
  const current = experience.find((e) => e.current) || null;
  const startYears = experience.map((e) => yearOf(e.startDate)).filter((y): y is number => y !== null);
  const since = startYears.length ? Math.min(...startYears) : null;

  const nameWords = fullName.trim().split(/\s+/);
  const nameLines =
    nameWords.length > 1
      ? [<span key="l0">{nameWords.slice(0, -1).join(" ")}</span>, <em key="e" className="italic text-accent">{nameWords[nameWords.length - 1]}</em>]
      : [<span key="l1">{fullName}</span>];

  const sections = [
    { id: "cv-profile", label: resume.profileLabel, show: Boolean(summary) },
    { id: "cv-skills", label: resume.skillsLabel, show: skills.length > 0 },
    { id: "cv-experience", label: resume.experienceLabel, show: experience.length > 0 },
    { id: "cv-education", label: resume.educationLabel, show: education.length > 0 },
  ].filter((s) => s.show);
  const num = (id: string) => pad(sections.findIndex((s) => s.id === id) + 1);
  const ctaNum = pad(sections.length + 1);

  const facts = [
    {
      label: resume.statusLabel,
      value: (
        <span className={`inline-flex items-center gap-2 ${statusTone}`}>
          <span className="status-dot" />
          <span className="text-fg">{status.text}</span>
        </span>
      ),
      show: Boolean(status.text),
    },
    { label: resume.roleLabel, value: current ? cleanRole(current.role) : "", show: Boolean(current) },
    { label: resume.locationLabel, value: shortPlace(location), show: Boolean(location) },
    { label: resume.sinceLabel, value: since ? String(since) : "", show: since !== null },
  ].filter((f) => f.show);

  const pdfButton = (className: string, label: string) =>
    pdfHref ? (
      <a href={pdfHref} download className={className} aria-label="Download Resume PDF">
        <ArrowDown className="w-4 h-4" />
        <span>{label}</span>
      </a>
    ) : null;

  return (
    <div className="cv mx-auto w-full max-w-[1600px] px-4 sm:px-6 lg:px-10 pt-[calc(env(safe-area-inset-top)+6rem)] sm:pt-[6.75rem] md:pt-[10.5rem] lg:pt-[10.75rem]">
      {/* ------------------------------------------------------------------ hero */}
      <header>
        <p className="flex items-center gap-3 label-mono text-fg-muted">
          <span className="text-accent">05</span>
          <span aria-hidden="true" className="h-px w-8 bg-line-strong" />
          <span className="min-w-0 truncate">{resume.eyebrow}</span>
          <span aria-hidden="true" className="hidden md:block h-px flex-1 bg-line" />
        </p>

        <div className="mt-7 sm:mt-10 lg:mt-12 grid grid-cols-12 gap-x-6 lg:gap-x-10 gap-y-8 lg:items-end">
          <div className="col-span-12 lg:col-span-7 xl:col-span-5 min-w-0">
            <MaskText as="h1" immediate className="cv-name text-fg" lines={nameLines} />
            <p className="mt-4 sm:mt-6 font-display italic text-[clamp(1.2rem,2.1vw,1.85rem)] leading-[1.15] text-fg-muted max-w-[32ch]">
              {resume.subtitle}
            </p>
          </div>

          {/* Contents (wide desktops): the section index as the hero's middle column */}
          {sections.length > 1 && (
            <nav aria-label="Resume sections" className="hidden xl:block xl:col-span-3 cv-contents">
              <p className="label-mono text-fg-subtle">{resume.indexLabel}</p>
              <div className="cv-contents-list">
                <span aria-hidden="true" className="cv-contents-axis" />
                <ol>
                {[...sections, { id: "cv-next", label: resume.ctaEyebrow }].map((s, i) => (
                  <li key={s.id}>
                    <a href={`#${s.id}`} className="cv-contents-link group">
                      <span aria-hidden="true" className="cv-contents-node" />
                      <span className="font-mono text-[11px] text-accent">{pad(i + 1)}</span>
                      <span className="text-[14px] text-fg-muted group-hover:text-fg group-focus-visible:text-fg transition-colors">{s.label}</span>
                    </a>
                  </li>
                ))}
                </ol>
              </div>
            </nav>
          )}

          {/* Profile plate: facts from the record, and the two actions */}
          <aside aria-label="Profile summary" className="col-span-12 lg:col-span-5 xl:col-span-4 cv-plate">
            {facts.length > 0 && (
              <dl className="grid grid-cols-2 border-t border-line">
                {facts.map((f, i) => (
                  <div key={f.label} className={`py-3 sm:py-3.5 border-b border-line min-w-0 ${i % 2 === 0 ? "pr-3" : "pl-3 border-l"}`}>
                    <dt className="label-mono text-fg-subtle">{f.label}</dt>
                    <dd className="mt-1.5 text-[14px] sm:text-[15px] leading-snug text-fg">{f.value}</dd>
                  </div>
                ))}
              </dl>
            )}
            <div className="mt-5 sm:mt-6 action-pair cv-actions">
              {pdfButton("btn btn-primary", resume.pdfLabel)}
              <Link href="/contact" className="btn btn-ghost">
                <span>{resume.ctaText}</span>
                <ArrowUpRight className="w-4 h-4" />
              </Link>
            </div>
          </aside>
        </div>

        {/* Section index (tablet and up) */}
        {sections.length > 1 && (
          <nav aria-label="Resume sections" className="hidden md:grid xl:hidden mt-12 lg:mt-14 border-y border-line" style={{ gridTemplateColumns: `repeat(${sections.length + 1}, minmax(0, 1fr))` }}>
            {[...sections, { id: "cv-next", label: resume.ctaEyebrow }].map((s, i) => (
              <a key={s.id} href={`#${s.id}`} className="cv-index group flex items-baseline gap-2.5 py-4 pr-3 label-mono leading-snug text-fg-muted hover:text-fg focus-visible:text-fg transition-colors">
                <span className="text-accent">{pad(i + 1)}</span>
                <span className="min-w-0">{s.label}</span>
              </a>
            ))}
          </nav>
        )}
      </header>

      {/* ------------------------------------------------------------------ profile */}
      {summary && (
        <section id="cv-profile" aria-labelledby="cv-profile-h" className="cv-sec mt-10 md:mt-0 md:border-t-0">
          <SectionHead id="cv-profile-h" n={num("cv-profile")} label={resume.profileLabel} />
          <div className="cv-body cv-profile">
            <p className="font-display text-[1.24rem] leading-[1.34] sm:text-[clamp(1.35rem,2.1vw,1.95rem)] sm:leading-[1.27] tracking-[-0.008em] text-fg max-w-[46ch]">
              {summary}
            </p>
            <div className="cv-contacts mt-8 sm:mt-10">
              <span aria-hidden="true" className="cv-contacts-axis" />
              <dl className="grid grid-cols-1 md:grid-cols-3 border-t border-line md:border-t-0">
                {location && <ContactRow label="Location">{location}</ContactRow>}
                {email && (
                  <ContactRow label="Email">
                    <a href={`mailto:${email}`} className="link-draw">{email}</a>
                  </ContactRow>
                )}
                {website && (
                  <ContactRow label="Website">
                    <a href={websiteHref} target="_blank" rel="noopener noreferrer" className="link-draw" aria-label={`Open website ${website} (opens in a new tab)`}>
                      {website.replace(/^https?:\/\//, "")}
                    </a>
                  </ContactRow>
                )}
              </dl>
            </div>
          </div>
        </section>
      )}

      {/* ------------------------------------------------------------------ skills */}
      {skills.length > 0 && (
        <section id="cv-skills" aria-labelledby="cv-skills-h" className="cv-sec">
          <SectionHead id="cv-skills-h" n={num("cv-skills")} label={resume.skillsLabel} />
          <div className="cv-body grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-7 sm:gap-y-9">
            {skills.map((group, i) => (
              <div key={group.id || i} className="min-w-0">
                <h3 className="flex items-baseline gap-3 text-fg">
                  <span className="font-mono text-[11px] text-fg-subtle">{pad(i + 1)}</span>
                  <span className="font-display text-[1.3rem] sm:text-[1.45rem] leading-none">{group.title}</span>
                </h3>
                <ul className="mt-3 flex flex-wrap gap-1.5">
                  {group.skills.map((s) => (
                    <li key={s} className="cv-chip">
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ------------------------------------------------------------------ experience */}
      {experience.length > 0 && (
        <section id="cv-experience" aria-labelledby="cv-experience-h" className="cv-sec cv-railed cv-railed--start">
          <span aria-hidden="true" className="cv-line" />
          <SectionHead id="cv-experience-h" n={num("cv-experience")} label={resume.experienceLabel} />
          <ol className="cv-body cv-rail flex flex-col gap-10 sm:gap-12">
            {experience.map((item, i) => (
              <Reveal as="li" key={item.id || i} y={18} className="cv-entry">
                <span aria-hidden="true" className="cv-mark" data-current={item.current ? "" : undefined} />
                <div className="cv-entry-meta">
                  <p className={`font-mono text-[12px] ${item.current ? "text-accent" : "text-fg-muted"}`}>
                    {dateRange(item.startDate, item.endDate, item.current)}
                    {item.location && <span className="text-fg-subtle md:hidden"> · {item.location}</span>}
                  </p>
                  {item.location && <p className="hidden md:block mt-1 text-[13px] text-fg-subtle">{item.location}</p>}
                  {item.current && (
                    <span className="mt-2 md:mt-3 inline-flex items-center gap-2 label-mono text-success">
                      <span className="status-dot" />
                      Current
                    </span>
                  )}
                </div>
                <div className="min-w-0">
                  <h3 className="text-[1.16rem] sm:text-[1.35rem] leading-snug font-medium tracking-[-0.015em] text-fg">{cleanRole(item.role)}</h3>
                  <p className="mt-0.5 font-display italic text-[1.05rem] sm:text-lg text-fg-muted">{item.organization}</p>
                  {item.bullets?.length > 0 && (
                    <ul className="mt-3.5 sm:mt-4 flex flex-col gap-2 max-w-[64ch]">
                      {item.bullets.map((b, bi) => (
                        <li key={bi} className="flex gap-3 text-[14.5px] sm:text-[15px] leading-[1.6] text-fg-muted">
                          <span aria-hidden="true" className="mt-[0.78em] w-2.5 h-px bg-accent shrink-0" />
                          <span>{b}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </Reveal>
            ))}
          </ol>
        </section>
      )}

      {/* ------------------------------------------------------------------ education */}
      {education.length > 0 && (
        <section id="cv-education" aria-labelledby="cv-education-h" className="cv-sec cv-railed">
          <span aria-hidden="true" className="cv-line" />
          <SectionHead id="cv-education-h" n={num("cv-education")} label={resume.educationLabel} />
          <ol className="cv-body cv-rail flex flex-col gap-10">
            {education.map((edu, i) => (
              <Reveal as="li" key={edu.id || i} y={18} className="cv-entry">
                <span aria-hidden="true" className="cv-mark" />
                <div className="cv-entry-meta">
                  <p className="font-mono text-[12px] text-fg-muted">{dateRange(edu.startDate, edu.endDate)}</p>
                </div>
                <div className="min-w-0">
                  <h3 className="text-[1.12rem] sm:text-[1.3rem] leading-snug font-medium tracking-[-0.012em] text-fg">{edu.degree}</h3>
                  <p className="mt-0.5 text-[14.5px] sm:text-[15px] text-fg-muted">
                    {edu.institution}
                    {edu.location ? <span className="text-fg-subtle"> · {edu.location}</span> : null}
                  </p>
                  {edu.description && <p className="mt-3 text-[14.5px] sm:text-[15px] leading-[1.6] text-fg-muted max-w-[64ch]">{edu.description}</p>}
                </div>
              </Reveal>
            ))}
          </ol>
        </section>
      )}

      {/* ------------------------------------------------------------------ next chapter */}
      <section id="cv-next" aria-labelledby="cv-next-h" className="cv-sec cv-railed cv-railed--end">
        <SectionHead n={ctaNum} label={resume.ctaEyebrow} />
        <div className="cv-body cv-rail">
          <div className="cv-entry cv-entry--wide">
            <span aria-hidden="true" className="cv-mark cv-mark--open" />
            <div className="min-w-0">
              <MaskText as="h2" id="cv-next-h" className="font-display text-[clamp(2.1rem,8.6vw,2.7rem)] sm:text-[clamp(2.4rem,4.6vw,4.4rem)] leading-[0.98] tracking-[-0.025em] text-fg max-w-[18ch]" lines={[<span key="h">{resume.cta?.heading}</span>]} />
              {resume.cta?.description && (
                <p className="mt-4 sm:mt-5 text-[15px] sm:text-[17px] leading-[1.6] text-fg-muted max-w-[48ch]">{resume.cta.description}</p>
              )}
              <div className="mt-7 action-pair">
                <Link href="/contact" className="btn btn-primary">
                  <span>{resume.cta?.buttonText || resume.ctaText}</span>
                  <ArrowUpRight className="w-4 h-4" />
                </Link>
                {pdfButton("btn btn-ghost", resume.pdfLabel)}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function SectionHead({ id, n, label }: { id?: string; n: string; label: string }) {
  return (
    <div className="cv-head">
      <p className="flex items-center gap-3 label-mono text-fg-subtle">
        <span className="text-accent">{n}</span>
        <span aria-hidden="true" className="h-px w-6 bg-line-strong" />
      </p>
      {id ? (
        <h2 id={id} className="mt-2 lg:mt-3 font-display text-[1.6rem] sm:text-[1.9rem] lg:text-[2.1rem] leading-none tracking-[-0.015em] text-fg">
          {label}
        </h2>
      ) : (
        <p className="mt-2 lg:mt-3 font-display italic text-[1.6rem] sm:text-[1.9rem] lg:text-[2.1rem] leading-none tracking-[-0.015em] text-fg-muted">{label}</p>
      )}
    </div>
  );
}

function ContactRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="cv-contact min-w-0">
      <dt className="label-mono text-fg-subtle">
        <span aria-hidden="true" className="cv-contact-node" />
        {label}
      </dt>
      <dd className="text-[14.5px] sm:text-[15px] text-fg min-w-0 [overflow-wrap:anywhere]">{children}</dd>
    </div>
  );
}
