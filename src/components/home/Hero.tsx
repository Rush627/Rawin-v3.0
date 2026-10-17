"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { STARTUP_REVEAL_EVENT, startupHolding } from "@/lib/startup/boot-script";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import RoleCycler from "./RoleCycler";
import TonalPortrait from "./TonalPortrait";
import OrbitSignal from "@/components/shell/OrbitSignal";
import { EASE_EDITORIAL } from "@/lib/motion";
import { statusTone } from "@/components/shell/SiteFooter";
import { setHeroScene } from "@/components/system/particles/scene";
import { haptic } from "@/lib/haptics";

export interface HeroPanels {
  focus?: boolean;
  availability?: boolean;
  work?: boolean;
}

export interface HeroProps {
  prefix: string;
  name: string;
  bio: string;
  status: string;
  badge: string;
  statusColor?: string;
  primaryCta: string;
  secondaryCta: string;
  phrases?: string[];
  location?: string;
  portrait: { url: string; alt: string };
  featured?: { title: string; slug: string; category?: string; year?: string } | null;
  panels?: HeroPanels;
}

const HIGHLIGHTS = [
  ["Next.js", "& React"],
  ["Full Stack", "Development"],
  ["Modern", "Web Systems"],
  ["Interaction", "& Motion"],
];

function splitName(name: string): [string, string] {
  const parts = name.trim().split(/\s+/);
  if (parts.length < 2) return [parts[0] || name, ""];
  return [parts.slice(0, -1).join(" "), parts[parts.length - 1]];
}

/** Short city label from a CMS location such as "Jaunpur, Uttar Pradesh, India". */
function shortLocation(location?: string) {
  if (!location) return "";
  const parts = location.split(",").map((p) => p.trim()).filter(Boolean);
  return parts.length > 1 ? `${parts[0]}, ${parts[parts.length - 1]}` : parts[0] || "";
}

/**
 * Hero cards use reliable CSS frosted glass (.glass-frost): translucent surface, backdrop
 * blur, fine edge. The entrance fade/rise is applied to the frosted surface itself, never to
 * a wrapper: an ancestor with opacity < 1 becomes a backdrop root, so the blur would see
 * nothing and the portrait would show crisp through the card until the fade finished.
 */

