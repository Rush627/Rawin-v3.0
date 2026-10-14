import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
import { getProjectBySlug, getProjects } from "@/lib/projects";
import ProjectVisual from "@/components/work/ProjectVisual";
import MaskText from "@/components/system/MaskText";
import Reveal from "@/components/system/Reveal";
import { GithubIcon } from "@/components/SocialIcons";
import { STATUS_LABEL, STATUS_TONE } from "@/components/work/project-meta";
import { resolveTone, TONE_SWATCH } from "@/lib/project-tone";
import { publicSiteClosed } from "@/lib/site-content";
import { CLOSED_METADATA } from "@/lib/page-metadata";
import ContentUnavailable from "@/components/system/ContentUnavailable";

interface ProjectPageProps {
  params: Promise<{ slug: string }>;
}

export const revalidate = 3600;

export async function generateStaticParams() {
  try {
    const projects = await getProjects();
    return projects.filter((p) => p.slug).map((p) => ({ slug: p.slug }));
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }: ProjectPageProps): Promise<Metadata> {
  if (await publicSiteClosed()) return CLOSED_METADATA;
  const { slug } = await params;
  // unreadable (not missing): described as unavailable, never as "not found"
  const project = await getProjectBySlug(slug).catch(() => undefined);
  if (project === undefined) return CLOSED_METADATA;
  if (!project) return { title: "Project Not Found | RAWIN 3.0" };
  return {
    title: `${project.title} | RAWIN Projects`,
    description: project.tagline || project.description.slice(0, 160),
    alternates: { canonical: `/projects/${project.slug}` },
    openGraph: {
      url: `/projects/${project.slug}`,
      title: project.title,
      description: project.tagline || project.description.slice(0, 160),
      images: project.previewImage && project.previewImage !== "/images/profile.png" ? [project.previewImage] : undefined,
    },
  };
}

const CHAPTERS = [
  { key: "problem", label: "The problem" },
  { key: "solution", label: "The approach" },
  { key: "role", label: "My role" },
  { key: "outcome", label: "Outcome" },
] as const;

