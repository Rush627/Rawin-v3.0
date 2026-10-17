"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { COMPANION, Settle, dock, dockPosition, dockRect, footerLift, samplePoints, type Coverage, type Insets, type Placement, type Rect } from "@/lib/orbit-companion/placement";
import { getOrbitActivity, subscribeOrbitActivity, type OrbitActivity } from "@/lib/orbit/presence";
import "./orbit-companion.css";

/** The site's phone breakpoint (Tailwind md is 768 px; THEME_MOBILE_QUERY uses the same). */
const PHONE = "(max-width: 767px)";
/** Orbit's own page is the conversation itself: no entry point on top of it. */
const OWN_ROUTES = ["/ai"];

const noop = () => () => {};

/**
 * The mobile Orbit companion: a small robot head docked to the bottom-right corner of the
 * viewport that opens Orbit (/ai) from anywhere on the public site, on phones only. One
 * instance, rendered into <body> (fixed to the viewport, outside any transformed or clipped
 * page container); it replaces the phone "Orbit · Ask about the work" row under the header.
 *
 * It stays available while the visitor reads: ordinary content passing behind it only makes it
 * compact; a control behind it (a button, a field, a fixed bar) lifts it a step up the edge so
 * the control stays reachable; it hides only when no step is clear of controls, a field has
 * focus (the keyboard is up), the menu or a dialog is open, or the entrance intro plays, and it
 * returns by itself afterwards. See lib/orbit-companion/placement.ts for the rules.
 */
export default function OrbitCompanion() {
  const pathname = usePathname() || "/";
  const phone = useSyncExternalStore(
    (fn) => {
      const mq = window.matchMedia(PHONE);
      mq.addEventListener("change", fn);
      return () => mq.removeEventListener("change", fn);
    },
    () => window.matchMedia(PHONE).matches,
    () => false,
  );
  const mounted = useSyncExternalStore(noop, () => true, () => false);
  if (!mounted || !phone || OWN_ROUTES.some((r) => pathname === r || pathname.startsWith(`${r}/`))) return null;
  return createPortal(<Companion pathname={pathname} />, document.body);
}

/* ------------------------------------------------------------------ what is behind it */

/** Content worth knowing about: what passes behind the companion makes it compact. */
const CONTENT_SELECTOR =
  "a,button,input,textarea,select,label,img,video,picture,svg,iframe,p,h1,h2,h3,h4,h5,h6,li,blockquote,figure,figcaption,pre,code,table,dt,dd,nav,header,summary,[role=button],[role=link],[role=img],[role=heading],[role=tab],[role=switch]";
/** Controls that must stay reachable: the companion lifts away from these (or hides). */
const CONTROL_SELECTOR =
  "button,input,textarea,select,summary,[role=button],[role=switch],[role=tab],[role=checkbox],[role=radio],[role=textbox],[role=slider],[role=menuitem],[contenteditable='true']";

/**
 * The content currently on screen, kept by an IntersectionObserver (so no page scan per check):
 * it also covers elements hit-testing cannot see (pointer-events: none, such as moving chip
 * rows), and it honours clipping (a collapsed panel's items are not on screen). Refreshed on
 * route changes and layout changes, never per frame.
 */
function createContentIndex(root: HTMLElement) {
  const visible = new Set<Element>();
  const observed = new Set<Element>();
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (e.isIntersecting) visible.add(e.target);
      else visible.delete(e.target);
    }
  });
  const refresh = () => {
    for (const el of observed) {
      if (!el.isConnected) {
        io.unobserve(el);
        observed.delete(el);
        visible.delete(el);
      }
    }
    for (const el of document.querySelectorAll(CONTENT_SELECTOR)) {
      if (observed.has(el) || root.contains(el) || el.closest("[data-orbit-ignore]")) continue;
      io.observe(el);
      observed.add(el);
    }
  };
  return { visible, refresh, disconnect: () => io.disconnect() };
}

type Kind = "control" | "content" | "none";

