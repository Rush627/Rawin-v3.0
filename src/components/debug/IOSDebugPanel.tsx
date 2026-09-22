"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";

// ============================================================================
// Types
// ============================================================================

interface FrameStall {
  timestamp: string;
  gapMs: number;
}

interface LongTaskEntry {
  startTime: number;
  duration: number;
  name: string;
}

interface HamburgerTimeline {
  id: number;
  timestamp: string;
  action: "OPEN" | "CLOSE";
  t0_click: number;
  t1_stateUpdate: number | null;
  t2_domMounted: number | null;
  t3_animationStarted: number | null;
  t4_firstPaint: number | null;
  totalDurationMs: number | null;
  classification: string;
}

interface CardDiagnostic {
  index: number;
  inViewport: boolean;
  intersectionRatio: number;
  rect: { top: number; bottom: number; height: number; width: number } | null;
  computedDisplay: string;
  computedOpacity: string;
  imageInfo: {
    src: string;
    complete: boolean;
    naturalWidth: number;
    naturalHeight: number;
    displayWidth: number;
    displayHeight: number;
    loadingAttr: string;
    decodeDurationMs: number | null;
    estimatedVRAM_MB: number;
  } | null;
}

interface DiagnosticLogItem {
  id: number;
  time: string;
  relativeMs: number;
  category: "FRAME" | "TASK" | "MENU" | "PROJECTS" | "IMAGE" | "SCROLL" | "MUTATION" | "ERROR";
  message: string;
}

// ============================================================================
// Main Diagnostic Panel Component
// ============================================================================

