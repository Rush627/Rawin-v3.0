"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { getAudio } from "@/lib/audio/engine";
import { heroPresence } from "@/lib/audio/policy";
import { attachInterfaceClicks } from "@/lib/audio/clicks";
import { useSoundSettings } from "./SoundSettings";

/** The homepage hero (Hero.tsx) the ambience level follows. */
const HERO_SELECTOR = "#rawin-hero";
/** IntersectionObserver steps: fine enough that the level glide reads as continuous. */
const STEPS = Array.from({ length: 41 }, (_, i) => i / 40);

/**
 * The public site's sound wiring, in one place:
 * - the CMS settings (what may play) and the route reach the single audio director, which then
 *   tries to start the ambience straight away (the browser may make it wait for a gesture);
 * - on the homepage, the share of the viewport the hero covers sets the ambience level (hero
 *   level at the top, the quieter ambient level below it); every other page is ambient;
 * - every applicable control clicks once per activation (one delegated "click" listener, shared
 *   with the system screens in lib/audio/clicks.ts, so pointer + click never double, and
 *   keyboard and touch activation are covered); an element that makes its own sound opts out
 *   with data-sound="none".
 * Nothing is created per element; nothing plays on hover, scroll, selection or render.
 */
export default function InterfaceSounds() {
  const pathname = usePathname() || "/";
  const { background, click } = useSoundSettings();

  useEffect(() => {
    const audio = getAudio();
    if (!audio) return;
    audio.install();
    const detachClicks = attachInterfaceClicks(audio);
    return () => {
      detachClicks();
      // leaving the public site (e.g. a client navigation into the Studio): the ambience fades out
      audio.setRoute(null);
    };
  }, []);

  // Field diagnosis on phones (no console there): any page opened with ?audiodebug shows the
  // director's state and start-up trace in a small read-only box. Nothing exists otherwise.
  useEffect(() => {
    if (!new URLSearchParams(window.location.search).has("audiodebug")) return;
    const box = document.createElement("pre");
    box.setAttribute("aria-hidden", "true");
    box.style.cssText =
      "position:fixed;left:8px;right:8px;bottom:8px;z-index:2147483647;max-height:40vh;overflow:auto;margin:0;padding:8px;font:11px/1.35 ui-monospace,monospace;background:rgba(0,0,0,.82);color:#d6f5d6;border-radius:8px;pointer-events:none;white-space:pre-wrap";
    document.body.appendChild(box);
    const draw = () => {
      const s = getAudio()?.snapshot();
      if (!s) return;
      const a = s.ambience;
      box.textContent = `status ${s.status} | context ${s.context} | ${a.playing ? "playing" : "not playing"} | format ${a.format ?? "-"} | level ${a.level}/${a.target}\n${s.trace.slice(-12).join("\n")}`;
    };
    draw();
    const timer = window.setInterval(draw, 500);
    return () => {
      window.clearInterval(timer);
      box.remove();
    };
  }, []);

  // the CMS settings first, then the route: the director starts only what is allowed
  useEffect(() => {
    getAudio()?.setAvailable({ background, click });
  }, [background, click]);

  useEffect(() => {
    const audio = getAudio();
    if (!audio) return;
    audio.setRoute(pathname);
    if (pathname !== "/") return;
    // the hero's hold on the view, from its real element (no pixel thresholds): it follows
    // the visual viewport through the observer's root bounds, so phones' changing address bar
    // heights are accounted for
    // The observer follows the hero element itself. The element can be replaced while the page
    // hydrates (an observer left on the old, detached node never reports again), so its identity
    // is checked for the first seconds and on scroll, and the observer moves with it.
    let observer: IntersectionObserver | null = null;
    let observed: Element | null = null;
    const attach = () => {
      const hero = document.querySelector(HERO_SELECTOR);
      if (!hero || hero === observed) return;
      observer?.disconnect();
      observed = hero;
      observer = new IntersectionObserver(
        ([entry]) => {
          const vh = entry.rootBounds?.height || window.innerHeight;
          audio.setHeroPresence(heroPresence(entry.isIntersecting ? entry.intersectionRect.height / Math.max(1, vh) : 0));
        },
        { threshold: STEPS },
      );
      observer.observe(hero);
    };
    attach();
    let checks = 0;
    const watch = window.setInterval(() => {
      attach();
      if (++checks >= 24) window.clearInterval(watch);
    }, 250);
    window.addEventListener("scroll", attach, { passive: true });
    return () => {
      window.clearInterval(watch);
      window.removeEventListener("scroll", attach);
      observer?.disconnect();
    };
  }, [pathname]);

  return null;
}
