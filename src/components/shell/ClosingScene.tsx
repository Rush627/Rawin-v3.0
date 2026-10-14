"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import Link from "next/link";
import { motion, useMotionValue, useMotionValueEvent, useTransform, type MotionValue } from "framer-motion";
import { useReducedMotionSafe } from "@/lib/useReducedMotionSafe";
import { emitFieldSignal } from "@/components/system/particles/scene";
import { ArrowUpRight, Check, Copy } from "lucide-react";
import { splitEmphasis } from "@/lib/cms/text";

/**
 * "Time to / Level up" entrance, played once when the composition first comes into view:
 * 1. "Time to" rises out of its own line box;
 * 2. a light travels across "Level up", writing its outline as it passes, while the shared
 *    particle field sheds grains from the same contours in step with it (a field signal);
 * 3. everything settles to the resting outline; the scroll story then takes over unchanged.
 * It is armed only when the words are still off screen at mount, so nothing already visible
 * is ever hidden, and never under reduced motion. Timings live in CSS (.closing-*).
 */
const SWEEP_DELAY_MS = 420;
const SWEEP_MS = 1150;
const SETTLE_MS = 2400;

function useClosingEntrance(stageRef: RefObject<HTMLElement | null>, outlineRef: RefObject<HTMLElement | null>, enabled: boolean, minWidth: number) {
  useEffect(() => {
    const stage = stageRef.current;
    if (!enabled || !stage || window.innerWidth < minWidth || typeof IntersectionObserver === "undefined") return;
    if (!stage.offsetParent) return; // not displayed at this width
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (stage.getBoundingClientRect().top < window.innerHeight * 0.92) return;
    const timers: number[] = [];
    stage.dataset.closing = "armed";
    const io = new IntersectionObserver(
      (records) => {
        if (!records.some((r) => r.isIntersecting)) return;
        io.disconnect();
        stage.dataset.closing = "on";
        timers.push(
          window.setTimeout(() => {
            if (outlineRef.current) emitFieldSignal({ el: outlineRef.current, mode: "outline", sweepMs: SWEEP_MS });
          }, SWEEP_DELAY_MS),
          window.setTimeout(() => {
            stage.dataset.closing = "done";
          }, SETTLE_MS),
        );
      },
      { threshold: 0.35 },
    );
    io.observe(stage);
    return () => {
      io.disconnect();
      timers.forEach((t) => window.clearTimeout(t));
      delete stage.dataset.closing;
    };
  }, [stageRef, outlineRef, enabled, minWidth]);
}

/** "Level up" in outline type, with the light that writes it during the entrance. */
function OutlineWords({ text, outlineRef }: { text: string; outlineRef: RefObject<HTMLSpanElement | null> }) {
  return (
    <span className="closing-outline">
      <span ref={outlineRef} data-field-surface="glyph" className="outline-type closing-outline-base">
        {text}
      </span>
      <span aria-hidden="true" className="outline-type closing-outline-sweep">
        {text}
      </span>
    </span>
  );
}

/** Ask the particle field to run a signal once around a control's rim (rate-limited). */
function rimSignal(el: HTMLElement, strength: number) {
  const now = performance.now();
  const last = Number(el.dataset.rimAt || 0);
  if (now - last < 2600) return;
  el.dataset.rimAt = String(now);
  emitFieldSignal({ el, mode: "rim", sweepMs: 900, strength });
}

interface ClosingSceneProps {
  email: string;
  label?: string;
  /** invitation line; one *word* in asterisks is set in accent italics (CMS: global.closingInvite) */
  invite?: string;
  /** small label above the email address (global.closingPrompt) */
  prompt?: string;
  /** call-to-action button text (global.closingCta) */
  cta?: string;
}

interface ClosingCopy {
  invite: { before: string; emphasis: string; after: string };
  prompt: string;
  cta: string;
}

const DEFAULT_INVITE = "Let's make something *impossible* to ignore.";

