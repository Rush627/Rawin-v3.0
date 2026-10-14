"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import {
  DictationController,
  SpeechController,
  VOICE_ERRORS,
  browserDictationEnv,
  browserLocale,
  browserSpeechEnv,
  getRecognitionCtor,
  joinText,
  rankVoices,
  type VoiceError,
  type VoiceLike,
} from "@/components/orbit/voice-engine";

// The lifecycles live in voice-engine.ts (framework-free, unit-tested); these hooks bind them
// to React. Re-exported for existing importers.
export { speakable, chunkSentences, scoreVoice } from "@/components/orbit/voice-engine";
export type { VoiceError, VoiceErrorKind } from "@/components/orbit/voice-engine";

const noopSubscribe = () => () => {};
/** True only on the client, after hydration, when the feature exists. */
function useClientSupport(check: () => boolean) {
  return useSyncExternalStore(noopSubscribe, check, () => false);
}

function mediaError(e: unknown): VoiceError {
  const name = e instanceof DOMException ? e.name : "";
  if (name === "NotAllowedError" || name === "SecurityError") return VOICE_ERRORS.permission;
  if (name === "NotFoundError" || name === "OverconstrainedError") return VOICE_ERRORS["no-device"];
  if (name === "NotReadableError") return VOICE_ERRORS["device-busy"];
  return VOICE_ERRORS.unexpected;
}

/* ------------------------------------------------------------------ Browser dictation */
/**
 * Dictation through the browser's own speech recognition (DictationController). Words stream
 * into the composer after whatever was already typed; nothing is sent automatically. start()
 * must be called from the microphone tap itself. cancel() discards a pending session (used
 * when the message is sent, so late results can never bring the sent text back).
 */
export function useDictation(onText: (text: string) => void) {
  const supported = useClientSupport(() => Boolean(getRecognitionCtor()));
  const [ctrl] = useState(() => new DictationController(browserDictationEnv(), onText));
  const state = useSyncExternalStore(ctrl.subscribe, ctrl.getState, ctrl.getState);
  useEffect(() => {
    ctrl.setOnText(onText);
  }, [ctrl, onText]);
  useEffect(() => () => ctrl.dispose(), [ctrl]);

  const start = useCallback((existing: string) => ctrl.start(existing), [ctrl]);
  const stop = useCallback(() => ctrl.stop(), [ctrl]);
  const cancel = useCallback(() => ctrl.cancel(), [ctrl]);
  const clearError = useCallback(() => ctrl.clearError(), [ctrl]);

  return {
    supported,
    phase: state.phase,
    /** Waiting for the browser (permission prompt, recogniser starting) */
    starting: state.phase === "starting",
    /** A session is open: the microphone is (or is about to stop) listening */
    listening: state.phase === "listening" || state.phase === "stopping",
    error: state.error,
    start,
    stop,
    cancel,
    clearError,
  };
}

/* ------------------------------------------------------------------ Recording fallback */
const MAX_RECORDING_MS = 30_000;

/**
 * Fallback when the browser's recogniser is unavailable: record up to 30 s with
 * MediaRecorder and transcribe it on RAWIN's server (Workers AI Whisper). Only used when
 * the CMS switch is on; the server enforces the same switch.
 */
