"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { AnimatePresence, LayoutGroup, motion, useMotionValue, useSpring } from "framer-motion";
import { useReducedMotionSafe } from "@/lib/useReducedMotionSafe";
import { ArrowUpRight } from "lucide-react";
import type { Project } from "@/lib/projects";
import ProjectVisual from "./ProjectVisual";
import ProjectArchive from "./ProjectArchive";
import { GithubIcon } from "@/components/SocialIcons";
import { STATUS_LABEL, STATUS_TONE, buildCategoryRail } from "./project-meta";
import { EASE_EDITORIAL, LAYOUT_SPRING } from "@/lib/motion";

type View = "exhibit" | "index";

interface ProjectsExplorerProps {
  projects: Project[];
  categories?: string[];
}

export default function ProjectsExplorer({ projects, categories = [] }: ProjectsExplorerProps) {
  const reduced = useReducedMotionSafe();
  const [active, setActive] = useState<string>("All");
  const [view, setView] = useState<View>("exhibit");
  const rail = useMemo(() => buildCategoryRail(projects, categories), [projects, categories]);
  const filtered = active === "All" ? projects : projects.filter((p) => p.category === active);

  return (
    <div>
      {/* Control bar: part of the page flow (it used to stick over the gallery while scrolling) */}
      <div className="mb-10 sm:mb-16">
        <div className="glass-fallback rounded-[20px] sm:rounded-full p-1.5 flex flex-col sm:flex-row sm:items-center gap-1.5">
          <LayoutGroup id="project-filter">
            <div
              role="group"
              aria-label="Filter projects by category"
              className="flex-1 flex items-center gap-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            >
              {[{ name: "All", count: projects.length }, ...rail].map((c) => {
                const selected = active === c.name;
                return (
                  <button
                    key={c.name}
                    type="button"
                    onClick={() => setActive(c.name)}
                    aria-pressed={selected}
                    className={`relative shrink-0 inline-flex items-center gap-2 h-10 px-4 rounded-full text-[13px] font-medium transition-colors ${
                      selected ? "text-inverse-fg" : "text-fg-muted hover:text-fg"
                    }`}
                  >
                    {selected && (
                      <motion.span
                        layoutId="project-filter-pill"
                        className="absolute inset-0 rounded-full bg-inverse"
                        transition={reduced ? { duration: 0 } : LAYOUT_SPRING}
                      />
                    )}
                    <span className="relative">{c.name}</span>
                    <span className={`relative font-mono text-[10px] ${selected ? "opacity-60" : "opacity-50"}`}>{c.count}</span>
                  </button>
                );
              })}
            </div>
          </LayoutGroup>
          <div role="group" aria-label="Layout" className="hidden sm:flex items-center gap-0.5 p-0.5 rounded-full border border-line shrink-0">
            {(["exhibit", "index"] as View[]).map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setView(v)}
                aria-pressed={view === v}
                className={`h-9 px-3.5 rounded-full label-mono transition-colors ${
                  view === v ? "bg-surface-2 text-fg" : "text-fg-subtle hover:text-fg"
                }`}
              >
                {v}
              </button>
            ))}
          </div>
        </div>
      </div>

      <p className="sr-only" aria-live="polite">
        Showing {filtered.length} project{filtered.length === 1 ? "" : "s"}
        {active !== "All" ? ` in ${active}` : ""}.
      </p>

      {filtered.length === 0 ? (
        <div className="border-y border-line py-20 text-center">
          <p className="font-display italic text-3xl text-fg">Nothing filed here yet.</p>
          <button type="button" onClick={() => setActive("All")} className="mt-4 text-sm text-fg-muted link-draw">
            Show every project
          </button>
        </div>
      ) : view === "index" ? (
        <IndexView projects={filtered} />
      ) : (
        <>
        {/* Phones: the archive presentation (same filtered list); keyed by filter so its
            reading observer always tracks the cards on screen */}
        <div className="sm:hidden">
          <ProjectArchive key={active} projects={filtered} />
        </div>
        <ol className="hidden sm:flex flex-col gap-24 sm:gap-32 lg:gap-40">
          <AnimatePresence mode="popLayout" initial={false}>
            {filtered.map((p, i) => (
              <motion.li
                key={p._id || p.slug}
                layout={!reduced}
                initial={reduced ? false : { opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reduced ? undefined : { opacity: 0, y: -20 }}
                transition={{ duration: 0.7, ease: EASE_EDITORIAL }}
              >
                <Exhibit project={p} index={i} />
              </motion.li>
            ))}
          </AnimatePresence>
        </ol>
        </>
      )}
    </div>
  );
}

