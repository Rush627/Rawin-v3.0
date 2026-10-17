"use client";

import { createContext, useContext, useSyncExternalStore, type ReactNode } from "react";

/** What the administrator allows the public site to play (CMS global settings). */
export interface SoundAvailability {
  background: boolean;
  click: boolean;
}

/**
 * The latest saved settings read from the server while the page is open (AvailabilityWatcher
 * polls /api/availability, and re-reads at once when Studio announces a save in this browser).
 * Once known, they win over the values the page was rendered with: a statically rendered page
 * can be older than the last save.
 */
let live: SoundAvailability | null = null;
const listeners = new Set<() => void>();

export function publishSoundSettings(next: SoundAvailability) {
  if (live && live.background === next.background && live.click === next.click) return;
  live = { background: next.background, click: next.click };
  listeners.forEach((fn) => fn());
}

const subscribe = (fn: () => void) => {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
};
const getLive = () => live;
const getServerLive = () => null;

const ALL_ON: SoundAvailability = { background: true, click: true };
const SoundSettingsContext = createContext<SoundAvailability | null>(null);

/**
 * Carries the CMS sound settings to the sound control and the audio wiring: the values the page
 * was rendered with, replaced by the live ones as soon as the page has read them.
 */
export function SoundSettingsProvider({ value, children }: { value: SoundAvailability; children: ReactNode }) {
  const current = useSyncExternalStore(subscribe, getLive, getServerLive);
  return <SoundSettingsContext.Provider value={current ?? value}>{children}</SoundSettingsContext.Provider>;
}

export function useSoundSettings(): SoundAvailability {
  return useContext(SoundSettingsContext) ?? ALL_ON;
}

/** The CMS sound settings where a provider carries them, else null (unknown: e.g. the global error screen). */
export function useOptionalSoundSettings(): SoundAvailability | null {
  return useContext(SoundSettingsContext);
}
