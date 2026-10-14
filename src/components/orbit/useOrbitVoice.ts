"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";

/* ------------------------------------------------------------------ Web Speech typings */
interface SpeechRecognitionResultLike {
  isFinal: boolean;
  0: { transcript: string };
}
interface SpeechRecognitionEventLike {
  resultIndex: number;
  results: ArrayLike<SpeechRecognitionResultLike>;
}
interface SpeechRecognitionLike {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((e: SpeechRecognitionEventLike) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
}
type RecognitionCtor = new () => SpeechRecognitionLike;

function getRecognitionCtor(): RecognitionCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as { SpeechRecognition?: RecognitionCtor; webkitSpeechRecognition?: RecognitionCtor };
  return w.SpeechRecognition || w.webkitSpeechRecognition || null;
}

const noopSubscribe = () => () => {};
/** True only on the client, after hydration, when the feature exists. */
function useClientSupport(check: () => boolean) {
  return useSyncExternalStore(noopSubscribe, check, () => false);
}

/* ------------------------------------------------------------------ Errors */
export type VoiceErrorKind =
  | "unsupported"
  | "insecure"
  | "permission"
  | "no-device"
  | "device-busy"
  | "no-speech"
  | "service"
  | "network"
  | "transcription"
  | "unexpected";

export interface VoiceError {
  kind: VoiceErrorKind;
  message: string;
  /** The microphone works but the browser's recogniser does not */
  serviceProblem?: boolean;
  /** Soft notices (e.g. nothing heard) rather than failures */
  soft?: boolean;
}

const ERR = {
  unsupported: { kind: "unsupported", message: "This browser doesn't support speech recognition. You can type your message instead." },
  insecure: { kind: "insecure", message: "Voice input needs a secure (HTTPS) connection." },
  permission: {
    kind: "permission",
    message: "Microphone access is blocked for this site. Allow it from the site settings next to the address bar, then try again.",
  },
  "no-device": { kind: "no-device", message: "No usable microphone was detected." },
  "device-busy": { kind: "device-busy", message: "The microphone is being used by another application." },
  "no-speech": { kind: "no-speech", message: "No speech was detected. Try again when you're ready.", soft: true },
  service: {
    kind: "service",
    message: "This browser's speech-recognition service is turned off or unavailable. Your microphone is fine.",
    serviceProblem: true,
  },
  network: {
    kind: "network",
    message:
      "This browser couldn't reach its speech-recognition service. Your microphone is fine; this happens in some browsers (such as Brave or Opera) and on restricted networks.",
    serviceProblem: true,
  },
  unexpected: { kind: "unexpected", message: "Voice input stopped unexpectedly. Try again, or type your message." },
} satisfies Record<string, VoiceError>;

/** Map Web Speech error codes. "not-allowed" only means a permission problem when the
 *  microphone itself was refused; the hook checks the microphone first to tell them apart. */
function recognitionError(code: string, micGranted: boolean): VoiceError | null {
  switch (code) {
    case "aborted":
      return null; // our own stop/cancel
    case "no-speech":
      return ERR["no-speech"];
    case "audio-capture":
      return ERR["no-device"];
    case "network":
      return ERR.network;
    case "service-not-allowed":
      return ERR.service;
    case "not-allowed":
      return micGranted ? ERR.service : ERR.permission;
    case "language-not-supported":
      return { kind: "service", message: "Speech recognition doesn't support this language in this browser.", serviceProblem: true };
    default:
      return ERR.unexpected;
  }
}

function mediaError(e: unknown): VoiceError {
  const name = e instanceof DOMException ? e.name : "";
  if (name === "NotAllowedError" || name === "SecurityError") return ERR.permission;
  if (name === "NotFoundError" || name === "OverconstrainedError") return ERR["no-device"];
  if (name === "NotReadableError") return ERR["device-busy"];
  return ERR.unexpected;
}

/** Ask for the microphone on the visitor's click, then release it immediately. */
async function confirmMicrophone(): Promise<VoiceError | null> {
  if (!navigator.mediaDevices?.getUserMedia) return null; // let recognition report what it can
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    stream.getTracks().forEach((t) => t.stop());
    return null;
  } catch (e) {
    return mediaError(e);
  }
}

function joinText(existing: string, addition: string) {
  const a = existing.replace(/\s+$/, "");
  const b = addition.trim();
  if (!b) return existing;
  return (a ? `${a} ${b}` : b).slice(0, 4000);
}