/** The invitation with its emphasised word. */
function InviteText({ invite }: { invite: ClosingCopy["invite"] }) {
  return (
    <>
      {invite.before}
      {invite.emphasis && (
        <>
          {" "}
          <em className="italic text-accent">{invite.emphasis}</em>
        </>
      )}
      {invite.after}
    </>
  );
}

export function CopyEmailButton({ email, className = "" }: { email: string; className?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(email);
          setCopied(true);
          window.setTimeout(() => setCopied(false), 1800);
        } catch {
          window.location.href = `mailto:${email}`;
        }
      }}
      data-field-surface="control"
      className={`btn btn-ghost ${className}`}
    >
      {copied ? <Check className="w-4 h-4 text-success" /> : <Copy className="w-4 h-4" />}
      <span aria-live="polite">{copied ? "Copied to clipboard" : "Copy email"}</span>
    </button>
  );
}

function ContactLockup({ email, copy, size = "lg", ctaRef }: { email: string; copy: ClosingCopy; size?: "lg" | "md"; ctaRef?: RefObject<HTMLAnchorElement | null> }) {
  const [user, domain] = email.split("@");
  return (
    <div className="flex flex-col items-start">
      <span className="label-mono text-fg-subtle mb-4 sm:mb-5">{copy.prompt}</span>
      <a
        href={`mailto:${email}`}
        className={`group font-display tracking-[-0.03em] leading-[0.95] text-fg [overflow-wrap:anywhere] ${
          size === "lg" ? "text-[clamp(2.4rem,5.2vw,5.4rem)]" : "closing-email"
        }`}
      >
        <span className="link-draw">{user}</span>
        <span className="whitespace-nowrap">
          <span className="link-draw">
            <span className="italic text-accent">@</span>
            {domain}
          </span>
          <ArrowUpRight className="inline-block ml-2 w-[0.5em] h-[0.5em] align-baseline transition-transform duration-500 group-hover:translate-x-1 group-hover:-translate-y-1" />
        </span>
      </a>
      <div className="mt-7 sm:mt-8 action-pair w-full sm:w-auto">
        <CopyEmailButton email={email} />
        <Link
          ref={ctaRef}
          href="/contact"
          data-field-surface="control"
          onPointerEnter={(e) => {
            if (e.pointerType === "mouse") rimSignal(e.currentTarget, 0.55);
          }}
          onFocus={(e) => {
            if (e.currentTarget.matches(":focus-visible")) rimSignal(e.currentTarget, 0.8);
          }}
          className="btn btn-primary pr-2 gap-4 group/cta closing-cta"
        >
          <span>{copy.cta}</span>
          <span className="w-8 h-8 rounded-full bg-inverse-fg/12 flex items-center justify-center transition-transform duration-500 group-hover/cta:rotate-45">
            <ArrowUpRight className="w-4 h-4" />
          </span>
        </Link>
      </div>
    </div>
  );
}

function Label({ text }: { text: string }) {
  return (
    <span className="inline-flex items-center gap-3">
      <span className="relative flex w-2 h-2">
        <span className="absolute inset-0 rounded-full bg-accent animate-ping opacity-50" />
        <span className="relative w-2 h-2 rounded-full bg-accent" />
      </span>
      <span className="label-mono text-accent">{text}</span>
    </span>
  );
}

/**
 * Static composition for phones, tablets and reduced motion.
 * Phones (< md) drop the label and TIME TO / LEVEL UP entirely (display: none, no
 * footprint) so the invitation leads; tablets and reduced-motion desktops keep them.
 */
