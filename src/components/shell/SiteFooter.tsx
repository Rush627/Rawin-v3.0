"use client";

import { useEffect, useId, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowUp, ArrowUpRight } from "lucide-react";
import { getActiveSocialLinks } from "@/components/SocialIcons";
import type { ContactContent, GlobalContent } from "@/lib/site-content";
import { AVAILABILITY_TONE, type AvailabilityContent } from "@/lib/cms/availability";
import { scrollToTop } from "./nav-items";
import ClosingScene from "./ClosingScene";

interface SiteFooterProps {
  content?: Partial<GlobalContent>;
  /** canonical availability: the footer badge shows its note, coloured by its state */
  availability?: AvailabilityContent;
  contact?: Partial<ContactContent>;
  footerCopyright?: string;
  currentYear?: number;
}

/**
 * Routes that end with the closing scene ("Let's make something impossible to ignore") above
 * the footer: index pages without a call to action of their own. Deliberately an explicit
 * list of whole routes, so reading pages (case studies, blog articles), About, Resume,
 * Contact and the journal index all end with the standard footer alone.
 */
const CLOSING_SCENE_ROUTES = new Set(["/", "/uses", "/projects"]);
/** Routes whose own content already presents the email and social links: the desktop/tablet
 *  footer skips its Contact / Elsewhere row there (the phone footer is unchanged). */
const COMPACT_FOOTER_ROUTES = new Set(["/contact"]);

const DEFAULT_PHRASE = "Made with logic · Shaped by curiosity · Built with purpose";

export function statusTone(color?: string): string {
  if (color === "orange") return "text-warning";
  if (color === "red") return "text-danger";
  return "text-success";
}

/**
 * Decorative outline wordmark, cropped vertically by its frame so the letters read as
 * continuing below the page edge. Hidden from assistive tech.
 *
 * Geometry is fixed, not measured: the word is Geist 800 "RAWIN" converted to outlines
 * (RAWIN_OUTLINE), so every browser draws exactly the same shape whatever font it has loaded,
 * however it lays out SVG text and whenever its fonts finish. The outline's ink spans x 39.2 to
 * 960.8 of the 1000-unit viewBox, centred on 500, and the svg spans the frame's full width, so
 * the letters are centred on the frame and the frame on the page (symmetric padding).
 * Vertically the caps run from y 26.9 to the baseline at 228 (201.1 units): a 1000:163 frame
 * (phones) ends 68% of the way down the letters, 1000:152 (wider screens) 62%.
 *
 * Particle field: the letters are a glyph surface (data-field-surface), so the field's grains
 * part around their contours. A second, gradient-stroked copy of the word carries a soft local
 * highlight that eases toward the pointer at the same pace as the particle cloud's centre,
 * lighting only the stretch of outline the cloud is near (fine pointers, motion allowed).
 */
const RAWIN_OUTLINE =
  "M39.21 228V26.89H131.27Q153.64 26.89 170.19 34.26Q186.73 41.62 195.76 55.02Q204.8 68.42 204.8 86.66Q204.8 100.71 199.22 111.56Q193.64 122.41 183.5 129.32Q173.36 136.23 159.65 138.38L158.86 135.6Q179.53 135.6 190.04 144.44Q200.55 153.28 201.8 170.84L206.55 228H156.31L153.02 179.05Q152.34 167.72 146.48 162.34Q140.62 156.96 126.23 156.96H88.5V228ZM88.5 116.63H123.73Q138.52 116.63 146.45 110.11Q154.38 103.6 154.38 91.76Q154.38 79.63 146.39 73.43Q138.41 67.23 123.11 67.23H88.5Z M222.3 228 294.82 26.89H351.92L424.43 228H373.78L360.7 190.04H285.81L272.72 228ZM299.23 150.84H347.5L323.48 80.09Z M461.48 228 406.7 26.89H457.8L490.09 159.68L523 26.89H563.9L596.87 159.68L628.88 26.89H680.03L625.48 228H574.04L543.45 108.47L512.86 228Z M701.73 228V26.89H751.01V228Z M786.14 228V26.89H837.91L911.5 152.88V26.89H960.79V228H908.67L835.42 107.22V228Z";
