"use client";

import { useEffect, useRef, useState } from "react";

export const INTRO_SESSION_KEY = "rawin-intro-seen";
export const INTRO_DONE_EVENT = "rawin:intro-done";

/** True when the pre-paint script decided the intro plays for this page load. */
export function introIsPlaying(): boolean {
  return typeof document !== "undefined" && document.documentElement.getAttribute("data-intro") === "play";
}

const TOTAL = 2300;

function easeInCubic(t: number) {
  return t * t * t;
}
function easeOutExpo(t: number) {
  return t >= 1 ? 1 : 1 - Math.pow(2, -10 * t);
}
function clamp01(v: number) {
  return Math.max(0, Math.min(1, v));
}

interface Mark {
  a: number;
  r: number;
  len: number;
  spin: number;
  alpha: number;
}

/**
 * RAWIN's entrance: a near-black field where fine silver marks gather, contract toward an
 * unseen centre of energy, then burst outward into a radial constellation around a dark
 * void before an iris opens onto the homepage. ~2.3s, once per browser session, skippable
 * (click, tap or any key), skipped entirely under reduced motion. The overlay markup is
 * always server-rendered but only shown when the pre-paint script sets data-intro="play",
 * so there is no flash on later visits and no hydration mismatch; a CSS fail-safe removes
 * it even if this script never runs.
 */
export default function EntranceIntro() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const root = document.documentElement;
    if (root.getAttribute("data-intro") !== "play") {
      requestAnimationFrame(() => setDone(true));
      return;
    }
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d") ?? null;

    let raf = 0;
    let finished = false;
    const finish = () => {
      if (finished) return;
      finished = true;
      cancelAnimationFrame(raf);
      root.setAttribute("data-intro", "done");
      window.dispatchEvent(new Event(INTRO_DONE_EVENT));
      window.setTimeout(() => setDone(true), 650);
    };

    const skip = () => finish();
    window.addEventListener("keydown", skip, { once: true });
    window.addEventListener("pointerdown", skip, { once: true });

    if (!canvas || !ctx) {
      const t = window.setTimeout(finish, 600);
      return () => window.clearTimeout(t);
    }

    const coarse = window.matchMedia("(pointer: coarse)").matches;
    const dpr = Math.min(window.devicePixelRatio || 1, coarse ? 1.25 : 1.5);
    const w = window.innerWidth;
    const h = window.innerHeight;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const R = Math.hypot(w, h) * 0.55;
    const count = coarse || w < 768 ? 150 : 280;
    const marks: Mark[] = Array.from({ length: count }, () => ({
      a: Math.random() * Math.PI * 2,
      r: R * (0.18 + Math.random() * 0.9),
      len: 1.5 + Math.random() * 4,
      spin: (Math.random() - 0.5) * 0.35,
      alpha: 0.25 + Math.random() * 0.6,
    }));
    const cx = w / 2;
    const cy = h * 0.46;
    const start = performance.now();

    const draw = (now: number) => {
      raf = 0;
      const t = now - start;
      ctx.clearRect(0, 0, w, h);

      const appear = clamp01(t / 450);
      const contract = easeInCubic(clamp01((t - 420) / 900)); // anticipation
      const burst = easeOutExpo(clamp01((t - 1320) / 760)); // radial release
      const fade = clamp01((t - 1750) / 500);

      // dark central void, opening with the burst
      const voidR = 6 + burst * Math.min(w, h) * 0.22;
      const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, voidR * 1.6);
      g.addColorStop(0, "rgba(4,4,6,1)");
      g.addColorStop(0.6, "rgba(4,4,6,0.85)");
      g.addColorStop(1, "rgba(4,4,6,0)");

      ctx.lineCap = "round";
      const pts: [number, number, number][] = [];
      for (let i = 0; i < marks.length; i++) {
        const m = marks[i];
        const ang = m.a + m.spin * (t / 1000) + contract * m.spin * 3;
        const rIn = m.r * (1 - contract * 0.86);
        const r = rIn + burst * (m.r * 0.9 + R * 0.55);
        const speed = burst * (1 - burst) * 4 + contract * 0.4;
        const len = m.len * (1 - contract * 0.6) + speed * 42 * (0.4 + m.alpha);
        const x = cx + Math.cos(ang) * r;
        const y = cy + Math.sin(ang) * r;
        const x2 = cx + Math.cos(ang) * (r - len);
        const y2 = cy + Math.sin(ang) * (r - len);
        const alpha = m.alpha * appear * (1 - fade);
        ctx.strokeStyle = `rgba(222, 224, 230, ${alpha})`;
        ctx.lineWidth = 0.7 + burst * 0.5;
        ctx.beginPath();
        ctx.moveTo(x2, y2);
        ctx.lineTo(x, y);
        ctx.stroke();
        if (i % 7 === 0) pts.push([x, y, alpha]);
      }
      // a sparse constellation between angular neighbours during the release
      if (burst > 0.05) {
        ctx.lineWidth = 0.5;
        for (let i = 1; i < pts.length; i++) {
          const [x1, y1, a1] = pts[i - 1];
          const [x2, y2, a2] = pts[i];
          if (Math.hypot(x1 - x2, y1 - y2) > R * 0.5) continue;
          ctx.strokeStyle = `rgba(222, 224, 230, ${Math.min(a1, a2) * 0.22 * (1 - fade)})`;
          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);
          ctx.stroke();
        }
      }
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(cx, cy, voidR * 1.6, 0, Math.PI * 2);
      ctx.fill();
      // the centre of energy: a single point that gathers light, then goes dark
      const core = (appear - burst) * (0.5 + contract * 0.5);
      if (core > 0.01) {
        ctx.fillStyle = `rgba(236, 238, 244, ${core})`;
        ctx.beginPath();
        ctx.arc(cx, cy, 1.4 + contract * 2.4, 0, Math.PI * 2);
        ctx.fill();
      }

      if (t >= 1750) root.setAttribute("data-intro", "reveal");
      if (t < TOTAL) raf = requestAnimationFrame(draw);
      else finish();
    };
    raf = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("keydown", skip);
      window.removeEventListener("pointerdown", skip);
    };
  }, []);

  if (done) return null;
  return (
    <div className="rawin-intro" aria-hidden="true">
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
      <span className="rawin-intro-mark label-mono">RAWIN</span>
    </div>
  );
}