/** One check's view of what a rect covers (results cached for the duration of the check). */
function makeCoverage(root: HTMLElement, index: Set<Element>) {
  const viewArea = window.innerWidth * window.innerHeight;
  const styles = new Map<Element, CSSStyleDeclaration>();
  const style = (el: Element) => {
    let cs = styles.get(el);
    if (!cs) {
      cs = getComputedStyle(el);
      styles.set(el, cs);
    }
    return cs;
  };
  const fixedCache = new Map<Element, boolean>();
  /** Inside a fixed or sticky bar (the header, a back-to-top button): treated as a control. */
  const inFixedBar = (el: Element): boolean => {
    const known = fixedCache.get(el);
    if (known !== undefined) return known;
    let yes = false;
    for (let a: Element | null = el; a && a !== document.body; a = a.parentElement) {
      const p = style(a).position;
      if (p === "fixed" || p === "sticky") {
        yes = !root.contains(a);
        break;
      }
    }
    fixedCache.set(el, yes);
    return yes;
  };
  const kinds = new Map<Element, Kind>();
  const classify = (el: Element): Kind => {
    const known = kinds.get(el);
    if (known) return known;
    let k: Kind = "none";
    if (el !== document.body && el !== document.documentElement && !root.contains(el) && !el.closest("[data-orbit-ignore]")) {
      const r = el.getBoundingClientRect();
      // large layout boxes (sections, page backgrounds) are not "behind" the companion
      const large = r.width * r.height >= viewArea * 0.6;
      const cs = style(el);
      if (cs.visibility === "hidden" || cs.display === "none") k = "none";
      else if (el.matches(CONTROL_SELECTOR)) k = "control";
      else if (!large && inFixedBar(el)) k = "control";
      else if (!large && el.matches(CONTENT_SELECTOR)) k = "content";
      else if (!large) {
        const text = Array.from(el.childNodes).some((n) => n.nodeType === 3 && Boolean(n.textContent?.trim()));
        const bg = cs.backgroundColor.match(/[\d.]+/g);
        const alpha = bg ? (bg.length > 3 ? Number(bg[3]) : 1) : 0;
        const surface = alpha > 0.06 || cs.backgroundImage !== "none" || cs.boxShadow !== "none" || parseFloat(cs.borderTopWidth) > 0;
        if (text || surface) k = "content";
      }
    }
    kinds.set(el, k);
    return k;
  };
  return (r: Rect): Coverage => {
    const out: Coverage = { content: false, control: false };
    const note = (k: Kind) => {
      if (k === "control") out.control = true;
      else if (k === "content") out.content = true;
    };
    // 1. the indexed content on screen (by box)
    for (const el of index) {
      const b = el.getBoundingClientRect();
      if (!b.width || !b.height) continue;
      if (b.left < r.x + r.w && r.x < b.right && b.top < r.y + r.h && r.y < b.bottom) {
        note(classify(el));
        if (out.control) return out;
      }
    }
    // 2. what hit-testing finds there: card surfaces, loose text, fixed bars
    for (const p of samplePoints(r)) {
      if (p.x < 0 || p.y < 0 || p.x >= window.innerWidth || p.y >= window.innerHeight) continue;
      for (const el of document.elementsFromPoint(p.x, p.y)) {
        note(classify(el));
        if (out.control) return out;
      }
    }
    return out;
  };
}

function readSafeInsets(): Insets {
  const probe = document.createElement("div");
  probe.style.cssText =
    "position:fixed;visibility:hidden;pointer-events:none;padding:env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left)";
  document.body.appendChild(probe);
  const cs = getComputedStyle(probe);
  const out = { top: parseFloat(cs.paddingTop) || 0, right: parseFloat(cs.paddingRight) || 0, bottom: parseFloat(cs.paddingBottom) || 0, left: parseFloat(cs.paddingLeft) || 0 };
  probe.remove();
  return out;
}

/* ------------------------------------------------------------------ the companion */

