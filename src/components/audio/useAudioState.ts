"use client";

import { useEffect, useState } from "react";
import { getAudio, type AudioState } from "@/lib/audio/engine";

const INITIAL: AudioState = { enabled: true, unlocked: false, status: "waiting" };

/** Live audio state for UI. The server render (and the first client render) use INITIAL. */
export function useAudioState(): AudioState {
  const [state, setState] = useState<AudioState>(INITIAL);
  useEffect(() => {
    const audio = getAudio();
    if (!audio) return;
    audio.install();
    return audio.subscribe(setState);
  }, []);
  return state;
}
