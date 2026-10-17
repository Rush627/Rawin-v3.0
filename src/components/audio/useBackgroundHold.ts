"use client";

import { useEffect, useId } from "react";
import { getAudio } from "@/lib/audio/engine";
import { bindHold, type Observable } from "@/lib/audio/hold";

/**
 * Holds the site ambience at silence while a controller is in an "active" state (Orbit listening
 * or speaking; see lib/audio/hold.ts). The audio director only brings the level back once every
 * hold is released, and only if the CMS and the visitor's mute still allow the ambience.
 */
export function useBackgroundHold<S>(ctrl: Observable<S>, isActive: (state: S) => boolean) {
  const id = useId();
  useEffect(() => {
    const audio = getAudio();
    if (!audio) return;
    const key = `orbit${id}`;
    return bindHold(ctrl, isActive, (on) => audio.hold(key, on));
    // isActive is a module-level predicate at every call site
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ctrl, id]);
}