function StaticScene({ email, label, copy, animate }: { email: string; label: string; copy: ClosingCopy; animate: boolean }) {
  const stageRef = useRef<HTMLDivElement | null>(null);
  const outlineRef = useRef<HTMLSpanElement | null>(null);
  // tablets (and narrow desktop windows) get the same entrance; phones never show the words
  useClosingEntrance(stageRef, outlineRef, animate, 768);
  return (
    <section aria-label={label} className="mx-auto max-w-[1600px] px-4 sm:px-6 lg:px-10 pt-6 pb-20 sm:pb-24">
      <div ref={stageRef} className="hidden md:block">
        <Label text={label} />
        <h2 className="mt-8 font-sans font-extrabold uppercase tracking-[-0.045em] leading-[0.86] text-[clamp(3rem,15vw,7.5rem)] text-fg">
          <span className="closing-rise" data-field-surface="glyph">
            Time to
          </span>
          <span className="block">
            <OutlineWords text="level up" outlineRef={outlineRef} />
          </span>
        </h2>
        <p className="mt-10 font-display text-[clamp(1.9rem,7vw,3.6rem)] leading-[1] tracking-[-0.025em] text-fg max-w-[16ch]">
          <InviteText invite={copy.invite} />
        </p>
      </div>

      {/* Phones: the invitation is the headline. The second line tucks up under the first;
          the first line's background-coloured stroke knocks out the overlap cleanly. */}
      <h2 className="md:hidden closing-invite font-display text-fg">
        <span className="closing-invite-top">{copy.invite.before}</span>
        {(copy.invite.emphasis || copy.invite.after) && (
          <span className="closing-invite-tail">
            {copy.invite.emphasis && <em className="italic text-accent">{copy.invite.emphasis}</em>}
            {copy.invite.after}
          </span>
        )}
      </h2>
      {email && (
        <div className="mt-9 sm:mt-14 pt-7 sm:pt-8 border-t border-line">
          <ContactLockup email={email} copy={copy} size="md" />
        </div>
      )}
    </section>
  );
}

function useRange(p: MotionValue<number>, input: number[], output: (number | string)[]) {
  return useTransform(p, input, output);
}

/**
 * "One last thing" — the pinned closing story restored from the original RAWIN footer:
 * TIME TO / LEVEL UP part to either side, the invitation rises, then the email lockup
 * settles with its Copy and Start-a-project actions. Desktop with motion only.
 */
