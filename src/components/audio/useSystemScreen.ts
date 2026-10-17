"use client";

import { useEffect, useLayoutEffect } from "react";
import { getAudio } from "@/lib/audio/engine";
import { attachInterfaceClicks } from "@/lib/audio/clicks";
import { claimSystemScreen } from "@/lib/system-screen";
import { useOptionalSoundSettings } from "./SoundSettings";

/**
 * A system screen's part in the shared sound and startup rules (RawinErrorView calls it):
 *   - claims the system-screen signal for as long as it is mounted. A layout effect, so it is in
 *     place before any passive effect of the same commit (the public site's audio wiring, the
 *     startup overlay) can start anything;
 *   - keeps interface clicks working where the public site's wiring is not mounted (the
 *     maintenance, not-found and error screens replace it), following the CMS click setting. The
 *     listener is shared, so an overlay above a public page still clicks once per activation.
 *     Where the settings are unknown (the global error screen has no provider) no clicks are
 *     added.
 */
export function useSystemScreen() {
  const settings = useOptionalSoundSettings();
  const known = settings !== null;
  const background = settings?.background ?? false;
  const click = settings?.click ?? false;

  useLayoutEffect(() => claimSystemScreen(), []);

  useEffect(() => {
    if (!known) return;
    getAudio()?.setAvailable({ background, click });
  }, [known, background, click]);

  useEffect(() => {
    if (!known) return;
    const audio = getAudio();
    if (!audio) return;
    audio.install();
    return attachInterfaceClicks(audio);
  }, [known]);
}
