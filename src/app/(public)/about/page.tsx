import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import SectionHead from "@/components/system/SectionHead";
import Reveal from "@/components/system/Reveal";
import MaskText from "@/components/system/MaskText";
import Chronology from "@/components/home/Chronology";
import EvolutionChapters from "@/components/about/EvolutionChapters";
import PrinciplesList from "@/components/about/PrinciplesList";
import { journeyForDisplay } from "@/lib/cms/fields";
import { getSiteContent, publicSiteClosed } from "@/lib/site-content";
import { pageMetadata } from "@/lib/page-metadata";

export function generateMetadata() {
  return pageMetadata("about", "/about");
}

export const revalidate = 3600;

const DEFAULT_PRINCIPLES = [
  { number: "01", title: "Architecture", statement: "Build systems that stay understandable." },
  { number: "02", title: "Experience", statement: "Make interfaces feel intentional." },
  { number: "03", title: "Performance", statement: "Keep complexity from reaching the user." },
  { number: "04", title: "Craft", statement: "Details matter." },
];

const DEFAULT_FOCUS_AREAS = [
  {
    title: "Web Applications",
    description: "Full-stack apps with Next.js, TypeScript, and MongoDB. Focused on clean state and reliable API routes.",
  },
  {
    title: "Interactive Interfaces",
    description: "Responsive layouts, micro-interactions, and fluid transitions that make software enjoyable to use.",
  },
  {
    title: "AI Integration",
    description: "Streaming responses, edge function workflows, and practical assistant tools inside web apps.",
  },
  {
    title: "Modern Web Architecture",
    description: "Modular component systems, Tailwind styling, and maintainable project structures.",
  },
];

/** CMS titles are often stored in capitals; present them in editorial case. */
function editorialCase(value: string) {
  if (value !== value.toUpperCase()) return value;
  return value.toLowerCase().replace(/(^|\s)\S/g, (c) => c.toUpperCase());
}

/** Split a heading so its final words carry italic emphasis. */
function splitEmphasis(text: string, tail = 1): [string, string] {
  const words = text.trim().split(/\s+/);
  if (words.length <= tail) return ["", text];
  return [words.slice(0, -tail).join(" "), words.slice(-tail).join(" ")];
}