/* ------------------------------------------------------------------ Browser dictation */
/**
 * Dictation through the browser's own speech recognition. One session at a time; interim
 * words stream into the composer after whatever was already typed, nothing is sent
 * automatically, and the session is torn down on stop and unmount.
 */
export function useDictation(onText: (text: string) => void) {
  const supported = useClientSupport(() => Boolean(getRecognitionCtor()));
  const [listening, setListening] = useState(false);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<VoiceError | null>(null);
  const recRef = useRef<SpeechRecognitionLike | null>(null);
  const busyRef = useRef(false);
  const onTextRef = useRef(onText);
  useEffect(() => {
    onTextRef.current = onText;
  }, [onText]);

  const stop = useCallback(() => {
    recRef.current?.stop();
  }, []);

  const start = useCallback(async (existing: string) => {
    if (busyRef.current || recRef.current) return;
    const Ctor = getRecognitionCtor();
    if (!Ctor) return setError(ERR.unsupported);
    if (!window.isSecureContext) return setError(ERR.insecure);
    busyRef.current = true;
    setStarting(true);
    setError(null);

    const micError = await confirmMicrophone();
    if (micError) {
      setError(micError);
      busyRef.current = false;
      setStarting(false);
      return;
    }

    const rec = new Ctor();
    rec.lang = document.documentElement.lang || navigator.language || "en-US";
    rec.continuous = true;
    rec.interimResults = true;
    let finalText = "";
    rec.onresult = (e) => {
      let interim = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i];
        if (r.isFinal) finalText += r[0].transcript;
        else interim += r[0].transcript;
      }
      onTextRef.current(joinText(existing, finalText + interim));
    };
    rec.onerror = (e) => {
      const mapped = recognitionError(e.error, true);
      if (mapped) setError(mapped);
    };
    rec.onend = () => {
      setListening(false);
      recRef.current = null;
      busyRef.current = false;
      // Settle on the final words only (drops a dangling interim fragment)
      onTextRef.current(joinText(existing, finalText));
    };
    recRef.current = rec;
    try {
      rec.start();
      setListening(true);
    } catch {
      recRef.current = null;
      busyRef.current = false;
      setError(ERR.unexpected);
    } finally {
      setStarting(false);
    }
  }, []);

  useEffect(
    () => () => {
      const rec = recRef.current;
      if (rec) {
        rec.onend = null;
        rec.onresult = null;
        rec.onerror = null;
        rec.abort();
      }
    },
    []
  );

  return { supported, listening, starting, error, start, stop, clearError: () => setError(null) };
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
    if (!window.isSecureContext) return setError(ERR.insecure);
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
        else if (!data.text) setError(ERR["no-speech"]);
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
/** Turn a Markdown reply into natural speech: no syntax, code or raw URLs read aloud. */
export function speakable(markdown: string) {
  return markdown
    .replace(/```[\s\S]*?```/g, " I've included a code sample on screen. ")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/https?:\/\/\S+/g, " a link on screen ")
    .replace(/^\s{0,3}#{1,6}\s+/gm, "")
    .replace(/^\s*[-*+]\s+/gm, "")
    .replace(/^\s*\d+\.\s+/gm, "")
    .replace(/^\s*>\s?/gm, "")
    .replace(/\|/g, ", ")
    .replace(/[*_~]{1,3}([^*_~]+)[*_~]{1,3}/g, "$1")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{2,}/g, ". ")
    .replace(/\n/g, " ")
    .replace(/\s+([.,!?])/g, "$1")
    .replace(/\.{2,}/g, ".")
    .trim();
}

/** Short utterances avoid Chrome's long-utterance cut-off and keep cancellation snappy. */
export function chunkSentences(text: string, max = 220): string[] {
  const sentences = text.match(/[^.!?]+[.!?]*\s*/g) || [text];
  const out: string[] = [];
  let cur = "";
  for (const s of sentences) {
    if ((cur + s).length > max && cur) {
      out.push(cur.trim());
      cur = "";
    }
    cur += s;
  }
  if (cur.trim()) out.push(cur.trim());
  return out;
}

/**
 * Rank installed voices: language match first, then quality hints browsers expose in voice
 * names ("Natural"/"Neural" on Edge and Windows, "Enhanced"/"Premium" on Apple, Google's
 * network voices in Chrome). Legacy SAPI "Desktop" voices and eSpeak-style engines rank last.
 */
