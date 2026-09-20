"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Send,
  Square,
  RotateCcw,
  User,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  ArrowUpRight,
} from "lucide-react";
import MarkdownRenderer from "@/components/MarkdownRenderer";
import OrbitGalaxyBackground from "@/components/orbit/OrbitGalaxyBackground";
import RawinOrbitOrb, { type OrbitVisualState } from "@/components/RawinOrbitOrb";
import type { OrbitState } from "@/components/OrbitMark";
import type { AIContent } from "@/lib/site-content";
import type { OrbitMessage } from "@/lib/aura/types";

const SUGGESTED_PROMPTS = [
  "What is RAWIN?",
  "Who founded RAWIN?",
  "Tell me about Rushan's projects",
  "What technologies does Rushan use?",
  "Tell me about Rawin Horizon",
  "What is Rawin Orbit?",
  "Tell me about Strata Commerce",
];

const MAX_MESSAGE_CHARS = 4000;

interface AIAssistantViewProps {
  content: AIContent;
}

function RawinOrbitBrandText({ className = "", title }: { className?: string; title?: string }) {
  return (
    <span className={`text-[#A9C7D4] ${className}`}>
      {title || "RAWIN ORBIT"}
    </span>
  );
}

export default function AIAssistantView({ content }: AIAssistantViewProps) {
  const [messages, setMessages] = useState<OrbitMessage[]>([]);
  const [input, setInput] = useState("");
  const [orbitState, setOrbitState] = useState<OrbitState>("idle");
  const [streamingContent, setStreamingContent] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [, setIdentityToken] = useState<string | null>(null);
  const identityTokenRef = useRef<string | null>(null);

  const activePrompts =
    content?.suggestedPrompts && content.suggestedPrompts.length > 0
      ? content.suggestedPrompts
      : SUGGESTED_PROMPTS;

  const mobilePlaceholder =
    content?.mobileComposerPlaceholder || content?.inputPlaceholder || "Ask Orbit";
  const desktopPlaceholder =
    content?.desktopComposerPlaceholder || content?.inputPlaceholder || "Only Ask Orbit";

  const [activePlaceholder, setActivePlaceholder] = useState(desktopPlaceholder);

  useEffect(() => {
    const updatePlaceholder = () => {
      setActivePlaceholder(window.innerWidth < 1024 ? mobilePlaceholder : desktopPlaceholder);
    };
    updatePlaceholder();
    window.addEventListener("resize", updatePlaceholder, { passive: true });
    return () => window.removeEventListener("resize", updatePlaceholder);
  }, [mobilePlaceholder, desktopPlaceholder]);

  const endRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const containerRef = useRef<HTMLElement>(null);

  // Adaptive visual viewport and mobile keyboard positioning without layout shifts
  useEffect(() => {
    const mainEl = containerRef.current;
    if (!mainEl) return;

    // Lock document scroll on Orbit to prevent iOS WebKit from scrolling window behind the interface
    const prevHtmlOverflow = document.documentElement.style.overflow;
    const prevBodyOverflow = document.body.style.overflow;
    const prevHtmlOverscroll = document.documentElement.style.overscrollBehavior;
    const prevBodyOverscroll = document.body.style.overscrollBehavior;

    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    document.documentElement.style.overscrollBehavior = "none";
    document.body.style.overscrollBehavior = "none";

    let rafId: number | null = null;

    const updateViewportMetrics = () => {
      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        if (!mainEl) return;
        const isMobileOrTablet = window.innerWidth < 1024;
        if (!isMobileOrTablet) {
          mainEl.style.removeProperty("--orbit-viewport-height");
          mainEl.style.removeProperty("--orbit-composer-pb");
          return;
        }

        const vv = window.visualViewport;
        const currentHeight = vv ? Math.round(vv.height) : window.innerHeight;
        mainEl.style.setProperty("--orbit-viewport-height", `${currentHeight}px`);

        // Check if software keyboard is active (visual viewport notably smaller than innerHeight)
        const isKeyboardOpen = vv ? window.innerHeight - vv.height > 80 : false;
        if (isKeyboardOpen) {
          mainEl.style.setProperty("--orbit-composer-pb", "0.5rem");
        } else {
          mainEl.style.setProperty(
            "--orbit-composer-pb",
            "max(1.25rem, calc(env(safe-area-inset-bottom) + 0.75rem))"
          );
        }

        if (window.scrollY !== 0 || window.scrollX !== 0) {
          window.scrollTo(0, 0);
          document.body.scrollTop = 0;
        }
      });
    };

    updateViewportMetrics();

    const vv = window.visualViewport;
    if (vv) {
      vv.addEventListener("resize", updateViewportMetrics, { passive: true });
      vv.addEventListener("scroll", updateViewportMetrics, { passive: true });
    }
    window.addEventListener("resize", updateViewportMetrics, { passive: true });
    window.addEventListener("orientationchange", updateViewportMetrics, { passive: true });

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      if (vv) {
        vv.removeEventListener("resize", updateViewportMetrics);
        vv.removeEventListener("scroll", updateViewportMetrics);
      }
      window.removeEventListener("resize", updateViewportMetrics);
      window.removeEventListener("orientationchange", updateViewportMetrics);

      document.documentElement.style.overflow = prevHtmlOverflow;
      document.body.style.overflow = prevBodyOverflow;
      document.documentElement.style.overscrollBehavior = prevHtmlOverscroll;
      document.body.style.overscrollBehavior = prevBodyOverscroll;

      mainEl.style.removeProperty("--orbit-viewport-height");
      mainEl.style.removeProperty("--orbit-composer-pb");
    };
  }, []);

  // Auto-scroll behavior: smooth when messages change, throttled without smooth-scroll jank during SSE streaming
  const lastScrollTimeRef = useRef(0);
  useEffect(() => {
    if (messages.length === 0) return;
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (!streamingContent || !scrollContainerRef.current) return;
    const now = Date.now();
    if (now - lastScrollTimeRef.current > 100) {
      lastScrollTimeRef.current = now;
      const el = scrollContainerRef.current;
      const isNearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 200;
      if (isNearBottom) {
        el.scrollTop = el.scrollHeight;
      }
    }
  }, [streamingContent]);

  // Handle textarea dynamic auto-sizing
  const handleTextareaInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    const textarea = e.target;
    textarea.style.height = "auto";
    textarea.style.height = `${Math.min(textarea.scrollHeight, 130)}px`;
  };

  // Populate composer input when a suggested prompt is clicked/tapped
  const handlePromptSelect = (prompt: string) => {
    setInput(prompt);
    setErrorMessage(null);
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.focus();
    }
  };

  const handleSend = async (queryOverride?: string) => {
    const rawText = queryOverride || input;
    const textToSend = rawText.trim();
    if (!textToSend || orbitState === "generating" || orbitState === "streaming") {
      return;
    }

    if (textToSend.length > MAX_MESSAGE_CHARS) {
      setErrorMessage(
        "Your message exceeds the maximum limit of 4,000 characters. Please shorten your message."
      );
      setOrbitState("error");
      return;
    }

    setErrorMessage(null);
    setInput("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }

    const timestamp = new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

    const userMessage: OrbitMessage = {
      id: `usr-${Date.now()}`,
      role: "user",
      content: textToSend,
      timestamp,
    };

    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setOrbitState("user_sent");
    setStreamingContent("");

    // Transition to generating
    setTimeout(() => {
      setOrbitState("generating");
    }, 150);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    // Send the last 8 conversation turns to maintain context continuity
    const outboundHistory = nextMessages.slice(-8).map((m) => ({
      role: m.role,
      content: m.content,
    }));

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(identityTokenRef.current
            ? { "x-orbit-identity-token": identityTokenRef.current }
            : {}),
        },
        body: JSON.stringify({
          messages: outboundHistory,
          stream: true,
          identityToken: identityTokenRef.current,
        }),
        signal: controller.signal,
      });

      const nextToken = res.headers.get("x-orbit-identity-token");
      if (nextToken) {
        identityTokenRef.current = nextToken;
        setIdentityToken(nextToken);
      }

      if (!res.ok) {
        let errorText = "Something went wrong while communicating with Orbit.";
        try {
          const errData = await res.json();
          if (errData?.error) errorText = errData.error;
        } catch {
          // Fallback message
        }
        throw new Error(errorText);
      }

      const contentType = res.headers.get("content-type") || "";

      // Fallback for non-streaming response
      if (contentType.includes("application/json")) {
        const data = await res.json();
        const assistantReply = data.content || data.message || "";
        const assistantMessage: OrbitMessage = {
          id: `orbit-${Date.now()}`,
          role: "assistant",
          content: assistantReply,
          timestamp: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
        };
        setMessages((prev) => [...prev, assistantMessage]);
        setOrbitState("complete");
        setTimeout(() => setOrbitState("idle"), 1200);
        return;
      }

      // Stream handling via Reader
      const reader = res.body?.getReader();
      if (!reader) {
        throw new Error("Unable to establish response stream.");
      }

      setOrbitState("streaming");
      const decoder = new TextDecoder();
      let accumulated = "";
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const rawLine of lines) {
          const line = rawLine.trim();
          if (!line || !line.startsWith("data:")) continue;

          const dataPayload = line.slice(5).trim();
          if (!dataPayload) continue;

          try {
            const parsed = JSON.parse(dataPayload);
            if (parsed.text) {
              accumulated += parsed.text;
              setStreamingContent(accumulated);
            }
            if (parsed.done) {
              break;
            }
          } catch {
            // Malformed chunk ignored safely
          }
        }
      }

      if (accumulated.trim()) {
        const finalAssistantMessage: OrbitMessage = {
          id: `orbit-${Date.now()}`,
          role: "assistant",
          content: accumulated,
          timestamp: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
        };
        setMessages((prev) => [...prev, finalAssistantMessage]);
        setOrbitState("complete");
        setTimeout(() => setOrbitState("idle"), 1400);
      } else {
        setOrbitState("idle");
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "AbortError") {
        if (streamingContent.trim()) {
          setMessages((prev) => [
            ...prev,
            {
              id: `orbit-${Date.now()}`,
              role: "assistant",
              content: streamingContent,
              timestamp: new Date().toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              }),
            },
          ]);
        }
        setOrbitState("idle");
      } else {
        const msg =
          err instanceof Error ? err.message : "Something went wrong. Try again.";
        setErrorMessage(msg);
        setOrbitState("error");
      }
    } finally {
      setStreamingContent("");
      abortControllerRef.current = null;
    }
  };

  const handleStop = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setOrbitState("idle");
  };

  const handleReset = () => {
    if (orbitState === "generating" || orbitState === "streaming") {
      handleStop();
    }
    identityTokenRef.current = null;
    setIdentityToken(null);
    setMessages([]);
    setStreamingContent("");
    setErrorMessage(null);
    setInput("");
    setOrbitState("idle");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const isOrbitalActive =
    orbitState === "generating" || orbitState === "streaming";

  const orbVisualState: OrbitVisualState = isOrbitalActive
    ? "talking"
    : "listening";

  return (
    <main
      ref={containerRef}
      className="fixed inset-0 w-full h-[var(--orbit-viewport-height,100dvh)] max-h-[var(--orbit-viewport-height,100dvh)] flex flex-col bg-[#101019] text-foreground overflow-hidden select-text z-40"
      aria-label="Rawin Orbit AI Interface"
    >
      {/* 
        ========================================================================
        RAWIN ORBIT AMBIENT BACKGROUND
        Interactive Galaxy starfield WebGL canvas
        ========================================================================
      */}
      <OrbitGalaxyBackground />

      {/* 
        ========================================================================
        APPLICATION TOP BAR: VIEWPORT SPANNING
        DESKTOP (lg+):
          Left: Back to Home
          Center: RAWIN ORBIT Identity + State Indicator
          Right: New Session / Balance spacer
        MOBILE & TABLET (<lg):
          Left: Back to Home
          Right: Orbit icon + RAWIN ORBIT (+ New Session when active)
        ========================================================================
      */}
      <header className="w-full shrink-0 border-b border-white/[0.06] bg-ink-black/80 backdrop-blur-md z-30 px-3.5 sm:px-6 lg:px-12 py-2 sm:py-2.5 lg:py-3">
        <div className="w-full max-w-[1360px] mx-auto flex items-center justify-between gap-3 relative">
          {/* LEFT: Back to Home (Remains on LEFT for all viewports) */}
          <div className="flex items-center shrink-0">
            <Link
              href="/"
              className="group inline-flex items-center gap-1.5 sm:gap-2 text-xs font-mono text-muted hover:text-foreground transition-all cursor-pointer py-1 px-1.5 -ml-1.5 rounded-lg hover:bg-white/[0.04]"
              title="Return to RAWIN portfolio"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-pacific-cyan transition-transform group-hover:-translate-x-1 shrink-0" />
              <span className="tracking-wide">Back to Home</span>
            </Link>
          </div>

          {/* DESKTOP ONLY CENTER: RAWIN ORBIT Identity + State (Hidden on mobile & tablet) */}
          <div className="hidden lg:flex items-center gap-3">
            <RawinOrbitOrb variant="header" state={orbVisualState} />
            <div className="flex items-center gap-2.5">
              <RawinOrbitBrandText title={content?.title} className="font-space font-bold text-sm tracking-wider" />
              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-white/[0.04] border border-white/[0.06] text-[10px] font-mono text-muted">
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    orbitState === "error"
                      ? "bg-rose-400"
                      : isOrbitalActive
                      ? "bg-pacific-cyan animate-ping"
                      : "bg-emerald-400"
                  }`}
                />
                <span>
                  {orbitState === "error"
                    ? "ALERT"
                    : isOrbitalActive
                    ? "ACTIVE"
                    : "ONLINE"}
                </span>
              </div>
            </div>
          </div>

          {/* MOBILE & TABLET CENTER: Reset Chat Button (True horizontal center) */}
          {messages.length > 0 && (
            <div className="lg:hidden absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-auto">
              <button
                type="button"
                onClick={handleReset}
                className="p-1.5 rounded-lg text-muted hover:text-foreground bg-white/[0.03] border border-white/[0.08] hover:border-pacific-cyan/30 transition-all cursor-pointer flex items-center justify-center"
                title="Start a fresh conversation"
                aria-label="New Session"
              >
                <RotateCcw className="w-3 h-3 text-muted/80" />
              </button>
            </div>
          )}

          {/* 
            RIGHT SECTION:
            On Mobile & Tablet: Displays Orbit icon + RAWIN ORBIT identity on the RIGHT.
            On Desktop: Displays New Session button or balancing spacer.
          */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Mobile & Tablet Header Brand Identity (RIGHT-ALIGNED) */}
            <div className="flex lg:hidden items-center gap-2">
              <RawinOrbitOrb variant="header" state={orbVisualState} />
              <RawinOrbitBrandText title={content?.title} className="font-space font-bold text-xs tracking-wider" />
            </div>

            {/* Desktop New Session button */}
            <div className="hidden lg:block">
              {messages.length > 0 ? (
                <button
                  type="button"
                  onClick={handleReset}
                  className="group inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono text-muted hover:text-foreground bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.08] hover:border-pacific-cyan/30 transition-all cursor-pointer"
                  title="Start a fresh conversation"
                >
                  <RotateCcw className="w-3 h-3 text-muted/70 group-hover:rotate-[-45deg] transition-transform" />
                  <span>New Session</span>
                </button>
              ) : (
                <div className="w-20" aria-hidden="true" />
              )}
            </div>
          </div>
        </div>
      </header>

      {messages.length === 0 ? (
        /* 
          ========================================================================
          STATE A: INITIAL EMPTY / LANDING STATE
          Compact, application-like layout: ORB > TITLE > DESCRIPTION > PROMPTS.
          Substantially reduced on mobile/tablet to let the Galaxy & interface breathe.
          ========================================================================
        */
        <div className="flex-1 min-h-0 w-full flex flex-col justify-center items-center overflow-hidden px-3.5 sm:px-6 lg:px-12 pt-2 sm:pt-3 lg:pt-4 pb-3 sm:pb-4 lg:pb-16 relative z-10 select-text">
          <div className="w-full max-w-md sm:max-w-lg lg:max-w-2xl mx-auto flex flex-col items-center justify-center text-center my-auto">
            {/* Central Hero Orb */}
            <div
              className="mb-1.5 sm:mb-2 lg:mb-3 shrink-0 flex items-center justify-center pointer-events-none select-none"
              aria-hidden="true"
            >
              <RawinOrbitOrb variant="hero" state={orbVisualState} />
            </div>

            {/* RAWIN ORBIT Title - Ice Blue monochrome identity */}
            <h1 className="text-base sm:text-lg lg:text-3xl font-bold font-space tracking-wide lg:tracking-tight mb-1 lg:mb-1.5 flex items-center justify-center">
              <RawinOrbitBrandText title={content?.title} />
            </h1>

            {/* Introduction Subtitle - Concise 1-2 lines on phone */}
            <p className="text-[11px] sm:text-xs lg:text-sm text-muted/75 lg:text-muted/80 mb-2.5 sm:mb-3.5 lg:mb-5 leading-relaxed max-w-xs sm:max-w-sm lg:max-w-md px-2">
              {content?.greetingMessage || "I'm Rawin Orbit, the AI assistant built by Rushan Siddiqui for RAWIN."}
            </p>

            {/* Suggested Prompts Section - Compact AI-style 2-column grid, narrowed on smartphone */}
            <div className="w-full max-w-[295px] sm:max-w-lg lg:max-w-2xl mx-auto flex flex-col gap-1 sm:gap-1.5 lg:gap-2">
              <span className="text-[9px] sm:text-[10px] lg:text-[11px] font-mono uppercase tracking-wider text-muted/50 text-left px-1">
                {content?.suggestedPromptsLabel || "Suggested Prompts"}
              </span>
              <div className="grid grid-cols-2 gap-1.5 sm:gap-2 lg:gap-2.5 w-full text-left">
                {activePrompts.map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    onClick={() => handlePromptSelect(prompt)}
                    className="min-w-0 px-2.5 py-1.5 sm:px-3 sm:py-2 lg:px-3.5 lg:py-2.5 rounded-lg lg:rounded-xl bg-ink-black/50 hover:bg-white/[0.06] border border-white/[0.08] hover:border-pacific-cyan/40 text-[10px] sm:text-[11px] lg:text-xs font-mono text-muted/90 hover:text-foreground transition-all text-left flex items-center justify-between group cursor-pointer min-h-[32px] sm:min-h-[36px] lg:min-h-[40px]"
                  >
                    <span className="truncate mr-1">{prompt}</span>
                    <ArrowRight className="w-2.5 h-2.5 sm:w-3 sm:h-3 lg:w-3.5 lg:h-3.5 text-muted/40 group-hover:text-pacific-cyan transition-colors shrink-0" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* 
          ========================================================================
          STATE B: ACTIVE CONVERSATION
          Scrollable conversation canvas allowing messages to accumulate and scroll naturally.
          ========================================================================
        */
        <div
          ref={scrollContainerRef}
          data-lenis-prevent
          className="flex-1 min-h-0 w-full overflow-y-auto px-3.5 sm:px-6 lg:px-12 py-2 sm:py-3 lg:py-6 flex flex-col scroll-smooth relative z-10"
        >
          <div className="w-full max-w-[1360px] mx-auto flex-1 flex flex-col">
            {/* Subtle top visual anchor at the beginning of the conversation thread */}
            <div
              className="w-full flex justify-center items-center shrink-0 pt-0.5 pb-2 sm:pb-3 lg:pb-4 pointer-events-none select-none"
              aria-hidden="true"
            >
              <RawinOrbitOrb variant="hero" state={orbVisualState} />
            </div>

            <div className="w-full flex flex-col gap-3 sm:gap-4 lg:gap-6 pb-2 sm:pb-4">
              {messages.map((m) => {
                const isUser = m.role === "user";

                if (isUser) {
                  // ================= USER MESSAGE: STRICT RIGHT ALIGNMENT =================
                  return (
                    <div
                      key={m.id}
                      className="w-full flex justify-end items-end"
                    >
                      <div className="flex flex-col items-end gap-1 sm:gap-1.5 max-w-[85%] sm:max-w-[72%] lg:max-w-[55%]">
                        <div className="flex items-center gap-1.5 text-[9px] sm:text-[10px] font-mono text-muted/50 pr-1">
                          <span>USER</span>
                          {m.timestamp && <span>{m.timestamp}</span>}
                        </div>

                        <div className="px-3 py-2 sm:px-3.5 sm:py-2.5 lg:px-4 lg:py-3 rounded-xl lg:rounded-2xl rounded-tr-xs bg-pacific-cyan/15 border border-pacific-cyan/30 text-foreground text-xs sm:text-[13px] lg:text-sm leading-relaxed break-words shadow-sm text-left">
                          <p className="whitespace-pre-wrap">{m.content}</p>
                        </div>
                      </div>
                    </div>
                  );
                }

                // ================= ORBIT MESSAGE: STRICT LEFT ALIGNMENT =================
                return (
                  <div
                    key={m.id}
                    className="w-full flex justify-start items-start"
                  >
                    <div className="flex items-start gap-2 sm:gap-3 lg:gap-4 max-w-[95%] sm:max-w-[88%] lg:max-w-[78%]">
                      {/* Left Badge: Small Orbit Core */}
                      <div className="w-5 h-5 sm:w-6 sm:h-6 lg:w-7 lg:h-7 rounded-md sm:rounded-lg lg:rounded-xl flex items-center justify-center shrink-0 mt-0.5 bg-surface border border-white/[0.1] shadow-sm overflow-hidden">
                        <RawinOrbitOrb variant="message" state={orbVisualState} />
                      </div>

                      <div className="flex flex-col gap-0.5 sm:gap-1 min-w-0 flex-1 text-left">
                        <div className="flex items-center gap-1.5 text-[9px] sm:text-[10px] font-mono text-pacific-cyan">
                          <span>ORBIT</span>
                          {m.timestamp && (
                            <span className="text-muted/50">{m.timestamp}</span>
                          )}
                        </div>

                        <div className="glass-card px-2.5 py-2 sm:px-3.5 sm:py-2.5 lg:px-4 lg:py-3 rounded-xl lg:rounded-2xl rounded-tl-xs text-[11px] sm:text-xs lg:text-[13px] leading-normal sm:leading-relaxed text-foreground/90 border border-white/[0.08] break-words">
                          <MarkdownRenderer content={m.content} compact />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* In-Flight Streaming Message (LEFT ALIGNED) */}
              {isOrbitalActive && streamingContent && (
                <div className="w-full flex justify-start items-start">
                  <div className="flex items-start gap-2 sm:gap-3 lg:gap-4 max-w-[95%] sm:max-w-[88%] lg:max-w-[78%]">
                    <div className="w-5 h-5 sm:w-6 sm:h-6 lg:w-7 lg:h-7 rounded-md sm:rounded-lg lg:rounded-xl flex items-center justify-center shrink-0 mt-0.5 bg-surface border border-white/[0.1] shadow-sm overflow-hidden">
                      <RawinOrbitOrb variant="message" state={orbVisualState} />
                    </div>

                    <div className="flex flex-col gap-0.5 sm:gap-1 min-w-0 flex-1 text-left">
                      <div className="flex items-center gap-1.5 text-[9px] sm:text-[10px] font-mono text-pacific-cyan">
                        <span>ORBIT</span>
                        <span className="animate-pulse">STREAMING</span>
                      </div>

                      <div className="glass-card px-2.5 py-2 sm:px-3.5 sm:py-2.5 lg:px-4 lg:py-3 rounded-xl lg:rounded-2xl rounded-tl-xs text-[11px] sm:text-xs lg:text-[13px] leading-normal sm:leading-relaxed text-foreground/90 border border-white/[0.08] break-words">
                        <MarkdownRenderer content={streamingContent} compact />
                        <span className="inline-block w-1.5 h-3.5 sm:h-4 bg-pacific-cyan ml-1 animate-pulse align-middle" />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Waiting For First Token (LEFT ALIGNED) */}
              {orbitState === "generating" && !streamingContent && (
                <div className="w-full flex justify-start items-center">
                  <div className="flex items-center gap-2 sm:gap-2.5 max-w-[90%]">
                    <div className="w-5 h-5 sm:w-6 sm:h-6 lg:w-7 lg:h-7 rounded-md sm:rounded-lg lg:rounded-xl flex items-center justify-center shrink-0 bg-surface border border-white/[0.1] shadow-sm overflow-hidden">
                      <RawinOrbitOrb variant="message" state={orbVisualState} />
                    </div>
                    <div className="glass-card px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-lg lg:rounded-xl border border-white/[0.08] flex items-center gap-1.5 text-[10px] sm:text-xs font-mono text-muted">
                      <span>Orbit is reasoning...</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div ref={endRef} />
          </div>
        </div>
      )}

      {/* 
        ========================================================================
        FLOATING PILL COMPOSER & ACTION FOOTER
        Sleek pill-shaped AI composer with circular cyan action button.
        Mobile/Tablet: "Ask Orbit"
        Desktop: "Only Ask Orbit"
        ========================================================================
      */}
      <div className="w-full shrink-0 px-5 sm:px-8 lg:px-8 pt-1 sm:pt-1.5 lg:pt-2 pb-[var(--orbit-composer-pb,max(1.25rem,calc(env(safe-area-inset-bottom)+0.75rem)))] sm:!pb-6 lg:!pb-12 z-20">
        <div className="w-full max-w-[340px] sm:max-w-lg lg:max-w-3xl mx-auto flex flex-col gap-1.5 sm:gap-2">
          {/* Character warning if near limit */}
          {input.length > 2500 && (
            <div className="text-[10px] font-mono text-right pr-3">
              <span className={input.length >= MAX_MESSAGE_CHARS ? "text-rose-400 font-semibold" : "text-pacific-cyan/80"}>
                {input.length} / {MAX_MESSAGE_CHARS}
              </span>
            </div>
          )}

          {/* Error Banner */}
          {errorMessage && (
            <div className="p-2 sm:p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/25 backdrop-blur-md flex items-start justify-between gap-2.5 text-rose-300 text-xs font-mono shadow-md">
              <div className="flex items-start gap-2 min-w-0">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
                <span className="leading-relaxed break-words">{errorMessage}</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setErrorMessage(null);
                  setOrbitState("idle");
                }}
                className="underline shrink-0 hover:text-foreground cursor-pointer text-[10px] sm:text-[11px] pt-0.5"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* Floating Pill Composer Form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className={`relative w-full rounded-full transition-all duration-300 flex items-center bg-[#141422]/75 hover:bg-[#141422]/85 focus-within:bg-[#141422]/90 border border-white/[0.12] focus-within:border-pacific-cyan/50 backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.5)] pl-4 sm:pl-5 lg:pl-6 pr-1.5 sm:pr-2 lg:pr-2.5 py-1.5 sm:py-1.5 lg:py-2 min-h-[44px] sm:min-h-[48px] lg:min-h-[50px] ${
              isOrbitalActive
                ? "border-pacific-cyan/40 shadow-[0_8px_32px_rgba(0,0,0,0.6),0_0_20px_rgba(24,155,173,0.18)]"
                : ""
            }`}
          >
            {/* Soft top highlight */}
            <div
              className="absolute -top-px left-8 right-8 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-60 pointer-events-none"
              aria-hidden="true"
            />

            <textarea
              ref={textareaRef}
              rows={1}
              value={input}
              maxLength={MAX_MESSAGE_CHARS}
              onChange={handleTextareaInput}
              onKeyDown={handleKeyDown}
              onFocus={() => {
                if (typeof window !== "undefined") {
                  window.scrollTo(0, 0);
                  document.body.scrollTop = 0;
                }
                if (window.innerWidth < 1024 && containerRef.current) {
                  containerRef.current.style.setProperty("--orbit-composer-pb", "0.5rem");
                }
              }}
              onBlur={() => {
                setTimeout(() => {
                  if (typeof window !== "undefined") {
                    window.scrollTo(0, 0);
                    document.body.scrollTop = 0;
                  }
                  const vv = window.visualViewport;
                  const isStillOpen = vv ? window.innerHeight - vv.height > 80 : false;
                  if (!isStillOpen && containerRef.current) {
                    containerRef.current.style.setProperty(
                      "--orbit-composer-pb",
                      "max(1.25rem, calc(env(safe-area-inset-bottom) + 0.75rem))"
                    );
                  }
                }, 100);
              }}
              placeholder={activePlaceholder}
              className="flex-1 bg-transparent text-[16px] sm:text-sm lg:text-[15px] text-foreground placeholder:text-muted/45 focus:outline-none resize-none leading-normal py-1 sm:py-1.5 font-sans block border-0 shadow-none ring-0 focus:ring-0 overflow-y-auto max-h-[110px] sm:max-h-[130px] my-auto"
            />

            <div className="shrink-0 flex items-center pl-1.5">
              {isOrbitalActive ? (
                <button
                  type="button"
                  onClick={handleStop}
                  aria-label="Stop generating response"
                  className="w-7 h-7 sm:w-8 sm:h-8 lg:w-9 lg:h-9 rounded-full bg-white/[0.1] hover:bg-white/[0.18] text-foreground border border-white/[0.15] flex items-center justify-center shrink-0 cursor-pointer shadow-sm transition-all"
                  title="Stop generating"
                >
                  <Square className="w-2.5 h-2.5 sm:w-3 sm:h-3 fill-current text-rose-400 shrink-0" />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={!input.trim()}
                  onClick={(e) => {
                    e.preventDefault();
                    handleSend();
                  }}
                  aria-label="Send message to Orbit"
                  className={`w-7 h-7 sm:w-8 sm:h-8 lg:w-9 lg:h-9 rounded-full flex items-center justify-center shrink-0 transition-all cursor-pointer ${
                    input.trim()
                      ? "bg-pacific-cyan text-ink-black shadow-[0_0_14px_rgba(24,155,173,0.45)] hover:bg-pacific-cyan/90 hover:scale-105 active:scale-95"
                      : "bg-pacific-cyan/40 text-ink-black/60 cursor-not-allowed"
                  }`}
                >
                  <ArrowUpRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 lg:w-4.5 lg:h-4.5 stroke-[2.5] shrink-0" />
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}