function Exhibit({ project: p, index }: { project: Project; index: number }) {
  const flip = index % 2 === 1;
  const href = `/projects/${p.slug}`;
  return (
    <article className="group grid grid-cols-12 gap-x-4 lg:gap-x-10 gap-y-8 items-end" aria-labelledby={`p-${p.slug}`}>
      <Link
        href={href}
        className={`col-span-12 lg:col-span-7 block ${flip ? "lg:order-2" : ""}`}
        aria-label={`Open ${p.title} case study`}
        tabIndex={-1}
      >
        <ProjectVisual
          project={p}
          priority={index === 0}
          className="w-full aspect-[4/3] sm:aspect-[16/10] rounded-[24px] sm:rounded-[32px] border border-line shadow-[var(--shadow-2)] transition-shadow duration-700 group-hover:shadow-[var(--shadow-3)]"
          sizes="(min-width: 1024px) 58vw, 100vw"
        />
      </Link>
      <div className={`col-span-12 lg:col-span-5 ${flip ? "lg:order-1" : ""}`}>
        <div className="flex items-center justify-between gap-4 label-mono text-fg-subtle">
          <span>
            <span className="text-accent">{String(index + 1).padStart(2, "0")}</span>
            <span className="mx-2">/</span>
            {p.category}
          </span>
          <span>{p.year}</span>
        </div>
        <h2 id={`p-${p.slug}`} className="mt-5 font-display text-[clamp(2.6rem,5.4vw,5rem)] leading-[0.92] tracking-[-0.03em] text-fg">
          <Link href={href} className="transition-[font-style] group-hover:italic">
            {p.title}
          </Link>
        </h2>
        {p.tagline && <p className="mt-4 font-display italic text-xl sm:text-2xl text-accent leading-snug">{p.tagline}</p>}
        <p className="mt-5 text-[15px] sm:text-base text-fg-muted leading-relaxed line-clamp-4">{p.description}</p>

        <dl className="mt-7 grid grid-cols-2 gap-x-6 border-t border-line">
          <div className="py-3 border-b border-line">
            <dt className="label-mono text-fg-subtle">Status</dt>
            <dd className={`mt-1 text-sm inline-flex items-center gap-2 ${STATUS_TONE[p.status]}`}>
              <span className="w-1.5 h-1.5 rounded-full bg-current" />
              <span className="text-fg">{STATUS_LABEL[p.status]}</span>
            </dd>
          </div>
          <div className="py-3 border-b border-line">
            <dt className="label-mono text-fg-subtle">Role</dt>
            <dd className="mt-1 text-sm text-fg truncate">{p.role || "Design & engineering"}</dd>
          </div>
        </dl>

        {p.technologies.length > 0 && (
          <ul className="mt-5 flex flex-wrap gap-x-4 gap-y-1.5" aria-label="Technologies">
            {p.technologies.slice(0, 8).map((t) => (
              <li key={t} className="font-mono text-[12px] text-fg-muted">
                <span className="text-accent">/</span> {t}
              </li>
            ))}
          </ul>
        )}

        <div className="mt-8 flex flex-wrap items-center gap-3">
          <Link href={href} className="btn btn-primary btn-sm">
            <span>Case study</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
          {p.liveUrl && (
            <a href={p.liveUrl} target="_blank" rel="noopener noreferrer" className="btn btn-ghost btn-sm" aria-label={`Visit ${p.title} live site (opens in a new tab)`}>
              <span>Live</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </a>
          )}
          {p.githubUrl && (
            <a href={p.githubUrl} target="_blank" rel="noopener noreferrer" className="btn btn-ghost btn-sm" aria-label={`View ${p.title} source on GitHub (opens in a new tab)`}>
              <GithubIcon className="w-3.5 h-3.5" />
              <span>Source</span>
            </a>
          )}
        </div>
      </div>
    </article>
  );
}

