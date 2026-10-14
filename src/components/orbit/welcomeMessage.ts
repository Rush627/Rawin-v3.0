"use client";

import { useCallback, useSyncExternalStore } from "react";
import { pickWelcome } from "@/lib/orbit-welcome";

/** The last message this tab showed (sessionStorage: per tab, gone when it closes). */
const LAST_KEY = "rawin-orbit-welcome-last";

/**
 * The random welcome message, as an external store: null while server-rendering and
 * hydrating (so server and client markup agree), one fresh pick per visit afterwards.
 * A visit starts when the first reader mounts and ends when the last unmounts, so a
 * refresh, a new tab or coming back from another page all draw again; re-renders, typing,
 * theme changes and uploads never do. refresh() draws again for a new empty session.
 */
export const welcomeMessage = (() => {
  let current: string | null = null;
  let messages: readonly string[] = [];
  const subs = new Set<() => void>();
  const draw = () => {
    let last: string | null = null;
    try {
      last = window.sessionStorage.getItem(LAST_KEY);
    } catch {}
    current = pickWelcome(messages, last);
    try {
      window.sessionStorage.setItem(LAST_KEY, current);
    } catch {}
  };
  return {
    subscribe(fn: () => void, list: readonly string[]) {
      messages = list;
      if (current === null) draw();
      subs.add(fn);
      return () => {
        subs.delete(fn);
        // the visit is over: the next reader draws afresh
        if (!subs.size) current = null;
      };
    },
    snapshot: () => current,
    serverSnapshot: () => null,
    refresh() {
      draw();
      subs.forEach((fn) => fn());
    },
  };
})();

/** This visit's welcome message from `messages`; null until the client has drawn one. */
export function useWelcomeMessage(messages: readonly string[] | undefined) {
  const list = messages ?? [];
  const key = list.join("\n");
  // eslint-disable-next-line react-hooks/exhaustive-deps -- re-subscribe only when the wording changes
  const subscribe = useCallback((fn: () => void) => welcomeMessage.subscribe(fn, list), [key]);
  return useSyncExternalStore(subscribe, welcomeMessage.snapshot, welcomeMessage.serverSnapshot);
}