/** The "Ask Orbit" invitation: when, how long, how often (per browsing session). */
const INVITE_KEY = "rawin-orbit-invite";
const INVITE = { afterMs: 2600, showMs: 4200, quietAfterScrollMs: 1500, gapMs: 45_000, perSession: 3 } as const;

/** Gestures on the robot: a tap, quick repeated taps, a finger gliding over it, a long press. */
const GESTURE = {
  /** a tap opens Orbit after this window, unless more taps follow (a quick series is play) */
  openDelayMs: 280,
  /** taps closer together than this count as one series */
  seriesMs: 650,
  /** taps in a series that make it annoyed */
  annoyedAt: 3,
  /** a glide: this much travel (px) over this long (ms) is petting, not a tap */
  pettingPx: 22,
  pettingMs: 120,
  /** a press held this long (ms) with less than `stillPx` movement is a long press */
  longPressMs: 650,
  stillPx: 8,
} as const;

type Expression = "idle" | "curious" | "happy" | "angry" | "sad";

function readInvite(): { count: number; last: number; engaged: boolean } {
  try {
    const [count, last, engaged] = (sessionStorage.getItem(INVITE_KEY) || "0,0,0").split(",").map(Number);
    return { count: count || 0, last: last || 0, engaged: engaged === 1 };
  } catch {
    return { count: INVITE.perSession, last: 0, engaged: true };
  }
}
function writeInvite(v: { count: number; last: number; engaged: boolean }) {
  try {
    sessionStorage.setItem(INVITE_KEY, `${v.count},${v.last},${v.engaged ? 1 : 0}`);
  } catch {
    // storage unavailable: nothing more is shown this page
  }
}

