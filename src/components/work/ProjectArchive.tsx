"use client";

import { useCallback, useEffect, useRef, type CSSProperties, type MouseEvent } from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { Project } from "@/lib/projects";
import ProjectVisual from "./ProjectVisual";
import { getLenis } from "@/components/shell/nav-items";
import { indexForProgress, progressForIndex, spinePath, wheelKeyframes, type WheelGeometry } from "./wheel-geometry";

type ViewTimelineCtor = new (options: { subject: Element; axis?: "block" | "inline" }) => AnimationTimeline;

/**
 * Phone presentation of the project exhibit: a wheel of project panels driven by the page's
 * own (native) scroll. The section is tall and its stage sticky; the scroll through the
 * section turns the wheel.
 *
 * Motion: every panel and node gets one Web Animation of transform + opacity whose keyframes
 * sample the wheel (built once per viewport size). Where scroll-linked timelines exist the
 * animations are bound to the section's view timeline, so the compositor moves the wheel in
 * step with the finger with no per-frame JavaScript or style work; elsewhere one passive
 * scroll handler seeks the same animations. Turning the wheel never re-renders React: the
 * selected project's markers (data-active, aria-current, counter, live region) are written
 * straight to the few elements that change. When a gesture ends the wheel settles on the
 * nearest project.
 *
 * Each panel is deliberately compact (preview, name, arrow); descriptions and Live/Source links
 * live on the desktop exhibit, the Index view and the case study.
 *
 * Nothing intercepts touch: swipes are ordinary page scrolling, taps are ordinary links.
 * Tapping the selected panel opens its case study; tapping a neighbour turns the wheel to it;
 * keyboard focus turns the wheel to the focused project.
 */
