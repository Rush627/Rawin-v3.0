"use client";

import "@/components/orbit/orbit.css";
import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { useReducedMotionSafe } from "@/lib/useReducedMotionSafe";
import { ArrowLeft, ArrowUp, AudioLines, FileCode, FileImage, FileSpreadsheet, FileText, Loader2, Mic, Paperclip, RotateCcw, RotateCw, Square, Volume2, X } from "lucide-react";
import MarkdownRenderer from "@/components/MarkdownRenderer";
import { OrbitSeed, type OrbMood } from "@/components/orbit/OrbitOrb";
import OrbitEmblem from "@/components/orbit/OrbitEmblem";
import OrbitSignalField from "@/components/orbit/OrbitSignalField";
import { useDictation, useRecorder, useSpeech } from "@/components/orbit/useOrbitVoice";
import { useOrbitAttachments, type OrbitAttachment, type SentAttachment } from "@/components/orbit/useOrbitAttachments";
import VoiceSelect from "@/components/orbit/VoiceSelect";
import { ACCEPT_ATTRIBUTE, UPLOAD_LIMITS, formatBytes, type UploadFamily } from "@/lib/aura/upload-policy";
import { greetingClock, useLocalGreeting } from "@/components/orbit/greetingClock";
import { useWelcomeMessage, welcomeMessage } from "@/components/orbit/welcomeMessage";
import ThemeToggle from "@/components/theme/ThemeToggle";
import type { OrbitState } from "@/components/OrbitMark";
import type { AIContent } from "@/lib/site-content";
import type { OrbitMessage } from "@/lib/aura/types";
import { EASE_EDITORIAL } from "@/lib/motion";

const MAX_MESSAGE_CHARS = 4000;
const DEFAULT_DISCLAIMER = "Orbit is an AI assistant. It can make mistakes.";

type Outgoing = { refs: { id: string; token: string }[]; sent: SentAttachment[] };
const NO_FILES: Outgoing = { refs: [], sent: [] };

const FAMILY_LABEL: Record<UploadFamily, string> = {
  image: "Image",
  pdf: "PDF",
  document: "Document",
  spreadsheet: "Spreadsheet",
  text: "Text",
  code: "Code",
  web: "Web page",
};

function FamilyIcon({ family, className }: { family: UploadFamily; className?: string }) {
  if (family === "image") return <FileImage className={className} />;
  if (family === "spreadsheet") return <FileSpreadsheet className={className} />;
  if (family === "code") return <FileCode className={className} />;
  return <FileText className={className} />;
}

function attachmentStatus(it: OrbitAttachment) {
  if (it.state === "uploading") return `Uploading ${Math.round(it.progress * 100)}%`;
  if (it.state === "processing") return it.family === "image" ? "Describing image…" : "Reading…";
  if (it.state === "ready") return "Ready";
  return "Failed";
}

interface AIAssistantViewProps {
  content: AIContent;
}