function Companion({ pathname }: { pathname: string }) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const bubbleRef = useRef<HTMLSpanElement | null>(null);
  const buttonRef = useRef<HTMLAnchorElement | null>(null);
  const router = useRouter();
  const activity = useSyncExternalStore(subscribeOrbitActivity, getOrbitActivity, (): OrbitActivity => "idle");

  useEffect(() => {
    const root = rootRef.current;
    const bubble = bubbleRef.current;
    const button = buttonRef.current;
    if (!root || !bubble || !button) return;
    let safe = readSafeInsets();
    let current: Placement | null = null;
    let lift = 0;
    let visible = false;
    let lastScroll = 0;
    let shownAt = 0;
    let checkTimer = 0;
    let throttleUntil = 0;
    let trackRaf = 0;
    const timers = new Set<number>();
    const later = (fn: () => void, ms: number) => {
      const id = window.setTimeout(() => {
        timers.delete(id);
        fn();
      }, ms);
      timers.add(id);
      return id;
    };
    const cancel = (id: number) => {
      window.clearTimeout(id);
      timers.delete(id);
    };
    const grow = new Settle(2);
    const drop = new Settle(2);
    const html = document.documentElement;
    const index = createContentIndex(root);
    index.refresh();

    /* -------------------------------------------------------------- expressions */
    // One controller: the visible face is Orbit's real state (thinking, listening, speaking) when
    // there is one (CSS, data-activity), else the latest interaction, which returns to idle by itself.
    let exprTimer = 0;
    const express = (e: Expression, holdMs = 0) => {
      cancel(exprTimer);
      root.dataset.expression = e;
      if (e !== "idle" && holdMs > 0) exprTimer = later(() => (root.dataset.expression = "idle"), holdMs);
    };
    root.dataset.expression = "idle";

    /* -------------------------------------------------------------- the invitation */
    let inviteTimer = 0;
    const hideBubble = () => {
      cancel(inviteTimer);
      bubble.dataset.show = "false";
    };
    const engage = () => {
      hideBubble();
      writeInvite({ ...readInvite(), engaged: true });
    };
    const maybeInvite = (cover: (r: Rect) => Coverage) => {
      if (!visible || !current || bubble.dataset.show === "true" || root.dataset.expression !== "idle" || root.dataset.activity !== "idle") return;
      const now = performance.now();
      if (now - shownAt < INVITE.afterMs || now - lastScroll < INVITE.quietAfterScrollMs) return;
      const inv = readInvite();
      if (inv.engaged || inv.count >= INVITE.perSession || Date.now() - inv.last < INVITE.gapMs) return;
      const box = root.getBoundingClientRect();
      const w = 92;
      const r: Rect = { x: box.left - w - 8, y: box.top + box.height / 2 - 16, w, h: 32 };
      if (r.x < 8) return;
      if (cover(r).control) return; // never over a button, field or fixed bar
      bubble.dataset.show = "true";
      writeInvite({ ...inv, count: inv.count + 1, last: Date.now() });
      inviteTimer = later(hideBubble, INVITE.showMs);
    };

    /* -------------------------------------------------------------- placement */
    const blocked = () => {
      const a = document.activeElement as HTMLElement | null;
      return (
        document.hidden ||
        html.getAttribute("data-startup-phase") === "play" ||
        Boolean(document.querySelector('.menu-toggle[aria-expanded="true"], [role="dialog"][aria-modal="true"]')) ||
        Boolean(a && (a.matches("input, textarea, select") || a.isContentEditable))
      );
    };

    const setVisible = (on: boolean) => {
      if (on === visible) return;
      visible = on;
      root.dataset.visible = on ? "true" : "false";
      if (on) shownAt = performance.now();
      else {
        hideBubble();
        express("idle");
      }
    };

    const viewport = () => ({ vw: window.innerWidth, vh: window.visualViewport?.height ?? window.innerHeight });

    /** The footer's pull on the dock: beside its links block, above its wordmark (measured). */
    const measureLift = (vh: number) => {
      const floor = document.querySelector("[data-orbit-footer-floor]");
      if (!floor) return 0;
      const f = floor.getBoundingClientRect();
      if (f.top > vh * 1.6) return 0; // the footer is far away: nothing to measure
      const anchorEl = document.querySelector("[data-orbit-footer-anchor]");
      const a = anchorEl?.getBoundingClientRect();
      return footerLift({ vh, safe, size: COMPANION.size.normal, anchor: a && a.height ? { top: a.top, bottom: a.bottom } : null, floorTop: f.top });
    };

    const apply = (next: Placement) => {
      const size = COMPANION.size[next.size];
      if (current && (current.step !== next.step || current.size !== next.size)) hideBubble();
      root.style.left = `${Math.round(next.x)}px`;
      root.style.top = `${Math.round(next.y)}px`;
      root.style.width = `${size}px`;
      root.style.height = `${size}px`;
      root.dataset.size = next.size;
      root.dataset.step = String(next.step);
      current = next;
    };

    const evaluate = () => {
      throttleUntil = performance.now() + 80;
      window.clearTimeout(checkTimer);
      if (blocked()) {
        grow.reset();
        drop.reset();
        setVisible(false);
        // look again soon: a menu or dialog leaves after its exit animation, focus moves on
        checkTimer = window.setTimeout(evaluate, 300);
        return;
      }
      const { vw, vh } = viewport();
      lift = measureLift(vh);
      const cover = makeCoverage(root, index.visible);
      // hysteresis inputs: has the current step been clear (grow back)? is a lower step free (drop back)?
      let mayGrow = false;
      let mayDrop = false;
      if (current) {
        const here = cover(dockRect(current.step, "normal", vw, vh, safe, lift));
        mayGrow = grow.next(!here.content && !here.control);
        let lowerFree = false;
        for (let s = 0; s < current.step && !lowerFree; s++) lowerFree = !cover(dockRect(s, "compact", vw, vh, safe, lift)).control;
        mayDrop = drop.next(lowerFree);
      }
      const next = dock({ vw, vh, safe, cover, current: current ? { step: current.step, size: current.size } : null, mayGrow, mayDrop, lift });
      if (next) apply(next);
      setVisible(Boolean(next));
      if (performance.now() - lastScroll > 200) root.dataset.tracking = "false";
      if (next) maybeInvite(cover);
    };

    /** While the footer is in reach, the dock follows it every frame of a scroll (cheap: two rects). */
    const trackFooter = () => {
      trackRaf = 0;
      if (!current || !visible) return;
      const { vw, vh } = viewport();
      const nextLift = measureLift(vh);
      if (nextLift === lift) return;
      lift = nextLift;
      root.dataset.tracking = "true"; // moves with the page, no easing lag
      root.style.top = `${Math.round(dockPosition(current.step, current.size, vw, vh, safe, lift).y)}px`;
    };

    /* -------------------------------------------------------------- gestures */
    let gesture: { id: number; x: number; y: number; t: number; path: number; petting: boolean; long: boolean } | null = null;
    let longTimer = 0;
    let openTimer = 0;
    let seriesTimer = 0;
    let taps = 0;
    let swallowClick = false;

    const open = () => {
      engage();
      express("happy", 600);
      router.push("/ai");
    };

    const onPointerDown = (e: PointerEvent) => {
      if (e.button !== 0) return;
      hideBubble();
      swallowClick = false; // a press that never became a click must not eat this one
      gesture = { id: e.pointerId, x: e.clientX, y: e.clientY, t: performance.now(), path: 0, petting: false, long: false };
      try {
        button.setPointerCapture(e.pointerId);
      } catch {
        // capture unavailable: moves are still seen while the finger stays on the robot
      }
      cancel(longTimer);
      longTimer = later(() => {
        if (gesture && !gesture.petting && gesture.path < GESTURE.stillPx) {
          gesture.long = true;
          express("sad");
        }
      }, GESTURE.longPressMs);
    };
    const onPointerMove = (e: PointerEvent) => {
      const g = gesture;
      if (!g || e.pointerId !== g.id) return;
      g.path += Math.hypot(e.clientX - g.x, e.clientY - g.y);
      g.x = e.clientX;
      g.y = e.clientY;
      // a glide over the head (within reach of it): petting, not a tap
      const box = root.getBoundingClientRect();
      const near = e.clientX > box.left - 28 && e.clientX < box.right + 28 && e.clientY > box.top - 28 && e.clientY < box.bottom + 28;
      if (!g.petting && !g.long && near && g.path > GESTURE.pettingPx && performance.now() - g.t > GESTURE.pettingMs) {
        g.petting = true;
        cancel(longTimer);
        express("happy");
      }
    };
    const onPointerEnd = (e: PointerEvent) => {
      const g = gesture;
      if (!g || e.pointerId !== g.id) return;
      cancel(longTimer);
      gesture = null;
      if (g.petting) {
        swallowClick = true; // the lift of a glide is not a tap
        express("happy", 900);
      } else if (g.long) {
        swallowClick = true;
        express("sad", 1200);
      }
    };
    const onClick = (e: MouseEvent) => {
      // ctrl / cmd / shift / middle click: the browser's own handling (a new tab or window)
      if (e.ctrlKey || e.metaKey || e.shiftKey || e.button !== 0) return;
      if (swallowClick) {
        swallowClick = false;
        e.preventDefault();
        return;
      }
      if (e.detail === 0) {
        // keyboard activation: open at once
        engage();
        return;
      }
      e.preventDefault();
      engage();
      cancel(seriesTimer);
      seriesTimer = later(() => (taps = 0), GESTURE.seriesMs);
      taps += 1;
      if (taps === 1) {
        express("curious", 700);
        cancel(openTimer);
        openTimer = later(open, GESTURE.openDelayMs);
        return;
      }
      // more taps in quick succession: playing with it, not asking to open Orbit
      cancel(openTimer);
      if (taps >= GESTURE.annoyedAt) express("angry", 1700);
      else express("curious", 700);
    };
    const onBubbleClick = () => open();
    button.addEventListener("pointerdown", onPointerDown);
    button.addEventListener("pointermove", onPointerMove);
    button.addEventListener("pointerup", onPointerEnd);
    button.addEventListener("pointercancel", onPointerEnd);
    button.addEventListener("click", onClick);
    bubble.addEventListener("click", onBubbleClick);

    /* -------------------------------------------------------------- events */
    const schedule = (delay = 120) => {
      window.clearTimeout(checkTimer);
      checkTimer = window.setTimeout(evaluate, delay);
    };
    const onScroll = () => {
      lastScroll = performance.now();
      hideBubble();
      if (!trackRaf) trackRaf = requestAnimationFrame(trackFooter);
      // during a scroll: at most one full check per 80 ms, and one when it settles
      if (performance.now() >= throttleUntil) evaluate();
      else schedule(160);
    };
    const onFocus = () => schedule(0);
    const onResize = () => {
      safe = readSafeInsets();
      schedule(120);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);
    window.addEventListener("orientationchange", onResize);
    window.visualViewport?.addEventListener("resize", onResize);
    document.addEventListener("focusin", onFocus);
    document.addEventListener("focusout", onFocus);
    document.addEventListener("visibilitychange", onFocus);
    const mo = new MutationObserver(() => schedule(60));
    mo.observe(html, { attributes: true, attributeFilter: ["data-startup-phase"] });
    mo.observe(document.body, { attributes: true, subtree: true, attributeFilter: ["aria-expanded", "aria-modal"] });
    let indexTimer = 0;
    const ro = new ResizeObserver(() => {
      window.clearTimeout(indexTimer);
      indexTimer = window.setTimeout(() => {
        index.refresh();
        schedule(0);
      }, 250);
    });
    ro.observe(document.body);
    // a light re-check while the page sits still: content that moved without resizing anything,
    // the grow / drop hysteresis completing, the invitation's moment
    const idle = window.setInterval(() => {
      if (!document.hidden && performance.now() - lastScroll > 300) evaluate();
    }, 700);

    root.dataset.visible = "false";
    const t1 = window.setTimeout(evaluate, 500);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(checkTimer);
      window.clearTimeout(indexTimer);
      window.clearInterval(idle);
      cancelAnimationFrame(trackRaf);
      timers.forEach((id) => window.clearTimeout(id));
      timers.clear();
      index.disconnect();
      button.removeEventListener("pointerdown", onPointerDown);
      button.removeEventListener("pointermove", onPointerMove);
      button.removeEventListener("pointerup", onPointerEnd);
      button.removeEventListener("pointercancel", onPointerEnd);
      button.removeEventListener("click", onClick);
      bubble.removeEventListener("click", onBubbleClick);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("orientationchange", onResize);
      window.visualViewport?.removeEventListener("resize", onResize);
      document.removeEventListener("focusin", onFocus);
      document.removeEventListener("focusout", onFocus);
      document.removeEventListener("visibilitychange", onFocus);
      mo.disconnect();
      ro.disconnect();
    };
  }, [pathname, router]);

  return (
    <div ref={rootRef} className="orbit-companion" data-visible="false" data-activity={activity} data-orbit-companion="">
      {/* the invitation: a pointer shortcut to the same place as the robot (which carries the
          accessible name), so it is hidden from assistive technology and not focusable */}
      <span ref={bubbleRef} className="orbit-companion-bubble" data-show="false" aria-hidden="true">
        Ask Orbit
      </span>
      <Link ref={buttonRef} href="/ai" className="orbit-companion-button" aria-label="Ask Orbit, RAWIN's assistant">
        <RobotHead />
      </Link>
    </div>
  );
}