export default function Hero(props: HeroProps) {
  const { prefix, name, bio, status, badge, statusColor, primaryCta, secondaryCta, phrases, location, portrait, featured } =
    props;
  const panels = { focus: true, availability: true, work: true, ...props.panels };
  const [first, last] = splitName(name);
  const reduced = useReducedMotion();
  const place = shortLocation(location);
  // While a startup animation covers the page the hero waits, and its choreography begins as
  // the startup reveals the site (at the planned moment, or at once on a skip).
  const [held, setHeld] = useState(() => startupHolding());
  useEffect(() => {
    if (!held) return;
    const release = () => setHeld(false);
    window.addEventListener(STARTUP_REVEAL_EVENT, release);
    // the reveal may already have happened between the first render and this effect
    if (!startupHolding()) requestAnimationFrame(release);
    return () => window.removeEventListener(STARTUP_REVEAL_EVENT, release);
  }, [held]);
  const sectionRef = useRef<HTMLElement | null>(null);
  const nameRef = useRef<HTMLHeadingElement | null>(null);

  // The hero owns the particle layer's background field and is the source of its
  // first-load emergence: register while mounted, release on unmount (route changes).
  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    setHeroScene({ section, name: nameRef.current });
    return () => setHeroScene(null);
  }, []);

  // The initial state is the same on server and client (no hydration mismatch); reduced
  // motion only settles everything immediately.
  const settle = { duration: 0 };
  const enter = (delay: number, y = 22) => ({
    initial: { opacity: 0, y },
    animate: held ? undefined : { opacity: 1, y: 0 },
    transition: reduced ? settle : { duration: 0.9, ease: EASE_EDITORIAL, delay },
  });

  const line = (delay: number) => ({
    initial: { y: "105%" },
    animate: held ? undefined : { y: "0%" },
    transition: reduced ? settle : { duration: 1.15, ease: EASE_EDITORIAL, delay },
  });

  return (
    <section ref={sectionRef} id="rawin-hero" aria-labelledby="hero-name" className="relative w-full overflow-x-clip">
      <div className="relative mx-auto max-w-[1600px] px-4 sm:px-6 lg:px-10 pt-[calc(env(safe-area-inset-top)+7.25rem)] sm:pt-[7.5rem] md:pt-[11.25rem] lg:pt-[clamp(7.5rem,16vh,10.25rem)] pb-10 lg:pb-12 lg:min-h-[max(100svh,780px)] flex flex-col">
        {/* Meta row */}
        <motion.div {...enter(0.1, 10)} className="hidden sm:flex items-center justify-between gap-4 label-mono text-fg-subtle">
          <span>Portfolio · Index {new Date().getFullYear()}</span>
          <span className="hidden lg:inline-flex items-center gap-3">
            <span className="h-px w-8 bg-line-strong" />
            <OrbitSignal variant="hero" />
            <span className="h-px w-8 bg-line-strong" />
          </span>
          {place && <span className="max-w-[26ch] truncate text-right">{place}</span>}
        </motion.div>

        <div className="relative flex-1 grid grid-cols-12 gap-x-4 lg:gap-x-6 mt-2 sm:mt-10 lg:mt-[clamp(1rem,3vh,2rem)] items-start">
          {/* Phones & tablets: name + portrait form the first screen (see .hero-first-screen):
              at least one small viewport tall, so the introduction never peeks out from under
              the browser toolbar, with the portrait scaled to the height that is available.
              From lg the wrapper is display:contents and the desktop grid is untouched. */}
          <div className="hero-first-screen col-span-12 flex flex-col lg:contents">
            {/* ---------------------------------------------------------------- Name */}
            <div className="col-span-12 lg:col-span-7 relative z-10 lg:pt-6">
              <motion.p
                {...enter(0.2, 12)}
                className="flex items-center gap-3 font-display italic text-[clamp(1.2rem,2vw,1.75rem)] text-accent mb-2 sm:mb-4"
              >
                <span aria-hidden="true" className="h-px w-8 sm:w-10 bg-accent/60" />
                {prefix}
              </motion.p>
              <h1 ref={nameRef} id="hero-name" className="hero-name text-fg select-none">
                <span className="block overflow-hidden pb-[0.04em]">
                  <motion.span className="block" {...line(0.28)}>
                    {first}
                  </motion.span>
                </span>
                {last && (
                  <span className="block overflow-hidden pb-[0.1em] -mt-[0.08em] pl-[0.55em] sm:pl-[0.75em]">
                    <motion.span className="block italic text-fg" {...line(0.4)}>
                      {last}
                      <span aria-hidden="true" className="text-accent not-italic">.</span>
                    </motion.span>
                  </span>
                )}
              </h1>

              {/* Bio + actions — desktop sits under the name */}
              <motion.div {...enter(0.7)} className="hidden lg:block mt-[clamp(1.5rem,4.5vh,2.5rem)] xl:mt-[clamp(1.75rem,5.5vh,3.5rem)] max-w-[40ch]">
                <HeroIntro bio={bio} primaryCta={primaryCta} secondaryCta={secondaryCta} />
              </motion.div>
            </div>

            {/* --------------------------------------------------------------- Stage */}
            <div className="col-span-12 lg:col-span-5 relative my-auto pt-4 sm:pt-10 lg:my-0 lg:pt-0">
              <div
                id="rawin-hero-stage"
                className="relative mx-auto w-full max-w-[420px] sm:max-w-[520px] lg:max-w-none pt-2 pb-5 sm:pt-4 sm:pb-14 lg:pb-12 lg:pt-2"
              >
                {/* Atmosphere: halo + orbit line behind the portrait (seen softly through the frosted cards) */}
                <div
                  aria-hidden="true"
                  className="absolute left-1/2 top-[44%] -translate-x-1/2 -translate-y-1/2 w-[118%] aspect-square rounded-full pointer-events-none"
                  style={{
                    background:
                      "radial-gradient(circle at 50% 50%, var(--halo-a) 0%, var(--halo-b) 40%, rgb(0 0 0 / 0) 70%)",
                  }}
                />
                {/* atmosphere, not content: the particle field may cross the orbit line */}
                <svg
                  aria-hidden="true"
                  data-field-ignore=""
                  viewBox="0 0 400 400"
                  className="absolute left-1/2 top-[44%] -translate-x-1/2 -translate-y-1/2 w-[128%] pointer-events-none text-line-strong"
                  fill="none"
                >
                  <ellipse cx="200" cy="200" rx="196" ry="74" transform="rotate(-18 200 200)" stroke="currentColor" strokeWidth="0.8" />
                  <circle cx="381" cy="139" r="3.2" fill="var(--accent)" />
                </svg>

                {/* Portrait plate */}
                <motion.figure
                  className="hero-portrait relative z-[1] ml-auto mr-0 sm:mx-auto lg:ml-[12%] lg:mr-0 w-[64%] min-[400px]:w-[62%] sm:w-[74%] lg:w-[72%]"
                  initial={{ opacity: 0, y: 30 }}
                  animate={held ? undefined : { opacity: 1, y: 0 }}
                  transition={reduced ? settle : { duration: 1.2, ease: EASE_EDITORIAL, delay: 0.3 }}
                >
                  <div data-field-surface="image" className="relative aspect-[4/5] w-full overflow-hidden rounded-t-[999px] rounded-b-[30px] bg-[#0e0e0f] shadow-[var(--shadow-3)] ring-1 ring-black/5 dark:ring-white/10">
                    <TonalPortrait src={portrait.url} alt={portrait.alt} focusX={0.55} focusY={0.28} />
                    <div aria-hidden="true" className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/45 to-transparent" />
                  </div>
                </motion.figure>

                {/* Panel B — availability (top) */}
                {panels.availability && (
                  <div className="absolute z-20 left-0 top-[12%] sm:top-[9%] sm:left-[2%] lg:left-auto lg:right-0 lg:top-[10%] w-[min(44%,168px)] sm:w-[min(60%,230px)]">
                    <motion.div {...enter(1.05, 14)} role="group" className="glass-frost rounded-[15px] sm:rounded-[20px] px-3 py-2.5 sm:px-4 sm:py-3.5" aria-label="Availability">
                      <span className={`flex items-center gap-2 text-[12px] sm:text-[13px] font-medium ${statusTone(statusColor)}`}>
                        <span className="status-dot" />
                        <span className="text-fg">{status}</span>
                      </span>
                      <span className="mt-0.5 sm:mt-1 block text-[11px] sm:text-[12px] text-fg-muted leading-snug">
                        {badge}
                      </span>
                    </motion.div>
                  </div>
                )}

                {/* Panel A — current focus (left, lower) */}
                {panels.focus && (
                  <div className="absolute z-20 left-0 bottom-[3%] sm:bottom-[4%] lg:-left-[12%] lg:bottom-[11%] w-[min(56%,214px)] max-[359px]:w-[50%] sm:w-[48%] lg:w-[min(56%,280px)]">
                    <motion.div {...enter(1.2, 18)} role="group" className="glass-frost rounded-[16px] sm:rounded-[24px] p-3 sm:p-5" aria-label="Current focus">
                      <p className="font-display text-[1.08rem] sm:text-[clamp(1.35rem,2vw,1.85rem)] leading-[1.04] tracking-[-0.015em] text-fg">
                        <RoleCycler phrases={phrases} />
                      </p>
                      {/* The action reaches the card's edges so the whole lower strip is the tap target */}
                      <Link
                        href="/ai"
                        className="-mx-3 -mb-3 px-3 pb-3 sm:-mx-5 sm:-mb-5 sm:px-5 sm:pb-5 mt-2.5 pt-2.5 sm:mt-3.5 sm:pt-3 rounded-b-[16px] sm:rounded-b-[24px] border-t border-fg/10 flex items-center justify-between text-[11px] sm:text-[12px] text-fg-muted hover:text-fg focus-visible:text-fg transition-colors"
                      >
                        {/* the card's accent dot now leads its action */}
                        <span className="flex items-center gap-2">
                          <span aria-hidden="true" className="w-1.5 h-1.5 rounded-full bg-accent shrink-0" />
                          <span>Ask Orbit about my work</span>
                        </span>
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </Link>
                    </motion.div>
                  </div>
                )}

                {/* Panel C — selected work (right, bottom) — tablet & desktop */}
                {panels.work && featured && (
                  <div className="hidden sm:block absolute z-20 right-0 bottom-[2%] lg:-right-[2%] lg:bottom-[1%] w-[min(44%,250px)]">
                    <motion.div {...enter(1.35, 18)} role="group" className="glass-frost rounded-[22px]" aria-label="Selected work">
                      <Link href={`/projects/${featured.slug}`} className="group block p-4">
                        <span className="flex items-center justify-between label-mono text-fg-muted">
                          <span>Selected work</span>
                          <span>{featured.year || "01"}</span>
                        </span>
                        <span className="mt-2 flex items-end justify-between gap-3">
                          <span className="font-display text-[1.45rem] leading-[1.02] text-fg">{featured.title}</span>
                          <ArrowUpRight className="w-4 h-4 shrink-0 mb-1 text-fg-muted transition-transform group-hover:rotate-45 group-hover:text-accent" />
                        </span>
                        {featured.category && <span className="mt-1 block text-[12px] text-fg-muted">{featured.category}</span>}
                      </Link>
                    </motion.div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Bio + actions — phone & tablet sit under the stage */}
          <motion.div {...enter(0.6)} className="lg:hidden col-span-12 md:col-span-9 mt-4 sm:mt-10">
            <HeroIntro bio={bio} primaryCta={primaryCta} secondaryCta={secondaryCta} />
          </motion.div>
        </div>

        {/* Index strip */}
        <motion.div
          {...enter(0.95, 12)}
          className="relative z-10 mt-14 lg:mt-12 pt-5 border-t border-line hidden sm:grid grid-cols-4 lg:grid-cols-12 gap-x-4"
        >
          {HIGHLIGHTS.map(([a, b], i) => (
            <div key={a} className="lg:col-span-2 flex flex-col">
              <span className="font-mono text-[10px] text-fg-subtle mb-1.5">{String(i + 1).padStart(2, "0")}</span>
              <span className="text-[15px] text-fg">{a}</span>
              <span className="text-[13px] text-fg-muted">{b}</span>
            </div>
          ))}
          <a
            href="#selected-work"
            className="hidden lg:flex lg:col-span-4 items-end justify-end gap-2 label-mono text-fg-muted hover:text-fg transition-colors"
          >
            Scroll to work <ArrowDownRight className="w-3.5 h-3.5" />
          </a>
        </motion.div>
      </div>
    </section>
  );
}