function now() {
  return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

const STATE_LABEL: Record<OrbitState, string> = {
  idle: "Ready",
  user_sent: "Listening",
  generating: "Thinking",
  streaming: "Responding",
  complete: "Ready",
  error: "Interrupted",
};

export default function AIAssistantView({ content }: AIAssistantViewProps) {
  const reduced = useReducedMotionSafe();
  const [messages, setMessages] = useState<OrbitMessage[]>([]);
  const [input, setInput] = useState("");
  const [orbitState, setOrbitState] = useState<OrbitState>("idle");
  const [streamingContent, setStreamingContent] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [stoppedIds, setStoppedIds] = useState<Set<string>>(() => new Set());
  const [pulse, setPulse] = useState(0);
  const attachments = useOrbitAttachments();
  const [attached, setAttached] = useState<Record<string, SentAttachment[]>>({});
  const lastFilesRef = useRef<Outgoing>(NO_FILES);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [, setIdentityToken] = useState<string | null>(null);
  const identityTokenRef = useRef<string | null>(null);
  // Mirrors the in-flight reply so an aborted stream can keep what already arrived
  const accumulatedRef = useRef("");

  const title = content?.title || "Rawin Orbit";
  const disclaimer = content?.disclaimer || DEFAULT_DISCLAIMER;

  const mobilePlaceholder = content?.mobileComposerPlaceholder || content?.inputPlaceholder || "Ask about the work";
  const desktopPlaceholder =
    content?.desktopComposerPlaceholder || content?.inputPlaceholder || "Ask about projects, the stack or the process";

  const allowVoiceInput = content?.voiceInput !== false;
  const allowPlayback = content?.voicePlayback !== false;
  const allowFiles = content?.fileAttachments === true;
  const allowServerTranscription = content?.serverTranscription === true;

  const syncTextareaHeight = useCallback(() => {
    const ta = document.getElementById("orbit-composer") as HTMLTextAreaElement | null;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = `${Math.min(ta.scrollHeight, 150)}px`;
  }, []);

  const applyTranscript = useCallback(
    (text: string) => {
      setInput(text);
      requestAnimationFrame(syncTextareaHeight);
    },
    [syncTextareaHeight]
  );
  const dictation = useDictation(applyTranscript);
  const recorder = useRecorder(applyTranscript);
  const speech = useSpeech();
  // Use the recording fallback when the browser has no recogniser, or after its
  // recognition service failed while the microphone itself worked.
  const [preferRecorder, setPreferRecorder] = useState(false);
  const serverVoice = allowServerTranscription && recorder.supported;
  const useRecording = serverVoice && (preferRecorder || !dictation.supported);
  const voiceAvailable = allowVoiceInput && (dictation.supported || serverVoice);
  const voiceBusy = dictation.listening || dictation.starting || recorder.state === "recording";
  const voiceError = useRecording ? recorder.error : dictation.error;
  // Voice conversation: when on, each new Orbit reply is read aloud once it has arrived.
  const [voiceMode, setVoiceMode] = useState(false);
  const spokenRef = useRef<string | null>(null);

  const [activePlaceholder, setActivePlaceholder] = useState(desktopPlaceholder);

  useEffect(() => {
    const updatePlaceholder = () => {
      setActivePlaceholder(window.innerWidth < 1024 ? mobilePlaceholder : desktopPlaceholder);
    };
    updatePlaceholder();
    window.addEventListener("resize", updatePlaceholder, { passive: true });
    return () => window.removeEventListener("resize", updatePlaceholder);
  }, [mobilePlaceholder, desktopPlaceholder]);

  // Prefill (never auto-send) a question handed over from elsewhere on the site: /ai?q=...
  useEffect(() => {
    let q: string | null = null;
    try {
      q = new URLSearchParams(window.location.search).get("q");
    } catch {
      q = null;
    }
    if (!q) return;
    const text = q.slice(0, MAX_MESSAGE_CHARS);
    const id = requestAnimationFrame(() => {
      setInput(text);
      document.getElementById("orbit-composer")?.focus();
    });
    return () => cancelAnimationFrame(id);
  }, []);

  // Not inside a tap: iOS plays it because the tap that sent the message primed synthesis
  // (handleSend). If the browser still refuses, the error offers Listen, which is a tap.
  const { speak: speakReply, supported: speechSupported } = speech;
  useEffect(() => {
    if (!voiceMode || !allowPlayback || !speechSupported) return;
    const last = messages[messages.length - 1];
    if (!last || last.role !== "assistant" || !last.id || spokenRef.current === last.id) return;
    spokenRef.current = last.id;
    speakReply(last.id, last.content);
  }, [messages, voiceMode, allowPlayback, speechSupported, speakReply]);

  const handleFilesChosen = (list: FileList | null) => {
    attachments.add(list);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

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
          mainEl.style.setProperty("--orbit-composer-pb", "max(1.25rem, calc(env(safe-area-inset-bottom) + 0.75rem))");
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

  // Auto-scroll: smooth when messages change, throttled (no smooth-scroll jank) while streaming
  const lastScrollTimeRef = useRef(0);
  useEffect(() => {
    if (messages.length === 0) return;
    endRef.current?.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "end" });
  }, [messages, reduced]);

  useEffect(() => {
    if (!streamingContent || !scrollContainerRef.current) return;
    const t = Date.now();
    if (t - lastScrollTimeRef.current > 100) {
      lastScrollTimeRef.current = t;
      const el = scrollContainerRef.current;
      const isNearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 200;
      if (isNearBottom) el.scrollTop = el.scrollHeight;
    }
  }, [streamingContent]);

  const handleTextareaInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    const textarea = e.target;
    textarea.style.height = "auto";
    textarea.style.height = `${Math.min(textarea.scrollHeight, 150)}px`;
  };

  const handleSend = async (queryOverride?: string, baseMessages?: OrbitMessage[], filesOverride?: Outgoing) => {
    const rawText = queryOverride || input;
    const textToSend = rawText.trim();
    if (!textToSend || orbitState === "generating" || orbitState === "streaming") {
      return;
    }
    // files still uploading / being read, or a failed one the visitor has not dealt with
    if (!filesOverride && (attachments.busy || attachments.items.some((it) => it.state === "failed"))) {
      return;
    }

    if (textToSend.length > MAX_MESSAGE_CHARS) {
      setErrorMessage("Your message exceeds the maximum limit of 4,000 characters. Please shorten your message.");
      setOrbitState("error");
      return;
    }

    setErrorMessage(null);
    setInput("");
    // discard the dictation outright: a late result must never bring the sent text back
    dictation.cancel();
    recorder.cancel();
    speech.stop();
    // this tap unlocks speech on iOS for the reply that will be read aloud when it arrives
    if (voiceMode && allowPlayback) speech.prime();
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }

    const userMessage: OrbitMessage = {
      id: `usr-${Date.now()}`,
      role: "user",
      content: textToSend,
      timestamp: now(),
    };

    const sending = filesOverride ?? (attachments.items.length ? attachments.take() : NO_FILES);
    if (sending.sent.length) {
      setAttached((prev) => ({ ...prev, [userMessage.id as string]: sending.sent }));
    }
    lastFilesRef.current = sending;

    const nextMessages = [...(baseMessages ?? messages), userMessage];
    setMessages(nextMessages);
    setOrbitState("user_sent");
    setStreamingContent("");
    accumulatedRef.current = "";
    setPulse((p) => p + 1);

    setTimeout(() => {
      setOrbitState((s) => (s === "user_sent" ? "generating" : s));
    }, 150);

    const controller = new AbortController();
    abortControllerRef.current = controller;
    // A stopped request settles asynchronously; if a new one has started by then, the old one
    // must not touch the shared state (it would mark the new request idle and drop its controller)
    const isCurrent = () => abortControllerRef.current === controller;

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
          ...(identityTokenRef.current ? { "x-orbit-identity-token": identityTokenRef.current } : {}),
        },
        body: JSON.stringify({
          messages: outboundHistory,
          stream: true,
          identityToken: identityTokenRef.current,
          ...(sending.refs.length ? { attachments: sending.refs } : {}),
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
        setMessages((prev) => [...prev, { id: `orbit-${Date.now()}`, role: "assistant", content: assistantReply, timestamp: now() }]);
        setOrbitState("complete");
        // only if nothing new started meanwhile (a quick next message must stay active)
        setTimeout(() => setOrbitState((s) => (s === "complete" ? "idle" : s)), 1200);
        return;
      }

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
              accumulatedRef.current = accumulated;
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
        setMessages((prev) => [...prev, { id: `orbit-${Date.now()}`, role: "assistant", content: accumulated, timestamp: now() }]);
        setOrbitState("complete");
        setTimeout(() => setOrbitState((s) => (s === "complete" ? "idle" : s)), 1400);
      } else {
        setOrbitState("idle");
      }
    } catch (err: unknown) {
      if (!isCurrent()) return;
      if (err instanceof Error && err.name === "AbortError") {
        const partial = accumulatedRef.current;
        if (partial.trim()) {
          const id = `orbit-${Date.now()}`;
          setMessages((prev) => [...prev, { id, role: "assistant", content: partial, timestamp: now() }]);
          setStoppedIds((prev) => new Set(prev).add(id));
        }
        setOrbitState("idle");
      } else {
        const msg = err instanceof Error ? err.message : "Something went wrong. Try again.";
        setErrorMessage(msg);
        setOrbitState("error");
      }
    } finally {
      if (isCurrent()) {
        setStreamingContent("");
        accumulatedRef.current = "";
        abortControllerRef.current = null;
      }
    }
  };

  const handleStop = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setOrbitState("idle");
  };

  /** Re-ask the last question after a failure without duplicating it in the thread. */
  const handleRetry = () => {
    const lastUserIdx = [...messages].map((m) => m.role).lastIndexOf("user");
    if (lastUserIdx < 0) {
      setErrorMessage(null);
      setOrbitState("idle");
      return;
    }
    const question = messages[lastUserIdx].content;
    handleSend(question, messages.slice(0, lastUserIdx), lastFilesRef.current);
  };

  const handleReset = () => {
    if (orbitState === "generating" || orbitState === "streaming") {
      handleStop();
    }
    identityTokenRef.current = null;
    setIdentityToken(null);
    setMessages([]);
    setStoppedIds(new Set());
    attachments.clear();
    setAttached({});
    lastFilesRef.current = NO_FILES;
    greetingClock.refresh();
    // a new empty session gets a fresh welcome message
    welcomeMessage.refresh();
    speech.stop();
    dictation.cancel();
    recorder.cancel();
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

  const isOrbitalActive = orbitState === "generating" || orbitState === "streaming";
  const hasThread = messages.length > 0;
  const mood: OrbMood =
    orbitState === "error"
      ? "error"
      : orbitState === "streaming"
      ? "streaming"
      : orbitState === "generating" || orbitState === "user_sent"
      ? "thinking"
      : input.trim()
      ? "listening"
      : "idle";

  const stateTone = orbitState === "error" ? "text-danger" : isOrbitalActive ? "text-accent" : "text-success";

  const queries = messages.filter((m) => m.role === "user").length;
  const titleParts = title.trim().split(/\s+/);
  const filesFailed = attachments.items.some((it) => it.state === "failed");
  const canSend = Boolean(input.trim()) && !attachments.busy && !filesFailed;
  const sendHint = attachments.busy ? "Waiting for your files to finish" : filesFailed ? "Retry or remove the file that failed" : undefined;

  // The greeting: the visitor's own clock, CMS wording; frozen while typing or in a thread.
  // The welcome message after it is drawn once per visit (and per new session).
  const greeting = useLocalGreeting(content);
  const welcome = useWelcomeMessage(content?.welcomeMessages);
  const welcomeReady = Boolean(greeting && welcome);
  useEffect(() => {
    greetingClock.setHold(hasThread || Boolean(input.trim()));
  }, [hasThread, input]);

  const voiceOptions = speech.voices.length
    ? [
        { value: "", label: `Automatic · ${speech.voices[0]?.name.replace(/^Microsoft\s+/, "").replace(/\s+-\s+.*$/, "")}`, hint: speech.voices[0]?.lang },
        ...speech.voices.slice(0, 12).map((v) => ({ value: v.voiceURI, label: v.name.replace(/^Microsoft\s+/, ""), hint: v.lang })),
      ]
    : [];

  return (
    <main
      ref={containerRef}
      className="orbit-stage fixed inset-0 w-full h-[var(--orbit-viewport-height,100dvh)] max-h-[var(--orbit-viewport-height,100dvh)] flex bg-bg text-fg overflow-hidden select-text z-40"
      aria-label="Rawin Orbit AI Interface"
    >
      <div aria-hidden="true" className="rawin-atmosphere !absolute" />
      {/* Ambient Signal Field: follows the real request state; decorative, behind everything */}
      <OrbitSignalField state={orbitState} pulse={pulse} />

      {/* ------------------------------------------------------------ Companion rail (desktop) */}
      <aside className="hidden lg:flex relative z-10 w-[300px] xl:w-[340px] shrink-0 flex-col border-r border-line bg-bg-raised/60 px-6 xl:px-7 pt-6 pb-6">
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="group inline-flex items-center gap-2 h-10 pl-2.5 pr-3.5 -ml-2.5 rounded-full text-[13px] font-medium text-fg hover:bg-fg/5"
            aria-label="Return to RAWIN homepage"
          >
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
            RAWIN
          </Link>
          <ThemeToggle />
        </div>

        {/* Three groups: navigation (above), identity (centred in the free height), then the reply
            voice and the session action anchored to the foot of the rail. */}
        <div className="flex-1 min-h-0 flex flex-col items-center justify-center text-center py-8">
          {/* Desktop placement of the shared emblem. Layout is pure CSS; the orb only creates its
              GL context while its box has a size, so the phone placement costs nothing here. */}
          {/* The emblem's rings reach 18% beyond its box: the bottom margin keeps the dashed
              halo clear of the wordmark (164 × 0.18 ≈ 30px, 188 × 0.18 ≈ 34px) */}
          <OrbitEmblem mood={mood} pulseKey={pulse} className="w-[164px] xl:w-[188px] mb-[30px] xl:mb-[34px]" />
          <p className="mt-5 font-display text-[2rem] leading-none tracking-[-0.02em] text-fg">
            {titleParts.length > 1 ? (
              <>
                {titleParts.slice(0, -1).join(" ")} <em className="italic text-accent">{titleParts[titleParts.length - 1]}</em>
              </>
            ) : (
              title
            )}
          </p>
          <p className={`mt-3 inline-flex items-center gap-2 label-mono ${stateTone}`} aria-live="polite">
            <span className={`w-1.5 h-1.5 rounded-full bg-current ${isOrbitalActive ? "animate-pulse" : ""}`} />
            {STATE_LABEL[orbitState]}
          </p>
        </div>

        {allowPlayback && speech.supported && speech.voices.length > 1 && (
          <div className="shrink-0">
            <p className="label-mono text-fg-subtle" aria-hidden="true">
              Reply voice
            </p>
            <div className="mt-2">
              <VoiceSelect id="orbit-voice" label="Reply voice" value={speech.voiceURI} options={voiceOptions} onChange={speech.setVoiceURI} />
            </div>
          </div>
        )}

        <div className="shrink-0 pt-5 mt-5 min-h-[3.5rem] border-t border-line flex items-center justify-between gap-3">
          <span className="label-mono text-fg-subtle">{queries ? `${queries} ${queries === 1 ? "question" : "questions"}` : "New session"}</span>
          {hasThread && (
            <button type="button" onClick={handleReset} className="group inline-flex items-center gap-2 h-9 px-3.5 rounded-full border border-line-strong text-[12.5px] text-fg hover:border-fg">
              <RotateCcw className="w-3.5 h-3.5 transition-transform group-hover:-rotate-45" />
              New session
            </button>
          )}
        </div>
      </aside>

      {/* ------------------------------------------------------------ Conversation canvas */}
      <section className="relative z-10 flex-1 min-w-0 flex flex-col">
        {/* Phone / tablet bar */}
        <header className="lg:hidden shrink-0 pt-[env(safe-area-inset-top)] px-3 sm:px-6">
          {/* the wordmark sits in the true centre: two equal flexible columns around it */}
          <div className="h-16 grid grid-cols-[1fr_auto_1fr] items-center gap-2">
            <Link
              href="/"
              className="justify-self-start inline-flex items-center justify-center gap-2 h-11 min-w-11 px-3 rounded-full text-[13px] font-medium text-fg hover:bg-fg/5"
              aria-label="Return to RAWIN homepage"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">RAWIN</span>
            </Link>
            <div className="flex items-center justify-center gap-2.5 min-w-0">
              {hasThread && <OrbitSeed active={isOrbitalActive} />}
              <span className="font-display text-[1.25rem] leading-none text-fg truncate">{title}</span>
            </div>
            <div className="justify-self-end flex items-center">
              {hasThread && (
                <button
                  type="button"
                  onClick={handleReset}
                  className="inline-flex items-center justify-center w-11 h-11 rounded-full text-fg hover:bg-fg/5"
                  aria-label="Start a new session"
                  title="New session"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              )}
              <ThemeToggle />
            </div>
          </div>
          {/* no visible status on phones; it is still announced */}
          <span className="sr-only" aria-live="polite">
            {STATE_LABEL[orbitState]}
          </span>
        </header>

        {!hasThread ? (
          <div className="relative flex-1 min-h-0 w-full overflow-y-auto px-4 sm:px-8 lg:px-12" data-lenis-prevent>
            <div className="mx-auto w-full max-w-[50rem] min-h-full flex flex-col justify-center pt-4 pb-6 sm:pt-8 lg:py-12">
              {/* One centred column on every size: heading, tagline, greeting. Phones/tablets show
                  the emblem above it; on desktop the emblem lives in the rail. */}
              <div className="flex flex-col items-center text-center">
                {/* the emblem's rings reach 18% beyond its box, hence the bottom margin */}
                <OrbitEmblem
                  mood={mood}
                  pulseKey={pulse}
                  className="lg:hidden w-[60px] min-[380px]:w-[68px] sm:w-[88px] mb-[22px] min-[380px]:mb-[26px] sm:mb-[30px]"
                  resolution={140}
                />
                <div className="min-w-0 w-full flex flex-col items-center">
                  <motion.h1
                    className="font-display text-[clamp(2.3rem,10.5vw,3.4rem)] lg:text-[clamp(3.6rem,5.4vw,5.25rem)] leading-[0.92] tracking-[-0.035em] text-fg"
                    initial={reduced ? false : { opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.9, ease: EASE_EDITORIAL, delay: 0.05 }}
                  >
                    Ask <em className="italic text-accent">Orbit</em>
                  </motion.h1>
                  {content?.greetingMessage && (
                    <motion.p
                      className="mt-2.5 sm:mt-3 lg:mt-4 text-[14.5px] sm:text-[15px] lg:text-[17px] leading-snug text-fg-muted max-w-[34ch]"
                      style={{ textWrap: "balance" }}
                      initial={reduced ? false : { opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.8, delay: 0.15 }}
                    >
                      {content.greetingMessage}
                    </motion.p>
                  )}
                </div>
              </div>

              {/* The greeting for the visitor's local time, then this visit's welcome message:
                  two lines on phones and tablets, one line on desktop. Both are only known on the
                  client, so their space is reserved (three phone lines, one desktop line) and
                  they fade in together without shifting anything. */}
              <div className="mt-6 sm:mt-8 lg:mt-10 flex justify-center min-h-[4.5rem] sm:min-h-[3.6rem] lg:min-h-[2.4rem]">
                <p
                  data-orbit-welcome
                  className={`text-center font-display text-[1.25rem] sm:text-[1.45rem] lg:text-[clamp(1.4rem,1.8vw,1.85rem)] leading-[1.2] tracking-[-0.01em] text-fg max-w-[30ch] lg:max-w-none transition-opacity duration-700 ${
                    welcomeReady ? "opacity-100" : "opacity-0"
                  }`}
                  style={{ textWrap: "balance" }}
                >
                  {welcomeReady ? (
                    <>
                      <span data-orbit-greeting className="block lg:inline">
                        {greeting}
                      </span>{" "}
                      <span data-orbit-welcome-message className="block mt-1 lg:mt-0 lg:inline">
                        {welcome}
                      </span>
                    </>
                  ) : (
                    "\u00a0"
                  )}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div
            ref={scrollContainerRef}
            data-lenis-prevent
            className="relative flex-1 min-h-0 w-full overflow-y-auto px-4 sm:px-8 lg:px-12 pt-4 sm:pt-8"
            role="log"
            aria-live="polite"
            aria-relevant="additions"
          >
            <div className="mx-auto w-full max-w-[50rem] flex flex-col gap-9 sm:gap-11 pb-6">
              <AnimatePresence initial={false}>
                {messages.map((m) =>
                  m.role === "user" ? (
                    <motion.div
                      key={m.id}
                      className="self-end max-w-[90%] sm:max-w-[78%] flex flex-col items-end"
                      initial={reduced ? false : { opacity: 0, y: 14 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, ease: EASE_EDITORIAL }}
                    >
                      <p className="label-mono text-fg-subtle mb-2">You{m.timestamp ? ` · ${m.timestamp}` : ""}</p>
                      <p className="text-left text-[15.5px] sm:text-[16px] leading-[1.55] text-inverse-fg whitespace-pre-wrap break-words px-4 sm:px-5 py-3 rounded-[20px] rounded-tr-md bg-inverse">
                        {m.content}
                      </p>
                      {m.id && attached[m.id]?.length ? (
                        <ul className="mt-2 flex flex-wrap justify-end gap-1.5">
                          {attached[m.id].map((f, fi) => (
                            <li key={`${f.name}-${fi}`} className="inline-flex items-center gap-1.5 max-w-full px-2.5 py-1 rounded-full border border-line text-[12px] text-fg-muted">
                              <FamilyIcon family={f.family} className="w-3 h-3 shrink-0" />
                              <span className="truncate">{f.name}</span>
                            </li>
                          ))}
                        </ul>
                      ) : null}
                    </motion.div>
                  ) : (
                    <motion.article
                      key={m.id}
                      className="relative"
                      initial={reduced ? false : { opacity: 0, y: 14 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.6, ease: EASE_EDITORIAL }}
                    >
                      <div className="flex items-center justify-between gap-3 mb-3">
                        <p className="flex items-center gap-2.5 label-mono text-fg-subtle">
                          <OrbitSeed />
                          <span className="text-fg">Orbit</span>
                          {m.timestamp && <span>· {m.timestamp}</span>}
                        </p>
                        {allowPlayback && speech.supported && m.id && (
                          <button
                            type="button"
                            // called in the tap itself: iOS only starts speech inside the gesture
                            onClick={() => speech.toggle(m.id as string, m.content)}
                            aria-pressed={speech.activeId === m.id}
                            aria-label={
                              speech.pendingId === m.id ? "Starting playback, tap to cancel" : speech.speakingId === m.id ? "Stop reading this reply" : "Read this reply aloud"
                            }
                            className={`inline-flex items-center gap-1.5 h-8 px-3 rounded-full text-[12px] border transition-colors ${
                              speech.activeId === m.id ? "border-accent text-accent" : "border-line text-fg-muted hover:text-fg hover:border-line-strong"
                            }`}
                          >
                            {speech.pendingId === m.id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : speech.speakingId === m.id ? (
                              <Square className="w-3 h-3 fill-current" />
                            ) : (
                              <Volume2 className="w-3.5 h-3.5" />
                            )}
                            {speech.pendingId === m.id ? "Starting…" : speech.speakingId === m.id ? "Stop" : "Listen"}
                          </button>
                        )}
                      </div>
                      <div className="text-fg break-words [&_.prose-rawin_p]:text-[15.5px] sm:[&_.prose-rawin_p]:text-[16.5px] [&_.prose-rawin_li]:text-[15.5px] sm:[&_.prose-rawin_li]:text-[16px]">
                        <MarkdownRenderer content={m.content} compact />
                      </div>
                      {m.id && stoppedIds.has(m.id) && (
                        <p className="mt-3 inline-flex items-center gap-2 label-mono text-warning">
                          <Square className="w-2.5 h-2.5 fill-current" />
                          Response stopped
                        </p>
                      )}
                    </motion.article>
                  )
                )}
              </AnimatePresence>

              {isOrbitalActive && streamingContent && (
                <article className="relative" aria-busy="true">
                  <p className="flex items-center gap-2.5 label-mono text-fg-subtle mb-3">
                    <OrbitSeed active />
                    <span className="text-fg">Orbit</span>
                    <span className="text-accent">· Responding</span>
                  </p>
                  <div className="text-fg break-words [&_.prose-rawin_p]:text-[15.5px] sm:[&_.prose-rawin_p]:text-[16.5px]">
                    <MarkdownRenderer content={streamingContent} compact />
                    <span className="orbit-caret" aria-hidden="true" />
                  </div>
                </article>
              )}

              {(orbitState === "generating" || orbitState === "user_sent") && !streamingContent && (
                <div className="relative" role="status">
                  <p className="flex items-center gap-2.5 label-mono text-fg-subtle">
                    <OrbitSeed active />
                    <span className="orbit-thinking normal-case tracking-normal font-display italic text-xl">Orbit is thinking…</span>
                  </p>
                </div>
              )}

              {orbitState === "error" && errorMessage && (
                <div role="alert" className="rounded-[20px] border border-danger/40 bg-danger/5 px-5 py-4">
                  <p className="label-mono text-danger mb-2">Signal interrupted</p>
                  <p className="text-[15px] text-fg leading-relaxed">{errorMessage}</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <button type="button" onClick={handleRetry} className="btn btn-primary btn-sm">
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Try again</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setErrorMessage(null);
                        setOrbitState("idle");
                      }}
                      className="btn btn-ghost btn-sm"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              )}

              <div ref={endRef} />
            </div>
          </div>
        )}

        {/* Composer */}
        <div className="relative z-20 w-full shrink-0 px-3 sm:px-8 lg:px-12 pt-2 pb-[var(--orbit-composer-pb,max(1.25rem,calc(env(safe-area-inset-bottom)+0.75rem)))] sm:!pb-6 lg:!pb-7">
          <div className="mx-auto w-full max-w-[50rem] flex flex-col gap-2">
            {!hasThread && orbitState === "error" && errorMessage && (
              <div role="alert" className="rounded-2xl border border-danger/40 bg-danger/5 px-4 py-3 flex items-start justify-between gap-3 text-sm">
                <span className="text-danger">{errorMessage}</span>
                <button
                  type="button"
                  onClick={() => {
                    setErrorMessage(null);
                    setOrbitState("idle");
                  }}
                  className="label-mono text-fg-muted hover:text-fg shrink-0"
                >
                  Dismiss
                </button>
              </div>
            )}
            {(attachments.notice || speech.error) && (
              <p role="alert" className="px-2 text-[13px] text-danger">
                {attachments.notice || speech.error}
              </p>
            )}
            {voiceError && (
              <div
                role={voiceError.soft ? "status" : "alert"}
                className={`px-2 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[13px] ${voiceError.soft ? "text-fg-muted" : voiceError.serviceProblem ? "text-warning" : "text-danger"}`}
              >
                <span>
                  {voiceError.message}
                  {voiceError.serviceProblem && !serverVoice && " Try Chrome or Edge, or type your message."}
                </span>
                {voiceError.serviceProblem && serverVoice && !useRecording && (
                  <button
                    type="button"
                    onClick={() => {
                      dictation.clearError();
                      setPreferRecorder(true);
                      recorder.start(input);
                    }}
                    className="inline-flex items-center gap-1.5 h-8 px-3 rounded-full border border-line-strong text-fg hover:border-fg"
                  >
                    <Mic className="w-3.5 h-3.5" />
                    Record instead
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => (useRecording ? recorder.clearError() : dictation.clearError())}
                  className="label-mono text-fg-subtle hover:text-fg"
                >
                  Dismiss
                </button>
              </div>
            )}

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              data-active={isOrbitalActive ? "true" : undefined}
              className="orbit-composer relative w-full rounded-[26px] flex flex-col"
            >
              {attachments.items.length > 0 && (
                <div className="px-2.5 pt-2.5">
                  <ul className="flex flex-wrap gap-2" aria-label="Attachments">
                    {attachments.items.map((it) => (
                      <li
                        key={it.key}
                        data-state={it.state}
                        title={it.error || `${it.name} · ${formatBytes(it.size)}`}
                        className={`relative flex items-center gap-2.5 w-full min-[420px]:w-[16.5rem] pl-1.5 pr-1 py-1.5 rounded-2xl border bg-surface-2/70 overflow-hidden ${
                          it.state === "failed" ? "border-danger/50" : "border-line"
                        }`}
                      >
                        <span className="relative w-10 h-10 shrink-0 rounded-xl overflow-hidden bg-surface border border-line flex items-center justify-center text-fg-muted">
                          {it.preview ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={it.preview} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <FamilyIcon family={it.family} className="w-4 h-4" />
                          )}
                          {(it.state === "uploading" || it.state === "processing") && (
                            <span className="absolute inset-0 flex items-center justify-center bg-bg/55">
                              <Loader2 className="w-4 h-4 animate-spin text-fg" />
                            </span>
                          )}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[12.5px] text-fg">{it.name}</span>
                          <span className={`block truncate text-[11px] ${it.state === "failed" ? "text-danger" : it.state === "ready" ? "text-success" : "text-fg-subtle"}`}>
                            {FAMILY_LABEL[it.family]} · {formatBytes(it.size)} · {attachmentStatus(it)}
                          </span>
                        </span>
                        {it.state === "failed" && (
                          <button
                            type="button"
                            onClick={() => attachments.retry(it.key)}
                            className="w-8 h-8 shrink-0 rounded-full flex items-center justify-center text-fg-muted hover:text-fg hover:bg-fg/10"
                            aria-label={`Retry ${it.name}`}
                          >
                            <RotateCw className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => attachments.remove(it.key)}
                          className="w-8 h-8 shrink-0 rounded-full flex items-center justify-center text-fg-muted hover:text-fg hover:bg-fg/10"
                          aria-label={`Remove ${it.name}`}
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                        {it.state === "uploading" && (
                          <span aria-hidden="true" className="absolute left-0 bottom-0 h-[2px] bg-accent transition-[width] duration-300" style={{ width: `${Math.max(4, it.progress * 100)}%` }} />
                        )}
                      </li>
                    ))}
                  </ul>
                  {attachments.items.some((it) => it.state === "failed" && it.error) && (
                    <ul role="alert" className="mt-1.5 px-1 flex flex-col gap-0.5 text-[12px] text-danger">
                      {attachments.items
                        .filter((it) => it.state === "failed" && it.error)
                        .map((it) => (
                          <li key={it.key}>{it.error}</li>
                        ))}
                    </ul>
                  )}
                  <p className="sr-only" aria-live="polite">
                    {attachments.items.map((it) => `${it.name}: ${attachmentStatus(it)}`).join(". ")}
                  </p>
                </div>
              )}

              <label htmlFor="orbit-composer" className="sr-only">
                Message Rawin Orbit
              </label>
              <textarea
                id="orbit-composer"
                ref={textareaRef}
                rows={1}
                value={input}
                maxLength={MAX_MESSAGE_CHARS}
                onChange={handleTextareaInput}
                onKeyDown={handleKeyDown}
                onFocus={() => {
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
                placeholder={voiceBusy ? "Listening… speak now" : recorder.state === "transcribing" ? "Transcribing…" : activePlaceholder}
                className="orbit-composer-input w-full min-h-12 max-h-[150px] bg-transparent text-[16px] leading-[1.5] text-fg placeholder:text-fg-subtle resize-none px-5 pt-3.5 pb-1 border-0 overflow-y-auto"
              />

              <div className="flex items-center justify-between gap-2 px-2.5 pb-2.5 pt-1">
                <div className="flex items-center gap-1">
                  {allowFiles && (
                    <>
                      <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        accept={ACCEPT_ATTRIBUTE}
                        className="sr-only"
                        tabIndex={-1}
                        aria-hidden="true"
                        onChange={(e) => handleFilesChosen(e.target.files)}
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={attachments.items.length >= UPLOAD_LIMITS.maxFiles || isOrbitalActive}
                        className="w-10 h-10 rounded-full flex items-center justify-center text-fg-muted hover:text-fg hover:bg-fg/5 disabled:opacity-40"
                        aria-label="Attach photos or files"
                        title={`Photos, PDFs, documents, spreadsheets or text files · up to ${UPLOAD_LIMITS.maxFiles} files, 50 MB each`}
                      >
                        <Paperclip className="w-4 h-4" />
                      </button>
                    </>
                  )}
                  {/* Shown whenever voice input is enabled (phones included). Where the browser has no
                      recogniser and server transcription is off, a tap explains that and typing
                      still works — the control is never silently missing or inert. */}
                  {allowVoiceInput && (
                    <button
                      type="button"
                      onClick={() => {
                        if (!voiceAvailable) {
                          // dictation.start reports "unsupported" accessibly when no recogniser exists
                          dictation.start(input);
                          return;
                        }
                        if (voiceBusy) {
                          if (useRecording) recorder.stop();
                          else dictation.stop();
                          return;
                        }
                        if (allowPlayback && speech.supported) setVoiceMode(true);
                        if (useRecording) recorder.start(input);
                        else dictation.start(input);
                      }}
                      aria-pressed={voiceBusy}
                      disabled={isOrbitalActive || recorder.state === "transcribing"}
                      className={`h-10 rounded-full flex items-center justify-center gap-2 transition-colors disabled:opacity-60 ${
                        voiceBusy || recorder.state === "transcribing" || dictation.starting
                          ? "px-3.5 bg-accent/12 text-accent"
                          : `w-10 hover:text-fg hover:bg-fg/5 ${voiceAvailable ? "text-fg-muted" : "text-fg-subtle"}`
                      }`}
                      aria-label={
                        !voiceAvailable
                          ? "Voice input (not supported in this browser)"
                          : voiceBusy
                          ? "Stop listening"
                          : useRecording
                          ? "Record a voice message"
                          : "Dictate a message"
                      }
                      title={
                        !voiceAvailable
                          ? "Voice input isn't supported in this browser"
                          : useRecording
                          ? "Record up to 30 seconds; Orbit transcribes it into the composer"
                          : "Dictate with your browser's speech recognition"
                      }
                    >
                      {recorder.state === "transcribing" ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : voiceBusy ? (
                        <span aria-hidden="true" className="voice-bars">
                          <span />
                          <span />
                          <span />
                        </span>
                      ) : (
                        <Mic className="w-4 h-4" />
                      )}
                      {voiceBusy && !dictation.starting && <span className="text-[12.5px] font-medium">Listening · Stop</span>}
                      {recorder.state === "transcribing" && <span className="text-[12.5px] font-medium">Transcribing…</span>}
                      {dictation.starting && <span className="text-[12.5px] font-medium">Allow microphone…</span>}
                    </button>
                  )}
                  {allowPlayback && speech.supported && (
                    <button
                      type="button"
                      onClick={() => {
                        if (voiceMode) speech.stop();
                        // turning spoken replies on is a tap: unlock speech for them (iOS)
                        else speech.prime();
                        setVoiceMode((v) => !v);
                      }}
                      aria-pressed={voiceMode}
                      className={`h-10 rounded-full flex items-center justify-center gap-2 transition-colors ${
                        voiceMode ? "px-3.5 bg-accent/12 text-accent" : "w-10 text-fg-muted hover:text-fg hover:bg-fg/5"
                      }`}
                      aria-label={voiceMode ? "Turn off spoken replies" : "Speak Orbit's replies aloud"}
                      title="Voice conversation: read replies aloud (browser speech)"
                    >
                      <AudioLines className="w-4 h-4" />
                      {voiceMode && <span className="text-[12.5px] font-medium">Speaking replies</span>}
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {input.length > 2500 && (
                    <span className={`font-mono text-[11px] tabular-nums ${input.length >= MAX_MESSAGE_CHARS ? "text-danger" : "text-fg-subtle"}`}>
                      {input.length}/{MAX_MESSAGE_CHARS}
                    </span>
                  )}
                  {isOrbitalActive ? (
                    <button
                      type="button"
                      onClick={handleStop}
                      aria-label="Stop generating response"
                      title="Stop generating"
                      className="w-10 h-10 rounded-full bg-inverse text-inverse-fg flex items-center justify-center transition-transform active:scale-95"
                    >
                      <Square className="w-3.5 h-3.5 fill-current" />
                    </button>
                  ) : (
                    <button
                      type="submit"
                      disabled={!canSend}
                      aria-label={sendHint ? `Send message to Orbit (${sendHint.toLowerCase()})` : "Send message to Orbit"}
                      title={sendHint}
                      className="w-10 h-10 rounded-full bg-accent text-accent-fg flex items-center justify-center transition-[transform,opacity] hover:scale-105 active:scale-95 disabled:opacity-30 disabled:hover:scale-100 disabled:cursor-not-allowed"
                    >
                      <ArrowUp className="w-4.5 h-4.5 stroke-[2.25]" />
                    </button>
                  )}
                </div>
              </div>
            </form>
            {/* one note, always directly under the composer */}
            <p className="px-3 text-center text-balance break-words text-[10.5px] sm:text-[12px] leading-[1.45] sm:leading-snug tracking-[0.01em] sm:tracking-normal text-fg-subtle">
              {disclaimer}
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
