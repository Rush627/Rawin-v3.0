"use client";

import { getAudio } from "@/lib/audio/engine";
import { soundControlVisible } from "@/lib/audio/policy";
import { useAudioState } from "./useAudioState";
import { useSoundSettings } from "./SoundSettings";
import "./sound-toggle.css";

const BARS = [0.45, 0.85, 0.6, 1, 0.5];

/**
 * The site's sound switch: five fine bars that move while sound is audible, rest half-raised
 * while the browser has not yet allowed audio, and lie flat with a strike when muted. The state
 * is also spoken (aria-pressed and the label) and drawn, never colour alone. Not rendered at all
 * when the CMS allows neither sound (no empty slot is left in the header).
 */
export default function SoundToggle({ className = "" }: { className?: string }) {
  const available = useSoundSettings();
  const { enabled, status } = useAudioState();
  if (!soundControlVisible(available)) return null;

  const state = !enabled ? "muted" : status === "live" ? "live" : "armed";

  return (
    <button
      type="button"
      onClick={() => {
        const audio = getAudio();
        if (!audio) return;
        const next = !enabled;
        audio.setEnabled(next);
        if (next) audio.click();
      }}
      aria-pressed={enabled}
      aria-label={enabled ? "Mute site sound" : "Turn site sound on"}
      title={!enabled ? "Sound off" : state === "live" ? "Sound on" : "Sound on (starts on your next click, tap or key press)"}
      data-state={state}
      data-sound="none"
      className={`sound-toggle relative inline-flex items-center justify-center min-h-11 min-w-11 rounded-full text-fg touch-manipulation ${className}`}
    >
      <span aria-hidden="true" className="sound-toggle-bars">
        {BARS.map((h, i) => (
          <span key={i} style={{ "--h": h, "--i": i } as React.CSSProperties} />
        ))}
      </span>
      <span aria-hidden="true" className="sound-toggle-strike" />
    </button>
  );
}
