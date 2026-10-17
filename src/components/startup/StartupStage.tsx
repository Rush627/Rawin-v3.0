"use client";

import { useEffect, useState } from "react";
import { AWAKENING_DONE_KEY, recordDoneEvent, startupPlan } from "@/lib/startup/launch";
import { STARTUP_REVEAL_EVENT, takeOverStartupGuard } from "@/lib/startup/boot-script";
import { SYSTEM_SCREEN_ATTR, subscribeSystemScreen, systemScreenActive } from "@/lib/system-screen";
import FutureSystem from "./FutureSystem";
import type { StartupEnd, StartupLayout } from "./clock";
import "./startup.css";

interface Live {
  choice: "supernova" | "awakening";
  layout: StartupLayout;
  reduced: boolean;
  eventId: string | null;
}

/**
 * The startup coordinator's in-page half, in the root layout so it covers the first paint and
 * outlives route changes (client navigation never replays a startup: only the pre-paint boot
 * script decides, once per page load). It plays what the boot script chose (html[data-startup])
 * and writes completion records only here, only after the animation ends:
 *   - Supernova finished: the event id is stored for this browser (localStorage); a skip, a
 *     crash or a reload mid-way stores nothing, so the launch shows again next time;
 *   - any Supernova end, or Signal Awakening finished or skipped: Signal Awakening is marked
 *     done for this session, so the two never play back to back.
 * A system screen (maintenance, offline, not found, an error; lib/system-screen.ts) is never
 * covered: if one is present when this mounts, or appears while a startup plays, the startup
 * stands down at once and records nothing, so both startups stay owed for a normal page.
 * The server markup is a plain cover (the Future System ground) shown by CSS only when the boot script set html[data-startup]; a CSS fail-safe
 * and the boot script's own timer remove it even if this component never runs. When this runs it
 * takes the fail-safe over (html[data-startup-live]): the boot guard is cancelled and a new one is
 * timed from now, so a late hydration on a first visit never skips or cuts the startup.
 */
export default function StartupStage({ title, subtitle, durationS, logo }: { title: string; subtitle: string; durationS: number; logo?: { url: string; alt?: string } | null }) {
  const [live, setLive] = useState<Live | null>(null);
  const [gone, setGone] = useState(false);

  useEffect(() => {
    const d = document.documentElement;
    const choice = d.getAttribute("data-startup");
    // withdrawn for a system screen: reveal the page and leave the records untouched
    const standDown = () => {
      if (d.getAttribute("data-startup-phase") === "play") {
        d.setAttribute("data-startup-phase", "done");
        window.dispatchEvent(new Event(STARTUP_REVEAL_EVENT));
      }
      requestAnimationFrame(() => setGone(true));
    };
    if ((choice !== "supernova" && choice !== "awakening") || d.getAttribute("data-startup-phase") === "done") {
      requestAnimationFrame(() => setGone(true));
      return;
    }
    if (systemScreenActive() || d.hasAttribute(SYSTEM_SCREEN_ATTR)) {
      standDown();
      return;
    }
    const offScreen = subscribeSystemScreen(() => {
      if (systemScreenActive()) standDown();
    });
    const layout: StartupLayout = d.getAttribute("data-startup-layout") === "mobile" ? "mobile" : "desktop";
    const reduced = d.getAttribute("data-startup-reduced") === "true";
    // the app is running: the boot guard (timed from <head>) gives way to one timed from the
    // animation's start, so hydration time is never taken out of the startup
    const releaseGuard = takeOverStartupGuard(d, window, startupPlan(choice, durationS, layout === "mobile", reduced).totalMs);
    requestAnimationFrame(() => setLive({ choice, layout, reduced, eventId: d.getAttribute("data-startup-event") }));
    // the boot script's fail-safe ended the phase (e.g. this tab was frozen): stand down
    const mo = new MutationObserver(() => {
      if (d.getAttribute("data-startup-phase") === "done") setGone(true);
    });
    mo.observe(d, { attributes: true, attributeFilter: ["data-startup-phase"] });
    return () => {
      releaseGuard();
      mo.disconnect();
      offScreen();
    };
    // the startup is decided once per page load; durationS is the server's, fixed for it
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (gone) return null;

  const reveal = () => {
    const d = document.documentElement;
    if (d.getAttribute("data-startup-phase") === "play") {
      d.setAttribute("data-startup-phase", "reveal");
      window.dispatchEvent(new Event(STARTUP_REVEAL_EVENT));
    }
  };
  const done = (how: StartupEnd) => {
    if (!live) return;
    try {
      if (live.choice === "supernova" && how === "finish" && live.eventId) recordDoneEvent(window.localStorage, live.eventId);
    } catch {
      // storage blocked: the launch may show again, never wrongly hidden
    }
    try {
      window.sessionStorage.setItem(AWAKENING_DONE_KEY, "1");
    } catch {
      // storage blocked: at worst Signal Awakening shows again on a later full load
    }
    reveal();
    document.documentElement.setAttribute("data-startup-phase", "done");
    setGone(true);
  };

  return (
    <div className="rawin-startup" data-live={live ? "true" : undefined}>
      <div className="rs-cover" aria-hidden="true" />
      {live ? (
        <FutureSystem
          mode={live.choice === "supernova" ? "launch" : "awakening"}
          layout={live.layout}
          reduced={live.reduced}
          durationS={durationS}
          title={title}
          subtitle={subtitle}
          logo={logo}
          onReveal={reveal}
          onDone={done}
        />
      ) : null}
    </div>
  );
}
