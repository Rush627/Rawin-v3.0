"use client";

import { useEffect, useRef } from "react";
import { AWAKENING_STAGES, SUPERNOVA_STAGES, startupPlan } from "@/lib/startup/launch";
import { canvasBox, easeInOutCubic, easeOutCubic, runClock, span, type StartupEnd, type StartupLayout } from "./clock";
import "./startup.css";

export type FutureSystemMode = "awakening" | "launch";

export interface FutureSystemProps {
  /** "awakening": the normal startup (about 2.5 s); "launch": the CMS special launch */
  mode: FutureSystemMode;
  layout: StartupLayout;
  reduced: boolean;
  /** special launch only: one of the presets (10, 12, 15 s); the timeline scales with it */
  durationS?: number;
  /** special launch only: the CMS title and the optional line under it */
  title?: string;
  subtitle?: string;
  /** the CMS dark-theme logo when the site header uses a logo; otherwise the typographic mark */
  logo?: { url: string; alt?: string } | null;
  onReveal?: () => void;
  onDone: (how: StartupEnd) => void;
}

/** Status copy per stage: it names what the sequence shows, it never claims a real check. */
const STATUS: Record<string, string> = {
  dormant: "STANDBY",
  initialization: "INITIALIZING",
  structure: "BUILDING STRUCTURE",
  synchronization: "SYNCHRONIZING",
  alignment: "ALIGNING",
  activation: "ACTIVATING",
  identity: "ONLINE",
  reveal: "ONLINE",
};

/** Ruler ticks along the axis, revealed from the centre outward. */
const TICKS = { desktop: 41, mobile: 23 } as const;
/** Tick positions that carry a data point, lit one by one while the system synchronizes. */
const NODES = { desktop: [4, 9, 14, 17, 20, 23, 26, 31, 36], mobile: [3, 7, 11, 15, 19] } as const;

/**
 * RAWIN FUTURE SYSTEM: the startup compositions. One renderer, two modes of one visual family,
 * and two layouts designed separately:
 *   desktop: a wide field. A horizontal axis with a measured ruler, a dot lattice swept by one
 *            scan band, status at the bottom left, the sequence counter top right, progress in
 *            dot-matrix numerals bottom right. The wordmark resolves on the axis, which parts
 *            around it.
 *   mobile:  portrait first. A vertical axis down the centre with its own ruler and scan from
 *            top to bottom, a compact header row and footer row inside the safe areas, smaller
 *            type, a sparser lattice, and the wordmark crossing the axis at eye height.
 * The special launch adds structure guides that converge onto the axis, three synchronization
 * channels and the CMS title; both modes end with one restrained activation pulse, then the
 * wordmark, then the website. Everything is driven from one frame clock (transforms and
 * opacity, one small canvas), sized from its own box so the Studio previews reuse it as is.
 */
