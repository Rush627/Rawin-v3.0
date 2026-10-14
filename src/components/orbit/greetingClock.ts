"use client";

import { useSyncExternalStore } from "react";
import { greetingFor, msUntilNextPeriod, periodAt, type GreetingCopy, type GreetingPeriod } from "@/lib/orbit-greeting";

/**
 * The visitor's greeting period, as an external store shared by Orbit's welcome and the
 * homepage invitation: null while server-rendering and hydrating (the server cannot know the
 * visitor's clock), the local period afterwards. It changes at the next period boundary, but
 * never while it is held (someone is typing or a conversation is open); a held change is
 * applied once the hold is released.
 */
export const greetingClock = (() => {
  let current: GreetingPeriod | null = null;
  let hold = false;
  let pending = false;
  let timer = 0;
  const subs = new Set<() => void>();
  const emit = () => subs.forEach((fn) => fn());
  const schedule = () => {
    window.clearTimeout(timer);
    timer = window.setTimeout(() => {
      const next = periodAt(new Date());
      if (next !== current) {
        if (hold) pending = true;
        else {
          current = next;
          emit();
        }
      }
      schedule();
    }, msUntilNextPeriod(new Date()) + 500);
  };
  return {
    subscribe(fn: () => void) {
      if (!subs.size) {
        current = periodAt(new Date());
        schedule();
      }
      subs.add(fn);
      return () => {
        subs.delete(fn);
        if (!subs.size) window.clearTimeout(timer);
      };
    },
    snapshot: () => current,
    serverSnapshot: () => null,
    setHold(next: boolean) {
      hold = next;
      if (!next && pending) {
        pending = false;
        current = periodAt(new Date());
        emit();
      }
    },
    /** a new welcome session (after "New session") re-reads the clock */
    refresh() {
      const next = periodAt(new Date());
      if (next !== current) {
        current = next;
        emit();
      }
    },
  };
})();

/** The CMS greeting for the visitor's local time; "" until the client clock is known. */
export function useLocalGreeting(copy: GreetingCopy | undefined) {
  const period = useSyncExternalStore(greetingClock.subscribe, greetingClock.snapshot, greetingClock.serverSnapshot);
  return period ? greetingFor(period, copy || {}) : "";
}
