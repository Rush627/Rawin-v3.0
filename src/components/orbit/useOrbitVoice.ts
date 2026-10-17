"use client";

import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import {
  CloudSpeechController,
  DictationController,
  RecorderController,
  SpeechController,
  audioContextCtor,
  browserCloudSpeechEnv,
  browserDictationEnv,
  browserLocale,
  browserRecorderEnv,
  browserSpeechEnv,
  getRecognitionCtor,
  rankVoices,
  type VoiceLike,
} from "@/components/orbit/voice-engine";
import { useBackgroundHold } from "@/components/audio/useBackgroundHold";
// Orbit's voice takes priority over the site ambience (lib/audio/hold.ts)
import { dictationActive, recorderActive, speechActive } from "@/lib/audio/hold";

// The lifecycles live in voice-engine.ts (framework-free, unit-tested); these hooks bind them
// to React. Re-exported for existing importers.
export { speakable, chunkSentences, scoreVoice } from "@/components/orbit/voice-engine";
export type { VoiceError, VoiceErrorKind } from "@/components/orbit/voice-engine";

const noopSubscribe = () => () => {};
/** True only on the client, after hydration, when the feature exists. */
function useClientSupport(check: () => boolean) {
  return useSyncExternalStore(noopSubscribe, check, () => false);
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
  // the site ambience stays silent while the microphone is opening, open or closing
  useBackgroundHold(ctrl, dictationActive);
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
/**
 * Fallback when the browser's recogniser is unavailable or failed: record up to 30 s and
 * transcribe it on RAWIN's server (Workers AI Whisper, RecorderController). Only used when the
 * CMS switch is on; the server enforces the same switch.
 */
export function useRecorder(onText: (text: string) => void) {
  const supported = useClientSupport(
    () => typeof window !== "undefined" && typeof window.MediaRecorder !== "undefined" && Boolean(navigator.mediaDevices?.getUserMedia)
  );
  const [ctrl] = useState(() => new RecorderController(browserRecorderEnv(), onText));
  const st = useSyncExternalStore(ctrl.subscribe, ctrl.getState, ctrl.getState);
  // silent while recording (the upload and transcription afterwards no longer need the quiet)
  useBackgroundHold(ctrl, recorderActive);
  useEffect(() => {
    ctrl.setOnText(onText);
  }, [ctrl, onText]);
  useEffect(() => () => ctrl.dispose(), [ctrl]);

  const start = useCallback((existing: string) => void ctrl.start(existing), [ctrl]);
  const stop = useCallback(() => ctrl.stop(), [ctrl]);
  const cancel = useCallback(() => ctrl.cancel(), [ctrl]);
  const clearError = useCallback(() => ctrl.clearError(), [ctrl]);

  return {
    supported,
    phase: st.phase,
    // "starting" (permission prompt) shows as recording, so the same tap can cancel it
    state: (st.phase === "starting" ? "recording" : st.phase) as "idle" | "recording" | "transcribing",
    error: st.error,
    start,
    stop,
    cancel,
    clearError,
  };
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
 * Spoken replies. With `cloud` (the CMS "Cloud voice" switch) replies are generated by Workers
 * AI MeloTTS and played as audio (CloudSpeechController); otherwise the browser's speech
 * synthesis reads them (SpeechController). A failed cloud request is reported with its reason
 * and never replaced by the device voice on its own: the interface may offer
 * `speakWithDevice` for that reply, which the visitor chooses with a tap.
 *
 * `speakingId` is set only once audio actually started; `pendingId` covers the moment between
 * the tap and that report. speak() should be called from the tap when there is one; prime()
 * unlocks later, untapped playback (a reply read aloud when it arrives) on iOS.
 */
export function useSpeech({ cloud = false }: { cloud?: boolean } = {}) {
  const deviceSupported = useClientSupport(
    () => typeof window !== "undefined" && "speechSynthesis" in window && typeof window.SpeechSynthesisUtterance === "function"
  );
  // cloud replies are played with Web Audio (never a media element: see webAudioSpeechOutput)
  const audioSupported = useClientSupport(() => audioContextCtor() !== null);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  // The selector only renders client-side once voices exist, so reading storage here is safe
  const [voiceURI, setVoiceURIState] = useState<string>(() => (typeof window === "undefined" ? "" : storedVoiceURI()));

  // Read at the moment of speaking (voices load late on Android): the visitor's choice when it
  // is installed, else the best ranked voice, else none (the browser's default)
  const [device] = useState(
    () =>
      new SpeechController(
        browserSpeechEnv((): VoiceLike | null => {
          const list = availableVoices();
          return list.find((v) => v.voiceURI === storedVoiceURI()) || list[0] || null;
        })
      )
  );
  const [cloudCtrl] = useState(() => new CloudSpeechController(browserCloudSpeechEnv()));
  const dState = useSyncExternalStore(device.subscribe, device.getState, device.getState);
  const cState = useSyncExternalStore(cloudCtrl.subscribe, cloudCtrl.getState, cloudCtrl.getState);
  // silent from the moment a reply is requested until it has ended, been stopped or failed
  useBackgroundHold(device, speechActive);
  useBackgroundHold(cloudCtrl, speechActive);
  useEffect(
    () => () => {
      device.dispose();
      cloudCtrl.dispose();
    },
    [device, cloudCtrl]
  );

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

  const useCloud = cloud && audioSupported;
  const speak = useCallback(
    (id: string, text: string) => {
      if (useCloud) {
        device.stop();
        cloudCtrl.speak(id, text);
      } else {
        cloudCtrl.stop();
        device.speak(id, text);
      }
    },
    [useCloud, device, cloudCtrl]
  );
  const stop = useCallback(() => {
    device.stop();
    cloudCtrl.stop();
  }, [device, cloudCtrl]);
  const toggle = useCallback(
    (id: string, text: string) => {
      const active = (cloudCtrl.getState().phase !== "idle" && cloudCtrl.getState().id === id) || (device.getState().phase !== "idle" && device.getState().id === id);
      if (active) stop();
      else speak(id, text);
    },
    [cloudCtrl, device, speak, stop]
  );
  /** The visitor's explicit choice after a cloud failure: read this reply with the device voice */
  const speakWithDevice = useCallback(
    (id: string, text: string) => {
      cloudCtrl.stop();
      cloudCtrl.clearError();
      device.speak(id, text);
    },
    [cloudCtrl, device]
  );
  const prime = useCallback(() => {
    if (useCloud) cloudCtrl.unlock();
    else device.prime();
  }, [useCloud, cloudCtrl, device]);
  const clearError = useCallback(() => {
    device.clearError();
    cloudCtrl.clearError();
  }, [device, cloudCtrl]);

  const activeVoice = voices.find((v) => v.voiceURI === voiceURI) || voices[0] || null;
  const active = cState.phase !== "idle" ? cState : dState.phase !== "idle" ? dState : null;

  return {
    /** Spoken replies can be offered at all */
    supported: useCloud || deviceSupported,
    /** Which voice Listen uses */
    provider: (useCloud ? "cloud" : "device") as "cloud" | "device",
    phase: active?.phase ?? "idle",
    activeId: active ? active.id : null,
    pendingId: active?.phase === "preparing" ? active.id : null,
    speakingId: active?.phase === "playing" ? active.id : null,
    error: cState.error || dState.error,
    errorCode: cState.errorCode,
    /** A reply whose cloud speech failed and that the device voice could read instead */
    deviceFallbackId: deviceSupported && cState.failedId && cState.errorCode !== "empty" ? cState.failedId : null,
    // the device voice list is only relevant when the device voice is the one in use
    voices: useCloud ? [] : voices,
    voiceURI,
    activeVoice,
    setVoiceURI,
    speak,
    toggle,
    stop,
    prime,
    speakWithDevice,
    clearError,
  };
}