export default function ClosingScene({ email, label = "One last thing", invite, prompt, cta }: ClosingSceneProps) {
  const copy: ClosingCopy = {
    invite: splitEmphasis(invite?.trim() || DEFAULT_INVITE),
    prompt: prompt?.trim() || "Start a conversation",
    cta: cta?.trim() || "Start a project",
  };
  const reduced = useReducedMotionSafe();
  const ref = useRef<HTMLDivElement | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const outlineRef = useRef<HTMLSpanElement | null>(null);
  const ctaRef = useRef<HTMLAnchorElement | null>(null);
  const p = useMotionValue(0);
  useClosingEntrance(stageRef, outlineRef, !reduced, 1024);

  // Progress is measured live from the section's rect on every frame that scrolls. A
  // target-based useScroll caches offsets, which drift as content above loads and resizes.
  useEffect(() => {
    if (reduced) return;
    let raf: number | null = null;
    const update = () => {
      raf = null;
      const el = ref.current;
      if (!el || window.innerWidth < 1024) return;
      const r = el.getBoundingClientRect();
      const total = r.height - window.innerHeight;
      if (total <= 0) return;
      p.set(Math.min(1, Math.max(0, -r.top / total)));
    };
    const onScroll = () => {
      if (raf === null) raf = requestAnimationFrame(update);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    update();
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf !== null) cancelAnimationFrame(raf);
    };
  }, [reduced, p]);

  const badgeOpacity = useRange(p, [0, 0.16, 0.3], [1, 1, 0]);
  const badgeY = useRange(p, [0.16, 0.3], [0, -30]);
  const leftX = useRange(p, [0.14, 0.46], ["0vw", "-110vw"]);
  const rightX = useRange(p, [0.14, 0.46], ["0vw", "110vw"]);
  const wordsOpacity = useRange(p, [0.3, 0.44], [1, 0]);
  // The invitation rises, holds, then lifts and settles as the headline above the email.
  const inviteOpacity = useRange(p, [0.38, 0.56], [0, 1]);
  const inviteY = useRange(p, [0.38, 0.54, 0.62, 0.76], ["8vh", "0vh", "0vh", "-23vh"]);
  const inviteScale = useRange(p, [0.38, 0.54, 0.62, 0.76], [0.94, 1, 1, 0.64]);
  const ctaOpacity = useRange(p, [0.76, 0.9], [0, 1]);
  const ctaY = useRange(p, [0.76, 0.9], [50, 0]);
  const ctaEvents = useTransform(ctaOpacity, (v) => (Number(v) > 0.4 ? "auto" : "none"));
  const glow = useRange(p, [0, 0.5, 1], [0.35, 1, 0.6]);

  // The action's arrival: the first time the lockup settles into view, a light runs once around
  // "Start a project" and the particle field answers along the same rim. Never repeats on
  // scrolling back and forth; hover and keyboard focus can still call it (rate-limited).
  const ctaSignalled = useRef(false);
  useMotionValueEvent(ctaOpacity, "change", (v) => {
    const el = ctaRef.current;
    if (ctaSignalled.current || !el || Number(v) < 0.92) return;
    ctaSignalled.current = true;
    el.dataset.signal = "on";
    window.setTimeout(() => rimSignal(el, 1), 120);
    window.setTimeout(() => {
      delete el.dataset.signal;
    }, 1600);
  });

  return (
    <>
      <div className={reduced ? "" : "lg:hidden"}>
        <StaticScene email={email} label={label} copy={copy} animate={!reduced} />
      </div>

      {!reduced && (
        <section ref={ref} aria-label={label} className="hidden lg:block relative h-[300vh]">
          <div ref={stageRef} className="sticky top-0 h-stage-full overflow-hidden flex items-center">
            <motion.div
              aria-hidden="true"
              style={{ opacity: glow }}
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[70vw] h-[60vh] rounded-full pointer-events-none"
            >
              <div className="w-full h-full rounded-full" style={{ background: "radial-gradient(closest-side, var(--halo-a), transparent)" }} />
            </motion.div>

            <div className="relative mx-auto w-full max-w-[1600px] px-10 grid [&>*]:col-start-1 [&>*]:row-start-1 items-center">
              {/* State 1 */}
              <div className="pointer-events-none select-none">
                <motion.div style={{ opacity: badgeOpacity, y: badgeY }} className="mb-8">
                  <Label text={label} />
                </motion.div>
                <motion.div style={{ opacity: wordsOpacity }} className="font-sans font-extrabold uppercase tracking-[-0.05em] leading-[0.84] text-[clamp(6rem,12.5vw,13.5rem)]">
                  <motion.span style={{ x: leftX }} className="block text-fg whitespace-nowrap">
                    <span className="closing-rise" data-field-surface="glyph">
                      Time to
                    </span>
                  </motion.span>
                  <motion.span style={{ x: rightX }} className="block whitespace-nowrap pl-[0.6em]">
                    <OutlineWords text="Level up" outlineRef={outlineRef} />
                  </motion.span>
                </motion.div>
              </div>

              {/* State 2 */}
              <motion.p
                style={{ opacity: inviteOpacity, y: inviteY, scale: inviteScale }}
                className="pointer-events-none select-none font-display text-[clamp(4rem,8.4vw,9rem)] leading-[0.9] tracking-[-0.035em] text-fg max-w-[13ch] origin-left"
              >
                <InviteText invite={copy.invite} />
              </motion.p>

              {/* State 3 */}
              {email && (
                <motion.div style={{ opacity: ctaOpacity, y: ctaY, pointerEvents: ctaEvents }} className="self-end pb-[10vh]">
                  <ContactLockup email={email} copy={copy} ctaRef={ctaRef} />
                </motion.div>
              )}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