/* ------------------------------------------------------------------ the robot */

/**
 * A premium robot head: warm-ivory shell, graphite visor and side pods, a glass reflection and
 * violet eyes. Its expressions use the same eyes: blinks and glances (idle), a wider eye and a
 * tilt (curious), smiling arcs and a sparkle (happy), slanted brows and narrowed eyes with a
 * small shake (annoyed), drooping brows and lowered eyes (sad). All motion is CSS
 * (orbit-companion.css), keyed on data-expression and data-activity.
 */
function RobotHead() {
  return (
    <svg className="oc-svg" viewBox="5 3 54 59" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id="oc-shell" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fbf8f1" />
          <stop offset="0.55" stopColor="#ece5d8" />
          <stop offset="1" stopColor="#cbc2b2" />
        </linearGradient>
        <linearGradient id="oc-graphite" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#3b3b45" />
          <stop offset="1" stopColor="#111117" />
        </linearGradient>
        <linearGradient id="oc-visor" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#1d1a33" />
          <stop offset="1" stopColor="#06050c" />
        </linearGradient>
        <radialGradient id="oc-glow" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#a48bff" stopOpacity="0.55" />
          <stop offset="1" stopColor="#a48bff" stopOpacity="0" />
        </radialGradient>
      </defs>
      <ellipse className="oc-shadow" cx="32" cy="57.5" rx="13" ry="2.2" />
      <g className="oc-float">
        <line className="oc-antenna" x1="32" y1="14" x2="32" y2="8.5" />
        <circle cx="32" cy="7.2" r="2.2" fill="url(#oc-shell)" stroke="#23222b" strokeWidth="0.6" />
        <circle className="oc-tip" cx="32" cy="7.2" r="0.9" />
        <path className="oc-sparkle" d="M43 6.5 l0.9 2.1 2.1 0.9 -2.1 0.9 -0.9 2.1 -0.9 -2.1 -2.1 -0.9 2.1 -0.9z" />
        <rect x="8.5" y="27" width="6" height="12" rx="3" fill="url(#oc-graphite)" />
        <rect x="49.5" y="27" width="6" height="12" rx="3" fill="url(#oc-graphite)" />
        <circle className="oc-led" cx="11.5" cy="33" r="0.9" />
        <circle className="oc-led" cx="52.5" cy="33" r="0.9" />
        <g className="oc-head">
          <rect x="12" y="13" width="40" height="37" rx="15" fill="url(#oc-shell)" stroke="rgba(25,23,34,0.32)" strokeWidth="0.6" />
          <path d="M18 17.5 Q32 12.8 46 17.5" fill="none" stroke="#fff" strokeOpacity="0.7" strokeWidth="1" strokeLinecap="round" />
          <rect x="16" y="21" width="32" height="20" rx="9" fill="url(#oc-visor)" />
          <ellipse className="oc-glow" cx="32" cy="31" rx="14" ry="7" fill="url(#oc-glow)" />
          <g className="oc-eyes">
            <g className="oc-look">
              <g className="oc-eye-l">
                <rect className="oc-eye" x="23.5" y="27" width="5" height="8" rx="2.5" />
                <circle className="oc-eye-shine" cx="25" cy="29" r="0.8" />
              </g>
              <g className="oc-eye-r">
                <rect className="oc-eye" x="35.5" y="27" width="5" height="8" rx="2.5" />
                <circle className="oc-eye-shine" cx="37" cy="29" r="0.8" />
              </g>
              {/* happy: the same eyes as smiling arcs */}
              <path className="oc-eye-smile" d="M23.2 32.6 Q26 27.6 28.8 32.6 M35.2 32.6 Q38 27.6 40.8 32.6" />
            </g>
          </g>
          {/* brows, only drawn for the annoyed and sad faces */}
          <path className="oc-brow oc-brow-angry" d="M22.4 24.6 L28.8 26.6 M41.6 24.6 L35.2 26.6" />
          <path className="oc-brow oc-brow-sad" d="M22.4 26.4 L28.8 24.6 M41.6 26.4 L35.2 24.6" />
          <path d="M19.5 24.5 Q24 22.2 30 22.2" fill="none" stroke="#fff" strokeOpacity="0.2" strokeWidth="1.3" strokeLinecap="round" />
          <path d="M23 46 Q32 48.6 41 46" fill="none" stroke="rgba(30,28,40,0.22)" strokeWidth="0.8" strokeLinecap="round" />
        </g>
      </g>
    </svg>
  );
}