export default function FutureSystem({ mode, layout, reduced, durationS = 12, title, subtitle, logo, onReveal, onDone }: FutureSystemProps) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const skipRef = useRef<() => void>(() => {});
  const cbs = useRef({ onReveal, onDone });
  useEffect(() => {
    cbs.current = { onReveal, onDone };
  });

  const launch = mode === "launch";
  const mobile = layout === "mobile";
  const stages = launch ? SUPERNOVA_STAGES : AWAKENING_STAGES;

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const el = (name: string) => root.querySelector<HTMLElement>(`[data-el="${name}"]`);
    const all = (name: string) => Array.from(root.querySelectorAll<HTMLElement>(`[data-el="${name}"]`));
    const plan = startupPlan(launch ? "supernova" : "awakening", durationS, mobile, reduced);
    const total = plan.totalMs;
    const range = new Map<string, { from: number; to: number }>(stages.map((s) => [s.id, s]));
    const P = (id: string, u: number) => {
      const r = range.get(id);
      return r ? span(u, r.from, r.to) : 0;
    };

    const parts = {
      corners: all("corner"),
      axisA: el("axis-a"),
      axisB: el("axis-b"),
      ticks: all("tick"),
      nodes: all("node"),
      scan: el("scan"),
      pulse: el("pulse"),
      mark: el("mark"),
      sub: el("sub"),
      status: el("status"),
      bar: el("bar"),
      digits: el("digits"),
      counter: el("counter"),
      guides: all("guide"),
      cross: el("cross"),
      channels: all("channel"),
      frame: el("frame"),
      skip: el("skip"),
    };
    const nTicks = parts.ticks.length;
    const mid = (nTicks - 1) / 2;
    const box = canvasBox(canvasRef.current, mobile ? 1.5 : 1.75);
    const onResize = () => {
      box?.measure();
      measureGap();
    };
    window.addEventListener("resize", onResize);

    const set = (node: HTMLElement | null | undefined, opacity: number, transform?: string) => {
      if (!node) return;
      node.style.opacity = String(Math.max(0, Math.min(1, opacity)));
      if (transform !== undefined) node.style.transform = transform;
    };
    let lastStatus = "";
    let lastDigits = "";
    let lastCounter = "";
    const text = (node: HTMLElement | null, value: string, prev: string) => {
      if (node && value !== prev) node.textContent = value;
      return value;
    };

    // the lattice: a fixed dot grid, faint, lit near the scan band and by the activation pulse
    const lattice = (appear: number, scanAt: number, pulse: number, fade: number) => {
      if (!box) return;
      const { ctx, w, h } = box;
      ctx.clearRect(0, 0, w, h);
      const step = mobile ? 24 : 28;
      const cx = w / 2;
      const cy = mobile ? h * 0.48 : h / 2;
      const rx = mobile ? w * 0.62 : w * 0.46;
      const ry = mobile ? h * 0.4 : h * 0.42;
      const band = (mobile ? h : w) * 0.07;
      for (let y = step / 2; y < h; y += step) {
        for (let x = step / 2; x < w; x += step) {
          const nx = (x - cx) / rx;
          const ny = (y - cy) / ry;
          const v = 1 - (nx * nx + ny * ny);
          if (v <= 0) continue; // negative space toward the edges
          const d = (mobile ? y : x) - scanAt;
          const lit = scanAt > -9999 ? Math.exp(-(d * d) / (band * band)) : 0;
          const a = (0.07 * appear + 0.32 * lit + 0.16 * pulse * v) * v * (1 - fade);
          if (a < 0.008) continue;
          ctx.fillStyle = `rgba(245,247,250,${a.toFixed(3)})`;
          ctx.fillRect(x - 0.5, y - 0.5, 1, 1);
        }
      }
    };

    // the part of each axis half kept clear around the wordmark (%), measured from the real
    // mark and line under it, so any size, logo or title fits
    let gapMax = mobile ? 17 : 26;
    const measureGap = () => {
      const axis = parts.axisA?.parentElement?.getBoundingClientRect();
      const m = parts.mark?.getBoundingClientRect();
      const sub = parts.sub?.getBoundingClientRect();
      if (!axis || !m || !sub) return;
      const half = (mobile ? axis.height : axis.width) / 2;
      if (half <= 0) return;
      const centre = mobile ? axis.top + half : axis.left + half;
      const reach = mobile
        ? Math.max(centre - m.top, m.bottom - centre, sub.bottom - centre) + 14
        : Math.max(centre - m.left, m.right - centre, sub.right - centre) + 22;
      gapMax = Math.min(60, (reach / half) * 100);
    };
    measureGap();
    const logoImg = parts.mark?.querySelector("img");
    logoImg?.addEventListener("load", measureGap);

    const frame = (t: number) => {
      const u = t / total;
      if (reduced) {
        // calm version: everything already in place, the mark fades in, then the overlay fades
        const k = easeOutCubic(span(t, 0, Math.min(700, plan.revealMs * 0.6)));
        parts.corners.forEach((c) => set(c, 0.5 * k));
        set(parts.axisA, 0.4 * k, mobile ? "scaleY(1)" : "scaleX(1)");
        set(parts.axisB, 0.4 * k, mobile ? "scaleY(1)" : "scaleX(1)");
        if (parts.axisA) parts.axisA.style.clipPath = `inset(${mobile ? `0 0 ${gapMax}% 0` : `0 ${gapMax}% 0 0`})`;
        if (parts.axisB) parts.axisB.style.clipPath = `inset(${mobile ? `${gapMax}% 0 0 0` : `0 0 0 ${gapMax}%`})`;
        set(parts.mark, k);
        set(parts.sub, k);
        set(parts.frame, k);
        lastStatus = text(parts.status, "ONLINE", lastStatus);
        if (t >= plan.revealMs) reveal();
        root.style.opacity = String(1 - easeInOutCubic(span(t, plan.revealMs, total)));
        if (t < 40) lattice(0.6, -99999, 0, 0);
        return;
      }

      const appear = easeOutCubic(P("dormant", u));
      const build = launch ? P("structure", u) : P("initialization", u);
      const sync = P("synchronization", u);
      const align = launch ? P("alignment", u) : sync;
      const act = P("activation", u);
      const ident = P("identity", u);
      const rv = P("reveal", u);
      const pulse = Math.sin(Math.PI * act);

      // registration corners and the information frame
      parts.corners.forEach((c) => set(c, 0.55 * appear * (1 - ident * 0.5)));
      set(parts.frame, appear);

      // the axis draws out from the centre, brightens with the pulse, parts for the wordmark
      const draw = easeInOutCubic(span(build, 0, 0.6));
      const axisOpacity = (0.28 + 0.3 * sync + 0.42 * pulse) * (draw > 0 ? 1 : 0);
      const gap = easeOutCubic(ident) * gapMax;
      set(parts.axisA, axisOpacity, mobile ? `scaleY(${draw})` : `scaleX(${draw})`);
      set(parts.axisB, axisOpacity, mobile ? `scaleY(${draw})` : `scaleX(${draw})`);
      if (parts.axisA) parts.axisA.style.clipPath = mobile ? `inset(0 0 ${gap}% 0)` : `inset(0 ${gap}% 0 0)`;
      if (parts.axisB) parts.axisB.style.clipPath = mobile ? `inset(${gap}% 0 0 0)` : `inset(0 0 0 ${gap}%)`;

      // the ruler: ticks appear from the centre outward, quietly, then dim as the mark arrives
      const tickReach = easeOutCubic(span(build, 0.2, 1)) * (mid + 1);
      parts.ticks.forEach((tk, i) => {
        // ticks inside the gap opened for the wordmark go dark with the axis there
        const clear = Math.abs(i - mid) / (mid + 0.5) < gap / 100 ? 0 : 1;
        const on = Math.abs(i - mid) < tickReach ? clear : 0;
        const major = i % 5 === 0 ? 1 : 0;
        set(tk, on * (0.22 + 0.25 * major) * (1 - ident * 0.7));
      });
      // data points light in order while the system synchronizes
      parts.nodes.forEach((n, i) => {
        const lit = sync * parts.nodes.length > i ? 1 : 0;
        const accent = i === parts.nodes.length - 1 || i === Math.floor(parts.nodes.length / 2);
        n.dataset.lit = lit ? (accent ? "accent" : "on") : "off";
        set(n, (draw > 0.5 ? 0.35 : 0) + 0.55 * lit - 0.6 * ident);
      });

      // one scan pass across the lattice while the structure builds
      const scanP = easeInOutCubic(span(build, 0.1, 1));
      const scanning = build > 0.1 && build < 1;
      const extent = box ? (mobile ? box.h : box.w) : 1;
      const scanAt = scanning ? -0.15 * extent + scanP * 1.3 * extent : -99999;
      set(parts.scan, scanning ? 1 : 0, mobile ? `translateY(${scanAt}px)` : `translateX(${scanAt}px)`);
      lattice(appear * (1 - 0.6 * ident), scanAt, pulse, rv);

      // special launch: guides converge onto the axis, a crosshair marks the centre
      if (launch) {
        const gDraw = easeInOutCubic(span(build, 0.3, 0.95));
        const conv = easeInOutCubic(align);
        parts.guides.forEach((g, i) => {
          const sign = i === 0 ? -1 : 1;
          const off = (1 - conv) * (mobile ? 22 : 17) * sign;
          set(g, gDraw * (0.32 - 0.3 * conv), mobile ? `translateX(${off}cqw) scaleY(${gDraw})` : `translateY(${off}cqh) scaleX(${gDraw})`);
        });
        set(parts.cross, gDraw * 0.4 * (1 - ident), `scale(${gDraw})`);
        parts.channels.forEach((c, i) => {
          const fill = span(sync, i / 3, (i + 1) / 3);
          const b = c.querySelector<HTMLElement>("[data-fill]");
          if (b) b.style.transform = `scaleX(${fill})`;
          set(c, appear * (fill > 0 || sync > 0 ? 1 : 0.45) * (1 - ident * 0.6));
        });
      }

      // the controlled activation: one soft pulse from the centre, no white screen
      set(parts.pulse, 0.7 * pulse, `translate(-50%, -50%) scale(${0.25 + 0.75 * easeOutCubic(act)})`);

      // identity: the wordmark settles out of wide tracking onto the axis
      const k = easeOutCubic(ident);
      if (parts.mark) {
        parts.mark.style.opacity = String(k);
        parts.mark.style.letterSpacing = `${0.28 + (1 - k) * 0.3}em`;
      }
      set(parts.sub, span(ident, 0.35, 1));

      // status, progress and the sequence counter
      let current: string = stages[0].id;
      let index = 0;
      stages.forEach((s, i) => {
        if (u >= s.from) {
          current = s.id;
          index = i;
        }
      });
      lastStatus = text(parts.status, STATUS[current] ?? "", lastStatus);
      const identFrom = range.get("identity")?.from ?? 1;
      const progress = Math.min(1, u / identFrom);
      if (parts.bar) parts.bar.style.transform = `scaleX(${progress})`;
      lastDigits = text(parts.digits, String(Math.round(progress * 100)).padStart(3, "0"), lastDigits);
      lastCounter = text(parts.counter, `${String(index + 1).padStart(2, "0")} / ${String(stages.length).padStart(2, "0")}`, lastCounter);
      if (parts.skip) {
        const out = span(u, (range.get("activation")?.from ?? 1) - 0.04, range.get("activation")?.from ?? 1);
        parts.skip.style.opacity = String(1 - out);
        parts.skip.style.pointerEvents = out >= 1 ? "none" : "";
      }

      if (t >= plan.revealMs) reveal();
      root.style.opacity = String(1 - easeInOutCubic(rv));
    };

    let revealed = false;
    let ended = false;
    function reveal() {
      if (revealed) return;
      revealed = true;
      cbs.current.onReveal?.();
    }
    const finish = () => {
      if (ended) return;
      ended = true;
      reveal();
      cbs.current.onDone("finish");
    };
    const cancel = runClock(total, frame, finish);

    skipRef.current = () => {
      if (ended) return;
      ended = true;
      cancel();
      root.style.transition = "opacity 280ms ease";
      root.style.opacity = "0";
      window.setTimeout(() => {
        reveal();
        cbs.current.onDone("skip");
      }, 290);
    };
    // the special launch skips from its button or Escape; the short startup from any key or tap
    const onKey = (e: KeyboardEvent) => {
      if (!launch || e.key === "Escape") skipRef.current();
    };
    const onPointer = () => {
      if (!launch) skipRef.current();
    };
    window.addEventListener("keydown", onKey);
    root.addEventListener("pointerdown", onPointer);
    return () => {
      ended = true;
      cancel();
      window.removeEventListener("resize", onResize);
      logoImg?.removeEventListener("load", measureGap);
      window.removeEventListener("keydown", onKey);
      root.removeEventListener("pointerdown", onPointer);
    };
  }, [launch, mobile, reduced, durationS, stages]);

  const ticks = Array.from({ length: TICKS[layout] });
  const nodes: readonly number[] = NODES[layout];
  const subLine = launch ? subtitle?.trim() || title?.trim() || "SYSTEM ONLINE" : "SYSTEM ONLINE";
  return (
    <div
      ref={rootRef}
      className="fs"
      data-layout={layout}
      data-mode={mode}
      data-reduced={reduced ? "true" : "false"}
      role={launch ? "region" : undefined}
      aria-label={launch ? `${title || "RAWIN"} launch` : undefined}
      aria-hidden={launch ? undefined : true}
    >
      <canvas ref={canvasRef} className="fs-lattice" aria-hidden="true" />
      <div className="fs-scan" data-el="scan" aria-hidden="true" />
      <div aria-hidden="true">
        {[0, 1, 2, 3].map((i) => (
          <span key={i} className={`fs-corner fs-corner-${i}`} data-el="corner" />
        ))}
      </div>

      <div className="fs-axis" aria-hidden="true">
        <span className="fs-axis-half fs-axis-a" data-el="axis-a" />
        <span className="fs-axis-half fs-axis-b" data-el="axis-b" />
        <div className="fs-ruler">
          {ticks.map((_, i) => (
            <span key={i} className={`fs-tick${i % 5 === 0 ? " fs-tick-major" : ""}`} data-el="tick" style={{ ["--i" as string]: i / (ticks.length - 1) }}>
              {nodes.includes(i) ? <span className="fs-node" data-el="node" data-lit="off" /> : null}
            </span>
          ))}
        </div>
      </div>

      {launch ? (
        <div aria-hidden="true">
          <span className="fs-guide fs-guide-a" data-el="guide" />
          <span className="fs-guide fs-guide-b" data-el="guide" />
          <span className="fs-cross" data-el="cross" />
        </div>
      ) : null}

      <div className="fs-pulse" data-el="pulse" aria-hidden="true" />

      <div className="fs-identity">
        <span className="fs-mark" data-el="mark">
          {logo?.url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logo.url} alt={logo.alt || "RAWIN"} className="fs-logo" decoding="async" />
          ) : (
            "RAWIN"
          )}
        </span>
        <span className="fs-sub" data-el="sub">
          {subLine}
        </span>
      </div>

      <div className="fs-frame" data-el="frame" aria-hidden="true">
        <div className="fs-head">
          <span className="fs-label">
            <span className="fs-label-strong">RAWIN</span> FUTURE SYSTEM
            {launch && title ? <span className="fs-label-title">{title}</span> : null}
          </span>
          <span className="fs-counter" data-el="counter">
            01 / 0{stages.length}
          </span>
        </div>
        <div className="fs-foot">
          <div className="fs-state">
            {launch ? (
              <div className="fs-channels">
                {["SYNC 01", "SYNC 02", "SYNC 03"].map((c) => (
                  <span key={c} className="fs-channel" data-el="channel">
                    <span className="fs-channel-name">{c}</span>
                    <span className="fs-channel-track">
                      <span className="fs-channel-fill" data-fill />
                    </span>
                  </span>
                ))}
              </div>
            ) : null}
            <span className="fs-status" data-el="status">
              STANDBY
            </span>
            <span className="fs-track">
              <span className="fs-bar" data-el="bar" />
            </span>
          </div>
          <span className="fs-digits" data-el="digits">
            000
          </span>
        </div>
      </div>

      {launch ? (
        <button type="button" className="fs-skip" data-el="skip" onClick={() => skipRef.current()}>
          Skip
        </button>
      ) : null}
    </div>
  );
}