export function scoreVoice(v: Pick<SpeechSynthesisVoice, "lang" | "name" | "default">, lang: string): number {
  const vl = (v.lang || "").toLowerCase().replace("_", "-");
  const want = lang.toLowerCase();
  let score = 0;
  if (vl === want) score += 100;
  else if (vl.split("-")[0] === want.split("-")[0]) score += 60;
  else return -1000;
  const n = v.name.toLowerCase();
  if (/natural|neural/.test(n)) score += 50;
  if (/enhanced|premium|siri/.test(n)) score += 35;
  if (/google/.test(n)) score += 25;
  if (/desktop|espeak|festival|compact|robot/.test(n)) score -= 40;
  if (v.default) score += 5;
  return score;
}

const VOICE_KEY = "rawin-orbit-voice";

export function useSpeech() {
  const supported = useClientSupport(() => typeof window !== "undefined" && "speechSynthesis" in window);
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  // The selector only renders client-side once voices exist, so reading storage here is safe
  const [voiceURI, setVoiceURIState] = useState<string>(() => {
    if (typeof window === "undefined") return "";
    try {
      return localStorage.getItem(VOICE_KEY) || "";
    } catch {
      return "";
    }
  });
  const runRef = useRef(0); // invalidates queued chunks of a cancelled reply

  // Voices load asynchronously in Chrome; rank them again on voiceschanged.
  useEffect(() => {
    if (!("speechSynthesis" in window)) return;
    const raw = (document.documentElement.lang || navigator.language || "en-US").toLowerCase();
    const lang = raw.includes("-") ? raw : `${raw}-us`;
    const load = () => {
      const ranked = window.speechSynthesis
        .getVoices()
        .map((v) => ({ v, s: scoreVoice(v, lang) }))
        .filter((x) => x.s > -1000)
        .sort((a, b) => b.s - a.s)
        .map((x) => x.v);
      setVoices(ranked);
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

  const stop = useCallback(() => {
    runRef.current += 1;
    if (typeof window !== "undefined" && "speechSynthesis" in window) window.speechSynthesis.cancel();
    setSpeakingId(null);
  }, []);

  const activeVoice = voices.find((v) => v.voiceURI === voiceURI) || voices[0] || null;

  const speak = useCallback(
    (id: string, text: string) => {
      if (!("speechSynthesis" in window)) {
        setError("Spoken replies aren't available in this browser.");
        return;
      }
      const content = speakable(text);
      if (!content) return;
      const synth = window.speechSynthesis;
      runRef.current += 1;
      const run = runRef.current;
      synth.cancel();
      setError(null);
      const parts = chunkSentences(content);
      let index = 0;
      const next = () => {
        if (run !== runRef.current) return;
        if (index >= parts.length) {
          setSpeakingId((cur) => (cur === id ? null : cur));
          return;
        }
        const u = new SpeechSynthesisUtterance(parts[index++]);
        if (activeVoice) {
          u.voice = activeVoice;
          u.lang = activeVoice.lang;
        } else {
          u.lang = document.documentElement.lang || "en-US";
        }
        u.rate = 0.98;
        u.pitch = 1;
        u.volume = 1;
        u.onend = next;
        u.onerror = (e) => {
          const code = (e as SpeechSynthesisErrorEvent).error;
          if (code === "interrupted" || code === "canceled" || run !== runRef.current) return;
          setSpeakingId((cur) => (cur === id ? null : cur));
          setError(
            code === "not-allowed"
              ? "The browser blocked automatic playback. Press Listen on the reply to hear it."
              : "This reply couldn't be read aloud."
          );
        };
        synth.speak(u);
      };
      setSpeakingId(id);
      next();
    },
    [activeVoice]
  );

  const toggle = useCallback(
    (id: string, text: string) => {
      if (speakingId === id) stop();
      else speak(id, text);
    },
    [speakingId, speak, stop]
  );

  useEffect(
    () => () => {
      runRef.current += 1;
      if (typeof window !== "undefined" && "speechSynthesis" in window) window.speechSynthesis.cancel();
    },
    []
  );

  return { supported, speakingId, error, voices, voiceURI, activeVoice, setVoiceURI, speak, toggle, stop, clearError: () => setError(null) };
}
