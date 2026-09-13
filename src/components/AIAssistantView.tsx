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
} from "lucide-react";
import MarkdownRenderer from "@/components/MarkdownRenderer";
import GridScanOrbitBackground from "@/components/GridScanOrbitBackground";
import OrbitCore, { OrbitCoreState } from "@/components/OrbitCore";
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

export default function AIAssistantView({ content }: AIAssistantViewProps) {
  const [messages, setMessages] = useState<OrbitMessage[]>([]);
  const [input, setInput] = useState("");
  const [orbitState, setOrbitState] = useState<OrbitCoreState>("idle");
  const [streamingContent, setStreamingContent] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const endRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll when new content arrives
  const scrollToBottom = useCallback((behavior: ScrollBehavior = "smooth") => {
    endRef.current?.scrollIntoView({ behavior });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingContent, scrollToBottom]);

  // Handle textarea dynamic auto-sizing
  const handleTextareaInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    const textarea = e.target;
    textarea.style.height = "auto";
    textarea.style.height = `${Math.min(textarea.scrollHeight, 160)}px`;
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
        },
        body: JSON.stringify({
          messages: outboundHistory,
          stream: true,
        }),
        signal: controller.signal,
      });

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

  return (
    <main
      className="relative w-full h-dvh max-h-dvh flex flex-col bg-transparent text-foreground overflow-hidden select-text"
      aria-label="Rawin Orbit AI Interface"
    >
      {/* 
        ========================================================================
        REACT BITS GRIDSCAN AMBIENT BACKGROUND
        Official React Bits GridScan WebGL 3D perspective gridroom
        ========================================================================
      */}
      <GridScanOrbitBackground />

      {/* 
        ========================================================================
        APPLICATION TOP BAR: VIEWPORT SPANNING
        DESKTOP (md+):
          Left: Back to Home
          Center: RAWIN ORBIT Identity + State Indicator
          Right: New Session / Balance spacer
        MOBILE (<md):
          Strict Requirement:
          Left: ← Back to Home
          Right: Orbit icon + RAWIN ORBIT (+ New Session when active)
        ========================================================================
      */}
      <header className="w-full shrink-0 border-b border-white/[0.06] bg-ink-black/80 backdrop-blur-md z-30 px-3.5 sm:px-8 lg:px-12 py-2.5 sm:py-3">
        <div className="w-full max-w-[1360px] mx-auto flex items-center justify-between gap-3">
          {/* LEFT: Back to Home (Remains on LEFT for both mobile and desktop) */}
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

          {/* DESKTOP ONLY CENTER: RAWIN ORBIT Identity + State (Hidden on mobile) */}
          <div className="hidden md:flex items-center gap-3">
            <OrbitCore state={orbitState} size="sm" />
            <div className="flex items-center gap-2.5">
              <span className="font-space font-bold text-sm tracking-wider text-foreground">
                RAWIN ORBIT
              </span>
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

          {/* 
            RIGHT SECTION:
            On Mobile: Displays Orbit icon + RAWIN ORBIT identity on the RIGHT (plus compact Reset if active).
            On Desktop: Displays New Session button or balancing spacer.
          */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Mobile Header Brand Identity: Orbit icon + RAWIN ORBIT (RIGHT-ALIGNED) */}
            <div className="flex md:hidden items-center gap-2">
              {messages.length > 0 && (
                <button
                  type="button"
                  onClick={handleReset}
                  className="p-1.5 rounded-lg text-muted hover:text-foreground bg-white/[0.03] border border-white/[0.08] hover:border-pacific-cyan/30 transition-all cursor-pointer mr-1"
                  title="Start a fresh conversation"
                  aria-label="New Session"
                >
                  <RotateCcw className="w-3 h-3 text-muted/80" />
                </button>
              )}
              <OrbitCore state={orbitState} size="sm" />
              <span className="font-space font-bold text-xs tracking-wider text-foreground">
                RAWIN ORBIT
              </span>
            </div>

            {/* Desktop New Session button */}
            <div className="hidden md:block">
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

      {/* 
        ========================================================================
        MAIN CONVERSATION CANVAS
        Spacious desktop width: up to 1360px
        Strict Left Alignment for ORBIT responses
        Strict Right Alignment for USER messages
        ========================================================================
      */}
      <div
        ref={scrollContainerRef}
        data-lenis-prevent
        className="flex-1 min-h-0 w-full overflow-y-auto px-3.5 sm:px-8 lg:px-12 py-5 sm:py-8 flex flex-col scroll-smooth relative z-10"
      >
        <div className="w-full max-w-[1360px] mx-auto flex-1 flex flex-col">
          {messages.length === 0 ? (
            /* 
              ------------------------------------------------------------------
              REFINED ORBIT EMPTY STATE
              Atmospheric Orbit Core + Clean typography + Curated prompts
              NOTE: Main centered RAWIN ORBIT identity is completely untouched!
              ------------------------------------------------------------------
            */
            <div className="flex flex-col items-center justify-center text-center my-auto py-6 sm:py-16 px-2 sm:px-4 max-w-2xl mx-auto w-full">
              <div className="mb-6">
                <OrbitCore state={orbitState} size="lg" />
              </div>

              <h1 className="text-2xl sm:text-4xl font-bold font-space text-foreground tracking-tight mb-2">
                RAWIN ORBIT
              </h1>

              <p className="text-sm sm:text-base text-muted mb-6 sm:mb-10 leading-relaxed max-w-lg">
                Ask about Rushan, RAWIN, projects, experience, or writing.
              </p>

              <div className="w-full flex flex-col gap-2.5">
                <span className="text-[11px] font-mono text-muted/60 text-left px-1">
                  Suggested Prompts
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-2.5 w-full text-left">
                  {SUGGESTED_PROMPTS.map((prompt) => (
                    <button
                      key={prompt}
                      type="button"
                      onClick={() => handlePromptSelect(prompt)}
                      className="p-3 sm:p-3.5 rounded-xl glass-card text-xs font-mono text-muted hover:text-foreground hover:border-pacific-cyan/40 transition-all text-left flex items-center justify-between group cursor-pointer"
                    >
                      <span className="truncate mr-2">{prompt}</span>
                      <ArrowRight className="w-3.5 h-3.5 text-muted/40 group-hover:text-pacific-cyan transition-colors shrink-0" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            /* 
              ------------------------------------------------------------------
              ACTIVE CONVERSATION THREAD
              STRICT MANDATORY ALIGNMENT:
              Orbit -> LEFT ALIGNED
              User  -> RIGHT ALIGNED
              ------------------------------------------------------------------
            */
            <div className="w-full flex flex-col gap-5 sm:gap-8 pb-4">
              {messages.map((m) => {
                const isUser = m.role === "user";

                if (isUser) {
                  // ================= USER MESSAGE: STRICT RIGHT ALIGNMENT =================
                  return (
                    <div
                      key={m.id}
                      className="w-full flex justify-end items-end"
                    >
                      <div className="flex flex-col items-end gap-1.5 max-w-[88%] sm:max-w-[70%] lg:max-w-[55%]">
                        <div className="flex items-center gap-2 text-[10px] font-mono text-muted/60 pr-1">
                          <span>USER</span>
                          {m.timestamp && <span>{m.timestamp}</span>}
                        </div>

                        <div className="p-3.5 sm:p-4.5 rounded-2xl rounded-tr-sm bg-pacific-cyan/15 border border-pacific-cyan/30 text-foreground text-sm leading-relaxed break-words shadow-sm text-left">
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
                    <div className="flex items-start gap-2.5 sm:gap-4 max-w-[96%] sm:max-w-[85%] lg:max-w-[78%]">
                      {/* Left Badge: Small Orbit Core */}
                      <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 sm:mt-1 bg-surface border border-white/[0.1] shadow-sm">
                        <OrbitCore state="idle" size="sm" />
                      </div>

                      <div className="flex flex-col gap-1.5 min-w-0 flex-1 text-left">
                        <div className="flex items-center gap-2 text-[10px] font-mono text-pacific-cyan">
                          <span>ORBIT</span>
                          {m.timestamp && (
                            <span className="text-muted/60">{m.timestamp}</span>
                          )}
                        </div>

                        <div className="glass-card p-3.5 sm:p-5 rounded-2xl rounded-tl-sm text-sm sm:text-base leading-relaxed text-foreground/90 border border-white/[0.08] break-words">
                          <MarkdownRenderer content={m.content} />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* In-Flight Streaming Message (LEFT ALIGNED) */}
              {isOrbitalActive && streamingContent && (
                <div className="w-full flex justify-start items-start">
                  <div className="flex items-start gap-2.5 sm:gap-4 max-w-[96%] sm:max-w-[85%] lg:max-w-[78%]">
                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 sm:mt-1 bg-surface border border-white/[0.1] shadow-sm">
                      <OrbitCore state="streaming" size="sm" />
                    </div>

                    <div className="flex flex-col gap-1.5 min-w-0 flex-1 text-left">
                      <div className="flex items-center gap-2 text-[10px] font-mono text-pacific-cyan">
                        <span>ORBIT</span>
                        <span className="animate-pulse">STREAMING</span>
                      </div>

                      <div className="glass-card p-3.5 sm:p-5 rounded-2xl rounded-tl-sm text-sm sm:text-base leading-relaxed text-foreground/90 border border-white/[0.08] break-words">
                        <MarkdownRenderer content={streamingContent} />
                        <span className="inline-block w-1.5 h-4 bg-pacific-cyan ml-1 animate-pulse align-middle" />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Waiting For First Token (LEFT ALIGNED) */}
              {orbitState === "generating" && !streamingContent && (
                <div className="w-full flex justify-start items-center">
                  <div className="flex items-center gap-3 max-w-[90%]">
                    <OrbitCore state="generating" size="sm" />
                    <div className="glass-card px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-xl border border-white/[0.08] flex items-center gap-2 text-xs font-mono text-muted">
                      <span>Orbit is reasoning...</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          <div ref={endRef} />
        </div>
      </div>

      {/* 
        ========================================================================
        FLOATING GLASS COMPOSER & ACTION FOOTER
        Translucent dark glass surface elevated above background atmosphere.
        Features soft multi-layer shadow, subtle border, inner highlight,
        and atmospheric connection without clipping or blocking interaction.
        ========================================================================
      */}
      <div className="w-full shrink-0 px-3 sm:px-8 lg:px-12 pt-2 pb-3.5 sm:pb-6 z-20 pb-[max(0.85rem,env(safe-area-inset-bottom))]">
        <div className="w-full max-w-[1360px] mx-auto flex flex-col gap-2">
          {/* Error Banner */}
          {errorMessage && (
            <div className="p-2.5 sm:p-3 rounded-2xl bg-rose-500/10 border border-rose-500/25 backdrop-blur-md flex items-start justify-between gap-3 text-rose-300 text-xs font-mono shadow-lg">
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
                className="underline shrink-0 hover:text-foreground cursor-pointer text-[11px] pt-0.5"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* Floating Glass Surface Panel */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className={`relative rounded-2xl sm:rounded-3xl p-2 sm:p-3.5 transition-all duration-500 flex flex-col gap-1.5 sm:gap-2 backdrop-blur-2xl ${
              isOrbitalActive
                ? "bg-[#141422]/65 border border-pacific-cyan/40 shadow-[0_12px_40px_rgba(0,0,0,0.6),0_0_24px_rgba(24,155,173,0.18)]"
                : "bg-[#141422]/60 hover:bg-[#141422]/70 border border-white/[0.09] focus-within:border-pacific-cyan/45 focus-within:bg-[#141422]/75 shadow-[0_12px_36px_rgba(0,0,0,0.55),0_1px_0_rgba(255,255,255,0.06)_inset]"
            }`}
          >
            {/* Very soft ambient atmospheric reflection line at the top of the glass */}
            <div
              className={`absolute -top-px left-8 right-8 h-px transition-opacity duration-500 ${
                isOrbitalActive
                  ? "bg-gradient-to-r from-transparent via-pacific-cyan/50 to-transparent opacity-100"
                  : "bg-gradient-to-r from-transparent via-white/15 to-transparent opacity-60"
              }`}
              aria-hidden="true"
            />

            <textarea
              ref={textareaRef}
              rows={2}
              value={input}
              maxLength={MAX_MESSAGE_CHARS}
              onChange={handleTextareaInput}
              onKeyDown={handleKeyDown}
              placeholder="Ask anything about Rushan's work, experience, or skills..."
              className="w-full bg-transparent px-2.5 py-1 text-sm sm:text-base text-foreground placeholder:text-muted/45 focus:outline-none resize-none min-h-[52px] max-h-[160px] font-sans leading-relaxed block border-0 shadow-none ring-0 focus:ring-0 overflow-y-auto"
            />

            <div className="flex items-center justify-between px-1.5 sm:px-2 pt-1 border-t border-white/[0.06]">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-[11px] font-mono text-muted/50 hidden sm:inline truncate">
                  Return to send, Shift + Return for new line
                </span>
                {input.length > 2500 && (
                  <span
                    className={`text-[10px] font-mono shrink-0 ${
                      input.length >= MAX_MESSAGE_CHARS
                        ? "text-rose-400 font-semibold"
                        : "text-pacific-cyan/80"
                    }`}
                  >
                    {input.length} / {MAX_MESSAGE_CHARS}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 ml-auto shrink-0">
                {isOrbitalActive ? (
                  <button
                    type="button"
                    onClick={handleStop}
                    className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-xl bg-white/[0.08] hover:bg-white/[0.14] text-xs font-mono text-foreground border border-white/[0.12] transition-all cursor-pointer shadow-sm"
                    title="Stop generating"
                  >
                    <Square className="w-3 h-3 fill-current text-rose-400 shrink-0" />
                    <span>Stop</span>
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
                    className="flex items-center justify-center h-9 px-4 rounded-xl bg-pacific-cyan text-ink-black hover:bg-pacific-cyan/90 transition-all shadow-[0_0_16px_rgba(24,155,173,0.35)] disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer text-xs font-mono font-semibold gap-1.5 shrink-0 active:scale-95"
                  >
                    <span>Send</span>
                    <Send className="w-3 h-3 shrink-0" />
                  </button>
                )}
              </div>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}
