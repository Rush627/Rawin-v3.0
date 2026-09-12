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
    textarea.style.height = `${Math.min(textarea.scrollHeight, 140)}px`;
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
      className="relative w-full h-dvh max-h-dvh flex flex-col bg-ink-black text-foreground overflow-hidden select-text"
      aria-label="Rawin Orbit AI Interface"
    >
      {/* 
        ========================================================================
        ATMOSPHERIC ORBITAL BACKGROUND
        Subtly responsive to AI states (idle, active, generating, error)
        ========================================================================
      */}
      <div
        className="absolute inset-0 pointer-events-none overflow-hidden -z-10 select-none transition-opacity duration-1000"
        aria-hidden="true"
      >
        {/* Soft Radial Ambient Glow */}
        <div
          className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] md:w-[1100px] md:h-[1100px] rounded-full blur-3xl transition-all duration-1000 ${
            orbitState === "error"
              ? "bg-rose-500/[0.05]"
              : isOrbitalActive
              ? "bg-pacific-cyan/[0.08] scale-105"
              : "bg-pacific-cyan/[0.035] scale-100"
          }`}
        />

        {/* Outer Atmospheric Orbital Ring */}
        <div
          className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[680px] h-[680px] md:w-[1020px] md:h-[1020px] rounded-full border transition-all duration-1000 ${
            isOrbitalActive
              ? "border-pacific-cyan/[0.08] scale-102"
              : "border-pacific-cyan/[0.035]"
          }`}
        />

        {/* Intermediate Orbital Ring */}
        <div
          className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[460px] h-[460px] md:w-[720px] md:h-[720px] rounded-full border transition-all duration-1000 ${
            isOrbitalActive
              ? "border-pacific-cyan/[0.12]"
              : "border-pacific-cyan/[0.05]"
          }`}
        />

        {/* Inner Atmospheric Orbital Ring */}
        <div
          className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[280px] h-[280px] md:w-[440px] md:h-[440px] rounded-full border transition-all duration-1000 ${
            isOrbitalActive
              ? "border-pacific-cyan/[0.16]"
              : "border-pacific-cyan/[0.07]"
          }`}
        />
      </div>

      {/* 
        ========================================================================
        APPLICATION TOP BAR: VIEWPORT SPANNING
        Top-Left: Back to Home
        Center: RAWIN ORBIT ONLINE
        Top-Right: New Session
        ========================================================================
      */}
      <header className="w-full shrink-0 border-b border-white/[0.06] bg-ink-black/85 backdrop-blur-md z-30 px-4 sm:px-8 lg:px-12 py-3">
        <div className="w-full max-w-[1360px] mx-auto flex items-center justify-between gap-4">
          {/* Top-Left: Minimal, elegant Back to Home */}
          <Link
            href="/"
            className="group inline-flex items-center gap-2 text-xs font-mono text-muted hover:text-foreground transition-all cursor-pointer py-1 px-1.5 -ml-1.5 rounded-lg hover:bg-white/[0.04]"
            title="Return to RAWIN portfolio"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-pacific-cyan transition-transform group-hover:-translate-x-1" />
            <span className="tracking-wide">Back to Home</span>
          </Link>

          {/* Center: RAWIN ORBIT Identity + Real-time State */}
          <div className="flex items-center gap-3">
            <OrbitCore state={orbitState} size="sm" />
            <div className="flex items-center gap-2.5">
              <span className="font-space font-bold text-xs sm:text-sm tracking-wider text-foreground">
                RAWIN ORBIT
              </span>
              <div className="hidden xs:flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-white/[0.04] border border-white/[0.06] text-[10px] font-mono text-muted">
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

          {/* Top-Right: Understated New Session */}
          <div>
            {messages.length > 0 ? (
              <button
                type="button"
                onClick={handleReset}
                className="group inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono text-muted hover:text-foreground bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.08] hover:border-pacific-cyan/30 transition-all cursor-pointer"
                title="Start a fresh conversation"
              >
                <RotateCcw className="w-3 h-3 text-muted/70 group-hover:rotate-[-45deg] transition-transform" />
                <span className="hidden sm:inline">New Session</span>
              </button>
            ) : (
              <div className="w-16 sm:w-24" aria-hidden="true" />
            )}
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
        className="flex-1 min-h-0 w-full overflow-y-auto px-4 sm:px-8 lg:px-12 py-6 sm:py-8 flex flex-col scroll-smooth"
      >
        <div className="w-full max-w-[1360px] mx-auto flex-1 flex flex-col">
          {messages.length === 0 ? (
            /* 
              ------------------------------------------------------------------
              REFINED ORBIT EMPTY STATE
              Atmospheric Orbit Core + Clean typography + Curated prompts
              ------------------------------------------------------------------
            */
            <div className="flex flex-col items-center justify-center text-center my-auto py-8 sm:py-16 px-4 max-w-2xl mx-auto w-full">
              <div className="mb-6">
                <OrbitCore state={orbitState} size="lg" />
              </div>

              <h1 className="text-2xl sm:text-4xl font-bold font-space text-foreground tracking-tight mb-2">
                RAWIN ORBIT
              </h1>

              <p className="text-sm sm:text-base text-muted mb-8 sm:mb-10 leading-relaxed max-w-lg">
                Ask about Rushan, RAWIN, projects, experience, or writing.
              </p>

              <div className="w-full flex flex-col gap-2.5">
                <span className="text-[11px] font-mono text-muted/60 text-left px-1">
                  Suggested Prompts
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full text-left">
                  {SUGGESTED_PROMPTS.map((prompt) => (
                    <button
                      key={prompt}
                      type="button"
                      onClick={() => handleSend(prompt)}
                      className="p-3.5 rounded-xl glass-card text-xs font-mono text-muted hover:text-foreground hover:border-pacific-cyan/40 transition-all text-left flex items-center justify-between group cursor-pointer"
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
            <div className="w-full flex flex-col gap-6 sm:gap-8 pb-4">
              {messages.map((m) => {
                const isUser = m.role === "user";

                if (isUser) {
                  // ================= USER MESSAGE: STRICT RIGHT ALIGNMENT =================
                  return (
                    <div
                      key={m.id}
                      className="w-full flex justify-end items-end"
                    >
                      <div className="flex flex-col items-end gap-1.5 max-w-[85%] sm:max-w-[70%] lg:max-w-[55%]">
                        <div className="flex items-center gap-2 text-[10px] font-mono text-muted/60 pr-1">
                          <span>USER</span>
                          {m.timestamp && <span>{m.timestamp}</span>}
                        </div>

                        <div className="p-4 sm:p-4.5 rounded-2xl rounded-tr-sm bg-pacific-cyan/15 border border-pacific-cyan/30 text-foreground text-sm leading-relaxed break-words shadow-sm text-left">
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
                    <div className="flex items-start gap-3 sm:gap-4 max-w-[94%] sm:max-w-[85%] lg:max-w-[78%]">
                      {/* Left Badge: Small Orbit Core */}
                      <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl flex items-center justify-center shrink-0 mt-1 bg-surface border border-white/[0.1] shadow-sm">
                        <OrbitCore state="idle" size="sm" />
                      </div>

                      <div className="flex flex-col gap-1.5 min-w-0 flex-1 text-left">
                        <div className="flex items-center gap-2 text-[10px] font-mono text-pacific-cyan">
                          <span>ORBIT</span>
                          {m.timestamp && (
                            <span className="text-muted/60">{m.timestamp}</span>
                          )}
                        </div>

                        <div className="glass-card p-4 sm:p-5 rounded-2xl rounded-tl-sm text-sm sm:text-base leading-relaxed text-foreground/90 border border-white/[0.08] break-words">
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
                  <div className="flex items-start gap-3 sm:gap-4 max-w-[94%] sm:max-w-[85%] lg:max-w-[78%]">
                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl flex items-center justify-center shrink-0 mt-1 bg-surface border border-white/[0.1] shadow-sm">
                      <OrbitCore state="streaming" size="sm" />
                    </div>

                    <div className="flex flex-col gap-1.5 min-w-0 flex-1 text-left">
                      <div className="flex items-center gap-2 text-[10px] font-mono text-pacific-cyan">
                        <span>ORBIT</span>
                        <span className="animate-pulse">STREAMING</span>
                      </div>

                      <div className="glass-card p-4 sm:p-5 rounded-2xl rounded-tl-sm text-sm sm:text-base leading-relaxed text-foreground/90 border border-white/[0.08] break-words">
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
                  <div className="flex items-center gap-3.5 max-w-[90%]">
                    <OrbitCore state="generating" size="sm" />
                    <div className="glass-card px-4 py-2.5 rounded-xl border border-white/[0.08] flex items-center gap-2 text-xs font-mono text-muted">
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
        COMPOSER & ACTION FOOTER
        Comfortable desktop width, integrated surface, 4,000 char validation
        ========================================================================
      */}
      <div className="w-full shrink-0 border-t border-white/[0.06] bg-ink-black/90 backdrop-blur-lg px-4 sm:px-8 lg:px-12 pt-3 pb-4 sm:pb-5 z-20">
        <div className="w-full max-w-[1360px] mx-auto flex flex-col gap-2">
          {/* Error Banner */}
          {errorMessage && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/25 flex items-start justify-between gap-3 text-red-300 text-xs font-mono">
              <div className="flex items-start gap-2 min-w-0">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-400 mt-0.5" />
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

          {/* Composer Input Box */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="relative glass-panel rounded-2xl border border-white/[0.1] focus-within:border-pacific-cyan/50 p-2 sm:p-2.5 shadow-2xl transition-all flex flex-col gap-2 bg-white/[0.02]"
          >
            <textarea
              ref={textareaRef}
              rows={1}
              value={input}
              maxLength={MAX_MESSAGE_CHARS}
              onChange={handleTextareaInput}
              onKeyDown={handleKeyDown}
              placeholder={
                content.inputPlaceholder ||
                "Ask Orbit about Rushan's work, projects, or architecture..."
              }
              className="w-full bg-transparent px-3 py-1.5 text-sm sm:text-base text-foreground placeholder:text-muted/40 focus:outline-none resize-none min-h-[42px] max-h-[140px] font-sans leading-relaxed"
            />

            <div className="flex items-center justify-between px-2 pt-1 border-t border-white/[0.04]">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono text-muted/50 hidden sm:inline">
                  Return to send, Shift + Return for new line
                </span>
                {input.length > 3000 && (
                  <span
                    className={`text-[10px] font-mono ${
                      input.length >= MAX_MESSAGE_CHARS
                        ? "text-rose-400 font-semibold"
                        : "text-pacific-cyan/80"
                    }`}
                  >
                    {input.length} / {MAX_MESSAGE_CHARS}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 ml-auto">
                {isOrbitalActive ? (
                  <button
                    type="button"
                    onClick={handleStop}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] text-xs font-mono text-foreground border border-white/[0.1] transition-all cursor-pointer"
                    title="Stop generating"
                  >
                    <Square className="w-3 h-3 fill-current text-rose-400" />
                    <span>Stop</span>
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={!input.trim()}
                    aria-label="Send message to Orbit"
                    className="flex items-center justify-center h-8 px-4 rounded-xl bg-pacific-cyan text-ink-black hover:bg-pacific-cyan/90 transition-all shadow-[0_0_15px_rgba(24,155,173,0.35)] disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer text-xs font-mono font-semibold gap-1.5"
                  >
                    <span>Send</span>
                    <Send className="w-3 h-3" />
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