export default function IOSDebugPanel() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<"summary" | "menu" | "projects" | "log" | "report">("summary");
  const [copyStatus, setCopyStatus] = useState<string | null>(null);
  const [showRawTextarea, setShowRawTextarea] = useState(false);
  const [openBlobUrl, setOpenBlobUrl] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const fallbackTextareaRef = useRef<HTMLTextAreaElement | null>(null);

  // State flushed periodically to UI (to avoid 60fps React render overhead)
  const [uiState, setUiState] = useState({
    fps: 60,
    minFps: 60,
    currentFrameGap: 16.6,
    maxFrameGap: 16.6,
    recentStallsCount: 0,
    longTaskCount: 0,
    lastLongTaskDuration: 0,
    longTaskSupported: false,
    scrollEventsPerSec: 0,
    mutationsPerSec: 0,
    jsErrorCount: 0,
    lastError: "",
    hamburgerTimelines: [] as HamburgerTimeline[],
    projectDiagnostics: [] as CardDiagnostic[],
    techStackDiagnostics: [] as CardDiagnostic[],
    logs: [] as DiagnosticLogItem[],
  });

  // Internal high-frequency mutable references
  const startTimeRef = useRef<number>(Date.now());
  const rAFStartTimeRef = useRef<number>(performance.now());
  const frameCountRef = useRef(0);
  const lastFpsCalcTimeRef = useRef(performance.now());
  const lastFrameTimeRef = useRef(performance.now());
  const currentFpsRef = useRef(60);
  const minFpsRef = useRef(60);
  const maxFrameGapRef = useRef(16.6);
  const recentGapsRef = useRef<number[]>([]);
  const stallsRef = useRef<FrameStall[]>([]);

  const longTasksRef = useRef<LongTaskEntry[]>([]);
  const longTaskSupportedRef = useRef(false);

  const hamburgerTimelinesRef = useRef<HamburgerTimeline[]>([]);
  const currentMenuInteractionRef = useRef<Partial<HamburgerTimeline> | null>(null);
  const lastMenuEventTimeRef = useRef(0);

  const projectDiagnosticsRef = useRef<CardDiagnostic[]>([]);
  const techStackDiagnosticsRef = useRef<CardDiagnostic[]>([]);
  const scrollCountRef = useRef(0);
  const scrollRateRef = useRef(0);
  const lastScrollTimeRef = useRef(performance.now());

  const mutationCountRef = useRef(0);
  const mutationRateRef = useRef(0);

  const jsErrorsRef = useRef<string[]>([]);
  const logsRef = useRef<DiagnosticLogItem[]>([]);
  const logIdCounterRef = useRef(0);

  // Helper to append log entry (max 80 entries)
  const addLog = useCallback((category: DiagnosticLogItem["category"], message: string) => {
    const now = performance.now();
    const rel = Math.round(now - rAFStartTimeRef.current);
    const dateStr = new Date().toLocaleTimeString("en-GB", { hour12: false }) + "." + String(Math.floor(now % 1000)).padStart(3, "0");
    const item: DiagnosticLogItem = {
      id: ++logIdCounterRef.current,
      time: dateStr,
      relativeMs: rel,
      category,
      message,
    };
    logsRef.current = [item, ...logsRef.current.slice(0, 79)];
  }, []);

  // --------------------------------------------------------------------------
  // 1. Frame / FPS Monitoring (Lightweight rAF Loop)
  // --------------------------------------------------------------------------
  useEffect(() => {
    let animId: number;
    rAFStartTimeRef.current = performance.now();
    lastFrameTimeRef.current = performance.now();
    lastFpsCalcTimeRef.current = performance.now();

    addLog("FRAME", "Diagnostic monitor initialized. Starting rAF loop.");

    const loop = (now: number) => {
      const gap = now - lastFrameTimeRef.current;
      lastFrameTimeRef.current = now;
      frameCountRef.current++;

      if (gap > maxFrameGapRef.current) {
        maxFrameGapRef.current = Math.round(gap);
      }

      recentGapsRef.current.push(gap);
      if (recentGapsRef.current.length > 30) {
        recentGapsRef.current.shift();
      }

      // Detect significant frame stall (> 120ms)
      if (gap > 120) {
        const timeStr = new Date().toLocaleTimeString("en-GB", { hour12: false });
        stallsRef.current.unshift({ timestamp: timeStr, gapMs: Math.round(gap) });
        if (stallsRef.current.length > 20) stallsRef.current.pop();
        addLog("FRAME", `Frame gap: ${Math.round(gap)}ms STALL detected`);
      }

      // Calculate rolling FPS once per second
      const timeSinceFpsCalc = now - lastFpsCalcTimeRef.current;
      if (timeSinceFpsCalc >= 1000) {
        const calculatedFps = Math.round((frameCountRef.current * 1000) / timeSinceFpsCalc);
        currentFpsRef.current = calculatedFps;
        if (calculatedFps < minFpsRef.current && calculatedFps > 0) {
          minFpsRef.current = calculatedFps;
        }
        frameCountRef.current = 0;
        lastFpsCalcTimeRef.current = now;
      }

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [addLog]);

  // --------------------------------------------------------------------------
  // 2. Long Task Detection (PerformanceObserver)
  // --------------------------------------------------------------------------
  useEffect(() => {
    if (typeof PerformanceObserver !== "undefined" && PerformanceObserver.supportedEntryTypes?.includes("longtask")) {
      longTaskSupportedRef.current = true;
      try {
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            const duration = Math.round(entry.duration);
            const startTime = Math.round(entry.startTime);
            const name = entry.name || "longtask";
            longTasksRef.current.push({ startTime, duration, name });
            addLog("TASK", `LongTask detected: ${duration}ms (start: ${startTime}ms)`);
          }
        });
        observer.observe({ entryTypes: ["longtask"] });
        return () => observer.disconnect();
      } catch {
        longTaskSupportedRef.current = false;
      }
    } else {
      longTaskSupportedRef.current = false;
      addLog("TASK", "PerformanceObserver longtask: unsupported on this browser (Safari/WebKit)");
    }
  }, [addLog]);

  // --------------------------------------------------------------------------
  // 3. Hamburger / Mobile Menu Timeline Instrumentation
  // --------------------------------------------------------------------------
  useEffect(() => {
    const handleMenuPointer = (e: Event) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;

      const btn = target.closest<HTMLElement>(
        'button[aria-label*="menu" i], button[aria-expanded], button[data-mobile-menu-toggle]'
      );
      if (!btn) return;

      const now = performance.now();
      if (now - lastMenuEventTimeRef.current < 300) {
        return;
      }
      lastMenuEventTimeRef.current = now;

      const t0 = performance.now();
      const currentExpanded = btn.getAttribute("aria-expanded") === "true";
      const action = currentExpanded ? "CLOSE" : "OPEN";

      addLog("MENU", `Hamburger ${e.type} received (${action})`);

      const interactionId = Date.now();
      const timeline: HamburgerTimeline = {
        id: interactionId,
        timestamp: new Date().toLocaleTimeString("en-GB", { hour12: false }),
        action,
        t0_click: t0,
        t1_stateUpdate: null,
        t2_domMounted: null,
        t3_animationStarted: null,
        t4_firstPaint: null,
        totalDurationMs: null,
        classification: "measuring...",
      };
      currentMenuInteractionRef.current = timeline;

      // 1. Observe aria-expanded attribute mutation on button
      const attrObserver = new MutationObserver((mutations) => {
        for (const m of mutations) {
          if (m.type === "attributes" && m.attributeName === "aria-expanded") {
            const t1 = performance.now();
            timeline.t1_stateUpdate = Math.round(t1 - t0);
            addLog("MENU", `Menu aria-expanded updated: ${btn.getAttribute("aria-expanded")} (+${timeline.t1_stateUpdate}ms)`);
            attrObserver.disconnect();
            break;
          }
        }
      });
      attrObserver.observe(btn, { attributes: true, attributeFilter: ["aria-expanded"] });

      // 2. Observe DOM appearance of Drawer / Backdrop
      const bodyObserver = new MutationObserver(() => {
        // Look for mobile drawer elements
        const drawer = document.querySelector(
          '.glass-panel[class*="inset-x-4"], [class*="backdrop-blur"], div[class*="z-40 lg:hidden"]'
        );
        if (drawer && timeline.t2_domMounted === null) {
          const t2 = performance.now();
          timeline.t2_domMounted = Math.round(t2 - t0);
          addLog("MENU", `Menu drawer DOM mounted (+${timeline.t2_domMounted}ms)`);

          // 3. Double rAF to observe paint frame completion
          requestAnimationFrame(() => {
            const t3 = performance.now();
            timeline.t3_animationStarted = Math.round(t3 - t0);

            requestAnimationFrame(() => {
              const t4 = performance.now();
              timeline.t4_firstPaint = Math.round(t4 - t0);
              timeline.totalDurationMs = timeline.t4_firstPaint;

              // Classify rendering delay
              const stateDelay = timeline.t1_stateUpdate ?? 0;
              const domDelay = (timeline.t2_domMounted ?? 0) - stateDelay;
              const paintDelay = (timeline.t4_firstPaint ?? 0) - (timeline.t2_domMounted ?? 0);

              if (stateDelay > 400) {
                timeline.classification = "CASE B (JS Event / State Scheduling Delay)";
              } else if (domDelay > 400) {
                timeline.classification = "CASE B (React Reconciliation / Render Delay)";
              } else if (paintDelay > 400) {
                timeline.classification = "CASE A/C (Paint / Compositing Delay)";
              } else {
                timeline.classification = "NORMAL (<400ms responsive)";
              }

              addLog(
                "MENU",
                `Menu painted (+${timeline.t4_firstPaint}ms). Classification: ${timeline.classification}`
              );

              hamburgerTimelinesRef.current = [timeline, ...hamburgerTimelinesRef.current.slice(0, 9)];
              currentMenuInteractionRef.current = null;
              bodyObserver.disconnect();
            });
          });
        }
      });

      bodyObserver.observe(document.body, { childList: true, subtree: true });

      // Timeout safety: disconnect observers after 6s
      setTimeout(() => {
        attrObserver.disconnect();
        bodyObserver.disconnect();
        if (timeline.totalDurationMs === null) {
          timeline.totalDurationMs = Math.round(performance.now() - t0);
          timeline.classification = "TIMEOUT (>6s or untracked state)";
          hamburgerTimelinesRef.current = [timeline, ...hamburgerTimelinesRef.current.slice(0, 9)];
        }
      }, 6000);
    };

    // Attach capture listeners to catch interaction as early as possible
    window.addEventListener("pointerdown", handleMenuPointer, { capture: true, passive: true });
    window.addEventListener("touchstart", handleMenuPointer, { capture: true, passive: true });
    window.addEventListener("click", handleMenuPointer, { capture: true, passive: true });

    return () => {
      window.removeEventListener("pointerdown", handleMenuPointer, { capture: true });
      window.removeEventListener("touchstart", handleMenuPointer, { capture: true });
      window.removeEventListener("click", handleMenuPointer, { capture: true });
    };
  }, [addLog]);

  // --------------------------------------------------------------------------
  // 4. Selected Projects & Tech Stack Diagnostics
  // --------------------------------------------------------------------------
  useEffect(() => {
    let intersectionObserver: IntersectionObserver | null = null;

    const initProjectsTracking = () => {
      const projectCards = document.querySelectorAll<HTMLElement>("[data-selected-project-card]");
      const techCards = document.querySelectorAll<HTMLElement>("[data-tech-stack-card]");

      if (projectCards.length > 0) {
        addLog("PROJECTS", `Selected Projects stack found (${projectCards.length} cards detected)`);
      }
      if (techCards.length > 0) {
        addLog("PROJECTS", `Tech Stack cards found (${techCards.length} categories detected)`);
      }

      if (typeof IntersectionObserver !== "undefined" && (projectCards.length > 0 || techCards.length > 0)) {
        intersectionObserver = new IntersectionObserver(
          (entries) => {
            entries.forEach((entry) => {
              const target = entry.target as HTMLElement;
              const isProject = target.hasAttribute("data-selected-project-card");
              const isTech = target.hasAttribute("data-tech-stack-card");

              const inView = entry.isIntersecting;
              const ratio = Math.round(entry.intersectionRatio * 100) / 100;

              if (isProject) {
                const index = Array.from(projectCards).indexOf(target);
                addLog(
                  "PROJECTS",
                  `Project #${index} intersection change: ${inView ? "ENTERED" : "LEFT"} (ratio: ${ratio})`
                );

                // Inspect image inside card
                const img = target.querySelector<HTMLImageElement>("img");
                let imgInfo = null;
                if (img) {
                  const natW = img.naturalWidth || 0;
                  const natH = img.naturalHeight || 0;
                  const vramMB = Math.round((natW * natH * 4) / (1024 * 1024) * 10) / 10;
                  const urlParts = img.src.split("/");
                  const filename = urlParts[urlParts.length - 1]?.split("?")[0] || img.src.slice(-20);

                  let decodeMs: number | null = null;
                  if (typeof img.decode === "function" && img.complete) {
                    const tStart = performance.now();
                    img.decode().then(() => {
                      decodeMs = Math.round(performance.now() - tStart);
                    }).catch(() => {});
                  }

                  imgInfo = {
                    src: filename,
                    complete: img.complete,
                    naturalWidth: natW,
                    naturalHeight: natH,
                    displayWidth: Math.round(img.clientWidth),
                    displayHeight: Math.round(img.clientHeight),
                    loadingAttr: img.loading || "none",
                    decodeDurationMs: decodeMs,
                    estimatedVRAM_MB: vramMB,
                  };
                }

                const rect = target.getBoundingClientRect();
                const style = window.getComputedStyle(target);

                if (inView && (rect.height === 0 || style.opacity === "0" || style.visibility === "hidden")) {
                  addLog("PROJECTS", `WARNING: Project #${index} in viewport but rendered blank/hidden!`);
                }

                projectDiagnosticsRef.current[index] = {
                  index,
                  inViewport: inView,
                  intersectionRatio: ratio,
                  rect: {
                    top: Math.round(rect.top),
                    bottom: Math.round(rect.bottom),
                    height: Math.round(rect.height),
                    width: Math.round(rect.width),
                  },
                  computedDisplay: style.display,
                  computedOpacity: style.opacity,
                  imageInfo: imgInfo,
                };
              } else if (isTech) {
                const index = Array.from(techCards).indexOf(target);
                addLog(
                  "PROJECTS",
                  `Tech Stack #${index} intersection change: ${inView ? "ENTERED" : "LEFT"} (ratio: ${ratio})`
                );

                const rect = target.getBoundingClientRect();
                const style = window.getComputedStyle(target);

                if (inView && (rect.height === 0 || style.opacity === "0" || style.visibility === "hidden")) {
                  addLog("PROJECTS", `WARNING: Tech Stack #${index} in viewport but rendered blank/hidden!`);
                }

                techStackDiagnosticsRef.current[index] = {
                  index,
                  inViewport: inView,
                  intersectionRatio: ratio,
                  rect: {
                    top: Math.round(rect.top),
                    bottom: Math.round(rect.bottom),
                    height: Math.round(rect.height),
                    width: Math.round(rect.width),
                  },
                  computedDisplay: style.display,
                  computedOpacity: style.opacity,
                  imageInfo: null,
                };
              }
            });
          },
          { threshold: [0, 0.25, 0.5, 0.75, 1.0] }
        );

        projectCards.forEach((el) => intersectionObserver?.observe(el));
        techCards.forEach((el) => intersectionObserver?.observe(el));
      }
    };

    // Delay slightly to let Home page components mount
    const timer = setTimeout(initProjectsTracking, 500);

    return () => {
      clearTimeout(timer);
      intersectionObserver?.disconnect();
    };
  }, [addLog]);

  // --------------------------------------------------------------------------
  // 5. JavaScript Error Capture (window.onerror & onunhandledrejection)
  // --------------------------------------------------------------------------
  useEffect(() => {
    const errorHandler = (event: ErrorEvent) => {
      const msg = `[Error] ${event.message} (${event.filename}:${event.lineno})`;
      jsErrorsRef.current.unshift(msg);
      addLog("ERROR", msg);
    };

    const rejectionHandler = (event: PromiseRejectionEvent) => {
      const reason = event.reason ? String(event.reason) : "Unhandled rejection";
      const msg = `[Rejection] ${reason}`;
      jsErrorsRef.current.unshift(msg);
      addLog("ERROR", msg);
    };

    window.addEventListener("error", errorHandler);
    window.addEventListener("unhandledrejection", rejectionHandler);

    return () => {
      window.removeEventListener("error", errorHandler);
      window.removeEventListener("unhandledrejection", rejectionHandler);
    };
  }, [addLog]);

  // --------------------------------------------------------------------------
  // 6. Scroll & Mutation Activity Monitors
  // --------------------------------------------------------------------------
  useEffect(() => {
    let lastScrollSec = performance.now();
    let scrollCountSec = 0;

    const handleScroll = () => {
      scrollCountRef.current++;
      scrollCountSec++;
      const now = performance.now();
      lastScrollTimeRef.current = now;

      if (now - lastScrollSec >= 1000) {
        scrollRateRef.current = scrollCountSec;
        scrollCountSec = 0;
        lastScrollSec = now;
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });

    // Targeted Mutation Observer for Home page content
    let mutCountSec = 0;
    let lastMutSec = performance.now();
    const mutationObserver = new MutationObserver((mutations) => {
      mutationCountRef.current += mutations.length;
      mutCountSec += mutations.length;
      const now = performance.now();
      if (now - lastMutSec >= 1000) {
        mutationRateRef.current = mutCountSec;
        mutCountSec = 0;
        lastMutSec = now;
      }
    });

    const targetNode = document.querySelector("main") || document.body;
    mutationObserver.observe(targetNode, { childList: true, subtree: true, attributes: false });

    return () => {
      window.removeEventListener("scroll", handleScroll);
      mutationObserver.disconnect();
    };
  }, []);

  // --------------------------------------------------------------------------
  // 7. Periodic State Flush to UI (2Hz to prevent monitor-induced frame drops)
  // --------------------------------------------------------------------------
  useEffect(() => {
    const interval = setInterval(() => {
      setUiState({
        fps: currentFpsRef.current,
        minFps: minFpsRef.current,
        currentFrameGap: recentGapsRef.current[recentGapsRef.current.length - 1] ? Math.round(recentGapsRef.current[recentGapsRef.current.length - 1]) : 16,
        maxFrameGap: maxFrameGapRef.current,
        recentStallsCount: stallsRef.current.length,
        longTaskCount: longTasksRef.current.length,
        lastLongTaskDuration: longTasksRef.current[longTasksRef.current.length - 1]?.duration || 0,
        longTaskSupported: longTaskSupportedRef.current,
        scrollEventsPerSec: scrollRateRef.current,
        mutationsPerSec: mutationRateRef.current,
        jsErrorCount: jsErrorsRef.current.length,
        lastError: jsErrorsRef.current[0] || "",
        hamburgerTimelines: [...hamburgerTimelinesRef.current],
        projectDiagnostics: [...projectDiagnosticsRef.current],
        techStackDiagnostics: [...techStackDiagnosticsRef.current],
        logs: [...logsRef.current.slice(0, 40)],
      });
    }, 500);

    return () => clearInterval(interval);
  }, []);

  // --------------------------------------------------------------------------
  // 8. Generate Full Diagnostic Report
  // --------------------------------------------------------------------------
  const generateDiagnosticReport = useCallback(() => {
    const navUserAgent = typeof navigator !== "undefined" ? navigator.userAgent : "unknown";
    const dpr = typeof window !== "undefined" ? window.devicePixelRatio : 1;
    const viewportWidth = typeof window !== "undefined" ? window.innerWidth : 0;
    const viewportHeight = typeof window !== "undefined" ? window.innerHeight : 0;
    const visualVp = typeof window !== "undefined" && window.visualViewport ? `${window.visualViewport.width}x${window.visualViewport.height}` : "N/A";
    const touchPoints = typeof navigator !== "undefined" ? navigator.maxTouchPoints : "N/A";

    // Supported APIs
    const longtaskSupport = longTaskSupportedRef.current ? "Supported" : "Unsupported (Safari/WebKit)";
    const memoryApi = typeof performance !== "undefined" && (performance as unknown as { memory?: unknown }).memory
      ? JSON.stringify((performance as unknown as { memory: unknown }).memory)
      : "Unsupported (Safari/WebKit)";

    // Slowest resources
    const resourceEntries = typeof performance !== "undefined" && performance.getEntriesByType
      ? (performance.getEntriesByType("resource") as PerformanceResourceTiming[])
      : [];
    const slowResources = resourceEntries
      .filter((r) => r.duration > 150)
      .sort((a, b) => b.duration - a.duration)
      .slice(0, 5)
      .map((r) => {
        const urlParts = r.name.split("/");
        const basename = urlParts[urlParts.length - 1]?.split("?")[0] || r.name.slice(-30);
        return `  - ${basename} (${r.initiatorType}): ${Math.round(r.duration)}ms (transfer: ${Math.round(r.transferSize || 0)}B)`;
      });

    // Compositing & CSS audit
    const navBackdrop = document.querySelector('[class*="backdrop-blur"]');
    const navBackdropStyle = navBackdrop ? window.getComputedStyle(navBackdrop) : null;
    const navDrawer = document.querySelector('.glass-panel[class*="inset-x-4"]');
    const navDrawerStyle = navDrawer ? window.getComputedStyle(navDrawer) : null;

    const projectCards = document.querySelectorAll("[data-selected-project-card]");
    const techCards = document.querySelectorAll("[data-tech-stack-card]");

    const projectCardsSummary = Array.from(projectCards).map((card, i) => {
      const style = window.getComputedStyle(card);
      const rect = card.getBoundingClientRect();
      return `  - Selected Project #${i}: position=${style.position}, top=${style.top}, zIndex=${style.zIndex}, transform=${style.transform}, willChange=${style.willChange}, rect=[top:${Math.round(rect.top)}, h:${Math.round(rect.height)}]`;
    });

    const techCardsSummary = Array.from(techCards).map((card, i) => {
      const style = window.getComputedStyle(card);
      const rect = card.getBoundingClientRect();
      return `  - Tech Stack #${i}: position=${style.position}, top=${style.top}, zIndex=${style.zIndex}, transform=${style.transform}, willChange=${style.willChange}, rect=[top:${Math.round(rect.top)}, h:${Math.round(rect.height)}]`;
    });

    const reportLines = [
      "==================================================",
      "RAWIN 3.0 — iOS DIAGNOSTIC REPORT",
      "==================================================",
      `Date/Time: ${new Date().toISOString()}`,
      `Session Elapsed: ${Math.round((Date.now() - startTimeRef.current) / 1000)}s`,
      "",
      "--- DEVICE & BROWSER CONTEXT ---",
      `User Agent: ${navUserAgent}`,
      `Screen / Viewport: ${viewportWidth}x${viewportHeight} (DPR: ${dpr})`,
      `Visual Viewport: ${visualVp}`,
      `Touch Points: ${touchPoints}`,
      "",
      "--- PERFORMANCE APIS & SUPPORT ---",
      `PerformanceObserver longtask: ${longtaskSupport}`,
      `performance.memory: ${memoryApi}`,
      `requestAnimationFrame: Supported`,
      `IntersectionObserver: ${typeof IntersectionObserver !== "undefined" ? "Supported" : "Unsupported"}`,
      `MutationObserver: ${typeof MutationObserver !== "undefined" ? "Supported" : "Unsupported"}`,
      "",
      "--- FRAME & FPS METRICS ---",
      `Current FPS: ${currentFpsRef.current}`,
      `Minimum FPS: ${minFpsRef.current}`,
      `Max Frame Gap: ${maxFrameGapRef.current}ms`,
      `Significant Stalls (>120ms): ${stallsRef.current.length}`,
      ...stallsRef.current.slice(0, 8).map((s) => `  - [${s.timestamp}] Gap: ${s.gapMs}ms`),
      "",
      "--- LONG TASKS DETECTED ---",
      longTaskSupportedRef.current
        ? `Total Long Tasks: ${longTasksRef.current.length}\n` +
          longTasksRef.current.slice(-5).map((t) => `  - ${t.name}: ${t.duration}ms at start ${t.startTime}ms`).join("\n")
        : "LongTask API is unsupported on iOS Safari/WebKit. Frame stalls above reflect main thread pauses.",
      "",
      "--- HAMBURGER / MOBILE MENU TIMELINE ---",
      hamburgerTimelinesRef.current.length === 0
        ? "No hamburger menu interactions recorded yet."
        : hamburgerTimelinesRef.current.map((t, idx) => [
            `Interaction #${idx + 1} (${t.action}) at ${t.timestamp}:`,
            `  - Pointer/Click received: 0ms (T0)`,
            `  - State update (aria-expanded): ${t.t1_stateUpdate !== null ? `+${t.t1_stateUpdate}ms` : "unobserved"}`,
            `  - DOM mounted (drawer/backdrop): ${t.t2_domMounted !== null ? `+${t.t2_domMounted}ms` : "unobserved"}`,
            `  - Animation start / rAF 1: ${t.t3_animationStarted !== null ? `+${t.t3_animationStarted}ms` : "unobserved"}`,
            `  - First visual paint / rAF 2: ${t.t4_firstPaint !== null ? `+${t.t4_firstPaint}ms` : "unobserved"}`,
            `  - TOTAL DELAY: ${t.totalDurationMs}ms`,
            `  - CLASSIFICATION: ${t.classification}`,
          ].join("\n")).join("\n\n"),
      "",
      "--- SELECTED PROJECTS & IMAGE DIAGNOSTICS ---",
      projectDiagnosticsRef.current.length === 0
        ? "Selected Projects not intersected or not yet inspected."
        : projectDiagnosticsRef.current.map((c) => {
            const imgStr = c.imageInfo
              ? `img="${c.imageInfo.src}" complete=${c.imageInfo.complete} natDim=${c.imageInfo.naturalWidth}x${c.imageInfo.naturalHeight} dispDim=${c.imageInfo.displayWidth}x${c.imageInfo.displayHeight} VRAM~${c.imageInfo.estimatedVRAM_MB}MB decode=${c.imageInfo.decodeDurationMs !== null ? `${c.imageInfo.decodeDurationMs}ms` : "N/A"}`
              : "no image";
            const rectStr = c.rect ? `[top:${c.rect.top}, btm:${c.rect.bottom}, h:${c.rect.height}]` : "N/A";
            return `Project Card #${c.index}: inView=${c.inViewport} ratio=${c.intersectionRatio} display=${c.computedDisplay} opacity=${c.computedOpacity} rect=${rectStr}\n  -> ${imgStr}`;
          }).join("\n"),
      "",
      "--- TECH STACK CARDS DIAGNOSTICS ---",
      techStackDiagnosticsRef.current.length === 0
        ? "Tech Stack cards not intersected or not yet inspected."
        : techStackDiagnosticsRef.current.map((c) => {
            const rectStr = c.rect ? `[top:${c.rect.top}, btm:${c.rect.bottom}, h:${c.rect.height}]` : "N/A";
            return `Tech Stack Card #${c.index}: inView=${c.inViewport} ratio=${c.intersectionRatio} display=${c.computedDisplay} opacity=${c.computedOpacity} rect=${rectStr}`;
          }).join("\n"),
      "",
      "--- COMPOSITING & CSS AUDIT ---",
      `Nav Backdrop: backdropFilter=${navBackdropStyle?.backdropFilter || (navBackdropStyle as unknown as Record<string, string>)?.webkitBackdropFilter || "none"}, bg=${navBackdropStyle?.backgroundColor}`,
      `Nav Drawer: backdropFilter=${navDrawerStyle?.backdropFilter || (navDrawerStyle as unknown as Record<string, string>)?.webkitBackdropFilter || "none"}, filter=${navDrawerStyle?.filter || "none"}, transform=${navDrawerStyle?.transform || "none"}`,
      "Sticky Card Wrappers (Selected Projects):",
      ...(projectCardsSummary.length > 0 ? projectCardsSummary : ["  None detected"]),
      "Sticky Card Wrappers (Tech Stack):",
      ...(techCardsSummary.length > 0 ? techCardsSummary : ["  None detected"]),
      "",
      "--- SCROLL & DOM MUTATION ACTIVITY ---",
      `Total Scroll Events: ${scrollCountRef.current} (Rate: ${scrollRateRef.current}/sec)`,
      `Total DOM Mutations: ${mutationCountRef.current} (Rate: ${mutationRateRef.current}/sec)`,
      "",
      "--- SLOW RESOURCE TIMINGS (>150ms) ---",
      slowResources.length > 0 ? slowResources.join("\n") : "  No slow resources recorded (>150ms).",
      "",
      "--- JAVASCRIPT ERRORS / UNHANDLED REJECTIONS ---",
      jsErrorsRef.current.length === 0
        ? "Zero JavaScript errors or unhandled rejections recorded."
        : jsErrorsRef.current.slice(0, 5).join("\n"),
      "",
      "--- MOBILE CLOSING & FOOTER (TIME TO LEVEL UP) DIAGNOSTICS ---",
      ...(() => {
        const cd = typeof window !== "undefined"
          ? (window as unknown as { __IOS_CLOSING_DEBUG__?: {
              currentRoute: string;
              scrollY: number;
              sectionBoundingRect: { top: number; bottom: number; height: number; width: number } | null;
              calculatedProgress: number;
              currentOpacity: { timeTo: string; levelUp: string; eyebrow: string; cta: string };
              currentTransform: { timeTo: string; levelUp: string; eyebrow: string; cta: string };
              initialMeasurementCompleted: boolean;
              initialMeasurementTimestamp: number | null;
              latestScrollCalcTimestamp: number | null;
              viewportHeight: number;
              documentHeight: number;
            } }).__IOS_CLOSING_DEBUG__
          : undefined;

        if (!cd) {
          return ["  No MobileClosingAndFooter debug data recorded yet (section not mounted or excluded)."];
        }

        return [
          `  Current Route: ${cd.currentRoute}`,
          `  ScrollY: ${cd.scrollY}px | ViewportH: ${cd.viewportHeight}px | DocumentH: ${cd.documentHeight}px`,
          `  Section Bounding Rect: ${cd.sectionBoundingRect ? `top=${cd.sectionBoundingRect.top}, btm=${cd.sectionBoundingRect.bottom}, h=${cd.sectionBoundingRect.height}, w=${cd.sectionBoundingRect.width}` : "null"}`,
          `  Calculated Progress: ${cd.calculatedProgress} (${(cd.calculatedProgress * 100).toFixed(1)}%)`,
          `  Initial Measure Completed: ${cd.initialMeasurementCompleted} (at ${cd.initialMeasurementTimestamp ? new Date(cd.initialMeasurementTimestamp).toLocaleTimeString() : "N/A"})`,
          `  Latest Scroll Calc: ${cd.latestScrollCalcTimestamp ? new Date(cd.latestScrollCalcTimestamp).toLocaleTimeString() : "N/A"}`,
          `  Current Opacity: TIME TO=${cd.currentOpacity.timeTo}, LEVEL UP=${cd.currentOpacity.levelUp}, EYEBROW=${cd.currentOpacity.eyebrow}, CTA=${cd.currentOpacity.cta}`,
          `  Current Transform: TIME TO=${cd.currentTransform.timeTo}, LEVEL UP=${cd.currentTransform.levelUp}, EYEBROW=${cd.currentTransform.eyebrow}, CTA=${cd.currentTransform.cta}`,
        ];
      })(),
      "",
      "--- CHRONOLOGICAL EVENT LOG (Last 30 Events) ---",
      ...logsRef.current.slice(0, 30).map((l) => `[${l.time}] (+${l.relativeMs}ms) [${l.category}] ${l.message}`),
      "==================================================",
      "END OF DIAGNOSTIC REPORT",
      "==================================================",
    ];

    return reportLines.join("\n");
  }, []);

  // 1. SHARE REPORT (Native iOS Share Sheet)
  const handleShareReport = async () => {
    const report = generateDiagnosticReport();
    if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
      try {
        await navigator.share({
          title: "RAWIN 3.0 iOS Diagnostic Report",
          text: report,
        });
        setCopyStatus("SHARED SUCCESSFULLY VIA iOS SHEET!");
        setTimeout(() => setCopyStatus(null), 4000);
        return;
      } catch (err: unknown) {
        if ((err as Error)?.name === "AbortError") {
          // User dismissed the iOS share sheet
          return;
        }
        setCopyStatus("SHARE FAILED: " + ((err as Error)?.message || "Unknown error"));
        setTimeout(() => setCopyStatus(null), 4000);
      }
    } else {
      setCopyStatus("Native sharing is unavailable on this browser.");
      setTimeout(() => setCopyStatus(null), 4000);
    }
  };

  // 2. DOWNLOAD REPORT (.txt Blob)
  const handleDownloadReport = () => {
    try {
      const report = generateDiagnosticReport();
      const blob = new Blob([report], { type: "text/plain;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "rawin-ios-diagnostic-report.txt";
      a.style.display = "none";
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        if (document.body.contains(a)) {
          document.body.removeChild(a);
        }
        URL.revokeObjectURL(url);
      }, 2000);
      setCopyStatus("DOWNLOAD TRIGGERED: rawin-ios-diagnostic-report.txt");
      setTimeout(() => setCopyStatus(null), 4000);
    } catch (err: unknown) {
      setCopyStatus("DOWNLOAD BLOCKED: " + ((err as Error)?.message || "Browser restricted"));
      setTimeout(() => setCopyStatus(null), 4000);
    }
  };

  // 3. COPY REPORT (Clipboard with robust execCommand fallback)
  const handleCopyReport = async () => {
    const report = generateDiagnosticReport();

    // Try modern clipboard API first
    if (typeof navigator !== "undefined" && navigator.clipboard && typeof navigator.clipboard.writeText === "function") {
      try {
        await navigator.clipboard.writeText(report);
        setCopyStatus("COPIED TO CLIPBOARD!");
        setTimeout(() => setCopyStatus(null), 3500);
        return;
      } catch {
        // Continue to fallback
      }
    }

    // Robust iOS fallback: temporary textarea with explicit select
    try {
      const tempEl = document.createElement("textarea");
      tempEl.value = report;
      tempEl.setAttribute("readonly", "");
      tempEl.style.position = "fixed";
      tempEl.style.top = "0";
      tempEl.style.left = "0";
      tempEl.style.width = "2em";
      tempEl.style.height = "2em";
      tempEl.style.padding = "0";
      tempEl.style.border = "none";
      tempEl.style.outline = "none";
      tempEl.style.boxShadow = "none";
      tempEl.style.background = "transparent";
      tempEl.style.fontSize = "16px"; // Prevent iOS auto-zoom
      tempEl.style.setProperty("-webkit-user-select", "text");
      tempEl.style.setProperty("user-select", "text");
      document.body.appendChild(tempEl);
      tempEl.focus();
      tempEl.select();
      tempEl.setSelectionRange(0, report.length);
      const successful = document.execCommand("copy");
      document.body.removeChild(tempEl);

      if (successful) {
        setCopyStatus("COPIED VIA FALLBACK METHOD!");
        setTimeout(() => setCopyStatus(null), 3500);
        return;
      }
    } catch {
      // Continue to UI fallback
    }

    // UI Fallback
    setShowRawTextarea(true);
    setActiveTab("report");
    setCopyStatus("AUTO-COPY BLOCKED: USE SHARE, DOWNLOAD, OR OPEN TAB");
  };

  // 4. OPEN PLAIN TEXT REPORT (Blob URL in clean new tab)
  const handleOpenReport = () => {
    try {
      const report = generateDiagnosticReport();
      const blob = new Blob([report], { type: "text/plain;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      setOpenBlobUrl(url);

      const opened = window.open(url, "_blank");
      if (!opened || opened.closed || typeof opened.closed === "undefined") {
        setCopyStatus("POPUP BLOCKED: TAP DIRECT LINK BELOW");
      } else {
        setCopyStatus("OPENED REPORT IN NEW TAB");
        setTimeout(() => setCopyStatus(null), 3500);
      }
    } catch (err: unknown) {
      setCopyStatus("OPEN FAILED: " + ((err as Error)?.message || "Browser restricted"));
    }
  };

  // --------------------------------------------------------------------------
  // Render: Compact Floating Bar or Expanded Diagnostics Modal
  // --------------------------------------------------------------------------
  return (
    <aside
      aria-label="RAWIN iOS Diagnostic HUD"
      className="fixed z-[9999] pointer-events-auto font-mono text-[11px] text-white selection:bg-pacific-cyan/30"
      style={{
        bottom: "max(12px, env(safe-area-inset-bottom, 12px))",
        right: "max(12px, env(safe-area-inset-right, 12px))",
        maxWidth: isExpanded ? "calc(100vw - 24px)" : "auto",
      }}
    >
      {!isExpanded ? (
        // Minimized HUD Pill
        <div
          onClick={() => setIsExpanded(true)}
          className="flex items-center gap-2 bg-[#0d0d14]/95 border border-cyan-400/50 rounded-xl px-3 py-2 shadow-2xl backdrop-blur-md cursor-pointer active:scale-95 transition-transform"
        >
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            <span className="font-bold tracking-tight text-cyan-300">RAWIN DEBUG</span>
          </div>
          <span className="text-white/40">|</span>
          <span className={uiState.fps < 45 ? "text-amber-400 font-bold" : "text-emerald-400 font-bold"}>
            {uiState.fps} FPS
          </span>
          <span className="text-white/40">|</span>
          <span className="text-white/80">Gap: {uiState.currentFrameGap}ms</span>
          {uiState.jsErrorCount > 0 && (
            <>
              <span className="text-white/40">|</span>
              <span className="text-rose-400 font-bold">Err: {uiState.jsErrorCount}</span>
            </>
          )}
          <span className="bg-cyan-500/20 text-cyan-300 text-[10px] px-1.5 py-0.5 rounded border border-cyan-500/30">
            EXPAND
          </span>
        </div>
      ) : (
        // Expanded Diagnostic Window
        <div className="w-[360px] max-w-[calc(100vw-24px)] max-h-[75vh] flex flex-col bg-[#0b0c13]/98 border border-cyan-500/40 rounded-2xl shadow-2xl backdrop-blur-xl overflow-hidden">
          {/* Header with Quick Action Buttons */}
          <div className="flex items-center justify-between px-3 py-2 bg-white/[0.04] border-b border-white/10 shrink-0 gap-1">
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="w-2 h-2 rounded-full bg-cyan-400" />
              <span className="font-bold text-cyan-300 text-[11px] tracking-wider uppercase">
                iOS Debug
              </span>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handleShareReport}
                className="bg-cyan-400 text-ink-black font-bold px-1.5 py-1 rounded text-[9px] hover:bg-cyan-300 active:scale-95 transition-all"
                title="Share via iOS sheet"
              >
                SHARE
              </button>
              <button
                type="button"
                onClick={handleDownloadReport}
                className="bg-cyan-600 text-white font-bold px-1.5 py-1 rounded text-[9px] hover:bg-cyan-500 active:scale-95 transition-all"
                title="Download .txt"
              >
                DL .TXT
              </button>
              <button
                type="button"
                onClick={handleCopyReport}
                className="bg-white/10 text-cyan-300 font-bold px-1.5 py-1 rounded text-[9px] hover:bg-white/20 active:scale-95 transition-all"
                title="Copy to clipboard"
              >
                COPY
              </button>
              <button
                type="button"
                onClick={handleOpenReport}
                className="bg-white/10 text-white font-bold px-1.5 py-1 rounded text-[9px] hover:bg-white/20 active:scale-95 transition-all"
                title="Open in new tab"
              >
                OPEN
              </button>
              <button
                type="button"
                onClick={() => setIsExpanded(false)}
                className="bg-white/10 text-white/70 px-1.5 py-1 rounded text-[9px] hover:bg-white/20 ml-0.5"
              >
                MIN
              </button>
            </div>
          </div>

          {/* Copy feedback message */}
          {copyStatus && (
            <div className="bg-cyan-900/60 border-b border-cyan-400/40 px-3 py-1 text-center text-[10px] text-cyan-200">
              {copyStatus}
            </div>
          )}

          {/* Navigation Tabs */}
          <div className="flex items-center gap-1 px-2 py-1.5 bg-black/40 border-b border-white/5 text-[10px] shrink-0 overflow-x-auto">
            {(["summary", "menu", "projects", "log", "report"] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`px-2 py-1 rounded transition-colors uppercase ${
                  activeTab === tab
                    ? "bg-cyan-500/25 text-cyan-300 font-bold border border-cyan-500/40"
                    : "text-white/60 hover:text-white"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Tab Content Container */}
          <div className="p-3 overflow-y-auto flex-1 flex flex-col gap-2.5 text-white/90">
            {/* Tab: Summary */}
            {activeTab === "summary" && (
              <div className="flex flex-col gap-2">
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-white/[0.03] border border-white/5 p-2 rounded-lg">
                    <div className="text-white/50 text-[9px] uppercase">Frame Rate</div>
                    <div className="text-base font-bold text-cyan-300">{uiState.fps} FPS</div>
                    <div className="text-[9px] text-white/40">Min: {uiState.minFps} FPS</div>
                  </div>
                  <div className="bg-white/[0.03] border border-white/5 p-2 rounded-lg">
                    <div className="text-white/50 text-[9px] uppercase">Max Frame Gap</div>
                    <div className="text-base font-bold text-amber-300">{uiState.maxFrameGap}ms</div>
                    <div className="text-[9px] text-white/40">Stalls &gt;120ms: {uiState.recentStallsCount}</div>
                  </div>
                </div>

                <div className="bg-white/[0.03] border border-white/5 p-2 rounded-lg flex flex-col gap-1">
                  <div className="text-white/50 text-[9px] uppercase">Long Task API</div>
                  <div className="text-xs">
                    {uiState.longTaskSupported ? (
                      <span className="text-emerald-300">Supported (tasks: {uiState.longTaskCount})</span>
                    ) : (
                      <span className="text-amber-300">Unsupported (Safari/WebKit standard)</span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-white/[0.03] border border-white/5 p-2 rounded-lg">
                    <div className="text-white/50 text-[9px] uppercase">Scroll Rate</div>
                    <div className="text-xs font-bold text-white">{uiState.scrollEventsPerSec} / sec</div>
                  </div>
                  <div className="bg-white/[0.03] border border-white/5 p-2 rounded-lg">
                    <div className="text-white/50 text-[9px] uppercase">DOM Mutations</div>
                    <div className="text-xs font-bold text-white">{uiState.mutationsPerSec} / sec</div>
                  </div>
                </div>

                <div className="bg-white/[0.03] border border-white/5 p-2 rounded-lg">
                  <div className="text-white/50 text-[9px] uppercase">JS Errors / Rejections</div>
                  <div className={`text-xs font-bold ${uiState.jsErrorCount > 0 ? "text-rose-400" : "text-emerald-400"}`}>
                    {uiState.jsErrorCount} recorded
                  </div>
                  {uiState.lastError && (
                    <div className="text-[9px] text-rose-300 truncate mt-1">{uiState.lastError}</div>
                  )}
                </div>

                {/* Closing Section Diagnostic Card */}
                {(() => {
                  const closingDebug = typeof window !== "undefined"
                    ? (window as unknown as { __IOS_CLOSING_DEBUG__?: {
                        currentRoute: string;
                        scrollY: number;
                        sectionBoundingRect: { top: number; bottom: number; height: number; width: number } | null;
                        calculatedProgress: number;
                        currentOpacity: { timeTo: string; levelUp: string; eyebrow: string; cta: string };
                        currentTransform: { timeTo: string; levelUp: string; eyebrow: string; cta: string };
                        initialMeasurementCompleted: boolean;
                        initialMeasurementTimestamp: number | null;
                        latestScrollCalcTimestamp: number | null;
                        viewportHeight: number;
                        documentHeight: number;
                      } }).__IOS_CLOSING_DEBUG__
                    : undefined;

                  if (!closingDebug) return null;

                  return (
                    <div className="bg-white/[0.03] border border-cyan-500/25 p-2 rounded-lg flex flex-col gap-1 text-[10px]">
                      <div className="text-cyan-400 font-bold uppercase tracking-wider text-[9px] flex items-center justify-between">
                        <span>Closing Section (Level Up)</span>
                        <span className="text-white/50 font-mono">{closingDebug.currentRoute}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-1 text-[9px] text-white/70">
                        <div>Progress: <span className="text-cyan-300 font-bold">{(closingDebug.calculatedProgress * 100).toFixed(0)}%</span></div>
                        <div>Initial: <span className={closingDebug.initialMeasurementCompleted ? "text-emerald-300 font-bold" : "text-amber-300 font-bold"}>{closingDebug.initialMeasurementCompleted ? "READY" : "WAITING"}</span></div>
                        <div>ScrollY: <span className="text-white">{closingDebug.scrollY}px</span></div>
                        <div>Top: <span className="text-white">{closingDebug.sectionBoundingRect?.top ?? "N/A"}px</span></div>
                        <div>TIME TO Op: <span className="text-white">{closingDebug.currentOpacity.timeTo}</span></div>
                        <div>LEVEL UP Op: <span className="text-white">{closingDebug.currentOpacity.levelUp}</span></div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}

            {/* Tab: Hamburger Timeline */}
            {activeTab === "menu" && (
              <div className="flex flex-col gap-2">
                <div className="text-[10px] text-white/60">
                  Tap the hamburger above to observe the interaction breakdown in real time:
                </div>
                {uiState.hamburgerTimelines.length === 0 ? (
                  <div className="text-center py-6 text-white/40 text-[10px] border border-dashed border-white/10 rounded-lg">
                    No menu interactions recorded yet. Tap hamburger to test.
                  </div>
                ) : (
                  uiState.hamburgerTimelines.map((item) => (
                    <div
                      key={item.id}
                      className="bg-white/[0.03] border border-white/10 p-2 rounded-lg flex flex-col gap-1"
                    >
                      <div className="flex items-center justify-between border-b border-white/5 pb-1">
                        <span className="font-bold text-cyan-300">{item.action}</span>
                        <span className="text-[9px] text-white/40">{item.timestamp}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-1 text-[10px] pt-1">
                        <div>Click / Touch: +0ms</div>
                        <div>State update: {item.t1_stateUpdate !== null ? `+${item.t1_stateUpdate}ms` : "--"}</div>
                        <div>DOM mounted: {item.t2_domMounted !== null ? `+${item.t2_domMounted}ms` : "--"}</div>
                        <div>First paint: {item.t4_firstPaint !== null ? `+${item.t4_firstPaint}ms` : "--"}</div>
                      </div>
                      <div className="border-t border-white/5 pt-1 mt-0.5 flex items-center justify-between">
                        <span className="text-[9px] text-white/50">Total delay:</span>
                        <span className="font-bold text-amber-300">{item.totalDurationMs}ms</span>
                      </div>
                      <div className="text-[9px] text-cyan-200 bg-cyan-950/40 px-1.5 py-0.5 rounded">
                        {item.classification}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Tab: Selected Projects & Tech Stack Cards */}
            {activeTab === "projects" && (
              <div className="flex flex-col gap-3">
                {/* Selected Projects */}
                <div className="flex flex-col gap-2">
                  <div className="text-[10px] text-cyan-300 font-bold uppercase tracking-wider">
                    Selected Projects ({uiState.projectDiagnostics.length} cards):
                  </div>
                  {uiState.projectDiagnostics.length === 0 ? (
                    <div className="text-center py-3 text-white/40 text-[10px] border border-dashed border-white/10 rounded-lg">
                      Scroll toward Selected Projects to populate.
                    </div>
                  ) : (
                    uiState.projectDiagnostics.map((card) => (
                      <div
                        key={`proj-${card.index}`}
                        className="bg-white/[0.03] border border-white/10 p-2 rounded-lg flex flex-col gap-1 text-[10px]"
                      >
                        <div className="flex items-center justify-between font-bold">
                          <span className="text-cyan-300">Project Card #{card.index}</span>
                          <span className={card.inViewport ? "text-emerald-400" : "text-white/40"}>
                            {card.inViewport ? `IN VIEW (${card.intersectionRatio})` : "OUT OF VIEW"}
                          </span>
                        </div>
                        {card.rect && (
                          <div className="text-[9px] text-white/50">
                            Rect: top={card.rect.top}px, height={card.rect.height}px
                          </div>
                        )}
                        {card.imageInfo ? (
                          <div className="bg-black/30 p-1.5 rounded border border-white/5 text-[9px] flex flex-col gap-0.5">
                            <div className="text-white/70 truncate">{card.imageInfo.src}</div>
                            <div className="text-white/50">
                              Natural: {card.imageInfo.naturalWidth}x{card.imageInfo.naturalHeight} | VRAM ~{card.imageInfo.estimatedVRAM_MB}MB
                            </div>
                            <div className="text-white/50">
                              Loaded: {card.imageInfo.complete ? "Yes" : "No"} | Decode: {card.imageInfo.decodeDurationMs !== null ? `${card.imageInfo.decodeDurationMs}ms` : "N/A"}
                            </div>
                          </div>
                        ) : (
                          <div className="text-[9px] text-white/30">No project image preview</div>
                        )}
                      </div>
                    ))
                  )}
                </div>

                {/* Tech Stack */}
                <div className="flex flex-col gap-2">
                  <div className="text-[10px] text-amber-300 font-bold uppercase tracking-wider">
                    Tech Stack ({uiState.techStackDiagnostics.length} categories):
                  </div>
                  {uiState.techStackDiagnostics.length === 0 ? (
                    <div className="text-center py-3 text-white/40 text-[10px] border border-dashed border-white/10 rounded-lg">
                      Scroll toward Tech Stack to populate.
                    </div>
                  ) : (
                    uiState.techStackDiagnostics.map((card) => (
                      <div
                        key={`tech-${card.index}`}
                        className="bg-white/[0.03] border border-white/10 p-2 rounded-lg flex flex-col gap-1 text-[10px]"
                      >
                        <div className="flex items-center justify-between font-bold">
                          <span className="text-amber-300">Category Card #{card.index}</span>
                          <span className={card.inViewport ? "text-emerald-400" : "text-white/40"}>
                            {card.inViewport ? `IN VIEW (${card.intersectionRatio})` : "OUT OF VIEW"}
                          </span>
                        </div>
                        {card.rect && (
                          <div className="text-[9px] text-white/50">
                            Rect: top={card.rect.top}px, height={card.rect.height}px
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* Tab: Chronological Log */}
            {activeTab === "log" && (
              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between pb-1 border-b border-white/10 text-[9px] text-white/50">
                  <span>Recent Events ({uiState.logs.length})</span>
                  <button
                    type="button"
                    onClick={() => {
                      logsRef.current = [];
                      setUiState((prev) => ({ ...prev, logs: [] }));
                    }}
                    className="hover:text-white"
                  >
                    Clear
                  </button>
                </div>
                <div className="flex flex-col gap-1 max-h-[220px] overflow-y-auto font-mono text-[9px]">
                  {uiState.logs.map((log) => (
                    <div
                      key={log.id}
                      className={`px-1.5 py-0.5 rounded leading-tight ${
                        log.category === "FRAME"
                          ? "bg-amber-950/30 text-amber-200"
                          : log.category === "MENU"
                          ? "bg-cyan-950/30 text-cyan-200"
                          : log.category === "ERROR"
                          ? "bg-rose-950/40 text-rose-200"
                          : "bg-white/[0.02] text-white/70"
                      }`}
                    >
                      <span className="text-white/30">[{log.time.split(".")[0]}]</span>{" "}
                      <span className="font-bold">[{log.category}]</span> {log.message}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tab: Full Report & Export Options */}
            {activeTab === "report" && (
              <div className="flex flex-col gap-2.5">
                <div className="text-[10px] text-cyan-300 font-bold">
                  Choose an export method to extract the report from this iPhone:
                </div>

                {/* 4 Action Buttons Grid */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={handleShareReport}
                    className="flex flex-col items-center justify-center p-2 rounded-xl bg-cyan-500 text-ink-black font-bold active:scale-95 transition-transform shadow-[0_0_12px_rgba(24,155,173,0.35)] min-h-[44px]"
                  >
                    <span className="text-xs">📲 SHARE REPORT</span>
                    <span className="text-[8px] font-normal opacity-90">iOS Share Sheet / AirDrop</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleDownloadReport}
                    className="flex flex-col items-center justify-center p-2 rounded-xl bg-cyan-600 text-white font-bold active:scale-95 transition-transform min-h-[44px]"
                  >
                    <span className="text-xs">📥 DOWNLOAD .TXT</span>
                    <span className="text-[8px] font-normal opacity-80">Save directly to Files</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleCopyReport}
                    className="flex flex-col items-center justify-center p-2 rounded-xl bg-white/10 border border-cyan-400/40 text-cyan-200 font-bold active:scale-95 transition-transform min-h-[44px]"
                  >
                    <span className="text-xs">📋 COPY REPORT</span>
                    <span className="text-[8px] font-normal opacity-80">System clipboard + fallback</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleOpenReport}
                    className="flex flex-col items-center justify-center p-2 rounded-xl bg-white/10 border border-white/20 text-white font-bold active:scale-95 transition-transform min-h-[44px]"
                  >
                    <span className="text-xs">↗️ OPEN FULL REPORT</span>
                    <span className="text-[8px] font-normal opacity-80">Clean plain-text tab</span>
                  </button>
                </div>

                {/* Direct link for popup-blocked browsers */}
                {openBlobUrl && (
                  <div className="bg-cyan-950/60 border border-cyan-400/50 p-2 rounded-lg text-center">
                    <a
                      href={openBlobUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-cyan-300 font-bold text-[11px] underline block py-1"
                    >
                      👉 Tap here to open Plain-Text Report in New Tab ↗
                    </a>
                  </div>
                )}

                {/* Textarea Section with Native Selection */}
                <div className="flex flex-col gap-1 pt-1 border-t border-white/10">
                  <div className="flex items-center justify-between text-[9px] text-white/60">
                    <span>Raw Report Text:</span>
                    <button
                      type="button"
                      onClick={() => {
                        if (textareaRef.current) {
                          textareaRef.current.focus();
                          textareaRef.current.setSelectionRange(0, textareaRef.current.value.length);
                        }
                      }}
                      className="text-cyan-300 hover:underline font-bold"
                    >
                      [SELECT ALL TEXT]
                    </button>
                  </div>
                  <textarea
                    ref={textareaRef}
                    readOnly
                    rows={8}
                    value={generateDiagnosticReport()}
                    className="w-full bg-black/90 border border-cyan-500/40 rounded p-2 text-[9px] font-mono text-white resize-y focus:outline-none focus:border-cyan-400"
                    style={{
                      WebkitUserSelect: "text",
                      userSelect: "text",
                      WebkitTouchCallout: "default",
                      touchAction: "pan-y",
                    }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Manual textarea fallback toggle */}
          {showRawTextarea && activeTab !== "report" && (
            <div className="p-2.5 bg-black/95 border-t border-cyan-500/50 flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[9px] text-cyan-300 font-bold">
                  Select All &amp; Copy Text Below:
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (fallbackTextareaRef.current) {
                        fallbackTextareaRef.current.focus();
                        fallbackTextareaRef.current.setSelectionRange(0, fallbackTextareaRef.current.value.length);
                      }
                    }}
                    className="text-[9px] text-cyan-300 font-bold underline"
                  >
                    [SELECT ALL]
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowRawTextarea(false)}
                    className="text-[9px] text-white/50 hover:text-white"
                  >
                    ✕ Close
                  </button>
                </div>
              </div>
              <textarea
                ref={fallbackTextareaRef}
                readOnly
                rows={4}
                value={generateDiagnosticReport()}
                className="w-full bg-black border border-white/20 rounded p-1.5 text-[8px] font-mono text-white"
                style={{
                  WebkitUserSelect: "text",
                  userSelect: "text",
                  WebkitTouchCallout: "default",
                  touchAction: "pan-y",
                }}
              />
            </div>
          )}
        </div>
      )}
    </aside>
  );
}