export default async function AboutPage() {
  // maintenance, offline or unreadable content: the layout shows the maintenance screen
  if (await publicSiteClosed()) return null;

  const siteContent = await getSiteContent();
  const about = siteContent.about;

  const principles = about.principles?.length ? about.principles : DEFAULT_PRINCIPLES;
  const focusAreas = about.focusAreas?.length ? about.focusAreas : DEFAULT_FOCUS_AREAS;
  const location = siteContent.contact.location;
  const portrait = siteContent.assets.profilePhoto.url;
  const portraitAlt = siteContent.assets?.profilePhoto?.alt || "Rushan Siddiqui";

  const [titleHead, titleTail] = splitEmphasis(about.title || "About Rushan Siddiqui", 1);
  const progression = [
    about.progressionItem1 || "Interface",
    about.progressionItem2 || "Performance",
    about.progressionItem3 || "Systems",
  ];
  const metadataList = [
    about.metadataItem1 || "UI",
    about.metadataItem2 || "Frontend",
    about.metadataItem3 || "Backend",
    about.metadataItem4 || "Architecture",
  ].filter(Boolean);

  const lead =
    about.leadText ||
    "I build for the web, starting with interfaces and gradually moving deeper into the systems behind them.";
  const narrative =
    about.narrativeText ||
    "What began as an early curiosity with layouts and styling has grown into a disciplined focus on the entire web stack.";

  const [ctaHead, ctaTail] = splitEmphasis(about.ctaHeading || "Have something worth building?", 2);

  return (
    <div className="flex flex-col">
      {/* Opening — the profile as one editorial composition: heading, descriptor and the
          profile facts beside the portrait (desktop); on phones the facts and a smaller
          portrait share a row beneath the heading, so the whole profile reads in the first
          screen instead of the portrait starting cut off below it. */}
      <header className="relative mx-auto w-full max-w-[1600px] px-4 sm:px-6 lg:px-10 pt-[calc(env(safe-area-inset-top)+6.5rem)] sm:pt-[7.5rem] md:pt-[11.25rem] lg:pt-[clamp(8.5rem,17vh,12.25rem)]">
        <div className="flex items-center justify-between gap-4 label-mono text-fg-muted mb-8 sm:mb-12">
          <span className="inline-flex items-center gap-3">
            <span className="text-accent">01</span>
            <span className="h-px w-8 bg-line-strong" />
            <span>{about.eyebrow || "About"}</span>
          </span>
          <span aria-hidden="true" className="hidden sm:inline text-fg-subtle">
            RAWIN / v3
          </span>
        </div>

        <div className="grid grid-cols-12 gap-x-4 sm:gap-x-6 lg:gap-x-10 gap-y-8 sm:gap-y-10 items-end">
          <div className="col-span-12 lg:col-span-7 lg:row-start-1 self-start">
            <MaskText
              as="h1"
              immediate
              className="display-lg text-fg"
              lines={
                titleHead
                  ? [<span key="l0">{titleHead}</span>, <em key="t" className="italic text-accent">{titleTail}</em>]
                  : [<em key="t" className="italic text-accent">{titleTail}</em>]
              }
            />
            {about.subtitle && (
              <p className="mt-5 sm:mt-8 max-w-[52ch] text-[16px] sm:text-lg leading-relaxed text-fg-muted">{about.subtitle}</p>
            )}
          </div>

          <dl className="col-span-7 sm:col-span-7 lg:col-span-7 lg:row-start-2 self-center lg:self-end grid grid-cols-1 lg:grid-cols-3 lg:gap-x-8 border-t border-line">
            {[
              { label: "Based in", value: location },
              { label: "Practice", value: "Full stack · Interface" },
              { label: "Status", value: siteContent.home.heroBadge || "Open to work" },
            ].map((m) => (
              <div key={m.label} className="py-3 sm:py-3.5 border-b border-line">
                <dt className="label-mono text-fg-subtle">{m.label}</dt>
                <dd className="mt-1 sm:mt-1.5 text-[14px] sm:text-[15px] leading-snug text-fg">{m.value}</dd>
              </div>
            ))}
          </dl>

          <Reveal
            as="figure"
            className="col-span-5 lg:col-start-9 lg:col-span-4 lg:row-start-1 lg:row-span-2 self-center lg:self-end justify-self-end w-full lg:w-[min(100%,22rem,calc((100svh-16rem)*0.75))]"
          >
            <div data-field-surface="image" className="relative aspect-[3/4] w-full overflow-hidden rounded-[999px_999px_20px_20px] sm:rounded-[999px_999px_28px_28px] bg-sunken shadow-[var(--shadow-3)]">
              <Image
                src={portrait}
                alt={portraitAlt}
                fill
                unoptimized
                loading="eager"
                sizes="(min-width: 1024px) 22rem, 42vw"
                className="object-cover object-[50%_25%] grayscale contrast-[1.1]"
              />
              <div
                aria-hidden="true"
                className="absolute inset-0 mix-blend-soft-light opacity-70"
                style={{ background: "linear-gradient(200deg, var(--accent), transparent 50%, var(--mint))" }}
              />
            </div>
          </Reveal>
        </div>
      </header>

      {/* Chapter I — how I think: the narrative and the progression it leads to. Desktop: a
          compact label column (2/12) and a wide content column (10/12), so the heading and
          paragraph use the page width at comfortable measures (32ch / 66ch). Phones are
          unaffected: everything below lg is single-column as before. */}
      <section
        aria-labelledby="about-narrative"
        className="mx-auto w-full max-w-[1600px] px-4 sm:px-6 lg:px-10 mt-20 sm:mt-28 lg:mt-36 grid grid-cols-12 gap-x-4 lg:gap-x-10 gap-y-6"
      >
        <p id="about-narrative" className="col-span-12 lg:col-span-2 label-mono text-fg-muted lg:pt-3">
          <span className="text-accent mr-3">I.</span>
          {about.narrativeEyebrow || "How I think"}
        </p>
        <div className="col-span-12 lg:col-span-10 flex flex-col gap-12">
          <div>
            <MaskText
              as="p"
              className="font-display text-[clamp(1.75rem,3.6vw,3.4rem)] leading-[1.06] tracking-[-0.02em] about-lead text-fg max-w-[24ch] lg:max-w-[32ch]"
              lines={[lead]}
            />
            <Reveal delay={0.1}>
              <p className="mt-6 sm:mt-8 text-[15.5px] sm:text-[17px] leading-relaxed text-fg-muted max-w-[60ch] lg:max-w-[66ch] first-letter:font-display first-letter:text-[3.4em] first-letter:float-left first-letter:leading-[0.8] first-letter:mr-2 first-letter:mt-1 first-letter:text-fg">
                {narrative}
              </p>
            </Reveal>
          </div>

          {/* Progression chain: one line at every width (compacted on phones) */}
          <Reveal className="border-t border-line pt-6">
            <ol className="about-progression flex flex-nowrap sm:flex-wrap items-baseline gap-x-2 sm:gap-x-3 gap-y-2">
              {progression.map((step, i) => (
                <li key={step} className="flex items-baseline gap-1.5 sm:gap-3 whitespace-nowrap">
                  <span className="font-mono text-[10px] sm:text-[11px] text-fg-subtle">{String(i + 1).padStart(2, "0")}</span>
                  <span
                    className={`about-progression-word font-display text-[clamp(1.35rem,3vw,2.6rem)] leading-none ${
                      i === progression.length - 1 ? "italic text-accent" : "text-fg"
                    }`}
                  >
                    {editorialCase(step)}
                  </span>
                  {i < progression.length - 1 && <span aria-hidden="true" className="text-fg-subtle">→</span>}
                </li>
              ))}
            </ol>
            <ul className="about-chips mt-5 sm:mt-6 flex flex-nowrap sm:flex-wrap gap-1.5 sm:gap-2" aria-label="Disciplines">
              {metadataList.map((m) => (
                <li key={m} className="label-mono text-fg-muted px-3 py-1.5 rounded-full border border-line whitespace-nowrap">
                  {m}
                </li>
              ))}
            </ul>
          </Reveal>
        </div>
      </section>

      <div className="mx-auto w-full max-w-[1600px] px-4 sm:px-6 lg:px-10 flex flex-col gap-28 sm:gap-36 lg:gap-44 mt-28 sm:mt-36 lg:mt-44">
        {/* Chapter II — Evolution */}
        <section aria-labelledby="evolution-title">
          <SectionHead
            id="evolution-title"
            index="II."
            eyebrow={about.evolutionEyebrow || "A record of the build"}
            title={(() => {
              const [h, t] = splitEmphasis(about.evolutionHeading || "From a first HTML page to a full engineering platform.", 2);
              return [<span key="l1">{h}</span>, <em key="e" className="italic text-accent">{t}</em>];
            })()}
            aside={about.evolutionDescription}
            className="mb-14 sm:mb-20"
          />
          <EvolutionChapters milestones={about.evolution} labels={about.milestoneLabels} />
        </section>

        {/* Chapter III — Principles */}
        <section aria-labelledby="principles-title">
          <SectionHead
            id="principles-title"
            index="III."
            eyebrow={about.principlesEyebrow || "How I build"}
            title={[<span key="l2">{about.principlesHeading || "A few principles I keep close."}</span>]}
            aside={about.principlesDescription}
            className="mb-12 sm:mb-16"
          />
          <PrinciplesList
            principles={principles.map((p) => ({ number: p.number, title: p.title, statement: p.statement }))}
            titles={principles.map((p) => editorialCase(p.title))}
          />
        </section>

        {/* Chapter IV — Journey */}
        <section aria-labelledby="journey-title">
          <SectionHead
            id="journey-title"
            index="IV."
            eyebrow={about.journeyEyebrow || "Engineering journey"}
            title={[<span key="l3">{editorialCase(about.journeyHeading || "Engineering journey")}</span>]}
            aside={about.journeyDescription}
            className="mb-6 sm:mb-10"
          />
          <Chronology items={journeyForDisplay(about.journey)} />
        </section>

        {/* Chapter V — Focus */}
        <section aria-labelledby="focus-title">
          <SectionHead
            id="focus-title"
            index="V."
            eyebrow={about.focusEyebrow || "Current focus"}
            title={[<span key="l4">{about.focusHeading || "What I'm building toward."}</span>]}
            aside={about.focusDescription}
            className="mb-12 sm:mb-16"
          />
          <ul className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-px bg-line border border-line rounded-[24px] overflow-hidden">
            {focusAreas.map((f, i) => (
              <Reveal
                as="li"
                key={f.title || i}
                delay={i * 0.05}
                className="bg-bg px-4 py-5 sm:p-8 flex flex-row items-baseline gap-3.5 sm:flex-col sm:items-stretch sm:gap-10 sm:min-h-[260px]"
              >
                {/* phones: the number sits beside its title on the same baseline; from sm it heads the card */}
                <span className="font-mono text-[11px] text-accent shrink-0 w-5 sm:w-auto">{String(i + 1).padStart(2, "0")}</span>
                <div className="min-w-0 sm:mt-auto">
                  <h3 className="type-content sm:text-[1.9rem] text-fg">{editorialCase(f.title)}</h3>
                  <p className="mt-1.5 sm:mt-3 text-sm text-fg-muted leading-relaxed">{f.description}</p>
                </div>
              </Reveal>
            ))}
          </ul>
        </section>

        {/* Closing */}
        <section aria-labelledby="about-cta" className="relative">
          <p className="label-mono text-fg-muted mb-8">
            <span className="text-accent mr-3">VI.</span>
            {about.ctaEyebrow || "Let's build together"}
          </p>
          <MaskText
            as="h2"
            className="display-lg text-fg max-w-[16ch]"
            lines={ctaHead ? [<span key="l5">{ctaHead}</span>, <em key="e" className="italic text-accent">{ctaTail}</em>] : [ctaTail]}
          />
          <div className="mt-10 flex flex-col md:flex-row md:items-end md:justify-between gap-8">
            <p className="text-[17px] text-fg-muted max-w-[46ch]">
              {about.ctaDescription || "Open to full-time roles, freelance projects, and collaborations."}
            </p>
            <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-x-5 gap-y-3">
              <div className="action-pair">
                <Link href="/contact" className="btn btn-primary">
                  <span>{about.ctaContactText || "Get in Touch"}</span>
                  <ArrowUpRight className="w-4 h-4" />
                </Link>
                <Link href="/resume" className="btn btn-ghost">
                  <span>{about.ctaResumeText || "View Resume"}</span>
                </Link>
              </div>
              <Link href="/projects" className="group inline-flex items-center gap-2 min-h-11 w-fit text-sm font-medium text-fg">
                <span className="link-draw">View projects</span>
                <ArrowUpRight className="w-4 h-4 transition-transform group-hover:rotate-45" />
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
