"use client";

import { useEffect, useRef, useState } from "react";
import { THEME_CHANGE_EVENT } from "@/components/theme/ThemeProvider";

export type OrbMood = "idle" | "listening" | "thinking" | "streaming" | "error";

/** Target energy per mood — the shader eases toward it, so changes never snap. */
const ENERGY: Record<OrbMood, number> = {
  idle: 0.1,
  listening: 0.3,
  thinking: 0.6,
  streaming: 0.85,
  error: 0.2,
};

interface OrbitOrbProps {
  mood: OrbMood;
  /** Increment to emit a ripple (e.g. when a message is sent) */
  pulseKey?: number;
  className?: string;
  /** Square render resolution in CSS px; the orb is scaled by its container for docking */
  size: number;
  /** Fill the parent box instead of sizing itself to `size` */
  fill?: boolean;
}

const VERT = `
attribute vec2 aPos;
void main(){ gl_Position = vec4(aPos, 0.0, 1.0); }
`;

// A small luminous body: a deep glass sphere lit from the upper left, with slow internal
// drift (cheap 2D value-noise fbm mapped onto the sphere), a fresnel rim and a faint halo.
// Only the accent hue is used; "error" cools toward clay. Premultiplied alpha output.
const FRAG = `
precision mediump float;
uniform vec2 uRes;
uniform float uTime;
uniform float uEnergy;
uniform float uPulse;
uniform float uDark;
uniform float uError;
uniform vec3 uA;
uniform vec3 uC;

float hash(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float noise(vec2 p){
  vec2 i = floor(p); vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
}
float fbm(vec2 p){
  float v = 0.0; float a = 0.5;
  for (int i = 0; i < 4; i++) { v += a * noise(p); p = p * 2.03 + vec2(1.7, 9.2); a *= 0.5; }
  return v;
}

void main(){
  vec2 uv = (gl_FragCoord.xy - 0.5 * uRes) / uRes.y * 2.0;
  float r = length(uv);
  float t = uTime;
  float breathe = sin(t * 0.55) * (0.006 + 0.01 * uEnergy);
  float ripple = uPulse * 0.035 * sin(r * 20.0 - uPulse * 10.0) * smoothstep(0.0, 0.8, r);
  float R = 0.6 + breathe + ripple;

  vec3 hue = mix(uA, uC, uError * 0.85);
  vec3 deep = hue * mix(0.22, 0.16, uDark);
  vec3 light = mix(hue, vec3(1.0), 0.78);

  vec3 col = vec3(0.0);
  float alpha = 0.0;
  // one device pixel in uv units: the silhouette is antialiased over ~1.5px at any size
  float px = 2.0 / uRes.y;

  if (r < R + px) {
    float d = min(r / R, 1.0);
    float z = sqrt(max(0.0, 1.0 - d * d));
    vec3 n = normalize(vec3(uv / R, z));

    vec2 sp = n.xy / (1.0 + z) * 1.7;
    float speed = 0.04 + 0.3 * uEnergy;
    float ts = t * speed;
    float warp = fbm(sp * 1.4 - vec2(ts, ts * 0.4));
    float f = fbm(sp * 2.2 + vec2(ts, -ts * 0.6) + warp * (0.9 + uEnergy));

    vec3 L = normalize(vec3(-0.5, 0.62, 0.62));
    float lambert = clamp(dot(n, L), 0.0, 1.0);
    vec3 body = mix(deep, hue, lambert * 0.6 + f * 0.5);
    body = mix(body, light, pow(lambert, 3.0) * 0.45 + smoothstep(0.58, 0.86, f) * (0.12 + 0.3 * uEnergy));

    // A soft band of light that sweeps the surface while Orbit is working
    float a = t * 0.7;
    float band = exp(-pow((n.y * cos(a) + n.x * sin(a)) * 5.0, 2.0)) * uEnergy * 0.22;
    body += light * band;

    float core = exp(-d * d * 3.6) * (0.06 + 0.36 * uEnergy) * mix(0.7, 1.0, uDark);
    float fres = pow(1.0 - z, 3.0);
    float spec = pow(max(dot(n, normalize(vec3(-0.42, 0.55, 0.72))), 0.0), 36.0);

    col = body + light * core + light * fres * 0.85 + vec3(1.0) * spec * 0.32;
    alpha = smoothstep(R + px * 0.75, R - px * 0.75, r);
    col *= alpha;
  }

  float halo = exp(-max(r - R, 0.0) * 11.0) * (0.05 + uEnergy * 0.16) * smoothstep(R - px * 1.5, R + px * 1.5, r);
  col += hue * halo;
  alpha = max(alpha, halo * 0.9);

  gl_FragColor = vec4(col, alpha);
}
`;