function IndexView({ projects }: { projects: Project[] }) {
  const reduced = useReducedMotionSafe();
  const [hover, setHover] = useState<number | null>(null);
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const x = useSpring(mx, { stiffness: 200, damping: 26, mass: 0.5 });
  const y = useSpring(my, { stiffness: 200, damping: 26, mass: 0.5 });

  return (
    <div
      className="relative"
      onPointerMove={(e) => {
        if (e.pointerType !== "mouse") return;
        const r = e.currentTarget.getBoundingClientRect();
        mx.set(e.clientX - r.left);
        my.set(e.clientY - r.top);
      }}
      onPointerLeave={() => setHover(null)}
    >
      <div className="hidden md:grid grid-cols-12 gap-4 pb-3 label-mono text-fg-subtle border-b border-line-strong">
        <span className="col-span-1">No.</span>
        <span className="col-span-5">Project</span>
        <span className="col-span-3">Category</span>
        <span className="col-span-2">Status</span>
        <span className="col-span-1 text-right">Year</span>
      </div>
      <ol>
        {projects.map((p, i) => (
          <li key={p._id || p.slug} className="border-b border-line">
            <Link
              href={`/projects/${p.slug}`}
              onPointerEnter={() => setHover(i)}
              onFocus={() => setHover(i)}
              onBlur={() => setHover(null)}
              className="group grid grid-cols-12 gap-x-4 gap-y-1 items-baseline py-5 md:py-6"
            >
              <span className="col-span-2 md:col-span-1 font-mono text-[11px] text-fg-subtle">{String(i + 1).padStart(2, "0")}</span>
              <span className="col-span-10 md:col-span-5 font-display text-[clamp(1.8rem,3vw,2.6rem)] leading-none tracking-[-0.02em] text-fg transition-transform duration-500 group-hover:translate-x-2 group-hover:italic">
                {p.title}
              </span>
              <span className="col-start-3 col-span-10 md:col-start-auto md:col-span-3 text-sm text-fg-muted">{p.category}</span>
              <span className={`hidden md:inline-flex col-span-2 items-center gap-2 text-sm ${STATUS_TONE[p.status]}`}>
                <span className="w-1.5 h-1.5 rounded-full bg-current" />
                <span className="text-fg-muted">{STATUS_LABEL[p.status]}</span>
              </span>
              <span className="hidden md:block col-span-1 text-right font-mono text-[12px] text-fg-muted">{p.year}</span>
            </Link>
          </li>
        ))}
      </ol>
      {!reduced && (
        <motion.div aria-hidden="true" className="hidden lg:block pointer-events-none absolute left-0 top-0 z-20" style={{ x, y }}>
          <div className="absolute w-[340px] aspect-[16/10] translate-x-8 -translate-y-1/2">
            <AnimatePresence>
              {hover !== null && projects[hover] && (
                <motion.div
                  key={projects[hover].slug}
                  className="absolute inset-0 overflow-hidden rounded-2xl shadow-[var(--shadow-3)]"
                  initial={{ opacity: 0, scale: 0.9, rotate: -2 }}
                  animate={{ opacity: 1, scale: 1, rotate: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.45, ease: EASE_EDITORIAL }}
                >
                  <ProjectVisual project={projects[hover]} className="absolute inset-0" sizes="340px" />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      )}
    </div>
  );
}