export function useRecorder(onText: (text: string) => void) {
  const supported = useClientSupport(
    () => typeof window !== "undefined" && typeof window.MediaRecorder !== "undefined" && Boolean(navigator.mediaDevices?.getUserMedia)
  );
  const [state, setState] = useState<"idle" | "recording" | "transcribing">("idle");
  const [error, setError] = useState<VoiceError | null>(null);
  const recRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<number | undefined>(undefined);
  const cancelledRef = useRef(false);
  const abortRef = useRef<AbortController | null>(null);
  const onTextRef = useRef(onText);
  useEffect(() => {
    onTextRef.current = onText;
  }, [onText]);

  const release = () => {
    window.clearTimeout(timerRef.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    recRef.current = null;
  };

  const stop = useCallback(() => {
    if (recRef.current?.state === "recording") recRef.current.stop();
  }, []);

  const cancel = useCallback(() => {
    cancelledRef.current = true;
    abortRef.current?.abort();
    if (recRef.current?.state === "recording") recRef.current.stop();
    else setState("idle");
  }, []);

  const start = useCallback(async (existing: string) => {
    if (recRef.current) return;
    if (!window.isSecureContext) return setError(VOICE_ERRORS.insecure);
    setError(null);
    cancelledRef.current = false;
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (e) {
      return setError(mediaError(e));
    }
    const mime = ["audio/webm;codecs=opus", "audio/webm", "audio/ogg;codecs=opus", "audio/mp4"].find((m) =>
      MediaRecorder.isTypeSupported(m)
    );
    const rec = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
    const chunks: Blob[] = [];
    rec.ondataavailable = (e) => {
      if (e.data.size) chunks.push(e.data);
    };
    rec.onstop = async () => {
      const type = rec.mimeType || mime || "audio/webm";
      release();
      if (cancelledRef.current || !chunks.length) {
        setState("idle");
        return;
      }
      setState("transcribing");
      const controller = new AbortController();
      abortRef.current = controller;
      try {
        const res = await fetch("/api/ai/transcribe", {
          method: "POST",
          headers: { "Content-Type": type.split(";")[0] },
          body: new Blob(chunks, { type }),
          signal: controller.signal,
        });
        const data = (await res.json().catch(() => ({}))) as { text?: string; error?: string };
        if (!res.ok) setError({ kind: "transcription", message: data.error || "Transcription failed. Try again or type your message." });
        else if (!data.text) setError(VOICE_ERRORS["no-speech"]);
        else onTextRef.current(joinText(existing, data.text));
      } catch (e) {
        if (!(e instanceof DOMException && e.name === "AbortError")) {
          setError({ kind: "transcription", message: "Transcription failed. Check your connection and try again." });
        }
      } finally {
        abortRef.current = null;
        setState("idle");
      }
    };
    streamRef.current = stream;
    recRef.current = rec;
    rec.start();
    setState("recording");
    timerRef.current = window.setTimeout(() => {
      if (rec.state === "recording") rec.stop();
    }, MAX_RECORDING_MS);
  }, []);

  useEffect(
    () => () => {
      cancelledRef.current = true;
      abortRef.current?.abort();
      if (recRef.current?.state === "recording") recRef.current.stop();
      window.clearTimeout(timerRef.current);
      streamRef.current?.getTracks().forEach((t) => t.stop());
    },
    []
  );

  return { supported, state, error, start, stop, cancel, clearError: () => setError(null) };
}

/* ------------------------------------------------------------------ Spoken replies */
const VOICE_KEY = "rawin-orbit-voice";

/** The visitor's saved voice choice ("" = automatic) */
function storedVoiceURI(): string {
  try {
    return localStorage.getItem(VOICE_KEY) || "";
  } catch {
    return "";
  }
}

function availableVoices(): SpeechSynthesisVoice[] {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return [];
  try {
    return rankVoices(window.speechSynthesis.getVoices(), browserLocale());
  } catch {
    return [];
  }
}

/**
 * Spoken replies through the browser's speech synthesis (SpeechController). `speakingId` is set
 * only once the browser reports that speech started; `pendingId` covers the moment between the
 * tap and that report. speak() should be called from the tap when there is one; prime() unlocks
 * later, untapped speech (a reply read aloud when it arrives) on iOS.
 */
export function useSpeech() {
  const supported = useClientSupport(
    () => typeof window !== "undefined" && "speechSynthesis" in window && typeof window.SpeechSynthesisUtterance === "function"
  );
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  // The selector only renders client-side once voices exist, so reading storage here is safe
  const [voiceURI, setVoiceURIState] = useState<string>(() => (typeof window === "undefined" ? "" : storedVoiceURI()));

  // Read at the moment of speaking (voices load late on Android): the visitor's choice when it
  // is installed, else the best ranked voice, else none (the browser's default)
  const [ctrl] = useState(
    () =>
      new SpeechController(
        browserSpeechEnv((): VoiceLike | null => {
          const list = availableVoices();
          return list.find((v) => v.voiceURI === storedVoiceURI()) || list[0] || null;
        })
      )
  );
  const state = useSyncExternalStore(ctrl.subscribe, ctrl.getState, ctrl.getState);
  useEffect(() => () => ctrl.dispose(), [ctrl]);

  // Voices load asynchronously (Chrome, Android); rank them again on voiceschanged.
  useEffect(() => {
    if (!("speechSynthesis" in window)) return;
    const load = () => {
      const ranked = availableVoices();
      if (ranked.length) setVoices(ranked);
    };
    load();
    window.speechSynthesis.addEventListener("voiceschanged", load);
    return () => window.speechSynthesis.removeEventListener("voiceschanged", load);
  }, []);

  const setVoiceURI = useCallback((uri: string) => {
    setVoiceURIState(uri);
    try {
      if (uri) localStorage.setItem(VOICE_KEY, uri);
      else localStorage.removeItem(VOICE_KEY);
    } catch {
      // storage unavailable
    }
  }, []);

  const speak = useCallback((id: string, text: string) => ctrl.speak(id, text), [ctrl]);
  const toggle = useCallback((id: string, text: string) => ctrl.toggle(id, text), [ctrl]);
  const stop = useCallback(() => ctrl.stop(), [ctrl]);
  const prime = useCallback(() => ctrl.prime(), [ctrl]);
  const clearError = useCallback(() => ctrl.clearError(), [ctrl]);

  const activeVoice = voices.find((v) => v.voiceURI === voiceURI) || voices[0] || null;

  return {
    supported,
    phase: state.phase,
    /** The reply being prepared or played (Listen shows Stop for it) */
    activeId: state.phase === "idle" ? null : state.id,
    pendingId: state.phase === "preparing" ? state.id : null,
    speakingId: state.phase === "playing" ? state.id : null,
    error: state.error,
    voices,
    voiceURI,
    activeVoice,
    setVoiceURI,
    speak,
    toggle,
    stop,
    prime,
    clearError,
  };
}