export default function ProjectArchive({ projects }: { projects: Project[] }) {
  const n = projects.length;
  const sectionRef = useRef<HTMLElement | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const spineRef = useRef<SVGPathElement | null>(null);
  const cardRefs = useRef<(HTMLLIElement | null)[]>([]);
  const nodeRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const counterRef = useRef<HTMLSpanElement | null>(null);
  const liveRef = useRef<HTMLParagraphElement | null>(null);
  const activeRef = useRef(-1);
  const turningUntil = useRef(0);
  /** Cached section geometry (document coordinates), refreshed on resize: no per-frame reads */
  const metrics = useRef({ top: 0, travel: 1 });

  const measure = useCallback(() => {
    const section = sectionRef.current;
    if (!section) return;
    const top = section.getBoundingClientRect().top + window.scrollY;
    // the view timeline's "contain" range: from the section's top reaching the viewport top
    // to its bottom reaching the viewport bottom
    const travel = Math.max(1, section.offsetHeight - window.innerHeight);
    metrics.current = { top, travel };
  }, []);

  const progress = useCallback(() => {
    const { top, travel } = metrics.current;
    return (window.scrollY - top) / travel; // 0..1 across the wheel (unclamped)
  }, []);

  const turnTo = useCallback(
    (i: number) => {
      const target = Math.round(progressForIndex(i, n) * Math.max(0, n - 1));
      const { top, travel } = metrics.current;
      const y = top + progressForIndex(i, n) * travel;
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      turningUntil.current = performance.now() + (reduced ? 100 : 450 + 250 * Math.abs(target - activeRef.current));
      const lenis = getLenis();
      if (lenis) lenis.scrollTo(y, { immediate: reduced });
      else window.scrollTo({ top: y, behavior: reduced ? "auto" : "smooth" });
    },
    [n]
  );

  useEffect(() => {
    const section = sectionRef.current;
    const stage = stageRef.current;
    if (!section || !stage || n === 0) return;

    // a rebuilt wheel (new collection, e.g. after a CMS update) re-marks its selection from scratch
    activeRef.current = -1;
    const VT = (window as unknown as { ViewTimeline?: ViewTimelineCtor }).ViewTimeline;
    const reducedMq = window.matchMedia("(prefers-reduced-motion: reduce)");
    let anims: Animation[] = [];
    let linked = false; // animations bound to a scroll timeline (compositor-driven)
    let raf = 0;
    let settleTimer = 0;
    let listening = false;

    /** Mark the selected project on the few elements that change (no React render). */
    const select = (idx: number) => {
      if (idx === activeRef.current) return;
      activeRef.current = idx;
      for (let i = 0; i < n; i++) {
        const card = cardRefs.current[i];
        const node = nodeRefs.current[i];
        const on = i === idx;
        if (card) {
          card.toggleAttribute("data-active", on);
          card.toggleAttribute("data-far", Math.abs(i - idx) > 2);
          card.querySelector(".project-dial-card > a")?.toggleAttribute("aria-current", on);
        }
        node?.toggleAttribute("data-active", on);
      }
      if (counterRef.current) counterRef.current.textContent = String(idx + 1).padStart(2, "0");
      if (liveRef.current) liveRef.current.textContent = `Selected project ${idx + 1} of ${n}: ${projects[idx]?.title ?? ""}`;
    };

    /** Discrete work only: selected project, and (fallback) seeking the paused animations. */
    const sync = () => {
      raf = 0;
      const pr = Math.max(0, Math.min(1, progress()));
      if (!linked) for (const a of anims) a.currentTime = pr * 1000;
      select(indexForProgress(pr, n));
    };

    const build = () => {
      anims.forEach((a) => a.cancel());
      anims = [];
      measure();
      const firstCard = cardRefs.current[0];
      const g: WheelGeometry = { W: stage.clientWidth, H: stage.clientHeight, cw: firstCard?.offsetWidth || stage.clientWidth * 0.8 };
      if (g.W < 2 || g.H < 2) return; // hidden (wider viewports): nothing to animate
      const reduced = reducedMq.matches;
      spineRef.current?.setAttribute("d", spinePath(g, reduced));

      const timeline = VT ? new VT({ subject: section, axis: "block" }) : null;
      linked = Boolean(timeline);
      const opts = (
        timeline
          ? { timeline, rangeStart: "contain 0%", rangeEnd: "contain 100%", fill: "both", easing: "linear" }
          : { duration: 1000, fill: "both", easing: "linear" }
      ) as KeyframeAnimationOptions;

      for (let i = 0; i < n; i++) {
        const { card: cardFrames, node: nodeFrames } = wheelKeyframes(i, n, g, reduced);
        const card = cardRefs.current[i];
        const node = nodeRefs.current[i];
        if (card) anims.push(card.animate(cardFrames, opts));
        if (node) anims.push(node.animate(nodeFrames, opts));
      }
      if (!linked) anims.forEach((a) => a.pause());
      sync();
    };

    // After a gesture (and its momentum) ends inside the wheel, come to rest on a project.
    const settle = () => {
      if (performance.now() < turningUntil.current) {
        settleTimer = window.setTimeout(settle, 160);
        return;
      }
      if (n < 2) return;
      const raw = progress() * (n - 1);
      if (raw <= 0.02 || raw >= n - 1 - 0.02) return; // at either end: the page carries on
      const nearest = Math.round(raw);
      if (Math.abs(raw - nearest) > 0.02) turnTo(nearest);
    };

    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(sync);
      window.clearTimeout(settleTimer);
      settleTimer = window.setTimeout(settle, 160);
    };

    // Listen only while the wheel is on screen (it is display:none on wider viewports)
    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !listening) {
        listening = true;
        window.addEventListener("scroll", onScroll, { passive: true });
        if (!anims.length) build();
        else {
          measure();
          sync();
        }
      } else if (!entry.isIntersecting && listening) {
        listening = false;
        window.removeEventListener("scroll", onScroll);
      }
    });
    io.observe(section);

    // Rebuild only when the stage's size really changes (rotation, breakpoint), not on every
    // mobile toolbar show/hide
    let lastW = 0;
    let lastH = 0;
    let resizeTimer = 0;
    const ro = new ResizeObserver(() => {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(() => {
        const W = stage.clientWidth;
        const H = stage.clientHeight;
        if (Math.abs(W - lastW) < 1 && Math.abs(H - lastH) < 60) {
          measure();
          return;
        }
        lastW = W;
        lastH = H;
        build();
      }, 120);
    });
    ro.observe(stage);
    const onReduced = () => build();
    reducedMq.addEventListener?.("change", onReduced);

    return () => {
      io.disconnect();
      ro.disconnect();
      reducedMq.removeEventListener?.("change", onReduced);
      window.removeEventListener("scroll", onScroll);
      window.clearTimeout(settleTimer);
      window.clearTimeout(resizeTimer);
      if (raf) cancelAnimationFrame(raf);
      anims.forEach((a) => a.cancel());
    };
  }, [n, projects, measure, progress, turnTo]);

  const onCardClick = (i: number) => (e: MouseEvent) => {
    if (i === activeRef.current) return; // the selected panel opens its case study
    e.preventDefault();
    turnTo(i);
  };

  if (n === 0) return null;

  return (
    <section ref={sectionRef} aria-label="Projects" className="project-dial relative" style={{ "--n": n } as CSSProperties}>
      <div ref={stageRef} className="project-dial-stage">
        <svg aria-hidden="true" className="project-dial-spine" fill="none">
          <path ref={spineRef} stroke="currentColor" strokeWidth="1" />
        </svg>
        <div aria-hidden="true" className="project-dial-nodes">
          {projects.map((p, i) => (
            <span
              key={p._id || p.slug}
              ref={(el) => {
                nodeRefs.current[i] = el;
              }}
              className="project-dial-node"
              data-active={i === 0 ? "" : undefined}
            />
          ))}
        </div>

        <ol className="project-dial-track">
          {projects.map((p, i) => {
            const href = `/projects/${p.slug}`;
            const selected = i === 0; // initial state; later changes are written by select()
            return (
              <li
                key={p._id || p.slug}
                ref={(el) => {
                  cardRefs.current[i] = el;
                }}
                className="project-dial-item"
                data-active={selected ? "" : undefined}
                data-far={i > 2 ? "" : undefined}
              >
                <div className="project-dial-card">
                  <Link
                    href={href}
                    onClick={onCardClick(i)}
                    onFocus={() => {
                      // after the browser's own focus scroll, which would otherwise cancel the turn
                      if (i !== activeRef.current) window.setTimeout(() => turnTo(i), 60);
                    }}
                    className="group block"
                    aria-label={`${p.title}: open the case study`}
                    aria-current={selected ? "true" : undefined}
                  >
                    <ProjectVisual
                      project={p}
                      priority={i === 0}
                      className="project-dial-visual w-full aspect-[16/9] rounded-[11px] border border-line"
                      sizes="(max-width: 639px) 84vw, 1px"
                    />
                    <span className="mt-1.5 px-1 flex items-center justify-between gap-2">
                      <span className="font-display text-[1.2rem] leading-[1.05] tracking-[-0.015em] text-fg truncate">{p.title}</span>
                      <ArrowUpRight className="project-dial-open w-4 h-4 shrink-0" />
                    </span>
                  </Link>
                </div>
              </li>
            );
          })}
        </ol>

        <div className="project-dial-hud label-mono text-fg-subtle" aria-hidden="true">
          <span>
            <span ref={counterRef} className="text-fg">
              01
            </span>{" "}
            / {String(n).padStart(2, "0")}
          </span>
          <span>Swipe to explore - Tap to open</span>
        </div>
        <p ref={liveRef} className="sr-only" aria-live="polite" />
      </div>
    </section>
  );
}
