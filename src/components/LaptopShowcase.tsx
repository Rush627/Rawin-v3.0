"use client";

import { useRef, useEffect, useState } from "react";
import { motion, useScroll, useTransform, useMotionValue, useSpring } from "framer-motion";
import {
  Sparkles,
  Check,
} from "lucide-react";

export default function LaptopShowcase() {
  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const [reducedMotion, setReducedMotion] = useState(false);

  // Mouse-driven 3D interactive tilt
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const springConfig = { damping: 26, stiffness: 140, mass: 0.6 };
  const mouseTiltX = useSpring(useTransform(mouseY, [-0.5, 0.5], [6, -6]), springConfig);
  const mouseTiltY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-9, 9]), springConfig);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mediaQuery.matches);
    const motionHandler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mediaQuery.addEventListener("change", motionHandler);

    return () => {
      mediaQuery.removeEventListener("change", motionHandler);
    };
  }, []);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (reducedMotion) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    mouseX.set(x);
    mouseY.set(y);
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"],
  });

  // Natural physical opening angle: 38deg to 0deg (keeps top edge strictly clear of header text)
  const lidRotateX = useTransform(scrollYProgress, [0.15, 0.55], [38, 0]);
  const lidScale = useTransform(scrollYProgress, [0.15, 0.55], [0.94, 1]);
  const screenGlowOpacity = useTransform(scrollYProgress, [0.25, 0.6], [0, 0.7]);

  // 3D Pop-Out transformations for UI elements inside the workstation
  const cardPopZ = useTransform(scrollYProgress, [0.25, 0.55], [0, 32]);
  const codePopZ = useTransform(scrollYProgress, [0.25, 0.55], [0, 18]);
  const telemetryPopZ = useTransform(scrollYProgress, [0.25, 0.55], [0, 12]);

  return (
    <section
      ref={containerRef}
      className={`relative w-full ${
        reducedMotion ? "py-12 sm:py-16" : "h-[125vh] sm:h-[155vh] md:h-[180vh]"
      } flex flex-col items-center`}
    >
      <div
        className={`${
          reducedMotion ? "relative" : "sticky top-16 sm:top-20 md:top-24"
        } w-full max-w-5xl flex flex-col items-center px-4 sm:px-6`}
      >
        {/* Section Header with guaranteed stacking priority and generous bottom clearance */}
        <div
          data-particle-protected
          className="relative z-30 flex flex-col items-center text-center gap-2 mb-8 sm:mb-14 md:mb-20 pointer-events-auto"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono font-medium glass-pill text-pacific-cyan border border-pacific-cyan/20">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Interactive Hardware Showcase</span>
          </div>
          <h2 className="text-2xl sm:text-4xl md:text-5xl font-bold tracking-tight text-foreground font-space">
            Architected for <span className="text-pacific-cyan">High Performance</span>
          </h2>
          <p className="text-xs sm:text-sm text-muted max-w-lg font-sans">
            Scroll to explore the RAWIN engineering system. Clean architecture, disciplined motion, and scalable structure.
          </p>
        </div>

        {/* 3D Perspective Stage with Interactive Cursor Tilt */}
        <div
          ref={stageRef}
          data-particle-protected
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          className="relative w-full max-w-[840px] flex flex-col items-center cursor-default"
          style={{ perspective: "1500px" }}
        >
          {/* 3D Wrapper that responds to tilt and holds layered depth */}
          <motion.div
            style={
              reducedMotion
                ? {}
                : {
                    rotateX: mouseTiltX,
                    rotateY: mouseTiltY,
                    transformStyle: "preserve-3d",
                  }
            }
            className="relative w-full flex flex-col items-center"
          >
            {/* Laptop Lid (Smooth physical open with scroll) */}
            <motion.div
              style={
                reducedMotion
                  ? { transform: "rotateX(0deg)" }
                  : {
                      rotateX: lidRotateX,
                      scale: lidScale,
                      transformOrigin: "bottom center",
                      transformStyle: "preserve-3d",
                    }
              }
              className="relative w-full aspect-[16/10] max-h-[260px] sm:max-h-[380px] md:max-h-[460px] rounded-t-xl sm:rounded-t-3xl border border-white/10 bg-[#0c0c14] shadow-[0_20px_50px_rgba(0,0,0,0.8)] p-2 sm:p-3 flex flex-col z-20"
            >
              {/* Screen Bezel & WebCam Notch */}
              <div
                className="relative w-full h-full rounded-lg sm:rounded-xl bg-ink-black border border-white/10 flex flex-col overflow-hidden"
                style={{ transformStyle: "preserve-3d" }}
              >
                {/* Hardware Camera Notch: Non-overlapping, contained inside top bezel */}
                <div className="absolute top-2 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-black/80 border border-white/10 z-30 pointer-events-none shadow-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-neutral-800 border border-white/20 flex items-center justify-center">
                    <span className="w-0.5 h-0.5 rounded-full bg-neutral-500" />
                  </span>
                  <span className="w-1 h-1 rounded-full bg-emerald-400 shadow-[0_0_4px_rgba(52,211,153,0.8)]" />
                </div>

                {/* Glass Sheen / Reflection highlight */}
                <div
                  aria-hidden="true"
                  className="absolute inset-0 bg-gradient-to-tr from-white/[0.03] via-transparent to-white/[0.02] pointer-events-none z-10"
                />

                {/* Display Content: Simulated RAWIN Platform Workspace */}
                <div
                  className="w-full h-full flex flex-col bg-[#0e0e18] text-foreground font-sans text-xs"
                  style={{ transformStyle: "preserve-3d" }}
                >
                  {/* Window Titlebar */}
                  <div className="flex items-center justify-between px-2.5 sm:px-3 py-1.5 sm:py-2 border-b border-white/[0.08] bg-surface/80 backdrop-blur-md">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#ff5f56]/80"></span>
                      <span className="w-2.5 h-2.5 rounded-full bg-[#ffbd2e]/80"></span>
                      <span className="w-2.5 h-2.5 rounded-full bg-[#27c93f]/80"></span>
                    </div>

                    <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-pacific-cyan/10 border border-pacific-cyan/20 text-[10px] font-mono text-pacific-cyan">
                      <span className="w-1.5 h-1.5 rounded-full bg-pacific-cyan"></span>
                      <span className="hidden sm:inline">RAWIN Engine</span>
                    </div>
                  </div>

                  {/* Internal Workspace Interface with 3D Popping Out Layers */}
                  <div
                    className="flex-1 p-2 sm:p-4 md:p-5 flex flex-col justify-between gap-2 sm:gap-3 overflow-hidden"
                    style={{ transformStyle: "preserve-3d" }}
                  >
                    {/* Top telemetry banner: Engineering System Architecture */}
                    <motion.div
                      style={
                        reducedMotion
                          ? {}
                          : {
                              z: telemetryPopZ,
                              transformStyle: "preserve-3d",
                            }
                      }
                      className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 sm:gap-2 text-center"
                    >
                      <div className="p-1.5 sm:p-2 rounded-lg bg-surface/70 border border-white/5 shadow-md">
                        <div className="text-[9px] sm:text-[10px] uppercase font-mono text-muted/60">System</div>
                        <div className="text-xs sm:text-sm font-bold text-pacific-cyan font-space">RAWIN Engine</div>
                      </div>
                      <div className="p-1.5 sm:p-2 rounded-lg bg-surface/70 border border-white/5 shadow-md">
                        <div className="text-[9px] sm:text-[10px] uppercase font-mono text-muted/60">Runtime</div>
                        <div className="text-xs sm:text-sm font-bold text-foreground font-space">Next.js + TS</div>
                      </div>
                      <div className="hidden sm:block p-2 rounded-lg bg-surface/70 border border-white/5 shadow-md">
                        <div className="text-[10px] uppercase font-mono text-muted/60">Rendering</div>
                        <div className="text-xs sm:text-sm font-bold text-apricot-cream font-space">GPU Accelerated</div>
                      </div>
                      <div className="hidden sm:block p-2 rounded-lg bg-surface/70 border border-white/5 shadow-md">
                        <div className="text-[10px] uppercase font-mono text-muted/60">Architecture</div>
                        <div className="text-xs sm:text-sm font-bold text-emerald-400 font-space">Server + Edge</div>
                      </div>
                    </motion.div>

                    {/* Middle Content: Code Preview & 3D Popped Out Active Live Card */}
                    <div
                      className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 flex-1 min-h-0"
                      style={{ transformStyle: "preserve-3d" }}
                    >
                      {/* Left: Component Code Snippet (3D Pop-out layer, visible sm+) */}
                      <motion.div
                        style={
                          reducedMotion
                            ? {}
                            : {
                                z: codePopZ,
                                transformStyle: "preserve-3d",
                              }
                        }
                        whileHover={reducedMotion ? {} : { scale: 1.01, z: 28 }}
                        transition={{ duration: 0.2 }}
                        className="hidden sm:flex p-3 rounded-lg bg-ink-black/85 border border-white/10 flex-col font-mono text-[10px] sm:text-[11px] text-muted leading-relaxed overflow-hidden shadow-xl"
                      >
                        <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-white/5 text-[9px] uppercase tracking-wider text-muted/50">
                          <span>Architecture.tsx</span>
                          <span className="text-pacific-cyan">TypeScript</span>
                        </div>
                        <p className="text-pacific-cyan/90">export const System = &#123;</p>
                        <p className="pl-3 text-muted/80">frontend: &quot;Next.js&quot;,</p>
                        <p className="pl-3 text-muted/80">runtime: &quot;Edge&quot;,</p>
                        <p className="pl-3 text-apricot-cream/80">motion: &quot;Framer Motion&quot;,</p>
                        <p className="pl-3 text-emerald-400/80">styling: &quot;Tailwind CSS&quot;,</p>
                        <p className="text-pacific-cyan/90">&#125;;</p>
                      </motion.div>

                      {/* Right: Active Live Card (High 3D Pop-out with Neon Edge Glow) */}
                      <motion.div
                        style={
                          reducedMotion
                            ? {}
                            : {
                                z: cardPopZ,
                                transformStyle: "preserve-3d",
                              }
                        }
                        whileHover={reducedMotion ? {} : { scale: 1.02, z: 46 }}
                        transition={{ duration: 0.2 }}
                        className="p-2 sm:p-3 rounded-lg bg-surface/90 border border-pacific-cyan/30 flex flex-col justify-between gap-1 sm:gap-2 shadow-[0_16px_36px_rgba(0,0,0,0.6),0_0_24px_rgba(24,155,173,0.18)]"
                      >
                        <div>
                          <span className="text-[9px] font-mono text-pacific-cyan uppercase tracking-widest font-semibold block">
                            RAWIN 3.0
                          </span>
                          <h4 className="text-xs sm:text-sm font-bold text-foreground font-space mt-0.5">
                            Engineering System
                          </h4>
                          <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 sm:gap-y-1 text-[9px] sm:text-[10px] font-mono text-muted/80 mt-1 sm:mt-2">
                            <div><span className="text-muted/50">Frontend:</span> Next.js</div>
                            <div><span className="text-muted/50">Runtime:</span> Edge</div>
                            <div><span className="text-muted/50">Motion:</span> Framer</div>
                            <div><span className="text-muted/50">Content:</span> MDX</div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-1 sm:pt-2 border-t border-white/5 text-[9px] sm:text-[10px] font-mono">
                          <span className="text-emerald-400 flex items-center gap-1.5">
                            <span className="flex items-center justify-center w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.2)]">
                              <Check className="w-2 h-2 stroke-[3]" />
                            </span>
                            <span>Active System</span>
                          </span>
                          <span className="text-muted/60">v3.0</span>
                        </div>
                      </motion.div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Laptop Base Chassis with 3D Depth */}
            <div className="relative w-full max-w-[860px] h-3.5 sm:h-5 md:h-6 bg-gradient-to-b from-[#181824] via-[#12121d] to-[#0a0a12] rounded-b-xl sm:rounded-b-2xl border-x border-b border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.8)] flex items-center justify-center -mt-0.5 z-10">
              {/* Front Lip Opening Notch */}
              <div className="w-12 sm:w-16 md:w-20 h-1 sm:h-1.5 rounded-full bg-white/10"></div>
            </div>

            {/* Contact Shadow on Desk */}
            <motion.div
              style={
                reducedMotion
                  ? { opacity: 0.4 }
                  : {
                      opacity: screenGlowOpacity,
                    }
              }
              aria-hidden="true"
              className="w-[90%] h-12 rounded-full bg-pacific-cyan/15 blur-2xl -mt-4 pointer-events-none"
            />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