/**
 * Bio + actions. Phones: the paragraph uses the full content width at a slightly larger
 * size with pretty wrapping, and the two actions form one group on its left edge — side by
 * side where both genuinely fit (≈390px and wider), otherwise the secondary wraps beneath
 * with a tight gap (see .hero-intro / .hero-actions in globals.css). Desktop is unchanged.
 */
function HeroIntro({ bio, primaryCta, secondaryCta }: { bio: string; primaryCta: string; secondaryCta: string }) {
  return (
    <>
      <p className="hero-intro text-[16px] sm:text-[17px] leading-relaxed text-fg-muted max-w-[40ch]">{bio}</p>
      <div className="hero-actions mt-6 sm:mt-7 flex flex-wrap items-center gap-x-6 gap-y-3">
        <Link
          href="/projects"
          onClick={() => haptic.impact()}
          className="btn btn-primary hero-cta pr-2 gap-4 group"
        >
          <span>{primaryCta}</span>
          <span className="hero-cta-icon w-8 h-8 rounded-full bg-inverse-fg/12 flex items-center justify-center transition-transform duration-500 group-hover:rotate-45">
            <ArrowUpRight className="w-4 h-4" />
          </span>
        </Link>
        <Link href="/contact" className="hero-cta-secondary group inline-flex items-center gap-2 min-h-12 text-sm font-medium text-fg">
          <span className="link-draw">{secondaryCta}</span>
          <ArrowUpRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </Link>
      </div>
    </>
  );
}