function readToken(name: string, fallback: [number, number, number]): [number, number, number] {
  try {
    const probe = document.createElement("span");
    probe.style.color = `var(${name})`;
    probe.style.display = "none";
    document.body.appendChild(probe);
    const rgb = getComputedStyle(probe).color;
    probe.remove();
    const m = rgb.match(/[\d.]+/g);
    if (m && m.length >= 3) return [Number(m[0]) / 255, Number(m[1]) / 255, Number(m[2]) / 255];
  } catch {
    // fall through
  }
  return fallback;
}

/**
 * Rawin Orbit's presence. One WebGL canvas, one render loop:
 * - eases energy between moods (idle → thinking → streaming), ripples on send
 * - ~30fps when calm, 60fps when working; paused when hidden or off-screen
 * - single static frame under prefers-reduced-motion
 * - CSS light-body fallback when WebGL is unavailable
 */
export default function OrbitOrb({ mood, pulseKey = 0, className = "", size, fill = false }: OrbitOrbProps) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const moodRef = useRef<OrbMood>(mood);
  const pulseRef = useRef(0);
  const redrawRef = useRef<(() => void) | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    moodRef.current = mood;
    redrawRef.current?.();
  }, [mood]);

  useEffect(() => {
    if (pulseKey > 0) {
      pulseRef.current = 1;
      redrawRef.current?.();
    }
  }, [pulseKey]);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    /**
     * Build one GL instance for the host's current rendered width. Returns its teardown.
     * Driven by a ResizeObserver below: nothing is created while the host has no size
     * (e.g. a display:none layout variant), so hidden copies never hold a GL context, and
     * the canvas resolution always matches what is actually on screen.
     */
    const setup = (cssWidth: number): (() => void) => {
    // A fresh canvas per setup: teardown releases the GL context with loseContext(),
    // so reusing one element (StrictMode remounts, resizes) would hand back a dead context.
    const canvas = document.createElement("canvas");
    canvas.setAttribute("aria-hidden", "true");
    // Inline geometry: the canvas must never fall back to its intrinsic pixel size
    canvas.style.cssText = "position:absolute;inset:0;width:100%;height:100%;display:block;";
    host.appendChild(canvas);
    // Fall back to the CSS orb on the next frame (keeps state updates out of the effect body)
    const fail = () => {
      canvas.remove();
      requestAnimationFrame(() => setFailed(true));
    };
    const gl = (canvas.getContext("webgl", { premultipliedAlpha: true, alpha: true, antialias: false }) ||
      canvas.getContext("experimental-webgl")) as WebGLRenderingContext | null;
    if (!gl) {
      fail();
      return () => {};
    }

    const compile = (type: number, src: string) => {
      const s = gl.createShader(type)!;
      gl.shaderSource(s, src);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
        console.warn("[Orbit orb] shader:", gl.getShaderInfoLog(s) || "compile failed");
        gl.deleteShader(s);
        return null;
      }
      return s;
    };
    const vs = compile(gl.VERTEX_SHADER, VERT);
    const fs = compile(gl.FRAGMENT_SHADER, FRAG);
    if (!vs || !fs) {
      fail();
      return () => {};
    }
    const prog = gl.createProgram()!;
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      fail();
      return () => {};
    }
    gl.useProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, "aPos");
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

    const u = (n: string) => gl.getUniformLocation(prog, n);
    const uRes = u("uRes");
    const uTime = u("uTime");
    const uEnergy = u("uEnergy");
    const uPulse = u("uPulse");
    const uDark = u("uDark");
    const uError = u("uError");
    const uA = u("uA");
    const uC = u("uC");

    const applyTheme = () => {
      const dark = document.documentElement.getAttribute("data-theme") === "dark";
      gl.uniform1f(uDark, dark ? 1 : 0);
      gl.uniform3fv(uA, readToken("--accent", [0.29, 0.24, 0.75]));
      gl.uniform3fv(uC, readToken("--ember", [0.65, 0.35, 0.23]));
    };
    applyTheme();

    // Render at the display's real pixel density (up to 3x). A lower cap stretched the small
    // homepage orb ~2.4x on phones, blurring it and roughening its edge; the orb is small, so
    // full density stays cheap, and `size` still bounds the backing store.
    const dpr = Math.min(window.devicePixelRatio || 1, 3);
    // Resolution follows the rendered size (bounded), so the orb is crisp at any scale
    const px = Math.max(32, Math.min(Math.round(cssWidth * dpr), Math.round(size * 2)));
    canvas.width = px;
    canvas.height = px;
    gl.viewport(0, 0, px, px);
    gl.uniform2f(uRes, px, px);

    const reducedMq = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    let reduced = Boolean(reducedMq?.matches);
    let visible = true;
    let raf = 0;
    let last = 0;
    let energy = ENERGY[moodRef.current];
    let error = moodRef.current === "error" ? 1 : 0;
    let clock = 0;
    const start = performance.now();

    const draw = (now: number) => {
      const dt = Math.min(0.05, (now - (last || now)) / 1000);
      last = now;
      const target = ENERGY[moodRef.current];
      energy += (target - energy) * Math.min(1, dt * 2.2);
      error += ((moodRef.current === "error" ? 1 : 0) - error) * Math.min(1, dt * 3);
      pulseRef.current = Math.max(0, pulseRef.current - dt * 0.9);
      clock = reduced ? 8 : (now - start) / 1000;
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.uniform1f(uTime, clock);
      gl.uniform1f(uEnergy, reduced ? target : energy);
      gl.uniform1f(uPulse, reduced ? 0 : pulseRef.current);
      gl.uniform1f(uError, reduced ? (moodRef.current === "error" ? 1 : 0) : error);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
    };

    const loop = (now: number) => {
      raf = 0;
      if (!visible || document.hidden || reduced) return;
      const calm = moodRef.current === "idle" && pulseRef.current <= 0;
      const minGap = calm ? 1000 / 30 : 1000 / 60;
      if (now - last >= minGap - 1) draw(now);
      raf = requestAnimationFrame(loop);
    };

    const kick = () => {
      if (reduced) {
        draw(performance.now());
        return;
      }
      if (!raf && visible && !document.hidden) raf = requestAnimationFrame(loop);
    };
    redrawRef.current = kick;

    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      kick();
    });
    io.observe(canvas);
    const onVis = () => kick();
    const onTheme = () => {
      applyTheme();
      kick();
      if (reduced) draw(performance.now());
    };
    const onReduced = () => {
      reduced = Boolean(reducedMq?.matches);
      kick();
    };
    const onLost = (e: Event) => {
      e.preventDefault();
      setFailed(true);
    };
    document.addEventListener("visibilitychange", onVis);
    window.addEventListener(THEME_CHANGE_EVENT, onTheme);
    reducedMq?.addEventListener?.("change", onReduced);
    canvas.addEventListener("webglcontextlost", onLost);
    draw(performance.now());
    kick();

    return () => {
      if (raf) cancelAnimationFrame(raf);
      redrawRef.current = null;
      io.disconnect();
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener(THEME_CHANGE_EVENT, onTheme);
      reducedMq?.removeEventListener?.("change", onReduced);
      canvas.removeEventListener("webglcontextlost", onLost);
      gl.deleteBuffer(buf);
      gl.deleteProgram(prog);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
      gl.getExtension("WEBGL_lose_context")?.loseContext();
      canvas.remove();
    };
    };

    let teardown: (() => void) | null = null;
    let builtFor = 0;
    const sync = () => {
      const w = host.getBoundingClientRect().width;
      if (w < 2) {
        teardown?.();
        teardown = null;
        builtFor = 0;
        return;
      }
      // Rebuild only for substantial size changes (avoids churn during layout settling)
      // (12%: enough to ignore layout settling, small enough that the orb is never visibly upscaled)
      if (!teardown || Math.abs(w - builtFor) / builtFor > 0.12) {
        teardown?.();
        teardown = setup(w);
        builtFor = w;
      }
    };
    const ro = new ResizeObserver(sync);
    ro.observe(host);
    sync();
    return () => {
      ro.disconnect();
      teardown?.();
      teardown = null;
    };
  }, [size]);

  return (
    <div className={`relative ${fill ? "w-full h-full" : ""} ${className}`} style={fill ? undefined : { width: size, height: size }} data-mood={mood}>
      {failed ? (
        <div aria-hidden="true" className="orbit-orb-fallback absolute inset-[17%] rounded-full" data-mood={mood} />
      ) : (
        <div ref={hostRef} aria-hidden="true" className="absolute inset-0" />
      )}
    </div>
  );
}

/** Tiny CSS seed of the orb for message attributions — no extra GPU contexts. */
export function OrbitSeed({ active = false, className = "" }: { active?: boolean; className?: string }) {
  return <span aria-hidden="true" className={`orbit-seed ${active ? "is-active" : ""} ${className}`} />;
}