/** Highlight: reach beyond the wordmark (px), follow ease per 60fps frame, radius (units). */
const GLINT_REACH = 240;
const GLINT_EASE = 0.065;
const GLINT_RADIUS = 150;

function ClippedWordmark() {
  const uid = useId().replace(/:/g, "");
  const gid = `rawin-wm-${uid}`;
  const hid = `rawin-wm-hl-${uid}`;
  const glintRef = useRef<SVGPathElement | null>(null);
  const hlRef = useRef<SVGRadialGradientElement | null>(null);

  // Local highlight: follows the pointer with the cloud's easing, fades with distance
  useEffect(() => {
    const glint = glintRef.current;
    const hl = hlRef.current;
    const svg = glint?.ownerSVGElement;
    if (!glint || !hl || !svg) return;
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0;
    let x = 500;
    let y = 120;
    let tx = 500;
    let ty = 120;
    let op = 0;
    let target = 0;
    let seeded = false;
    let last = 0;
    const tick = (now: number) => {
      raf = 0;
      const k60 = last ? Math.min(3, (now - last) / 16.7) : 1;
      last = now;
      const e = 1 - Math.pow(1 - GLINT_EASE, k60);
      x += (tx - x) * e;
      y += (ty - y) * e;
      op += (target - op) * (1 - Math.pow(1 - 0.08, k60));
      hl.setAttribute("cx", x.toFixed(1));
      hl.setAttribute("cy", y.toFixed(1));
      glint.style.opacity = op.toFixed(3);
      if (op > 0.004 || target > 0) raf = requestAnimationFrame(tick);
      else last = 0;
    };
    const onMove = (ev: PointerEvent) => {
      if (ev.pointerType !== "mouse") return;
      const r = svg.getBoundingClientRect();
      if (r.width < 1) return;
      const dx = Math.max(r.left - ev.clientX, 0, ev.clientX - r.right);
      // the frame crops the word: measure against the visible part only
      const frame = svg.parentElement?.getBoundingClientRect() ?? r;
      const dy = Math.max(frame.top - ev.clientY, 0, ev.clientY - frame.bottom);
      const dist = Math.hypot(dx, dy);
      target = dist < GLINT_REACH ? Math.pow(1 - dist / GLINT_REACH, 1.5) : 0;
      const u = 1000 / r.width;
      tx = (ev.clientX - r.left) * u;
      ty = (ev.clientY - r.top) * u;
      if (!seeded) {
        seeded = true;
        x = tx;
        y = ty;
      }
      if (!raf && (target > 0 || op > 0.004)) raf = requestAnimationFrame(tick);
    };
    const onLeave = () => {
      target = 0;
      if (!raf) raf = requestAnimationFrame(tick);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    document.documentElement.addEventListener("pointerleave", onLeave);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
      document.documentElement.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  return (
    <div aria-hidden="true" className="relative w-full overflow-hidden aspect-[1000/163] sm:aspect-[1000/152] pointer-events-none select-none">
      <svg viewBox="0 0 1000 250" className="absolute inset-x-0 top-0 w-full h-auto block">
        <defs>
          <linearGradient id={gid} x1="0" x2="1" y1="0" y2="0">
            <stop offset="0%" style={{ stopColor: "var(--fg)", stopOpacity: 0.42 }} />
            <stop offset="100%" style={{ stopColor: "var(--fg)", stopOpacity: 0.22 }} />
          </linearGradient>
          <radialGradient ref={hlRef} id={hid} gradientUnits="userSpaceOnUse" cx="500" cy="120" r={GLINT_RADIUS}>
            <stop offset="0%" style={{ stopColor: "var(--fg)", stopOpacity: 0.85 }} />
            <stop offset="45%" style={{ stopColor: "var(--accent)", stopOpacity: 0.38 }} />
            <stop offset="100%" style={{ stopColor: "var(--accent)", stopOpacity: 0 }} />
          </radialGradient>
        </defs>
        <path
          data-field-surface="glyph"
          d={RAWIN_OUTLINE}
          fill="none"
          stroke={`url(#${gid})`}
          strokeWidth="1.25"
          vectorEffect="non-scaling-stroke"
        />
        <path
          ref={glintRef}
          d={RAWIN_OUTLINE}
          style={{ opacity: 0 }}
          fill="none"
          stroke={`url(#${hid})`}
          strokeWidth="1.6"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
    </div>
  );
}

export default function SiteFooter({ content, availability, contact, footerCopyright, currentYear }: SiteFooterProps) {
  const pathname = usePathname() || "/";

  if (pathname.startsWith("/saint-denis") || pathname === "/ai" || pathname.startsWith("/ai/")) {
    return null;
  }

  const showClosing = CLOSING_SCENE_ROUTES.has(pathname);
  const compact = COMPACT_FOOTER_ROUTES.has(pathname);

  const resolvedCopyright =
    footerCopyright || content?.footerCopyright || "© 2026 RAWIN. All rights reserved. Designed & built by Rushan Siddiqui.";
  const year = currentYear ?? new Date().getFullYear();
  const baseCopyright = resolvedCopyright.trim().startsWith("©")
    ? resolvedCopyright.trim()
    : `© ${year} ${resolvedCopyright.trim()}`;
  // Close the line with a full stop when the CMS text has no terminal punctuation
  const copyrightText = /[.!?]$/.test(baseCopyright) ? baseCopyright : `${baseCopyright}.`;

  const email = contact?.email || "";
  const phone = contact?.phone || "";
  const socialLinks = getActiveSocialLinks(contact?.socials as ContactContent["socials"] | undefined);

  const badgeText = availability?.note || availability?.label || "Available for collaboration";
  const badgeColor = AVAILABILITY_TONE[availability?.state ?? "available"];

  // CMS phrases (bullet-separated) feed the phone ticker; the default is the RAWIN line.
  const rawPhrase = content?.footerBulletNotification?.trim();
  const tickerText = rawPhrase
    ? rawPhrase
        .split(/[•·]/)
        .map((p) => p.trim())
        .filter(Boolean)
        .map((p) => p.charAt(0) + p.slice(1).toLowerCase())
        .join(" · ")
    : DEFAULT_PHRASE;

  const socialRow = (size: "md" | "lg") =>
    socialLinks.length > 0 && (
      <ul className="flex items-center gap-2">
        {socialLinks.map((s) => {
          const Icon = s.icon;
          return (
            <li key={s.id}>
              <a
                href={s.url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`${s.name} (opens in a new tab)`}
                title={s.name}
                data-field-surface="control"
                className={`footer-social inline-flex items-center justify-center rounded-full border border-line text-fg-muted hover:text-fg hover:border-line-strong transition-colors ${
                  size === "lg" ? "w-12 h-12" : "w-11 h-11"
                }`}
              >
                <Icon className="w-[18px] h-[18px]" aria-hidden="true" />
              </a>
            </li>
          );
        })}
      </ul>
    );

  return (
    <footer className="relative w-full mt-20 sm:mt-28 overflow-x-clip" aria-labelledby="rawin-footer-title">
      <h2 id="rawin-footer-title" className="sr-only">
        Site footer
      </h2>

      {showClosing && (
        <ClosingScene
          email={email}
          label={content?.footerClosingLabel?.trim() || "One last thing"}
          invite={content?.closingInvite}
          prompt={content?.closingPrompt}
          cta={content?.closingCta}
        />
      )}

      <div className="mx-auto max-w-[1600px] px-4 sm:px-6 lg:px-10">
        {/* ---------------------------------------------------------------- Desktop / tablet */}
        <div className="hidden md:block border-t border-line">
          {!compact && (
          <div className="grid grid-cols-12 gap-x-8 pt-12 lg:pt-14">
            <div className="col-span-7">
              <span className="block label-mono text-fg-subtle">Contact</span>
              {email ? (
                <a
                  href={`mailto:${email}`}
                  className="group mt-4 inline-flex items-baseline gap-2 font-display text-[clamp(1.8rem,2.8vw,2.6rem)] leading-none tracking-[-0.02em] text-fg"
                >
                  <span className="link-draw">{email}</span>
                  <ArrowUpRight className="w-5 h-5 text-fg-subtle transition-transform duration-500 group-hover:rotate-45 group-hover:text-accent" />
                </a>
              ) : (
                <Link href="/contact" className="mt-4 inline-block font-display text-[2rem] text-fg link-draw">
                  Start a conversation
                </Link>
              )}
              {phone && (
                <a href={`tel:${phone.replace(/s+/g, "")}`} className="mt-3 block text-sm text-fg-muted hover:text-fg w-fit">
                  {phone}
                </a>
              )}
            </div>
            {socialLinks.length > 0 && (
              <div className="col-span-5 flex flex-col items-end">
                <span className="label-mono text-fg-subtle">Elsewhere</span>
                <div className="mt-4">{socialRow("lg")}</div>
              </div>
            )}
          </div>
          )}

          {/* Quiet utility row: availability · copyright · back to top */}
          <div className={`${compact ? "" : "mt-12 lg:mt-14 border-t border-line "}py-5 grid grid-cols-3 items-center gap-6 text-[12.5px]`}>
            <span className={`inline-flex items-center gap-2.5 ${statusTone(badgeColor)}`}>
              <span className="status-dot" />
              <span className="text-fg-muted">{badgeText}</span>
            </span>
            <p className="text-center text-fg-subtle">{copyrightText}</p>
            <div className="flex justify-end">
              <button type="button" onClick={scrollToTop} className="group inline-flex items-center gap-2 h-10 px-1 text-fg-muted hover:text-fg">
                <span>Back to top</span>
                <ArrowUp className="w-3.5 h-3.5 transition-transform duration-500 group-hover:-translate-y-0.5" />
              </button>
            </div>
          </div>
        </div>

        {/* ---------------------------------------------------------------- Phone */}
        <div className="md:hidden border-t border-line pt-8 flex flex-col items-center gap-6 text-center">
          {socialLinks.length > 0 && (
            <div className="flex flex-col items-center gap-3">
              <span className="label-mono text-fg-subtle">Elsewhere</span>
              {socialRow("md")}
            </div>
          )}
          <p className="text-[12.5px] text-fg-subtle">{copyrightText}</p>
          <div className="footer-ticker w-full overflow-hidden" aria-label={tickerText}>
            <div className="animate-marquee" style={{ ["--marquee-duration" as string]: "26s" }} aria-hidden="true">
              {[0, 1].map((rep) => (
                <span key={rep} className="flex items-center shrink-0">
                  {[0, 1].map((k) => (
                    <span key={k} className="inline-flex items-center gap-3 pr-3 font-mono text-[10.5px] uppercase tracking-[0.18em] text-fg-subtle whitespace-nowrap">
                      {tickerText.split(" · ").map((part, i) => (
                        <span key={i} className="inline-flex items-center gap-3">
                          <span aria-hidden="true" className="w-1 h-1 rounded-full bg-accent/70" />
                          {part}
                        </span>
                      ))}
                    </span>
                  ))}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Decorative clipped wordmark — separate from functional content, may run under browser UI.
          Phones: centred on the window, not the page box. A classic scrollbar (desktop browsers
          at phone width; its track is painted in the page colour, so it reads as empty space)
          makes the page 100vw − 100% narrower than the window; half of that moves from the
          right padding to the left, so the edge-to-edge word sits mid-window at the same
          width. Overlay scrollbars (real phones) make the term 0. */}
      <div className="mt-8 sm:mt-10 max-sm:pl-[calc(1rem_+_(100vw_-_100%)_/_2)] max-sm:pr-[calc(1rem_-_(100vw_-_100%)_/_2)] sm:px-4 lg:px-6">
        <ClippedWordmark />
      </div>
    </footer>
  );
}