export default async function ProjectPage({ params }: ProjectPageProps) {
  // maintenance, offline or unreadable content: the layout shows the maintenance screen
  if (await publicSiteClosed()) return null;

  const { slug } = await params;
  // unreadable data: a short-lived "temporarily unavailable" screen, never a cached 404
  const loaded = await Promise.all([getProjectBySlug(slug), getProjects()]).catch(() => null);
  if (!loaded) return <ContentUnavailable />;
  const [project, all] = loaded;
  if (!project) notFound();

  const idx = all.findIndex((p) => p.slug === project.slug);
  const next = all.length > 1 ? all[(idx + 1 + all.length) % all.length] : null;
  const sw = TONE_SWATCH[resolveTone(project)];
  // One line that wraps only when the name needs it (no forced break before the last word);
  // the final word keeps its italic emphasis.
  const words = project.title.trim().split(/\s+/);
  const titleLines = [
    <span key="t">
      {words.length > 1 ? (
        <>
          {words.slice(0, -1).join(" ")} <em className="italic">{words[words.length - 1]}</em>
        </>
      ) : (
        project.title
      )}
    </span>,
  ];
  const chapters = CHAPTERS.filter((c) => (project[c.key] || "").trim());

  return (
    <article className="relative flex flex-col">
      {/* Tonal wash behind the opening — the project's own colour */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-[90vh] opacity-40 dark:opacity-30"
        style={{ background: `radial-gradient(70% 60% at 80% 0%, ${sw.b}, transparent 70%)` }}
      />

      <header className="relative mx-auto w-full max-w-[1600px] px-4 sm:px-6 lg:px-10 pt-[calc(env(safe-area-inset-top)+10.25rem)] sm:pt-[11.25rem] lg:pt-[12.25rem]">
        <nav aria-label="Breadcrumb" className="flex items-center justify-between gap-4 label-mono text-fg-muted mb-7 sm:mb-12">
          <Link href="/projects" className="group inline-flex items-center gap-2 hover:text-fg transition-colors">
            <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-0.5" />
            <span>Projects</span>
            <span className="text-fg-subtle">/</span>
            <span className="text-accent">{project.category}</span>
          </Link>
          <span className="hidden sm:inline text-fg-subtle">
            {String(idx + 1).padStart(2, "0")} / {String(all.length).padStart(2, "0")}
          </span>
        </nav>

        {/* Title across the full measure (it wraps only when the name needs it); beneath it the
            tagline + actions and the metadata share one row on desktop, so the opening uses the
            width instead of stacking a narrow title over an empty right side. */}
        <MaskText as="h1" immediate className="case-title text-fg" lines={titleLines} />

        <div className="mt-5 sm:mt-8 lg:mt-10 grid grid-cols-12 gap-x-4 lg:gap-x-10 gap-y-7 lg:items-end">
          <div className="col-span-12 lg:col-span-7">
            {project.tagline && (
              <p className="font-display italic text-[clamp(1.3rem,2.4vw,2.1rem)] leading-tight text-accent max-w-[34ch]">
                {project.tagline}
              </p>
            )}
          </div>
          <dl className="col-span-12 lg:col-span-5 grid grid-cols-2 lg:grid-cols-3 gap-x-6 border-t border-line">
            <div className="py-3 sm:py-3.5 border-b border-line">
              <dt className="label-mono text-fg-subtle">Year</dt>
              <dd className="mt-1.5 text-[15px] text-fg whitespace-nowrap">{project.year}</dd>
            </div>
            <div className="py-3 sm:py-3.5 border-b border-line">
              <dt className="label-mono text-fg-subtle">Status</dt>
              <dd className={`mt-1.5 text-[15px] inline-flex items-center gap-2 whitespace-nowrap ${STATUS_TONE[project.status]}`}>
                <span className="w-1.5 h-1.5 rounded-full bg-current" />
                <span className="text-fg">{STATUS_LABEL[project.status]}</span>
              </dd>
            </div>
            <div className="py-3 sm:py-3.5 border-b border-line col-span-2 lg:col-span-1">
              <dt className="label-mono text-fg-subtle">Discipline</dt>
              <dd className="mt-1.5 text-[15px] text-fg [text-wrap:balance]">{project.category}</dd>
            </div>
          </dl>
        </div>

        <div className="mt-7 sm:mt-10 action-pair">
          {project.liveUrl && (
            <a href={project.liveUrl} target="_blank" rel="noopener noreferrer" className="btn btn-primary">
              <span>Visit live site</span>
              <ArrowUpRight className="w-4 h-4" />
            </a>
          )}
          {project.githubUrl && (
            <a href={project.githubUrl} target="_blank" rel="noopener noreferrer" className="btn btn-ghost">
              <GithubIcon className="w-4 h-4" />
              <span>Source code</span>
            </a>
          )}
        </div>
      </header>

      {/* Plate */}
      <Reveal className="relative mx-auto w-full max-w-[1600px] px-4 sm:px-6 lg:px-10 mt-10 sm:mt-16">
        <ProjectVisual
          project={project}
          priority
          className="w-full aspect-[4/3] sm:aspect-[16/9] rounded-[24px] sm:rounded-[36px] border border-line shadow-[var(--shadow-3)]"
          sizes="(min-width: 1600px) 1520px, 100vw"
        />
      </Reveal>

      {/* Overview */}
      {/* Overview: label column + a wide introduction on the case-study grid (shared with the
          chapters below); a reading size on phones, an editorial one on desktop */}
      <section className="mx-auto w-full max-w-[1600px] px-4 sm:px-6 lg:px-10 mt-16 sm:mt-24 grid grid-cols-12 gap-x-4 lg:gap-x-10 gap-y-5 sm:gap-y-8">
        <p className="col-span-12 lg:col-span-3 label-mono text-fg-muted lg:pt-2">
          <span className="text-accent mr-3">00</span>Overview
        </p>
        <div className="col-span-12 lg:col-span-9">
          <p className="case-overview font-display text-fg">{project.description}</p>
        </div>
      </section>

      {/* Chapters */}
      {chapters.length > 0 && (
        <section aria-label="Case study" className="mx-auto w-full max-w-[1600px] px-4 sm:px-6 lg:px-10 mt-16 sm:mt-24">
          <ol className="border-t border-line">
            {chapters.map((c, i) => (
              <Reveal as="li" key={c.key} className="grid grid-cols-12 gap-x-4 lg:gap-x-10 gap-y-3 sm:gap-y-4 py-8 sm:py-14 border-b border-line">
                <h2 className="col-span-12 lg:col-span-3 flex items-baseline gap-3">
                  <span className="font-mono text-[11px] text-accent">{String(i + 1).padStart(2, "0")}</span>
                  <span className="font-display text-[clamp(1.8rem,2.6vw,2.4rem)] leading-none text-fg">{c.label}</span>
                </h2>
                <p className="col-span-12 lg:col-start-4 lg:col-span-8 xl:col-span-7 text-[16px] sm:text-[17px] leading-relaxed text-fg-muted whitespace-pre-line max-w-[68ch]">
                  {project[c.key]}
                </p>
              </Reveal>
            ))}
          </ol>
        </section>
      )}

      {/* Stack & focus */}
      {(project.technologies.length > 0 || (project.engineeringFocus?.length ?? 0) > 0) && (
        // The page gutter and the panel are separate elements: painting the panel's divider
        // colour on the padded container is what produced grey bars down both sides.
        <section aria-label="Technology and developer focus" className="mx-auto w-full max-w-[1600px] px-4 sm:px-6 lg:px-10 mt-16 sm:mt-24">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-line border border-line rounded-[22px] sm:rounded-[24px] overflow-hidden">
            {project.technologies.length > 0 && (
              <div className="bg-bg p-5 sm:p-10">
                <h2 className="label-mono text-fg-subtle">Technology</h2>
                <ul className="mt-4 sm:mt-6 flex flex-wrap gap-2">
                  {project.technologies.map((t) => (
                    <li key={t} className="px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-full border border-line-strong text-[13px] sm:text-sm text-fg">
                      {t}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {(project.engineeringFocus?.length ?? 0) > 0 && (
              <div className="bg-bg p-5 sm:p-10">
                <h2 className="label-mono text-fg-subtle">Developer focus</h2>
                <ul className="mt-3 sm:mt-6 flex flex-col">
                  {project.engineeringFocus!.map((f, i) => (
                    <li key={f} className="flex items-baseline gap-4 py-3 border-t border-line first:border-t-0 text-[15px] text-fg">
                      <span className="font-mono text-[11px] text-accent shrink-0">{String(i + 1).padStart(2, "0")}</span>
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Next project */}
      {next && next.slug !== project.slug && (
        <nav aria-label="Next project" className="mx-auto w-full max-w-[1600px] px-4 sm:px-6 lg:px-10 mt-20 sm:mt-28">
          <Link href={`/projects/${next.slug}`} className="group grid grid-cols-12 gap-x-4 lg:gap-x-10 gap-y-6 md:items-center border-t border-line-strong pt-7 sm:pt-8">
            <div className="col-span-12 md:col-span-7">
              <span className="label-mono text-fg-subtle">Next project</span>
              <p className="mt-3 sm:mt-4 case-next-title text-fg transition-[font-style] group-hover:italic">{next.title}</p>
              <span className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-fg">
                <span className="link-draw">Continue</span>
                <ArrowUpRight className="w-4 h-4 transition-transform group-hover:rotate-45" />
              </span>
            </div>
            <ProjectVisual
              project={next}
              className="col-span-12 md:col-span-5 aspect-[16/10] rounded-[22px] border border-line"
              sizes="(min-width: 768px) 40vw, 100vw"
            />
          </Link>
        </nav>
      )}
    </article>
  );
}
